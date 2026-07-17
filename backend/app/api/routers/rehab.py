from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.assessment import Assessment
from app.models.rehab_plan import RehabPlan
from app.models.exercise_session import ExerciseSession
from app.schemas.rehab import RehabPlanInDB, ExerciseSessionCreate, ExerciseSessionInDB, RecommendationRequest, RecommendationResponse
from app.services.recommendation_engine import RecommendationEngine

router = APIRouter()

@router.post("/recommendations", response_model=RecommendationResponse)
def get_recommendations(
    request: RecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns exercise recommendations based on detected issues without saving a plan.
    """
    engine = RecommendationEngine(db)
    
    issues = request.detected_issues or []
    if request.posture_issue:
        issues.append(request.posture_issue)
        
    result = engine.get_recommendations(issues, request.severity)
    return result

@router.post("/generate", response_model=RehabPlanInDB)
def generate_rehab_plan(
    assessment_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Generates a new rehab plan based on a given assessment.
    """
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id, 
        Assessment.user_id == current_user.id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    engine = RecommendationEngine(db)
    
    # Normally we might extract issues from the assessment object, but since we didn't change the model to store lists cleanly yet,
    # we'll just use the single detected_issue string for generation, or split it if it has multiple.
    issue_string = assessment.detected_issue or ""
    issues = [i.strip() for i in issue_string.split(",")] if "," in issue_string else [issue_string]
    
    new_plan = engine.generate_plan(user_id=current_user.id, assessment_id=assessment.id, detected_issues=issues)
    
    return new_plan

@router.get("/active", response_model=RehabPlanInDB)
def get_active_plan(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Fetches the user's currently active rehabilitation plan.
    """
    plan = db.query(RehabPlan).filter(
        RehabPlan.user_id == current_user.id,
        RehabPlan.status == "active"
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="No active rehab plan found")
        
    return plan

@router.post("/track", response_model=ExerciseSessionInDB)
def track_exercise(
    session_in: ExerciseSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tracks the completion (or skipping) of an exercise.
    """
    new_session = ExerciseSession(
        user_id=current_user.id,
        exercise_id=session_in.exercise_id,
        plan_id=session_in.plan_id,
        skipped=session_in.skipped,
        notes=session_in.notes
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/history", response_model=List[ExerciseSessionInDB])
def get_exercise_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Fetches the history of completed exercises for the dashboard.
    """
    sessions = db.query(ExerciseSession).filter(
        ExerciseSession.user_id == current_user.id
    ).order_by(ExerciseSession.completed_at.desc()).all()
    
    return sessions
