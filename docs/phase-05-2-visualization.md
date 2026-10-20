# Phase 05.2 — Source-Derived 3D Inspection and Global Cosmic Animation

**Project:** Neuroverse · **Snapshot:** FlyWire FAFB v783 context · **Status:** Under final automated review.

## What is anatomically authentic?

The 3D **tissue envelope** shown on the homepage and in the Scientific Explorer originates in a tissue mask of the FAFB adult fruit-fly specimen. The source PLY was created through research preprocessing, meshing, cleanup and spatial transformation and is **not** an unmodified raw microscopy voxel volume. Our backend retrieves the exact pinned Git blob, checks the Git object checksum and records a SHA-256 fingerprint. Only geometric centering/uniform scale is applied for viewport presentation. Tissue triangle vertices and face connectivity are not invented or sculpted by Neuroverse.

The underlying publication is Dorkenwald et al. (2024), *Neuronal wiring diagram of an adult brain*, Nature, https://doi.org/10.1038/s41586-024-07558-y .

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

- The PLY is **tissue-mask-derived and manually processed**; do not call it a one-to-one raw 3D electron-microscope scan.
- Z depth is relative to the displayed mesh's local coordinate axis; it is **not** a registered anatomical layer, brain-region label or cell class.
- Whole-brain tissue and individual skeletons are not spatially co-registered in this release. True neuropil-region coloring would require a separate trusted segmentation atlas and verified transform.
- Any future overlay of original voxel segmentation/morphology needs source version, coordinate registration, legal status and performance review.
- Preview/browser tests do not certify GPU performance on every user's device.

Scientific data and licensing: https://home.flywire.ai/guidelines . Neuroverse is independent and is not endorsed by FlyWire or the source institutions.
