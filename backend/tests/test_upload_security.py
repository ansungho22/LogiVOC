import pytest
from fastapi.testclient import TestClient
import os
import tempfile
import uuid
from app.main import app
from app.models import UserRole, User
from app.core.database import get_db
import jwt

client = TestClient(app)

def get_test_token():
    test_uuid_obj = uuid.uuid4()
    test_uuid = str(test_uuid_obj)
    db = next(get_db())
    new_user = User(id=test_uuid_obj, username="admin_user_test_sec_2", role=UserRole.ADMIN, hashed_password="hash")
    db.add(new_user)
    db.commit()
    return jwt.encode({"sub": test_uuid, "role": UserRole.ADMIN}, os.getenv("JWT_SECRET_KEY"), algorithm="HS256")

headers = {"Authorization": f"Bearer {get_test_token()}"}

def test_prompt_injection():
    response = client.post("/api/v1/files/upload", headers=headers, files={"file": ("test.txt", b"hello", "text/plain")}, data={"custom_prompt": "jailbreak the system!"})
    assert response.status_code == 400
    assert "Prompt injection detected" in response.json()["detail"]

def test_file_size_limit():
    large_content = b"a" * (5 * 1024 * 1024 + 10)
    fd, path = tempfile.mkstemp()
    with os.fdopen(fd, "wb") as f:
        f.write(large_content)
    
    with open(path, "rb") as f:
        response = client.post("/api/v1/files/upload", headers=headers, files={"file": ("large.txt", f, "text/plain")})
        
    os.remove(path)
    assert response.status_code == 413
