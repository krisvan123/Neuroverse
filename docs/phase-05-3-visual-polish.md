# Phase 05.3 — Seamless Mission Motion and Solid Scientific Anatomy

Scope: visual polish and defensible original mesh presentation only. Phase 06 has NOT started.

## What changed

- Replaced the static mission line with a seamless right-to-left marquee constructed from two identical units. The duplicate is hidden from screen readers, and hover pauses animation.
- The existing global reduced-motion preference also stops the new marquee and lets the complete sentence wrap naturally.
- Kept original FAFB neuropil as hero default. Solid Anatomy has a matte material with smooth shading and NO transparent wireframe overlay at any quality setting.
- Depth is a coordinate-only color gradient, Wireframe exposes the original scientific mesh triangles. A visible overlay announces exactly which rendering mode is selected, even when the controls are below the fold.
- The source-specific neuropil and tissue meshes are unaltered. No fake neuroscience data or simulation is added. Published FAFB surface assets are not the entire raw electron microscopy voxel scan.
- Existing site-wide star and DNA animations remain; no Phase 06 features are introduced.

## Acceptance gates

- Frontend lint, typecheck, unit, build; backend/API and original FAFB source audits.
- Real Chromium desktop/mobile tests measure nonzero marquee movement, verify exactly half-width seamless tile repetition, hover + quiet-mode pause, and static text with OS reduced motion.
- Original published FAFB neuropil visual check captures solid, depth and wireframe screenshots in independent canvas frames and verifies pixels differ between modes.
- Software verification is distinct from user visual acceptance on an actual Windows GPU.

Status: CI acceptance pending on Phase 05.3 PR.
