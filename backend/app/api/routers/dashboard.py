from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.exercise_session import ExerciseSession
from app.models.exercise import Exercise

router = APIRouter()

class LatestSession(BaseModel):
    exercise_name: str
    completed_reps: int
    form_score: int
    created_at: datetime

class DashboardSummaryResponse(BaseModel):
    total_sessions: int
    total_reps: int
    average_form_score: int
    latest_session: Optional[LatestSession] = None

class ProgressDataPoint(BaseModel):
    date: str
    exercise_name: str
    completed_reps: int
    form_score: int

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all sessions for the user
    sessions = db.query(ExerciseSession).filter(ExerciseSession.user_id == current_user.id).all()
    
    total_sessions = len(sessions)
    total_reps = sum(s.completed_reps or 0 for s in sessions)
    
    valid_scores = [s.form_score for s in sessions if s.form_score is not None]
    average_form_score = round(sum(valid_scores) / len(valid_scores)) if valid_scores else 0
    
    # Get latest session
    latest_db_session = (
        db.query(ExerciseSession, Exercise)
        .join(Exercise, ExerciseSession.exercise_id == Exercise.id)
        .filter(ExerciseSession.user_id == current_user.id)
        .order_by(ExerciseSession.completed_at.desc())
        .first()
    )
    
    latest_session = None
    if latest_db_session:
        session, exercise = latest_db_session
        latest_session = LatestSession(
            exercise_name=exercise.name,
            completed_reps=session.completed_reps or 0,
            form_score=session.form_score or 0,
            created_at=session.completed_at
        )
        
    return DashboardSummaryResponse(
        total_sessions=total_sessions,
        total_reps=total_reps,
        average_form_score=average_form_score,
        latest_session=latest_session
    )

@router.get("/progress", response_model=List[ProgressDataPoint])
def get_dashboard_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch sessions ordered by date
    sessions = (
        db.query(ExerciseSession, Exercise)
        .join(Exercise, ExerciseSession.exercise_id == Exercise.id)
        .filter(ExerciseSession.user_id == current_user.id)
        .order_by(ExerciseSession.completed_at.asc())
        .all()
    )
    
    progress_data = []
    for session, exercise in sessions:
        progress_data.append(
            ProgressDataPoint(
                date=session.completed_at.strftime("%Y-%m-%d"),
                exercise_name=exercise.name,
                completed_reps=session.completed_reps or 0,
                form_score=session.form_score or 0
            )
        )
        
    return progress_data
