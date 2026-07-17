from pydantic import BaseModel, ConfigDict
from typing import Optional

class ExerciseBase(BaseModel):
    name: str
    body_part: str
    description: Optional[str] = None
    repetitions: Optional[str] = None
    duration: Optional[str] = None
    target_muscle: Optional[str] = None
    target_issue: Optional[str] = None
    difficulty: Optional[str] = None
    sets: Optional[int] = None
    instructions: Optional[str] = None
    common_mistakes: Optional[str] = None
    tips: Optional[str] = None
    safety_notes: Optional[str] = None

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseInDB(ExerciseBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)
