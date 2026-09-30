"""
Checks that the rules in backend/app/ai/posture_model.py give exactly the same prediction
as the saved decision tree for every frame of the MultiPosture dataset.

Run from the analysis folder: python check_backend_rules.py
"""
import sys
from pathlib import Path

import joblib
import pandas as pd

from posture_features import features_from_dataframe

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from app.ai.posture_model import classify_trunk  # noqa: E402

df = pd.read_csv(Path(__file__).parent / "data" / "data.csv")
bundle = joblib.load(Path(__file__).parent / "models" / "posture_lean_model.joblib")
X = features_from_dataframe(df)
tree = bundle["model"].predict(X[bundle["feature_names"]])
rules = [classify_trunk(lat, sag) for lat, sag in zip(X["trunk_lateral_deg"], X["trunk_sagittal_deg"])]
mismatches = sum(a != b for a, b in zip(tree, rules))
print(f"{len(rules)} frames, {mismatches} mismatches")
sys.exit(1 if mismatches else 0)
