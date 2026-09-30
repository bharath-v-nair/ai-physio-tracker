"""Tests for focus mode (app/ai/focus_analyzer.py): posture compared with the user's own baseline."""
from app.ai.focus_analyzer import FocusAnalyzer, CALIBRATION_SAMPLES
from tests import synthetic as syn

DIMS = (syn.W, syn.H)


def sample(points):
    return syn.normalise(points, jitter=0.5)


def calibrated():
    f = FocusAnalyzer()
    for _ in range(CALIBRATION_SAMPLES):
        r = f.analyze(sample(syn.FRONT), None, DIMS)
    assert r["event"] == "calibrated"
    return f


def head_moved(dy=0.0, scale=1.0, dx=0.0):
    P = dict(syn.FRONT)
    cx = (P[7][0] + P[8][0]) / 2
    cy = (P[7][1] + P[8][1]) / 2
    for i in range(11):
        x, y = P[i]
        P[i] = (cx + (x - cx) * scale + dx, cy + (y - cy) * scale + dy)
    return P


def test_calibrates_before_judging():
    f = FocusAnalyzer()
    r = f.analyze(sample(syn.FRONT), None, DIMS)
    assert r["phase"] == "calibrating" and r["good"] is None


def test_sitting_like_the_baseline_is_good():
    f = calibrated()
    assert f.analyze(sample(syn.FRONT), None, DIMS)["good"] is True


def test_slouching_is_detected():
    f = calibrated()
    r = f.analyze(sample(head_moved(dy=40)), None, DIMS)   # head drops towards the shoulders
    assert r["good"] is False and "slouching" in r["reasons"]


def test_leaning_in_is_detected():
    f = calibrated()
    r = f.analyze(sample(head_moved(scale=1.3)), None, DIMS)
    assert r["good"] is False and "leaning_in" in r["reasons"]


def test_head_tilt_is_detected():
    f = calibrated()
    r = f.analyze(sample(head_moved(dx=50)), None, DIMS)
    assert "head_tilt" in r["reasons"]


def test_out_of_view_is_not_counted_as_bad_posture():
    f = calibrated()
    r = f.analyze(syn.normalise(syn.FRONT, {i: 0.1 for i in range(33)}), None, DIMS)
    assert r["status"] == "away" and r["good"] is None
