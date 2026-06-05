from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from ..models.user import UserRole

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    pass

class UserOut(UserBase):
    id: UUID
    role: UserRole
    created_at: datetime
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)
