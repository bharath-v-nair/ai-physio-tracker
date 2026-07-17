from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base

class RehabPlan(Base):
    __tablename__ = "rehab_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    status = Column(String, default="active", nullable=False) # active, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    exercises = relationship("PlanExercise", back_populates="plan", cascade="all, delete-orphan")

class PlanExercise(Base):
    __tablename__ = "plan_exercises"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("rehab_plans.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    sets = Column(Integer, default=1)
    repetitions = Column(Integer, default=10)
    duration_seconds = Column(Integer, nullable=True)
    
    plan = relationship("RehabPlan", back_populates="exercises")
    exercise = relationship("Exercise")
