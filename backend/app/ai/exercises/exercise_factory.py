from .base_exercise import BaseExerciseAnalyzer
from .chin_tucks import ChinTucksAnalyzer
from .wall_angels import WallAngelsAnalyzer
from .neck_side_bend import NeckSideBendAnalyzer
from .shoulder_shrugs import ShoulderShrugsAnalyzer


class UnsupportedExerciseAnalyzer(BaseExerciseAnalyzer):
    def analyze(self, landmarks, dimensions, t=None):
        return {
            "reps": 0,
            "form_score": 0,
            "status": "Not Supported",
            "feedback": "Live analysis for this exercise is coming soon."
        }


# Exercise name (as stored in the library) -> live analyser
LIVE_ANALYZERS = {
    "Chin Tucks": ChinTucksAnalyzer,
    "Wall Angels": WallAngelsAnalyzer,
    "Neck Side-Bend Stretch": NeckSideBendAnalyzer,
    "Shoulder Shrugs": ShoulderShrugsAnalyzer,
}


class ExerciseFactory:
    @staticmethod
    def get_analyzer(exercise_name: str) -> BaseExerciseAnalyzer:
        analyzer = LIVE_ANALYZERS.get(exercise_name)
        return analyzer() if analyzer else UnsupportedExerciseAnalyzer()
