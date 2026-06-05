from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime

class CategorySimple(BaseModel):
    id: UUID
    name: str

class DocumentSearchItem(BaseModel):
    id: UUID
    title: str
    summary: str
    category: Optional[CategorySimple] = None
    status: str
    semantic_score: Optional[float] = None
    created_at: datetime

class DocumentSearchResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[DocumentSearchItem]

class DocumentDetailResponse(BaseModel):
    id: UUID
    title: str
    original_text: str
    summary: str
    structured_data: Optional[Dict[str, Any]] = None
    category: Optional[CategorySimple] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
