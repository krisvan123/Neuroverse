"""Extract a small, provenance-checked CSV sample from official FAFB v783 Feather.

Download proofread_connections_783.feather from Zenodo record 10676866.
This command verifies its exact published MD5 before sampling. A sample of
rows is a file-order prefix, NOT a random or representative brain sample.

Optional dependency: pip install pyarrow>=16,<24
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path

from app.data.official_root_ids import verify_fafb783_root_ids

ZENODO_MD5 = "f48f972d262323a102aed49af1396b8a"
ARCHIVE_NAME = "proofread_connections_783.feather"
SOURCE_URL = "https://doi.org/10.5281/zenodo.10676866"
COLUMNS = ("pre_pt_root_id", "post_pt_root_id", "syn_count")


class FeatherSourceError(ValueError):
    """The input is not the expected published v783 connectivity archive."""


def verify_official_feather(path: Path) -> dict:
    if path.name != ARCHIVE_NAME:
        raise FeatherSourceError(f"Expected {ARCHIVE_NAME}")
    md5 = hashlib.md5(usedforsecurity=False)
    sha256 = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            md5.update(chunk)
            sha256.update(chunk)
    if md5.hexdigest() != ZENODO_MD5:
        raise FeatherSourceError("Connectivity archive MD5 mismatches official Zenodo checksum")
    return {
        "official_connections_checksum_verified": True,
        "archive": path.name,
        "publisher_md5": md5.hexdigest(),
        "archive_sha256": sha256.hexdigest(),
        "archive_bytes": path.stat().st_size,
        "source": SOURCE_URL,
    }


def extract_sample(path: Path, output_csv: Path, limit: int = 20000) -> dict:
    """Read genuine Feather V2 batches with bounded Python-memory CSV output."""
    if not 1000 <= limit <= 100000:
        raise FeatherSourceError("Limit must be 1000..100000")
    audit = verify_official_feather(path)
    try:
        import pyarrow as pa
        import pyarrow.ipc as ipc
    except ImportError as error:
        raise FeatherSourceError(
            "Install optional pyarrow (pip install 'pyarrow>=16,<24')"
        ) from error
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    written = 0
    with pa.memory_map(str(path), "r") as source:
        try:
            reader = ipc.open_file(source)
        except (ValueError, OSError, pa.ArrowInvalid) as error:
            raise FeatherSourceError("Invalid Feather V2 IPC archive") from error
        if not set(COLUMNS) <= set(reader.schema.names):
            raise FeatherSourceError("Official archive lacks required connectivity columns")
        with output_csv.open("w", newline="", encoding="utf-8") as destination:
            writer = csv.writer(destination)
            writer.writerow(COLUMNS)
            for index in range(reader.num_record_batches):
                if written >= limit:
                    break
                batch = reader.get_batch(index).select(COLUMNS)
                rows_needed = min(limit - written, batch.num_rows)
                batch = batch.slice(0, rows_needed)
                # Convert a single Arrow record batch, not the whole 852 MB table.
                columns = [column.to_pylist() for column in batch.columns]
                for pre, post, syn_count in zip(*columns):
                    if pre is None or post is None or syn_count is None:
                        raise FeatherSourceError("Unexpected null in connectivity fields")
                    writer.writerow((pre, post, syn_count))
                written += rows_needed
    if written == 0:
        raise FeatherSourceError("No connectivity records extracted")
    audit.update({
        "source_rows_extracted": written,
        "sampling": "file_order_prefix__not_representative",
        "csv_file": output_csv.name,
        "csv_sha256": hashlib.sha256(output_csv.read_bytes()).hexdigest(),
        "caution": (
            "Counts and graph summaries derived from this CSV describe only the "
            "extracted subset and cannot be extrapolated to the whole brain."
        ),
    })
    return audit


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate Zenodo FAFB v783 Feather MD5 and extract a bounded real-data CSV"
    )
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--rows", type=int, default=20000)
    parser.add_argument("--proofread-ids", type=Path)
    args = parser.parse_args()
    try:
        if args.proofread_ids:
            verify_fafb783_root_ids(args.proofread_ids)
        audit = extract_sample(args.source, args.out, args.rows)
    except (FeatherSourceError, OSError, ValueError) as error:
        parser.error(str(error))
    print(json.dumps(audit, indent=2))


if __name__ == "__main__":
    main()
