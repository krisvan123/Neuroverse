"""Deployment contract checks for the optional single-domain Vercel Services setup."""
import json
import tomllib
from pathlib import Path

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[2]


def test_vercel_routes_are_specific_and_same_origin():
    config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    assert config["services"]["web"]["root"] == "frontend/"
    assert config["services"]["web"]["framework"] == "vite"
    assert config["services"]["api"]["root"] == "backend/"
    assert config["services"]["api"]["entrypoint"] == "main:app"
    assert config["services"]["api"]["framework"] == "fastapi"
    assert config["rewrites"] == [
        {"source": "/api/(.*)", "destination": {"service": "api"}},
        {"source": "/(.*)", "destination": {"service": "web"}},
    ]
    for service in config["services"].values():
        assert (ROOT / service["root"]).is_dir()
    assert "VITE_API_BASE_URL" not in config
    assert "NEUROVERSE_DATASET_DB" not in config


def test_vercel_entrypoint_uses_the_real_fastapi_app(monkeypatch):
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    monkeypatch.delenv("NEUROVERSE_STATIC_DIR", raising=False)
    from main import app as vercel_app
    from app.main import app as original_app
    assert vercel_app is original_app

    with TestClient(vercel_app) as client:
        status = client.get("/api/v1/health")
        assert status.status_code == 200
        assert status.json()["service"] == "neuroverse-api"
        no_dataset = client.get("/api/v1/datasets/current")
        assert no_dataset.status_code == 200
        assert no_dataset.json()["available"] is False


def test_vercel_uv_has_valid_project_metadata_and_runtime_dependencies():
    """Vercel invokes uv lock; tool-only pyproject.toml previously broke builds."""
    backend = ROOT / "backend"
    with (backend / "pyproject.toml").open("rb") as file:
        metadata = tomllib.load(file)
    project = metadata["project"]
    assert project["name"] == "neuroverse-api"
    assert project["version"] == "0.3.0"
    assert project["requires-python"] == ">=3.11"
    requirements = (backend / "requirements.txt").read_text(encoding="utf-8").splitlines()
    assert set(project["dependencies"]) == {line for line in requirements if line and not line.startswith("#")}
    assert (backend / ".python-version").read_text(encoding="utf-8").strip() == "3.12"
