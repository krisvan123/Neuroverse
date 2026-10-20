"""Serve the published specimen-derived FAFB whole-brain tissue surface.

Unlike the Phase 04 concept sculpture, the PLY is a *source-derived tissue
envelope* reconstructed from a FAFB mask, not a neuron or synapse atlas.
Its manual cleanup and transformation are documented by navis-flybrains.
We pin the upstream Git commit AND Git blob SHA-1 to prevent substitutions.
"""

from __future__ import annotations

import hashlib
import urllib.error
from functools import lru_cache
from urllib.request import Request, urlopen

PINNED_SOURCE_COMMIT = "273333c8d8bf5adeebebd274e554621462e388bd"
PINNED_BLOB_SHA1 = "3cf14cdd1399f212057f40c918493452abf056da"
UPSTREAM_URL = (
    "https://raw.githubusercontent.com/navis-org/navis-flybrains/"
    + PINNED_SOURCE_COMMIT
    + "/flybrains/meshes/FLYWIRE_whole_brain.ply"
)
PROVENANCE_URL = (
    "https://github.com/navis-org/navis-flybrains/blob/"
    + PINNED_SOURCE_COMMIT
    + "/flybrains/meshes/FLYWIRE_whole_brain.md"
)
MAX_BYTES = 20_000_000


class TissueMeshUnavailable(RuntimeError):
    """Upstream source cannot currently be authenticated and delivered."""


@lru_cache(maxsize=1)
def load_official_tissue_mesh() -> tuple[bytes, str]:
    """Fetch a pinned source and verify the bytes against upstream Git's blob SHA."""
    request = Request(
        UPSTREAM_URL,
        headers={"User-Agent": "Neuroverse-scientific-education/0.3"},
    )
    try:
        with urlopen(request, timeout=18) as response:
            size = response.headers.get("Content-Length")
            if size and int(size) > MAX_BYTES:
                raise TissueMeshUnavailable("Official tissue mesh exceeds safe size limit")
            raw = response.read(MAX_BYTES + 1)
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise TissueMeshUnavailable("Official FlyWire tissue mesh source unavailable") from error
    if not raw or len(raw) > MAX_BYTES or not raw.startswith(b"ply"):
        raise TissueMeshUnavailable("Upstream content is missing or not a PLY mesh")
    git_blob = hashlib.sha1(
        f"blob {len(raw)}\0".encode("ascii") + raw,
        usedforsecurity=False,
    ).hexdigest()
    if git_blob != PINNED_BLOB_SHA1:
        raise TissueMeshUnavailable("Upstream mesh does not match the pinned Git blob")
    return raw, hashlib.sha256(raw).hexdigest()
