import os
import re
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from celery.result import AsyncResult
from ... import crud, models, schemas
from ...core import database
from ..dependencies import get_current_user, get_current_operator
from ...core.rate_limit import limiter
from ...worker.celery_app import celery_app, process_document_task

router = APIRouter(tags=["tasks"])

@router.post("/files/upload", response_model=schemas.FileUploadResponse)
@limiter.limit("10/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    category_id: uuid.UUID = Form(None),
    custom_prompt: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_operator)
):
    if custom_prompt:
        if len(custom_prompt) > 500:
            raise HTTPException(status_code=400, detail="Custom prompt too long (max 500 chars)")
        if re.search(r"[<>{}\[\]\\]", custom_prompt):
            raise HTTPException(status_code=400, detail="Special characters are not allowed in custom prompt")
        injection_pattern = re.compile(r"(system\s*prompt|ignore\s*previous\s*instructions|jailbreak|bypass|you\s*are\s*now)", re.IGNORECASE)
        if injection_pattern.search(custom_prompt):
            raise HTTPException(status_code=400, detail="Prompt injection detected")

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Payload Too Large (Max 5MB)")

    file_content = await file.read()
    
    task = process_document_task.delay(
        file_content.hex(),
        file.filename,
        str(category_id) if category_id else None,
        str(current_user.id),
        custom_prompt
    )
    
    return {"task_id": uuid.UUID(task.id), "message": "AI 파이프라인 시작됨. 상태를 폴링하세요."}

@router.get("/tasks/{task_id}", response_model=schemas.TaskStatusResponse)
def get_task_status(task_id: uuid.UUID, current_user: models.User = Depends(get_current_user)):
    if os.getenv("CELERY_TASK_ALWAYS_EAGER") == "True":
        db = next(database.get_db())
        latest_wiki = db.query(models.KnowledgeWiki).filter(
            models.KnowledgeWiki.author_id == current_user.id,
            models.KnowledgeWiki.status == models.WikiStatus.DRAFT
        ).order_by(models.KnowledgeWiki.created_at.desc()).first()
        
        return {
            "task_id": task_id,
            "status": "COMPLETED",
            "result_wiki_id": latest_wiki.id if latest_wiki else None
        }

    task_result = AsyncResult(str(task_id), app=celery_app)
    
    status = task_result.state
    result_wiki_id = None
    
    if status == "SUCCESS":
        res = task_result.result
        if isinstance(res, dict):
            status = res.get("status", "COMPLETED")
            result_wiki_id = res.get("result_wiki_id")
            
            if result_wiki_id:
                result_wiki_id = uuid.UUID(result_wiki_id)
                
    elif status == "FAILURE":
        status = "FAILED"
        
    return {
        "task_id": task_id,
        "status": status,
        "result_wiki_id": result_wiki_id
    }
