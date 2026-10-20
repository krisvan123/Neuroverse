# Neuroverse — Product Requirements Document (PRD)

**Document ID:** NV-PRD-001  
**Version:** 1.0 (Phase 01 design baseline)  
**Review date:** 2026-10-20  
**Status:** Proposed for review; no product functionality implemented

## 1. Executive summary

**Neuroverse** is an interactive educational web application that connects introductory neuroscience to computer science through guided lessons, attributed real connectome data, and reproducible graph experiments. Its signature **Cosmic Neuroscience** aesthetic uses a three-dimensional fruit-fly-brain presentation, subtle moving DNA helices, and particle depth to invite exploration without compromising legibility or scientific integrity.

**Tagline:** *Explore the Brain. Discover the Science. Experiment with Intelligence.*

Neuroverse is **not** an artificial conscious brain, a medical diagnostic service, or a complete physiological simulator. A connectome reveals anatomical connectivity; it does not, by itself, establish physiological signal transmission or behavior.

## 2. Audience, jobs to be done, and needs

| Audience | Primary goal | Failure to avoid |
| --- | --- | --- |
| Curious beginner | Understand neurons, synapses, and networks without prerequisites | Scientific jargon without a learning path |
| Computer science student | Connect graph algorithms to real biological datasets | Visually impressive but algorithmically trivial demo |
| STEM educator | Demonstrate a claim using an inspectable source and experiment | Uncited facts or misleading demonstrations |
| Portfolio evaluator | Inspect decisions, implementations, tests, and reproducibility | Unverifiable claims or undocumented code |

**Primary persona:** a motivated beginner comfortable using a browser, but unfamiliar with connectomics. Assume no 3D navigation experience.

## 3. Product positioning and differentiation

FlyWire Codex already supports professional data search, 3D neuron viewing, network graphs, and pathway exploration, while FlyWire Academy supplies learning content (https://codex.flywire.ai/). Neuroverse will **not** claim to invent these capabilities. Its unique angle is an integrated **Learn → Explore → Experiment → Explain** workflow with beginner guidance, graph algorithms shown step by step, explicit limits of inference, and an exportable experiment record.

**Core hypothesis (to test; not an established fact):** a single, guided educational workflow will help first-time visitors explain one neuroscience-to-CS concept more clearly than an unstructured visualization.

## 4. User journeys

### Journey A: first-time learner (MVP critical path)

1. Open the homepage. Text and controls render before optional 3D assets.
2. Choose **Start Learning**; begin "Mission 001 — The Hidden Connections."
3. Inspect an accessible neuron diagram; identify neuron, synapse, node, and directed edge.
4. View a small synthetic **teaching graph** explicitly labeled as synthetic.
5. Switch to a bounded **real FlyWire subgraph** with dataset version and source shown.
6. Select a neuron; inspect inbound/outbound neighbors and synapse-count-derived edge metadata.
7. Run a step-by-step BFS on a directed graph.
8. Perform a model-only node-removal test; compare reachability before and after.
9. Answer a short reflection: what did the graph show, and what does it **not** prove about neural activity?
10. Optionally export the experimental configuration as JSON.

**MVP success:** a tester with no prior connectomics experience can complete the workflow independently and accurately distinguish anatomical connectivity from confirmed physiological activity.

### Journey B: exploratory student

1. Open Explorer; search by supported neuron identifier.
2. Select one neuron, request a bounded neighborhood, change graph filters.
3. Inspect the data version, evidence legend, and transformation rules.
4. Run a supported graph computation and review inputs/results.

### Journey C: mobile / reduced-motion user

1. Receive a static or limited-motion hero without loss of meaning.
2. Use searchable lists and buttons instead of requiring 3D gestures.
3. Navigate learning content and run the same algorithmic exercises.

## 5. Scope and requirement identifiers

### 5.1 MVP — must ship

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| FR-01 | Homepage communicates the product's purpose | Clear heading, explanation, Learn and Explore entry points |
| FR-02 | Cosmic hero offers a 3D visual or static fallback | No essential task depends on animation; model clearly labeled illustrative or data-driven |
| FR-03 | At least one accessible science lesson | Complete lesson has objectives, sourced facts, interaction, comprehension check |
| FR-04 | Synthetic teaching graph | Provenance label "Synthetic teaching example"; deterministic node/edge set |
| FR-05 | Real FlyWire FAFB v783 subgraph | Source, dataset version, transformation method, and license recorded |
| FR-06 | Search and neuron details | Exact-ID lookup and safe missing-result state on supported subset |
| FR-07 | Directed graph visualization | Zoom, pan, node selection, directional legend; bounded rendering |
| FR-08 | BFS visualizer | Step forward/reset; same visited/path results as reference algorithm |
| FR-09 | Node removal comparison | Original graph preserved; reproducible before/after metrics |
| FR-10 | Science provenance | Lesson citations and data/illustration labels visible in UI |
| FR-11 | Responsive and accessible core flow | Keyboard-completable without relying on 3D gestures |
| FR-12 | Tested and documented setup | Build, lint/typecheck, backend tests, and clear local run instructions |

### 5.2 Post-MVP — do not block first usable release

- Detailed scientific 3D morphology explorer, contingent on obtaining a properly licensed/attributed spatial asset and reliable neuron-ID mapping.
- DFS, centrality, shortest paths, and graph metrics beyond basic reachability.
- Expanded curriculum and linked lessons.
- Model-based neural activity simulation with explicit simplifying assumptions.
- Saved local research journal and learning progress; export/import.
- Account sync, collaboration, multi-dataset search, advanced GPU/large-graph optimization.

**Strict non-goals for MVP:** full-neuron simultaneous rendering, whole-brain functional emulation, AI chat tutor, user login, cloud synchronization, mobile-native app, physiological predictions, clinical/medical claims, and live scraping of Codex.

## 6. Content model

A learning unit includes: `id`, `title`, `level`, `learningObjectives[]`, `prerequisites[]`, `concepts[]`, `interactiveSteps[]`, `assessment[]`, `sourceIds[]`, `lastReviewed`, and `limitations[]`.

A scientific claim includes: claim text, type (observation/inference/model/decorative), identifier, source IDs and exact supporting section, dataset snapshot if relevant, verification date, reviewer/check method, and status (verified/pending/disputed/withdrawn).

An experiment includes: `experimentId`, `datasetId`, `snapshotVersion`, `subgraphSelection`, `graphDirection`, `threshold`, `algorithmVersion`, `parameters`, `result`, `hypothesis`, and `limitations`. A deterministic seed is required where applicable.

## 7. Functional design / pages

1. **Home** — cinematic introduction, prominent accessible navigation, science-versus-art disclosure.
2. **Learn** — track cards, lesson stages, scientific citations, quizzes.
3. **Explorer** — split view: navigation/search, brain/graph visualization, information panel.
4. **Lab** — graph experiment controls and before/after outcomes.
5. **Methods & Sources** — dataset versions, provenance, license, definitions, scientific claims, and limitations.

**Explicit empty/error states:** missing neuron, unsupported neuron ID, no outgoing connections in selected subset, dataset unavailable, offline, WebGL unavailable, too many nodes, invalid parameters, analysis failure.

## 8. Non-functional requirements (testable targets, not performance claims)

- **Accessibility:** target WCAG 2.2 AA for applicable requirements; enhanced non-essential interaction-motion control per 2.3.3; visible focus and text alternatives. Audit with both automated and manual tests.
- **Performance:** content and navigation before 3D; test target of 60 FPS on nominated desktop fixture in balanced mode and 30 FPS in a low-power fallback; these are *future benchmarks*, not verified results.
- **Resource bounds:** API returns a capped subgraph (initial engineering target 300 nodes / 1,000 edges, tune using benchmarks); long computations must be bounded and cancellable.
- **Security:** validate all API inputs, prevent arbitrary remote fetch by user parameters, avoid exposed credentials, enforce request limits and safe error messages.
- **Privacy:** no user accounts, analytics tracking, or collection of sensitive information in MVP. Browser-only draft progress may be added with disclosure.
- **Reproducibility:** data snapshot and transformation version pinned; tests contain known-answer small graphs; experiment exports preserve parameters.
- **Reliability:** frontend remains educationally usable if WebGL fails; no scientific claim is created from raw animation.

## 9. Example learning outcome and test

**Mission 001:** "The Hidden Connections"

On completion, a learner should be able to:
- name the basic parts of a neuron and the role of chemical synapses;
- identify source/target in a **directed** structural connectome edge;
- use BFS to traverse a simple graph and explain its result;
- compare connectivity metrics before/after a modeled node deletion;
- distinguish a **structural pathway** from experimentally observed activity.

Evaluation: short multi-step tasks and a reflection graded against a transparent answer rubric. Don't infer educational effectiveness without testing actual users.

## 10. Measuring success

**Product instrumentation (privacy-preserving, first through local/manual testing):**
- Participants completing Mission 001 without intervention (target: >= 4/5 in initial usability pilot).
- Participants correctly explaining connection-versus-signal distinction (target: >= 4/5).
- Number of critical interaction failures (target: 0).
- Correctness of BFS results on test fixtures (target: 100%).
- Scientific source coverage for published factual claims (target: 100%).
- Accessibility blocking defects in core learning flow (target: 0).

These are **goals for evaluation**, not outcomes already measured.

## 11. Project risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Heavy 3D scene crowds out learning | Static-first content, motion preference, adaptive rendering |
| Real neuron morphology not licensed/available in usable form | Label the hero as conceptual; hold data-driven 3D until verified |
| Connection table misrepresented as synapses | Explicitly distinguish pairwise connections from individual chemical synapses |
| Paper finding presented as direct causal proof | Source-to-claim checks and limitation callouts |
| Huge dataset overwhelms browser/backend | Offline static preprocessing, bounded requests, pagination/sampling |
| Scope creep stalls completion | MVP/Phase 2 gate: Mission 001 end-to-end before expansions |
| Learners assume institutional endorsement | Clear independent-project disclaimer |

## 12. Dependencies and decision log

- Stack baseline: React + TypeScript + Vite; Three.js/React Three Fiber; Python + FastAPI + NetworkX; SQLite only if persistence is needed. Libraries remain to be tested in Phase 02.
- Data baseline: public FlyWire FAFB **v783**; initial download format and schema must be inspected in Phase 03.
- Canonical docs: [Scientific Standards](scientific-standards.md), [Design Blueprint](design-blueprint.md), and [Roadmap](roadmap.md).
- No privileged FlyWire service access is required for learning MVP; follow published static download and license instructions.

## 13. Definition of done for this PRD

- [x] Audience and problem clearly bounded
- [x] Critical end-to-end learning journey specified
- [x] MVP differentiated from non-goals and future enhancements
- [x] Requirements have observable acceptance criteria
- [x] Scientific risk and accessibility requirements defined
- [ ] Tested with target users (deferred to implementation/usability phase)
- [ ] Product owner review and PR approval

**Important:** the checked items indicate document coverage, not implemented functionality.
