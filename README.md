# ✺ Neuroverse

**Explore the Brain. Discover the Science. Experiment with Intelligence.**

Neuroverse is an independent, research-inspired science learning platform that will connect neuroscience, connectome data, and computer science through accessible interactive education, biological network exploration, and reproducible mathematical experiments.

> **Current development status: Phase 05.3 — Motion, Authentic Anatomy & Connectome Onboarding (final UX audit underway).** This phase adds a seamlessly scrolling (and globally pausable) mission statement, original-FAFB solid anatomical surface shading without wire overlays, explicit render-mode labels and distinct depth/triangle inspection styles. The homepage now defaults to the **published FlyWire/FAFB14 neuropil mesh** (a registered neuropil template). Users can switch to the independently published **whole-brain FAFB tissue-mask-derived surface**, or inspect original mesh triangles and non-biological depth colors. Both assets are pinned to source Git blob checksums. Two visible animated DNA helices and more obvious parallax-style drifting stars are artistic overlays, not neuron observations. Neither surface is the original raw EM voxel volume or a named-neuropil segmentation atlas.

## Product direction

- **Learn:** evidence-based neuroscience and computer science lessons.
- **Explore:** investigate a clearly attributed subset of the FlyWire adult fruit fly connectome (planned).
- **Experiment:** run graph algorithms and compare reproducible computational results (planned).
- **Experience:** an accessible Cosmic Neuroscience interface with a source-validated FAFB-aligned neuropil and tissue-surfaces in 3D, controllable camera, optional decorative DNA and site-wide gently drifting stars (Phase 05.2).

## Technology

| Layer | Choice | Phase 02 status |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS | Responsive homepage and tests implemented |
| API | Python, FastAPI, Pydantic | Running endpoints / tests |
| 3D scenes | Three.js, React Three Fiber 9 | Authenticated FAFB neuropil + processed whole-brain tissue, scientific mesh inspector, independently sourced neuron skeletons |
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

> If Phase 04 has not been merged yet, use `git switch phase/04-cosmic-ui` to preview its code.

## Phase 04 — Cosmic Neuroscience controls

The homepage now loads a **source-derived FAFB tissue surface PLY** from the authenticated FastAPI endpoint. Its lighting/DNA/stars are decorative; the tissue envelope does not depict individually traced neuron membranes. Drag to orbit, use the wheel to zoom within the canvas, or use **Front / Left / Right / Top / Reset** buttons for accessible camera presets. **High / Balanced / Saver** changes the particle, fiber, DNA, and pixel-ratio budget; **Pause motion** disables ambient animation while preserving manual camera controls. WebGL-disabled browsers show original SVG artwork instead.

Phase 04 validation: [quality report](docs/phase-04-verification.md) and [browser test screenshots](https://github.com/krisvan123/Neuroverse/actions/runs/39357768257).

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

GitHub Actions runs frontend/backend/integration tests and a lightweight verified neuron ID archive check. A large-connectivity checksum/sample audit is available as a manual workflow.  Read [Phase 02 Verification](docs/phase-02-verification.md) for actual evidence and incomplete acceptance checks.

## Documentation

- [Product Requirements](docs/product-requirements.md): audience, Mission 001, MVP boundary and acceptance criteria.
- [Scientific Standards](docs/scientific-standards.md): papers, claim register, version/unit distinctions, dataset ethics and license.
- [Cosmic Design Blueprint](docs/design-blueprint.md): visual language, camera and responsive/reduced-motion rules.
- [Roadmap & Quality Gates](docs/roadmap.md): nine phases and exit criteria.
- [Phase 02 Verification](docs/phase-02-verification.md): completed foundational CI.
- [Scientific Data Pipeline Guide](docs/scientific-data-pipeline.md): source acquisition, schema, importer, API, caveats.
- [Phase 03 Quality Gate](docs/phase-03-verification.md): authentic archive sample audit.
- [Phase 04 Visual Experience](docs/phase-04-implementation.md): 3D design, controls, performance limits, accessible fallbacks.
- [Phase 04 Quality Gate](docs/phase-04-verification.md): actual CI/E2E results and remaining checks.

## Authentic FlyWire verification

A GitHub Actions run verified the original Zenodo ~852 MB FAFB v783 connectivity archive against its published MD5, extracted a **non-representative** 20,000-row prefix, and ran the CSV/SQLite API pipeline. The verification evidence is [documented here](docs/phase-03-verification.md). To repeat the large download only when needed, use the GitHub Actions workflow **Audit official FAFB connections (manual)**. Do not commit scientific archives, tokens, or user files.

## Phase 05.2 — Scientific 3D display and site-wide cosmic stars

**Latest Phase 05.2 geometry upgrade:** the hero defaults to the independent [FLYWIRE.ply](https://github.com/navis-org/navis-flybrains/blob/273333c8d8bf5adeebebd274e554621462e388bd/flybrains/meshes/FLYWIRE.ply) *FAFB14-aligned neuropil template* with verified upstream Git object `468c217c41602a8d34df2af6afd00a2aa1c11077`. Choose **Whole tissue** for [FLYWIRE_whole_brain.ply](https://github.com/navis-org/navis-flybrains/blob/273333c8d8bf5adeebebd274e554621462e388bd/flybrains/meshes/FLYWIRE_whole_brain.md) (separately pinned `3cf14cdd1399f212057f40c918493452abf056da`). The scientific explorer supports both independent surfaces without assuming perfect co-registration. **Both are original published polygons, not invented anatomy; neither is a raw voxel-exact full segmentation atlas.**


The **whole-brain tissue geometry** is a FAFB-derived PLY from the original `navis-flybrains` project, checked against a fixed upstream Git blob by the FastAPI backend. You can inspect it in the Scientific Explorer using **Tissue shading**, **Depth colors** or **Triangle mesh**. Depth colors encode only **relative Z position of the same vertices** (violet → cyan → gold). **They do not represent anatomical regions, cell types, neural activity, or segmentation labels.** Source vertices, triangle indices, and proportions are never altered for the color display.

The background stars, subtle nebula, and occasional shooting star are **purely decorative** and drift over every section. Use **Reduce ambient motion** in the footer or the hero's **Pause motion** control to stop them; the website also respects the system's reduced-motion setting. The global star animation uses composited CSS layers, not separate animation loops for individual stars.

A derived tissue-mask PLY is **not a complete raw 3D electron-microscope voxel reconstruction**. See the [Phase 05.2 implementation and limitations](docs/phase-05-2-visualization.md) and [verification checklist](docs/phase-05-2-verification.md).

## Phase 05: source-derived anatomy

Scroll to the scientific explorer below the homepage hero and start FastAPI before requesting anatomy. The tissue mesh is fetched unchanged from a pinned navis-flybrains Git blob, while skeletons are fetched per neuron ID from the public FAFB v783 precomputed archive in Cambridge. Choose a known proofread root ID such as 720575940625431866, then click Load real neuron skeleton. Connection search requires a local imported FAFB subset. If scientific source services are unavailable, no fake mesh is substituted. See [Phase 05 sources and methods](docs/phase-05-implementation.md) and [verification gate](docs/phase-05-verification.md).

## Scientific references

- Dorkenwald et al. (2024), *Neuronal wiring diagram of an adult brain*, Nature: https://doi.org/10.1038/s41586-024-07558-y
- Lin et al. (2024), *Network statistics of the whole-brain connectome of Drosophila*, Nature: https://doi.org/10.1038/s41586-024-07968-y
- FlyWire public release rules: https://home.flywire.ai/guidelines

**Scientific integrity:** structural connectome connections are not recorded electrical signals. Paired edges and individual synapses are different units. FlyWire public release data are subject to CC BY-NC 4.0, requiring attribution and noncommercial use restrictions. Graphics and data assets must be reviewed independently before redistribution.

Neuroverse is not a medical service and is not affiliated with or endorsed by the FlyWire Consortium, Princeton University, or Nature.

## Contributions

This is a phased educational engineering project. See the roadmap before proposing major features. Do not commit secret credentials, unlicensed assets, large raw datasets, or uncited scientific claims.

### Phase 05.3 usability extension

When the real directed-connectivity graph is unavailable locally, the Scientific Explorer now provides the original FlyWire import steps instead of a dead-end error. After importing the official connections CSV, use **Recheck dataset availability** and, when available, **Use this dataset's seed neuron**. No fictional synapses are generated. The 3D hero stops continuous rendering offscreen or in a hidden tab, retaining selected camera views on return. See [Phase 05.3 methodology and limitations](docs/phase-05-3-visual-polish.md).
