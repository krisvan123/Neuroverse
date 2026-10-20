"""Vercel Services entrypoint for the existing Neuroverse FastAPI application.

The local development command remains: uvicorn app.main:app --reload.
The deployment wrapper does not create a second app or alter scientific data.
"""
from app.main import app

__all__ = ["app"]
