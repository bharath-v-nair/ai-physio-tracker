from .base_exercise import BaseExerciseAnalyzer, RepState
from typing import Dict, Any, List
import math

class ChinTucksAnalyzer(BaseExerciseAnalyzer):
    def __init__(self):
        super().__init__()
        self.baseline_dist = None
        self.hold_frames = 0

    def analyze(self, landmarks: List[Dict[str, float]], dimensions: tuple) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return {
                "reps": self.reps,
                "form_score": self.get_average_score(),
                "status": "No pose detected",
                "feedback": "Please step into the camera view."
            }

        # MediaPipe Landmarks: 0: nose, 7: left ear, 8: right ear, 11: left shoulder, 12: right shoulder
        nose = landmarks[0]
        l_shoulder = landmarks[11]
        r_shoulder = landmarks[12]
        
        # Calculate vertical distance from nose to shoulder center
        shoulder_y = (l_shoulder['y'] + r_shoulder['y']) / 2.0
        vert_dist = shoulder_y - nose['y']
        
        status = "Good Form"
        
        # Initialize or update smooth baseline when resting
        if self.baseline_dist is None:
            self.baseline_dist = vert_dist
        
        # Movement calculation relative to baseline
        diff = vert_dist - self.baseline_dist

        # State Machine Logic
        if self.state == RepState.REST:
            # Update baseline dynamically while at rest
            self.baseline_dist = 0.9 * self.baseline_dist + 0.1 * vert_dist
            
            if diff > 0.015:  # Head moved down/tucked towards chest
                self.state = RepState.MOVING
                self.feedback = "Good! Continue tucking chin down & back."
            else:
                self.feedback = "Pull your chin straight back towards your neck."

        elif self.state == RepState.MOVING:
            if diff > 0.025:  # Tuck threshold reached
                self.state = RepState.TARGET_REACHED
                self.hold_frames = 0
                self.feedback = "Great tuck! Hold for a moment..."
            elif diff < -0.02:  # Moving head up/forward instead
                self.current_rep_score = max(50.0, self.current_rep_score - 0.5)
                self.feedback = "Don't tilt head up; pull chin back."
                status = "Needs Improvement"
            elif diff <= 0.01: # Aborted movement, returned to rest
                self.state = RepState.REST
                self.feedback = "Pull your chin straight back towards your neck."
            else:
                self.feedback = "Keep pulling chin back."

        elif self.state == RepState.TARGET_REACHED:
            self.hold_frames += 1
            if self.hold_frames >= 5:  # ~0.5 sec hold
                self.state = RepState.RETURNING
                self.feedback = "Now slowly release back to neutral."

        elif self.state == RepState.RETURNING:
            if diff <= 0.01:  # Returned close to neutral
                self.state = RepState.REP_COMPLETED

        elif self.state == RepState.REP_COMPLETED:
            self.reps += 1
            score = max(0, min(100, int(self.current_rep_score)))
            self.form_scores.append(score)
            self.current_rep_score = 100.0  # reset for next rep
            self.feedback = f"Great rep! ({self.reps} completed)"
            self.state = RepState.REST

        # Calculate live form score clamped between 0 and 100
        avg_score = self.get_average_score()
        current_score = max(0, min(100, int(self.current_rep_score if not self.form_scores else (avg_score + self.current_rep_score) / 2)))

        return {
            "reps": self.reps,
            "form_score": current_score,
            "status": status,
            "feedback": self.feedback
        }
