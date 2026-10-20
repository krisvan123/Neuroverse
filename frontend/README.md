# Neuroverse Frontend

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

The homepage loads a **source-derived FAFB whole-brain tissue surface** from the local FastAPI API. The original, pinned PLY source is checksum-verified in the backend; geometry is only uniformly normalized for display. A static **conceptual SVG illustration** appears if WebGL is unavailable. The surface is NOT a raw microscopy voxel scan or an atlas of every neuron.

For production, use `VITE_API_BASE_URL` to point to the HTTPS backend origin. Vite env values are publicly embedded in the frontend; never put secrets in this file.

## Cosmic 3D behavior

On the homepage, drag the FAFB tissue surface to orbit, use the mouse wheel to zoom while over its canvas, or use the **Front / Left / Right / Top / Reset** buttons. Motion and display quality are independent controls. **Saver** cuts geometry and disables background DNA; **Pause motion** disables ambient movement without disabling manual camera exploration. WebGL absence yields original SVG concept artwork and the rest of the website remains accessible. No user account or GPU-heavy imported scientific mesh is required.

### Validated Phase 04 UI

[Phase 04 test report](../docs/phase-04-verification.md) documents real Chromium desktop/emulated-mobile tests and R3F scene-frame measurement. Browser screenshots are preserved as artifacts on the cited GitHub Actions run. Physical-device GPU FPS is not asserted.

## Phase 05 scientific explorer

Below the cinematic homepage, open the scientific workspace. It renders unchanged source-derived anatomy (apart from uniform view normalization), supports camera controls, and displays citations and limitations. Tissue-envelope, individual skeleton, and connectivity graph positions are never falsely conflated. It has a clear unavailable state when WebGL or the scientific service fails.

## Phase 05.2 — Visual modes and global cosmic motion

The Scientific Explorer has tissue-shaded, normalized-Z false-color, and original-triangle wireframe modes. The depth gradient is a **coordinate visualization**, not verified anatomical region labeling. Source geometry and connectivity remain separate.

Across **every** page section, three subtly drifting decorative background star layers and an occasional meteor provide cosmic ambience. A footer/hero global motion control stops their CSS animation, and system reduced-motion settings initialize them paused. Test with `npm run test` and `npm run test:e2e`. See [Phase 05.2 implementation](../docs/phase-05-2-visualization.md).
