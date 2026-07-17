from .base_exercise import BaseExerciseAnalyzer
from .chin_tucks import ChinTucksAnalyzer
from .wall_angels import WallAngelsAnalyzer
from .scapular_retraction import ScapularRetractionAnalyzer

class UnsupportedExerciseAnalyzer(BaseExerciseAnalyzer):
    def analyze(self, landmarks, dimensions):
        return {
            "reps": 0,
            "form_score": 0,
            "status": "Not Supported",
            "feedback": "Live analysis for this exercise is coming soon."
        }

class ExerciseFactory:
    @staticmethod
    def get_analyzer(exercise_name: str) -> BaseExerciseAnalyzer:
        name = exercise_name.lower()
        if "chin tuck" in name:
            return ChinTucksAnalyzer()
        elif "wall angel" in name:
            return WallAngelsAnalyzer()
        elif "scapular" in name and "retraction" in name:
            return ScapularRetractionAnalyzer()
        else:
            return UnsupportedExerciseAnalyzer()
