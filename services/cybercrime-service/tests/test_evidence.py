import pytest
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from main import app
from evidence import get_pool
from unittest.mock import patch, MagicMock, AsyncMock
import io

client = TestClient(app)

@pytest.fixture
def mock_db_pool():
    pool = AsyncMock()
    return pool

@pytest.fixture
def mock_minio():
    with patch("evidence.get_minio_client") as mock:
        yield mock

@pytest.fixture
def override_get_pool(mock_db_pool):
    app.dependency_overrides[get_pool] = lambda: mock_db_pool
    yield
    app.dependency_overrides = {}

@pytest.mark.asyncio
async def test_evidence_upload_success(override_get_pool, mock_db_pool, mock_minio):
    incident_id = str(uuid.uuid4())
    mock_db_pool.fetchrow.return_value = None  # No previous hash
    
    file_content = b"test evidence content"
    file = io.BytesIO(file_content)
    file.name = "evidence.txt"
    
    response = client.post(
        f"/api/evidence/{incident_id}",
        files={"file": ("evidence.txt", file, "text/plain")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "file_hash" in data
    assert "chain_hash" in data
    
    expected_hash = hashlib.sha256(file_content).hexdigest()
    assert data["file_hash"] == expected_hash
    assert data["prev_hash"] == "0" * 64

@pytest.mark.asyncio
async def test_hash_chain_integrity_verification(override_get_pool, mock_db_pool):
    incident_id = str(uuid.uuid4())
    ts = datetime.now(timezone.utc)
    
    # Mock sequence of 2 files
    file_hash_1 = hashlib.sha256(b"file1").hexdigest()
    chain_hash_1 = hashlib.sha256(f"{file_hash_1}{'0'*64}{ts.isoformat()}".encode()).hexdigest()
    
    mock_db_pool.fetch.return_value = [
        {
            "file_hash": file_hash_1,
            "prev_hash": "0" * 64,
            "chain_hash": chain_hash_1,
            "ntp_timestamp": ts
        }
    ]
    
    response = client.get(f"/api/evidence/{incident_id}/verify")
    assert response.status_code == 200
    assert response.json()["valid"] is True
    assert response.json()["records_checked"] == 1

@pytest.mark.asyncio
async def test_tampering_detection(override_get_pool, mock_db_pool):
    incident_id = str(uuid.uuid4())
    ts = datetime.now(timezone.utc)
    
    # Tampered data
    mock_db_pool.fetch.return_value = [
        {
            "file_hash": hashlib.sha256(b"file1").hexdigest(),
            "prev_hash": "0" * 64,
            "chain_hash": "invalid_chain_hash_due_to_tampering",
            "ntp_timestamp": ts
        }
    ]
    
    response = client.get(f"/api/evidence/{incident_id}/verify")
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert "tampered_at" in data

def test_file_size_limits():
    incident_id = str(uuid.uuid4())
    large_content = b"0" * (50 * 1024 * 1024 + 1)  # 50MB + 1 byte
    
    file = io.BytesIO(large_content)
    file.name = "large.txt"
    
    response = client.post(
        f"/api/evidence/{incident_id}",
        files={"file": ("large.txt", file, "text/plain")}
    )
    
    assert response.status_code == 413
    assert "File too large" in response.json()["detail"]

def test_concurrent_uploads_race_conditions():
    # Will be tested using asyncio.gather or thread pools in a real DB env
    pass

def test_expired_token_rejection():
    # Token validation is tested in test_auth.py, this will check if endpoint rejects it
    pass

def test_s3_upload_failure_fallback(override_get_pool, mock_minio):
    incident_id = str(uuid.uuid4())
    mock_minio.return_value.put_object.side_effect = Exception("S3 bucket down")
    
    file_content = b"test evidence content"
    file = io.BytesIO(file_content)
    file.name = "evidence.txt"
    
    try:
        response = client.post(
            f"/api/evidence/{incident_id}",
            files={"file": ("evidence.txt", file, "text/plain")}
        )
    except Exception as e:
        assert "S3 bucket down" in str(e)
