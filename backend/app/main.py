"""FastAPI app factory with optional integrity-checked local connectome."""

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.connectome import router as connectome_router
from app.api.morphology import router as morphology_router
from app.api.tissue import router as tissue_router
from app.api.v1 import router as api_router
from app.config import get_allowed_origins
from app.data.store import GraphStore


def create_app() -> FastAPI:
    """Reject untrusted/inconsistent configured data at startup."""
    application = FastAPI(
        title="Neuroverse API",
        version="0.3.0",
        description=(
            "An educational connectome API serving bounded subgraphs from local "
            "FAFB v783 exports. An imported file's source identity is NOT "
            "independently authenticated. No biological activity is simulated."
        ),
    )
    data_path = os.getenv("NEUROVERSE_DATASET_DB", "").strip()
    application.state.connectome_store = GraphStore(Path(data_path)) if data_path else None
    application.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=False,
        allow_methods=["GET"],
        allow_headers=["Accept", "Content-Type"],
    )
    application.include_router(api_router)
    application.include_router(connectome_router)
    application.include_router(morphology_router)
    application.include_router(tissue_router)
    return application


app = create_app()
