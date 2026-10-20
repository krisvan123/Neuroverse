"""Scientific tissue mesh only serves unchanged pinned bytes, never fake PLY."""

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.data.tissue import TissueMeshUnavailable, load_official_tissue_mesh
from app.main import create_app


def test_tissue_provenance_route_is_explicit(monkeypatch):
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/brain/tissue-source")
        assert response.status_code == 200
        d = response.json()
        assert "FLYWIRE_whole_brain.md" in d["source_reference"]
        assert "tissue_surface" in d["geometry_type"]


def test_pinned_tissue_mesh_route_returns_binary_only(monkeypatch):
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    with patch("app.api.tissue.load_official_tissue_mesh", return_value=(b"ply\n", "a" * 64)):
        with TestClient(create_app()) as client:
            response = client.get("/api/v1/brain/tissue-mesh")
            assert response.status_code == 200
            assert response.content == b"ply\n"
            assert response.headers["X-Neuroverse-Source-SHA256"] == "a" * 64


def test_official_mesh_unavailable_fails_closed(monkeypatch):
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    with patch("app.api.tissue.load_official_tissue_mesh", side_effect=TissueMeshUnavailable("offline")):
        with TestClient(create_app()) as client:
            assert client.get("/api/v1/brain/tissue-mesh").status_code == 503


def test_upstream_forgery_rejected(monkeypatch):
    from app.data import tissue

    class Reply:
        headers = {"Content-Length": "15"}
        def __enter__(self): return self
        def __exit__(self, *_): pass
        def read(self, *_): return b"ply\nfake-mesh!\n"

    tissue.load_official_tissue_mesh.cache_clear()
    monkeypatch.setattr(tissue, "urlopen", lambda *_a, **_k: Reply())
    try:
        import pytest
        with pytest.raises(TissueMeshUnavailable, match="Git blob"):
            tissue.load_official_tissue_mesh()
    finally:
        tissue.load_official_tissue_mesh.cache_clear()
