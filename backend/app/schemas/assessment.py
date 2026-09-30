from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AssessmentBase(BaseModel):
    posture_score: float
    detected_issue: Optional[str] = None
    confidence: float
    head_offset_pct: Optional[float] = None
    shoulder_tilt_deg: Optional[float] = None
    trunk_lean: Optional[str] = None
    neck_angle_deg: Optional[float] = None

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentInDB(AssessmentBase):
    id: int
    user_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
