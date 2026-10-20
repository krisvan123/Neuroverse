"""Phase 02 endpoints: deliberately small and truthful about capabilities."""

from fastapi import APIRouter

from app.schemas import CapabilityResponse, HealthResponse

router = APIRouter(prefix="/api/v1", tags=["system"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Machine-readable availability check for frontend and CI."""
    return HealthResponse()


@router.get("/capabilities", response_model=CapabilityResponse)
def capabilities() -> CapabilityResponse:
    """Make unimplemented experimental/science features explicitly discoverable."""
    return CapabilityResponse()
