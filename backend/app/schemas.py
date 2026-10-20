"""Stable, versioned JSON schemas for the initial API contract."""

from typing import Literal

from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["ok"] = "ok"
    service: Literal["neuroverse-api"] = "neuroverse-api"
    phase: int = 2
    version: str = "0.1.0"


class CapabilityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage: Literal["engineering-foundation"] = "engineering-foundation"
    real_dataset_loaded: bool = False
    three_d_explorer_available: bool = False
    experiments_available: bool = False
    description: str = (
        "Foundation only. Real FlyWire data, 3D exploration, and experiments "
        "will be implemented and validated in subsequent phases."
    )
