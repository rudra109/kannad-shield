"""
Tests — NLP Harassment / Escalation Detector

Run: pytest tests/test_harassment.py -v
Note: First run downloads the toxic-bert model (~400MB). Subsequent runs use cache.
"""

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from modules.harassment_nlp import score_message, score_conversation, _severity


# ---------------------------------------------------------------------------
# Utility tests
# ---------------------------------------------------------------------------

def test_severity_high():
    assert _severity(80) == "high"


def test_severity_medium():
    assert _severity(55) == "medium"


def test_severity_low():
    assert _severity(20) == "low"


# ---------------------------------------------------------------------------
# score_message tests (requires HuggingFace model — may skip if no internet)
# ---------------------------------------------------------------------------

@pytest.mark.slow
def test_score_message_toxic():
    result = score_message("I will harm you if you don't comply. You deserve to suffer.")
    assert "toxicity_score" in result
    assert result["toxicity_score"] > 50, (
        f"Expected high toxicity for abusive message, got {result['toxicity_score']}"
    )


@pytest.mark.slow
def test_score_message_benign():
    result = score_message("Good morning! How are you today?")
    assert result["toxicity_score"] < 50, (
        f"Expected low toxicity for benign message, got {result['toxicity_score']}"
    )


@pytest.mark.slow
def test_score_message_returns_severity():
    result = score_message("Hello")
    assert result["severity"] in ("low", "medium", "high")


@pytest.mark.slow
def test_score_message_text_truncated():
    long_text = "spam " * 1000
    result = score_message(long_text)
    assert len(result["text"]) <= 200   # truncated in response


# ---------------------------------------------------------------------------
# score_conversation tests
# ---------------------------------------------------------------------------

def test_score_conversation_empty():
    result = score_conversation([])
    assert result["max_toxicity"] == 0
    assert result["is_escalating"] is False


@pytest.mark.slow
def test_score_conversation_escalating():
    messages = [
        "Hey, how are you?",
        "Stop ignoring me.",
        "I know where you live. You should be scared.",
    ]
    result = score_conversation(messages)
    assert "per_message_scores" in result
    assert len(result["per_message_scores"]) == 3
    assert "escalation_trend" in result
    assert "is_escalating" in result
    assert "flag_for_review" in result


@pytest.mark.slow
def test_score_conversation_returns_note():
    result = score_conversation(["Hello", "How are you?"])
    assert "note" in result
