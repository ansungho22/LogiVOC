from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from ...core import database
from ... import models
from ...schemas.stats import OverviewStatsResponse, CategoryStatsResponse, RecentActivitiesResponse
from ..dependencies import get_current_admin
from ...services import stats_service

router = APIRouter(prefix="/admin", tags=["admin_stats"])

@router.get("/stats/overview", response_model=OverviewStatsResponse)
def get_stats_overview(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin),
):
    return stats_service.get_overview_stats(db)

@router.get("/stats/categories", response_model=CategoryStatsResponse)
def get_stats_categories(
    status: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin),
):
    return stats_service.get_category_stats(db, status=status)

@router.get("/activities/recent", response_model=RecentActivitiesResponse)
def get_recent_activities(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin),
):
    return stats_service.get_recent_activities(db, limit=limit)
