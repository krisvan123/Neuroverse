"""Health checks and capability disclosure for the current engineering phase."""

from fastapi import APIRouter, Request

from app.schemas import CapabilityResponse, HealthResponse

router = APIRouter(prefix="/api/v1", tags=["system"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@router.get("/capabilities", response_model=CapabilityResponse)
def capabilities(request: Request) -> CapabilityResponse:
    has_data = request.app.state.connectome_store is not None
    return CapabilityResponse(
        dataset_configured=has_data,
        description=(
            "An integrity-checked user-provided FAFB subgraph is configured. "
            "The original source identity was not independently verified."
            if has_data
            else "No neuron dataset configured; use the local CSV import pipeline."
        ),
    )
