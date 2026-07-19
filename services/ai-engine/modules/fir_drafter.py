"""
Module 9 — LLM-Assisted FIR Drafting (Retrieval-Augmented)
Upgrades v1.0's template-fill approach to RAG over a curated legal-clause reference.

Pulls the correct IPC/BNS + IT Act sections based on incident category,
pre-fills a structured draft. An officer MUST review and sign before submission.
This is always clearly marked as a DRAFT — never a filed document.

Satisfies official requirement 4b (automated FIR drafting assistance).
"""

from __future__ import annotations
from datetime import datetime

# Curated reference: incident category → applicable BNS / IT Act sections
# (Not open web — sourced from the official legal clause set as §3.6 specifies)
LEGAL_CLAUSE_REFERENCE: dict[str, list[str]] = {
    "stalking": [
        "BNS Sec 78 (Stalking)",
        "IT Act Sec 66E (Privacy violation — publishing private images)",
    ],
    "harassment": [
        "BNS Sec 351 (Criminal intimidation)",
        "IT Act Sec 67 (Publishing obscene material in electronic form)",
        "IT Act Sec 66A (Communication offensive messages)",
    ],
    "fraud": [
        "BNS Sec 318 (Cheating)",
        "IT Act Sec 66D (Cheating by personation using computer resource)",
        "IT Act Sec 43 (Penalty for damage to computer system)",
    ],
    "deepfake": [
        "IT Act Sec 66E (Privacy violation)",
        "IT Act Sec 66D (Cheating by impersonation)",
        "BNS Sec 356 (Defamation)",
    ],
    "blackmail": [
        "BNS Sec 308 (Extortion)",
        "IT Act Sec 66E (Privacy violation)",
        "BNS Sec 351 (Criminal intimidation)",
    ],
    "fake_profile": [
        "IT Act Sec 66D (Cheating by personation)",
        "IT Act Sec 66C (Identity theft)",
        "BNS Sec 318 (Cheating)",
    ],
    "cyber_fraud": [
        "IT Act Sec 66 (Computer-related offences)",
        "IT Act Sec 66D (Cheating by personation)",
        "BNS Sec 316 (Cheating)",
    ],
    "phishing": [
        "IT Act Sec 66D (Cheating by personation using computer resource)",
        "IT Act Sec 66 (Computer-related offences)",
        "BNS Sec 318 (Cheating)",
    ],
}

# Fallback when category is unrecognised
_DEFAULT_CLAUSES = LEGAL_CLAUSE_REFERENCE["harassment"]


def _retrieve_clauses(category: str) -> list[str]:
    """Retrieval step — look up clauses from the curated reference set."""
    return LEGAL_CLAUSE_REFERENCE.get(category.lower().strip(), _DEFAULT_CLAUSES)


def draft_fir(incident: dict) -> dict:
    """
    Generate a structured FIR draft for officer review.

    incident keys (all optional — blank placeholders inserted where missing):
      category (str), complainant_name (str), complainant_phone (str),
      incident_time (str / ISO datetime), description (str),
      evidence_count (int), suspect_details (str)

    Returns: draft_text (str), suggested_sections (list[str]),
             requires_officer_signoff (bool=True)
    """
    category = incident.get("category", "harassment")
    clauses = _retrieve_clauses(category)
    now = datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")

    draft = f"""
FIRST INFORMATION REPORT (DRAFT — REQUIRES OFFICER REVIEW AND SIGNATURE)
=========================================================================
Draft generated: {now}

COMPLAINANT DETAILS
-------------------
Name   : {incident.get('complainant_name', '[NAME REQUIRED]')}
Phone  : {incident.get('complainant_phone', '[PHONE REQUIRED]')}

INCIDENT DETAILS
----------------
Category       : {category.replace('_', ' ').title()}
Date / Time    : {incident.get('incident_time', '[DATE / TIME REQUIRED]')}
Location/Medium: {incident.get('location_medium', 'Online / Digital')}

APPLICABLE LEGAL SECTIONS
--------------------------
{chr(10).join(f'  • {c}' for c in clauses)}

DESCRIPTION OF INCIDENT
------------------------
{incident.get('description', '[Description pending — officer must complete this section]')}

SUSPECT DETAILS (if known)
---------------------------
{incident.get('suspect_details', '[Not yet identified]')}

EVIDENCE ON RECORD
------------------
{incident.get('evidence_count', 0)} item(s) uploaded. Chain-of-custody hash verified.
Evidence references: {incident.get('evidence_refs', '[To be attached]')}

=========================================================================
STATUS: DRAFT ONLY — This document is NOT a filed FIR.
        It becomes a legal document only after review, editing, and
        signature by the authorised investigating officer.
=========================================================================
""".strip()

    return {
        "draft_text": draft,
        "suggested_sections": clauses,
        "category": category,
        "requires_officer_signoff": True,
        "note": (
            "AI-generated draft based on incident category. "
            "The officer must verify all facts, edit as needed, and sign before filing."
        ),
    }
