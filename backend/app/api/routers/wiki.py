"""
Wiki 라우터 (Controller 레이어)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from ... import models, schemas
from ...core import database
from ...crud import crud_wiki
from ..dependencies import get_current_user, get_current_operator
from ...services import wiki_service

router = APIRouter(prefix="/wiki", tags=["wiki"])

@router.post("/", response_model=schemas.KnowledgeWikiOut)
def create_wiki(wiki: schemas.KnowledgeWikiCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_operator)):
    return wiki_service.create_wiki_with_embedding(db=db, wiki=wiki, author_id=current_user.id)

@router.get("/", response_model=List[schemas.KnowledgeWikiOut])
def get_all_wikis(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return crud_wiki.get_all_wikis(db, skip=skip, limit=limit)

@router.get("/{wiki_id}", response_model=schemas.KnowledgeWikiOut)
def get_wiki(wiki_id: uuid.UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    wiki = crud_wiki.get_wiki(db, wiki_id=wiki_id)
    if not wiki:
        raise HTTPException(status_code=404, detail="Wiki not found")
    return wiki

@router.delete("/{wiki_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wiki(wiki_id: uuid.UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    wiki = crud_wiki.get_wiki(db, wiki_id=wiki_id)
    if not wiki:
        raise HTTPException(status_code=404, detail="Wiki not found")
    if wiki.author_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this wiki")
    crud_wiki.delete_wiki(db, wiki_id=wiki_id)
    return None

@router.put("/{wiki_id}", response_model=schemas.KnowledgeWikiOut)
def update_wiki(wiki_id: uuid.UUID, request: schemas.KnowledgeWikiUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    wiki = crud_wiki.get_wiki(db, wiki_id)
    if not wiki:
        raise HTTPException(status_code=404, detail="Wiki not found")
        
    if wiki.author_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions to edit this wiki")
        
    updated_wiki = wiki_service.update_wiki_with_embedding(db, wiki_id, request)
    return updated_wiki

@router.post("/{wiki_id}/verify", response_model=schemas.WikiVerifyResponse)
def verify_wiki(wiki_id: uuid.UUID, request: schemas.WikiVerifyRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_operator)):
    try:
        result = wiki_service.verify_wiki(
            db=db,
            wiki_id=wiki_id,
            action=request.action,
            content=request.content
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if not result:
        raise HTTPException(status_code=404, detail="Wiki not found")
        
    return {
        "id": result["id"],
        "status": result["status"],
        "message": "Verification completed."
    }
