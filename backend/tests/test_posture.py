"""Tests for the two-view posture check (app/ai/posture_analyzer.py) and the trunk-lean rules."""
import math

from app.ai.posture_analyzer import PostureAnalyzer
from app.ai.posture_model import classify_trunk, predict
from tests import synthetic as syn

DIMS = (syn.W, syn.H)
FRONT_VIS = {23: 0.9, 24: 0.9}


def analyze(points, world=None, view="front", vis=None):
    return PostureAnalyzer().analyze(syn.normalise(points, vis, jitter=0), world, DIMS, view)


def names(result):
    return [i["name"] for i in result["issues"]]


def tilt_shoulders(deg):
    P = dict(syn.FRONT)
    pivot = ((P[11][0] + P[12][0]) / 2, P[11][1])
    for i in (11, 13, 15, 12, 14, 16):
        P[i] = syn.rotate(P[i], pivot, deg)
    return P


def test_upright_front_view_scores_100():
    r = analyze(syn.FRONT)
    assert r["score"] == 100 and r["issues"] == []
    assert r["measurements"]["shoulder_tilt_deg"] < 1


def test_shoulder_tilt_is_measured_in_real_degrees():
    # A 7-degree tilt must read 7 degrees on a 16:9 frame (the old code read ~12)
    r = analyze(tilt_shoulders(7))
    assert abs(r["measurements"]["shoulder_tilt_deg"] - 7) < 0.5
    assert "Uneven Shoulders" in names(r)


def test_head_offset_is_symmetric():
    left = analyze(syn.side_bend(0, yaw_shift=0) | {i: (syn.FRONT[i][0] + 45, syn.FRONT[i][1]) for i in range(11)})
    right = analyze(syn.side_bend(0, yaw_shift=0) | {i: (syn.FRONT[i][0] - 45, syn.FRONT[i][1]) for i in range(11)})
    assert abs(left["measurements"]["head_offset_pct"] - right["measurements"]["head_offset_pct"]) < 0.5
    assert "Head Tilt / Side Shift" in names(left) and "Head Tilt / Side Shift" in names(right)


def world_pose(lateral_deg=0.0, sagittal_deg=0.0):
    """Hip-centred world landmarks (metres) with the trunk tilted by the given angles."""
    w = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(33)]
    w[23], w[24] = {"x": 0.1, "y": 0, "z": 0}, {"x": -0.1, "y": 0, "z": 0}
    up = 0.5
    sx = math.tan(math.radians(lateral_deg)) * up
    sz = -math.tan(math.radians(sagittal_deg)) * up
    w[11], w[12] = {"x": 0.18 + sx, "y": -up, "z": sz}, {"x": -0.18 + sx, "y": -up, "z": sz}
    return w


def test_trunk_rules_match_the_learned_cut_offs():
    assert classify_trunk(0, 0) == "TUP"
    assert classify_trunk(-9, 0) == "TLR"
    assert classify_trunk(15, 0) == "TLL"
    assert classify_trunk(0, 11) == "TLF"
    assert classify_trunk(0, -11) == "TLB"
    assert predict(world_pose(sagittal_deg=20))["code"] == "TLF"
    assert predict(world_pose())["code"] == "TUP"


def test_lean_needs_the_hips_in_view():
    hidden = analyze(syn.FRONT, world_pose(sagittal_deg=20))
    assert hidden["measurements"]["trunk_lean"] is None
    shown = analyze(syn.FRONT, world_pose(sagittal_deg=20), vis=FRONT_VIS)
    assert shown["measurements"]["trunk_lean"] == "TLF"
    assert any(n.startswith("Body Lean") for n in names(shown))


def test_side_view_neck_angle_rises_when_the_head_moves_back():
    forward = analyze(syn.side_profile(tuck_px=0), view="side", vis=syn.SIDE_VIS)["measurements"]
    back = analyze(syn.side_profile(tuck_px=30), view="side", vis=syn.SIDE_VIS)["measurements"]
    assert forward["side_on"] and back["side_on"]
    assert back["neck_angle_deg"] - forward["neck_angle_deg"] > 5


def test_side_view_rejects_facing_the_camera():
    r = analyze(syn.FRONT, view="side")
    assert r["measurements"]["side_on"] is False and r["measurements"]["neck_angle_deg"] is None
