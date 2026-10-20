"""Read-only authentic whole-brain tissue surface with source attribution."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.data.tissue import (
    PINNED_SOURCE_COMMIT, PROVENANCE_URL, TissueMeshUnavailable,
    UPSTREAM_URL, load_official_tissue_mesh,
)

router = APIRouter(prefix="/api/v1", tags=["anatomy"])


@router.get("/brain/tissue-mesh")
def tissue_mesh() -> Response:
    """Return unchanged, SHA-verified source PLY (not a generated anatomy)."""
    try:
        payload, sha = load_official_tissue_mesh()
    except TissueMeshUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return Response(
        content=payload,
        media_type="application/octet-stream",
        headers={
            "X-Neuroverse-Dataset": "FAFB-tissue-mask-derived-surface",
            "X-Neuroverse-Source-SHA256": sha,
            "X-Neuroverse-Source-Commit": PINNED_SOURCE_COMMIT,
            "X-Neuroverse-Provenance": PROVENANCE_URL,
            "Cache-Control": "public, max-age=86400",
        },
    )


@router.get("/brain/tissue-source")
def tissue_source() -> dict:
    return {
        "geometry_type": "whole_brain_tissue_surface_derived_from_fafb_mask",
        "source_reference": PROVENANCE_URL,
        "source_mesh_url": UPSTREAM_URL,
        "source_commit": PINNED_SOURCE_COMMIT,
        "license_context": (
            "Source comes from GPL-3.0 navis-flybrains; derived biological "
            "data retain FlyWire public data attribution and applicable terms."
        ),
        "limitations": [
            "This is a FAFB tissue mask-derived whole-brain envelope with manual cleanup.",
            "It does not show individual reconstructed neuron surfaces or synapses.",
            "Spatial alignment with a separate skeleton must be independently checked.",
        ],
    }
