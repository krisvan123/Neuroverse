# Neuroverse — Development Roadmap and Quality Gates

**Document ID:** NV-ROADMAP-001  
**Version:** 1.0 · **Baseline:** 2026-10-20  
**Project state:** Phases 01–05 completed to their limited engineering scopes. Phase 05.2 adds original FAFB-derived neuropil and whole-tissue mesh comparison, measurable drifting global CSS stars, and two animated DNA helices (expanded CI acceptance passed; 30/30 desktop/mobile Chromium tests, physical-device visual acceptance pending). **Full 3D EM segmentation alignment and anatomical region labels remain unverified and are not claimed.** Phase 05.3 adds a continuously animated, globally pausible mission statement and a visually distinct solid anatomical hero (QA in progress). Phase 06 has NOT started; Phases 06–09 remain planned.

## 1. Delivery philosophy

Build a genuinely educational and technically defensible product before expanding visual complexity.

**Core loop:** Plan → Implement → Verify → Score → Repair → Re-verify → Accept.

**Definition of "10/10":** all phase-specific requirements and objective acceptance checks have evidence and no outstanding blocking defects. A subjective score alone cannot certify scientific accuracy, accessibility, or production readiness. When a test cannot be performed, the corresponding criterion is **not verified**, rather than automatically passed.

**Release rhythm:** one bounded branch and review per phase. Use small commits, preserve previous work, avoid unreviewed direct-to-`main` changes except initial repository setup. Future phases cannot be marked "complete" before relevant tests run.

## 2. Nonnegotiable technical and scientific gates

Each phase has its own checklist and must meet **all applicable gates**:

1. **Scope:** required deliverables exist and match their acceptance criteria.
2. **Science:** source accuracy, scope, method, dataset version and units checked where relevant.
3. **Correctness:** behavior is demonstrable on known examples; expected failures handled.
4. **UX:** important tasks are discoverable and usable without hidden instructions.
5. **Accessibility:** no core task depends exclusively on vision, motion, color, or 3D gestures.
6. **Performance:** measurable budgets tested on nominated devices when executable.
7. **Security/privacy:** no unnecessary collection of personal data, safe input handling.
8. **Reproducibility:** fixed inputs, versions and methods generate consistent outputs.
9. **Documentation:** install/run/test, decisions, limitations, and sources up to date.
10. **Evidence:** links to code, test logs, datasets or review notes support completion claims.

For documentation-only Phase 01, implementation-dependent gates become **documented requirements for future phases**, not silently graded as fulfilled.

## 3. Nine-phase overview

| Phase | Focus | Measurable output | Dependency |
| --- | --- | --- | --- |
| 01 | Product & Scientific Foundation | PRD, scientific policy, design blueprint, roadmap | Repository initialized |
| 02 | Engineering Foundation | Reproducible frontend/backend skeleton with CI checks | 01 approved |
| 03 | Scientific Data Pipeline | Versioned, documented real FAFB sample, tests, API | 02 |
| 04 | Cosmic UI/UX | Responsive hero, optional 3D, DNA, particles, fallback | 02, 01 design |
| 05 | Interactive Brain Explorer | Verified neuron selection and graph / morphology modes | 03, 04 |
| 06 | Science Learning Academy | Five cited lessons, Mission 001 complete | 03, 04/05 as needed |
| 07 | Computational Experiment Lab | Correct algorithms and before/after model comparisons | 03, 05, 06 |
| 08 | Research Journal & Progress | Reproducible export/import and local progress | 06, 07 |
| 09 | QA, Accessibility & Deployment | Public tested demonstration and portfolio documentation | 02–08 |

**Delivery decision:** prioritize the Mission 001 complete vertical slice over decorative features outside its learning path.

## 4. Phase acceptance definitions

### Phase 01 — Product & Scientific Foundation

**Scope:** define the educational mission, initial audience, outcomes, visual direction, dataset ethics, technical decisions, and measurable MVP.

**Files:**
- `docs/product-requirements.md`
- `docs/scientific-standards.md`
- `docs/design-blueprint.md`
- `docs/roadmap.md`
- `README.md` as navigation to documentation

**Acceptance checks:**
- P01-A: an explicit user journey traverses Learn → Explore → Experiment → Explain;
- P01-B: measurable requirements with IDs and a sharply bounded MVP;
- P01-C: scientific register lists verified primary sources with DOI or official URLs;
- P01-D: definitions distinguish neuron, synapse, paired connection, pathway, and simulation;
- P01-E: FAFB v783 identified and v630 scientific-analysis distinction recorded;
- P01-F: data license, attribution, and asset-use risks documented;
- P01-G: homepage/explorer/lab UX, motion, camera, responsive states and fallback specified;
- P01-H: architecture choices and technical follow-up decisions documented;
- P01-I: all nine phases have dependencies, deliverables, explicit tests and blockers;
- P01-J: document links work in GitHub and product owner can review draft PR.

**Completion evidence:** reviewed Markdown and a draft/non-draft PR for approval; no claim of implemented features.

### Phase 02 — Engineering Foundation

**Scope:** React + TypeScript + Vite app, CSS design tokens, FastAPI entry point, typed API client, error handling, test harness, README instructions, CI.

**Acceptance checks:** reproducible `npm install`/build/typecheck/lint and Python dependency install/tests, API `/health` response, cross-origin development setup, no committed secrets, architecture explained. Capture build/test logs. Failure to set up locally = gate not passed.

### Phase 03 — Scientific Data Pipeline

**Scope:** use official FAFB v783 exports; inspect schema, build provenance manifest, create bounded directed subgraphs, add data-serving APIs.

**Acceptance checks:** checksum, source license, exact columns, key uniqueness, source/target direction, count units, threshold choices, row counts, reproducible transform and known-answer tests. No GitHub committed massive raw archive. Require manual scientific spot checks against official source. Do not switch to live scraping.

### Phase 04 — Cosmic UI/UX

**Scope:** responsive premium homepage, Three.js/R3F 3D hero or explicit illustrative fallback, decorative rotating DNA, sparse stars, accessible CTA, reduced-motion and quality settings.

**Acceptance checks:** correct controls; branded layout consistent with blueprint; static content available if WebGL fails; manual keyboard and mobile checks; measurable frame rate; no distracting nonessential motion; design source/licensing audit.

### Phase 05 — Interactive Brain Explorer

**Scope:** 3D/graph toggle as assets permit, search by real ID, neuron metadata and selected bounded neighborhoods, camera control, direction/weights legend.

**Acceptance checks:** known neuron sample produces expected IDs and edge direction; graph reflects API results; no invented labels; clear "conceptual" label where appropriate; usable keyboard alternatives; performance tested at maximum supported subgraph size. If true spatial assets are unavailable, mark morphology-specific acceptance blocked and use a properly labeled graph mode instead of fabricating a scientific scan.

### Phase 06 — Science Learning Academy

**Scope:** at least five complete lessons including Mission 001, source list, glossary, interactive demo and comprehension checks.

**Acceptance checks:** 100% of nontrivial scientific factual claims checked against a relevant source; no copied copyrighted lesson passages; questions have tested correct answers and feedback; content readable and keyboard-accessible; basic user test (five participants planned). Record misunderstandings and iterate.

### Phase 07 — Computational Experiment Lab

**Scope:** BFS, DFS, at least one structural comparison experiment and a further graph metric with clearly named thresholds/assumptions; plots and numerical tables.

**Acceptance checks:** compare with NetworkX or independently authored reference graphs, directed/disconnected/cyclic/empty graph coverage, deterministic output where applicable, baseline preserved, no biological causation overclaims, valid JSON or CSV export of parameters/results.

### Phase 08 — Research Journal & Learning Progress

**Scope:** local-first persistence of learning status and experiment records; import/export and provenance; no mandatory user account.

**Acceptance checks:** exported experiment reproduces inputs and numeric outcomes; corrupted-import handling; safe storage and no silent data loss; privacy disclosure; tested reset/delete experience.

### Phase 09 — Quality Assurance & Deployment

**Scope:** comprehensive UI/API tests, manual accessibility audit, content audit, performance profiles, security checks, and public deployment on a host selected after real compatibility/cost verification.

**Acceptance checks:** fresh deploy reproducible; core journey completes in production; no broken source links / known critical scientific mistakes; Lighthouse and accessibility outcomes reported with actual scores rather than invented scores; README/demo updated, license notices included, no secrets, deploy limitations documented.

## 5. Scoring template (per phase)

Maximum **10 points**. Allocate points only to applicable evidence; for phases without runtime functionality, score document completeness using Phase 01 criteria rather than gifting unused runtime points.

| Dimension | Max |
| --- | ---: |
| Deliverables and functional/requirements completeness | 2 |
| Scientific correctness and data provenance | 2 |
| UI/UX and instructional clarity | 2 |
| Performance/accessibility planning or implementation | 1 |
| Verification, tests and evidence | 2 |
| Documentation, maintainability and handoff | 1 |
| **Total** | **10** |

**Scoring rule:** 10/10 only if all relevant acceptance checks pass and no blockers remain. A numerical 9.5/10 with an unresolved license or factual error is **not** acceptable. Mark `Not evaluated` until evidence exists.

### Mandatory end-of-phase report

```text
Phase:
Branch / pull request:
Deliverables committed:
Source verification results:
Tests run (commands, actual outcomes):
Manual checks (device, browser, conditions):
Open issues / limitations:
Score and basis:
Gate result: PASS / FAIL / NOT YET VERIFIED
Next actions:
```

Do not substitute design intentions for executed tests.

## 6. Initial technical decisions and open decisions

### Chosen direction (subject to Phase 02 evaluation)
- React + TypeScript + Vite for frontend.
- Tailwind CSS with design tokens; semantic DOM-first UI.
- React Three Fiber + Three.js for **optional 3D scenes**, with reduced motion/static fallback.
- Cytoscape.js for interactive graph layers (bounded view).
- Python + FastAPI for API, NetworkX for graph algorithms, pytest for backend verification.
- SQLite only if persistence features need it; do not add premature authentication or distributed infrastructure.

### Explicitly unresolved
- Morphology source: exact FAFB mesh/skeleton availability, creator rights, mapping, sample asset.
- Data source implementation: Codex static download file, format, exact edge threshold and license notices.
- 3D rendering benchmarks: defined reference devices and asset polygon budget after prototype.
- Educational validation: tester recruitment and comprehension rubric.
- Production host: choose only after feature deployment needs, free-plan restrictions and cost verified.
- Exact frontend animation package: evaluate Motion alone first; only add GSAP if a real requirement warrants it.

## 7. Branching, commits, and review discipline

```text
main
├── phase/01-product-foundation
├── phase/02-engineering-foundation
├── phase/03-scientific-data
├── phase/04-cosmic-ui
├── phase/05-brain-explorer
├── phase/06-learning-academy
├── phase/07-experiment-lab
├── phase/08-research-journal
└── phase/09-qa-deployment
```

Create later branches sequentially from an approved `main` head. Do not create all branches in advance; the diagram describes proposed names, not current GitHub state.

**Review discipline:**
- commits convey one cohesive change;
- no secrets, giant binary datasets, or unlicensed artwork;
- PR descriptions identify tests, links, and remaining limitations;
- accepted documents are reflected in README;
- do not merge merely to improve the progress counter.

## 8. Program-wide definition of done

The Neuroverse MVP is complete only when a visitor can:

1. arrive on an accessible, attractive homepage with optional lightweight 3D;
2. begin a cited introductory neuroscience lesson;
3. distinguish a synthetic graph from a real FAFB v783 subgraph;
4. explore and select nodes from a bounded directed connectivity graph;
5. run a correctly tested graph traversal;
6. conduct a non-destructive node-removal comparison;
7. explain what the results do and do not establish scientifically;
8. access the full references, provenance, and licensing notice;
9. use the core experience on a small/mobile screen without motion effects;
10. find clear installation and test instructions in an open, reviewable repository.

**Any incomplete numbered item is an outstanding MVP gap** even if the visual homepage looks finished.

## 9. Current Phase 01 review checklist

| Check | Evidence | Status |
| --- | --- | --- |
| Clear product problem/personas/MVP | PRD | Documented |
| Single vertical slice with learning outcomes | PRD | Documented |
| Primary scientific sources & registry | Scientific standards | Documented |
| Legal/data distinctions & open questions | Scientific standards | Documented |
| Cosmic UI, camera, states, accessibility | Design blueprint | Documented |
| Architecture and future technical decisions | PRD + Design blueprint | Documented |
| Nine phases and measurable exit gates | This roadmap | Documented |
| README doc navigation | README | To verify |
| Real browser tests, live dataset, working app | Future phases | Not applicable to Phase 01 execution; not claimed |
| Product-owner PR review | PR | Pending |

**Phase 01 cannot be labeled fully approved before document/link review.** Its scientific source-level review is not the same as validating a downloaded dataset or a real 3D fly-brain asset.

## 10. Reference documents

- [Product Requirements](product-requirements.md)
- [Scientific Standards and Evidence](scientific-standards.md)
- [Cosmic UI/UX Blueprint](design-blueprint.md)
- FlyWire datasets / Codex: https://codex.flywire.ai/api/download
- FlyWire public release rules: https://home.flywire.ai/guidelines
- W3C accessibility guidance: https://www.w3.org/TR/WCAG22/
