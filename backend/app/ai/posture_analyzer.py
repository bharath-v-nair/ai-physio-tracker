import math
from typing import Dict, Any, List, Optional, Tuple

from app.ai import posture_model
from app.ai.exercises.rep_engine import to_pixels, distance, line_angle, wrap180


class PostureAnalyzer:
    """
    Two-view posture check.

    Front view (facing the camera):
      - head position: ear midpoint left/right of the shoulder midpoint, as % of shoulder width
      - shoulder level: tilt of the shoulder line, in degrees
      - trunk lean: trained classifier on MediaPipe world landmarks (app/ai/posture_model.py),
        only when the hips are in view
    Side view (turned 90 degrees):
      - neck angle: ear-shoulder angle from horizontal. Smaller = head further forward.
        MediaPipe has no C7 point, so this is an estimate that runs higher than the clinical
        craniovertebral angle; the app reports change from the user's own earlier checks.

    All angles are measured in pixels, so the frame's aspect ratio doesn't stretch them.
    """

    HEAD_MODERATE, HEAD_HIGH = 12.0, 20.0          # % of shoulder width
    SHOULDER_MODERATE, SHOULDER_HIGH = 5.0, 10.0   # degrees

    def analyze(self, landmarks: List[Dict[str, float]], world: Optional[List[Dict[str, float]]] = None,
                dims: Tuple[int, int] = (640, 480), view: str = "front") -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return {"score": 0, "issues": [], "confidence": 0, "view": view, "measurements": None}
        w, h = dims if dims and dims[0] else (640, 480)
        P = to_pixels(landmarks, w, h)
        if view == "side":
            return self._side(landmarks, P)
        return self._front(landmarks, world, P)

    def _front(self, lms, world, P) -> Dict[str, Any]:
        issues = []
        score = 100
        width = distance(P[11], P[12])
        if width <= 0:
            return {"score": 0, "issues": [], "confidence": 0, "view": "front", "measurements": None}

        # 1. Head position
        mid_ear_x = (P[7][0] + P[8][0]) / 2
        mid_sh_x = (P[11][0] + P[12][0]) / 2
        head_offset = abs(mid_ear_x - mid_sh_x) / width * 100
        if head_offset > self.HEAD_MODERATE:
            high = head_offset > self.HEAD_HIGH
            issues.append({
                "name": "Head Tilt / Side Shift",
                "severity": "High" if high else "Moderate",
                "recommendation": "Bring your head back to the centre, level your ears and keep them over your shoulders."
            })
            score -= 20 if high else 10

        # 2. Shoulder level
        tilt = abs(wrap180(line_angle(P[12], P[11])))
        if tilt > self.SHOULDER_MODERATE:
            high = tilt > self.SHOULDER_HIGH
            issues.append({
                "name": "Uneven Shoulders",
                "severity": "High" if high else "Moderate",
                "recommendation": "Relax your shoulders. Ensure one isn't shrugging higher than the other."
            })
            score -= 15 if high else 5

        # 3. Trunk lean (trained model), only when both hips are visible
        hips_visible = min(lms[23].get("visibility", 0), lms[24].get("visibility", 0)) >= 0.5
        trunk = posture_model.predict(world) if hips_visible else None
        if trunk and trunk["code"] != "TUP":
            issues.append({
                "name": f"Body Lean ({trunk['label']})",
                "severity": "Moderate",
                "recommendation": "Sit back against your chair with your weight even on both hips."
            })
            score -= 10

        confidence = min(100.0, sum(lm.get("visibility", 0) for lm in lms[11:25]) / 14 * 100)
        return {
            "score": max(0, score),
            "issues": issues,
            "confidence": confidence,
            "view": "front",
            "measurements": {
                "head_offset_pct": round(head_offset, 1),
                "shoulder_tilt_deg": round(tilt, 1),
                "trunk_lean": trunk["code"] if trunk else None,
                "trunk_lean_label": trunk["label"] if trunk else None,
                "trunk_lateral_deg": round(trunk["trunk_lateral_deg"], 1) if trunk else None,
                "trunk_sagittal_deg": round(trunk["trunk_sagittal_deg"], 1) if trunk else None,
                "hips_visible": hips_visible,
            },
        }

    def _side(self, lms, P) -> Dict[str, Any]:
        ear, shoulder = (7, 11) if lms[7].get("visibility", 0) >= lms[8].get("visibility", 0) else (8, 12)
        E, S, N = P[ear], P[shoulder], P[0]
        neck = S[1] - E[1]
        seen = min(lms[ear].get("visibility", 0), lms[shoulder].get("visibility", 0)) >= 0.65
        facing = 1 if N[0] > E[0] else -1
        side_on = (seen and neck > 0 and abs(P[11][0] - P[12][0]) < 0.35 * neck
                   and facing * (N[0] - E[0]) > 0.3 * neck)
        angle = math.degrees(math.atan2(S[1] - E[1], facing * (E[0] - S[0]))) if side_on else None
        return {
            "score": None,
            "issues": [],
            "confidence": 100.0 * min(lms[ear].get("visibility", 0), lms[shoulder].get("visibility", 0)),
            "view": "side",
            "measurements": {"side_on": side_on, "neck_angle_deg": round(angle, 1) if angle is not None else None},
        }
