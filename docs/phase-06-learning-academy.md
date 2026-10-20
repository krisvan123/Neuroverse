# Phase 06 — Science Learning Academy: scientific evidence and acceptance

**Deliverable:** Mission 001 — The Hidden Connections. **Reference review:** 2026-10-20. **FAFB context:** snapshot v783. **Phase 07:** not started.

## 1. Actual feature scope

The academy has five complete original beginner chapters, a fourteen-term cited glossary, ten assessed questions with explanatory feedback, and an accessible graph-literacy exercise. No login, analytics, mandatory dataset download or graphical GPU is needed. Quiz progress lives in React state only, not localStorage or a service. Reload resets progress.

| Chapter | Learning objective | Evidence | Assessment |
| --- | --- | --- | --- |
| 01 Meet the neuron | Soma, dendrite, axon vs nodes | S-008 and S-001 | q01–q02 |
| 02 How chemical synapses work | Pre/post roles, neurotransmitters, signal caution | S-009 and S-001 | q03–q04 |
| 03 Read a connectome | Snapshot, direction, synapse count vs edge | S-001 and S-004 | q05–q06 |
| 04 Walk a directed network | Orientation, FIFO BFS, reversible model deletion | S-004 and S-010 | q07–q08 |
| 05 What a wiring diagram cannot prove | Structural path is not electrical activity or behavior | S-001, S-004, S-010 | q09–q10 |

**Completion contract:** the ten quiz answers must each be marked correct, and the student must finish the original A–F BFS traversal and inspect the comparison after deleting model node D. Wrong answers give an explanation and another attempt. It is only practice, not evidence of general educational competence.

## 2. Claim-to-source verification ledger

| ID | Atomic scientific fact or model statement | Supporting section | Important limitation |
| --- | --- | --- | --- |
| P06-C01 | Soma, dendrites and axon are useful introductory parts of neurons | S-008, OpenStax Anatomy & Physiology 2e §12.2, Neurons | Biological morphologies vary |
| P06-C02 | Chemical synapses use presynaptic release across a cleft and postsynaptic receptors | S-009, OpenStax §12.5, Synapses and Neurotransmitter Release | Not all synapses are chemical |
| P06-C03 | Published adult female fruit-fly wiring reconstruction reports 139,255 neurons and about 54.5 million chemical synapses | S-001, Dorkenwald et al. Nature 2024 abstract | Publication-wide statistics, NOT browser lesson counts |
| P06-C04 | Codex supports FAFB v783 and directed pre-to-post pair connectivity with a threshold | S-004, Codex FAQ datasets and pairwise connectivity; FAFB default 5+ | Version and filtering conventions are dataset-specific |
| P06-C05 | A pairwise directed edge may aggregate several distinct synapses | S-004, Codex FAQ How is connectivity determined? | Synapse totals and directed pair counts differ |
| P06-C06 | BFS explores nodes in layers under graph edge direction | S-010, NetworkX traversal reference Breadth First Search | Algorithm, not a neuronal time simulation |
| P06-C07 | A structural graph path alone cannot prove live signaling or behavioral causality | S-001 Nature methods / discussion and S-004 Codex semantics | Cautious methodological inference |
| P06-C08 | Deleting D removes E reachability from A in our invented graph | Authored A–F edges, independently checked by graphDemo.test.ts | Purely synthetic math, not biology |

All source IDs are checked for validity in content.test.ts; every lesson section carries at least one source link and every quiz has an explanation and evidence IDs. The manuscript is original paraphrase. This mechanical coverage check is **not** a substitute for independent human source accuracy review.

## 3. Teaching graph and science boundaries

The teaching edges are A→B, A→C, B→D, B→F, C→D, D→E. A directed FIFO BFS visits A, B, C, D, F, E. With mathematical node D removed, the visited set is A, B, C, F; E remains in the model but becomes unreachable. The original immutable edge list is not mutated. Deterministic steps, empty/reversed edge cases, and model deletion are covered by unit tests.

All visual and textual labels say SYNTHETIC TEACHING EXAMPLE, not FlyWire. Real FAFB connectivity remains a separate versioned graph available only when the user imports an official local dataset to the Explorer. Full-source network algorithms, physiological effects, and actual intervention experiments are not delivered here; those belong to future separate phases.

## 4. Accessibility and reproducibility

Chapters are ordinary labeled buttons in a navigation landmark. Quizzes are native fieldset/legend and labeled radio controls, with keyboard-compatible answer checking, feedback status and non-color-only messaging. Graph steps and before/after reachability are printed as readable text alongside SVG. The source panel and glossary remain readable without 3D/WebGL, animations or FastAPI. Responsive CSS should avoid horizontal overflow. No visitor data or personal responses leave the browser.

## 5. Acceptance gate

| Requirement | Evidence | Status |
| --- | --- | --- |
| P06-A Five full science lessons | Content source and completeness unit checks | Awaiting final GitHub CI |
| P06-B Every factual section source-mapped | Claim ledger and visible per-section source IDs | Source review recorded; external peer review not conducted |
| P06-C Ten checked questions and meaningful feedback | Content tests and complete browser lesson path | Awaiting final GitHub CI |
| P06-D BFS/model deletion is valid, deterministic and unmistakably synthetic | Known-answer unit tests and real browser graph interaction | Awaiting final GitHub CI |
| P06-E Accessible and mobile/offline paths | Chromium desktop/mobile and no-backend flow | Awaiting final GitHub CI |
| P06-F Five-participant novice user pilot | Goal: at least 4/5 finish independently and 4/5 distinguish wiring from observed activity | NOT VERIFIED — must be completed with actual people |
| P06-G Owner visual sign-off on Windows device | Review of latest screenshots and interactions | NOT VERIFIED — user feedback needed |

Passing software checks confirms correct implementations of the tested behavior. It does NOT establish human learning effectiveness or certify medical/neuroscience knowledge. Record anonymous usability observations only with participants' consent and revise confusing explanations after the pilot.

## 6. How to try the Academy

Run the local frontend in its folder with npm run dev, then visit http://localhost:5173/#academy. Read any chapter, answer two questions and try a wrong answer. In chapter 04 step through all six original BFS node visits and click Compare; view the D-removed model. After all ten correct answers and comparison, the mission completion message appears for the session. Reload clears it by design. Do not confuse this exercise with the future Phase 07 full graph experiment lab.

**Deferred:** saved progress to Phase 08; user-run five-person pilot and manual accessibility audit to Phase 06 sign-off/Phase 09; full graph lab to Phase 07.
