"""
어드민 서비스 레이어
- 대시보드 통계, 최근 활동, 사용자 관리 등의 비즈니스 로직을 담당합니다.
- 라우터(Controller)에서 직접 DB 쿼리를 하지 않도록 분리합니다.
"""
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from ..models import KnowledgeWiki, WikiStatus, User, Category
from ..schemas.admin import (
    AdminDocumentOut,
    DashboardSummaryResponse,
    RecentActivityOut,
    UserListOut,
    UserUpdateAdmin,
)


def get_documents(
    db: Session,
    page: int = 1,
    size: int = 20,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
) -> dict:
    """문서 목록 조회 (페이지네이션)"""
    query = db.query(KnowledgeWiki)
    if status:
        query = query.filter(KnowledgeWiki.status == status)
    if keyword:
        query = query.filter(KnowledgeWiki.source_file_name.ilike(f"%{keyword}%"))

    total = query.count()
    items = (
        query.order_by(KnowledgeWiki.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    docs = [
        AdminDocumentOut(
            id=item.id,
            file_name=item.source_file_name,
            uploader_id=item.author_id,
            status=item.status.value if item.status else "UNKNOWN",
            created_at=item.created_at,
        )
        for item in items
    ]
    return {"total": total, "page": page, "size": size, "items": docs}


def get_knowledge(
    db: Session,
    page: int = 1,
    size: int = 20,
    status: Optional[str] = None,
) -> dict:
    """지식 데이터 목록 조회 (페이지네이션)"""
    query = db.query(KnowledgeWiki)
    if status:
        query = query.filter(KnowledgeWiki.status == status)

    total = query.count()
    items = (
        query.order_by(KnowledgeWiki.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return {"total": total, "page": page, "size": size, "items": items}


def get_dashboard_summary(db: Session) -> DashboardSummaryResponse:
    """대시보드 요약 통계"""
    total_users = db.query(User).count()
    total_categories = db.query(Category).count()
    total_wiki_data = db.query(KnowledgeWiki).count()
    recent_drafts = (
        db.query(KnowledgeWiki)
        .filter(KnowledgeWiki.status == WikiStatus.DRAFT)
        .count()
    )
    recent_published = (
        db.query(KnowledgeWiki)
        .filter(KnowledgeWiki.status == WikiStatus.PUBLISHED)
        .count()
    )

    return DashboardSummaryResponse(
        total_users=total_users,
        total_categories=total_categories,
        total_wiki_data=total_wiki_data,
        recent_drafts_count=recent_drafts,
        recent_published_count=recent_published,
        system_health="stable",
    )


def get_recent_activities(db: Session, limit: int = 5) -> List[RecentActivityOut]:
    """최근 활동 내역"""
    items = (
        db.query(KnowledgeWiki)
        .order_by(KnowledgeWiki.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        RecentActivityOut(
            id=item.id,
            activity_type="WIKI_UPLOAD",
            description=f"{item.title or item.source_file_name or '문서'} 등록",
            created_at=item.created_at,
            user_id=item.author_id if item.author_id else uuid.uuid4(),
        )
        for item in items
    ]


def get_users(
    db: Session, skip: int = 0, limit: int = 20, search: Optional[str] = None
) -> dict:
    """사용자 목록 조회"""
    query = db.query(User)
    if search:
        query = query.filter(
            User.username.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    total = query.count()
    items = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total_count": total,
        "items": [UserListOut.model_validate(u) for u in items],
    }


def update_user(db: Session, user_id: uuid.UUID, request: UserUpdateAdmin) -> User:
    """사용자 권한 업데이트"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    if request.role is not None:
        user.role = request.role
    if request.is_active is not None:
        user.is_active = request.is_active

    db.commit()
    db.refresh(user)
    return user
