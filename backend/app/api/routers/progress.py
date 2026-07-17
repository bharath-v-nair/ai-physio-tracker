from typing import List
from fastapi import APIRouter, status
from app.api.deps import SessionDep, CurrentUser
from app.schemas.progress import ProgressCreate, ProgressInDB
from app.models.progress import Progress

router = APIRouter()

@router.post("", response_model=ProgressInDB, status_code=status.HTTP_201_CREATED)
def record_progress(progress_in: ProgressCreate, db: SessionDep, current_user: CurrentUser):
    progress_db = Progress(
        user_id=current_user.id,
        assessment_id=progress_in.assessment_id,
        improvement_percentage=progress_in.improvement_percentage
    )
    db.add(progress_db)
    db.commit()
    db.refresh(progress_db)
    return progress_db

@router.get("", response_model=List[ProgressInDB])
def get_progress(db: SessionDep, current_user: CurrentUser):
    return db.query(Progress).filter(Progress.user_id == current_user.id).order_by(Progress.created_at.asc()).all()
