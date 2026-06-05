from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid

from ..models.wiki import KnowledgeWiki, WikiStatus
from ..models.category import Category
from ..schemas.stats import (
    OverviewStatsResponse,
    CategoryStatsResponse,
    CategoryStatItem,
    RecentActivitiesResponse,
    ActivityItem
)

def get_overview_stats(db: Session) -> OverviewStatsResponse:
    total_documents = db.query(KnowledgeWiki).count()
    status_counts = {}
    
    # query status counts grouped by status
    counts = db.query(KnowledgeWiki.status, func.count(KnowledgeWiki.id)).group_by(KnowledgeWiki.status).all()
    
    # Initialize with 0 for expected statuses
    for s in [WikiStatus.PUBLISHED, WikiStatus.DRAFT]:
        status_counts[s.value] = 0
    status_counts["REJECTED"] = 0
        
    for status, count in counts:
        status_counts[status.value] = count
        
    return OverviewStatsResponse(
        total_documents=total_documents,
        status_counts=status_counts
    )

def get_category_stats(db: Session, status: str | None = None) -> CategoryStatsResponse:
    query = db.query(Category.id, Category.name, func.count(KnowledgeWiki.id))\
        .outerjoin(KnowledgeWiki, Category.id == KnowledgeWiki.category_id)
        
    if status:
        query = query.filter(KnowledgeWiki.status == status.upper())
        
    results = query.group_by(Category.id, Category.name).all()
    
    data = []
    for cat_id, cat_name, count in results:
        data.append(CategoryStatItem(
            category_id=cat_id,
            category_name=cat_name,
            count=count
        ))
        
    return CategoryStatsResponse(data=data)

def get_recent_activities(db: Session, limit: int = 10) -> RecentActivitiesResponse:
    # Since we don't have a dedicated audit/activity log table, 
    # we infer recent activities from KnowledgeWiki creations/updates.
    items = db.query(KnowledgeWiki).order_by(KnowledgeWiki.created_at.desc()).limit(limit).all()
    
    data = []
    for item in items:
        user_name = item.author.username if item.author else "system"
        data.append(ActivityItem(
            activity_id=str(item.id),
            event_type="DOCUMENT_CREATED",
            document_id=item.id,
            document_title=item.title or item.source_file_name or "Untitled",
            user_name=user_name,
            timestamp=item.created_at
        ))
        
    return RecentActivitiesResponse(data=data)
