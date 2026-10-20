# Neuroverse Frontend (Phase 02)

Prerequisites: Node.js >=22.12 (Vite 7 also supports Node >=20.19).

Run from `frontend/`:

```bash
npm ci
npm run dev
```

Visit http://localhost:5173. Start the FastAPI backend first if you want the API status to read **CONNECTED**. The frontend is intentionally usable when the backend is offline.

Checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e   # install Chromium first: npx playwright install chromium
```

The homepage now uses a **procedural conceptual fly-brain sculpture** rendered by React Three Fiber with a static illustration fallback, independent camera controls, and low-motion/quality modes. This is not a scanned or proofread FlyWire brain. Scientific 3D morphological assets and real-neuron-to-visual mapping remain reserved for Phase 05.

For production, use `VITE_API_BASE_URL` to point to the HTTPS backend origin. Vite env values are publicly embedded in the frontend; never put secrets in this file.

## Cosmic 3D behavior

On the homepage, drag the sculpture to orbit, use the mouse wheel to zoom while over its canvas, or use the **Front / Left / Right / Top / Reset** buttons. Motion and display quality are independent controls. **Saver** cuts geometry and disables background DNA; **Pause motion** disables ambient movement without disabling manual camera exploration. WebGL absence yields original SVG concept artwork and the rest of the website remains accessible. No user account or GPU-heavy imported scientific mesh is required.
