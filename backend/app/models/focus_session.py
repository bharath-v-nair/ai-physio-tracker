from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base


class FocusSession(Base):
    """One focus-mode work session: how much of it was spent in good posture."""
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    samples = Column(Integer, nullable=False)          # samples where the user was in view
    good_samples = Column(Integer, nullable=False)
    good_pct = Column(Float, nullable=False)
    nudges = Column(Integer, nullable=False, default=0)
    timeline = Column(String, nullable=True)           # JSON: [{"minute": 0, "good_pct": 92.0}, ...]
    reasons = Column(String, nullable=True)            # JSON: {"slouching": 12, ...}
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
