from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import get_db, engine, Base
from app import models
import pytest

client = TestClient(app)

def get_auth_headers():
    response = client.post("/api/v1/auth/login", data={"username": "admin", "password": "admin"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_search_documents_endpoint():
    # We should get a 401 if not logged in
    response = client.get("/api/v1/documents/search")
    assert response.status_code == 401
    
    # Authenticated
    headers = get_auth_headers()
    response = client.get("/api/v1/documents/search", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data

def test_stats_overview_endpoint():
    # 401 if not logged in
    response = client.get("/api/v1/admin/stats/overview")
    assert response.status_code == 401
    
    # Authenticated
    headers = get_auth_headers()
    response = client.get("/api/v1/admin/stats/overview", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_documents" in data
    assert "status_counts" in data
