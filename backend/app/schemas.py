"""Explicit system responses; do not misrepresent unverified neuroscience data."""

from typing import Literal

from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["ok"] = "ok"
    service: Literal["neuroverse-api"] = "neuroverse-api"
    phase: int = 3
    version: str = "0.2.0"


class CapabilityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage: Literal["scientific-data-pipeline"] = "scientific-data-pipeline"
    dataset_configured: bool = False
    real_dataset_loaded: bool = False  # No independent source identity verification.
    three_d_explorer_available: bool = False
    experiments_available: bool = False
    description: str = "No neuron dataset configured."
