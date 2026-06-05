import pytest
import os
import uuid
from unittest.mock import patch
from app.worker.celery_app import process_document_task
from app.core.database import SessionLocal
from app.models import KnowledgeWiki

@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()

from app.pipeline.state import CleanseOutput
from unittest.mock import MagicMock

from langchain_core.runnables import RunnableSequence

@patch("app.services.document_parser.parse_document")
@patch.object(RunnableSequence, "invoke")
def test_pipeline_structure_route(mock_invoke, mock_parse, db_session):
    # Mock parse_document to return structured text
    mock_parse.return_value = {
        "text": "name,age\nAlice,30\nBob,25\nAlice,30\n",
        "tables": []
    }
    
    # Mock LLM CleanseOutput for RunnableSequence
    mock_invoke.return_value = CleanseOutput(
        records=[
            {"name": "Alice", "age": 30},
            {"name": "Bob", "age": 25},
            {"name": "Alice", "age": 30}
        ]
    )


    # Mock data for a CSV file
    csv_content = b"name,age\nAlice,30\nBob,25\nAlice,30\n"
    csv_hex = csv_content.hex()
    
    from app.models import User, UserRole
    user = db_session.query(User).filter(User.username == "admin").first()
    if not user:
        user = User(username="admin", role=UserRole.ADMIN)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
    author_id_str = str(user.id)
    
    os.environ["CELERY_TASK_ALWAYS_EAGER"] = "True"
    
    # Process
    result = process_document_task(
        file_content_hex=csv_hex,
        filename="test_data.csv",
        category_id_str=None,
        author_id_str=author_id_str,
        user_custom_prompt="Please extract data"
    )
    
    assert result["status"] == "COMPLETED"
    wiki_id = result.get("result_wiki_id")
    assert wiki_id is not None
    
    # Retrieve from DB to check if structured data is set
    wiki = db_session.query(KnowledgeWiki).filter(KnowledgeWiki.id == uuid.UUID(wiki_id)).first()
    assert wiki is not None
    
    print("Wiki Title:", wiki.title)
    print("Wiki Content:", wiki.content)
    print("Wiki Structured Data:", wiki.structured_data)
    
    assert wiki.structured_data is not None
    assert "Alice" in wiki.structured_data
    assert "Bob" in wiki.structured_data
    
    import json
    data = json.loads(wiki.structured_data)
    # Check if duplicate is merged correctly
    alice_row = next((r for r in data if r.get('name') == 'Alice'), None)
    assert alice_row is not None
    assert alice_row.get('count') == 2 or alice_row.get('count') == '2'
    
    # Cleanup
    db_session.delete(wiki)
    db_session.commit()
