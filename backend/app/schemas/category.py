from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    level: int = 1
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    custom_prompt: Optional[str] = None
    is_custom: bool = False
    author_id: Optional[UUID] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    level: Optional[int] = None
    parent_id: Optional[UUID] = None
    custom_prompt: Optional[str] = None

class CategoryOut(CategoryBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    children: List['CategoryOut'] = []

    model_config = ConfigDict(from_attributes=True)

CategoryOut.model_rebuild()
