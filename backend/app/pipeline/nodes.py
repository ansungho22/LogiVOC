import os
import uuid
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import KnowledgeWiki, User, UserRole, WikiStatus
from app.pipeline.state import PipelineState, SummaryOutput, SelfCorrectOutput

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

def extract_text_node(state: PipelineState) -> dict:
    """MVP: Extract Text (mocking Azure DI for now using document_parser)"""
    from app.services.document_parser import parse_document
    file_path = state.get("file_path", "")
    
    text = ""
    tables_info = ""
    try:
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                file_content = f.read()
            
            filename = os.path.basename(file_path)
            parsed_data = parse_document(file_content, filename)
            text = parsed_data.get("text", "")
            tables = parsed_data.get("tables", [])
            
            if tables:
                tables_info = f"\\n\\nExtracted {len(tables)} tables:\\n"
                for t in tables:
                    tables_info += f"- Table {t.get('table_id')}: {t.get('rows')}\\n"
                    
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
            
        wiki = KnowledgeWiki(
            category_id=uuid.UUID(category_id) if category_id else None,
            author_id=author_id,
            title=title,
            content=summary,
            embedding=None,
            status=WikiStatus.DRAFT,
            source_file_name=state.get("filename"),
            custom_prompt_used=state.get("user_custom_prompt")
        )
        
        db.add(wiki)
        db.commit()
        db.refresh(wiki)
        
        return {"wiki_id": str(wiki.id)}
    finally:
        db.close()
