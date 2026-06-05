from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import uuid
import os
from sqlalchemy.orm import Session
from typing import List
from .. import models
from ..core import database

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "testsecret")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        user_id = uuid.UUID(user_id_str) if user_id_str else None
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def check_role(user: models.User, allowed_roles: List[models.UserRole]):
    if user.role not in allowed_roles and user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

def get_current_operator(current_user: models.User = Depends(get_current_user)):
    check_role(current_user, [models.UserRole.OPERATOR])
    return current_user

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    check_role(current_user, [])
    return current_user
