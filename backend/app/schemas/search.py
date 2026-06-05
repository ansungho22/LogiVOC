from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class SearchRequest(BaseModel):
    query: str
    category_id: Optional[UUID] = None

class SearchResultItem(BaseModel):
    wiki_id: UUID
    title: str
    similarity: float
    content_snippet: str

class SearchResponse(BaseModel):
    results: List[SearchResultItem]
