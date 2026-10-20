"""Executable API contract and security regression checks."""

import pytest
from fastapi.testclient import TestClient

from app.config import get_allowed_origins
from app.main import create_app


@pytest.fixture
def client():
    with TestClient(create_app()) as test_client:
        yield test_client


def test_health_contract(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "neuroverse-api",
        "phase": 2,
        "version": "0.1.0",
    }


def test_capabilities_do_not_claim_unimplemented_science(client):
    response = client.get("/api/v1/capabilities")
    assert response.status_code == 200
    capability = response.json()
    assert capability["stage"] == "engineering-foundation"
    assert not capability["real_dataset_loaded"]
    assert not capability["three_d_explorer_available"]
    assert not capability["experiments_available"]


def test_missing_route_returns_404(client):
    assert client.get("/api/v1/neurons/123").status_code == 404


def test_openapi_includes_documented_health_endpoint(client):
    document = client.get("/openapi.json").json()
    assert "/api/v1/health" in document["paths"]
    assert document["paths"]["/api/v1/health"]["get"]["responses"]["200"]


def test_cors_allows_only_known_browser_origins(client):
    allowed = client.get("/api/v1/health", headers={"Origin": "http://localhost:5173"})
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"
    rejected = client.get("/api/v1/health", headers={"Origin": "https://untrusted.example"})
    assert "access-control-allow-origin" not in rejected.headers


def test_invalid_wildcard_cors_fails_closed(monkeypatch):
    monkeypatch.setenv("NEUROVERSE_CORS_ORIGINS", "*")
    with pytest.raises(ValueError, match="Wildcard"):
        get_allowed_origins()


def test_cors_configuration_is_normalized(monkeypatch):
    monkeypatch.setenv("NEUROVERSE_CORS_ORIGINS", " https://example.org/,https://example.org, ")
    assert get_allowed_origins() == ["https://example.org"]
