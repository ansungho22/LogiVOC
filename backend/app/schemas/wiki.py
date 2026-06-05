from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from ..models.wiki import WikiStatus

class KnowledgeWikiBase(BaseModel):
    title: str
    content: str
    category_id: Optional[UUID] = None
    structured_data: Optional[str] = None

class KnowledgeWikiCreate(KnowledgeWikiBase):
    pass

class KnowledgeWikiUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[UUID] = None
    structured_data: Optional[str] = None

class KnowledgeWikiOut(KnowledgeWikiBase):
    id: UUID
    author_id: UUID
    status: WikiStatus
    source_file_name: Optional[str] = None
    custom_prompt_used: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class WikiVerifyRequest(BaseModel):
    action: str
    content: Optional[str] = None

class WikiVerifyResponse(BaseModel):
    id: UUID
    status: str
    message: str

class FileUploadResponse(BaseModel):
    task_id: UUID
    message: str

class TaskStatusResponse(BaseModel):
    task_id: UUID
    status: str
    result_wiki_id: Optional[UUID] = None
