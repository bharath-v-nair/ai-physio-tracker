from pydantic import BaseModel, Field
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
        from_attributes = True

class ExerciseSessionCreate(BaseModel):
    exercise_id: int
    plan_id: Optional[int] = None
    skipped: bool = False
    notes: Optional[str] = Field(default=None, max_length=500)
    completed_reps: Optional[int] = Field(default=None, ge=0, le=1000)
    target_reps: Optional[int] = Field(default=None, ge=0, le=1000)
    form_score: Optional[int] = Field(default=None, ge=0, le=100)
    duration: Optional[int] = Field(default=None, ge=0, le=86400)   # seconds
    feedback: Optional[str] = Field(default=None, max_length=500)

class ExerciseSessionInDB(ExerciseSessionCreate):
    id: int
    user_id: int
    completed_at: datetime
    exercise: ExerciseInDB
    class Config:
        from_attributes = True

class RecommendationRequest(BaseModel):
    detected_issues: Optional[List[str]] = None
    posture_issue: Optional[str] = None
    severity: Optional[str] = "low"

class RecommendationResponse(BaseModel):
    warning: Optional[str] = None
    recommendations: List[ExerciseInDB]
