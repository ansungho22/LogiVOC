import uuid
from sqlalchemy import Column, String, Enum, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from ..core.database import Base
from sqlalchemy import Index
import enum

class WikiStatus(str, enum.Enum):
    DRAFT = 'DRAFT'
    PUBLISHED = 'PUBLISHED'

class KnowledgeWiki(Base):
    __tablename__ = "knowledge_wiki"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(Uuid(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), index=True, nullable=True)
    author_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    title = Column(String)
    content = Column(String)
    embedding = Column(Vector(1536))
    status = Column(Enum(WikiStatus), default=WikiStatus.DRAFT, index=True)
    source_file_name = Column(String, nullable=True)
    custom_prompt_used = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    category = relationship("Category")
    author = relationship("User")

Index(
    "ix_knowledge_wiki_embedding_hnsw",
    KnowledgeWiki.embedding,
    postgresql_using="hnsw",
    postgresql_with={"m": 16, "ef_construction": 64},
    postgresql_ops={"embedding": "vector_cosine_ops"}
)
