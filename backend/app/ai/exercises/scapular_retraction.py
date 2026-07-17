from .base_exercise import BaseExerciseAnalyzer, RepState
from typing import Dict, Any, List
import math

class ScapularRetractionAnalyzer(BaseExerciseAnalyzer):
    def __init__(self):
        super().__init__()

    def analyze(self, landmarks: List[Dict[str, float]], dimensions: tuple) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return {
                "reps": self.reps,
                "form_score": self.get_average_score(),
                "status": "No pose detected",
                "feedback": "Please step into the camera view."
            }
            
        l_shoulder, r_shoulder = landmarks[11], landmarks[12]
        
        # Calculate horizontal distance between shoulders (approximation of retraction)
        # When retracted, shoulders appear closer together in 2D projection
        shoulder_dist = math.sqrt((l_shoulder['x'] - r_shoulder['x'])**2 + (l_shoulder['y'] - r_shoulder['y'])**2)
        
        status = "Good Form"
        
        # Simplistic logic based on relative distance
        if self.state == RepState.REST:
            self.feedback = "Squeeze shoulder blades together."
            # In a real app we'd calibrate the user's neutral distance
            if shoulder_dist < 0.25: # Arbitrary threshold for demo
                self.state = RepState.TARGET_REACHED
                
        elif self.state == RepState.TARGET_REACHED:
            self.feedback = "Release and return to neutral."
            self.state = RepState.RETURNING
            
        elif self.state == RepState.RETURNING:
            if shoulder_dist > 0.3:
                self.state = RepState.REP_COMPLETED
                
        elif self.state == RepState.REP_COMPLETED:
            self.reps += 1
            self.form_scores.append(self.current_rep_score)
            self.current_rep_score = 100.0
            self.state = RepState.REST
            self.feedback = "Good rep!"

        return {
            "reps": self.reps,
            "form_score": self.get_average_score(),
            "status": status,
            "feedback": self.feedback
        }
