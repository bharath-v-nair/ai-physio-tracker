from enum import Enum
from typing import Dict, Any, List

class RepState(Enum):
    REST = "REST"
    MOVING = "MOVING"
    TARGET_REACHED = "TARGET_REACHED"
    RETURNING = "RETURNING"
    REP_COMPLETED = "REP_COMPLETED"

class BaseExerciseAnalyzer:
    def __init__(self):
        self.state = RepState.REST
        self.reps = 0
        self.form_scores: List[float] = []
        self.current_rep_score = 100.0
        self.feedback = "Ready. Get into starting position."
        
    def reset(self):
        self.state = RepState.REST
        self.reps = 0
        self.form_scores = []
        self.current_rep_score = 100.0
        self.feedback = "Ready. Get into starting position."

    def get_average_score(self) -> int:
        if not self.form_scores:
            return 100
        avg = int(sum(self.form_scores) / len(self.form_scores))
        return max(0, min(100, avg))

    def analyze(self, landmarks: List[Dict[str, float]], dimensions: tuple) -> Dict[str, Any]:
        """
        To be implemented by subclasses.
        Returns:
        {
            "reps": int,
            "form_score": int,
            "status": str,
            "feedback": str
        }
        """
        raise NotImplementedError("Subclasses must implement analyze()")
