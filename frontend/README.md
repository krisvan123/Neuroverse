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

The homepage defaults to a **published FAFB14-aligned FlyWire neuropil template mesh** and offers the **FAFB tissue-mask-derived whole-brain surface** as a source-verified alternative from the local FastAPI API. The original, pinned PLY source is checksum-verified in the backend; geometry is only uniformly normalized for display. A static **conceptual SVG illustration** appears if WebGL is unavailable. The surface is NOT a raw microscopy voxel scan or an atlas of every neuron.

For production, use `VITE_API_BASE_URL` to point to the HTTPS backend origin. Vite env values are publicly embedded in the frontend; never put secrets in this file.

## Cosmic 3D behavior

On the homepage, drag the original FAFB-aligned neuropil surface to orbit, use the mouse wheel to zoom while over its canvas, or use the **Front / Left / Right / Top / Reset** buttons. Motion and display quality are independent controls. **Saver** cuts particles, retains one static DNA accent, and disables continuous 3D rendering; **Pause motion** disables ambient movement without disabling manual camera exploration. WebGL absence yields original SVG concept artwork and the rest of the website remains accessible. No account is required, but the authentic scientific mesh requires the FastAPI backend and its upstream source.

### Validated Phase 04 UI

[Phase 04 test report](../docs/phase-04-verification.md) documents real Chromium desktop/emulated-mobile tests and R3F scene-frame measurement. Browser screenshots are preserved as artifacts on the cited GitHub Actions run. Physical-device GPU FPS is not asserted.

## Phase 05 scientific explorer

Below the cinematic homepage, open the scientific workspace. It renders unchanged source-derived anatomy (apart from uniform view normalization), supports camera controls, and displays citations and limitations. Tissue-envelope, individual skeleton, and connectivity graph positions are never falsely conflated. It has a clear unavailable state when WebGL or the scientific service fails.

## Phase 05.2 — Visual modes and global cosmic motion

The Scientific Explorer has tissue-shaded, normalized-Z false-color, and original-triangle wireframe modes. The depth gradient is a **coordinate visualization**, not verified anatomical region labeling. Source geometry and connectivity remain separate.

Across **every** page section, three subtly drifting decorative background star layers and an occasional meteor provide cosmic ambience. A footer/hero global motion control stops their CSS animation, and system reduced-motion settings initialize them paused. Test with `npm run test` and `npm run test:e2e`. See [Phase 05.2 implementation](../docs/phase-05-2-visualization.md).

### Phase 05.2 final anatomy upgrade

The source switch **Neuropil / Whole tissue** loads *two different published research meshes*, each validated with a pinned Git blob SHA-1 by FastAPI. The default is the FlyWire-space neuropil mesh transformed from the FAFB14 neuropil template; whole tissue is a processed FAFB tissue mask surface. The **Anatomy / Depth / Wireframe** buttons change presentation only. Real tissue polygon geometry is not hand-sculpted. Their coordinate registration to each other is not assumed to be exact. Two rotating DNA helix decorations and a moving tracer remain separate from biological sources. Site-wide CSS star layers now move >9px in approximately 1.3s in a browser test, except under reduced motion.

Run frontend and FastAPI in two different terminals. From repo root in PowerShell: `cd frontend; npm run dev` for UI, and in a separate terminal `cd backend; .\\.venv\\Scripts\\Activate.ps1; python -m uvicorn app.main:app --reload` for original PLY API. Windows may need to create a `backend/.venv` first.

## Phase 05.3 — mission marquee and solid original morphology

The mission band scrolls an equal-width repeated statement seamlessly; OS reduced-motion and global Pause Motion show it as readable static text. The published FAFB neuropil remains the default source, now matte and visibly solid in Anatomy mode (including High Quality), with Depth and Wireframe intentionally different. No original scientific geometry or connectivity source is changed. See the [Phase 05.3 note](../docs/phase-05-3-visual-polish.md).

### Final Phase 05.3 UX refinements

If `datasets/current` reports missing connectivity, **Inspect directed connections** opens a source-specific FlyWire import guide with correct Windows commands and **Recheck dataset availability**. Imported bounded subgraphs expose their actual selected seed ID to avoid searching an excluded example neuron. The Three.js hero stops continuous frames when scrolled away/tab hidden, resuming when visible, without resetting the current user-selected view. These runtime optimizations do not alter the original FAFB anatomical polygons.
