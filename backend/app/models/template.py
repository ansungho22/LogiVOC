import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class PromptTemplate(Base):
    __tablename__ = "prompt_templates"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title = Column(String)
    content = Column(String)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    author = relationship("User")
