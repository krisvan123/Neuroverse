"""Serve only a validated Vite production bundle when explicitly configured."""
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

class VersionedAssets(StaticFiles):
    """Vite content-hashed filenames permit immutable caching."""
    async def get_response(self, path: str, scope: dict):
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response

def install_public_site(application: FastAPI) -> None:
    """API-only locally; serve React at the same origin in a release container."""
    configured = os.getenv("NEUROVERSE_STATIC_DIR", "").strip()
    if not configured:
        return
    directory = Path(configured).resolve()
    entry, assets = directory / "index.html", directory / "assets"
    if not entry.is_file() or not assets.is_dir():
        raise RuntimeError("NEUROVERSE_STATIC_DIR must contain built index.html and assets/; run the frontend production build first.")
    application.mount("/assets", VersionedAssets(directory=str(assets)), name="production-assets")

    @application.get("/", include_in_schema=False)
    async def homepage() -> FileResponse:
        return FileResponse(entry, media_type="text/html", headers={"Cache-Control": "no-cache"})
