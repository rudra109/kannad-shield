# AI/ML Threat Engine

**Developer 2 — AI/ML Engineer** | Kanad S.H.I.E.L.D. Hackathon (PS-69EEFD950B72D)

Full implementation of the AI/ML Threat Engine from §3 of the roadmap as a set of FastAPI microservices.

---

## Modules Implemented

| Module | Endpoint | Closes |
|---|---|---|
| Phishing / URL Classifier | `POST /api/ai/phishing/scan` | Requirement 4c / 6a |
| Fake Profile Classifier | `POST /api/ai/fake-profile/scan` | Requirement 4c |
| NLP Harassment Detection | `POST /api/ai/harassment/score-message` + `/score-conversation` | §3.1 |
| Deepfake / Image Forensics | `POST /api/ai/deepfake/check` | §3.1 |
| Social Exposure Scanner | `POST /api/ai/social/scan` | Requirement 6c |
| Facial Recognition (Police) | `POST /api/ai/facial/search` | Bonus item |
| Predictive Heat-Map | `POST /api/ai/heatmap/predict` | Bonus item |
| Entity Resolution | `POST /api/ai/entity/link` + `GET /api/ai/entity/linked-cases/{id}` | Req 7b / 7c |
| FIR Drafting | `POST /api/ai/fir/draft` | Requirement 4b |

---

## Quick Start

### 1. Install dependencies
```bash
cd services/ai-engine
pip install -r requirements.txt
```

### 2. Generate seed training data
```bash
python seed_data.py          # generates data/ CSVs
python seed_data.py --index  # also builds the FAISS facial index (requires faiss-cpu)
```

### 3. Train all models
```bash
python train_all.py
```

### 4. Start the API server
```bash
uvicorn main:app --reload --port 4002
```

### 5. Open the interactive API docs
```
http://localhost:4002/docs
```

---

## Running via Docker Compose (full stack)

From the project root:
```bash
docker-compose up ai-engine
```

The AI engine is available at `http://localhost:4002`.

---

## Running Tests
```bash
cd services/ai-engine
pytest tests/ -v                           # all tests (model tests skip if not trained)
pytest tests/ -v -m "not slow"             # skip HuggingFace model tests
pytest tests/test_phishing.py -v           # single module
```

---

## Demo Quick-Check (after training)

```bash
# Phishing scan
curl -X POST http://localhost:4002/api/ai/phishing/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "http://login-verify-account.xyz/secure?token=abc123"}'

# Fake profile scan
curl -X POST http://localhost:4002/api/ai/fake-profile/scan \
  -H "Content-Type: application/json" \
  -d '{"username": "user1234", "account_age_days": 3, "follower_count": 2, "following_count": 4000}'

# Social exposure scan
curl -X POST http://localhost:4002/api/ai/social/scan \
  -H "Content-Type: application/json" \
  -d '{"phone_visible": true, "address_or_location_tagged": true}'

# FIR draft
curl -X POST http://localhost:4002/api/ai/fir/draft \
  -H "Content-Type: application/json" \
  -d '{"category": "stalking", "complainant_name": "Priya Sharma", "description": "Victim received repeated threatening messages."}'

# Heat-map (evening rush hour, Friday)
curl -X POST http://localhost:4002/api/ai/heatmap/predict \
  -H "Content-Type: application/json" \
  -d '{"hour": 20, "day_of_week": 4}'
```

---

## File Structure

```
services/ai-engine/
├── main.py                          # FastAPI app — mounts all routers
├── requirements.txt
├── Dockerfile
├── seed_data.py                     # Generates training CSV + FAISS index
├── train_all.py                     # One-shot: train + save all models
├── modules/
│   ├── phishing_model.py + phishing_service.py
│   ├── fake_profile_model.py + fake_profile_service.py
│   ├── harassment_nlp.py + harassment_service.py
│   ├── deepfake_check.py + deepfake_service.py
│   ├── social_scanner.py + social_service.py
│   ├── facial_missing_persons.py + facial_service.py
│   ├── heatmap_model.py + heatmap_service.py
│   ├── entity_resolution.py + entity_service.py
│   └── fir_drafter.py + fir_service.py
├── model_cards/
│   ├── phishing_model_card.md
│   ├── fake_profile_model_card.md
│   └── facial_recognition_model_card.md
└── tests/
    ├── test_phishing.py
    ├── test_fake_profile.py
    ├── test_harassment.py
    ├── test_deepfake.py
    └── test_entity_resolution.py
```

---

## Responsible-AI Guardrails

All modules follow §3.7 of the roadmap:
- Every AI score ships with `confidence` and `top_signals` — no black-box verdicts.
- `flag_for_review: true` routes to a human reviewer — nothing auto-blocks.
- Facial recognition: mandatory `justification` field + full audit log on every search.
- Every response `note` field states the human-in-the-loop expectation.

---

## Integration with Other Developers

- **Dev 1 (Backend):** AI engine is called from cybercrime-service after a report is submitted. The `incident_id` field links AI scores back to the `ai_scores` table.
- **Dev 3 (Frontend):** Phishing scan called inline from the report form. AI risk badges read from the `ai_scores` table via the police dashboard API.
- **Shared contract:** All requests/responses are JSON-documented at `/docs`.
