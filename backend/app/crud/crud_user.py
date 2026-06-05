from sqlalchemy.orm import Session
from ..models.user import User, UserRole
import hashlib

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(db: Session, username: str, password: str, role: UserRole = UserRole.VIEWER):
    hashed_password = get_password_hash(password)
    db_user = User(username=username, hashed_password=hashed_password, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
