import math

from .base_exercise import TrackedExercise
from .rep_engine import EngineConfig


class ChinTucksAnalyzer(TrackedExercise):
    """
    Chin tucks seen from the SIDE. A chin tuck glides the head straight back, which a
    front camera can barely see. From the side the ear moves back over the shoulder,
    so the ear-shoulder angle rises by roughly 5-12 degrees.
    A nod swings the eyes around the ear, so the eye-ear line is used to catch nodding.
    """
    config = EngineConfig(amplitude=8.0, min_reach=4.0, min_return=1.5, hold_seconds=2.0,
                          unit="°", max_noise=2.5, min_noise=0.4)
    required = (0,)
    not_visible_hint = "Turn sideways so the camera sees your ear and shoulder."
    calibrate_hint = "Sit sideways, look straight ahead and hold still."
    rest_hint = "Glide your head straight back, making a double chin."
    hold_hint = "Hold the tuck..."
    release_hint = "Now relax forward to the start."

    def _side(self, lms):
        # Use the ear (and matching shoulder and eye) that faces the camera
        if lms[7]["visibility"] >= lms[8]["visibility"]:
            return 7, 11, 3
        return 8, 12, 6

    def features(self, lms, P):
        ear, shoulder, eye = self._side(lms)
        if min(lms[ear]["visibility"], lms[shoulder]["visibility"]) < 0.65:
            return None
        E, S, Y, N = P[ear], P[shoulder], P[eye], P[0]
        neck = S[1] - E[1]
        if neck <= 0:
            return None
        facing = 1 if N[0] > E[0] else -1
        # Side-on check: both shoulders overlap and the nose is clearly ahead of the ear
        if abs(P[11][0] - P[12][0]) > 0.35 * neck or facing * (N[0] - E[0]) < 0.3 * neck:
            return None
        esa = math.degrees(math.atan2(S[1] - E[1], facing * (E[0] - S[0])))
        tilt = math.degrees(math.atan2(E[1] - Y[1], facing * (Y[0] - E[0])))
        return {"signal": esa, "tilt": tilt, "shoulder_x": facing * S[0], "neck": neck}

    def position_hint(self, lms, P):
        return "Turn your chair so one shoulder points at the screen, then look straight ahead."

    def fault(self, f):
        if abs(f["tilt"] - self.ref["tilt"]) > 10:
            return "Glide straight back. Don't nod or lift your chin."
        if abs(f["shoulder_x"] - self.ref["shoulder_x"]) > 0.10 * self.ref["neck"]:
            return "Keep your back still and move only your head."
        return None
