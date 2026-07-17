from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ExerciseBase(BaseModel):
    name: str
    body_part: str
    description: Optional[str] = None
    target_muscle: Optional[str] = None
    target_issue: Optional[str] = None
    difficulty: Optional[str] = None
    sets: Optional[int] = None
    instructions: Optional[str] = None
    common_mistakes: Optional[str] = None
    tips: Optional[str] = None
    safety_notes: Optional[str] = None

class ExerciseInDB(ExerciseBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

class PlanExerciseBase(BaseModel):
    exercise_id: int
    sets: int
    repetitions: int
    duration_seconds: Optional[int] = None

class PlanExerciseInDB(PlanExerciseBase):
    id: int
    exercise: ExerciseInDB
    class Config:
        orm_mode = True
        from_attributes = True

class RehabPlanBase(BaseModel):
    assessment_id: Optional[int] = None

class RehabPlanInDB(RehabPlanBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    exercises: List[PlanExerciseInDB] = []
    class Config:
        orm_mode = True
        from_attributes = True

class ExerciseSessionCreate(BaseModel):
    exercise_id: int
    plan_id: Optional[int] = None
    skipped: bool = False
    notes: Optional[str] = None
    completed_reps: Optional[int] = None
    target_reps: Optional[int] = None
    form_score: Optional[int] = None
    duration: Optional[int] = None
    feedback: Optional[str] = None

class ExerciseSessionInDB(ExerciseSessionCreate):
    id: int
    user_id: int
    completed_at: datetime
    exercise: ExerciseInDB
    class Config:
        orm_mode = True
        from_attributes = True

class RecommendationRequest(BaseModel):
    detected_issues: Optional[List[str]] = None
    posture_issue: Optional[str] = None
    severity: Optional[str] = "low"

class RecommendationResponse(BaseModel):
    warning: Optional[str] = None
    recommendations: List[ExerciseInDB]
