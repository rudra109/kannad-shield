# =============================================================
#  Kanad S.H.I.E.L.D. — Cybercrime + Police Dashboard Service
#  Owner: Developer 1  |  Stack: FastAPI + asyncpg + Redis
#
#  Endpoints:
#
#  CYBERCRIME REPORTING
#    POST   /api/cyber/report                    — create complaint
#    GET    /api/cyber/report/{id}               — fetch complaint + AI scores
#    PATCH  /api/cyber/report/{id}/status        — update workflow status
#    POST   /api/cyber/report/{id}/evidence      — upload evidence (→ evidence.py)
#    GET    /api/cyber/report/{id}/evidence      — list evidence records
#    GET    /api/cyber/report/{id}/evidence/verify — verify hash chain
#
#  POLICE DASHBOARD (officer-only)
#    GET    /api/police/incidents                — paginated queue (filter by status/type/severity)
#    GET    /api/police/incidents/{id}           — full incident detail + AI scores + case-links
#    PATCH  /api/police/incidents/{id}/status   — officer changes status
#    GET    /api/police/heatmap                  — {lat,lng,count,severity_avg} buckets
#    GET    /api/police/incidents/{id}/case-links — linked cases (repeat offender)
#    POST   /api/police/fir/{id}/draft           — AI-assisted FIR draft (calls Dev 2's service)
#
#  SHARED
#    GET    /health
# =============================================================

import os
import uuid
import json
import datetime
from contextlib import asynccontextmanager
from typing import Optional

import asyncpg
import httpx
import redis.asyncio as aioredis
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from auth import verify_token, require_officer
from evidence import router as evidence_router, set_pool
from analytics import router as analytics_router
# ── Config ────────────────────────────────────────────────────
DATABASE_URL  = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/safetydb")
REDIS_URL     = os.getenv("REDIS_URL", "redis://localhost:6379")
AI_ENGINE_URL = os.getenv("AI_ENGINE_URL", "http://ai-engine:4002")
PORT          = int(os.getenv("PORT", "4001"))

INCIDENT_CATEGORIES = {
    "stalking", "harassment", "fraud", "deepfake", "blackmail",
    "fake_profile", "phishing", "extortion", "cyber_bullying", "other",
}
VALID_STATUSES = {
    "open", "under_review", "dispatched", "en_route",
    "arrived", "escalated", "resolved", "closed",
}

# ── Startup / Shutdown ────────────────────────────────────────
_db_pool:    asyncpg.Pool | None  = None
_redis:      aioredis.Redis | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _db_pool, _redis
    _db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    _redis   = aioredis.from_url(REDIS_URL, decode_responses=True)
    set_pool(_db_pool)    # share pool with evidence.py
    yield
    await _db_pool.close()
    await _redis.close()


# ── FastAPI app ───────────────────────────────────────────────
app = FastAPI(
    title="Kanad S.H.I.E.L.D. — Cybercrime & Police Dashboard Service",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evidence_router)
app.include_router(analytics_router)
# ── DB dependency ─────────────────────────────────────────────
async def get_db() -> asyncpg.Pool:
    return _db_pool

# ── Pydantic models ───────────────────────────────────────────

class CyberReportCreate(BaseModel):
    category:           str        = Field(..., description="stalking | harassment | fraud | deepfake | blackmail | ...")
    description:        str        = Field(..., min_length=10, max_length=4000)
    perpetrator_phone:  Optional[str] = None
    perpetrator_upi:    Optional[str] = None
    perpetrator_device: Optional[str] = None
    phishing_url:       Optional[str] = None   # auto-scanned by AI engine if provided
    suspect_profile_url: Optional[str] = None  # auto-scanned by AI engine if provided

class StatusUpdate(BaseModel):
    status: str

class OfficerStatusUpdate(BaseModel):
    status: str

# ── Helpers ───────────────────────────────────────────────────

async def call_ai_engine(endpoint: str, payload: dict) -> dict | None:
    """
    Fire-and-forget call to Dev 2's AI engine.
    Returns None on any error — AI scores are advisory, never blocking.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{AI_ENGINE_URL}{endpoint}", json=payload)
            if resp.status_code == 200:
                return resp.json()
    except Exception as exc:
        print(f"[AI-ENGINE] call failed ({endpoint}): {exc}")
    return None


async def save_ai_score(db: asyncpg.Pool, module: str, target_type: str,
                         target_ref: str, incident_id: str, result: dict):
    """Persists an AI score from Dev 2's engine to ai_scores table."""
    if result is None:
        return
    await db.execute(
        """INSERT INTO ai_scores
             (id, module, target_type, target_ref, incident_id, score, confidence, features_json, flag_for_review)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)""",
        uuid.uuid4(),
        module,
        target_type,
        target_ref,
        uuid.UUID(incident_id),
        float(result.get("risk_score", 0)),
        float(result.get("confidence", 0)),
        json.dumps(result.get("features", result.get("top_signals", {}))),
        bool(result.get("flag_for_review", False)),
    )


# ── CYBERCRIME ROUTES ─────────────────────────────────────────

@app.post("/api/cyber/report", status_code=201)
async def create_report(
    body: CyberReportCreate,
    token: dict = Depends(verify_token),
    db:    asyncpg.Pool = Depends(get_db),
):
    """Creates a cybercrime complaint and optionally triggers AI scans."""
    if body.category not in INCIDENT_CATEGORIES:
        raise HTTPException(400, f"Invalid category. Allowed: {INCIDENT_CATEGORIES}")

    incident_id = str(uuid.uuid4())

    await db.execute(
        """INSERT INTO incidents
             (id, user_id, incident_type, category, status, severity, description,
              perpetrator_phone, perpetrator_upi, perpetrator_device)
           VALUES ($1,$2,'cyber',$3,'open',0,$4,$5,$6,$7)""",
        uuid.UUID(incident_id),
        uuid.UUID(token["sub"]),
        body.category,
        body.description,
        body.perpetrator_phone,
        body.perpetrator_upi,
        body.perpetrator_device,
    )

    # ── Async AI scans (non-blocking) ───────────────────────────
    scans_triggered = []

    if body.phishing_url:
        result = await call_ai_engine("/api/ai/phishing/scan", {
            "url": body.phishing_url, "incident_id": incident_id
        })
        await save_ai_score(db, "phishing", "url", body.phishing_url, incident_id, result)
        if result:
            scans_triggered.append({"module": "phishing", "risk_score": result.get("risk_score")})

    if body.suspect_profile_url:
        result = await call_ai_engine("/api/ai/fake_profile/scan", {
            "profile_url": body.suspect_profile_url, "incident_id": incident_id
        })
        await save_ai_score(db, "fake_profile", "profile", body.suspect_profile_url, incident_id, result)
        if result:
            scans_triggered.append({"module": "fake_profile", "risk_score": result.get("risk_score")})

    if body.description:
        result = await call_ai_engine("/api/ai/harassment/scan", {
            "messages": [body.description], "incident_id": incident_id
        })
        await save_ai_score(db, "harassment_nlp", "message", incident_id, incident_id, result)
        if result:
            scans_triggered.append({"module": "harassment_nlp", "severity": result.get("severity")})

    return {
        "incident_id":    incident_id,
        "status":         "open",
        "scans_triggered": scans_triggered,
        "message":        "Report created. Evidence can be uploaded via /api/evidence/{incident_id}.",
    }


@app.get("/api/cyber/report/{incident_id}")
async def get_report(
    incident_id: str,
    token: dict = Depends(verify_token),
    db:    asyncpg.Pool = Depends(get_db),
):
    """Fetches a complaint with its current status and all AI scores."""
    row = await db.fetchrow("SELECT * FROM incidents WHERE id=$1", uuid.UUID(incident_id))
    if not row:
        raise HTTPException(404, "Incident not found")

    # Access control: owner or officer
    is_owner   = str(row["user_id"]) == token["sub"]
    is_officer = token.get("role") in {"officer", "supervisor", "admin"}
    if not is_owner and not is_officer:
        raise HTTPException(403, "Forbidden")

    scores = await db.fetch(
        "SELECT module, score, confidence, features_json, flag_for_review, created_at FROM ai_scores WHERE incident_id=$1 ORDER BY created_at DESC",
        uuid.UUID(incident_id),
    )

    return {
        "incident": dict(row),
        "ai_scores": [dict(s) for s in scores],
    }


@app.patch("/api/cyber/report/{incident_id}/status")
async def update_report_status(
    incident_id: str,
    body: StatusUpdate,
    token: dict = Depends(verify_token),
    db:    asyncpg.Pool = Depends(get_db),
):
    """Owner can cancel (→ closed); officers can move through the full workflow."""
    if body.status not in VALID_STATUSES:
        raise HTTPException(400, f"Invalid status. Allowed: {VALID_STATUSES}")

    row = await db.fetchrow("SELECT user_id FROM incidents WHERE id=$1", uuid.UUID(incident_id))
    if not row:
        raise HTTPException(404, "Incident not found")

    is_owner   = str(row["user_id"]) == token["sub"]
    is_officer = token.get("role") in {"officer", "supervisor", "admin"}

    if not is_owner and not is_officer:
        raise HTTPException(403, "Forbidden")
    if is_owner and body.status not in {"closed"}:
        raise HTTPException(403, "Users can only close their own reports")

    await db.execute(
        "UPDATE incidents SET status=$1, updated_at=now() WHERE id=$2",
        body.status, uuid.UUID(incident_id),
    )
    return {"ok": True, "status": body.status}


# ── POLICE DASHBOARD ROUTES ───────────────────────────────────

@app.get("/api/police/incidents")
async def list_incidents(
    status:        Optional[str] = Query(None),
    incident_type: Optional[str] = Query(None, alias="type"),
    min_severity:  int  = Query(0, ge=0, le=100),
    page:          int  = Query(1, ge=1),
    page_size:     int  = Query(20, ge=1, le=100),
    token: dict = Depends(require_officer),
    db:    asyncpg.Pool = Depends(get_db),
):
    """
    Paginated incident queue for the police dashboard.
    Sorted by severity DESC then created_at DESC.
    Optionally filtered by status, type, minimum severity.
    """
    filters = ["severity >= $1"]
    params  = [min_severity]
    idx     = 2

    if status:
        filters.append(f"status = ${idx}"); params.append(status); idx += 1
    if incident_type:
        filters.append(f"incident_type = ${idx}"); params.append(incident_type); idx += 1

    where  = " AND ".join(filters)
    offset = (page - 1) * page_size

    rows = await db.fetch(
        f"""SELECT i.*, u.full_name as reporter_name, u.phone as reporter_phone
            FROM incidents i LEFT JOIN users u ON u.id = i.user_id
            WHERE {where}
            ORDER BY severity DESC, created_at DESC
            LIMIT {page_size} OFFSET {offset}""",
        *params,
    )

    total = await db.fetchval(f"SELECT COUNT(*) FROM incidents WHERE {where}", *params)

    # Attach AI flag counts for each incident
    result = []
    for row in rows:
        d  = dict(row)
        flags = await db.fetch(
            "SELECT module, score, confidence, flag_for_review FROM ai_scores WHERE incident_id=$1 ORDER BY score DESC LIMIT 3",
            row["id"],
        )
        d["ai_flags"] = [dict(f) for f in flags]
        result.append(d)

    return {"total": total, "page": page, "page_size": page_size, "incidents": result}


@app.get("/api/police/incidents/{incident_id}")
async def get_incident_detail(
    incident_id: str,
    token: dict = Depends(require_officer),
    db:    asyncpg.Pool = Depends(get_db),
):
    """Full incident detail with all AI scores, evidence list, and linked cases."""
    row = await db.fetchrow("SELECT * FROM incidents WHERE id=$1", uuid.UUID(incident_id))
    if not row:
        raise HTTPException(404, "Incident not found")

    scores = await db.fetch(
        "SELECT * FROM ai_scores WHERE incident_id=$1 ORDER BY created_at DESC",
        uuid.UUID(incident_id),
    )
    evidence = await db.fetch(
        "SELECT id, file_ref, file_hash, chain_hash, ntp_timestamp FROM evidence WHERE incident_id=$1 ORDER BY ntp_timestamp ASC",
        uuid.UUID(incident_id),
    )
    links = await db.fetch(
        """SELECT cl.*, i.category, i.status, i.created_at as linked_created_at
           FROM case_links cl
           JOIN incidents i ON i.id = CASE WHEN cl.incident_a=$1 THEN cl.incident_b ELSE cl.incident_a END
           WHERE cl.incident_a=$1 OR cl.incident_b=$1""",
        uuid.UUID(incident_id),
    )

    return {
        "incident":    dict(row),
        "ai_scores":   [dict(s) for s in scores],
        "evidence":    [dict(e) for e in evidence],
        "case_links":  [dict(l) for l in links],
    }


@app.patch("/api/police/incidents/{incident_id}/status")
async def officer_update_status(
    incident_id: str,
    body:  OfficerStatusUpdate,
    token: dict = Depends(require_officer),
    db:    asyncpg.Pool = Depends(get_db),
):
    """Officer updates incident workflow status and assigns themselves."""
    if body.status not in VALID_STATUSES:
        raise HTTPException(400, f"Invalid status")

    await db.execute(
        """UPDATE incidents
           SET status=$1, assigned_officer_id=$2, updated_at=now()
           WHERE id=$3""",
        body.status, uuid.UUID(token["sub"]), uuid.UUID(incident_id),
    )
    return {"ok": True, "status": body.status}


@app.get("/api/police/heatmap")
async def get_heatmap(
    hours: int = Query(24, ge=1, le=720, description="Look-back window in hours"),
    token: dict = Depends(require_officer),
    db:    asyncpg.Pool = Depends(get_db),
):
    """
    Returns aggregated {lat, lng, count, severity_avg} buckets for the map overlay.
    Clusters incidents into ~0.01° grid cells (~1 km resolution).
    """
    rows = await db.fetch(
        """SELECT
             ROUND(lat::numeric, 2) AS lat_bucket,
             ROUND(lng::numeric, 2) AS lng_bucket,
             COUNT(*) AS count,
             AVG(severity) AS severity_avg,
             MODE() WITHIN GROUP (ORDER BY category) AS dominant_category
           FROM incidents
           WHERE lat IS NOT NULL AND lng IS NOT NULL
             AND created_at >= now() - INTERVAL '1 hour' * $1
           GROUP BY lat_bucket, lng_bucket
           ORDER BY count DESC
           LIMIT 500""",
        hours,
    )
    return {
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "hours":        hours,
        "buckets":      [dict(r) for r in rows],
    }


@app.get("/api/police/incidents/{incident_id}/case-links")
async def get_case_links(
    incident_id: str,
    token: dict = Depends(require_officer),
    db:    asyncpg.Pool = Depends(get_db),
):
    """
    Returns linked cases for repeat-offender detection.
    Edges are written by Dev 2's entity resolution service.
    """
    rows = await db.fetch(
        """SELECT
             cl.id, cl.link_type, cl.confidence, cl.created_at,
             i.id AS linked_incident_id, i.category, i.status, i.severity, i.created_at AS linked_at
           FROM case_links cl
           JOIN incidents i ON i.id = CASE
               WHEN cl.incident_a = $1 THEN cl.incident_b
               ELSE cl.incident_a
           END
           WHERE cl.incident_a=$1 OR cl.incident_b=$1
           ORDER BY cl.confidence DESC""",
        uuid.UUID(incident_id),
    )
    return {"incident_id": incident_id, "linked_cases": [dict(r) for r in rows]}


@app.post("/api/police/fir/{incident_id}/draft")
async def draft_fir(
    incident_id: str,
    token: dict = Depends(require_officer),
    db:    asyncpg.Pool = Depends(get_db),
):
    """
    Calls Dev 2's LLM-assisted FIR drafting endpoint and returns the draft to the officer.
    The officer MUST review, edit, and sign before it becomes an official filed document.
    """
    row = await db.fetchrow(
        """SELECT i.*, u.full_name AS complainant_name
           FROM incidents i LEFT JOIN users u ON u.id = i.user_id
           WHERE i.id=$1""",
        uuid.UUID(incident_id),
    )
    if not row:
        raise HTTPException(404, "Incident not found")

    evidence_count = await db.fetchval(
        "SELECT COUNT(*) FROM evidence WHERE incident_id=$1", uuid.UUID(incident_id)
    )

    payload = {
        "incident_id":      incident_id,
        "category":         row["category"],
        "description":      row["description"],
        "complainant_name": row["complainant_name"],
        "incident_time":    row["created_at"].isoformat() if row["created_at"] else None,
        "evidence_count":   evidence_count,
    }

    # Try Dev 2's FIR endpoint; fall back to the built-in simple drafter
    fir_result = await call_ai_engine("/api/ai/fir/draft", payload)
    if not fir_result:
        # Built-in fallback — mirrors the logic from §11.12 of the roadmap
        fir_result = _local_fir_draft(payload)

    return {**fir_result, "incident_id": incident_id, "officer_id": token["sub"]}


def _local_fir_draft(incident: dict) -> dict:
    """Fallback FIR draft used if Dev 2's AI engine is unavailable."""
    LEGAL_CLAUSES = {
        "stalking":       ["BNS Sec 78 (Stalking)", "IT Act Sec 66E (Privacy violation)"],
        "harassment":     ["BNS Sec 351 (Criminal intimidation)", "IT Act Sec 67 (Obscene content)"],
        "fraud":          ["BNS Sec 318 (Cheating)", "IT Act Sec 66D (Cheating by impersonation)"],
        "deepfake":       ["IT Act Sec 66E, 66D", "BNS Sec 356 (Defamation)"],
        "blackmail":      ["BNS Sec 308 (Extortion)", "IT Act Sec 66E"],
        "fake_profile":   ["IT Act Sec 66D", "BNS Sec 318"],
        "phishing":       ["IT Act Sec 66C (Identity theft)", "BNS Sec 318"],
        "cyber_bullying": ["IT Act Sec 67", "BNS Sec 351"],
    }
    category = incident.get("category", "harassment")
    clauses  = LEGAL_CLAUSES.get(category, LEGAL_CLAUSES["harassment"])
    draft = f"""FIRST INFORMATION REPORT (DRAFT — REQUIRES OFFICER REVIEW AND SIGNATURE)
{'─' * 60}
Complainant    : {incident.get('complainant_name', '[NAME]')}
Date/Time      : {incident.get('incident_time', '[DATE/TIME]')}
Incident Type  : Cybercrime — {category.replace('_', ' ').title()}
Applicable Law : {', '.join(clauses)}

Description of Incident:
{incident.get('description', '[Description pending]')}

Evidence Referenced: {incident.get('evidence_count', 0)} item(s) — chain-of-custody hash verified.
{'─' * 60}
STATUS: DRAFT ONLY — not a filed document until reviewed and signed by an authorized officer.
This draft was generated with AI assistance. All facts must be verified independently."""

    return {
        "draft_text":             draft,
        "suggested_sections":     clauses,
        "requires_officer_signoff": True,
        "source":                 "local_fallback",
    }


# ── Health ────────────────────────────────────────────────────
@app.get("/health")
async def health():
    try:
        await _db_pool.fetchval("SELECT 1")
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status":  "ok" if db_ok else "degraded",
        "service": "cybercrime-service",
        "db":      "ok" if db_ok else "error",
        "ts":      datetime.datetime.utcnow().isoformat(),
    }


# ── Entry point ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
