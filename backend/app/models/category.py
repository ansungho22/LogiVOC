import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Uuid, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Category(Base):
    __tablename__ = "categories"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id = Column(Uuid(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String, index=True)
    level = Column(Integer, default=1)
    description = Column(String, nullable=True)
    custom_prompt = Column(String, nullable=True)
    is_custom = Column(Boolean, default=False)
    author_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    parent = relationship("Category", back_populates="children", remote_side=[id])
    children = relationship("Category", back_populates="parent")
