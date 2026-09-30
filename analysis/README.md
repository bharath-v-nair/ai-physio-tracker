# Posture model analysis

This folder is the data-science part of the AI Physio Tracker project. It checks whether the app's hand-picked
"Body Lean" rule (hip-to-shoulder line more than 5° from vertical, in `backend/app/ai/posture_analyzer.py`) is a
good detector of poor sitting posture, and whether a model trained on expert-labelled data does better.

**Research question:** *Is the app's hand-picked 5° lean rule a good detector of poor sitting posture, and does a
model trained on expert-labelled data do better?*

## Contents

| Path | What it is |
|---|---|
| `posture_model.ipynb` | the full analysis, with outputs (data description, features, methods, results, limitations, conclusion) |
| `posture_features.py` | feature calculations from MediaPipe landmarks (shared by the notebook and, later, the backend) |
| `download_data.py` | downloads the MultiPosture CSV from Zenodo and checks its checksum |
| `data/README.md` | dataset source, licence and citation (the CSV itself is not committed) |
| `models/posture_lean_model.joblib` | the chosen model (decision tree, 4 KB) |
| `models/model_card.md` | inputs, feature formulas, classes, metrics, limitations |
| `figures/*.png` | plots for the report and slides |
| `results.json` | all key numbers from the notebook |
| `requirements.txt` | pinned package versions (Python 3.11) |

## How to reproduce

From the repository root (Python 3.11; `uv` is optional, plain `python -m venv` + `pip` also works):

```bash
uv venv --python 3.11 ../.venv-analysis
source ../.venv-analysis/bin/activate
uv pip install -r analysis/requirements.txt

python analysis/download_data.py
cd analysis
jupyter nbconvert --to notebook --execute --inplace posture_model.ipynb
```

The notebook takes about 8 minutes on a laptop (most of it is the nested cross-validation of the random forests).
All random seeds are fixed, so the scores come out the same; only the timing numbers change between runs.

## Method in one paragraph

MultiPosture has 4,794 frames from 13 people, with MediaPipe world landmarks and expert labels for upper-body
posture (upright, leaning forward, backward, left, right). Every method is scored with **leave-one-subject-out**
cross-validation: train on 12 people, test on the 13th, repeat 13 times. Thresholds, scaling and hyper-parameters are
learned only from the training people in each fold. The app rule is mapped to the 5 classes as: deviation <= 5° ->
upright, otherwise left or right lean by the side the shoulders move to (it cannot output forward/back). The main
metric is macro-F1, because the classes are imbalanced.

## Headline results (leave-one-subject-out, 13 unseen participants)

| Method | Macro-F1 (pooled) | Macro-F1 per participant (mean ± SD) | Accuracy | Binary F1 (poor posture) |
|---|---|---|---|---|
| Majority class | 0.113 | 0.110 ± 0.035 | 0.396 | 0.797 |
| **App rule, 5° (current)** | **0.417** | 0.436 ± 0.043 | 0.457 | 0.546 |
| App rule, threshold learned (median 14.75°) | 0.494 | 0.496 ± 0.069 | 0.504 | 0.427 |
| Learned 3-threshold rule (sideways + forward/back, 3D) | 0.990 | 0.991 ± 0.018 | 0.993 | 0.995 |
| Logistic regression, 8 engineered features | 0.973 | 0.974 ± 0.038 | 0.981 | 0.993 |
| **Decision tree, 8 engineered features (saved model)** | **0.995** | 0.996 ± 0.008 | 0.996 | 0.999 |
| Random forest, 8 engineered features | 0.995 | 0.996 ± 0.008 | 0.996 | 0.999 |
| Random forest, engineered + 45 raw coordinates | 0.995 | 0.995 ± 0.008 | 0.996 | 0.998 |

Other findings (all in the notebook):

* The 5° rule gives a false "Body Lean" warning on 16.4% of upright frames and never recognises forward or backward
  lean (81% of forward-lean frames are called upright). Better models beat it for all 13 participants
  (Wilcoxon signed-rank, p = 0.0002).
* Learning the threshold alone (about 15°) helps only a little: the real problem is that a 2D angle cannot see
  forward/back lean. With x and y only, even a random forest reaches just 0.66 macro-F1; the depth (z) from
  MediaPipe world landmarks is what makes the difference.
* A random 80/20 frame split overstates macro-F1 by 0.4-6.0 points compared with leave-one-subject-out (largest for
  1-nearest-neighbour on raw coordinates: 0.975 vs 0.914).
* The app's aspect-ratio bug means that "5°" is really about 6.7° on a 4:3 frame and 8.8° on 16:9.
* **Caution:** the forward/back labels in the dataset stop sharply at ±10° of trunk angle, so the near-perfect scores
  partly reflect the model recovering the labelling criterion. They are an upper bound for real use, not a promise
  for a laptop webcam.
* For comparison, the dataset authors report upper-body LOSO accuracy of 93.87% (MLP) and 97.03% (KAN); the set-ups
  differ, so this is not a like-for-like comparison.

## Citation

Dataset (CC BY 4.0):
Carneros-Prado, D., Cabañero-Gómez, L., Fontecha, J., Hervás, R., González-Díaz, I., & Johnson, E. (2024).
*MultiPosture: A dataset of body joints keypoints extracted using MediaPipe for multi-task sitting posture recognition
with upper and lower body labels* [Data set]. Zenodo. https://doi.org/10.5281/zenodo.14230872

Paper:
Carneros-Prado, D., Cabañero-Gómez, L., Johnson, E., González, I., Fontecha, J., & Hervás, R. (2024). A comparison
between multilayer perceptrons and Kolmogorov-Arnold networks for multi-task classification in sitting posture
recognition. *IEEE Access, 12*, 180198-180209. https://doi.org/10.1109/ACCESS.2024.3510034
