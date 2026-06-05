from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ... import crud, models, schemas
from ...core import database
from ..dependencies import get_current_user, get_current_admin
from ...services import wiki_service

router = APIRouter(prefix="/mcp", tags=["mcp"])

@router.get("/categories", response_model=List[schemas.CategoryOut])
def get_categories_mcp(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_categories(db)

@router.post("/categories", response_model=schemas.CategoryOut)
def create_category_mcp(category: schemas.CategoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_admin)):
    return crud.create_category(db=db, category=category)

@router.post("/wiki/search", response_model=schemas.SearchResponse)
def search_wiki(request: schemas.SearchRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    results = wiki_service.search_wiki(db, query=request.query, category_id=request.category_id)
    return {"results": results}

@router.post("/analyze/log-segment")
def analyze_log(log_data: dict, current_user: models.User = Depends(get_current_user)):
    return {
        "error_summary": "Timeout error in payment module",
        "matched_knowledge": [],
        "recommended_action": "Check database connection pool limits."
    }
