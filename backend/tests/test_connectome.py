"""Integration tests for deterministic connectome ETL and read-only API.

Every CSV generated in this module is synthetic; never market these fixtures
as FlyWire research observations.
"""

import csv
import gzip
import json
import sqlite3

import pytest
from fastapi.testclient import TestClient

from app.data.pipeline import DataValidationError, build_subgraph, file_hash, root_id
from app.data.store import DataIntegrityError, GraphStore
from app.main import create_app

A = "720575940000000001"
B = "720575940000000002"
C = "720575940000000003"
D = "720575940000000004"
E = "720575940000000005"


@pytest.fixture
def synthetic_files(tmp_path):
    source = tmp_path / "synthetic-connections.csv.gz"
    # Deliberately contains multiple neuropil records for A -> B.
    rows = [
        (A, B, 3, "region_x"),
        (A, B, 4, "region_y"),
        (B, A, 10, "region_x"),
        (A, C, 6, "region_x"),
        (D, A, 8, "region_y"),
        (C, D, 5, "region_y"),
        (B, E, 1, "region_x"),
    ]
    with gzip.open(source, "wt", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["pre_root_id", "post_root_id", "syn_count", "neuropil"])
        writer.writerows(rows)
    annotation = tmp_path / "types.csv"
    annotation.write_text(
        "root_id,cell_type\n"
        f"{A},Synthetic sensory example\n"
        f"{B},Synthetic interneuron example\n"
        f"{D},Synthetic motor example\n",
        encoding="utf-8",
    )
    return source, annotation, tmp_path / "small.sqlite3"


@pytest.fixture
def prepared(synthetic_files):
    source, annotations, target = synthetic_files
    manifest = build_subgraph(
        source, target, seed=A, neuron_annotations=annotations,
        max_neurons=4, max_edges=20,
    )
    return target, manifest


def test_real_root_ids_are_strings_and_not_js_floats():
    assert root_id(A) == A
    assert root_id("000123") == "123"
    for invalid in ("", "abc", "-1", "0", "９", str(2**63), "1.5"):
        with pytest.raises(DataValidationError):
            root_id(invalid)


def test_import_aggregates_regions_while_retaining_direction(prepared):
    target, manifest = prepared
    assert manifest["source_rows_read"] == 7
    assert manifest["nodes_selected"] == 4
    assert manifest["edges_selected"] == 5
    assert manifest["seed_root_id"] == A
    assert manifest["license"] == "CC BY-NC 4.0"
    assert manifest["source_identity_verified"] is False
    assert manifest["source_sha256"]
    assert manifest["database_sha256"] == file_hash(target)
    with sqlite3.connect(target) as con:
        records = dict(con.execute(
            "SELECT pre_root_id || '>' || post_root_id, syn_count FROM connections"
        ))
        assert records[A + ">" + B] == 7
        assert records[B + ">" + A] == 10
        assert E not in [node for (node,) in con.execute("SELECT root_id FROM neurons")]


def test_bounded_deterministic_selection_and_direction(synthetic_files):
    source, _, target = synthetic_files
    result = build_subgraph(source, target, seed=A, max_neurons=2, max_edges=1)
    assert result["nodes_selected"] == 2
    assert result["edges_selected"] == 1
    assert result["synapses_in_selected_edges"] == 10
    with sqlite3.connect(target) as con:
        assert con.execute("SELECT pre_root_id,post_root_id FROM connections").fetchone() == (B, A)


def test_load_types_and_graph_read_api(prepared):
    target, _ = prepared
    graph = GraphStore(target)
    assert graph.info()["source_identity_verified"] is False
    assert graph.search("Synthetic")[0]["root_id"] == A
    assert graph.search("sensory")[0]["cell_type"] == "Synthetic sensory example"
    assert graph.search("nothing%") == []
    assert graph.neuron(A)["incoming_partner_count"] == 2
    assert graph.neuron(A)["outgoing_partner_count"] == 2
    assert graph.connections(A, "outgoing")[0]["syn_count"] == 7
    assert graph.connections(A, "incoming")[0]["syn_count"] == 10
    snapshot = graph.neighborhood(A)
    assert snapshot["structural_not_functional"] is True
    assert len(snapshot["nodes"]) == 4
    assert len(snapshot["edges"]) == 5


def test_reject_inconsistent_database_or_manifest(prepared):
    target, manifest = prepared
    manifest_path = target.with_suffix(".manifest.json")
    data = json.loads(manifest_path.read_text())
    data["database_sha256"] = "0" * 64
    manifest_path.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(DataIntegrityError, match="SHA-256"):
        GraphStore(target)
    data["database_sha256"] = manifest["database_sha256"]
    data["source_identity_verified"] = True  # Cannot elevate user data to verified.
    manifest_path.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(DataIntegrityError, match="manifest"):
        GraphStore(target)


def test_invalid_or_empty_inputs_do_not_create_fake_data(tmp_path):
    source = tmp_path / "bad.csv"
    target = tmp_path / "no.sqlite3"
    source.write_text(
        "pre_root_id,post_root_id,syn_count\n"
        f"{A},{B},-1\n", encoding="utf-8"
    )
    with pytest.raises(DataValidationError, match="row 2"):
        build_subgraph(source, target)
    assert not target.exists()
    assert not target.with_suffix(".manifest.json").exists()
    source.write_text("wrong,headings\n1,2\n", encoding="utf-8")
    with pytest.raises(DataValidationError, match="Required columns"):
        build_subgraph(source, target)


def test_unconnected_seed_and_bounds_are_rejected(synthetic_files):
    source, _, target = synthetic_files
    with pytest.raises(DataValidationError, match="Seed not connected"):
        build_subgraph(source, target, seed="720575940000009999")
    with pytest.raises(DataValidationError, match="max_neurons"):
        build_subgraph(source, target, max_neurons=9999)
    with pytest.raises(DataValidationError, match="min_synapses"):
        build_subgraph(source, target, min_synapses=0)


def test_unconfigured_api_discloses_missing_dataset(monkeypatch):
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    with TestClient(create_app()) as client:
        unavailable = client.get("/api/v1/datasets/current")
        assert unavailable.status_code == 200
        assert unavailable.json()["available"] is False
        response = client.get("/api/v1/neurons/search?q=sensory")
        assert response.status_code == 503
        assert not client.get("/api/v1/capabilities").json()["dataset_configured"]


def test_configured_api_search_neighborhood_and_validation(prepared, monkeypatch):
    target, _ = prepared
    monkeypatch.setenv("NEUROVERSE_DATASET_DB", str(target))
    with TestClient(create_app()) as client:
        assert client.get("/api/v1/datasets/current").json()["available"] is True
        caps = client.get("/api/v1/capabilities").json()
        assert caps["dataset_configured"] is True
        assert caps["real_dataset_loaded"] is False
        assert client.get("/api/v1/neurons/search", params={"q": A}).json()["results"][0]["root_id"] == A
        assert client.get(f"/api/v1/neurons/{A}").json()["cell_type"] == "Synthetic sensory example"
        assert len(client.get(f"/api/v1/neurons/{A}/connections", params={"direction": "outgoing"}).json()["results"]) == 2
        response = client.get(f"/api/v1/neurons/{A}/neighborhood", params={"max_nodes": 3})
        assert response.status_code == 200
        assert len(response.json()["nodes"]) == 3
        assert client.get("/api/v1/neurons/123").status_code == 404
        assert client.get("/api/v1/neurons/not-an-id").status_code == 422
        assert client.get("/api/v1/neurons/search", params={"q": "a", "limit": 500}).status_code == 422
        assert client.get(f"/api/v1/neurons/{A}/connections", params={"direction": "sideways"}).status_code == 422


def test_corrupted_configured_dataset_fails_closed(prepared, monkeypatch):
    target, _ = prepared
    target.write_bytes(target.read_bytes() + b"tampered")
    monkeypatch.setenv("NEUROVERSE_DATASET_DB", str(target))
    with pytest.raises(DataIntegrityError):
        create_app()
