"""
Focus mode: watches posture while the user works, one sample every couple of seconds.

At a desk the laptop camera usually sees the head and shoulders but not the hips, and slouching
mostly happens towards the camera. So instead of fixed thresholds, focus mode compares each
sample with the user's own "sitting well" position, captured at the start:
  - slouching: the ear-to-shoulder height (in shoulder widths) shrinks as the head drops forward
  - leaning in: the head looks bigger (ear-to-ear distance vs shoulder width) as it nears the screen
  - head tilt / side shift and uneven shoulders: same measures as the posture check
  - trunk lean: the trained model, when the hips happen to be in view
These relative cut-offs are practical settings, not clinically validated values.
"""
import statistics
from typing import Dict, List, Optional

from app.ai import posture_model
from app.ai.exercises.rep_engine import to_pixels, distance, line_angle, wrap180, visible

REQUIRED = (0, 7, 8, 11, 12)
CALIBRATION_SAMPLES = 4          # at one sample every 2 s, about 8 s of sitting well

SLOUCH_DROP = 0.15               # neck height down by 15% of the user's own baseline
LEAN_IN_GROWTH = 0.15            # head 15% bigger than baseline
HEAD_OFFSET_PCT = 12.0
SHOULDER_TILT_DEG = 5.0

REASONS = {
    "slouching": "Slouching: sit tall and lift the top of your head",
    "leaning_in": "Leaning towards the screen: sit back in your chair",
    "head_tilt": "Head tilted to one side: level your ears",
    "uneven_shoulders": "Shoulders uneven: relax them both down",
    "trunk_lean": "Leaning to one side: centre your weight",
}


class FocusAnalyzer:
    def __init__(self):
        self.calib: List[Dict[str, float]] = []
        self.baseline: Optional[Dict[str, float]] = None

    @staticmethod
    def measure(lms, world, dims) -> Optional[Dict[str, float]]:
        if not lms or len(lms) < 33 or not visible(lms, REQUIRED, min_visibility=0.5):
            return None
        P = to_pixels(lms, *dims)
        width = distance(P[11], P[12])
        if width <= 0:
            return None
        mid_ear = ((P[7][0] + P[8][0]) / 2, (P[7][1] + P[8][1]) / 2)
        mid_sh = ((P[11][0] + P[12][0]) / 2, (P[11][1] + P[12][1]) / 2)
        m = {
            "neck_height": (mid_sh[1] - mid_ear[1]) / width,
            "head_size": distance(P[7], P[8]) / width,
            "head_offset_pct": abs(mid_ear[0] - mid_sh[0]) / width * 100,
            "shoulder_tilt_deg": abs(wrap180(line_angle(P[12], P[11]))),
        }
        hips = min(lms[23].get("visibility", 0), lms[24].get("visibility", 0)) >= 0.5
        trunk = posture_model.predict(world) if hips else None
        m["trunk_upright"] = None if trunk is None else float(trunk["code"] == "TUP")
        return m

    def analyze(self, lms, world=None, dims=(640, 480)) -> Dict:
        m = self.measure(lms, world, dims)
        if m is None:
            return {"phase": "calibrating" if self.baseline is None else "active", "status": "away",
                    "good": None, "reasons": [], "message": "Can't see you. Sit where the camera can see your head and shoulders."}
        if self.baseline is None:
            self.calib.append(m)
            if len(self.calib) < CALIBRATION_SAMPLES:
                return {"phase": "calibrating", "status": "calibrating", "good": None, "reasons": [],
                        "progress": len(self.calib) / CALIBRATION_SAMPLES,
                        "message": "Sit the way you want to sit while you work, and hold it."}
            self.baseline = {k: statistics.median(c[k] for c in self.calib) for k in ("neck_height", "head_size")}
            return {"phase": "active", "status": "good", "good": True, "reasons": [], "event": "calibrated",
                    "message": "Got it. Focus mode is watching your posture."}

        reasons = []
        if m["neck_height"] < self.baseline["neck_height"] * (1 - SLOUCH_DROP):
            reasons.append("slouching")
        if m["head_size"] > self.baseline["head_size"] * (1 + LEAN_IN_GROWTH):
            reasons.append("leaning_in")
        if m["head_offset_pct"] > HEAD_OFFSET_PCT:
            reasons.append("head_tilt")
        if m["shoulder_tilt_deg"] > SHOULDER_TILT_DEG:
            reasons.append("uneven_shoulders")
        if m["trunk_upright"] == 0.0:
            reasons.append("trunk_lean")
        good = not reasons
        return {"phase": "active", "status": "good" if good else "poor", "good": good, "reasons": reasons,
                "message": "Good posture" if good else REASONS[reasons[0]],
                "measurements": {k: (round(v, 3) if v is not None else None) for k, v in m.items()}}
