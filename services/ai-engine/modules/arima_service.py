from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import logging
from datetime import datetime, timedelta

from modules.arima_model import load_model, forecast_next_days, MODEL_PATH

router = APIRouter()
logger = logging.getLogger(__name__)

try:
    _model = load_model()
    logger.info("ARIMA model loaded successfully.")
except FileNotFoundError:
    logger.warning(f"ARIMA model not found at {MODEL_PATH}.")
    _model = None

class ForecastRequest(BaseModel):
    days: int = Field(7, ge=1, le=30, description="Number of days to forecast")

@router.post("/predict", summary="Forecast incident counts using ARIMA")
def predict_incidents(req: ForecastRequest):
    if _model is None:
        raise HTTPException(
            status_code=503,
            detail="ARIMA model not loaded. Run train_all.py to initialize models."
        )
    
    forecasts = forecast_next_days(_model, days=req.days)
    
    # Generate dates for the forecast
    base_date = datetime.now()
    results = []
    for i, count in enumerate(forecasts):
        dt = base_date + timedelta(days=i)
        results.append({
            "date": dt.strftime("%Y-%m-%d"),
            "expected_incidents": count
        })
        
    total_expected = sum(forecasts)
    
    # High risk days threshold: 20% above average
    avg = total_expected / len(forecasts) if len(forecasts) > 0 else 0
    high_risk_days = [res["date"] for res in results if res["expected_incidents"] > avg * 1.2]
    
    return {
        "days_forecasted": req.days,
        "total_expected": total_expected,
        "forecast": results,
        "high_risk_days": high_risk_days
    }
