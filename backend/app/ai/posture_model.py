"""
Trunk-lean classifier trained on the MultiPosture dataset (see analysis/posture_model.ipynb).

The trained model is a depth-4 decision tree. Every split it uses reduces to four cut-offs
on two trunk angles, so it is written out here as plain rules: the same predictions without
shipping scikit-learn to the server. analysis/check_backend_rules.py confirms that these
rules and the saved model agree on every frame of the dataset.

Input: MediaPipe *world* landmarks (metres, origin at the hip midpoint; x to the image right,
y down, z away from the camera).
"""
import math
from typing import Dict, List, Optional

# Learned cut-offs (degrees)
LEAN_RIGHT_BELOW = -8.8878
LEAN_LEFT_ABOVE = 14.1601
LEAN_BACK_BELOW = -9.9845
LEAN_FORWARD_ABOVE = 9.9923

CLASS_NAMES = {
    "TUP": "Upright",
    "TLF": "Leaning Forward",
    "TLB": "Leaning Backward",
    "TLL": "Leaning Left",
    "TLR": "Leaning Right",
}


def trunk_angles(world: List[Dict[str, float]]) -> Dict[str, float]:
    """Sideways and forward/back trunk angles, as computed in analysis/posture_features.py."""
    sh = [(world[11][k] + world[12][k]) / 2 for k in "xyz"]
    hip = [(world[23][k] + world[24][k]) / 2 for k in "xyz"]
    tx, ty, tz = sh[0] - hip[0], sh[1] - hip[1], sh[2] - hip[2]
    up = -ty
    return {
        "trunk_lateral_deg": math.degrees(math.atan2(tx, math.hypot(up, tz))),
        "trunk_sagittal_deg": math.degrees(math.atan2(-tz, up)),
    }


def classify_trunk(lateral: float, sagittal: float) -> str:
    if lateral <= LEAN_RIGHT_BELOW:
        return "TLR"
    if lateral > LEAN_LEFT_ABOVE:
        return "TLL"
    if sagittal <= LEAN_BACK_BELOW:
        return "TLB"
    if sagittal > LEAN_FORWARD_ABOVE:
        return "TLF"
    return "TUP"


def predict(world: Optional[List[Dict[str, float]]]) -> Optional[Dict]:
    if not world or len(world) < 33:
        return None
    a = trunk_angles(world)
    code = classify_trunk(a["trunk_lateral_deg"], a["trunk_sagittal_deg"])
    return {"code": code, "label": CLASS_NAMES[code], **a}
