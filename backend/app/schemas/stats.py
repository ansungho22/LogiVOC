from pydantic import BaseModel
from typing import List, Dict, Optional, Union
from uuid import UUID
from datetime import datetime

class OverviewStatsResponse(BaseModel):
    total_documents: int
    status_counts: Dict[str, int]

class CategoryStatItem(BaseModel):
    category_id: UUID
    category_name: str
    count: int

class CategoryStatsResponse(BaseModel):
    data: List[CategoryStatItem]

class ActivityItem(BaseModel):
    activity_id: Union[UUID, int, str]
    event_type: str
    document_id: UUID
    document_title: str
    user_name: str
    timestamp: datetime
    old_status: Optional[str] = None
    new_status: Optional[str] = None

class RecentActivitiesResponse(BaseModel):
    data: List[ActivityItem]
