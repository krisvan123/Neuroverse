"""Publication-matched FlyWire annotations, with exact source coordinates.

No scientific archive is bundled. A pinned, checksum-verified upstream TSV is
cached locally; missing morphology or functional evidence is never fabricated.
"""
from __future__ import annotations

import csv
import hashlib
import io
import math
import os
import tempfile
from functools import lru_cache
from pathlib import Path
from threading import Lock
from urllib.error import URLError
from urllib.request import Request, urlopen

COMMIT = "ebd66db2596fcc39c6950fb54ea3efa00f7fe8a0"
SOURCE_PATH = "supplemental_files/Supplemental_file1_neuron_annotations.tsv"
SOURCE_URL = f"https://raw.githubusercontent.com/flyconnectome/flywire_annotations/{COMMIT}/{SOURCE_PATH}"
SOURCE_SHA256 = "30be6c73975a70c56d930e27911f36455d3886e15abf383b78edd2a5d679e0b6"
REFERENCE = "https://doi.org/10.1038/s41586-024-07686-5"
COLUMNS_REFERENCE = "https://github.com/flyconnectome/flywire_annotations/blob/a83b2776d60d5764cef36b927f5f9679c16c47a2/supplemental_files/README.md"
MAX_BYTES = 40_000_000
CACHE_FILE = Path(tempfile.gettempdir()) / f"neuroverse-atlas-{SOURCE_SHA256}.tsv"
_load_lock = Lock()


class AtlasUnavailable(RuntimeError):
    """The original annotation source cannot be verified."""


def verify_source(raw: bytes) -> bytes:
    if len(raw) > MAX_BYTES or hashlib.sha256(raw).hexdigest() != SOURCE_SHA256:
        raise AtlasUnavailable("FlyWire annotation checksum does not match the pinned release")
    return raw


def _source_bytes() -> bytes:
    if CACHE_FILE.is_file():
        try:
            if CACHE_FILE.stat().st_size <= MAX_BYTES:
                return verify_source(CACHE_FILE.read_bytes())
        except (OSError, AtlasUnavailable):
            pass  # Re-fetch from the original source; do not trust a damaged cache.
    try:
        request = Request(SOURCE_URL, headers={"User-Agent": "Neuroverse-education/0.4"})
        with urlopen(request, timeout=30) as response:
            raw = verify_source(response.read(MAX_BYTES + 1))
    except (URLError, TimeoutError, OSError) as error:
        raise AtlasUnavailable("The verified FlyWire annotation source is unavailable. Please retry.") from error
    # A read-only deployment can still serve the verified data in memory.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=CACHE_FILE.parent, delete=False) as output:
            temporary = Path(output.name)
            output.write(raw)
        os.replace(temporary, CACHE_FILE)
    except OSError:
        pass
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return raw


def coordinate(row: dict, prefix: str) -> list[float] | None:
    """The published annotation coordinates use anisotropic 4 x 4 x 40 nm voxels."""
    try:
        xyz = [float(row[f"{prefix}_{axis}"]) * scale for axis, scale in zip("xyz", (4, 4, 40))]
    except (KeyError, TypeError, ValueError):
        return None
    return xyz if all(math.isfinite(v) and abs(v) <= 10_000_000 for v in xyz) else None


def parse_annotations(raw: bytes) -> dict[str, dict]:
    rows = {}
    for row in csv.DictReader(io.StringIO(raw.decode("utf-8")), delimiter="\t"):
        rid = row.get("root_id", "")
        if not rid.isascii() or not rid.isdigit() or not 0 < int(rid) <= 2**63 - 1 or rid in rows:
            raise AtlasUnavailable("Invalid or repeated neuron ID in annotation source")
        soma = coordinate(row, "soma")
        position = soma if soma is not None else coordinate(row, "pos")
        rows[rid] = {
            **{key: row.get(key) or None for key in (
                "cell_type", "hemibrain_type", "cell_class", "cell_sub_class", "super_class",
                "side", "flow", "top_nt", "top_nt_conf", "known_nt", "known_nt_source", "status",
            )},
            "root_id": rid,
            "label": row.get("cell_type") or row.get("hemibrain_type") or row.get("cell_class") or "Unclassified neuron",
            "position_nm": position,
            "position_kind": ("soma" if soma is not None else "anchor") if position is not None else None,
        }
    return rows


@lru_cache(maxsize=1)
def _load_catalog() -> dict[str, dict]:
    rows = parse_annotations(_source_bytes())
    if len(rows) != 139255:
        raise AtlasUnavailable("Unexpected neuron count in the pinned annotation release")
    return rows


def get_catalog() -> dict[str, dict]:
    # Simultaneous map/search requests share one download and one parsed catalog.
    with _load_lock:
        return _load_catalog()


def provenance() -> dict:
    return {
        "dataset": "FlyWire FAFB", "snapshot": "783", "annotation_release": "2.1.0",
        "source_url": SOURCE_URL, "source_sha256": SOURCE_SHA256,
        "source_reference": REFERENCE, "coordinate_reference": COLUMNS_REFERENCE,
        "license": "CC BY-NC 4.0", "license_url": "https://creativecommons.org/licenses/by-nc/4.0/",
    }


def function_context(cell_class: str | None) -> dict:
    # Explanations concern a published cell class, never measured activity or a
    # uniquely established behavioral function of the selected neuron instance.
    contexts = {
        "ALPN": ("Olfactory relay", "Antennal-lobe projection neurons carry processed sensory information from the antennal lobe toward higher brain regions. This class is studied as part of olfactory processing."),
        "ALLN": ("Local olfactory processing", "Antennal-lobe local neurons participate in local circuitry where olfactory inputs are processed."),
        "Kenyon_Cell": ("Learning and memory circuits", "Kenyon cells are intrinsic neurons of the mushroom body, a brain structure studied for associative learning and memory."),
        "MBON": ("Mushroom-body output", "Mushroom-body output neurons convey output from mushroom-body circuits involved in learned behavior."),
        "DAN": ("Dopaminergic modulation", "This cell is assigned to the dopaminergic-neuron class. Dopamine can modulate circuits; this label alone does not establish a reward, punishment, or behavioral role for this particular cell."),
        "olfactory": ("Olfactory pathway", "The source assigns this neuron to the olfactory class, associated with processing information about odors."),
        "visual": ("Visual pathway", "The source assigns this neuron to the visual class, associated with processing information from the eyes."),
    }
    entry = contexts.get(cell_class or "")
    return {
        "evidence": "cell_class_context" if entry else "not_established",
        "title": entry[0] if entry else "Individual function not established here",
        "summary": entry[1] if entry else "The annotation identifies anatomy and cell classification. A specific physiological or behavioral function has not been established for this neuron in the sources included here.",
        "limitation": "Class-level context is not a measurement of this cell's activity. Shape, position and synapse counts alone do not establish its function.",
        "source_reference": REFERENCE,
    }


def neuron_profile(row: dict) -> dict:
    return {
        **row, **provenance(),
        "function": function_context(row["cell_class"]),
        "neurotransmitter_evidence": "prediction" if row["top_nt"] else "unavailable",
        "codex_url": f"https://codex.flywire.ai/app/cell_details?cell_names_or_id={row['root_id']}&data_version=783",
    }
