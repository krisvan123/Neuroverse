# Phase 05.2 — Source-Derived 3D Inspection and Global Cosmic Animation

**Project:** Neuroverse · **Snapshot:** FlyWire FAFB v783 context · **Status:** PR #9 merged to `main`; expanded scientific-source and browser verification passed (2026-10-20).

## What is anatomically authentic?

Neuroverse now offers **two distinct published shapes**. The default homepage **neuropil template** originates from the FAFB14 neuropil and was transformed to FlyWire space, as confirmed by the upstream `flybrains/templates.py` `_FLYWIRE` description. The optional **whole-brain tissue envelope** originates in a tissue mask of the FAFB adult fruit-fly specimen. The source PLY was created through research preprocessing, meshing, cleanup and spatial transformation and is **not** an unmodified raw microscopy voxel volume. Our backend retrieves the exact pinned Git blob, checks the Git object checksum and records a SHA-256 fingerprint. Only geometric centering/uniform scale is applied for viewport presentation. Tissue triangle vertices and face connectivity are not invented or sculpted by Neuroverse.

The underlying publication is Dorkenwald et al. (2024), *Neuronal wiring diagram of an adult brain*, Nature, https://doi.org/10.1038/s41586-024-07558-y .

Neuropil source and registration: https://github.com/navis-org/navis-flybrains/blob/273333c8d8bf5adeebebd274e554621462e388bd/flybrains/templates.py . The `FLYWIRE.ply` Git object SHA-1 is `468c217c41602a8d34df2af6afd00a2aa1c11077`, downloaded without modifying the original payload by `backend/app/data/neuropil.py`. It represents a *FAFB14 neuropil surface transformed into FlyWire space*; **not** a segmentation of named neuropil subregions.

Mesh and preparation notes: https://github.com/navis-org/navis-flybrains/blob/273333c8d8bf5adeebebd274e554621462e388bd/flybrains/meshes/FLYWIRE_whole_brain.md . Source object Git SHA-1 is `3cf14cdd1399f212057f40c918493452abf056da`, as pinned in `backend/app/data/tissue.py`.

Published neuron centerlines (also real source geometry) are available in the separate skeleton mode. No tissue-skeleton coordinate overlay is claimed without an independent alignment transform. No per-synapse 3D localization is inferred from the selected structural graph.

## Three science viewer display modes

| Viewer mode | Shows | Scientific interpretation |
| --- | --- | --- |
| Tissue shading | Original source surface polygons with material/light response | 3D shape only; color and reflections chosen by Neuroverse |
| Depth colors | Original polygons, with deterministic per-vertex interpolation along the displayed mesh's local Z axis | **Coordinate visualization only**; violet/cyan/gold do NOT indicate anatomical territories |
| Triangle mesh | Actual wireframe edges of the source triangle mesh | Reveals polygon topology; edges are NOT axons or synapses |

The helper `frontend/src/scenes/surfaceColors.ts` sets a vertex color attribute based on measured, fitted Z coordinates. It **never mutates the position or triangle index buffer**. Unit tests explicitly compare those buffers before and after color application. Renderer modes modify Three.js materials, not biological data. The anatomical morphology and its internal segmentation are not upgraded by switching colors.

## Site-wide background motion

The background is a three-layer star field fixed to the browser viewport, extending beneath the homepage, learning, scientific workspace, future labs and citations. Motion is slow and CSS-only: transform drift, group twinkle and a rare short meteor. **These stars are decorative, not electron microscopy or neuron coordinates.** This avoids heavy per-star JS timers and a second global 3D renderer.

- `html[data-motion="quiet"]` stops all backdrop animations, including meteor and haze.
- OS `prefers-reduced-motion` initializes quiet mode by default. Users can explicitly enable motion through existing controls.
- `.cosmic-backdrop` has `pointer-events:none` and `aria-hidden="true"`, allowing text, data tables, camera controls and navigation to remain usable.
- Fixed background remains in the viewport during scrolling. Individual sections with opaque background panels still protect text contrast.

## Accuracy and release limits

- The whole-brain tissue PLY is **tissue-mask-derived and manually processed**; the FAFB neuropil PLY is a registered template surface. Neither is a one-to-one raw 3D electron-microscope voxel scan.
- Z depth is relative to the displayed mesh's local coordinate axis; it is **not** a registered anatomical layer, brain-region label or cell class.
- Neuropil template vs tissue mask, and either surface vs individual skeletons, are not proven perfectly co-registered in this release. True neuropil-region coloring would require a separate trusted segmentation atlas and verified transform.
- Any future overlay of original voxel segmentation/morphology needs source version, coordinate registration, legal status and performance review.
- Preview/browser tests do not certify GPU performance on every user's device.

Scientific data and licensing: https://home.flywire.ai/guidelines . Neuroverse is independent and is not endorsed by FlyWire or the source institutions.

## Final Phase 05.2 visual changes pending acceptance

- Default hero changes to the original FAFB neuropil polygons. Learners compare **Neuropil** vs **Whole tissue** rather than perceiving material changes on an unchanged mesh. Both source SHA-1 objects are checked by the backend, and independently downloaded/validated in CI and actual Chromium.
- Two decorative animated DNA helices at balanced/high quality with brighter double strands, rung geometry, and a travelling luminous tracer; one static helix at saver quality; global pause/reduced-motion honored.
- Three separate fixed browser background layers travel by over 200 CSS pixels across 19/31/41-second animations with multi-layer twinkle. In browser CI we measure >9 CSS px displacement in 1.3s, not merely existence of animation CSS rules.
- No animated material is presented as neural impulses, electrical brain activity, an individual neuron, or a source record.
