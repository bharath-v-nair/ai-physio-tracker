import time
from typing import Dict, Any, List, Optional, Tuple

from .rep_engine import RepEngine, EngineConfig, to_pixels, visible


def frame_size(dimensions) -> Tuple[float, float]:
    """The client sends {"width", "height"}; older callers pass a (w, h) tuple."""
    if isinstance(dimensions, dict):
        return dimensions.get("width") or 640, dimensions.get("height") or 480
    if dimensions:
        return dimensions[0], dimensions[1]
    return 640, 480


class BaseExerciseAnalyzer:
    def analyze(self, landmarks: List[Dict[str, float]], dimensions: tuple, t: Optional[float] = None) -> Dict[str, Any]:
        """
        Returns at least:
        {"reps": int, "form_score": int, "status": str, "feedback": str}
        """
        raise NotImplementedError("Subclasses must implement analyze()")


class TrackedExercise(BaseExerciseAnalyzer):
    """
    An exercise counted by the shared RepEngine. Subclasses define:
      config          EngineConfig for this movement
      required        landmark indices that must be visible
      measure()       this frame's signal, plus any form fault
      cues            what to tell the user in each state
    """
    config: EngineConfig
    required: Tuple[int, ...] = ()
    not_visible_hint = "Move so the camera can see your head and shoulders."
    calibrate_hint = "Hold still in the start position."
    rest_hint = "Start the movement."
    hold_hint = "Hold it..."
    release_hint = "Now slowly come back to the start."

    def __init__(self):
        self.engine = RepEngine(self.config)
        self.calib_samples: List[Dict[str, float]] = []
        self.ref: Dict[str, float] = {}

    # --- to implement -------------------------------------------------------
    def features(self, lms, P) -> Optional[Dict[str, float]]:
        """Numbers measured on this frame; must include "signal". None if the pose doesn't fit."""
        raise NotImplementedError

    def fault(self, f: Dict[str, float]) -> Optional[str]:
        """A form problem compared with the calibrated start position, or None."""
        return None

    def position_hint(self, lms, P) -> Optional[str]:
        """Why features() returned None, if it's about positioning rather than visibility."""
        return None

    # --- shared -------------------------------------------------------------
    def analyze(self, landmarks, dimensions, t=None):
        t = time.monotonic() if t is None else float(t)
        hint = None
        f = None
        if landmarks and len(landmarks) >= 33:
            P = to_pixels(landmarks, *frame_size(dimensions))
            if visible(landmarks, self.required):
                f = self.features(landmarks, P)
                if f is None:
                    hint = self.position_hint(landmarks, P)
        if f is None:
            result = self.engine.update(None, t)
            result.update(status="Adjust position", feedback=hint or self.not_visible_hint)
            return result

        if self.engine.phase == "calibrating":
            self.calib_samples.append(f)
        fault = self.fault(f) if self.engine.phase == "active" else None
        result = self.engine.update(f["signal"], t, fault)
        if result["event"] == "calibrated":
            keys = self.calib_samples[0].keys()
            self.ref = {k: sorted(s[k] for s in self.calib_samples)[len(self.calib_samples) // 2] for k in keys}
        elif result["event"] == "unsteady":
            self.calib_samples = []

        result.update(self.describe(result, fault))
        result["measure"] = {k: round(v, 2) for k, v in f.items()}
        return result

    def describe(self, r, fault) -> Dict[str, str]:
        if r["phase"] == "calibrating":
            text = "Hold still for a moment." if r["event"] == "unsteady" else self.calibrate_hint
            return {"status": "Calibrating", "feedback": text}
        if fault:
            return {"status": "Adjust", "feedback": fault}
        if r["event"] == "rep":
            return {"status": "Good Form", "feedback": f"Rep {r['reps']} done!"}
        if r["event"] == "hold_broken":
            return {"status": "Adjust", "feedback": "Hold a little longer next time."}
        state = r["state"]
        text = {"rest": self.rest_hint, "hold": self.hold_hint, "held": self.release_hint}[state]
        return {"status": "Good Form", "feedback": text}
