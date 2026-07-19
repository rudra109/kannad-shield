from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
import asyncpg
from typing import Optional

# We will use main's get_db and auth dependencies.
# In main.py, we have get_db and require_officer, but to avoid circular import, 
# we can import them from main in the endpoint, or structure it differently.
# A common pattern is to just assume they are passed via router dependencies or imported.
# For simplicity, we import them from the module where they are defined.
from auth import require_officer

async def get_local_db():
    from main import get_db
    return await get_db()

router = APIRouter(prefix="/api/police/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard_metrics(
    db: asyncpg.Pool = Depends(get_local_db),
    token: dict = Depends(require_officer)
):
    """Returns KPIs, trend data, heatmap for police dashboard."""
    
    # 1. Average response time (incident creation → officer arrival)
    avg_response = await db.fetchval("""
        SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60)
        FROM incidents
        WHERE status = 'arrived'
        AND created_at > NOW() - INTERVAL '7 days'
    """)
    
    # 2. Active incidents by type
    active_counts = await db.fetch("""
        SELECT incident_type, COUNT(*) as count
        FROM incidents
        WHERE status IN ('open', 'dispatched', 'en_route')
        GROUP BY incident_type
    """)
    
    # 3. Heatmap data (lat/lng grid buckets)
    heatmap_data = await db.fetch("""
        SELECT 
            ROUND(lat::numeric, 3) as lat,
            ROUND(lng::numeric, 3) as lng,
            COUNT(*) as intensity,
            MAX(severity) as max_severity
        FROM incidents
        WHERE created_at > NOW() - INTERVAL '24 hours'
        AND lat IS NOT NULL AND lng IS NOT NULL
        GROUP BY ROUND(lat::numeric, 3), ROUND(lng::numeric, 3)
    """)
    
    # 4. Risk score distribution
    risk_dist = await db.fetch("""
        SELECT 
            FLOOR(score / 10) * 10 as risk_bucket,
            COUNT(*) as count
        FROM ai_scores
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY FLOOR(score / 10)
        ORDER BY risk_bucket
    """)
    
    # 5. 7-day incident trend
    trend_data = await db.fetch("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as total,
            SUM(CASE WHEN incident_type='physical' THEN 1 ELSE 0 END) as sos,
            SUM(CASE WHEN incident_type='cyber' THEN 1 ELSE 0 END) as cyber,
            AVG(severity) as avg_severity
        FROM incidents
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    """)
    
    # 6. Top repeat offenders (from entity_resolution)
    repeat_offenders = await db.fetch("""
        SELECT 
            perpetrator_phone,
            COUNT(*) as incident_count,
            MAX(severity) as max_severity,
            ARRAY_AGG(id) as incident_ids
        FROM incidents
        WHERE perpetrator_phone IS NOT NULL
        GROUP BY perpetrator_phone
        HAVING COUNT(*) > 1
        ORDER BY incident_count DESC
        LIMIT 10
    """)
    
    return {
        "avgResponseTime": float(avg_response) if avg_response else 0,
        "activeIncidents": dict([(r['incident_type'], r['count']) for r in active_counts]),
        "heatmapData": [dict(r) for r in heatmap_data],
        "riskDistribution": [dict(r) for r in risk_dist],
        "trendData": [dict(r) for r in trend_data],
        "topRepeatOffenders": [dict(r) for r in repeat_offenders],
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/reports/custom")
async def generate_custom_report(
    start_date: datetime,
    end_date: datetime,
    incident_types: Optional[str] = None, # comma separated for easy GET query string
    severity_min: int = 0,
    db: asyncpg.Pool = Depends(get_local_db),
    token: dict = Depends(require_officer)
):
    """Generate custom report based on filters."""
    query = "SELECT * FROM incidents WHERE created_at BETWEEN $1 AND $2"
    params = [start_date, end_date]
    idx = 3
    
    if incident_types:
        types_list = [t.strip() for t in incident_types.split(",")]
        query += f" AND incident_type = ANY(${idx})"
        params.append(types_list)
        idx += 1
    
    if severity_min > 0:
        query += f" AND severity >= ${idx}"
        params.append(severity_min)
        idx += 1
    
    incidents = await db.fetch(query, *params)
    
    # Mocking PDF/CSV generation
    return {
        "status": "success",
        "incidents_count": len(incidents),
        "download_url": "mock_report_url",
        "message": "Report generated (mocked)"
    }

@router.get("/forecasts/incident-spike")
async def forecast_incident_spikes(
    db: asyncpg.Pool = Depends(get_local_db),
    token: dict = Depends(require_officer)
):
    """Predict likely incident spikes in next 48 hours."""
    # Mocked forecasting response
    return {
        "forecasts": [
            {"region": "Downtown", "probability": 0.85, "expected_time": (datetime.utcnow() + timedelta(hours=12)).isoformat()},
            {"region": "North Side", "probability": 0.6, "expected_time": (datetime.utcnow() + timedelta(hours=24)).isoformat()}
        ],
        "message": "Forecasts generated (mocked)"
    }
