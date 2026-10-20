# Phase 03 — Scientific Data Quality Gate

**Branch:** `phase/03-scientific-data`  
**Status:** IN PROGRESS. Do not claim scientific validation from synthetic tests alone.

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
| P03-09 | Actual independently inspected FAFB v783 source import | **Not yet verified** |
| P03-10 | Complete CI + real-data scope audit | Await GitHub CI and data audit |

## Scientific provenance limitations

The official site exposes FAFB v783 as 139,255 neurons and 3,732,460 pairwise connections after portal-defined filtering. This count is not a metric derived by Neuroverse.

The first test fixtures are **synthetic** and explicitly named as such. The importer labels user-supplied exports as **source_identity_verified=false**, because locally hashing an arbitrary file is not proof of its official biological provenance. A real verified input requires an inspected official download, reproducible checksum, trustworthy filename/schema and manual comparison against independently published data.

Until P03-09 passes, Phase 03 should **not** be scored 10/10 or merged merely because the CI is green.

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

## Official connections audit in progress

A one-time CI job for PR #3 attempts to download the official ~852 MB Feather connection archive, check its published MD5, extract a clearly biased sample, and test the complete importer. Do not claim it succeeded before reviewing the CI result.
