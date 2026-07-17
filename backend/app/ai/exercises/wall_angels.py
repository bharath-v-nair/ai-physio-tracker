from .base_exercise import BaseExerciseAnalyzer, RepState
from typing import Dict, Any, List

class WallAngelsAnalyzer(BaseExerciseAnalyzer):
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
        l_elbow, r_elbow = landmarks[13], landmarks[14]
        l_wrist, r_wrist = landmarks[15], landmarks[16]
        
        status = "Good Form"
        
        # simplified check: wrists go above shoulders and come back down
        avg_wrist_y = (l_wrist['y'] + r_wrist['y']) / 2.0
        avg_shoulder_y = (l_shoulder['y'] + r_shoulder['y']) / 2.0
        
        if self.state == RepState.REST:
            if avg_wrist_y > avg_shoulder_y: # Wrists below shoulders
                self.feedback = "Slide arms up the wall."
                self.state = RepState.MOVING
            else:
                self.feedback = "Lower arms to start."
                
        elif self.state == RepState.MOVING:
            if avg_wrist_y < avg_shoulder_y - 0.2: # Wrists well above shoulders
                self.state = RepState.TARGET_REACHED
            else:
                self.feedback = "Keep sliding arms up."
                
        elif self.state == RepState.TARGET_REACHED:
            self.state = RepState.RETURNING
            self.feedback = "Slowly slide back down."
            
        elif self.state == RepState.RETURNING:
            if avg_wrist_y > avg_shoulder_y:
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
