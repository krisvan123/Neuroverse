"""Authenticated FlyWire neuropil source is distinct from whole tissue surface."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.data.neuropil import (
    NEUROPIL_GIT_BLOB_SHA1,
    NeuropilMeshUnavailable,
    load_official_neuropil_mesh,
)
from app.main import create_app


def test_neuropil_source_has_correct_origin_and_limits():
    with TestClient(create_app()) as client:
        reply = client.get("/api/v1/brain/neuropil-source")
        assert reply.status_code == 200
        data = reply.json()
        assert data["source_git_blob_sha1"] == NEUROPIL_GIT_BLOB_SHA1
        assert data["source_mesh_url"].endswith("/FLYWIRE.ply")
        assert "fafb14" in data["geometry_type"]
        assert any("not an unprocessed" in text.lower() for text in data["limitations"])


def test_neuropil_binary_route_serves_original_bytes():
    with patch("app.api.tissue.load_official_neuropil_mesh", return_value=(b"ply\\n", "f" * 64)):
        with TestClient(create_app()) as client:
            reply = client.get("/api/v1/brain/neuropil-mesh")
            assert reply.status_code == 200
            assert reply.content == b"ply\\n"
            assert reply.headers["X-Neuroverse-Source-SHA256"] == "f" * 64
            assert "neuropil" in reply.headers["X-Neuroverse-Dataset"]


def test_neuropil_network_offline_fails_closed():
    with patch("app.api.tissue.load_official_neuropil_mesh", side_effect=NeuropilMeshUnavailable("offline")):
        with TestClient(create_app()) as client:
            assert client.get("/api/v1/brain/neuropil-mesh").status_code == 503


def test_forged_original_is_rejected(monkeypatch):
    from app.data import neuropil

    class Reply:
        headers = {"Content-Length": "500"}

        def __enter__(self): return self

        def __exit__(self, *_): pass

        def read(self, *_): return b"ply" + b"badfake" * 100

    neuropil.load_official_neuropil_mesh.cache_clear()
    monkeypatch.setattr(neuropil, "urlopen", lambda *_a, **_k: Reply())
    try:
        with pytest.raises(NeuropilMeshUnavailable, match="Git blob"):
            neuropil.load_official_neuropil_mesh()
    finally:
        neuropil.load_official_neuropil_mesh.cache_clear()
