from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ProgressBase(BaseModel):
    assessment_id: Optional[int] = None
    improvement_percentage: float

class ProgressCreate(ProgressBase):
    pass

class ProgressInDB(ProgressBase):
    id: int
    user_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
