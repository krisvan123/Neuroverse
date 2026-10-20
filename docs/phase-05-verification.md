# Phase 05 — Scientific Brain Explorer Quality Gate

Branch: `phase/05-scientific-brain-explorer`. **Status: accepted for the explicitly scoped Phase 05 source-accurate anatomy and graph-exploration implementation.**

| Criterion | Evidence / required check |
| --- | --- |
| P05-01 Primary publication and exact underlying tissue/skeleton source | Documented in phase-05-implementation.md |
| P05-02 Pinned authentic tissue surface instead of fabricated scan | Passed: real upstream download + expected Git object checksum |
| P05-03 Real v783 neuron skeleton binary decoded in original nm frame | Passed: real source example + malformed binary fixtures |
| P05-04 Missing/invalid source fails closed | Backend HTTP tests |
| P05-05 Scientific camera, keyboard alternatives, mobile and WebGL fallback | Passed: desktop/mobile Chromium and accessibility fallback tests |
| P05-06 Directed graph only from configured FAFB subset with source limitations | API and UI tests |
| P05-07 Accurate long integer IDs, source units and topology | Runtime schema tests |
| P05-08 Separate geometry modes until frame alignment proven | Review |
| P05-09 Build, lint, typecheck, tests and browsers green | Passed: all six workflow jobs in run 39362206295 |
| P05-10 Authentic tissue + sample skeleton fetched and verified against source | Passed: live source audit in run 39362206295 |

**Quality score: 10/10 for the limited Phase 05 implementation and test gates defined above.** This is not certification that the original volume mask, every reconstructed neuron, or coordinate-frame alignment has been independently scientifically audited.

## Scientific-source evidence — 2026-10-20

GitHub Actions source audit: https://github.com/krisvan123/Neuroverse/actions/runs/39362206295

- Published FAFB whole-brain tissue PLY: 1,867,385 bytes, pinned navis-flybrains Git object SHA-1 matched.
- Whole-brain tissue source SHA-256: b0e16ef5e8ec5b450b52d79a866322ad30c0bc44651226eb291f2377f53456ab.
- Real FAFB v783 neuron 720575940625431866: 3,885 authentic skeleton vertices and 3,884 edges.
- Neuron skeleton source SHA-256: c6b764c958e9d8381353e2662ad33c9bb3267cd832a57ce48d3570d4691fc336.
- Full published proofread root-ID archive verification and Phase 03 connection sample provenance remain separately documented.

## Automated browser and engineering evidence

- All **six** GitHub Actions jobs passed: https://github.com/krisvan123/Neuroverse/actions/runs/39362206295 (frontend lint/typecheck/test/build, backend tests, HTTP integration, official FAFB ID audit, live tissue/skeleton audit, Chromium desktop/mobile).
- **18/18 browser checks passed with no retries**, including provenance disclosure, safe missing-data state, neuron skeleton response validation, bounded directed network, camera preset/reset, PLY parsing, WebGL fallback and responsive mobile layout.
- Browser view tests use clearly **synthetic test fixtures** for PLY and skeleton values. These are never used for published neuroscience data. The independent GitHub job also fetched and verified *actual* scientific tissue/skeleton files from their original hosts.
- End-to-end interactive GPU rendering using the **actual** 1.87 MB research tissue file on physical student devices remains a separate real-device release check; browser tests used source-format fixtures, not the complete research PLY.

### Acceptance review

P05-01 through P05-10 met their **scoped engineering/source-integration acceptance criteria** with independent source checks and browser tests. No remaining blocker within that scope; morphological atlas completion, exact alignment and device-GPU performance remain future tasks.

**Scientific limits remain:** actual whole-brain tissue mesh is source-derived and includes manual cleanup; it is not an unmodified EM voxel scan or a complete neuron membrane atlas. The precomputed v783 neuronal geometry contains genuine centerlines, not membrane volumes, functional activities, or direct synapse coordinates. The two geometry types are deliberately not spatially overlaid until a verified transform is available. Headless Chromium is not a physical mobile device.
