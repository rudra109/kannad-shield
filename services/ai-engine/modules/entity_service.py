"""
FastAPI router — Entity Resolution / Repeat-Offender Graph
Endpoints:
  POST /api/ai/entity/link
  GET  /api/ai/entity/linked-cases/{incident_id}
  GET  /api/ai/entity/summary/{incident_id}
"""

from fastapi import APIRouter
from pydantic import BaseModel

from modules.entity_resolution import link_incident, get_linked_cases, get_repeat_offender_summary

router = APIRouter()


class LinkRequest(BaseModel):
    incident_id: str
    phone: str | None = None
    upi_id: str | None = None
    device_id: str | None = None
    face_id: str | None = None     # face embedding ID from the facial-recognition module


@router.post("/link", summary="Link an incident to shared identifiers in the graph")
def api_link_incident(req: LinkRequest):
    """
    Records an incident in Neo4j and connects it to any known identifiers
    (phone, UPI, device, face). Call this whenever a new cybercrime report is submitted.
    Automatically surfaces connections to prior incidents from the same offender.
    """
    return link_incident(
        incident_id=req.incident_id,
        phone=req.phone,
        upi_id=req.upi_id,
        device_id=req.device_id,
        face_id=req.face_id,
    )


@router.get("/linked-cases/{incident_id}", summary="Get all cases linked to the given incident")
def api_linked_cases(incident_id: str):
    """
    Returns a list of all incidents that share at least one identifier with the given case.
    Drives the 'Linked Cases / Repeat Offender' panel on the police dashboard.
    """
    cases = get_linked_cases(incident_id)
    return {"incident_id": incident_id, "linked_cases": cases, "count": len(cases)}


@router.get("/summary/{incident_id}", summary="Get repeat-offender summary for dashboard")
def api_summary(incident_id: str):
    """
    Structured summary for the police dashboard panel —
    includes is_repeat_offender flag, count, and case list.
    """
    return get_repeat_offender_summary(incident_id)
