from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TimelinePoint(BaseModel):
    minute: int
    good_pct: float


class FocusSessionCreate(BaseModel):
    started_at: datetime
    duration_seconds: int = Field(ge=0)
    samples: int = Field(ge=0)
    good_samples: int = Field(ge=0)
    nudges: int = Field(ge=0, default=0)
    timeline: List[TimelinePoint] = []
    reasons: Dict[str, int] = {}


class FocusSessionInDB(BaseModel):
    id: int
    started_at: datetime
    duration_seconds: int
    samples: int
    good_samples: int
    good_pct: float
    nudges: int
    timeline: List[TimelinePoint]
    reasons: Dict[str, int]
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
