"""Build the attributed, lossless position preview from the verified source TSV.

This compact derived asset lets static deployments draw the brain immediately,
without sending the full atlas through a serverless JSON response.
"""
import hashlib
import json
import struct
from pathlib import Path

from app.data.atlas import get_catalog, provenance


def build(output: Path) -> None:
    rows = get_catalog()
    positioned = [r for r in rows.values() if r["position_nm"] is not None]
    content = bytearray(struct.pack("<4sII", b"NVAP", 1, len(positioned)))
    for row in positioned:
        # These source coordinates are integral nm within float32's exact range.
        xyz = row["position_nm"]
        packed = struct.pack("<QfffB", int(row["root_id"]), *xyz, int(row["position_kind"] == "anchor"))
        if list(struct.unpack("<QfffB", packed)[1:4]) != xyz:
            raise ValueError("Atlas asset would lose coordinate precision")
        content.extend(packed)
    digest = hashlib.sha256(content).hexdigest()
    name = f"fafb-v783-{digest[:16]}.bin"
    output.mkdir(parents=True, exist_ok=True)
    (output / name).write_bytes(content)
    manifest = {
        **provenance(), "format": "NVAP", "format_version": 1,
        "file": name, "asset_sha256": digest, "asset_bytes": len(content),
        "total_neurons": len(rows), "point_count": len(positioned),
        "soma_count": sum(r["position_kind"] == "soma" for r in positioned),
        "unpositioned_count": len(rows) - len(positioned), "units": "nanometer",
        "description": "Original soma or anchor positions; markers are not complete neuron morphology.",
        "attribution": "FlyWire Consortium; Schlegel et al., Nature (2024). CC BY-NC 4.0.",
    }
    (output / "fafb-v783-atlas.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {len(positioned)} verified neuron positions ({len(content)} bytes)")


if __name__ == "__main__":
    build(Path(__file__).resolve().parents[3] / "frontend/public/data")
