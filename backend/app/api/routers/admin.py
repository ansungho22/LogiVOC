"""
어드민 라우터 (Controller 레이어)
- HTTP 요청/응답 처리만 담당합니다.
- 비즈니스 로직은 services/admin_service.py에 위임합니다.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
from ... import schemas
from ...core import database
from ..dependencies import get_current_admin
from ...services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/documents", response_model=schemas.AdminDocumentResponse)
def admin_get_documents(
    page: int = 1,
    size: int = 20,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_admin),
):
    return admin_service.get_documents(db, page=page, size=size, status=status, keyword=keyword)


@router.get("/knowledge", response_model=schemas.AdminKnowledgeResponse)
def admin_get_knowledge(
    page: int = 1,
    size: int = 20,
    status: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_admin),
):
    return admin_service.get_knowledge(db, page=page, size=size, status=status)


@router.get("/dashboard/summary", response_model=schemas.DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_admin),
):
    return admin_service.get_dashboard_summary(db)


@router.get("/dashboard/recent-activities", response_model=List[schemas.RecentActivityOut])
def get_recent_activities(
    limit: int = 5,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_admin),
):
    return admin_service.get_recent_activities(db, limit=limit)


@router.get("/users", response_model=schemas.UserListResponse)
def get_users_list(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_admin),
):
    return admin_service.get_users(db, skip=skip, limit=limit, search=search)


@router.patch("/users/{user_id}", response_model=schemas.UserListOut)
def update_user_admin(
    user_id: uuid.UUID,
    request: schemas.UserUpdateAdmin,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_admin),
):
    user = admin_service.update_user(db, user_id, request)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
