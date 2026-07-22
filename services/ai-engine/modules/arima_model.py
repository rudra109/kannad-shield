"""
ARIMA Model for Crime Pattern Forecasting.
"""
import os
from pathlib import Path
import pandas as pd
import joblib

try:
    from statsmodels.tsa.arima.model import ARIMA
    _STATSMODELS_AVAILABLE = True
except ImportError:
    _STATSMODELS_AVAILABLE = False

MODEL_PATH = Path(__file__).parent.parent / "models" / "arima_forecast.joblib"

def train(csv_path: str = "data/daily_incidents.csv", out_path: str = str(MODEL_PATH)):
    """Trains an ARIMA model on daily incident counts."""
    if not _STATSMODELS_AVAILABLE:
        raise RuntimeError("statsmodels is required. pip install statsmodels")
    
    df = pd.read_csv(csv_path)
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    df.sort_index(inplace=True)
    
    # Train ARIMA model (p=5, d=1, q=0) for demo purposes
    model = ARIMA(df['incidents'], order=(5, 1, 0))
    model_fit = model.fit()
    
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(model_fit, out_path)
    print(f"[arima] Saved -> {out_path}")
    return model_fit

def load_model(path: str = str(MODEL_PATH)):
    return joblib.load(path)

def forecast_next_days(model_fit, days: int = 7) -> list:
    """Forecasts the incident counts for the next N days."""
    forecast = model_fit.forecast(steps=days)
    return [int(round(max(0, val))) for val in forecast]
