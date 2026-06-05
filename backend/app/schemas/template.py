from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class PromptTemplateBase(BaseModel):
    title: str
    content: str
    is_public: bool = False

class PromptTemplateCreate(PromptTemplateBase):
    pass

class PromptTemplateOut(PromptTemplateBase):
    id: UUID
    author_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
