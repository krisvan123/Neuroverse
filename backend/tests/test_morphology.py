"""Known-answer binary fixtures check morphology source decoding and fail-closed API."""

import struct
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.data.morphology import (
    MAX_BINARY_BYTES, SKELETON_BASE, SkeletonError, SkeletonNotFound,
    SkeletonUnavailable, decode_skeleton, get_skeleton,
)
from app.main import create_app

RID = "720575940625431866"


def fixture(vertices=None, edges=None, radii=None):
    vertices = vertices or [(100000, 250000, 20000), (101000, 250000, 20000),
                            (101000, 251000, 20100)]
    edges = edges or [(0, 1), (1, 2)]
    radii = radii or [10.0] * len(vertices)
    return (
        struct.pack("<II", len(vertices), len(edges))
        + b"".join(struct.pack("<fff", *xyz) for xyz in vertices)
        + b"".join(struct.pack("<II", *e) for e in edges)
        + b"".join(struct.pack("<f", r) for r in radii)
    )


def test_decode_original_nanometer_coordinates_and_edges():
    raw = fixture()
    result = decode_skeleton(raw, RID)
    assert result["root_id"] == RID
    assert result["snapshot"] == "783"
    assert result["units"] == "nanometer"
    assert result["source_url"] == SKELETON_BASE + "/" + RID
    assert result["vertex_count"] == 3
    assert result["edges"] == [[0, 1], [1, 2]]
    assert result["vertices"][0] == [100000, 250000, 20000]
    assert result["radii"] == [10.0, 10.0, 10.0]
    assert len(result["source_sha256"]) == 64


@pytest.mark.parametrize("bad", [
    b"", b"00000",
    fixture()[:-1],
    fixture(edges=[(0, 9)]),
    fixture(edges=[(0, 0)]),
    fixture(vertices=[(float("nan"), 1, 2)], edges=[], radii=[0.1]),
    fixture(vertices=[(100, 100, 100)], edges=[], radii=[-4]),
    b"\x00" * 8,
    b"\x00" * (MAX_BINARY_BYTES + 1),
])
def test_reject_corrupt_binary_without_making_up_morphology(bad):
    with pytest.raises(SkeletonError):
        decode_skeleton(bad, RID)


def test_neuron_skeleton_api_works_without_local_connectivity_dataset(monkeypatch):
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    with patch("app.api.morphology.get_skeleton", return_value=decode_skeleton(fixture(), RID)):
        with TestClient(create_app()) as client:
            result = client.get(f"/api/v1/neurons/{RID}/skeleton")
            assert result.status_code == 200
            assert result.json()["edge_count"] == 2
            assert result.json()["geometry_type"] == "precomputed_neuron_skeleton_centerlines"


def test_skeleton_endpoint_reports_real_source_failures(monkeypatch):
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    with TestClient(create_app()) as client:
        with patch("app.api.morphology.get_skeleton", side_effect=SkeletonNotFound("absent")):
            assert client.get(f"/api/v1/neurons/{RID}/skeleton").status_code == 404
        with patch("app.api.morphology.get_skeleton", side_effect=SkeletonUnavailable("offline")):
            assert client.get(f"/api/v1/neurons/{RID}/skeleton").status_code == 503
        assert client.get("/api/v1/neurons/not-an-id/skeleton").status_code == 422


def test_malformed_url_id_never_fetched():
    get_skeleton.cache_clear()
    with pytest.raises(SkeletonError):
        get_skeleton("abc/../../123")
