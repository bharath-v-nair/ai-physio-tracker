from sqlalchemy import Column, Integer, Boolean, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base

class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("rehab_plans.id"), nullable=True)
    
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    skipped = Column(Boolean, default=False)
    notes = Column(String, nullable=True)
    
    # New Live Exercise Tracking Fields
    completed_reps = Column(Integer, nullable=True)
    target_reps = Column(Integer, nullable=True)
    form_score = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)  # in seconds
    feedback = Column(String, nullable=True)
    
    user = relationship("User")
    exercise = relationship("Exercise")
    plan = relationship("RehabPlan")
