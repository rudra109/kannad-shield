# 🛡️ Kanad S.H.I.E.L.D. — Backend (Developer 1)

**Problem:** PS-69EEFD950B72D | Kanad S.H.I.E.L.D. — Ahmedabad City Police Innovation Challenge 2026

> Developer 1 scope: SOS Microservice, Cybercrime + Police Dashboard Service, Auth, Evidence Hash-Chain, ERSS Mock Adapter, Guardian Notifications, API Gateway, Docker Compose stack.

---

## Quick Start

```bash
# 1. Clone and enter the repo
cd kannad

# 2. Copy env file and fill in your values (defaults work for demo)
cp .env.example .env

# 3. Generate a self-signed TLS cert (one-time, for the nginx gateway)
bash services/api-gateway/gen_certs.sh

# 4. Build and start the full stack
docker compose up --build

# 5. Verify services are up
curl http://localhost:4000/health    # SOS service
curl http://localhost:4001/health    # Cybercrime + Police Dashboard
```

The stack takes ~30 s to initialize. Postgres will auto-apply `services/schema.sql` on first run.

---

## Service Map

| Service | Port | Stack | Owner |
|---|---|---|---|
| SOS Microservice | 4000 | Node.js + Express + ws | Dev 1 |
| Cybercrime + Police Dashboard | 4001 | FastAPI + asyncpg | Dev 1 |
| AI Engine | 4002 | FastAPI (stub → Dev 2) | Dev 2 |
| API Gateway (nginx) | 80 / 443 | nginx | Dev 1 |
| Postgres | 5432 | Postgres 16 | Shared |
| Redis | 6379 | Redis 7 | Shared |
| Neo4j | 7474 / 7687 | Neo4j 5 | Dev 2 |
| MinIO | 9000 / 9001 | MinIO | Dev 1 |
| Web Console | 3000 | React (→ Dev 3) | Dev 3 |

---

## API Reference — SOS Service (port 4000)

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create victim user account |
| POST | `/api/auth/login` | None | Login → access + refresh tokens |
| POST | `/api/auth/refresh` | None | Rotate refresh token |
| POST | `/api/auth/mfa/setup` | Officer JWT | Generate TOTP QR for officer MFA |
| POST | `/api/auth/mfa/verify` | Officer JWT | Verify TOTP second factor |

### SOS

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/sos/trigger` | User JWT | One-touch SOS — creates incident, dispatches to ERSS, notifies guardians |
| POST | `/api/sos/checkin/:id` | User JWT | Dead-Man's Switch check-in |
| PATCH | `/api/sos/:id/status` | Officer JWT | Update status (`en_route`, `arrived`, `resolved`, …) |
| GET | `/api/sos/:id` | User/Officer JWT | Fetch incident detail |

### Emergency Contacts

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/user/contacts` | User JWT | List guardian contacts |
| POST | `/api/user/contacts` | User JWT | Add a guardian |
| DELETE | `/api/user/contacts/:id` | User JWT | Remove a guardian |

### WebSocket

```
ws://localhost:4000/ws/track?incidentId=<uuid>
```
- **Victim device** sends: `{"type":"location_update","lat":23.0,"lng":72.5,"ts":1234567890}`
- **Police console** receives: same, plus `sos_triggered`, `status_update`, `erss_dispatched`, `deadman_timeout_escalation`

---

## API Reference — Cybercrime + Police Dashboard (port 4001)

### Cybercrime Reporting

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/cyber/report` | User JWT | Create complaint (auto-triggers AI scans for URLs/profiles) |
| GET | `/api/cyber/report/:id` | User/Officer JWT | Fetch complaint + AI scores |
| PATCH | `/api/cyber/report/:id/status` | User/Officer JWT | Update status |
| POST | `/api/evidence/:incident_id` | User JWT | Upload evidence file (hash-chain recorded) |
| GET | `/api/evidence/:incident_id` | User/Officer JWT | List evidence records |
| GET | `/api/evidence/:incident_id/verify` | User/Officer JWT | Verify hash-chain integrity |

### Police Dashboard (Officer JWT required)

| Method | Path | Query Params | Description |
|---|---|---|---|
| GET | `/api/police/incidents` | `status`, `type`, `min_severity`, `page`, `page_size` | Paginated incident queue with AI flags |
| GET | `/api/police/incidents/:id` | — | Full detail: incident + AI scores + evidence + case links |
| PATCH | `/api/police/incidents/:id/status` | — | Officer sets status |
| GET | `/api/police/heatmap` | `hours` (default 24) | Lat/lng buckets for map overlay |
| GET | `/api/police/incidents/:id/case-links` | — | Repeat-offender linked cases |
| POST | `/api/police/fir/:id/draft` | — | AI-assisted FIR draft (officer must sign) |

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list. Key ones:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@postgres:5432/safetydb` | Postgres connection string |
| `JWT_SECRET` | **change this** | Shared secret for access tokens |
| `ERSS_MODE` | `mock` | `mock` (demo) or `live` (real 112) |
| `NOTIFY_MODE` | `mock` | `mock` (console log) or `twilio` |
| `MINIO_ENDPOINT` | `minio:9000` | MinIO / S3 endpoint |
| `AI_ENGINE_URL` | `http://ai-engine:4002` | Dev 2's AI engine base URL |

---

## Integration Contracts (for Dev 2 + Dev 3)

### Dev 2 — AI Engine endpoints called by cybercrime-service

| Endpoint | Body | Expected response fields |
|---|---|---|
| `POST /api/ai/phishing/scan` | `{url, incident_id}` | `risk_score`, `confidence`, `flag_for_review`, `top_signals` |
| `POST /api/ai/fake_profile/scan` | `{profile_url, incident_id}` | `risk_score`, `confidence`, `flag_for_review`, `features` |
| `POST /api/ai/harassment/scan` | `{messages: [str], incident_id}` | `severity`, `max_toxicity`, `is_escalating` |
| `POST /api/ai/fir/draft` | `{incident_id, category, description, complainant_name, incident_time, evidence_count}` | `draft_text`, `suggested_sections`, `requires_officer_signoff` |

### Dev 3 — WebSocket message shapes

**From victim device → server:**
```json
{ "type": "location_update", "lat": 23.022, "lng": 72.571, "ts": 1234567890 }
```

**From server → police console:**
```json
{ "type": "sos_triggered",           "incidentId": "...", "lat": 23.022, "lng": 72.571, "silent": false }
{ "type": "location_update",         "incidentId": "...", "lat": 23.022, "lng": 72.571 }
{ "type": "status_update",           "status": "en_route" }
{ "type": "erss_dispatched",         "erss_case_id": "MOCK-12345678" }
{ "type": "deadman_timeout_escalation", "incidentId": "...", "message": "..." }
```

---

## What's Intentionally Mocked (say this in demo Q&A)

- **112/ERSS + CCTNS** — mock adapters matching real API contract shape (`ERSS_MODE=mock`). Swap env vars when real credentials are available.
- **Guardian SMS** — logs to console (`NOTIFY_MODE=mock`). Flip to `twilio` with your Twilio credentials.
- **TLS cert** — self-signed for demo. Use Let's Encrypt in production.
- **Quantum-safe crypto** — not implemented per §6 of roadmap; SHA-256 hash-chain is the real tamper-evidence layer.

---

## Project Structure

```
kannad/
├── .env.example
├── .github/workflows/ci.yml
├── docker-compose.yml
├── README.md
├── services/
│   ├── schema.sql                        ← Shared DB schema (all 3 devs)
│   ├── api-gateway/
│   │   ├── nginx.conf
│   │   └── gen_certs.sh
│   ├── sos-service/                      ← Node.js (Dev 1)
│   │   ├── server.js
│   │   ├── erss_adapter.js
│   │   ├── guardian_notify.js
│   │   ├── middleware/auth.js
│   │   ├── __tests__/server.test.js
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── cybercrime-service/               ← FastAPI Python (Dev 1)
│   │   ├── main.py
│   │   ├── evidence.py
│   │   ├── auth.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── ai-engine/                        ← FastAPI Python (Dev 2 builds this)
└── web/                                  ← React (Dev 3 builds this)
```
