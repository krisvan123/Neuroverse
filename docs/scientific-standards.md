# Neuroverse — Scientific Standards, Evidence Policy, and Data Governance

**Document ID:** NV-SCI-001  
**Version:** 1.0 · **Source review:** 2026-10-20  
**Status:** Phase 01 scientific policy; no dataset has been downloaded or independently reprocessed in this repository

## 1. Non-negotiable scientific principles

1. **Evidence precedes visual polish.** Research claims must be supported by the exact cited source, not inferred from a striking image.
2. **Connectome is structural, not functional.** Edges represent anatomically identified chemical synaptic connections; an anatomical path alone does not confirm the temporal flow of impulses or a behavior.
3. **Distinguish observation, annotation, prediction, and simulation.** E.g., predicted neurotransmitter labels are predictions; inferred circuit roles require careful wording.
4. **Separate data from design.** Decorative DNA helices, star particles, stylized hero brains, and visual signal pulses are illustrative unless explicitly mapped to real scientific records.
5. **Never invent scientific data.** Synthetic teaching graphs are legitimate only when visibly tagged "synthetic / illustrative."
6. **Keep source versions immutable in published analyses.** Snapshot, filters, transformations, and code versions must be recorded.
7. **A DOI is not proof by itself.** Verify the corresponding paper actually substantiates the exact statement, and record the supporting section.
8. **Respect intellectual property, licensing, attribution, and institutional identity.** Open access does not imply unlimited commercial or derivative-media use.

## 2. Controlled terminology

| Term | Meaning in Neuroverse | Never imply |
| --- | --- | --- |
| Neuron | Reconstructed neuron instance in a named dataset | All biological properties are known |
| Synapse | Individual identified pre-to-post chemical contact | An electrical synapse or an observed spike |
| Directed connection / edge | Aggregation of synapses from presynaptic neuron A to postsynaptic neuron B | Edge count equals individual synapse count |
| Synapse count / edge weight | Number of identified chemical synapses contributing to a neuron pair | A calibrated biological conduction delay or precise synaptic efficacy |
| Structural pathway | Directed sequence of anatomically connected neurons | Confirmed physiological signaling route |
| Subgraph | Explicit subset of neurons and their retained edges | Complete network of every neuron shown or of the whole brain |
| Brain region / neuropil | Anatomical annotation in source taxonomy | Definitive claim about a behavior solely from location |
| 3D morphology | Spatial reconstruction associated with documented neuron identifiers | Full functional simulation |
| Simulation | Output from a defined mathematical algorithm with assumptions | Direct experimental observation |
| Artistic hero brain | Non-scientific, explicitly identified conceptual visual | Actual FlyWire proofread mesh |

**Directed shortest path caveat:** minimum hop count is a graph-theoretic measure, not necessarily fastest or dominant biological signal propagation. A thresholded graph is a different network from the unfiltered connectome.

## 3. Source hierarchy and reliability checks

**Tier 1: primary research** (for original methods, numbers, and findings). Prefer a peer-reviewed article; verify DOI, title, date, figure/methodology, study subject, and limitations.

**Tier 2: official data portal / project documentation** (for dataset identifier, export format, license, schema, snapshot). Record date accessed. Portal statistics can differ from a paper due to threshold choices, versions, and definitions.

**Tier 3: established educational references** (e.g., OpenStax) for introductory concepts.

**Tier 4: review papers** for synthesis and scientific context. Avoid using editorial summaries as sole evidence for unique numeric claims.

**Social posts, generative model output, concept-art prompts, and uncited blogs** are not acceptable evidence for neuroscience findings.

### Verification procedure for each factual claim

1. Write one atomic, falsifiable statement.
2. Classify it as established observation, annotation, prediction, model result, interpretation, or illustrative text.
3. Open the underlying primary source / official data reference.
4. Locate and document its specific section, figure, table, or dataset field.
5. Check population/species, version, counting definition, thresholds, and caveats.
6. Rewrite at the appropriate level of certainty; attach persistent DOI/URL.
7. Review text in context so illustrations, captions, and interactive labels do not overclaim.
8. Record evidence status and date; re-review when dataset/lesson changes.

**Allowed statuses:** VERIFIED_SOURCE, VALIDATED_DATA, PENDING_CHECK, CONTESTED, SUPERSEDED. VERIFIED_SOURCE means a relevant source was checked; VALIDATED_DATA requires inspecting the actual data or rerunning an analysis.

## 4. Initial source register (verified sources, not verified data pipeline)

| Source ID | Author / resource | Appropriate use | Link | Review |
| --- | --- | --- | --- | --- |
| S-001 | Dorkenwald et al., 2024, *Neuronal wiring diagram of an adult brain*, Nature | Brain reconstruction and synapse counts; chemical-synapse scope | https://doi.org/10.1038/s41586-024-07558-y | Source reviewed 2026-10-20 |
| S-002 | Lin et al., 2024, *Network statistics of the whole-brain connectome of Drosophila*, Nature | Network statistics and rich-club descriptions; note its **v630** analysis dataset | https://doi.org/10.1038/s41586-024-07968-y | Source reviewed 2026-10-20 |
| S-003 | FlyWire Codex public dataset portal | FAFB v783 dataset identity, portal neuron and connection statistics | https://codex.flywire.ai/api/download | Portal reviewed 2026-10-20 |
| S-004 | FlyWire Codex FAQ | Static-download guidance, snapshot selection, paths and connection definitions | https://codex.flywire.ai/faq | Portal reviewed 2026-10-20 |
| S-005 | FlyWire citation and public release guidelines | Public data release, license and attribution rules | https://home.flywire.ai/guidelines | Guidelines reviewed 2026-10-20 |
| S-006 | OpenStax, *Anatomy and Physiology*, 12.5 Communication Between Neurons | Introductory mechanisms and foundational terminology | https://openstax.org/books/anatomy-and-physiology/pages/12-5-communication-between-neurons | Text reviewed 2026-10-20 |
| S-007 | W3C, Understanding WCAG 2.2 SC 2.3.3 | Optional motion and accessibility design | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions | Guidance reviewed 2026-10-20 |

**Scope caution:** S-002 analyses were explicitly performed on the **v630** snapshot (127,978 neurons, 2,613,129 thresholded connections in that paper). Do not attribute these analysis results to FAFB **v783** without independent replication.

## 5. Initial scientific claims ledger

| Claim ID | Proposed learner-facing claim | Evidence | Status / exact support |
| --- | --- | --- | --- |
| NV-C001 | The published adult female *D. melanogaster* brain reconstruction contains **139,255 proofread neurons**. | S-001 | VERIFIED_SOURCE — abstract and whole-brain description |
| NV-C002 | This reconstruction comprises approximately **54.5 million identified chemical synapses between reconstructed neurons**. | S-001 | VERIFIED_SOURCE — main text, synapses/connectome discussion |
| NV-C003 | Codex labels FAFB snapshot **v783** as **139,255 neurons** and **3,732,460 connections**. | S-003 | VERIFIED_SOURCE — FAFB dataset tile; connection definition and filters must be specified if reused in analysis |
| NV-C004 | An edge from A to B can summarize multiple chemical synapses; **edges and synapses are different units**. | S-001 | VERIFIED_SOURCE — "Synapses and connections" section |
| NV-C005 | FlyWire's published connectome described in S-001 includes chemical synapses and does not represent electrical synapses comprehensively. | S-001 | VERIFIED_SOURCE — "Synapses and connections" section |
| NV-C006 | FlyWire public-release data are under **CC BY-NC 4.0** and the named FAFB release is snapshot 783 (October 2023). | S-005 | VERIFIED_SOURCE — public release guidelines |
| NV-C007 | The network statistics paper analyzed **v630**, rather than the v783 portal release. | S-002 | VERIFIED_SOURCE — Methods: Dataset |
| NV-C008 | Graded postsynaptic potentials can influence whether a neuron fires an action potential. | S-006 | VERIFIED_SOURCE — Communication Between Neurons section |
| NV-C009 | An identified directed graph path represents a structural route, **not** confirmation of signal transmission or behavior. | S-001, S-002 | SCIENTIFIC INTERPRETATION — conservative methodological distinction; include as limitation |
| NV-C010 | A 3D asset can be mapped accurately to FAFB root IDs in our implementation. | No asset/schema yet | PENDING_CHECK — do not publish as a feature claim |

**Do not label an imported CSV "VALIDATED_DATA" until its dataset checksum, schema, row counts, thresholds, and transformation tests are actually completed.**

## 6. Dataset governance and provenance

**Selected starting source:** FlyWire FAFB, **v783**, adult female fruit fly brain. Project data source: official Codex static exports and linked canonical archives, not high-volume live scraping.

At Phase 03, the data pipeline must generate a manifest with:
- dataset name, scope, owner, snapshot/version, canonical landing page;
- download URL, retrieval date, usage terms/license, attribution statement;
- archive filename, cryptographic SHA-256 checksum and original size;
- observed columns, data types, primary keys, missing-value rules;
- filtering thresholds (minimum synapses per connection, included classes/regions);
- deduplication and directionality policy, sampling/subgraph selection method;
- records in/out, transformation code version, checksums of derived data;
- known omissions (e.g., selected subgraph excludes neighbors outside the selection);
- any neuron ID mapping metadata for 3D structure data.

**Graph model:** use directed adjacency. Document whether multiple source records per pair are aggregated and how counts are summed. Do not equate synapse count with conduction strength unless specifically modeling it as an explicit proxy/assumption.

**Selection requirements:** keep a small complete fixture for algorithm tests, then a separately labeled biological subset. Do not choose a threshold solely because the visualization looks attractive. Compare sensitivity across plausible cutoffs and report them.

**3D morphology gate:** use spatial assets only after checking source ID mappings, download technique, license/attribution, data format, rendering budget and any annotations necessary to orient the user. A stylized brain is an acceptable standalone homepage illustration if clearly labeled.

## 7. Educational scientific-content contract

Each lesson must provide:
- 2–5 observable learning objectives;
- prerequisite concepts and a plain-language vocabulary layer;
- references adjacent to nontrivial factual statements;
- an interactive model with its assumptions written visibly;
- a "What we know / What we model / What we cannot conclude" summary;
- at least one assessment with feedback and rationale;
- last reviewed date and accessible full source list.

**Example correction:**
- ❌ "Removing this neuron makes the fly lose its vision."
- ✅ "Removing this node from our selected directed graph alters the reachable connections. Whether removal of that biological neuron affects vision would require additional physiological or behavioral evidence."

**Example correction:**
- ❌ "Watch real electrical signals travel along these connections."
- ✅ "Watch a conceptual traversal animation over connections from a structural dataset."

## 8. Simulation and experiment boundaries

MVP graph experiments are **mathematical manipulations**, not wet-lab experiments and not evidence of causal biological effects.

All experiments must:
1. Define the manipulated variable, fixed settings, outputs, and comparison baseline.
2. Preserve and display the original dataset and non-destructive working copy.
3. Make graph direction, threshold and selection visible.
4. Display a "simulation/model result" indicator during animated output.
5. Show accessible numeric results in addition to animation.
6. Save/export exact parameters and algorithm version for repetition.
7. Give a plain-language limitation explaining which biological claims are unsupported.

Advanced neuron dynamics, if pursued, require a distinct model and explicit assumptions; no auto-conversion of anatomical connection counts to "real firing activity."

## 9. Ethics, licenses, and attribution

- **FlyWire data:** CC BY-NC 4.0 per S-005; attribute original project and applicable research authors; include license and changes in distributed exports. Do not presume commercial reuse permission.
- **Research articles and images:** check media-specific rights separately; a paper's availability does not necessarily permit modifying figures and redistributing them.
- **Decorative models:** maintain an asset inventory including author, license, provenance, and whether AI-generated or original. Do not pass artistic reconstructions off as experimental observations.
- **Independent identity:** state "Neuroverse is an independent educational project and is not endorsed by FlyWire, Princeton University, or Nature."
- **Privacy:** do not ask students for medical history; no need to collect identifiable learner data for MVP.

## 10. Audit and stop conditions

**Automatic release blockers:**
- unreferenced numeric factual claim;
- citation points to irrelevant or contradictory source;
- data version or connection units missing in a published dataset metric;
- unlicensed image/mesh used as production asset;
- model result described as observed neuronal activity or verified behavior;
- synthetic example presented as real FlyWire data.

**Phase 01 evidence check:**
- [x] Primary papers and official portal/guidelines reviewed
- [x] Dataset and numeric-unit distinctions recorded
- [x] Scientific claims ledger created
- [x] Licensing and provenance requirements explicit
- [ ] Downloaded data inspected (Phase 03)
- [ ] Actual mesh asset verified (Phase 05)
- [ ] Lesson-by-lesson peer/content review (Phase 06)

## 11. Open scientific questions tracked for later phases

- Which precise Codex export files and columns should we use for the MVP subgraph?
- Which threshold and subgraph sampling approach best support introductory learning without misrepresenting connectivity?
- Which public morphology assets have stable identifiers and compatible reuse licenses?
- Which basic biology learning materials can be linked rather than copied into the app?
- How do findings vary across snapshots, segmentation revisions, and synapse count thresholds?

These questions must remain open until supported by real data inspection.

## Expanded Academy source register — Phase 06 (2026-10-20)

The five original lessons map every substantive explanatory section and quiz answer to source IDs. Direct links and exact relevant sections are presented in the Academy UI. The text is original educational paraphrase; no copyrighted images or textbook chapters are republished.

| Source | Supporting section | Permitted lesson use |
| --- | --- | --- |
| [S-008 OpenStax 12.2 Nervous Tissue](https://openstax.org/books/anatomy-and-physiology-2e/pages/12-2-nervous-tissue) | Neurons: soma, dendrites, axon | Foundational cell anatomy and variation |
| [S-009 OpenStax 12.5 Communication Between Neurons](https://openstax.org/books/anatomy-and-physiology-2e/pages/12-5-communication-between-neurons) | Synapses; neurotransmitter release | Chemical synapse pre/post, receptors and neurotransmitters |
| [S-010 NetworkX Traversal reference](https://networkx.org/documentation/stable/reference/algorithms/traversal.html) | Breadth First Search: bfs_edges and bfs_layers | Mathematical graph traversal and reachable nodes, not biological firing |

S-001 Dorkenwald et al. Nature 2024 and S-004 official FlyWire Codex FAQ remain in the earlier source ledger, supporting data scope, neuron/synapse counts, FAFB v783 and directed synaptic connection conventions. The interactive graph A–F is an original **synthetic** example, never presented as a FlyWire source graph. A five-participant learner pilot and manual audit are separate from passing software tests.
