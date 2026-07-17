from fastapi import APIRouter
from app.api.deps import SessionDep, CurrentUser
from app.schemas.user import UserInDB, UserUpdate
from app.models.user import User

router = APIRouter()

@router.get("/profile", response_model=UserInDB)
def read_user_profile(current_user: CurrentUser):
    return current_user

@router.put("/profile", response_model=UserInDB)
def update_user_profile(user_in: UserUpdate, db: SessionDep, current_user: CurrentUser):
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
