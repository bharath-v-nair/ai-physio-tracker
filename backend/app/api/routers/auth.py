from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.api.deps import SessionDep
from app.core import security
from app.models.user import User
from app.schemas.user import UserCreate, UserInDB, Token

router = APIRouter()

@router.post("/register", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: SessionDep):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user_db = User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        age=user_in.age,
        gender=user_in.gender,
        height=user_in.height,
        weight=user_in.weight,
        rehabilitation_goal=user_in.rehabilitation_goal
    )
    db.add(user_db)
    db.commit()
    db.refresh(user_db)
    return user_db

@router.post("/login", response_model=Token)
def login(db: SessionDep, form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = security.create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}
