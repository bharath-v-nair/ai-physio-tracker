"""Posture features computed from MediaPipe Pose landmarks.

The same functions are used in the notebook (on the MultiPosture CSV) and can be
copied into the backend so that the app computes exactly the features the model
was trained on.

Coordinate convention (MediaPipe *world* landmarks, which is what MultiPosture
stores): metres, origin at the midpoint of the hips,
    x -> towards the image right (the person's LEFT when they face the camera),
    y -> down,
    z -> away from the camera (negative z = closer to the camera).
"""
import math

import numpy as np
import pandas as pd

# MediaPipe Pose landmark indices (33-point model)
NOSE = 0
LEFT_EAR, RIGHT_EAR = 7, 8
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_HIP, RIGHT_HIP = 23, 24

LANDMARK_NAMES = [
    "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner",
    "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left",
    "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index",
    "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel",
    "right_heel", "left_foot_index", "right_foot_index",
]

# Engineered features, in the exact order the saved model expects.
FEATURE_NAMES = [
    "trunk_lateral_deg",      # + = trunk leans to the person's left
    "trunk_sagittal_deg",     # + = trunk leans forward (towards the camera)
    "shoulder_tilt_deg",      # + = left shoulder lower than right
    "shoulder_rotation_deg",  # + = left shoulder further from camera than right
    "torso_height_ratio",     # vertical hip-to-shoulder distance / shoulder width
    "head_lateral_ratio",     # ear midpoint left/right of shoulder midpoint / shoulder width
    "head_height_ratio",      # ear midpoint height above shoulder midpoint / shoulder width
    "head_forward_ratio",     # ear midpoint in front of shoulder midpoint / shoulder width
]

# Upper-body landmarks used for the "raw coordinates" feature set
# (face, shoulders and hips; arms and legs are left out on purpose).
RAW_LANDMARKS = LANDMARK_NAMES[:13] + ["left_hip", "right_hip"]
RAW_FEATURE_NAMES = [f"{n}_{a}" for n in RAW_LANDMARKS for a in "xyz"]


def _features_from_arrays(nose, l_ear, r_ear, l_sh, r_sh, l_hip, r_hip):
    """All inputs are (n, 3) arrays of x, y, z world coordinates."""
    sh = (l_sh + r_sh) / 2
    hip = (l_hip + r_hip) / 2
    ear = (l_ear + r_ear) / 2
    torso = sh - hip                      # hip midpoint -> shoulder midpoint
    up = -torso[:, 1]                     # y points down, so "up" is -y
    shoulder_vec = l_sh - r_sh
    sw = np.linalg.norm(shoulder_vec, axis=1)  # 3D shoulder width (metres)

    return np.column_stack([
        # lateral lean: angle of the trunk out of the sagittal plane (bounded +-90 deg)
        np.degrees(np.arctan2(torso[:, 0], np.hypot(up, torso[:, 2]))),
        # forward/back lean: angle of the trunk in the y-z plane
        np.degrees(np.arctan2(-torso[:, 2], up)),
        np.degrees(np.arctan2(shoulder_vec[:, 1], shoulder_vec[:, 0])),
        np.degrees(np.arctan2(shoulder_vec[:, 2], shoulder_vec[:, 0])),
        up / sw,
        (ear[:, 0] - sh[:, 0]) / sw,
        (sh[:, 1] - ear[:, 1]) / sw,
        (sh[:, 2] - ear[:, 2]) / sw,
    ])


def features_from_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Engineered features for every row of a MultiPosture-style dataframe."""
    def P(name):
        return df[[f"{name}_x", f"{name}_y", f"{name}_z"]].to_numpy(dtype=float)

    X = _features_from_arrays(
        P("nose"), P("left_ear"), P("right_ear"),
        P("left_shoulder"), P("right_shoulder"), P("left_hip"), P("right_hip"),
    )
    return pd.DataFrame(X, columns=FEATURE_NAMES, index=df.index)


def features_from_landmarks(world_landmarks) -> np.ndarray:
    """Engineered features for ONE frame.

    world_landmarks: list of 33 items, each a dict with keys x, y, z (or an object
    with .x .y .z attributes), taken from MediaPipe `pose_world_landmarks`.
    Returns a (1, 8) array in FEATURE_NAMES order.
    """
    def get(i):
        lm = world_landmarks[i]
        if isinstance(lm, dict):
            return np.array([[lm["x"], lm["y"], lm["z"]]], dtype=float)
        return np.array([[lm.x, lm.y, lm.z]], dtype=float)

    return _features_from_arrays(
        get(NOSE), get(LEFT_EAR), get(RIGHT_EAR),
        get(LEFT_SHOULDER), get(RIGHT_SHOULDER), get(LEFT_HIP), get(RIGHT_HIP),
    )


def app_torso_deviation(mid_hip_xy, mid_shoulder_xy) -> float:
    """Re-implementation of the app's current 'Body Lean' measure
    (backend/app/ai/posture_analyzer.py): |90 - |slope angle of hip->shoulder||."""
    dx = mid_shoulder_xy[0] - mid_hip_xy[0]
    dy = mid_shoulder_xy[1] - mid_hip_xy[1]
    return abs(90 - abs(math.degrees(math.atan2(dy, dx))))
