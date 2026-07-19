"""
Tests — Fake Profile Classifier

Run: pytest tests/test_fake_profile.py -v
"""

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from modules.fake_profile_model import build_features, score_profile, load_model, MODEL_PATH

# ---------------------------------------------------------------------------
# Feature engineering tests (no model needed)
# ---------------------------------------------------------------------------

def test_build_features_empty_profile():
    feats = build_features({})
    assert isinstance(feats, dict)
    assert feats["account_age_days"] == 0
    assert feats["follower_following_ratio"] == 1.0  # 1/1 default


def test_build_features_ratio():
    feats = build_features({"follower_count": 10, "following_count": 1000})
    assert feats["follower_following_ratio"] == pytest.approx(10 / 1000, rel=1e-3)


def test_build_features_default_username():
    feats = build_features({"username": "user1234"})
    assert feats["default_username_pattern"] == 1


def test_build_features_real_username():
    feats = build_features({"username": "priya_sharma"})
    assert feats["default_username_pattern"] == 0


def test_build_features_posts_per_day():
    feats = build_features({"post_count": 100, "account_age_days": 200})
    assert feats["posts_per_day"] == pytest.approx(0.5, rel=1e-3)


# ---------------------------------------------------------------------------
# Model scoring tests (requires trained model)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def model():
    if not MODEL_PATH.exists():
        pytest.skip(f"Model not found at {MODEL_PATH} — run train_all.py first.")
    return load_model()


def test_score_profile_returns_expected_keys(model):
    result = score_profile(model, {"username": "user1234", "account_age_days": 5})
    assert "risk_score" in result
    assert "confidence" in result
    assert "flag_for_review" in result
    assert "features" in result
    assert "note" in result


def test_fake_profile_scores_high(model):
    fake_profile = {
        "account_age_days": 3,
        "follower_count": 5,
        "following_count": 4000,
        "post_count": 1,
        "bio": "",
        "has_profile_photo": False,
        "reused_photo_hash_match": True,
        "username": "user8899",
    }
    result = score_profile(model, fake_profile)
    assert result["risk_score"] >= 50, f"Expected high risk for fake profile, got {result['risk_score']}"


def test_real_profile_scores_low(model):
    real_profile = {
        "account_age_days": 1825,
        "follower_count": 500,
        "following_count": 300,
        "post_count": 600,
        "bio": "Software Engineer at TCS, Ahmedabad. Cricket fan. Photography.",
        "has_profile_photo": True,
        "reused_photo_hash_match": False,
        "username": "ankit_desai",
    }
    result = score_profile(model, real_profile)
    assert result["risk_score"] < 60, f"Expected low risk for real profile, got {result['risk_score']}"


def test_risk_score_in_range(model):
    result = score_profile(model, {})
    assert 0 <= result["risk_score"] <= 100
    assert 0 <= result["confidence"] <= 1
