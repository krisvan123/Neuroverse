# Neuroverse API (Phase 02)

Python 3.11+ is required.

Run locally from the repository root (Windows PowerShell):

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

On macOS/Linux replace activation with `source .venv/bin/activate` and create the venv with `python3 -m venv .venv`.

Health check: http://127.0.0.1:8000/api/v1/health  
API documentation: http://127.0.0.1:8000/docs  
Capabilities: http://127.0.0.1:8000/api/v1/capabilities

Tests (from `backend/`):

```bash
python -m pytest -q
```

Only system endpoints exist. No connectome data has been loaded or analyzed.

Production CORS must explicitly list the published frontend origin using `NEUROVERSE_CORS_ORIGINS`.
