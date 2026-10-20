# Phase 05.2 — Acceptance Checks

**Status:** In review; mark PASS only after the final branch commit CI and browser runs complete.

| ID | Acceptance target | Verification |
| --- | --- | --- |
| P05.2-01 | Original FAFB tissue PLY and official neuron-source checks preserved | Original source-checksum CI |
| P05.2-02 | Source mesh XYZ and triangles unchanged by display colors | `surfaceColors.test.ts` |
| P05.2-03 | Three independently operable tissue/depth/triangle modes | Scientific Chromium desktop + mobile |
| P05.2-04 | Depth legend explicitly denies biological region meaning | Scientific browser test and on-screen label |
| P05.2-05 | Background stars animate across every section | Fixed-position CSS plus scroll/browser test |
| P05.2-06 | Footer and hero motion toggles stop background motion | Browser toggling and CSS assertion |
| P05.2-07 | Reduced-motion, mouse/touch navigation and WebGL fallback | Existing Chromium and new tests |
| P05.2-08 | No imaginary tissue morphology or unknown coordinate overlay | Code/provenance review |
| P05.2-09 | Frontend TypeScript/lint/test/build, backend/API and browser all green | GitHub Actions PR validation |
| P05.2-10 | No claim of 1:1 raw EM scan or verified anatomical colors | Documentation and UI disclosures |

**Limitations to retain:** Source PLY originates from a processed FAFB tissue mask, not unprocessed EM voxels. Depth colors are relative mesh coordinates. Device-specific real-GPU benchmarking and anatomical atlas registration remain future scientific verification tasks; do not present this phase as a complete neuron-volume reconstruction.
