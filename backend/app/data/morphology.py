"""Fetch and validate an authentic FAFB v783 *precomputed neuron skeleton*.

The authoritative public source is the MRC Laboratory of Molecular Biology
Cambridge FlyConnectome 783 archive, as referenced by fafbseg-py:
https://fafbseg-py.readthedocs.io/en/latest/_modules/fafbseg/flywire/skeletonize.html

The binary schema is Neuroglancer's unsharded skeleton format:
https://github.com/google/neuroglancer/blob/master/src/datasource/precomputed/skeletons.md

These are observed/reconstructed neuron *centerlines*, NOT whole-neuron
volume meshes, measured electrical activity, or an anatomical atlas.
"""

from __future__ import annotations

import hashlib
import math
import struct
from functools import lru_cache
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.data.pipeline import DataValidationError, root_id

SKELETON_BASE = "https://flyem.mrc-lmb.cam.ac.uk/flyconnectome/flywire_skeletons_783"
MAX_BINARY_BYTES = 8_000_000
MAX_VERTICES = 200_000
MAX_EDGES = 400_000
SKELETON_REFERENCE = (
    "https://fafbseg-py.readthedocs.io/en/latest/"
    "_modules/fafbseg/flywire/skeletonize.html"
)
FORMAT_REFERENCE = (
    "https://github.com/google/neuroglancer/blob/master/"
    "src/datasource/precomputed/skeletons.md"
)


class SkeletonError(ValueError):
    """Invalid binary geometry; reject rather than inventing coordinates."""


class SkeletonUnavailable(RuntimeError):
    """The trusted external archive is temporarily unavailable."""


class SkeletonNotFound(LookupError):
    """The official v783 endpoint has no skeleton for this ID."""


def decode_skeleton(content: bytes, neuron_id: str) -> dict:
    """Decode exact vertices and edges, retaining original nanometer coordinates.

    Published v783 skeletons define one per-vertex float32 radius attribute.
    Do not attempt to infer unknown coordinate transforms.
    """
    rid = root_id(neuron_id)
    if len(content) > MAX_BINARY_BYTES or len(content) < 8:
        raise SkeletonError("Skeleton data exceeds limits or has a truncated header")
    vertices, edges = struct.unpack_from("<II", content, 0)
    if not (1 <= vertices <= MAX_VERTICES and 0 <= edges <= MAX_EDGES):
        raise SkeletonError("Skeleton vertex/edge counts outside allowed limits")
    header_and_geometry = 8 + 12 * vertices + 8 * edges
    expected = header_and_geometry + 4 * vertices
    if len(content) != expected:
        raise SkeletonError(
            "Invalid precomputed skeleton size for the v783 radius-attribute format"
        )
    coords: list[list[float]] = []
    for (x, y, z) in struct.iter_unpack("<fff", content[8:8 + 12 * vertices]):
        if not all(math.isfinite(value) and abs(value) <= 10_000_000 for value in (x, y, z)):
            raise SkeletonError("Non-finite/out-of-range skeleton coordinate")
        coords.append([x, y, z])
    connections: list[list[int]] = []
    edge_offset = 8 + 12 * vertices
    for (source, target) in struct.iter_unpack("<II", content[edge_offset:header_and_geometry]):
        if source >= vertices or target >= vertices or source == target:
            raise SkeletonError("Invalid skeleton edge endpoint")
        connections.append([source, target])
    radii: list[float] = []
    for (radius,) in struct.iter_unpack("<f", content[header_and_geometry:]):
        if not math.isfinite(radius) or radius < 0 or radius > 100_000:
            raise SkeletonError("Invalid skeleton vertex radius")
        radii.append(radius)
    return {
        "root_id": rid,
        "dataset": "FlyWire FAFB",
        "snapshot": "783",
        "geometry_type": "precomputed_neuron_skeleton_centerlines",
        "units": "nanometer",
        "coordinate_space": "FlyWire FAFB v783 precomputed skeleton coordinate frame",
        "source_url": f"{SKELETON_BASE}/{rid}",
        "source_reference": SKELETON_REFERENCE,
        "format_reference": FORMAT_REFERENCE,
        "source_sha256": hashlib.sha256(content).hexdigest(),
        "vertex_count": vertices,
        "edge_count": edges,
        "vertices": coords,
        "edges": connections,
        "radii": radii,
        "verified_by": "retrieved_from_fixed_public_scientific_endpoint_and_binary_validated",
        "limitations": [
            "This is a neuron centerline, not an exact volume surface or neuron activity.",
            "Do not overlay on a separate tissue mesh before frame alignment is verified.",
            "The renderer scales and centers geometry for inspection without altering topology.",
        ],
    }


@lru_cache(maxsize=12)
def get_skeleton(neuron_id: str) -> dict:
    """Read a single fixed-host, fixed-version URL, with strict size/time bounds."""
    try:
        rid = root_id(neuron_id)
    except DataValidationError as error:
        raise SkeletonError(str(error)) from error
    url = f"{SKELETON_BASE}/{rid}"
    request = Request(
        url,
        headers={"User-Agent": "Neuroverse-educational-noncommercial/0.3"},
        method="GET",
    )
    try:
        with urlopen(request, timeout=12) as response:
            length = response.headers.get("Content-Length")
            if length and int(length) > MAX_BINARY_BYTES:
                raise SkeletonError("Skeleton is larger than supported download budget")
            content = response.read(MAX_BINARY_BYTES + 1)
    except HTTPError as error:
        if error.code == 404:
            raise SkeletonNotFound(
                "No published FAFB v783 skeleton was found for this ID"
            ) from error
        raise SkeletonUnavailable("Scientific skeleton service returned an error") from error
    except (URLError, TimeoutError, OSError) as error:
        raise SkeletonUnavailable("Scientific skeleton service is unreachable") from error
    return decode_skeleton(content, rid)
