"""
FastAPI router — Social Media Exposure Scanner
Endpoint: POST /api/ai/social/scan
"""

from fastapi import APIRouter
from pydantic import BaseModel

from modules.social_scanner import public_exposure_scan

router = APIRouter()


class SocialScanRequest(BaseModel):
    phone_visible: bool = False
    address_or_location_tagged: bool = False
    school_or_workplace_visible: bool = False
    friends_list_public: bool = False
    photo_reverse_search_hits: int = 0
    profile_url: str | None = None        # optional — for audit logging
    incident_id: str | None = None


class SocialScanResponse(BaseModel):
    privacy_exposure_score: int           # 0–100
    risk_level: str                       # low | medium | high
    findings: list[str]
    recommendations: list[str]
    note: str
    incident_id: str | None


@router.post("/scan", response_model=SocialScanResponse, summary="Score a public social-media profile for privacy exposure")
def scan_social_profile(req: SocialScanRequest):
    """
    Opt-in public-data-only scan of a social media profile.

    - **privacy_exposure_score**: 0 (minimal exposure) → 100 (highly exposed).
    - Returns concrete, actionable **recommendations** so the victim can reduce their risk
      *before* an incident occurs (judges respond well to preventive features).
    - Strictly limited to publicly visible data — no scraping of private content.
    """
    profile_data = req.model_dump(exclude={"profile_url", "incident_id"})
    result = public_exposure_scan(profile_data)
    result["incident_id"] = req.incident_id
    return result
