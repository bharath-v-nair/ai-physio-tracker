# Model card: trunk lean classifier (`posture_lean_model.joblib`)

## What it does
Classifies the **trunk posture** of a seated person in one video frame into one of five classes, using MediaPipe Pose
landmarks. It is meant to replace the hand-picked "Body Lean" rule (torso angle > 5°) in
`backend/app/ai/posture_analyzer.py`.

| Class | Meaning |
|---|---|
| `TUP` | upright trunk |
| `TLF` | trunk leaning forward (towards the camera) |
| `TLB` | trunk leaning backward |
| `TLL` | trunk leaning to the person's left |
| `TLR` | trunk leaning to the person's right |

`model.classes_` is in alphabetical order: `['TLB', 'TLF', 'TLL', 'TLR', 'TUP']` (this is the column order of `predict_proba`).

It does **not** detect forward head posture, rounded shoulders or neck flexion.

## Model
* scikit-learn 1.9.1 `DecisionTreeClassifier(max_depth=4, min_samples_leaf=1, class_weight="balanced", random_state=42)`,
  7 leaves. Depth and leaf size were chosen by leave-one-subject-out cross-validation.
* The file is a `joblib` dictionary:

| Key | Content |
|---|---|
| `model` | the fitted tree |
| `feature_names` | the 8 input names, in order (below) |
| `classes` | class codes, in `predict_proba` column order |
| `class_descriptions` | code -> plain name |
| `input`, `feature_code`, `training_data` | short notes |
| `loso_macro_f1_pooled` | 0.995 |
| `sklearn_version` | version used to train (load with the same version) |

In practice the tree reduces to a handful of cut-offs (the other splits lead to the same class on both sides):

```
trunk_lateral_deg  <= -8.9            -> TLR
trunk_lateral_deg  >  14.2            -> TLL
otherwise: trunk_sagittal_deg <= -10.0 -> TLB
           trunk_sagittal_deg >  10.0  -> TLF
           else                        -> TUP
```

## Inputs (exact order)
The model expects **MediaPipe Pose world landmarks** (`results.pose_world_landmarks`, 33 points, metres, origin at
the hip midpoint), **not** the normalised image landmarks the app currently uses. From them, 8 features are
computed with `analysis/posture_features.py` (`features_from_landmarks()`), in this order:

| # | Name | Formula (sh = shoulder midpoint, hip = hip midpoint, ear = ear midpoint, t = sh - hip, up = -t.y, sw = 3D distance between shoulders) |
|---|---|---|
| 1 | `trunk_lateral_deg` | `degrees(atan2(t.x, hypot(up, t.z)))`, + = person's left |
| 2 | `trunk_sagittal_deg` | `degrees(atan2(-t.z, up))`, + = forward (towards camera) |
| 3 | `shoulder_tilt_deg` | `degrees(atan2(L.y - R.y, L.x - R.x))` for left/right shoulder |
| 4 | `shoulder_rotation_deg` | `degrees(atan2(L.z - R.z, L.x - R.x))` |
| 5 | `torso_height_ratio` | `up / sw` |
| 6 | `head_lateral_ratio` | `(ear.x - sh.x) / sw` |
| 7 | `head_height_ratio` | `(sh.y - ear.y) / sw` |
| 8 | `head_forward_ratio` | `(sh.z - ear.z) / sw` |

Landmark indices: nose 0, left/right ear 7/8, left/right shoulder 11/12, left/right hip 23/24.
World axes: +x = image right (the person's left when facing the camera), +y = down, +z = away from the camera.

Example:

```python
import joblib, pandas as pd
from posture_features import features_from_landmarks, FEATURE_NAMES

bundle = joblib.load("analysis/models/posture_lean_model.joblib")
x = pd.DataFrame(features_from_landmarks(world_landmarks), columns=bundle["feature_names"])
label = bundle["model"].predict(x)[0]            # e.g. "TLF"
proba = bundle["model"].predict_proba(x)[0]      # columns follow bundle["classes"]
```

Per-frame predictions will flicker; smoothing over the last ~15 frames (majority vote) is recommended.

## Training data
MultiPosture (Carneros-Prado et al., 2024): 4,794 frames from 13 adults sitting in front of a camera at home,
MediaPipe Pose (Heavy) world landmarks, upper-body posture labelled by experts. Class counts: TUP 1,615, TLF 1,897,
TLB 442, TLL 420, TLR 420. The final model was trained on all 13 participants.

## Evaluation (leave-one-subject-out, 13 folds, tuning inside the training folds)

| Metric | Value |
|---|---|
| Macro-F1, pooled | 0.995 |
| Macro-F1 per participant, mean ± SD | 0.996 ± 0.008 |
| Accuracy | 0.996 |
| Binary "poor posture" F1 (any lean vs upright) | 0.999 |
| App's current 5° rule, macro-F1 (same protocol) | 0.417 |

Per class (pooled LOSO): TUP P 1.000 / R 0.995; TLF P 0.993 / R 1.000; TLB P 0.995 / R 1.000;
TLL P 0.993 / R 0.974; TLR P 1.000 / R 1.000.

Inference: about 0.5 ms per frame (feature computation + `predict_proba`, median, Apple-silicon laptop).

## Limitations and cautions
* Only 13 participants; staged, fairly clear postures.
* The forward/back labels in the dataset have a sharp edge at ±10° of trunk angle, so the model mostly recovers
  that criterion. Scores on subtle, real-life slouching will be lower.
* Recorded with the whole seated body visible at roughly 1-2 m. With a laptop webcam the hips may be hidden, which
  makes hip-based features unreliable; check landmark visibility before trusting a prediction.
* Needs the depth (z) from world landmarks; with x, y only the same approach scored about 0.64-0.66 macro-F1.
* Not a medical device and not a forward-head-posture detector.

## Licence and citation
The training data is licensed CC BY 4.0. Please cite:

* Carneros-Prado, D., Cabañero-Gómez, L., Fontecha, J., Hervás, R., González-Díaz, I., & Johnson, E. (2024).
  MultiPosture [Data set]. Zenodo. https://doi.org/10.5281/zenodo.14230872
* Carneros-Prado, D. et al. (2024). A comparison between multilayer perceptrons and Kolmogorov-Arnold networks for
  multi-task classification in sitting posture recognition. *IEEE Access, 12*, 180198-180209.
  https://doi.org/10.1109/ACCESS.2024.3510034
