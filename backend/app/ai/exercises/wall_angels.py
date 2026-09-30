from .base_exercise import TrackedExercise
from .rep_engine import EngineConfig, angle_between, midpoint


class WallAngelsAnalyzer(TrackedExercise):
    """
    Wall angels, front view: arms slide from a W (goalpost, upper arms ~90 degrees from
    the body) up into a Y (~130-160 degrees) and back. The signal is the upper-arm
    elevation of the lower arm, so both arms have to go up.
    """
    config = EngineConfig(amplitude=55.0, min_reach=35.0, min_return=12.0, hold_seconds=0.5,
                          unit="°", max_noise=4.0, min_noise=1.0)
    required = (11, 12, 13, 14, 15, 16)
    not_visible_hint = "Step back or tilt the screen so both hands stay in view."
    calibrate_hint = "Arms in a W against the wall. Hold still."
    rest_hint = "Slide both arms up into a Y."
    hold_hint = "Reach..."
    release_hint = "Slowly slide back down to the W."

    def features(self, lms, P):
        ls, rs = P[11], P[12]
        if min(lms[23]["visibility"], lms[24]["visibility"]) >= 0.6:
            hips, sh = midpoint(P[23], P[24]), midpoint(ls, rs)
            down = (hips[0] - sh[0], hips[1] - sh[1])
        else:
            # Hips out of view at a desk: "down" is perpendicular to the shoulder line
            vx, vy = ls[0] - rs[0], ls[1] - rs[1]
            down = (-vy, vx) if vx > 0 else (vy, -vx)
        left = angle_between((P[13][0] - ls[0], P[13][1] - ls[1]), down)
        right = angle_between((P[14][0] - rs[0], P[14][1] - rs[1]), down)
        return {"signal": min(left, right), "left": left, "right": right}

    def fault(self, f):
        if abs(f["left"] - f["right"]) > 20:
            return "Raise both arms evenly."
        return None
