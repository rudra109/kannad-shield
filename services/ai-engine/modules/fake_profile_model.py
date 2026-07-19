"""
Module 2 — Fake Profile Classifier
Closes official requirement 4c (fake profile detection).

Model: XGBoost over 9 profile metadata features.
Human-in-the-loop: score is a risk signal — not an automatic block or ban.
"""

import re
import os
from pathlib import Path

import pandas as pd
import xgboost as xgb
import joblib

MODEL_PATH = Path(__file__).parent.parent / "models" / "fake_profile_xgb.joblib"

FEATURE_COLS = [
    "account_age_days",
    "follower_count",
    "following_count",
    "follower_following_ratio",
    "posts_per_day",
    "bio_length",
    "has_profile_photo",
    "reused_photo_hash_match",
    "default_username_pattern",
]

# Numeric-suffix username pattern (e.g. john1234, user9876) — common in bot/fake accounts
_DEFAULT_USERNAME_RE = re.compile(r"^[a-zA-Z]+\d{4,}$")


def build_features(profile: dict) -> dict:
    """
    Map a raw profile dict to the fixed feature vector.

    Expected profile keys (all optional, default to 0/False if missing):
      account_age_days, follower_count, following_count, post_count,
      bio (str), has_profile_photo (bool), reused_photo_hash_match (bool),
      username (str)
    """
    followers = max(profile.get("follower_count", 0), 1)
    following = max(profile.get("following_count", 0), 1)
    age_days = max(profile.get("account_age_days", 1), 1)

    return {
        "account_age_days": profile.get("account_age_days", 0),
        "follower_count": profile.get("follower_count", 0),
        "following_count": profile.get("following_count", 0),
        "follower_following_ratio": round(followers / following, 4),
        "posts_per_day": round(profile.get("post_count", 0) / age_days, 4),
        "bio_length": len(profile.get("bio", "") or ""),
        "has_profile_photo": int(bool(profile.get("has_profile_photo", False))),
        # reused_photo_hash_match: set by reverse-image lookup in the calling service
        "reused_photo_hash_match": int(bool(profile.get("reused_photo_hash_match", False))),
        "default_username_pattern": int(
            bool(_DEFAULT_USERNAME_RE.match(profile.get("username", "") or ""))
        ),
    }


def train(
    csv_path: str = "data/fake_profiles.csv",
    out_path: str = str(MODEL_PATH),
) -> xgb.XGBClassifier:
    """
    Train XGBoost on labelled profile data.
    CSV must have columns matching FEATURE_COLS + 'label' (0=real, 1=fake).
    """
    df = pd.read_csv(csv_path)
    model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        eval_metric="logloss",
        use_label_encoder=False,
        random_state=42,
    )
    model.fit(df[FEATURE_COLS], df["label"])
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(model, out_path)
    acc = model.score(df[FEATURE_COLS], df["label"])
    print(f"[fake_profile] Saved -> {out_path}  |  train accuracy = {acc:.3f}")
    return model


def load_model(path: str = str(MODEL_PATH)) -> xgb.XGBClassifier:
    return joblib.load(path)


def score_profile(model: xgb.XGBClassifier, profile: dict) -> dict:
    """
    Returns a risk score (0–100) with feature breakdown for explainability.
    flag_for_review=True at threshold ≥ 60.
    """
    feats = build_features(profile)
    proba = float(model.predict_proba(pd.DataFrame([feats]))[0][1])
    top_signals = sorted(feats.items(), key=lambda kv: -abs(kv[1]))[:3]
    return {
        "risk_score": round(proba * 100, 1),
        "confidence": round(max(proba, 1 - proba), 3),
        "flag_for_review": proba >= 0.6,
        "top_signals": [k for k, _ in top_signals],
        "features": feats,
        "note": "Signal for a human reviewer — not an automatic account action.",
    }
