"""
FastAPI router — Deepfake / Morphed Image Check
Endpoint: POST /api/ai/deepfake/check  (multipart file upload)
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from modules.deepfake_check import analyze_image

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


class DeepfakeResponse(BaseModel):
    ela_score: float
    metadata: dict
    risk_score: float
    flag_for_review: bool
    note: str


@router.post("/check", response_model=DeepfakeResponse, summary="Check an image for deepfake / morphing indicators")
async def check_image(file: UploadFile = File(...)):
    """
    Runs Error Level Analysis (ELA) and EXIF metadata inspection on an uploaded image.

    - Accepts JPEG, PNG, WebP, BMP.
    - **risk_score**: 0 → low manipulation signal; ≥ 50 → flagged for human review.
    - **ela_score**: raw mean pixel-diff between original and JPEG-recompressed version.
    - **metadata.suspicious_software**: `true` if EXIF contains known editing-tool signatures.
    - This is a first-pass forensic signal; a trained analyst must review every flagged image.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Accepted: JPEG, PNG, WebP, BMP.",
        )
    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB).")

    return analyze_image(image_bytes)
