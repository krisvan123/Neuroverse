"""Validate and reduce a local, user-supplied FlyWire FAFB v783 connection export.

This pipeline does NOT download data, authenticate with FlyWire, verify that a file
came from FlyWire, or assert that structural edges represent actual activity.
It records source checksums and an honest, reproducible selection recipe.

Supports .csv and .csv.gz with Codex-style (pre_root_id, post_root_id, syn_count)
or Zenodo-style (pre_pt_root_id, post_pt_root_id, syn_count) column names.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import os
import sqlite3
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import TextIO

from app.data.official_root_ids import read_numpy_root_ids, verify_fafb783_root_ids

SCHEMA_VERSION = 1
PUBLIC_SOURCE_URL = "https://codex.flywire.ai/api/download?dataset=fafb"
LICENSE = "CC BY-NC 4.0"
MAX_ROOT = 2**63 - 1
EXPORT_FORMAT = "neuroverse-subgraph-v1"


class DataValidationError(ValueError):
    """Invalid source data or unsafe import parameters."""


def root_id(value: object) -> str:
    """Canonical unsigned FlyWire root ID, stored as text for JavaScript precision."""
    text = str(value).strip()
    if not text.isascii() or not text.isdigit() or len(text) > 19:
        raise DataValidationError("Neuron root IDs must contain 1–19 ASCII digits")
    parsed = int(text)
    if not 0 < parsed <= MAX_ROOT:
        raise DataValidationError("Neuron root ID is out of supported range")
    return str(parsed)


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def open_csv(path: Path) -> TextIO:
    if path.name.lower().endswith(".csv.gz"):
        return gzip.open(path, "rt", encoding="utf-8-sig", newline="")
    if path.suffix.lower() == ".csv":
        return path.open("r", encoding="utf-8-sig", newline="")
    raise DataValidationError("Expected a CSV or gzip-compressed CSV (.csv.gz)")


def resolve_columns(names: list[str] | None) -> tuple[str, str, str]:
    present = set(names or [])
    if {"pre_root_id", "post_root_id", "syn_count"} <= present:
        return "pre_root_id", "post_root_id", "syn_count"
    if {"pre_pt_root_id", "post_pt_root_id", "syn_count"} <= present:
        return "pre_pt_root_id", "post_pt_root_id", "syn_count"
    raise DataValidationError(
        "Required columns: pre_root_id/post_root_id/syn_count or "
        "pre_pt_root_id/post_pt_root_id/syn_count"
    )


def initialize_schema(db: sqlite3.Connection) -> None:
    db.executescript(
        """
        PRAGMA foreign_keys = ON;
        CREATE TABLE neurons (
            root_id TEXT PRIMARY KEY,
            cell_type TEXT
        );
        CREATE TABLE connections (
            pre_root_id TEXT NOT NULL REFERENCES neurons(root_id),
            post_root_id TEXT NOT NULL REFERENCES neurons(root_id),
            syn_count INTEGER NOT NULL CHECK (syn_count >= 5),
            PRIMARY KEY (pre_root_id, post_root_id)
        );
        CREATE INDEX idx_connections_post ON connections(post_root_id);
        """
    )


def load_neuron_types(path: Path | None, selected: set[str]) -> dict[str, str]:
    """Read optional annotations, retaining only selected valid root IDs."""
    if path is None:
        return {}
    types: dict[str, str] = {}
    with open_csv(path) as source:
        reader = csv.DictReader(source)
        fields = set(reader.fieldnames or [])
        if "root_id" not in fields:
            raise DataValidationError("Neuron annotations require root_id column")
        # FlyWire exports may use cell_type, primary_type, or a consolidated type.
        type_field = next(
            (column for column in ("cell_type", "primary_type") if column in fields),
            None,
        )
        if type_field is None:
            raise DataValidationError("Neuron annotations require cell_type or primary_type")
        for line_number, record in enumerate(reader, start=2):
            raw_id = record.get("root_id", "")
            if not raw_id:
                raise DataValidationError(f"Neuron annotations row {line_number}: blank ID")
            rid = root_id(raw_id)
            if rid not in selected:
                continue
            value = str(record.get(type_field) or "").strip()
            if rid in types and types[rid] != value:
                raise DataValidationError(f"Conflicting annotations for neuron {rid}")
            if value:
                types[rid] = value[:160]
    return types


def build_subgraph(
    connections_file: Path,
    output_database: Path,
    *,
    seed: str | None = None,
    min_synapses: int = 5,
    max_neurons: int = 120,
    max_edges: int = 750,
    neuron_annotations: Path | None = None,
    proofread_ids: Path | None = None,
) -> dict:
    """Aggregate all directed pairs, then select a deterministic 1-hop ego subgraph.

    This is a seed-biased educational subset, never a representative sample of
    the full brain. The original archive is NOT copied into the Git repository.
    """
    if not connections_file.is_file():
        raise DataValidationError("Connections CSV does not exist")
    if neuron_annotations is not None and not neuron_annotations.is_file():
        raise DataValidationError("Neuron annotation CSV does not exist")
    official_ids = None
    official_archive = None
    if proofread_ids is not None:
        official_archive = verify_fafb783_root_ids(proofread_ids)
        official_ids = read_numpy_root_ids(proofread_ids)
    if not 5 <= min_synapses <= 10_000:
        raise DataValidationError("min_synapses must be between 5 and 10000")
    if not 2 <= max_neurons <= 300 or not 1 <= max_edges <= 1000:
        raise DataValidationError("max_neurons must be 2..300 and max_edges 1..1000")
    if output_database.suffix != ".sqlite3":
        raise DataValidationError("Output filename must end in .sqlite3")
    seed = root_id(seed) if seed is not None else None
    output_database.parent.mkdir(parents=True, exist_ok=True)
    working = tempfile.NamedTemporaryFile(
        prefix=".neuroverse-import-", suffix=".sqlite3",
        dir=output_database.parent, delete=False,
    )
    working.close()
    working_path = Path(working.name)
    target_temp = output_database.with_name(output_database.name + ".tmp")
    manifest_target = output_database.with_suffix(".manifest.json")
    manifest_temp = manifest_target.with_name(manifest_target.name + ".tmp")
    incoming_rows = 0
    source_hash = file_hash(connections_file)
    try:
        with sqlite3.connect(working_path) as db:
            db.execute(
                "CREATE TABLE aggregated(pre TEXT NOT NULL, post TEXT NOT NULL, "
                "count INTEGER NOT NULL, PRIMARY KEY(pre, post)) WITHOUT ROWID"
            )
            with open_csv(connections_file) as source:
                reader = csv.DictReader(source)
                pre_col, post_col, count_col = resolve_columns(reader.fieldnames)
                for line_number, record in enumerate(reader, start=2):
                    try:
                        pre = root_id(record.get(pre_col) or "")
                        post = root_id(record.get(post_col) or "")
                        raw_count = str(record.get(count_col) or "").strip()
                        if not raw_count.isascii() or not raw_count.isdigit():
                            raise DataValidationError("syn_count must be an integer")
                        weight = int(raw_count)
                        if not 0 < weight <= 2_147_483_647:
                            raise DataValidationError("syn_count must be positive and <= 2^31-1")
                        db.execute(
                            "INSERT INTO aggregated(pre,post,count) VALUES (?,?,?) "
                            "ON CONFLICT(pre,post) DO UPDATE SET count=count+excluded.count",
                            (pre, post, weight),
                        )
                    except (DataValidationError, sqlite3.Error) as error:
                        raise DataValidationError(
                            f"Invalid connections row {line_number}: {error}"
                        ) from error
                    incoming_rows += 1
                    if incoming_rows % 25_000 == 0:
                        db.commit()
            db.commit()
            if incoming_rows == 0:
                raise DataValidationError("Source connections table is empty")
            db.execute("CREATE INDEX idx_aggregated_post ON aggregated(post)")
            db.execute("DELETE FROM aggregated WHERE count < ?", (min_synapses,))
            db.commit()
            if seed is None:
                hub = db.execute(
                    "SELECT pre, SUM(count) AS total FROM aggregated "
                    "GROUP BY pre ORDER BY total DESC, CAST(pre AS INTEGER) ASC LIMIT 1"
                ).fetchone()
                if hub is None:
                    raise DataValidationError("No connections survive the threshold")
                seed = hub[0]
            incident = db.execute(
                "SELECT neighbor, SUM(weight) AS score FROM "
                "(SELECT post AS neighbor,count AS weight FROM aggregated WHERE pre=? "
                "UNION ALL SELECT pre AS neighbor,count AS weight FROM aggregated WHERE post=?) "
                "WHERE neighbor != ? GROUP BY neighbor "
                "ORDER BY score DESC, CAST(neighbor AS INTEGER) ASC LIMIT ?",
                (seed, seed, seed, max_neurons - 1),
            ).fetchall()
            if not incident:
                raise DataValidationError(
                    "Seed not connected to another neuron at this threshold"
                )
            selected = {seed, *(row[0] for row in incident)}
            if official_ids is not None and not selected <= official_ids:
                raise DataValidationError(
                    "Selected neuron IDs do not all belong to the officially "
                    "verified FAFB v783 proofread root ID archive"
                )
            types = load_neuron_types(neuron_annotations, selected)
            placeholders = ",".join("?" for _ in selected)
            nodes = sorted(selected, key=int)
            subset_edges = db.execute(
                f"SELECT pre,post,count FROM aggregated "
                f"WHERE pre IN ({placeholders}) AND post IN ({placeholders}) "
                f"ORDER BY count DESC, CAST(pre AS INTEGER), CAST(post AS INTEGER) LIMIT ?",
                [*nodes, *nodes, max_edges],
            ).fetchall()
            if not subset_edges:
                raise DataValidationError("The selected subgraph contains no edges")
        if target_temp.exists():
            target_temp.unlink()
        with sqlite3.connect(target_temp) as output:
            initialize_schema(output)
            output.executemany(
                "INSERT INTO neurons(root_id,cell_type) VALUES (?,?)",
                [(neuron, types.get(neuron)) for neuron in nodes],
            )
            output.executemany(
                "INSERT INTO connections(pre_root_id,post_root_id,syn_count) "
                "VALUES (?,?,?)",
                subset_edges,
            )
            output.commit()
            assert output.execute("PRAGMA foreign_key_check").fetchall() == []
            assert output.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        manifest = {
            "format": EXPORT_FORMAT,
            "schema_version": SCHEMA_VERSION,
            "dataset": "FlyWire FAFB",
            "snapshot": "783",
            "source_archive": connections_file.name,
            "source_sha256": source_hash,
            "source_bytes": connections_file.stat().st_size,
            "annotation_archive": neuron_annotations.name if neuron_annotations else None,
            "annotation_sha256": file_hash(neuron_annotations) if neuron_annotations else None,
            "source_reference": PUBLIC_SOURCE_URL,
            "license": LICENSE,
            "source_identity_verified": False,
            "verified_neuron_id_membership": official_archive is not None,
            "proofread_id_archive": official_archive,
            "data_kind": "user-provided-connectome-export",
            "imported_utc": datetime.now(timezone.utc).isoformat(),
            "source_rows_read": incoming_rows,
            "seed_root_id": seed,
            "min_synapses_per_pair": min_synapses,
            "max_neurons": max_neurons,
            "max_edges": max_edges,
            "selection": "one_hop_ego_ranked_by_in_plus_out_synapse_counts",
            "nodes_selected": len(nodes),
            "edges_selected": len(subset_edges),
            "synapses_in_selected_edges": sum(edge[2] for edge in subset_edges),
            "database_sha256": file_hash(target_temp),
            "limitations": [
                "User-provided source identity was not independently verified.",
                "Seed-biased selected subgraph is NOT a representative brain sample.",
                "Edges are structural connections, not recorded physiological signals.",
                "Missing neighbors may lie outside the selected node set.",
                "Synapse count is not a measured firing rate or conduction speed.",
            ],
        }
        manifest_temp.write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        os.replace(target_temp, output_database)
        os.replace(manifest_temp, manifest_target)
        return manifest
    finally:
        working_path.unlink(missing_ok=True)
        target_temp.unlink(missing_ok=True)
        manifest_temp.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate a local FlyWire v783 CSV, create a bounded SQLite subgraph"
    )
    parser.add_argument("--connections", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--neurons", type=Path)
    parser.add_argument(
        "--proofread-ids", type=Path,
        help="Optional official Zenodo proofread_root_ids_783.npy (MD5 verified)",
    )
    parser.add_argument("--seed", help="Root ID for a 1-hop neighborhood (default: top outgoing hub)")
    parser.add_argument("--min-synapses", type=int, default=5)
    parser.add_argument("--max-neurons", type=int, default=120)
    parser.add_argument("--max-edges", type=int, default=750)
    args = parser.parse_args()
    try:
        manifest = build_subgraph(
            args.connections, args.out, seed=args.seed,
            neuron_annotations=args.neurons, proofread_ids=args.proofread_ids,
            min_synapses=args.min_synapses,
            max_neurons=args.max_neurons, max_edges=args.max_edges,
        )
    except (DataValidationError, OSError, sqlite3.Error, ValueError) as error:
        parser.error(str(error))
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
