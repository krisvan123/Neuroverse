"""FastAPI application factory for Neuroverse."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as api_router
from app.config import get_allowed_origins


def create_app() -> FastAPI:
    """Create a fresh API instance with predictable configuration."""
    application = FastAPI(
        title="Neuroverse API",
        version="0.1.0",
        description=(
            "API foundation for a research-inspired interactive neuroscience "
            "learning platform. No real connectome data is served yet."
        ),
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=False,
        allow_methods=["GET"],
        allow_headers=["Accept", "Content-Type"],
    )
    application.include_router(api_router)
    return application


app = create_app()
