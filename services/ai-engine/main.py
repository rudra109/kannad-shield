"""
AI/ML Threat Engine — FastAPI Application Entry Point
Developer 2 owns this entire service (see roadmap §8, Developer 2).

Endpoints exposed:
  POST /api/ai/phishing/scan
  POST /api/ai/fake-profile/scan
  POST /api/ai/harassment/score-message
  POST /api/ai/harassment/score-conversation
  POST /api/ai/deepfake/check
  POST /api/ai/social/scan
  POST /api/ai/facial/search          (police-only)
  POST /api/ai/heatmap/predict
  POST /api/ai/entity/link
  GET  /api/ai/entity/linked-cases/{incident_id}
  POST /api/ai/fir/draft
  GET  /health
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from modules.phishing_service import router as phishing_router
from modules.fake_profile_service import router as fake_profile_router
from modules.harassment_service import router as harassment_router
from modules.deepfake_service import router as deepfake_router
from modules.social_service import router as social_router
from modules.facial_service import router as facial_router
from modules.heatmap_service import router as heatmap_router
from modules.entity_service import router as entity_router
from modules.fir_service import router as fir_router
from modules.arima_service import router as arima_router

app = FastAPI(
    title="Cyber Safety Platform — AI/ML Threat Engine",
    description=(
        "Unified AI/ML threat-detection microservices for the Kanad S.H.I.E.L.D. "
        "hackathon submission (PS-69EEFD950B72D). Every AI score includes confidence "
        "and top-feature explanations. Nothing auto-blocks — all high-risk flags are "
        "routed to a human reviewer."
    ),
    version="2.0.0",
)

# Allow the React police console and Flutter app to call this service during local demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to specific origins in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all module routers
app.include_router(phishing_router, prefix="/api/ai/phishing", tags=["Phishing Detection"])
app.include_router(fake_profile_router, prefix="/api/ai/fake-profile", tags=["Fake Profile Detection"])
app.include_router(harassment_router, prefix="/api/ai/harassment", tags=["NLP Harassment"])
app.include_router(deepfake_router, prefix="/api/ai/deepfake", tags=["Deepfake / Image Forensics"])
app.include_router(social_router, prefix="/api/ai/social", tags=["Social Exposure Scanner"])
app.include_router(facial_router, prefix="/api/ai/facial", tags=["Facial Recognition (Police-Only)"])
app.include_router(heatmap_router, prefix="/api/ai/heatmap", tags=["Predictive Heat-Map"])
app.include_router(arima_router, prefix="/api/ai/arima", tags=["ARIMA Pattern Forecasting"])
app.include_router(entity_router, prefix="/api/ai/entity", tags=["Entity Resolution"])
app.include_router(fir_router, prefix="/api/ai/fir", tags=["FIR Drafting"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "ai-engine", "version": "2.0.0"}
