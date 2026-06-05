import os
import uuid
from celery import Celery
from app.core.database import SessionLocal
from app.models import Category, KnowledgeWiki, WikiStatus, User, UserRole
from app.crud import create_category
from app.schemas import CategoryCreate
from app.pipeline import summarization_pipeline

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "worker",
    broker=redis_url,
    backend=redis_url
)

if os.getenv("CELERY_TASK_ALWAYS_EAGER") == "True":
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True


@celery_app.task(name="app.worker.celery_app.process_document_task", bind=True, soft_time_limit=60, time_limit=90)
def process_document_task(self, file_content_hex: str, filename: str, category_id_str: str | None, author_id_str: str, user_custom_prompt: str | None = None):
    # Using hex string for file content since celery tasks need serializable arguments
    file_content = bytes.fromhex(file_content_hex)
    task_id_str = self.request.id
    
    import tempfile
    # Save to temp file securely
    ext = os.path.splitext(filename)[1]
    fd, temp_file_path = tempfile.mkstemp(suffix=ext, prefix=f"{task_id_str}_upload")
    with os.fdopen(fd, "wb") as f:
        f.write(file_content)
        
    db = SessionLocal()
    custom_prompt = None
    
    try:
        if category_id_str:
            cat = db.query(Category).filter(Category.id == uuid.UUID(category_id_str)).first()
            if cat and cat.custom_prompt:
                custom_prompt = cat.custom_prompt
        else:
            cat = db.query(Category).first()
            if not cat:
                cat = create_category(db, CategoryCreate(name="Default", level=1))
            category_id_str = str(cat.id)
            
        initial_state = {
            "file_path": temp_file_path,
            "filename": filename,
            "category_id": category_id_str,
            "author_id": author_id_str,
            "custom_prompt": custom_prompt,
            "user_custom_prompt": user_custom_prompt,
            "extracted_text": "",
            "chunks": [],
            "current_chunk_index": 0,
            "summary": "",
            "correction_feedback": "",
            "is_valid": False,
            "retry_count": 0,
            "wiki_id": None
        }
        
        final_state = summarization_pipeline.invoke(initial_state)
        
        if final_state.get("wiki_id"):
            result = {"status": "COMPLETED", "result_wiki_id": str(final_state["wiki_id"])}
        else:
            result = {"status": "FAILED", "error": "No wiki_id returned from pipeline."}
            
    except Exception as e:
        # Fallback Policy: 외부 API/네트워크 예외 시 기본값(Default) 카테고리로 매핑하여 안전하게 DRAFT 생성
        try:
            default_cat = db.query(Category).filter(Category.name == "Default").first()
            if not default_cat:
                default_cat = create_category(db, CategoryCreate(name="Default", level=1))
            
            wiki = KnowledgeWiki(
                category_id=default_cat.id,
                author_id=uuid.UUID(author_id_str) if author_id_str else None,
                title=f"문서 처리 실패 (Fallback): {filename}",
                content=f"AI 문서 파이프라인 처리 중 오류가 발생하여 안전하게 Fallback 되었습니다.\n원본 파일명: {filename}\n오류 상세: {str(e)}",
                embedding=None,
                status=WikiStatus.DRAFT,
                source_file_name=filename,
                custom_prompt_used=user_custom_prompt
            )
            db.add(wiki)
            db.commit()
            db.refresh(wiki)
            result = {"status": "COMPLETED", "result_wiki_id": str(wiki.id)}
        except Exception as fallback_e:
            result = {"status": "FAILED", "error": f"Primary Error: {str(e)}, Fallback Error: {str(fallback_e)}"}
    finally:
        db.close()
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
    return result
