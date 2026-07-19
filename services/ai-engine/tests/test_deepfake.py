"""
Tests — Deepfake / Morphed Image Check

Run: pytest tests/test_deepfake.py -v
"""

import io
import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from PIL import Image
from modules.deepfake_check import error_level_analysis, check_metadata, analyze_image


def _make_image_bytes(width=100, height=100, color=(128, 128, 128)) -> bytes:
    """Create a minimal JPEG image in memory for testing."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=95)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# ELA tests
# ---------------------------------------------------------------------------

def test_ela_returns_float():
    img_bytes = _make_image_bytes()
    score = error_level_analysis(img_bytes)
    assert isinstance(score, float)
    assert score >= 0.0


def test_ela_solid_color_low():
    """A solid-color image should have very low ELA (near-zero manipulation signal)."""
    img_bytes = _make_image_bytes(color=(200, 100, 50))
    score = error_level_analysis(img_bytes)
    # Solid color image should recompress cleanly
    assert score < 20.0, f"Expected low ELA for plain image, got {score}"


# ---------------------------------------------------------------------------
# Metadata tests
# ---------------------------------------------------------------------------

def test_check_metadata_plain_jpeg():
    img_bytes = _make_image_bytes()
    result = check_metadata(img_bytes)
    assert isinstance(result, dict)
    assert "has_exif" in result
    assert "software_tag" in result
    assert "suspicious_software" in result


def test_check_metadata_no_suspicious():
    img_bytes = _make_image_bytes()
    result = check_metadata(img_bytes)
    assert result["suspicious_software"] is False


# ---------------------------------------------------------------------------
# analyze_image integration tests
# ---------------------------------------------------------------------------

def test_analyze_image_returns_expected_keys():
    img_bytes = _make_image_bytes()
    result = analyze_image(img_bytes)
    assert "ela_score" in result
    assert "metadata" in result
    assert "risk_score" in result
    assert "flag_for_review" in result
    assert "note" in result


def test_analyze_image_risk_score_range():
    img_bytes = _make_image_bytes()
    result = analyze_image(img_bytes)
    assert 0 <= result["risk_score"] <= 100


def test_analyze_image_note_present():
    img_bytes = _make_image_bytes()
    result = analyze_image(img_bytes)
    assert "human" in result["note"].lower() or "reviewer" in result["note"].lower()


def test_analyze_image_flag_for_review_is_bool():
    img_bytes = _make_image_bytes()
    result = analyze_image(img_bytes)
    assert isinstance(result["flag_for_review"], bool)
