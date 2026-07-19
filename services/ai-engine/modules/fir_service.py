"""
FastAPI router — LLM-Assisted FIR Drafting
Endpoint: POST /api/ai/fir/draft
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal

from modules.fir_drafter import draft_fir, LEGAL_CLAUSE_REFERENCE

router = APIRouter()

VALID_CATEGORIES = list(LEGAL_CLAUSE_REFERENCE.keys())


class FIRRequest(BaseModel):
    category: str = "harassment"
    complainant_name: str | None = None
    complainant_phone: str | None = None
    incident_time: str | None = None
    description: str | None = None
    evidence_count: int = 0
    evidence_refs: str | None = None
    suspect_details: str | None = None
    location_medium: str | None = None
    incident_id: str | None = None


class FIRResponse(BaseModel):
    draft_text: str
    suggested_sections: list[str]
    category: str
    requires_officer_signoff: bool
    note: str
    incident_id: str | None


@router.post("/draft", response_model=FIRResponse, summary="Generate an AI-assisted FIR draft")
def generate_fir_draft(req: FIRRequest):
    """
    Generates a structured FIR draft by:
    1. **Retrieving** the applicable BNS / IT Act sections from a curated legal-clause
       reference (not open web) based on the incident category.
    2. **Pre-filling** a formatted draft template with incident details.

    The draft is clearly marked as requiring officer review and signature before it
    becomes a legal document. The officer must verify all facts and edit as needed.

    Supported categories: stalking, harassment, fraud, deepfake, blackmail,
    fake_profile, cyber_fraud, phishing.
    """
    result = draft_fir(req.model_dump(exclude={"incident_id"}))
    result["incident_id"] = req.incident_id
    return result


@router.get("/categories", summary="List supported FIR incident categories")
def list_categories():
    """Returns all supported incident categories with their applicable legal sections."""
    return {
        cat: clauses
        for cat, clauses in LEGAL_CLAUSE_REFERENCE.items()
    }
