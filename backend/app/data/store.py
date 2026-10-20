"""Read-only, integrity-checked access to a bounded educational connectome."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator
from urllib.parse import quote

from app.data.pipeline import EXPORT_FORMAT, LICENSE, file_hash, root_id


class DataIntegrityError(RuntimeError):
    """Loaded data does not match the recorded source/format manifest."""


class GraphStore:
    def __init__(self, path: Path):
        self.path = path.resolve()
        manifest_path = self.path.with_suffix(".manifest.json")
        if not self.path.is_file() or not manifest_path.is_file():
            raise DataIntegrityError("Dataset and its matching manifest must both exist")
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise DataIntegrityError("Dataset manifest is unreadable") from error
        if not isinstance(manifest, dict):
            raise DataIntegrityError("Dataset manifest must be an object")
        if (
            manifest.get("format") != EXPORT_FORMAT
            or manifest.get("schema_version") != 1
            or manifest.get("snapshot") != "783"
            or manifest.get("license") != LICENSE
            or manifest.get("dataset") != "FlyWire FAFB"
            or manifest.get("source_identity_verified") is not False
        ):
            raise DataIntegrityError("Unsupported or misleading dataset manifest")
        if manifest.get("database_sha256") != file_hash(self.path):
            raise DataIntegrityError("Dataset SHA-256 does not match the manifest")
        with self.connect() as connection:
            try:
                good = connection.execute("PRAGMA integrity_check").fetchone()
                counts = connection.execute(
                    "SELECT (SELECT COUNT(*) FROM neurons),"
                    " (SELECT COUNT(*) FROM connections)"
                ).fetchone()
                missing = connection.execute("PRAGMA foreign_key_check").fetchall()
            except sqlite3.Error as error:
                raise DataIntegrityError("Dataset schema is not valid") from error
        if good is None or good[0] != "ok" or missing:
            raise DataIntegrityError("Database integrity checks did not pass")
        if list(counts) != [manifest.get("nodes_selected"), manifest.get("edges_selected")]:
            raise DataIntegrityError("Dataset row counts do not match the manifest")
        self.manifest = manifest

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        """Close SQLite handles promptly, including on Windows."""
        uri = f"file:{quote(self.path.as_posix(), safe='/')}?mode=ro"
        connection = sqlite3.connect(uri, uri=True)
        try:
            connection.row_factory = sqlite3.Row
            connection.execute("PRAGMA foreign_keys = ON")
            connection.execute("PRAGMA query_only = ON")
            yield connection
        finally:
            connection.close()

    def info(self) -> dict:
        return {
            "available": True,
            "dataset": "FlyWire FAFB",
            "snapshot": "783",
            "data_kind": self.manifest["data_kind"],
            "source_identity_verified": False,
            "source_reference": self.manifest["source_reference"],
            "source_sha256": self.manifest["source_sha256"],
            "database_sha256": self.manifest["database_sha256"],
            "license": LICENSE,
            "nodes_selected": self.manifest["nodes_selected"],
            "edges_selected": self.manifest["edges_selected"],
            "seed_root_id": self.manifest["seed_root_id"],
            "min_synapses_per_pair": self.manifest["min_synapses_per_pair"],
            "selection": self.manifest["selection"],
            "limitations": self.manifest["limitations"],
        }

    def search(self, text: str, limit: int = 20) -> list[dict]:
        text = text.strip()
        if not text or any(ord(char) < 32 for char in text):
            return []
        escaped = (
            text.replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_")
        )
        with self.connect() as connection:
            if text.isascii() and text.isdigit():
                rows = connection.execute(
                    "SELECT root_id,cell_type FROM neurons WHERE root_id LIKE ? "
                    "ORDER BY CAST(root_id AS INTEGER) LIMIT ?",
                    (text + "%", limit),
                ).fetchall()
            else:
                rows = connection.execute(
                    "SELECT root_id,cell_type FROM neurons "
                    "WHERE cell_type LIKE ? ESCAPE '\\' "
                    "ORDER BY CAST(root_id AS INTEGER) LIMIT ?",
                    (f"%{escaped}%", limit),
                ).fetchall()
        return [dict(row) for row in rows]

    def neuron(self, rid: str) -> dict | None:
        rid = root_id(rid)
        with self.connect() as connection:
            row = connection.execute(
                "SELECT root_id,cell_type FROM neurons WHERE root_id=?", (rid,)
            ).fetchone()
            if row is None:
                return None
            outgoing = connection.execute(
                "SELECT COUNT(*),COALESCE(SUM(syn_count),0) FROM connections "
                "WHERE pre_root_id=?", (rid,)
            ).fetchone()
            incoming = connection.execute(
                "SELECT COUNT(*),COALESCE(SUM(syn_count),0) FROM connections "
                "WHERE post_root_id=?", (rid,)
            ).fetchone()
        return {
            **dict(row),
            "incoming_partner_count": incoming[0],
            "outgoing_partner_count": outgoing[0],
            "incoming_selected_synapses": incoming[1],
            "outgoing_selected_synapses": outgoing[1],
            "scope": "selected_subgraph_only",
        }

    def connections(self, rid: str, direction: str = "both", limit: int = 100) -> list[dict]:
        rid = root_id(rid)
        if direction not in {"both", "incoming", "outgoing"}:
            raise ValueError("Invalid direction")
        with self.connect() as connection:
            clauses = {
                "both": "(pre_root_id=? OR post_root_id=?)",
                "incoming": "post_root_id=?",
                "outgoing": "pre_root_id=?",
            }
            values = [rid, rid] if direction == "both" else [rid]
            rows = connection.execute(
                "SELECT pre_root_id,post_root_id,syn_count FROM connections WHERE "
                + clauses[direction]
                + " ORDER BY syn_count DESC,CAST(pre_root_id AS INTEGER),"
                  "CAST(post_root_id AS INTEGER) LIMIT ?",
                [*values, limit],
            ).fetchall()
        return [dict(row) for row in rows]

    def neighborhood(self, rid: str, max_nodes: int = 80, max_edges: int = 300) -> dict | None:
        rid = root_id(rid)
        if self.neuron(rid) is None:
            return None
        with self.connect() as connection:
            neighbor_rows = connection.execute(
                "SELECT neighbor,SUM(count) AS weight FROM ("
                " SELECT post_root_id AS neighbor,syn_count AS count FROM connections"
                " WHERE pre_root_id=? "
                " UNION ALL"
                " SELECT pre_root_id AS neighbor,syn_count AS count FROM connections"
                " WHERE post_root_id=?"
                ") WHERE neighbor!=? GROUP BY neighbor "
                "ORDER BY weight DESC,CAST(neighbor AS INTEGER) LIMIT ?",
                (rid, rid, rid, max_nodes - 1),
            ).fetchall()
            nodes = sorted({rid, *(row["neighbor"] for row in neighbor_rows)}, key=int)
            holders = ",".join("?" for _ in nodes)
            records = connection.execute(
                "SELECT pre_root_id,post_root_id,syn_count FROM connections "
                f"WHERE pre_root_id IN ({holders}) AND post_root_id IN ({holders}) "
                "ORDER BY syn_count DESC,CAST(pre_root_id AS INTEGER),"
                "CAST(post_root_id AS INTEGER) LIMIT ?",
                [*nodes, *nodes, max_edges],
            ).fetchall()
            selected = connection.execute(
                f"SELECT root_id,cell_type FROM neurons WHERE root_id IN ({holders}) "
                "ORDER BY CAST(root_id AS INTEGER)",
                nodes,
            ).fetchall()
        return {
            "seed_root_id": rid,
            "nodes": [dict(row) for row in selected],
            "edges": [dict(row) for row in records],
            "scope": "selected_subgraph_only",
            "direction": "presynaptic_to_postsynaptic",
            "structural_not_functional": True,
        }
