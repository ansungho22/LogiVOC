from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from ... import crud, models, schemas
from ...core import database
from ..dependencies import get_current_user, get_current_admin, get_current_operator

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=dict)
def get_categories(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    cats = crud.get_categories(db)
    return {"success": True, "data": [schemas.CategoryOut.model_validate(c) for c in cats]}

@router.post("/", status_code=201)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_admin)):
    new_cat = crud.create_category(db=db, category=category)
    return {"success": True, "data": schemas.CategoryOut.model_validate(new_cat)}

@router.put("/{category_id}")
def update_category_endpoint(category_id: uuid.UUID, category: schemas.CategoryUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_admin)):
    updated = crud.update_category(db, category_id, category)
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True, "data": schemas.CategoryOut.model_validate(updated)}

@router.delete("/{category_id}")
def delete_category_endpoint(category_id: uuid.UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_admin)):
    try:
        deleted = crud.delete_category(db, category_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"success": True, "message": "카테고리가 성공적으로 삭제되었습니다."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/custom", status_code=201, response_model=schemas.CategoryOut)
def create_custom_category(category: schemas.CategoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_operator)):
    category.is_custom = True
    category.author_id = current_user.id
    new_cat = crud.create_category(db=db, category=category)
    return new_cat
