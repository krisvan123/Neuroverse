"""A derived preview must preserve source coordinates and 64-bit identities."""
import hashlib
import json
import struct
from unittest.mock import patch

import pytest

from app.data.build_atlas_asset import build


def test_preview_keeps_source_values_and_omits_only_missing_positions(tmp_path):
    rows = {
        "720575940625431866": {"root_id": "720575940625431866", "position_nm": [40, 80, 1200], "position_kind": "soma"},
        "720575940625448968": {"root_id": "720575940625448968", "position_nm": [200, 240, 2800], "position_kind": "anchor"},
        "100": {"root_id": "100", "position_nm": None, "position_kind": None},
    }
    with patch("app.data.build_atlas_asset.get_catalog", return_value=rows):
        build(tmp_path)
    manifest = json.loads((tmp_path / "fafb-v783-atlas.json").read_text())
    binary = (tmp_path / manifest["file"]).read_bytes()
    assert hashlib.sha256(binary).hexdigest() == manifest["asset_sha256"]
    assert manifest["total_neurons"] == 3
    assert manifest["point_count"] == 2
    assert manifest["soma_count"] == 1
    assert manifest["unpositioned_count"] == 1
    assert struct.unpack("<4sII", binary[:12]) == (b"NVAP", 1, 2)
    assert list(struct.iter_unpack("<QfffB", binary[12:])) == [
        (720575940625431866, 40, 80, 1200, 0), (720575940625448968, 200, 240, 2800, 1),
    ]


def test_preview_builder_refuses_lossy_coordinate_conversion(tmp_path):
    rows = {"100": {"root_id": "100", "position_nm": [0.1, 20, 40], "position_kind": "soma"}}
    with patch("app.data.build_atlas_asset.get_catalog", return_value=rows):
        with pytest.raises(ValueError, match="lose coordinate precision"):
            build(tmp_path)
    assert not list(tmp_path.iterdir())
