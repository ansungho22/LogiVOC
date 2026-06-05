import os
import uuid
import json
import pandas as pd
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import KnowledgeWiki, User, UserRole, WikiStatus
from app.pipeline.state import PipelineState, SummaryOutput, SelfCorrectOutput, RouterOutput, CleanseOutput

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

def extract_text_node(state: PipelineState) -> dict:
    """MVP: Extract Text (mocking Azure DI for now using document_parser)"""
    from app.services.document_parser import parse_document
    file_path = state.get("file_path", "")
    filename = state.get("filename", "")
    
    text = ""
    tables_info = ""
    try:
        if os.path.exists(file_path):
            if filename.lower().endswith(('.csv', '.xlsx', '.xls')):
                # Use pandas directly to prevent Azure DI context window issues or failures
                if filename.lower().endswith('.csv'):
                    df = pd.read_csv(file_path)
                else:
                    df = pd.read_excel(file_path)
                text = df.to_json(orient='records', force_ascii=False)
            else:
                with open(file_path, "rb") as f:
                    file_content = f.read()
                
                parsed_data = parse_document(file_content, filename)
                text = parsed_data.get("text", "")
                tables = parsed_data.get("tables", [])
                
                if tables:
                    tables_info = f"\n\nExtracted {len(tables)} tables:\n"
                    for t in tables:
                        tables_info += f"- Table {t.get('table_id')}: {t.get('cells')}\n"
                        
                text += tables_info
        else:
            text = f"Mock extracted text from {file_path} (File not found locally)"
    except Exception as e:
        text = f"Error reading file: {str(e)}"
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
            
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
    chunks = text_splitter.split_text(text)
    if not chunks:
        chunks = [""]
        
    return {
        "extracted_text": text,
        "chunks": chunks,
        "current_chunk_index": 0,
        "title": "",
        "summary": ""
    }

def apply_custom_prompt_node(state: PipelineState) -> dict:
    """Apply Custom Prompt - Refine Loop"""
    chunks = state.get("chunks", [""])
    current_chunk_index = state.get("current_chunk_index", 0)
    current_chunk = chunks[current_chunk_index]
    
    custom_prompt = state.get("custom_prompt")
    user_custom_prompt = state.get("user_custom_prompt")
    feedback = state.get("correction_feedback")
    existing_summary = state.get("summary", "")
    existing_title = state.get("title", "")
    
    system_instruction_base = (
        "You are an expert IT Operations document analyzer. "
        "REGARDLESS OF THE ORIGINAL LANGUAGE OF THE DOCUMENT, ALL SUMMARIES, EXTRACTED INFORMATION, AND TITLES MUST BE 100% WRITTEN/TRANSLATED IN KOREAN (한국어). NEVER output in English or any other language.\\n"
        "Based on the content of the document, generate a concise and descriptive title STRICTLY IN KOREAN that summarizes the main issue or topic. DO NOT use the original filename or UUID. The title MUST BE 100% KOREAN regardless of the document's original language.\\n"
    )

    if user_custom_prompt:
        system_instruction_base += f"\\n\\n[USER CUSTOM INSTRUCTION (PRIORITY)]\\n{user_custom_prompt}\\n[/USER CUSTOM INSTRUCTION]\\n\\n"

    system_instruction_suffix = (
        "\\n\\nCRITICAL RULE: REGARDLESS OF THE ORIGINAL LANGUAGE OF THE DOCUMENT, ALL SUMMARIES, EXTRACTED INFORMATION, AND TITLES MUST BE 100% WRITTEN/TRANSLATED IN KOREAN (한국어). NEVER output in English or any other language."
    )

    eval_llm = llm.with_structured_output(SummaryOutput)
    
    if feedback:
        system_instruction = system_instruction_base + "You are an assistant correcting an existing summary based on feedback." + system_instruction_suffix
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_instruction),
            ("human", "Current Title:\\n{existing_title}\\n\\nCurrent Summary:\\n{existing_summary}\\n\\nFeedback to address:\\n{feedback}\\n\\nPlease provide the corrected title and summary strictly in Korean.")
        ])
        chain = prompt | eval_llm
        response = chain.invoke({"existing_title": existing_title, "existing_summary": existing_summary, "feedback": feedback})
        return {"title": response.title, "summary": response.summary}

    if existing_summary:
        system_instruction = system_instruction_base + (
            "You are refining an existing summary with new information. "
            "Integrate the new content seamlessly into the current summary."
        )
        if custom_prompt:
            system_instruction += f"\\n\\nGuidelines: {custom_prompt}"
            
        system_instruction += system_instruction_suffix

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_instruction),
            ("human", "Current Title:\\n{existing_title}\\n\\nCurrent Summary:\\n{existing_summary}\\n\\nNew Content:\\n{text}")
        ])
        chain = prompt | eval_llm
        response = chain.invoke({"existing_title": existing_title, "existing_summary": existing_summary, "text": current_chunk})
    else:
        system_instruction = system_instruction_base + (custom_prompt or "Summarize the following operational knowledge or VOC document.")
        system_instruction += system_instruction_suffix
            
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_instruction),
            ("human", "Document content:\\n{text}")
        ])
        chain = prompt | eval_llm
        response = chain.invoke({"text": current_chunk})
    
    return {"title": response.title, "summary": response.summary}

def increment_chunk_node(state: PipelineState) -> dict:
    return {"current_chunk_index": state.get("current_chunk_index", 0) + 1}

def self_correct_node(state: PipelineState) -> dict:
    """Self-Correct"""
    summary = state.get("summary", "")
    extracted_text = state.get("extracted_text", "")
    retry_count = state.get("retry_count", 0)
    
    if retry_count >= 2:
        return {"is_valid": False, "correction_feedback": "Max retries reached."}
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a QA bot evaluating a summary of an operational document. Evaluate the summary against the original text. Check if it's concise, clear, and captures key points without hallucinations. Provide any feedback STRICTLY in Korean (한국어)."),
        ("human", "Original text:\\n{extracted_text}\\n\\nSummary to evaluate:\\n{summary}")
    ])
    
    eval_llm = llm.with_structured_output(SelfCorrectOutput)
    eval_chain = prompt | eval_llm
    
    result = eval_chain.invoke({"summary": summary, "extracted_text": extracted_text})
    
    return {
        "is_valid": result.is_valid,
        "correction_feedback": result.feedback,
        "retry_count": retry_count + 1
    }

def save_as_draft_node(state: PipelineState) -> dict:
    """Save as DRAFT"""
    db: Session = SessionLocal()
    try:
        category_id = state.get("category_id")
        author_id = state.get("author_id")
        summary = state.get("summary", "")
        title = state.get("title", "")
        file_path = state.get("file_path", "")
        
        if not author_id:
            admin_user = db.query(User).filter(User.username == "admin").first()
            if not admin_user:
                admin_user = User(username="admin", role=UserRole.ADMIN)
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
            author_id = admin_user.id
            
        if not title:
            title = f"Document: {os.path.basename(file_path)}"
            
        if author_id and isinstance(author_id, str):
            author_id = uuid.UUID(author_id)
            
        wiki = KnowledgeWiki(
            category_id=uuid.UUID(category_id) if category_id else None,
            author_id=author_id,
            title=title,
            content=summary,
            embedding=None,
            status=WikiStatus.DRAFT,
            source_file_name=state.get("filename"),
            custom_prompt_used=state.get("user_custom_prompt"),
            structured_data=state.get("structured_output_json")
        )
        
        db.add(wiki)
        db.commit()
        db.refresh(wiki)
        
        return {"wiki_id": str(wiki.id)}
    finally:
        db.close()

def router_node(state: PipelineState) -> dict:
    """Determine whether to use the summarize or structure route."""
    extracted_text = state.get("extracted_text", "")
    filename = state.get("filename", "")
    user_prompt = state.get("user_custom_prompt", "")
    
    # Simple heuristic based on extension
    if filename and filename.lower().endswith(('.csv', '.xlsx', '.xls')):
        return {"pipeline_route": "structure", "file_type": "spreadsheet"}
    
    # Or ask LLM to decide based on a sample
    sample_text = extracted_text[:1000]
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a routing assistant. Decide if the user's request and document content are better suited for a standard text summary ('summarize') or structural data extraction into a table/JSON ('structure')."),
        ("human", "Filename: {filename}\\nUser Prompt: {user_prompt}\\nSample text:\\n{sample_text}")
    ])
    
    router_llm = llm.with_structured_output(RouterOutput)
    chain = prompt | router_llm
    
    result = chain.invoke({
        "filename": filename,
        "user_prompt": user_prompt,
        "sample_text": sample_text
    })
    
    return {"pipeline_route": result.route}

def cleanse_node(state: PipelineState) -> dict:

    """Extract and normalize data from text using LLM."""
    extracted_text = state.get("extracted_text", "")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data cleansing assistant. Extract tabular or log-like data from the given text and return it as a list of dictionaries. Standardize the keys and remove unnecessary noise or irrelevant sentences. Keys should be in Korean if appropriate."),
        ("human", "Text to cleanse:\\n{text}")
    ])
    
    cleanse_llm = llm.with_structured_output(CleanseOutput)
    chain = prompt | cleanse_llm
    
    # Process the first few chunks or all if it fits
    text_to_process = extracted_text[:8000]  # Limit to avoid huge context for extraction
    
    try:
        result = chain.invoke({"text": text_to_process})
        filtered_data = result.records
    except Exception as e:
        # Fallback
        filtered_data = []
        
    return {"filtered_data": filtered_data}

def merge_node(state: PipelineState) -> dict:
    """Identify duplicates and merge them with counts using thefuzz for fuzzy matching."""
    from thefuzz import fuzz
    filtered_data = state.get("filtered_data", [])
    
    if not filtered_data:
        return {"merged_data": []}
        
    merged_groups = []
    threshold = 90  # 임계값 설정 (90% 이상)
    
    for row in filtered_data:
        # dict의 value들을 문자열로 변환하여 하나의 문자열로 결합 (키 제외)
        row_str = " ".join(str(v) for v in row.values() if v is not None)
        
        matched = False
        for group in merged_groups:
            rep_row_str = group['rep_str']
            # token_sort_ratio를 통해 단어 순서 무관하게 유사도 계산
            similarity = fuzz.token_sort_ratio(row_str, rep_row_str)
            
            if similarity >= threshold:
                group['count'] += 1
                matched = True
                break
                
        if not matched:
            new_group = dict(row)
            merged_groups.append({
                'rep_str': row_str,
                'data': new_group,
                'count': 1
            })
            
    merged_data = []
    for g in merged_groups:
        # data 원본에 count 값을 추가
        g['data']['count'] = g['count']
        merged_data.append(g['data'])
        
    return {"merged_data": merged_data}

def structure_node(state: PipelineState) -> dict:
    """Format the merged data into a structured output (JSON and Markdown Table) for saving."""
    merged_data = state.get("merged_data", [])
    filename = state.get("filename", "Structured Data")
    
    if not merged_data:
        return {
            "structured_output_json": "[]",
            "title": f"정형화 실패: {filename}",
            "summary": "추출할 수 있는 정형 데이터가 없습니다."
        }
        
    # Generate Markdown Table
    df = pd.DataFrame(merged_data)
    md_table = df.to_markdown(index=False)
    
    structured_json = json.dumps(merged_data, ensure_ascii=False, indent=2)
    
    title = f"정형 데이터 추출: {filename}"
    summary = f"다음은 원본 문서에서 추출 및 병합된 구조화 데이터입니다:\\n\\n{md_table}"
    
    return {
        "structured_output_json": structured_json,
        "title": title,
        "summary": summary
    }
