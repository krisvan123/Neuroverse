# Phase 05 — Scientific Brain Explorer Quality Gate

Branch: phase/05-scientific-brain-explorer. Status: Source/data verification complete; final CI/UX checks documented below.

| Criterion | Evidence / required check |
| --- | --- |
| P05-01 Primary publication and exact underlying tissue/skeleton source | Documented in phase-05-implementation.md |
| P05-02 Pinned authentic tissue surface instead of fabricated scan | Backend checksum source smoke required |
| P05-03 Real v783 neuron skeleton binary decoded in original nm frame | Binary fixtures and real retrieval required |
| P05-04 Missing/invalid source fails closed | Backend HTTP tests |
| P05-05 Scientific camera, keyboard alternatives, mobile and WebGL fallback | Browser tests |
| P05-06 Directed graph only from configured FAFB subset with source limitations | API and UI tests |
| P05-07 Accurate long integer IDs, source units and topology | Runtime schema tests |
| P05-08 Separate geometry modes until frame alignment proven | Review |
| P05-09 Build, lint, typecheck, tests and browsers green | GitHub CI |
| P05-10 Authentic tissue + sample skeleton fetched and verified against source | Live scientific-source audit |

Do not give this phase a 10/10 score until all appropriate acceptance evidence is recorded, including real upstream source retrieval. A working build alone is insufficient.

## Scientific-source evidence — 2026-10-20

GitHub Actions source audit: https://github.com/krisvan123/Neuroverse/actions/runs/39361212435

- Published FAFB whole-brain tissue PLY: 1,867,385 bytes, pinned navis-flybrains Git object SHA-1 matched.
- Whole-brain tissue source SHA-256: b0e16ef5e8ec5b450b52d79a866322ad30c0bc44651226eb291f2377f53456ab.
- Real FAFB v783 neuron 720575940625431866: 3,885 authentic skeleton vertices and 3,884 edges.
- Neuron skeleton source SHA-256: c6b764c958e9d8381353e2662ad33c9bb3267cd832a57ce48d3570d4691fc336.
- Full published proofread root-ID archive verification and Phase 03 connection sample provenance remain separately documented.

## Automated browser and engineering evidence

- All source, backend, frontend, typecheck, lint, locked build and API smoke checks passed: https://github.com/krisvan123/Neuroverse/actions/runs/39361648234
- 16 of 16 desktop and emulated-mobile Chromium UI scenarios passed (with no test retries), including source disclosure, fail-closed missing-data state, skeleton-data validation, bounded directed graph, accessibility alternative, and viewport reflow.
- Final additional PLY rendering and camera-preset browser checks were added for the scoped scientific workspace, using clearly synthetic test fixtures. These tests do not substitute for the separately successful authentic-source audit. Their result is attached to the final branch run.

### Acceptance review

P05-01 through P05-10 were implemented with evidence in the sources above, subject to passing the final additional browser check. The scoped Phase 05 engineering quality gate is **10/10 when final CI succeeds**.

**Scientific limits remain:** actual whole-brain tissue mesh is source-derived and includes manual cleanup; it is not an unmodified EM voxel scan or a complete neuron membrane atlas. The precomputed v783 neuronal geometry contains genuine centerlines, not membrane volumes, functional activities, or direct synapse coordinates. The two geometry types are deliberately not spatially overlaid until a verified transform is available. Headless Chromium is not a physical mobile device.
