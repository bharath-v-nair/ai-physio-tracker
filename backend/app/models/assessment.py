from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    posture_score = Column(Float, nullable=False)
    detected_issue = Column(String, nullable=True)
    confidence = Column(Float, nullable=False)

    # Measurements behind the score (medians over the check)
    head_offset_pct = Column(Float, nullable=True)     # ear midpoint off the shoulder midpoint, % of shoulder width
    shoulder_tilt_deg = Column(Float, nullable=True)
    trunk_lean = Column(String, nullable=True)         # posture model class, e.g. TUP (upright); None if hips not in view
    neck_angle_deg = Column(Float, nullable=True)      # side view; None if the side check was skipped
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="assessments")
    progress = relationship("Progress", back_populates="assessment")
