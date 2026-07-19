"""
FastAPI router — Predictive Heat-Map
Endpoint: POST /api/ai/heatmap/predict
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import logging

from modules.heatmap_model import load_model, predict_grid, MODEL_PATH

router = APIRouter()
logger = logging.getLogger(__name__)

try:
    _model = load_model()
    logger.info("Heat-map model loaded successfully.")
except FileNotFoundError:
    logger.warning(
        f"Heat-map model not found at {MODEL_PATH}. "
        "Run `python train_all.py` to train and save the model."
    )
    _model = None


class HeatmapRequest(BaseModel):
    hour: int = Field(20, ge=0, le=23, description="Hour of day (0–23) to predict for")
    day_of_week: int = Field(4, ge=0, le=6, description="Day of week (0=Mon … 6=Sun)")


@router.post("/predict", summary="Predict incident risk across the city grid for a given time")
def predict_heatmap(req: HeatmapRequest):
    """
    Returns risk scores (0–100) for a 20×20 grid covering Ahmedabad city,
    predicted for the given hour and day of week.

    The police dashboard overlays these scores as a heat-map so patrols
    can be pre-positioned before incidents occur.
    """
    if _model is None:
        raise HTTPException(
            status_code=503,
            detail="Heat-map model not loaded. Run train_all.py to initialize models.",
        )
    grid = predict_grid(_model, hour=req.hour, day_of_week=req.day_of_week)
    return {
        "hour": req.hour,
        "day_of_week": req.day_of_week,
        "grid_cells": len(grid),
        "cells": grid,
    }
