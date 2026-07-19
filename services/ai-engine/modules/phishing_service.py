"""
FastAPI router — Phishing / Malicious URL Classifier
Endpoint: POST /api/ai/phishing/scan
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from pathlib import Path
import logging

from modules.phishing_model import load_model, score_url, MODEL_PATH

router = APIRouter()
logger = logging.getLogger(__name__)

# Load model once at startup; fail loudly if not found (run train_all.py first)
try:
    _model = load_model()
    logger.info("Phishing model loaded successfully.")
except FileNotFoundError:
    logger.warning(
        f"Phishing model not found at {MODEL_PATH}. "
        "Run `python train_all.py` to train and save the model."
    )
    _model = None


class URLRequest(BaseModel):
    url: str
    incident_id: str | None = None  # optional — links the scan to a cybercrime report


class PhishingResponse(BaseModel):
    url: str
    risk_score: float           # 0–100
    confidence: float           # 0–1
    top_signals: list[str]      # top 3 contributing features
    flag_for_review: bool       # True when risk_score ≥ 60
    note: str
    incident_id: str | None


@router.post("/scan", response_model=PhishingResponse, summary="Scan a URL for phishing risk")
def scan_url(req: URLRequest):
    """
    Scores a URL for phishing / malicious-link risk using a trained XGBoost classifier.

    - **risk_score**: 0 (safe) → 100 (high risk).
    - **flag_for_review**: `true` routes the result to the police AI-risk queue.
    - Runs in < 100ms; no external DNS/WHOIS calls (pure lexical features).
    - Human-in-the-loop: nothing is auto-blocked — the score is a signal only.
    """
    if _model is None:
        raise HTTPException(
            status_code=503,
            detail="Phishing model not loaded. Run train_all.py to initialize models.",
        )
    result = score_url(_model, req.url)
    result["incident_id"] = req.incident_id
    return result
