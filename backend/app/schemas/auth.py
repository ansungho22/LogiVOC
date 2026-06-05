from pydantic import BaseModel
from ..models.user import UserRole

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    role: UserRole
