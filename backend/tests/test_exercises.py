"""
Tests for the live exercise counters, using synthetic landmark sequences (tests/synthetic.py).
Each counter must count correct reps and ignore the common ways a movement is faked or goes wrong.
"""
from app.ai.exercises import (ChinTucksAnalyzer, NeckSideBendAnalyzer, ShoulderShrugsAnalyzer,
                              WallAngelsAnalyzer, ExerciseFactory)
from app.ai.exercises.exercise_factory import UnsupportedExerciseAnalyzer
from tests import synthetic as syn


def final(results):
    return results[-1]


def feedbacks(results):
    return {r["feedback"] for r in results}


# --- Neck side-bend (front view) --------------------------------------------

def test_side_bend_counts_each_side():
    keys = syn.reps(2, up=1.5, hold=6, amount=30) + [(1.5, -30), (6, -30), (1.5, 0), (1.5, 0)]
    r = final(syn.run(NeckSideBendAnalyzer(), keys, syn.side_bend))
    assert r["reps"] == 3
    assert sorted(r["reps_by_side"].values()) == [1, 2]


def test_side_bend_needs_the_hold():
    r = final(syn.run(NeckSideBendAnalyzer(), syn.reps(3, up=1, hold=2, amount=30), syn.side_bend))
    assert r["reps"] == 0
    assert r["phase"] == "active"


def test_side_bend_ignores_leaning_the_whole_body():
    r = final(syn.run(NeckSideBendAnalyzer(), syn.reps(3, up=1.5, hold=6, amount=20), syn.whole_body_lean))
    assert r["reps"] == 0
    assert r["phase"] == "active"


def test_side_bend_flags_turning_instead_of_tilting():
    res = syn.run(NeckSideBendAnalyzer(), syn.reps(1, up=1.5, hold=6, amount=30),
                  lambda a: syn.side_bend(a, yaw_shift=60 * a / 30))
    assert "Tilt your head sideways. Don't turn it." in feedbacks(res)


def test_side_bend_ignores_camera_distance():
    r = final(syn.run(NeckSideBendAnalyzer(), [(3.5, 0), (10, 0)], syn.side_bend,
                      scale_fn=lambda t: 1.0 + 0.03 * max(0, t - 3.5)))
    assert r["reps"] == 0
    assert r["phase"] == "active"


# --- Wall angels (front view) -------------------------------------------------

def wall(a):
    return syn.wall_angel(90 + 55 * a)


def test_wall_angels_count_w_to_y():
    r = final(syn.run(WallAngelsAnalyzer(), syn.reps(4, up=1.5, hold=1, down=1.5), wall, visibility=syn.WALL_VIS))
    assert r["reps"] == 4
    assert r["form_score"] >= 90


def test_wall_angels_need_both_arms():
    res = syn.run(WallAngelsAnalyzer(), syn.reps(3, up=1.5, hold=1, down=1.5),
                  lambda a: syn.wall_angel(90 + 55 * a, 90), visibility=syn.WALL_VIS)
    assert final(res)["reps"] == 0
    assert final(res)["phase"] == "active"


def test_wall_angels_small_raise_does_not_count():
    r = final(syn.run(WallAngelsAnalyzer(), syn.reps(3, up=1, hold=1, amount=0.4), wall, visibility=syn.WALL_VIS))
    assert r["reps"] == 0
    assert r["phase"] == "active"


def test_wall_angels_freeze_when_hands_leave_the_frame():
    res = syn.run(WallAngelsAnalyzer(), syn.reps(1, up=1.5, hold=1, down=1.5), wall, visibility=syn.WALL_VIS, drop=(4, 9))
    assert final(res)["reps"] == 0
    assert final(res)["phase"] == "active"
    assert "Step back or tilt the screen so both hands stay in view." in feedbacks(res)


# --- Shoulder shrugs (front view) ---------------------------------------------

def test_shrugs_count():
    r = final(syn.run(ShoulderShrugsAnalyzer(), syn.reps(5, up=1, hold=1.5, amount=0.12), syn.shrug))
    assert r["reps"] == 5


def test_shrugs_one_side_is_flagged_and_not_counted():
    res = syn.run(ShoulderShrugsAnalyzer(), syn.reps(3, up=1, hold=1.5, amount=0.12),
                  lambda a: syn.shrug(a, left_only=True))
    assert final(res)["reps"] == 0
    assert final(res)["phase"] == "active"
    assert "Lift both shoulders evenly." in feedbacks(res)


def test_shrugs_ignore_moving_closer_to_the_camera():
    r = final(syn.run(ShoulderShrugsAnalyzer(), [(3.5, 0), (12, 0)], syn.shrug,
                      scale_fn=lambda t: 1.0 + 0.03 * max(0, t - 3.5)))
    assert r["reps"] == 0
    assert r["phase"] == "active"


# --- Chin tucks (side view) ----------------------------------------------------

def tuck(a):
    return syn.side_profile(tuck_px=30 * a)


def test_chin_tucks_count_from_the_side():
    r = final(syn.run(ChinTucksAnalyzer(), syn.reps(4, up=1, hold=2.5), tuck, visibility=syn.SIDE_VIS))
    assert r["reps"] == 4


def test_chin_tucks_ignore_nodding():
    res = syn.run(ChinTucksAnalyzer(), syn.reps(3, up=1, hold=2.5, amount=15),
                  lambda a: syn.side_profile(nod_deg=a), visibility=syn.SIDE_VIS)
    assert final(res)["reps"] == 0
    assert final(res)["phase"] == "active"
    assert "Glide straight back. Don't nod or lift your chin." in feedbacks(res)


def test_chin_tucks_ignore_leaning_the_whole_body():
    res = syn.run(ChinTucksAnalyzer(), syn.reps(3, up=1, hold=2.5, amount=30),
                  lambda a: syn.side_profile(trunk_shift=-a), visibility=syn.SIDE_VIS)
    assert final(res)["reps"] == 0
    assert final(res)["phase"] == "active"


def test_chin_tucks_ask_to_turn_sideways_when_facing_the_camera():
    res = syn.run(ChinTucksAnalyzer(), [(5, 0)], syn.side_bend)
    assert final(res)["reps"] == 0
    assert final(res)["phase"] == "calibrating"
    assert any("shoulder points at the screen" in f or "Turn sideways" in f for f in feedbacks(res))


# --- Shared behaviour ----------------------------------------------------------

def test_calibration_comes_first():
    res = syn.run(NeckSideBendAnalyzer(), [(1, 0)], syn.side_bend)
    assert all(r["phase"] == "calibrating" for r in res)
    assert res[-1]["status"] == "Calibrating"


def test_results_include_live_plot_fields():
    r = final(syn.run(WallAngelsAnalyzer(), syn.reps(1, up=1.5, hold=1, down=1.5), wall, visibility=syn.WALL_VIS))
    assert r["reps"] == 1
    for key in ("signal", "t_hi", "t_lo", "unit", "hold_progress", "phase", "reps", "form_score", "feedback", "status"):
        assert key in r
    assert r["t_hi"] > r["t_lo"] > 0


def test_factory_maps_library_names():
    assert isinstance(ExerciseFactory.get_analyzer("Chin Tucks"), ChinTucksAnalyzer)
    assert isinstance(ExerciseFactory.get_analyzer("Neck Side-Bend Stretch"), NeckSideBendAnalyzer)
    assert isinstance(ExerciseFactory.get_analyzer("Scapular Retraction"), UnsupportedExerciseAnalyzer)
