from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.models import Category
import uuid

# Recreate tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def get_auth_headers():
    response = client.post("/api/v1/auth/login", data={"username": "admin", "password": "admin"})
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    assert response.status_code == 200, response.json()
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_category_crud():
    headers = get_auth_headers()
    
    # 1. Create Category
    payload = {
        "name": "통관",
        "description": "수출입 통관 관련 카테고리"
    }
    response = client.post("/api/v1/categories", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["success"] is True
    cat_id = data["data"]["id"]
    assert data["data"]["name"] == "통관"
    assert data["data"]["description"] == "수출입 통관 관련 카테고리"
    
    # 2. Get Categories
    response = client.get("/api/v1/categories", headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["success"] is True
    assert len([c for c in data["data"] if c["id"] == cat_id]) == 1
    
    # 3. Update Category
    update_payload = {
        "name": "통관 및 관세",
        "description": "수출입 통관 및 관세 관련 카테고리"
    }
    response = client.put(f"/api/v1/categories/{cat_id}", json=update_payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "통관 및 관세"
    
    # 4. Delete Category
    response = client.delete(f"/api/v1/categories/{cat_id}", headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["success"] is True
    
    # 5. Verify Deletion
    response = client.get("/api/v1/categories", headers=headers)
    data = response.json()
    assert len([c for c in data["data"] if c["id"] == cat_id]) == 0

if __name__ == "__main__":
    test_category_crud()
    print("Category CRUD test passed!")
