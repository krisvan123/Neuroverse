# Neuroverse API — Scientific Data Phase 03

Python 3.11+ is required. Run locally from the repository root (Windows PowerShell):

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

On macOS/Linux use `python3 -m venv .venv` and `source .venv/bin/activate`. The app starts even when no dataset is configured: neuron endpoints return **503** with instructions rather than fabricated data.

Health: http://127.0.0.1:8000/api/v1/health  
Capabilities: http://127.0.0.1:8000/api/v1/capabilities  
Data state: http://127.0.0.1:8000/api/v1/datasets/current  
OpenAPI/Swagger: http://127.0.0.1:8000/docs

## Import your downloaded FAFB v783 data

Read [the complete data pipeline guide](../docs/scientific-data-pipeline.md). You must download a legitimate source CSV/CSV.gz from the official FlyWire Codex portal yourself. No data or API tokens are embedded here.

```powershell
python -m app.data.pipeline --connections ../data/raw/connections_princeton.csv.gz --out ../data/processed/fafb_sample.sqlite3 --max-neurons 120 --max-edges 750
$env:NEUROVERSE_DATASET_DB = (Resolve-Path ../data/processed/fafb_sample.sqlite3).Path
python -m uvicorn app.main:app --reload
```

The CLI prints a manifest including source file SHA-256, selection parameters, a derived DB checksum and explicit source-identity limitations. All root IDs are strings to avoid JavaScript precision loss.

**Source availability disclaimer:** until independently confirmed against official publisher checksums, data are marked `source_identity_verified=false`; mathematical graph operations do not prove biological signal flow.

## Automated tests

From `backend/`:

```bash
python -m pytest -q
python -m compileall -q app tests
```

No signup, paid API, or data-provider token is needed to run the app on an already downloaded local CSV. Production CORS requires explicit trusted frontend origins via `NEUROVERSE_CORS_ORIGINS`.

## Phase 05 scientific anatomy endpoints

- GET /api/v1/brain/tissue-source: source, scope, transformation limitations.
- GET /api/v1/brain/tissue-mesh: pinned authentic FAFB tissue-mask-derived PLY, checked against source Git blob checksum.
- GET /api/v1/neurons/{root_id}/skeleton: real published FAFB v783 neuron centerline in original nanometer coordinates, edges and radii.

These fixed-source endpoints report 404 or 503 rather than substitute an illustration for missing scientific data. See ../docs/phase-05-implementation.md.
