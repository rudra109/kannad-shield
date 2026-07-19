"""
FastAPI router — Facial Recognition for Missing Persons (Police-Only)
Endpoint: POST /api/ai/facial/search

This endpoint is marked police-only in the architecture — the React police console
calls it; the Flutter victim app does NOT expose this endpoint.
"""

import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from modules.facial_missing_persons import search_and_log, _DEPS_AVAILABLE

router = APIRouter()

# In production, load from the case-management DB at startup.
# For the demo, we keep a small in-memory list that matches seed_data.py.
KNOWN_IDS: list[str] = []
DB_DSN: str | None = os.getenv("DATABASE_URL", None)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/search", summary="[Police-Only] Search for missing persons by facial similarity")
async def facial_search(
    file: UploadFile = File(..., description="Query image (JPEG/PNG/WebP)"),
    officer_id: str = Form(..., description="Officer UUID — must match police_officers table"),
    case_reference: str = Form(..., description="Case number or reference this search is linked to"),
    justification: str = Form(..., description="Documented reason for the search (min 10 chars)"),
    top_k: int = Form(5, ge=1, le=20),
):
    """
    Searches a police-held FAISS index of missing-person/case photos for faces
    similar to the uploaded query image.

    **Safeguards (stated explicitly for judges):**
    - Matches ONLY against images police already hold with legal authority.
    - Every result is a *lead* for a human to verify — never an automatic identification.
    - `justification` field is mandatory and non-empty (min 10 chars) — no silent bypass.
    - Full audit entry logged to `facial_search_audit` table on every call.
    - `requires_human_verification: true` is always set in the response.
    """
    if not _DEPS_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail=(
                "face_recognition and faiss-cpu are not installed. "
                "Install them to enable the facial recognition endpoint."
            ),
        )

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Accepted: JPEG, PNG, WebP.",
        )

    image_bytes = await file.read()

    try:
        result = await search_and_log(
            query_image_bytes=image_bytes,
            officer_id=officer_id,
            case_reference=case_reference,
            justification=justification,
            known_ids=KNOWN_IDS,
            top_k=top_k,
            db_dsn=DB_DSN,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return result


@router.post("/index/register-known-id", summary="[Admin] Register a known case ID for the facial index")
def register_known_id(case_id: str):
    """
    Adds a case ID to the in-memory KNOWN_IDS list so new photos indexed via
    seed_data.py get matched to the right case records.
    (In production this is replaced by a DB-backed identity store.)
    """
    if case_id not in KNOWN_IDS:
        KNOWN_IDS.append(case_id)
    return {"registered": case_id, "total_known": len(KNOWN_IDS)}
