# Phase 03 — Scientific Data Quality Gate

**Branch:** `phase/03-scientific-data`  
**Status:** PASS for Phase 03's defined data engineering + source audit gates. A full user-facing brain visualizer and deployed scientific dataset are not part of this phase.

## Acceptance checklist

| ID | Requirement | Evidence / result |
| --- | --- | --- |
| P03-01 | Canonical sources, DOI, snapshot, license and caveats recorded | `docs/scientific-data-pipeline.md` |
| P03-02 | CSV / gzip importer accepts documented export schema | Automated synthetic fixture tests |
| P03-03 | Full source checksum, import parameters and destination SHA-256 | Manifest tests |
| P03-04 | Correct directed-pair aggregation and threshold | Known-answer fixture |
| P03-05 | Deterministic, bounded 1-hop subgraph selected | Selection tests |
| P03-06 | Optional real metadata joins without invented labels | Annotation tests |
| P03-07 | Read-only API search, neuron, connectivity, neighborhood | HTTP tests |
| P03-08 | Fail-closed behavior for missing or tampered data | HTTP and manifest tests |
| P03-09 | Actual independently inspected FAFB v783 source import | **PASS** — Zenodo MD5 checked, 20,000 real connection rows imported |
| P03-10 | Complete CI + real-data scope audit | **PASS** — run 39352395602; all five jobs successful |

## Scientific provenance limitations

The official site exposes FAFB v783 as 139,255 neurons and 3,732,460 pairwise connections after portal-defined filtering. This count is not a metric derived by Neuroverse.

The first test fixtures are **synthetic** and explicitly named as such. The importer labels user-supplied exports as **source_identity_verified=false**, because locally hashing an arbitrary file is not proof of its official biological provenance. A real verified input requires an inspected official download, reproducible checksum, trustworthy filename/schema and manual comparison against independently published data.

P03-09 has now passed for a real-data **bounded integration sample**, not for exhaustive validation of every source record or full-brain scientific analysis.

## Planned verification after authentic data access

- Record archive size, retrieval date, source URL and SHA-256.
- Inspect CSV headers and sample source rows manually.
- Confirm no mismatched ID snapshot/columns.
- Run import on a bounded seed and check selected directed edge counts against original archive (and where possible Codex).
- Record original/derived edge counts and limitations; never claim total brain coverage from the subset.
- Rerun the full CI suite and check PR differences contain no secret or giant raw data.

## Expected commands

```bash
cd backend
python -m pytest -q
python -m compileall -q app tests
python -m app.data.pipeline --help
```

GitHub Actions results to be appended after PR creation.

## Confirmed official neuron ID verification — 2026-10-20

GitHub Actions run: https://github.com/krisvan123/Neuroverse/actions/runs/39351821273

- Verified exact Zenodo `proofread_root_ids_783.npy` binary against official MD5 `e0e6c19732fd8c7a4e39a2d170105421`.
- Decoded the NPY array and counted **139,255 distinct root IDs**.
- SHA-256: `7c7b7e818e9232e5ab64793d52ba20574dbe9da3a6509fbc74193b0f259a01be`.
- The official-ID job, Python tests, frontend checks and HTTP integration checks all succeeded.

**This authenticates the neuron ID archive, NOT all neuronal connection records.**

## Completed official connections audit — 2026-10-20

**Evidence:** https://github.com/krisvan123/Neuroverse/actions/runs/39352395602

- Official `proofread_connections_783.feather` (852,022,274 bytes) downloaded directly from Zenodo.
- Publisher MD5 **matched**: `f48f972d262323a102aed49af1396b8a`.
- Calculated full-archive SHA-256: `24f960ae3e7d4f8cd30db3b62e99fb5179cc3d1e76d8c155bfb441e9737d3faf`.
- Read **20,000 authentic rows** from a file-order prefix (non-random, non-representative), creating a reproducible CSV with SHA-256 `476762fe711d5bc23a73ee6702dec044a9fcb1036bd622137dfaa8e9ffe79083`.
- Imported those rows with threshold >=5 and official root-ID membership verification, generating a bounded graph of **14 neurons and 15 directed edges**.
- Resulting SQLite database SHA-256: `ab36a2d4aba187bde3921e5f93d615648a672084763657ca582457654cc96f8a`.
- Backend tests, frontend lint/typecheck/tests/build, integration smoke, official neuron ID check and real-data sample audit **all passed**.

The small sample is **not a statement about whole-brain network statistics**. The CSV-only importer intentionally retains `source_identity_verified=false` because its input can be replaced without a guaranteed publisher signature. The GitHub Actions log separately links this integration sample to an archive whose official checksum was confirmed.

To avoid repeatedly downloading ~852 MB on every PR, the heavy audit has been moved to the manually triggered GitHub Actions workflow `audit-fafb.yml`. Normal PR CI retains the 1.1 MB ID checksum check.

### Final Phase 03 assessment

**10/10 for the defined Phase 03 engineering and representative-source-check gates:** all P03-01 through P03-10 met with documented evidence. This grade does **not** certify all biological connections, annotations or full spatial morphology; those require additional work in future scientific visualization phases.
