from sqlalchemy import Column, Integer, String
from app.database.session import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    body_part = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    repetitions = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    target_muscle = Column(String, nullable=True)
    target_issue = Column(String, nullable=True) # E.g., forward_head
    difficulty = Column(String, nullable=True)
    sets = Column(Integer, nullable=True, default=3)
    instructions = Column(String, nullable=True) # Storing as JSON string
    common_mistakes = Column(String, nullable=True) # Storing as JSON string
    tips = Column(String, nullable=True) # Storing as JSON string
    safety_notes = Column(String, nullable=True)
