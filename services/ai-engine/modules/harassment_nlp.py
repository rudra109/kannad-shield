"""
Module 3 — NLP Harassment / Escalation Detection
Uses HuggingFace toxic-bert for per-message toxicity scoring.
score_conversation() additionally computes an escalation trend across a multi-turn thread.

For production: fine-tune on a multilingual (Gujarati / Hindi / English) harassment dataset,
or swap MODEL_NAME for a fine-tuned IndicBERT checkpoint.
"""

from __future__ import annotations
import logging

logger = logging.getLogger(__name__)

# Lazy-load the model so the import doesn't block at startup if torch is slow
_tokenizer = None
_model = None

# Use the lighter toxic-bert; swap for fine-tuned IndicBERT for Indic-language support
MODEL_NAME = "unitary/toxic-bert"

ESCALATION_THRESHOLD = 15.0   # points rise in toxicity across thread = "escalating"
HIGH_TOXICITY_THRESHOLD = 70.0
MEDIUM_TOXICITY_THRESHOLD = 40.0


def _ensure_model():
    global _tokenizer, _model
    if _model is None:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        import torch
        logger.info(f"Loading NLP model '{MODEL_NAME}' … (first call only)")
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
        _model.eval()
        logger.info("NLP model loaded.")


def score_message(text: str) -> dict:
    """
    Returns per-message toxicity score (0–100).
    Higher = more toxic/harassing.
    """
    import torch
    _ensure_model()
    inputs = _tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
    with torch.no_grad():
        logits = _model(**inputs).logits
    probs = torch.sigmoid(logits)[0]
    toxicity = float(probs[0])
    return {
        "text": text[:200],   # truncate for response payload
        "toxicity_score": round(toxicity * 100, 1),
        "severity": _severity(toxicity * 100),
    }


def score_conversation(messages: list[str]) -> dict:
    """
    Scores a multi-turn message thread.
    Escalation = rising toxicity trend across the conversation, not just peak toxicity.
    A cyberstalker often starts mild and escalates — this catches that pattern.
    """
    per_message = [score_message(m)["toxicity_score"] for m in messages]
    max_tox = max(per_message) if per_message else 0.0
    trend = (per_message[-1] - per_message[0]) if len(per_message) > 1 else 0.0
    escalating = trend > ESCALATION_THRESHOLD

    return {
        "per_message_scores": per_message,
        "max_toxicity": round(max_tox, 1),
        "escalation_trend": round(trend, 1),
        "is_escalating": escalating,
        "severity": _severity(max_tox),
        "flag_for_review": max_tox > HIGH_TOXICITY_THRESHOLD or escalating,
        "note": "Escalation trend flags a rising pattern even if individual messages are borderline.",
    }


def _severity(score: float) -> str:
    if score > HIGH_TOXICITY_THRESHOLD:
        return "high"
    if score > MEDIUM_TOXICITY_THRESHOLD:
        return "medium"
    return "low"
