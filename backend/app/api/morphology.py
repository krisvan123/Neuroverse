"""A geometry endpoint backed only by the published FAFB v783 skeleton service."""

from fastapi import APIRouter, HTTPException, Path

from app.data.morphology import (
    SkeletonError, SkeletonNotFound, SkeletonUnavailable, get_skeleton,
)

router = APIRouter(prefix="/api/v1", tags=["morphology"])


@router.get("/neurons/{neuron_id}/skeleton")
def neuron_skeleton(neuron_id: str = Path(min_length=1, max_length=19)) -> dict:
    """Return original v783 centerlines in nanometers, never invented morphology."""
    try:
        return get_skeleton(neuron_id)
    except SkeletonError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except SkeletonNotFound as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SkeletonUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
