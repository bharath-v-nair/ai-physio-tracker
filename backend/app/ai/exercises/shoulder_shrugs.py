from .base_exercise import TrackedExercise
from .rep_engine import EngineConfig, distance


class ShoulderShrugsAnalyzer(TrackedExercise):
    """
    Shoulder shrugs, front view: lift both shoulders towards the ears, hold, lower.
    The signal is how far the shoulders rise towards the ears, as a percentage of
    shoulder width, so sitting closer or further from the camera doesn't matter.
    """
    config = EngineConfig(amplitude=12.0, min_reach=6.0, min_return=3.0, hold_seconds=1.0,
                          unit="%", max_noise=2.0, min_noise=0.3)
    required = (7, 8, 11, 12)
    not_visible_hint = "Face the camera so it can see your ears and both shoulders."
    calibrate_hint = "Sit tall with relaxed shoulders and hold still."
    rest_hint = "Lift both shoulders up towards your ears."
    hold_hint = "Hold at the top..."
    release_hint = "Slowly lower your shoulders."

    def features(self, lms, P):
        width = distance(P[11], P[12])
        if width <= 0:
            return None
        left = (P[11][1] - P[7][1]) / width * 100
        right = (P[12][1] - P[8][1]) / width * 100
        # Gap between ears and shoulders shrinks as the shoulders rise
        return {"signal": -(left + right) / 2, "left": left, "right": right}

    def fault(self, f):
        lift_left = self.ref["left"] - f["left"]
        lift_right = self.ref["right"] - f["right"]
        if abs(lift_left - lift_right) > 5:
            return "Lift both shoulders evenly."
        return None
