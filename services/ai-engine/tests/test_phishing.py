"""
Tests — Phishing URL Classifier

Run: pytest tests/test_phishing.py -v
Requires: python train_all.py to have been run first (models must be saved).
"""

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from modules.phishing_model import extract_features, score_url, load_model, MODEL_PATH

# ---------------------------------------------------------------------------
# Feature extraction tests (no model needed)
# ---------------------------------------------------------------------------

def test_extract_features_basic():
    feats = extract_features("http://google.com/search")
    assert isinstance(feats, dict)
    assert "url_length" in feats
    assert "entropy" in feats
    assert feats["has_https"] == 0  # http, not https


def test_extract_features_https():
    feats = extract_features("https://google.com")
    assert feats["has_https"] == 1


def test_extract_features_ip_host():
    feats = extract_features("http://192.168.1.1/login")
    assert feats["has_ip_host"] == 1


def test_extract_features_suspicious_tld():
    feats = extract_features("http://free-money.xyz/claim")
    assert feats["suspicious_tld"] == 1


def test_extract_features_risk_keyword():
    feats = extract_features("http://example.com/verify-account")
    assert feats["has_risk_keyword"] == 1


def test_extract_features_benign_url():
    feats = extract_features("https://sbi.co.in/web/sbi-in-the-news")
    assert feats["has_https"] == 1
    assert feats["suspicious_tld"] == 0
    assert feats["has_ip_host"] == 0


def test_extract_features_punycode():
    feats = extract_features("http://xn--googl-fsa.com/login")
    assert feats["has_punycode"] == 1


def test_extract_features_at_symbol():
    feats = extract_features("http://legitimate.com@evil.com/phish")
    assert feats["has_at_symbol"] == 1


# ---------------------------------------------------------------------------
# Model scoring tests (requires trained model)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def model():
    if not MODEL_PATH.exists():
        pytest.skip(f"Model not found at {MODEL_PATH} — run train_all.py first.")
    return load_model()


def test_score_url_returns_expected_keys(model):
    result = score_url(model, "http://secure-verify.xyz/login?token=abc")
    assert "risk_score" in result
    assert "confidence" in result
    assert "top_signals" in result
    assert "flag_for_review" in result
    assert "note" in result


def test_phishing_url_scores_high(model):
    result = score_url(model, "http://login-verify-account.xyz/secure?token=abc123&id=xyz")
    assert result["risk_score"] >= 50, f"Expected high risk, got {result['risk_score']}"


def test_benign_url_scores_low(model):
    result = score_url(model, "https://sbi.co.in/personal-banking/loans")
    assert result["risk_score"] < 60, f"Expected low risk for benign URL, got {result['risk_score']}"


def test_risk_score_range(model):
    for url in [
        "https://google.com",
        "http://free-iphone.tk/claim",
        "http://192.168.0.1/admin",
    ]:
        result = score_url(model, url)
        assert 0 <= result["risk_score"] <= 100
        assert 0 <= result["confidence"] <= 1


def test_top_signals_is_list(model):
    result = score_url(model, "http://evil.xyz/phish")
    assert isinstance(result["top_signals"], list)
    assert len(result["top_signals"]) > 0


def test_flag_for_review_is_bool(model):
    result = score_url(model, "https://amazon.in/products")
    assert isinstance(result["flag_for_review"], bool)
