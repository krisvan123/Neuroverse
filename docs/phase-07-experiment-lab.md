# Phase 07 — Computational Experiment Lab: mathematical methods and QA

**Scope:** bounded deterministic directed graph computations, a synthetic offline example and an optional authentic user-imported FAFB v783 selected neighborhood. **Status:** Engineering PASS — merged in PR #13; physical-device and human usability audit still outstanding. **Phase 08:** not started.

## Delivered interactions

- Choose BFS or DFS, an included start node, a retained-edge weight threshold and an optional model node to remove. Step through an accessible queue or DFS stack with a processed order.
- Baseline is never mutated. The modified scenario contains every remaining selected node and only those directed edges not touching the removed node. A removed start node yields zero reachable nodes.
- Compute directed edge count, included nodes, retained edge weight sum, reachable nodes including the start, mean out-degree, starting node out-degree and loop-excluded directed density.
- Show a plotted circle-layout graph (maximum 18 displayed nodes, abstract coordinates), a before/after bar chart, an accessible complete numerical table and retained edge list. Metrics apply to the entire bounded graph, not just plotted preview nodes.
- Download deterministic JSON and CSV containing all bounded selected vertices, original edges, full source metadata, threshold, algorithm, seed, model deletion, baseline/modified metrics, visitation orders and scientific limitations. Nothing is silently persisted on a server or in localStorage.
- Default dataset is a labeled A–G SYNTHETIC teaching model with a cycle and disconnected node. Genuine FAFB mode loads only after a real local v783 CSV database has been configured in FastAPI: no fake fallback, scraping, user tokens, third-party payment or uploaded secrets.

## Exact mathematics and interpretation

Given selected directed vertices V and source-to-target pairs E filtered to weight >= minimumWeight, traversal follows outgoing edges in ascending node-ID order. For long FAFB IDs, comparisons use integer precision, never lossy floating point. At most 80 vertices and 250 edges enter the browser engine; the real FAFB API request is capped at 60 vertices / 160 edges.

| Measure | Equation and convention |
| --- | --- |
| BFS | First-in-first-out queue, mark each unique target discovered when enqueued |
| DFS | Directed recursive depth-first preorder; frontier represents call stack |
| Reachability | Number of unique visited nodes from the selected start, counting start when present |
| Mean out-degree | Number of retained directed edges / number of included nodes, or zero for empty graph |
| Directed density | (directed edges minus self-loops) / (V × (V−1)) for V>1, otherwise zero |
| Start out-degree | Number of retained outward directed edges, including a self-loop if present |
| Retained weight sum | Sum of retained pair weights: identified synapse counts for a real imported subset, invented scalar weights for the synthetic graph |
| Structural delta | Baseline visited-node set minus modified visited-node set; separately identify surviving nodes newly unreachable due to removal |

Graph-reachability paths and deletion of a node in a mathematical model do not establish observed action potentials, damage to neurons, cognitive or behavioral effects, or causal circuit functioning. Circle-layout coordinates and color have no anatomical meaning.

### Original FAFB import and scope

FAFB local-connectome users must first follow the scientific data pipeline guide, import a user-supplied authentic v783 export, and configure NEUROVERSE_DATASET_DB. The API selects a bounded neighborhood with direction presynaptic-to-postsynaptic; local importer thresholds and neighborhood sampling may already have discarded edges. Increasing or decreasing the Lab threshold can only filter the *already retained* edges, never restore missing edges. The imported-source SHA-256 proves consistency relative to the user-supplied file, not independently authenticated official provenance. Root IDs are stored as strings to preserve 64-bit precision. Source-supplied rights such as FlyWire CC BY-NC terms still apply.

## Reproducing exports

1. Use The Lab navigation link, select source, algorithm, start, threshold and model-removal parameter.
2. Download JSON or CSV. The JSON schema is neuroverse-lab/v1 and includes a sorted original graph, all parameters, both calculated scenarios and limitations.
3. CSV contains typed rows for graph vertices/edges, metadata, settings, metrics and visit order; spreadsheet-sensitive metadata cells are escaped. The CSV and JSON allow an independent analyst to recreate the results. Full schema-validated import/storage is deferred to Phase 08.
4. The source graph is never edited by an experiment and remains available if the visitor changes settings.

## Independent verification

- TypeScript lab tests use seven known-answer fixtures covering directed edges, disconnected nodes, a directed cycle, self-loop, thresholds, removal of the starting node, numeric root-ID sorting, and an empty synthetic graph; malformed and overly large inputs are rejected.
- Python backend tests read exactly the same reference fixture JSON and independently reconstruct/traverse each case with NetworkX, comparing BFS/DFS visit order and directed graph metrics (not importing the TypeScript implementation).
- Chromium desktop and mobile browser tests exercise actual BFS/DFS interactions, metrics, original/modified graphs, downloads and parsed JSON/CSV contents, an unavailable scientific dataset state, and a MOCKED API contract for loaded real-subgraph UI. Mocked test records do not independently establish any official FlyWire science results.
- Human Windows GPU and usability audits remain separate from green software tests. Phase 06 five-person learning pilot has not been performed by the assistant.

## Gate ledger

| Gate | Evidence | Status |
| --- | --- | --- |
| P07-A BFS/DFS and deterministic directed behavior | Reference cases and independent NetworkX tests | PASS — run 39417517774 |
| P07-B Reversible baseline/model removal and metrics | Unit tests plus full UI comparison | PASS — run 39417517774 |
| P07-C Graph, plot, numerical table and accessibility | Browser desktop/mobile interaction and overflow checks | PASS — run 39417517774 |
| P07-D Full valid JSON/CSV export and safeguards | Download tests with parameter/source inspection | PASS — run 39417517774 |
| P07-E No fake FAFB fallback, accurate provenance/snapshot | Type-level adapter validation and simulated API browser tests | PASS — run 39417517774 |
| P07-F Physical-device performance and user sign-off | Actual laptop/manual usability check | Not verified |

**Phase 08 (Research Journal and Progress) and Phase 09 (production deployment and QA) are NOT started.**

## Final engineering acceptance — 2026-10-20

- [Phase 07 Pull Request #13](https://github.com/krisvan123/Neuroverse/pull/13) was merged to main as commit ec47ffcfe94ad41bcbf20566661520d1928c9221.
- [GitHub Actions run 39417517774](https://github.com/krisvan123/Neuroverse/actions/runs/39417517774) completed successfully: **6/6 jobs passed** (frontend TypeScript/lint/unit/build, backend tests including independent NetworkX, full-stack HTTP integration, verified FAFB root IDs, authentic mesh/skeleton provenance, and browser).
- **56/56 desktop/mobile Chromium checks passed**. Tests exercise actual controls, directed BFS/DFS, non-destructive node comparison, threshold filtering, JSON and CSV browser downloads inspected as content, missing-dataset error states, and the source-labeled FAFB adapter using an explicitly **mocked browser fixture** rather than an invented official graph.
- The original FAFB source-mesh hash checks and science Academy tests from preceding phases continue to pass.

**Scope caveats:** Real FAFB connection data are **not bundled**. The user must separately import an official v783 connectivity export before the real-data Lab can calculate. Passing a mocked API-browser test does **not** prove an upstream FAFB CSV has been downloaded or independently authenticated. Hardware-specific FPS benchmarking, manual accessibility audit, user visual acceptance, and the earlier five-person learning pilot remain **not verified**; their absence is not masked by a passing CI suite. Phase 08/09 are not started.
