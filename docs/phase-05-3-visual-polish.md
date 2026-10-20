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

Status: Engineering acceptance **PASS** on 2026-10-20. [PR #10](https://github.com/krisvan123/Neuroverse/pull/10) merged to `main` as commit `732b989c0e43ee807741f9ae66c5a1c614b7c3e2`.

[GitHub Actions run 39391681428](https://github.com/krisvan123/Neuroverse/actions/runs/39391681428): **6/6 jobs passed**; **36/36 real Chromium tests on desktop/mobile emulation passed**. The browser tests measured marquee movement and checked reduced motion and real original FAFB Canvas screenshot differences across all three modes. Physical-device GPU visual acceptance is separate and awaiting user review. Phase 06 has not started.

## Final Phase 05.3 usability and efficiency gate (extension)

- When a real local connectivity CSV has not been imported, *Inspect directed connections* reveals step-by-step authentic FAFB dataset setup, an official Codex source link, copyable PowerShell commands and a **Recheck dataset availability** button. No generated/fake neuronal edges ever substitute for missing data.
- When a selected dataset exists, its real `seed_root_id` becomes the initial exploration ID if the learner has not entered a different ID. A **Use this dataset's seed neuron** button is also available. This prevents the default published example neuron from spuriously failing when absent from a small selected subgraph. User-entered IDs remain untouched on subsequent refreshes.
- The hero's Three.js animation is suspended automatically when the canvas is offscreen or when the browser tab is hidden. This reduces unnecessary activity while reading the rest of the page. The current manually chosen camera angle is not reset on temporary suspension; only explicit view buttons or Reset do so.
- Original mesh surface materials in the Scientific Explorer use balanced illumination for clearer contours, without editing source coordinates. Site-wide motion reduction, marquee accessibility, star/DNA decorations and honest depth legend remain in effect.
- Dev-only WebGL diagnostics now include the total rendered frame count so desktop/mobile Chromium can verify the continuous loop stops outside the viewport and resumes on return. These are headless/software WebGL measurements, **not** a physical GPU FPS benchmark.

No Phase 06 features, no fabricated connectome and no claims of raw-vxel-complete anatomy.

**Extension verification:** PASS. [PR #11](https://github.com/krisvan123/Neuroverse/pull/11) merged into main as commit `610e0e168a461453f97bba742b6d99019af30ed9`. [GitHub Actions run 39406934884](https://github.com/krisvan123/Neuroverse/actions/runs/39406934884) passed **all six checks** and **42/42 desktop/mobile Chromium tests**, including real mesh original source audit, dataset refresh/recovery and explicit preservation of visitor-chosen root ID, plus measured offscreen WebGL frame suspension and orientation preservation. Physical-device performance remains unbenchmarked and connectivity requires an original user-imported dataset.
