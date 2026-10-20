# ✺ Neuroverse

**Explore the Brain. Discover the Science. Experiment with Intelligence.**

Neuroverse is an independent, research-inspired science learning platform that will connect neuroscience, connectome data, and computer science through accessible interactive education, biological network exploration, and reproducible mathematical experiments.

> **Current development status: Phase 03 — Scientific Data Pipeline (under review).** The React landing interface and FastAPI system endpoints are implemented as a foundation. **A functional 3D fly-brain explorer, completed lessons, and experiments do not exist yet. A local CSV-to-SQLite importer and read-only neuron API are being developed, but NO officially verified FlyWire data have been loaded into this repository.** The animated network diagram is a clearly labeled conceptual graphic, not a scientific scan.

## Product direction

- **Learn:** evidence-based neuroscience and computer science lessons.
- **Explore:** investigate a clearly attributed subset of the FlyWire adult fruit fly connectome (planned).
- **Experiment:** run graph algorithms and compare reproducible computational results (planned).
- **Experience:** an accessible Cosmic Neuroscience interface with optional 3D visuals, DNA helices, and subtle star particles (planned Phase 04).

## Technology

| Layer | Choice | Phase 02 status |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS | Scaffolded |
| API | Python, FastAPI, Pydantic | Running endpoints / tests |
| 3D scenes | Three.js, React Three Fiber | Planned |
| Graph analysis | NetworkX | Planned |
| Scientific data | FlyWire FAFB v783 local CSV import, SQLite subset | Implemented pipeline; no authenticated source imported by default |
| Persistence | SQLite (selected neuron graph) | Local-only generated dataset, opt-in |

## Quick start — Windows PowerShell

**Requirements:** Node.js 22.12+ (or compatible Node 20.19+) and Python 3.11+. Open two PowerShell terminals.

**Terminal A — API:**

```powershell
git clone https://github.com/krisvan123/Neuroverse.git
cd Neuroverse\backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If `py -3.13` is unavailable, use any installed Python 3.11+ interpreter. API documentation: http://127.0.0.1:8000/docs.

**Terminal B — UI:**

```powershell
cd Neuroverse\frontend
npm ci
npm run dev
```

Open http://localhost:5173. The UI also renders when the API is offline, and reports its actual connection state. For production builds, set `VITE_API_BASE_URL` (see `frontend/.env.example`); the development Vite proxy forwards `/api` to `http://127.0.0.1:8000`.

> During Phase 03 PR review, check out `phase/03-scientific-data` to access the latest data pipeline code.

## Phase 03 — import real data locally

Download a FAFB **v783** CSV or CSV.gz from the [official Codex portal](https://codex.flywire.ai/api/download?dataset=fafb). It may require a personal Codex login. **Do not share your API token**, and do not commit raw data files.

From `backend/`, with your Python environment activated:

```powershell
python -m app.data.pipeline --connections ../data/raw/connections_princeton.csv.gz --out ../data/processed/fafb_sample.sqlite3 --max-neurons 120 --max-edges 750
$env:NEUROVERSE_DATASET_DB = (Resolve-Path ../data/processed/fafb_sample.sqlite3).Path
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Read [the full scientific data guide](docs/scientific-data-pipeline.md) before importing. The generated manifest records local source hashes, version, and limitations; it does **not** independently authenticate file origin. Without a configured dataset, neuron endpoints return HTTP 503 instead of invented neuroscience data.

## Quality checks

```bash
# from frontend
npm run lint
npm run typecheck
npm run test
npm run build

# from backend
python -m pytest -q
```

GitHub Actions runs both test jobs for pull requests. Read [Phase 02 Verification](docs/phase-02-verification.md) for actual evidence and incomplete acceptance checks.

## Documentation

- [Product Requirements](docs/product-requirements.md): audience, Mission 001, MVP boundary and acceptance criteria.
- [Scientific Standards](docs/scientific-standards.md): papers, claim register, version/unit distinctions, dataset ethics and license.
- [Cosmic Design Blueprint](docs/design-blueprint.md): visual language, camera and responsive/reduced-motion rules.
- [Roadmap & Quality Gates](docs/roadmap.md): nine phases and exit criteria.
- [Phase 02 Verification](docs/phase-02-verification.md): completed foundational CI.
- [Scientific Data Pipeline Guide](docs/scientific-data-pipeline.md): source acquisition, schema, importer, API, caveats.
- [Phase 03 Quality Gate](docs/phase-03-verification.md): tests and real-data verification status.

## Scientific references

- Dorkenwald et al. (2024), *Neuronal wiring diagram of an adult brain*, Nature: https://doi.org/10.1038/s41586-024-07558-y
- Lin et al. (2024), *Network statistics of the whole-brain connectome of Drosophila*, Nature: https://doi.org/10.1038/s41586-024-07968-y
- FlyWire public release rules: https://home.flywire.ai/guidelines

**Scientific integrity:** structural connectome connections are not recorded electrical signals. Paired edges and individual synapses are different units. FlyWire public release data are subject to CC BY-NC 4.0, requiring attribution and noncommercial use restrictions. Graphics and data assets must be reviewed independently before redistribution.

Neuroverse is not a medical service and is not affiliated with or endorsed by the FlyWire Consortium, Princeton University, or Nature.

## Contributions

This is a phased educational engineering project. See the roadmap before proposing major features. Do not commit secret credentials, unlicensed assets, large raw datasets, or uncited scientific claims.
