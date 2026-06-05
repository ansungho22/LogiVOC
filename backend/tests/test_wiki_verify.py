from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
import uuid

client = TestClient(app)

# Mock user function
from app.api.dependencies import get_current_user, get_current_operator
from app.models.user import User, UserRole
import pytest

def override_get_current_user():
    user = User(id=uuid.uuid4(), username="admin", role=UserRole.ADMIN)
    return user

@pytest.fixture(autouse=True)
def override_dependencies():
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_current_operator] = override_get_current_user
    yield
    app.dependency_overrides.clear()

# Mock CRUD
from app.services import wiki_service

def test_verify_wiki_go(monkeypatch):
    wiki_id = uuid.uuid4()
    
    def mock_verify_wiki(db, wiki_id, action, content):
        if action == "go":
            return {"id": wiki_id, "status": "APPROVED", "message": "Verification completed."}
        elif action == "stop":
            return {"id": wiki_id, "status": "DRAFT", "message": "Verification completed."}
        raise ValueError("Invalid action")
        
    monkeypatch.setattr(wiki_service, "verify_wiki", mock_verify_wiki)
    
    response = client.post(
        f"/api/v1/wiki/{wiki_id}/verify",
        json={"action": "go"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["id"] == str(wiki_id)

def test_verify_wiki_stop(monkeypatch):
    wiki_id = uuid.uuid4()
    
    def mock_verify_wiki(db, wiki_id, action, content):
        return {"id": wiki_id, "status": "DRAFT", "message": "Verification completed."}
        
    monkeypatch.setattr(wiki_service, "verify_wiki", mock_verify_wiki)
    
    response = client.post(
        f"/api/v1/wiki/{wiki_id}/verify",
        json={"action": "stop", "content": "Revised content based on feedback"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "DRAFT"
    assert data["id"] == str(wiki_id)
