from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from ...core import database
from ... import models
from ...schemas.document import DocumentSearchResponse, DocumentDetailResponse
from ..dependencies import get_current_user
from ...services import document_service

router = APIRouter(prefix="/documents", tags=["documents"])

@router.get("/search", response_model=DocumentSearchResponse)
def search_documents(
    query: Optional[str] = None,
    category_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    is_admin = current_user.role == models.UserRole.ADMIN
    return document_service.search_documents(
        db=db,
        query=query,
        category_id=category_id,
        status=status,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit,
        is_admin=is_admin
    )

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    is_admin = current_user.role == models.UserRole.ADMIN
    doc = document_service.get_document_details(
        db=db,
        document_id=document_id,
        is_admin=is_admin,
        current_user_id=current_user.id
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or you don't have permission to view it")
    return doc
