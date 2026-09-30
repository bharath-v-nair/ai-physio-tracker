from .base_exercise import TrackedExercise
from .rep_engine import EngineConfig, line_angle, wrap180, distance


class NeckSideBendAnalyzer(TrackedExercise):
    """
    Neck side-bend stretch, front view: ear towards shoulder, held, on each side.
    The signal is the head's tilt (ears and eyes) relative to the shoulder line, in degrees,
    so leaning the whole body doesn't count.
    """
    config = EngineConfig(amplitude=30.0, min_reach=15.0, min_return=7.0, hold_seconds=5.0,
                          unit="°", two_sided=True, max_noise=3.0, min_noise=0.5)
    required = (2, 5, 7, 8, 11, 12)
    not_visible_hint = "Face the camera so it can see your whole head and both shoulders."
    calibrate_hint = "Sit tall, face the camera and hold still."
    rest_hint = "Slowly tilt one ear towards that shoulder."
    hold_hint = "Hold the stretch and breathe..."
    release_hint = "Slowly bring your head back to the middle."

    def features(self, lms, P):
        head = (line_angle(P[8], P[7]) + line_angle(P[5], P[2])) / 2
        shoulders = line_angle(P[12], P[11])
        a, b = distance(P[0], P[7]), distance(P[0], P[8])
        yaw = (a - b) / (a + b) if a + b else 0.0
        return {"signal": wrap180(head - shoulders), "yaw": yaw, "shoulders": shoulders}

    def fault(self, f):
        if abs(f["yaw"] - self.ref["yaw"]) > 0.2:
            return "Tilt your head sideways. Don't turn it."
        if abs(wrap180(f["shoulders"] - self.ref["shoulders"])) > 6:
            return "Keep your shoulders level and relaxed."
        return None
