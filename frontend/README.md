# Neuroverse Frontend (Phase 02)

Prerequisites: Node.js >=22.12 (Vite 7 also supports Node >=20.19).

Run from `frontend/`:

```bash
npm install
npm run dev
```

Visit http://localhost:5173. Start the FastAPI backend first if you want the API status to read **CONNECTED**. The frontend is intentionally usable when the backend is offline.

Checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The conceptual vector illustration is **not a scanned brain**. Scientific 3D assets, DNA and animated particle layers are Phase 04/05 tasks and are not claimed as implemented in this foundation.

For production, use `VITE_API_BASE_URL` to point to the HTTPS backend origin. Vite env values are publicly embedded in the frontend; never put secrets in this file.
