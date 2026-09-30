"""
Synthetic MediaPipe landmark sequences for testing the live exercise counters.

Poses are built in pixels on a 1280x720 frame, then normalised to 0-1 like MediaPipe.
Each movement is described as a timeline of (seconds, amount) keyframes and sampled at 10 fps,
with a little random jitter, so the tests exercise smoothing, holds and thresholds.
"""
import math
import random

W, H = 1280, 720
FPS = 10

# Front view, seated at a laptop (pixels). Index = MediaPipe landmark id.
FRONT = {
    0: (640, 250), 1: (655, 235), 2: (665, 233), 3: (675, 235), 4: (625, 235), 5: (615, 233), 6: (605, 235),
    7: (700, 250), 8: (580, 250), 9: (652, 285), 10: (628, 285),
    11: (770, 400), 12: (510, 400), 13: (800, 560), 14: (480, 560), 15: (810, 690), 16: (470, 690),
    17: (815, 700), 18: (465, 700), 19: (812, 702), 20: (468, 702), 21: (806, 698), 22: (474, 698),
    23: (720, 700), 24: (560, 700), 25: (725, 715), 26: (555, 715), 27: (728, 718), 28: (552, 718),
    29: (728, 719), 30: (552, 719), 31: (735, 719), 32: (545, 719),
}
HEAD = range(0, 11)
HIDDEN = {23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 15, 16, 17, 18, 19, 20, 21, 22}


def normalise(points, visibility=None, scale=1.0, jitter=1.5, rng=None):
    rng = rng or random.Random(0)
    cx, cy = W / 2, H / 2
    out = []
    for i in range(33):
        x, y = points[i]
        x, y = cx + (x - cx) * scale, cy + (y - cy) * scale
        x += rng.gauss(0, jitter)
        y += rng.gauss(0, jitter)
        vis = (visibility or {}).get(i, 0.3 if i in HIDDEN else 0.95)
        out.append({"x": x / W, "y": y / H, "z": 0.0, "visibility": vis})
    return out


def rotate(p, pivot, degrees):
    a = math.radians(degrees)
    x, y = p[0] - pivot[0], p[1] - pivot[1]
    return (pivot[0] + x * math.cos(a) - y * math.sin(a), pivot[1] + x * math.sin(a) + y * math.cos(a))


def timeline(keyframes, fps=FPS):
    """keyframes: [(seconds_from_previous, amount), ...] with linear ramps. Yields (t, amount)."""
    t, prev = 0.0, keyframes[0][1]
    for dur, amount in keyframes:
        steps = max(1, int(round(dur * fps)))
        for k in range(1, steps + 1):
            yield t + k / fps, prev + (amount - prev) * k / steps
        t += dur
        prev = amount


def reps(n, up, hold, down=1.0, rest=1.5, amount=1.0, start=3.5):
    """Neutral for `start` s (calibration), then n reps: ramp up, hold, ramp down, rest."""
    k = [(start, 0.0)]
    for _ in range(n):
        k += [(up, amount), (hold, amount), (down, 0.0), (rest, 0.0)]
    return k


# --- Poses -------------------------------------------------------------------

def side_bend(amount_deg, yaw_shift=0.0):
    """Head tilted towards a shoulder by amount_deg around the base of the neck."""
    pivot = (640, 330)
    P = dict(FRONT)
    for i in HEAD:
        P[i] = rotate(FRONT[i], pivot, amount_deg)
    if yaw_shift:
        P[0] = (P[0][0] + yaw_shift, P[0][1])
    return P


def whole_body_lean(amount_deg):
    """Head and shoulders tilt together (leaning the whole body), not a neck stretch."""
    pivot = (640, 700)
    P = dict(FRONT)
    for i in list(HEAD) + [11, 12, 13, 14]:
        P[i] = rotate(FRONT[i], pivot, amount_deg)
    return P


def wall_angel(elev_left, elev_right=None, shoulder_y=470):
    """Upper-arm elevation from straight down (0) through the W (~90) to the Y (~140+)."""
    elev_right = elev_left if elev_right is None else elev_right
    P = {i: (x, y + (shoulder_y - 400)) for i, (x, y) in FRONT.items()}
    P = {i: (640 + (x - 640) * 0.7, 360 + (y - 360) * 0.7) for i, (x, y) in P.items()}
    for s_id, e_id, w_id, side, elev in ((11, 13, 15, 1, elev_left), (12, 14, 16, -1, elev_right)):
        S = P[s_id]
        a = math.radians(elev)
        E = (S[0] + side * 90 * math.sin(a), S[1] + 90 * math.cos(a))
        Wr = (E[0] + side * 10, E[1] - 80)
        P[e_id], P[w_id] = E, Wr
        for h in ((17, 19, 21) if side == 1 else (18, 20, 22)):
            P[h] = (Wr[0], Wr[1] - 10)
    return P


def shrug(lift_fraction, left_only=False):
    """Shoulders (and arms) raised by lift_fraction of shoulder width."""
    width = FRONT[11][0] - FRONT[12][0]
    P = dict(FRONT)
    for ids, on in (((11, 13), True), ((12, 14), not left_only)):
        if on:
            for i in ids:
                P[i] = (P[i][0], P[i][1] - lift_fraction * width)
    return P


# Side view: user faces image-right, sitting sideways to the laptop
SIDE_EAR, SIDE_SHOULDER = (620, 260), (560, 420)


def side_profile(tuck_px=0.0, nod_deg=0.0, trunk_shift=0.0):
    ear = (SIDE_EAR[0] - tuck_px + trunk_shift, SIDE_EAR[1])
    head = {0: (ear[0] + 95, ear[1] + 15), 3: (ear[0] + 70, ear[1] - 12), 2: (ear[0] + 72, ear[1] - 12),
            1: (ear[0] + 74, ear[1] - 12), 6: (ear[0] + 70, ear[1] - 10), 5: (ear[0] + 72, ear[1] - 10),
            4: (ear[0] + 74, ear[1] - 10), 7: ear, 8: (ear[0] + 5, ear[1]), 9: (ear[0] + 80, ear[1] + 40),
            10: (ear[0] + 80, ear[1] + 42)}
    if nod_deg:
        head = {i: rotate(p, ear, nod_deg) for i, p in head.items()}
    sx = SIDE_SHOULDER[0] + trunk_shift
    body = {11: (sx, SIDE_SHOULDER[1]), 12: (sx + 8, SIDE_SHOULDER[1] + 4), 13: (sx + 10, 560), 14: (sx + 15, 565),
            15: (sx + 90, 600), 16: (sx + 95, 605)}
    P = dict(FRONT)
    P.update(head)
    P.update(body)
    return P


# Wall angels: arms up, so the wrists are in view
WALL_VIS = {15: 0.95, 16: 0.95}

SIDE_VIS = {8: 0.3, 12: 0.4, 14: 0.4, 16: 0.4, 4: 0.4, 5: 0.4, 6: 0.4}


def run(analyzer, keyframes, pose_fn, visibility=None, scale_fn=None, drop=None, seed=0):
    """Feed a movement to an analyser. Returns the list of results."""
    rng = random.Random(seed)
    results = []
    for t, amount in timeline(keyframes):
        if drop and drop[0] <= t < drop[1]:
            lms = normalise(pose_fn(amount), {i: 0.1 for i in range(33)}, rng=rng)
        else:
            scale = scale_fn(t) if scale_fn else 1.0
            lms = normalise(pose_fn(amount), visibility, scale=scale, rng=rng)
        results.append(analyzer.analyze(lms, {"width": W, "height": H}, t))
    return results
