"""
One-shot training script — trains and saves all ML models.

Usage:
  cd services/ai-engine
  python seed_data.py          # generate training data first
  python train_all.py          # train all models

After this, `uvicorn main:app --reload --port 4002` starts the full AI engine.
"""

import os
import sys

# Ensure the working directory is services/ai-engine so relative paths work
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("AI/ML Threat Engine - Training All Models")
print("=" * 60)

errors = []


def _run(name: str, fn):
    try:
        print(f"\n[{name}] Training...")
        fn()
        print(f"[{name}] OK")
    except Exception as exc:
        print(f"[{name}] FAILED: {exc}")
        errors.append((name, str(exc)))


# ---------------------------------------------------------------------------
# 1. Phishing URL Classifier
# ---------------------------------------------------------------------------
def train_phishing():
    from modules.phishing_model import train
    if not os.path.exists("data/phishing_urls.csv"):
        raise FileNotFoundError("data/phishing_urls.csv not found — run seed_data.py first.")
    train(csv_path="data/phishing_urls.csv", out_path="models/phishing_xgb.joblib")


_run("phishing_classifier", train_phishing)


# ---------------------------------------------------------------------------
# 2. Fake Profile Classifier
# ---------------------------------------------------------------------------
def train_fake_profile():
    from modules.fake_profile_model import train
    if not os.path.exists("data/fake_profiles.csv"):
        raise FileNotFoundError("data/fake_profiles.csv not found — run seed_data.py first.")
    train(csv_path="data/fake_profiles.csv", out_path="models/fake_profile_xgb.joblib")


_run("fake_profile_classifier", train_fake_profile)


# ---------------------------------------------------------------------------
# 3. Predictive Heat-Map
# ---------------------------------------------------------------------------
def train_heatmap():
    from modules.heatmap_model import train
    import pandas as pd
    import numpy as np

    if not os.path.exists("data/sample_incidents_geo.csv"):
        raise FileNotFoundError("data/sample_incidents_geo.csv not found — run seed_data.py first.")

    # Add cyclic time features if not already present
    df = pd.read_csv("data/sample_incidents_geo.csv")
    if "hour_sin" not in df.columns:
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
        df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
        df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
        df.to_csv("data/sample_incidents_geo.csv", index=False)

    train(csv_path="data/sample_incidents_geo.csv", out_path="models/heatmap_xgb.joblib")


_run("heatmap_model", train_heatmap)


# ---------------------------------------------------------------------------
# 3.5. ARIMA Pattern Forecasting Model
# ---------------------------------------------------------------------------
def train_arima():
    from modules.arima_model import train
    if not os.path.exists("data/daily_incidents.csv"):
        raise FileNotFoundError("data/daily_incidents.csv not found — run seed_data.py first.")
    train(csv_path="data/daily_incidents.csv", out_path="models/arima_forecast.joblib")

_run("arima_forecast_model", train_arima)


# ---------------------------------------------------------------------------
# 4. NLP Model (verify via subprocess — avoids XGBoost->PyTorch DLL conflict on Windows)
# ---------------------------------------------------------------------------
def verify_nlp():
    import subprocess
    print("  Verifying NLP model load in isolated subprocess (avoids Windows DLL conflict)...")
    result = subprocess.run(
        [sys.executable, "-c",
         "import sys; sys.path.insert(0,'.');  "
         "from modules.harassment_nlp import score_message; "
         "r = score_message('You are in danger.'); "
         "print(f'  Test inference: toxicity_score={r[\"toxicity_score\"]}')"],
        capture_output=True, text=True, cwd=os.path.dirname(os.path.abspath(__file__))
    )
    if result.stdout:
        print(result.stdout.strip())
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "NLP subprocess failed")


_run("nlp_harassment_model", verify_nlp)


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n" + "=" * 60)
if errors:
    print(f"Training complete with {len(errors)} error(s):")
    for name, err in errors:
        print(f"  FAIL {name}: {err}")
    print("\nNon-critical errors above (e.g. face_recognition not installed) don't")
    print("prevent the other endpoints from running.")
else:
    print("All models trained and saved successfully!")
print("=" * 60)
print("\nNext: uvicorn main:app --reload --port 4002")
print("  API docs: http://localhost:4002/docs")
