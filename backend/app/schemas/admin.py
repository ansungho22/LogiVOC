from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from .wiki import KnowledgeWikiOut
from ..models.user import UserRole

class AdminDocumentOut(BaseModel):
    id: UUID
    file_name: Optional[str] = None
    uploader_id: Optional[UUID] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminDocumentResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[AdminDocumentOut]

class AdminKnowledgeOut(KnowledgeWikiOut):
    pass

class AdminKnowledgeResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[AdminKnowledgeOut]

class DashboardSummaryResponse(BaseModel):
    total_users: int
    total_categories: int
    total_wiki_data: int
    recent_drafts_count: int
    recent_published_count: int
    system_health: str

class RecentActivityOut(BaseModel):
    id: int | UUID
    activity_type: str
    description: str
    created_at: datetime
    user_id: UUID | int

    model_config = ConfigDict(from_attributes=True)

class UserListOut(BaseModel):
    id: UUID
    username: str
    email: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserListResponse(BaseModel):
    total_count: int
    items: List[UserListOut]

class UserUpdateAdmin(BaseModel):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
