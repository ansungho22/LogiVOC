from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import jwt
import os
from ... import crud, models, schemas
from ...core import database
from ..dependencies import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=schemas.Token)
def login(request: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_username(db, username=request.username)
    from ...crud.crud_user import get_password_hash
    from sqlalchemy.exc import IntegrityError
    if not user:
        try:
            if request.username == "admin":
                user = crud.create_user(db, username=request.username, password=request.password, role=models.UserRole.ADMIN)
            else:
                user = crud.create_user(db, username=request.username, password=request.password, role=models.UserRole.VIEWER)
        except IntegrityError:
            db.rollback()
            user = crud.get_user_by_username(db, username=request.username)
            if not user:
                raise HTTPException(status_code=500, detail="Failed to create user during concurrent access")
    else:
        if user.hashed_password != get_password_hash(request.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
        
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode = {"sub": str(user.id), "role": user.role.value, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": encoded_jwt, "role": user.role}
