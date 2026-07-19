"""
Module 7 — Predictive Heat-Map Model
Official bonus item: AI-based unsafe-zone prediction.

Uses XGBoost on incident geodata (lat/lng + time/day features) to score risk
for each grid cell in the city map. The police dashboard overlays these scores
as a heat-map so patrols can be pre-positioned.

For the hackathon demo we use seed incident data from data/sample_incidents_geo.csv.
In production, wire to the live incidents table in PostgreSQL.
"""

from __future__ import annotations
import os
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

try:
    import xgboost as xgb
    _XGB_AVAILABLE = True
except ImportError:
    _XGB_AVAILABLE = False

MODEL_PATH = Path(__file__).parent.parent / "models" / "heatmap_xgb.joblib"

# Ahmedabad city bounding box (approx.)
CITY_BOUNDS = {
    "lat_min": 22.90, "lat_max": 23.15,
    "lng_min": 72.45, "lng_max": 72.70,
}
GRID_STEPS = 20   # 20×20 = 400 grid cells


def _time_features(hour: int, day_of_week: int) -> dict:
    """Cyclic time encoding (sin/cos) so the model understands midnight wrap-around."""
    return {
        "hour_sin": float(np.sin(2 * np.pi * hour / 24)),
        "hour_cos": float(np.cos(2 * np.pi * hour / 24)),
        "dow_sin": float(np.sin(2 * np.pi * day_of_week / 7)),
        "dow_cos": float(np.cos(2 * np.pi * day_of_week / 7)),
    }


def _extract_features(lat: float, lng: float, hour: int = 20, day_of_week: int = 4) -> dict:
    """Combine geo + time features for a single grid cell."""
    feats = {
        "lat": lat,
        "lng": lng,
        "hour": hour,
        "day_of_week": day_of_week,
    }
    feats.update(_time_features(hour, day_of_week))
    return feats


FEATURE_COLS = list(_extract_features(23.0, 72.5).keys())


def train(
    csv_path: str = "data/sample_incidents_geo.csv",
    out_path: str = str(MODEL_PATH),
):
    """
    Train XGBoost on historical incident geodata.
    CSV must have: lat, lng, hour, day_of_week, label (0=safe, 1=incident)
    """
    if not _XGB_AVAILABLE:
        raise RuntimeError("xgboost is required. pip install xgboost")
    df = pd.read_csv(csv_path)
    for h_col in ["hour_sin", "hour_cos", "dow_sin", "dow_cos"]:
        if h_col not in df.columns:
            df = df.copy()
            if "hour" in df.columns and "day_of_week" in df.columns:
                tf = pd.DataFrame([
                    _time_features(int(r["hour"]), int(r["day_of_week"]))
                    for _, r in df.iterrows()
                ])
                df = pd.concat([df, tf], axis=1)
            break
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        eval_metric="logloss",
        use_label_encoder=False,
        random_state=42,
    )
    model.fit(df[FEATURE_COLS], df["label"])
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(model, out_path)
    acc = model.score(df[FEATURE_COLS], df["label"])
    print(f"[heatmap] Saved -> {out_path}  |  train accuracy = {acc:.3f}")
    return model


def load_model(path: str = str(MODEL_PATH)):
    return joblib.load(path)


def predict_grid(model, hour: int = 20, day_of_week: int = 4) -> list[dict]:
    """
    Score all grid cells across the city for a given time of day/week.
    Returns a list of {lat, lng, risk_score} dicts for the heat-map overlay.
    """
    lats = np.linspace(CITY_BOUNDS["lat_min"], CITY_BOUNDS["lat_max"], GRID_STEPS)
    lngs = np.linspace(CITY_BOUNDS["lng_min"], CITY_BOUNDS["lng_max"], GRID_STEPS)

    rows = []
    for lat in lats:
        for lng in lngs:
            rows.append(_extract_features(float(lat), float(lng), hour, day_of_week))

    df = pd.DataFrame(rows)
    probas = model.predict_proba(df[FEATURE_COLS])[:, 1]

    return [
        {"lat": round(r["lat"], 5), "lng": round(r["lng"], 5), "risk_score": round(float(p) * 100, 1)}
        for r, p in zip(rows, probas)
    ]
