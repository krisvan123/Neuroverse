"""Synthetic records only; never used as production scientific data."""
import csv
import io
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.data.atlas import AtlasUnavailable, function_context, parse_annotations, verify_source
from app.main import create_app

RID = "720575940625431866"
OTHER = "720575940625448968"


def fixture():
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["root_id", "pos_x", "pos_y", "pos_z", "soma_x", "soma_y", "soma_z", "cell_class", "cell_type"], delimiter="\t")
    writer.writeheader()
    writer.writerow(dict(root_id=RID, pos_x=50, pos_y=60, pos_z=70, soma_x=10, soma_y=20, soma_z=30, cell_class="ALPN"))
    writer.writerow(dict(root_id=OTHER, pos_x=50, pos_y=60, pos_z=70, soma_x="NaN", cell_type="Test only"))
    return output.getvalue().encode()


def test_anisotropic_voxels_convert_to_nm_and_soma_is_not_confused_with_anchor():
    rows = parse_annotations(fixture())
    assert rows[RID]["position_nm"] == [40, 80, 1200]
    assert rows[RID]["position_kind"] == "soma"
    assert rows[OTHER]["position_nm"] == [200, 240, 2800]
    assert rows[OTHER]["position_kind"] == "anchor"
    assert rows[RID]["cell_type"] is None


def test_checksum_rejects_test_data_and_duplicate_ids_are_rejected():
    with pytest.raises(AtlasUnavailable, match="checksum"):
        verify_source(fixture())
    with pytest.raises(AtlasUnavailable, match="repeated"):
        parse_annotations(fixture().replace(OTHER.encode(), RID.encode()))


def test_missing_positions_stay_missing():
    rows = parse_annotations(b"root_id\tpos_x\tpos_y\tpos_z\n" + RID.encode() + b"\tNaN\t\t\n")
    assert rows[RID]["position_nm"] is None
    assert rows[RID]["position_kind"] is None


def test_context_never_assigns_individual_function_from_a_label():
    assert function_context("ALPN")["evidence"] == "cell_class_context"
    assert "not a measurement" in function_context("ALPN")["limitation"]
    assert function_context(None)["evidence"] == "not_established"
    assert function_context("unknown type")["evidence"] == "not_established"


def test_atlas_search_map_and_profile_work_without_local_connectivity(monkeypatch):
    monkeypatch.delenv("NEUROVERSE_DATASET_DB", raising=False)
    with patch("app.api.atlas.get_catalog", return_value=parse_annotations(fixture())):
        with TestClient(create_app()) as client:
            points = client.get("/api/v1/atlas/points").json()
            assert points["total_neurons"] == 2 and points["soma_count"] == 1
            assert points["points"] == [[RID, 40, 80, 1200, 0], [OTHER, 200, 240, 2800, 1]]
            assert client.get("/api/v1/atlas/search?q=alpn").json()["results"][0]["root_id"] == RID
            assert client.get("/api/v1/atlas/search?q=absent").json()["total"] == 0
            page = client.get("/api/v1/atlas/search?offset=1&limit=1").json()
            assert page["total"] == 2 and page["results"][0]["root_id"] == OTHER
            profile = client.get(f"/api/v1/atlas/neurons/{RID}").json()
            assert profile["snapshot"] == "783"
            assert profile["function"]["evidence"] == "cell_class_context"
            assert profile["neurotransmitter_evidence"] == "unavailable"
            assert client.get("/api/v1/atlas/neurons/123").status_code == 404
            assert client.get("/api/v1/atlas/neurons/invalid").status_code == 422
            assert client.get("/api/v1/atlas/search?limit=999").status_code == 422


def test_unavailable_source_is_not_replaced_with_fiction():
    with patch("app.api.atlas.get_catalog", side_effect=AtlasUnavailable("offline")):
        with TestClient(create_app()) as client:
            assert client.get("/api/v1/atlas/points").status_code == 503
