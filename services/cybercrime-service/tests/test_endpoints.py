import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app, get_db
import uuid

client = TestClient(app)

@pytest.fixture
def mock_db_pool():
    pool = AsyncMock()
    return pool

@pytest.fixture
def override_get_db(mock_db_pool):
    app.dependency_overrides[get_db] = lambda: mock_db_pool
    yield
    app.dependency_overrides = {}

@pytest.fixture
def override_auth_user():
    def mock_verify_token():
        return {"sub": str(uuid.uuid4()), "role": "user"}
    from auth import verify_token
    app.dependency_overrides[verify_token] = mock_verify_token
    yield
    app.dependency_overrides.pop(verify_token, None)

@pytest.fixture
def override_auth_officer():
    def mock_require_officer():
        return {"sub": str(uuid.uuid4()), "role": "officer"}
    from auth import require_officer
    app.dependency_overrides[require_officer] = mock_require_officer
    yield
    app.dependency_overrides.pop(require_officer, None)

@pytest.mark.asyncio
async def test_full_report_creation_flow(override_get_db, override_auth_user, mock_db_pool):
    payload = {
        "category": "fraud",
        "description": "Someone tried to scam me out of money.",
        "perpetrator_phone": "1234567890"
    }
    
    with patch("main.call_ai_engine", return_value={"risk_score": 85, "severity": 8}) as mock_ai:
        response = client.post("/api/cyber/report", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert "incident_id" in data
        assert data["status"] == "open"
        assert mock_db_pool.execute.called

@pytest.mark.asyncio
async def test_ai_scoring_triggers_on_report_submission(override_get_db, override_auth_user, mock_db_pool):
    payload = {
        "category": "phishing",
        "description": "Suspicious link.",
        "phishing_url": "http://evil-link.com",
        "suspect_profile_url": "http://social.com/scammer"
    }
    
    with patch("main.call_ai_engine", new_callable=AsyncMock) as mock_ai:
        mock_ai.return_value = {"risk_score": 90, "features": {"malicious": True}}
        
        response = client.post("/api/cyber/report", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert "scans_triggered" in data
        assert len(data["scans_triggered"]) == 3  # phishing, fake_profile, harassment_nlp

@pytest.mark.asyncio
async def test_status_update_workflow(override_get_db, override_auth_user, mock_db_pool):
    incident_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # Re-override to specific user_id
    from auth import verify_token
    app.dependency_overrides[verify_token] = lambda: {"sub": user_id, "role": "user"}
    
    mock_db_pool.fetchrow.return_value = {"user_id": uuid.UUID(user_id)}
    
    # User closing their own report
    payload = {"status": "closed"}
    response = client.patch(f"/api/cyber/report/{incident_id}/status", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "closed"
    
    # User trying to change to arbitrary status
    payload = {"status": "under_review"}
    response = client.patch(f"/api/cyber/report/{incident_id}/status", json=payload)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_permission_checks_officer(override_get_db, override_auth_officer, mock_db_pool):
    incident_id = str(uuid.uuid4())
    
    # Officer updating status
    payload = {"status": "dispatched"}
    response = client.patch(f"/api/police/incidents/{incident_id}/status", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "dispatched"
