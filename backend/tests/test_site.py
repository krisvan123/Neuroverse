"""Phase 09: production-bundle, privacy and release-header regression checks."""
import pytest
from fastapi.testclient import TestClient
from app.main import create_app

@pytest.fixture
def production_site(tmp_path, monkeypatch):
    assets = tmp_path / "assets"
    assets.mkdir()
    (tmp_path / "index.html").write_text(
        '<!doctype html><html><head><title>Neuroverse</title></head>'
        '<body><script src="/assets/app-abc123.js"></script></body></html>', encoding="utf-8")
    (assets / "app-abc123.js").write_text("console.log('neuroverse');", encoding="utf-8")
    monkeypatch.setenv("NEUROVERSE_STATIC_DIR", str(tmp_path))
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    return tmp_path

def test_release_bundle_and_api_share_one_origin(production_site):
    with TestClient(create_app()) as client:
        homepage = client.get("/")
        assert homepage.status_code == 200
        assert "Neuroverse" in homepage.text
        assert homepage.headers["cache-control"] == "no-cache"
        assert homepage.headers["content-type"].startswith("text/html")
        bundle = client.get("/assets/app-abc123.js")
        assert bundle.status_code == 200
        assert bundle.headers["cache-control"] == "public, max-age=31536000, immutable"
        assert bundle.headers["x-content-type-options"] == "nosniff"
        api = client.get("/api/v1/health")
        assert api.status_code == 200
        assert api.json()["service"] == "neuroverse-api"
        assert api.headers["cache-control"] == "no-store"
        for response in (homepage, bundle, api):
            assert response.headers["x-frame-options"] == "DENY"
            assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
            assert "microphone=()" in response.headers["permissions-policy"]

def test_static_files_do_not_expose_parent_or_unknown_paths(production_site):
    (production_site.parent / "secret.txt").write_text("private", encoding="utf-8")
    with TestClient(create_app()) as client:
        assert client.get("/assets/does-not-exist.js").status_code == 404
        assert client.get("/secret.txt").status_code == 404
        assert client.get("/assets/%2e%2e/secret.txt").status_code in (404, 400)
        assert client.get("/api/v1/health").status_code == 200

def test_bad_bundle_configuration_fails_loudly(tmp_path, monkeypatch):
    monkeypatch.setenv("NEUROVERSE_STATIC_DIR", str(tmp_path))
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    with pytest.raises(RuntimeError, match="index.html and assets"):
        create_app()

def test_api_only_still_runs_without_bundle(monkeypatch):
    monkeypatch.delenv("NEUROVERSE_STATIC_DIR", raising=False)
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    with TestClient(create_app()) as client:
        assert client.get("/").status_code == 404
        assert client.get("/api/v1/health").status_code == 200
        assert client.get("/api/v1/health").headers["x-content-type-options"] == "nosniff"
