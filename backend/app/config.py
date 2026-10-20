"""Configuration with explicit development origins and no implicit wildcard CORS."""

import os

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def get_allowed_origins() -> list[str]:
    """Return a clean, deduplicated list of authorized browser origins."""
    configured = os.getenv("NEUROVERSE_CORS_ORIGINS", DEFAULT_ORIGINS)
    origins = [origin.strip().rstrip("/") for origin in configured.split(",")]
    if "*" in origins:
        raise ValueError("Wildcard CORS is disabled; specify allowed frontend origins")
    return list(dict.fromkeys(origin for origin in origins if origin))
