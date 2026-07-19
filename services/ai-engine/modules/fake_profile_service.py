"""
FastAPI router — Fake Profile Classifier
Endpoint: POST /api/ai/fake-profile/scan
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from modules.fake_profile_model import load_model, score_profile, MODEL_PATH

router = APIRouter()
logger = logging.getLogger(__name__)

try:
    _model = load_model()
    logger.info("Fake profile model loaded successfully.")
except FileNotFoundError:
    logger.warning(
        f"Fake profile model not found at {MODEL_PATH}. "
        "Run `python train_all.py` to train and save the model."
    )
    _model = None


class ProfileRequest(BaseModel):
    username: str | None = None
    account_age_days: int = 0
    follower_count: int = 0
    following_count: int = 0
    post_count: int = 0
    bio: str | None = None
    has_profile_photo: bool = True
    reused_photo_hash_match: bool = False   # set by caller after reverse-image lookup
    incident_id: str | None = None


class FakeProfileResponse(BaseModel):
    risk_score: float
    confidence: float
    flag_for_review: bool
    top_signals: list[str]
    features: dict
    note: str
    incident_id: str | None


@router.post("/scan", response_model=FakeProfileResponse, summary="Score a social-media profile for fakeness")
def scan_profile(req: ProfileRequest):
    """
    Scores a social-media profile for indicators of a fake/bot account.

    - **risk_score**: 0 (likely real) → 100 (likely fake).
    - **flag_for_review**: `true` when risk_score ≥ 60 — routes to the police AI-risk queue.
    - Human-in-the-loop: no automatic action; score is a signal only.
    """
    if _model is None:
        raise HTTPException(
            status_code=503,
            detail="Fake profile model not loaded. Run train_all.py to initialize models.",
        )
    profile = req.model_dump(exclude={"incident_id"})
    result = score_profile(_model, profile)
    result["incident_id"] = req.incident_id
    return result
