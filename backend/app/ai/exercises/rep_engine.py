"""
Shared rep-counting engine used by every live exercise.

Each exercise turns the landmarks of one frame into a single number (the "signal"),
for example an angle in degrees. The engine then:
  1. calibrates the user's neutral position for ~3 s (median and noise level),
  2. smooths the signal (median of 3, then an exponential average),
  3. counts a rep with two thresholds (hysteresis) and a minimum hold time:
        REST --reach T_hi--> HOLD --held long enough--> HELD --back below T_lo--> +1 rep
  4. freezes when the needed body points aren't visible, instead of guessing.

Times come from the client's timestamps, not frame counts, so a slow connection
doesn't change how long a hold has to be.
"""
import math
import statistics
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

Point = Tuple[float, float]


def to_pixels(landmarks: List[Dict[str, float]], width: float, height: float) -> List[Point]:
    """Normalised (0-1) landmarks to pixels, so angles aren't stretched by the frame's aspect ratio."""
    return [(lm["x"] * width, lm["y"] * height) for lm in landmarks]


def visible(landmarks: List[Dict[str, float]], indices, min_visibility: float = 0.65) -> bool:
    for i in indices:
        lm = landmarks[i]
        if lm.get("visibility", 0) < min_visibility:
            return False
        if not (0.02 < lm["x"] < 0.98 and 0.02 < lm["y"] < 0.98):
            return False
    return True


def angle_between(v1: Point, v2: Point) -> float:
    """Unsigned angle between two vectors, in degrees (0-180)."""
    a = math.atan2(v1[1], v1[0]) - math.atan2(v2[1], v2[0])
    deg = abs(math.degrees(a)) % 360
    return 360 - deg if deg > 180 else deg


def line_angle(a: Point, b: Point) -> float:
    """Direction of the line a->b, in degrees."""
    return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


def wrap180(deg: float) -> float:
    return (deg + 180) % 360 - 180


def midpoint(a: Point, b: Point) -> Point:
    return ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)


def distance(a: Point, b: Point) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


@dataclass
class EngineConfig:
    amplitude: float          # typical full movement, in signal units (A)
    min_reach: float          # smallest movement that can count as reaching the target (T_min)
    min_return: float         # smallest distance back towards neutral that ends a rep
    hold_seconds: float       # how long the target must be held
    unit: str = "°"
    two_sided: bool = False   # count movements to either side (e.g. neck side-bend)
    calibration_seconds: float = 3.0
    max_noise: float = 0.0    # calibration is repeated if the signal is noisier than this (0 = no limit)
    min_noise: float = 0.0    # floor for the measured noise


class RepEngine:
    REST, HOLD, HELD = "rest", "hold", "held"

    def __init__(self, cfg: EngineConfig):
        self.cfg = cfg
        self.reset()

    def reset(self):
        self.phase = "calibrating"
        self.calib: List[float] = []
        self.calib_start: Optional[float] = None
        self.baseline = 0.0
        self.noise = 0.0
        self.state = self.REST
        self.hold_start = 0.0
        self.peak = 0.0
        self.side = 0
        self.last_rep_time = -1e9
        self.last_progress = 0.0
        self.last_visible = None
        self.rest_since = None
        self.raw: List[float] = []
        self.smoothed: Optional[float] = None
        self.reps = 0
        self.reps_by_side = {"left": 0, "right": 0}
        self.rep_scores: List[float] = []
        self.rep_penalty = 0.0

    # Thresholds on the distance from neutral
    @property
    def t_hi(self) -> float:
        return max(0.6 * self.cfg.amplitude, self.cfg.min_reach, 4 * self.noise)

    @property
    def t_hold(self) -> float:
        return 0.8 * self.t_hi

    @property
    def t_lo(self) -> float:
        return max(0.25 * self.cfg.amplitude, self.cfg.min_return, 2 * self.noise)

    def _smooth(self, value: float) -> float:
        self.raw = (self.raw + [value])[-3:]
        med = statistics.median(self.raw)
        self.smoothed = med if self.smoothed is None else 0.35 * med + 0.65 * self.smoothed
        return self.smoothed

    def average_score(self) -> int:
        if not self.rep_scores:
            return 100
        return int(round(sum(self.rep_scores) / len(self.rep_scores)))

    def update(self, value: Optional[float], t: float, fault: Optional[str] = None) -> Dict:
        """
        value: this frame's signal, or None if the needed body points aren't visible.
        fault: a form problem seen in this frame (e.g. "Don't nod"), which lowers the rep's score.
        Returns the display fields for the client.
        """
        if value is None:
            if self.last_visible is not None and t - self.last_visible > 3:
                # Lost the user for a while: abandon the current rep
                self.state = self.REST
            return self._result(t, event="not_visible")
        self.last_visible = t
        s = self._smooth(value)

        if self.phase == "calibrating":
            if self.calib_start is None:
                self.calib_start = t
            self.calib.append(value)
            if t - self.calib_start >= self.cfg.calibration_seconds and len(self.calib) >= 10:
                med = statistics.median(self.calib)
                mad = statistics.median([abs(v - med) for v in self.calib])
                noise = max(1.4826 * mad, self.cfg.min_noise)
                if self.cfg.max_noise and noise > self.cfg.max_noise:
                    self.calib, self.calib_start = [], None
                    return self._result(t, event="unsteady")
                self.baseline, self.noise = med, noise
                self.smoothed = med
                self.phase = "active"
                self.last_progress = t
                return self._result(t, event="calibrated")
            return self._result(t)

        d = s - self.baseline
        side = 1 if d >= 0 else -1
        dist = abs(d) if self.cfg.two_sided else d
        event = None

        if fault and self.state in (self.HOLD, self.HELD):
            self.rep_penalty = min(40.0, self.rep_penalty + 2.0)

        if self.state == self.REST:
            if dist >= self.t_hi and t - self.last_rep_time >= 0.5:
                self.state, self.hold_start, self.peak = self.HOLD, t, dist
                self.side = side
                self.rep_penalty = 0.0
                self.last_progress = t
                event = "reached"
            elif abs(d) < self.t_lo:
                # Slow drift correction, only while resting and steady
                if self.rest_since is None:
                    self.rest_since = t
                elif t - self.rest_since >= 2:
                    self.baseline += 0.02 * (s - self.baseline)
            else:
                self.rest_since = None
        elif self.state == self.HOLD:
            self.peak = max(self.peak, dist)
            if dist < self.t_hold or (self.cfg.two_sided and side != self.side):
                self.state = self.REST
                event = "hold_broken"
            elif t - self.hold_start >= self.cfg.hold_seconds:
                self.state = self.HELD
                self.last_progress = t
                event = "held"
        elif self.state == self.HELD:
            self.peak = max(self.peak, dist)
            if dist <= self.t_lo:
                depth = min(1.0, self.peak / self.cfg.amplitude)
                score = max(0.0, 60 + 40 * depth - self.rep_penalty)
                self.rep_scores.append(score)
                self.reps += 1
                if self.cfg.two_sided:
                    self.reps_by_side["left" if self.side > 0 else "right"] += 1
                self.last_rep_time = t
                self.state = self.REST
                self.rest_since = None
                event = "rep"

        if self.state != self.REST and t - self.last_progress > 20:
            self.state = self.REST
            event = "timeout"
        return self._result(t, event=event, d=d)

    def _result(self, t: float, event: Optional[str] = None, d: Optional[float] = None) -> Dict:
        hold = 0.0
        if self.state == self.HOLD:
            hold = min(1.0, (t - self.hold_start) / self.cfg.hold_seconds)
        elif self.state == self.HELD:
            hold = 1.0
        calib = 0.0
        if self.phase == "calibrating" and self.calib_start is not None:
            calib = min(1.0, (t - self.calib_start) / self.cfg.calibration_seconds)
        return {
            "phase": self.phase,
            "state": self.state,
            "event": event,
            "reps": self.reps,
            "reps_by_side": self.reps_by_side if self.cfg.two_sided else None,
            "signal": None if d is None else round(d, 3),
            "t_hi": round(self.t_hi, 3),
            "t_lo": round(self.t_lo, 3),
            "unit": self.cfg.unit,
            "two_sided": self.cfg.two_sided,
            "hold_progress": round(hold, 2),
            "calibration_progress": round(calib, 2),
            "form_score": self.average_score(),
        }
