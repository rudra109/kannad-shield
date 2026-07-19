"""
FastAPI router — NLP Harassment / Escalation Detection
Endpoints:
  POST /api/ai/harassment/score-message
  POST /api/ai/harassment/score-conversation
"""

from fastapi import APIRouter
from pydantic import BaseModel

from modules.harassment_nlp import score_message, score_conversation

router = APIRouter()


class MessageRequest(BaseModel):
    text: str
    incident_id: str | None = None


class ConversationRequest(BaseModel):
    messages: list[str]
    incident_id: str | None = None


@router.post("/score-message", summary="Score a single message for harassment/toxicity")
def api_score_message(req: MessageRequest):
    """
    Returns a toxicity score (0–100) and severity label for a single message.
    Useful for real-time inline scanning as a victim types a complaint.
    """
    result = score_message(req.text)
    result["incident_id"] = req.incident_id
    return result


@router.post("/score-conversation", summary="Score a multi-turn message thread for escalation")
def api_score_conversation(req: ConversationRequest):
    """
    Analyzes an entire conversation thread for toxicity and escalation trend.
    Escalation flag catches a cyberstalker who starts mild and ramps up — a pattern
    single-message scoring misses.
    """
    result = score_conversation(req.messages)
    result["incident_id"] = req.incident_id
    return result
