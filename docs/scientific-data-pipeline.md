# Neuroverse — Scientific Data Pipeline Specification and Operating Guide

**Document ID:** NV-DATA-003 · **Snapshot target:** FAFB v783 · **Scope:** Phase 03

## 1. Data provenance and scientific semantics

Neuroverse ingests local CSV/CSV.gz **supplied by the developer** and creates a strictly bounded, read-only SQLite dataset. This release does not download the source automatically and does not include a real-data sample by default.

**Source:** Princeton FlyWire Codex official download portal, https://codex.flywire.ai/api/download?dataset=fafb. The underlying FAFB v783 adult female Drosophila dataset contains 139,255 proofread neurons; portal displays 3,732,460 thresholded pairwise connections. These **portal-level** counts are not counts produced by the Neuroverse importer and **do not describe the small selected sample**.

**Canonical archival option:** FlyWire Consortium (2024), Zenodo record 10676866: https://doi.org/10.5281/zenodo.10676866. Its `proofread_connections_783.feather` archive is ~852 MB and **requires a separate Feather-to-CSV conversion**; this importer does not claim to support Feather directly.

**Important:** The portal documentation states its programmatic download route may require a Codex account token. Neuroverse never accepts that token as a frontend parameter, does not need you to share it, and does not scrape the live Codex application.

**License:** FlyWire public-release data are CC BY-NC 4.0. Attribute the FlyWire Consortium and related research in any redistributed derivatives. The code in this project is distinct from the license covering the scientific data. Check the license before any commercial deployment.

### Field mapping

| Export column | Neuroverse meaning | Rule |
| --- | --- | --- |
| `pre_root_id` or `pre_pt_root_id` | Presynaptic root ID | Unsigned integer in SQLite signed 64-bit range, stored as string |
| `post_root_id` or `post_pt_root_id` | Postsynaptic root ID | Same as above |
| `syn_count` | Identified chemical synapse count in row | Positive integer; repeated directed pairs are **summed** |
| `neuropil` | Regional annotation | Accepted in input but not retained in current aggregated sample; future enhancement |
| `root_id` in optional neuron annotations | Neuron key | Mapped only for selected neurons |
| `cell_type` or `primary_type` | Optional neuron type label | Empty when unavailable; never invented |

An edge is a directed **presynaptic neuron → postsynaptic neuron pair**. The edge count and synapse count are different units. A displayed path means structural reachability in a selected graph, **not proven electrical propagation**. Root IDs must be stored as strings in JSON, because many exceed JavaScript's 53-bit safe integer range.

## 2. File layout and installation

All raw archives and generated scientific databases stay out of Git. From a local checkout:

```text
neuroverse/
├── data/
│   ├── raw/connections_princeton.csv.gz    # manually downloaded; not committed
│   ├── raw/consolidated_cell_types.csv.gz   # optional; not committed
│   └── processed/fafb_sample.sqlite3       # generated; not committed
└── backend/
```

From the `backend/` directory, with the Python environment installed:

```powershell
# Replace the filename if Codex gave your download a different name.
python -m app.data.pipeline --connections ../data/raw/connections_princeton.csv.gz --out ../data/processed/fafb_sample.sqlite3 --max-neurons 120 --max-edges 750 --min-synapses 5
```

The `--seed` option sets a valid root ID to explore. If omitted, the script selects the presynaptic neuron with the largest outgoing summed count among retained edges (deterministic, but **not representative**). For a manually selected seed:

```powershell
python -m app.data.pipeline --connections ../data/raw/connections_princeton.csv.gz --out ../data/processed/fafb_sample.sqlite3 --seed YOUR_ROOT_ID --max-neurons 120 --max-edges 750 --min-synapses 5
```

If your annotation export has a matching `root_id,cell_type` or `root_id,primary_type` schema, append `--neurons ../data/raw/consolidated_cell_types.csv.gz`. Inspect the actual header first; never guess a schema based only on the filename.

The importer computes a full-source SHA-256, streams the CSV, aggregates duplicate directed pairs across records, enforces synapse-count threshold **after aggregation**, then ranks 1-hop neighbors of the seed by the sum of incoming and outgoing synapse counts in the current input graph. It keeps at most `max_neurons` nodes and `max_edges` directed edges (sorted by synapse count and numeric ID for deterministic tie-breaking). This is an **ego-centric sample with selection bias**, not a representative random sample.

**Large-file caution:** the importer scans the complete CSV and uses a temporary SQLite table. This requires disk space and can be time-consuming for a multi-million-row data export. It avoids loading the entire table into Python RAM. Insufficient disk space or a malformed CSV aborts without leaving a valid output manifest.

## 3. Output and reproducibility

The command writes:
- `data/processed/fafb_sample.sqlite3` — small read-only graph store with `neurons` and `connections` tables.
- `data/processed/fafb_sample.manifest.json` — snapshot, input filename/byte size/SHA-256, optional annotation SHA-256, license, importer parameters, selected node/edge counts, output database SHA-256, UTC import time and scientific limitations.

`source_identity_verified` is always **false**: a checksum proves file integrity relative to a local input, not that it originated at Princeton. Independent source verification would require a trusted official checksum or a separately audited archive and should be an explicit later step. Do not manually change this field or present these outputs as scientifically audited.

If a future user swaps the processed database without updating its manifest, the API refuses to start. If no dataset is configured, neuron routes return **HTTP 503** rather than generated placeholder neuroscience data.

### Starting the API

```powershell
# PowerShell session, run within backend/:
$env:NEUROVERSE_DATASET_DB = (Resolve-Path ../data/processed/fafb_sample.sqlite3).Path
python -m uvicorn app.main:app --reload
```

Check:
- `GET /api/v1/datasets/current`: provenance, counts, scope, limitations
- `GET /api/v1/neurons/search?q=7205`: selected neuron IDs, capped to 30
- `GET /api/v1/neurons/{root_id}`: selected neuron metadata and incoming/outgoing count
- `GET /api/v1/neurons/{root_id}/connections?direction=outgoing`: directed edges
- `GET /api/v1/neurons/{root_id}/neighborhood?max_nodes=60&max_edges=300`: bounded graph for visualization

All endpoints are read-only; none of the graph data represents neuronal firing. Blank annotations are shown as null, not assumed biological types.

## 4. Validation, limits, and caveats

**Implemented automated checks**
- gzip and CSV parsing; header variants;
- root ID range / precision; directionality; positive synapse count;
- repeated directed-pair aggregation before threshold;
- seeded 1-hop neighborhood and deterministic sorting;
- root-ID/annotation joining, selected node/edge bounds;
- SQLite foreign keys/integrity and SHA-256 manifest matching;
- API missing-data behavior, bounded queries, 404/422 responses and SQL parameterization.

**Known scientific and engineering limitations**
- This pipeline supports **one local developer-supplied export** (not verified against an official archive hash). No canonical reference dataset is included.
- A node missing from a selected subgraph can still exist in the full brain.
- Seed-biased selection and truncation distort degree, path counts, clustering and comparative metrics; all reported metrics are **within the selected graph only**.
- Partner edges may be spread across brain regions; neuropil-specific information is lost through aggregation.
- Synapse count is not a direct physiological weight or neuronal firing rate.
- FAFB v783 is a snapshot, while some peer-reviewed network analysis articles use v630; their results are not directly interchangeable.
- Real-data spot checks against Codex require a downloaded source file and a separately documented validation task.

## 5. Scientific citations and licensing

1. Dorkenwald et al., *Neuronal wiring diagram of an adult brain*, Nature 2024, https://doi.org/10.1038/s41586-024-07558-y
2. Lin et al., *Network statistics of the whole-brain connectome of Drosophila*, Nature 2024, https://doi.org/10.1038/s41586-024-07968-y — note published analysis v630 vs app target v783.
3. FlyWire Consortium, *FlyWire Whole-brain Connectome Connectivity Data*, Zenodo record 10676866, https://doi.org/10.5281/zenodo.10676866
4. FlyWire citation guidelines, https://home.flywire.ai/guidelines
5. Codex FAQ, https://codex.flywire.ai/faq

**Independence statement:** Neuroverse is not affiliated with FlyWire or Princeton University.
