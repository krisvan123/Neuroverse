# Neuroverse data workspace

**Raw FlyWire files are NOT stored in this repository.** The project ships no downloaded neuronal connections. Test fixtures are generated programmatically and are **synthetic**.

Use:

```text
data/
  raw/         # manually downloaded FAFB v783 CSV / CSV.gz files
  processed/   # locally generated SQLite and .manifest.json files
```

Create the two folders locally. The root `.gitignore` prevents accidentally committing their contents.

## Official source

- FlyWire Codex FAFB v783 download portal: https://codex.flywire.ai/api/download?dataset=fafb
- FlyWire official license and citation instructions: https://home.flywire.ai/guidelines
- FlyWire Consortium (2024) scientific paper: https://doi.org/10.1038/s41586-024-07558-y
- Canonical Zenodo archive (large Feather files, not the CSV importer format): https://doi.org/10.5281/zenodo.10676866

**Access:** Codex may require Google sign-in and a personal Codex API token for programmatic downloads. You can download the CSV through your own logged-in browser and place it in `data/raw/`. Do not share your token and never commit it to GitHub. The importer deliberately does not fetch remote URLs or handle credentials.

**Recommended CSV:** `connections_princeton.csv.gz` (inspect the actual downloaded file and its column headers). Supported connection headings are either `pre_root_id,post_root_id,syn_count` or `pre_pt_root_id,post_pt_root_id,syn_count`. Additional neuropil rows for the same directed pair are added together. Optional annotations must contain `root_id,cell_type` or `root_id,primary_type`.

Only FAFB **v783** is within current scope; never mix root IDs from other materializations without a supported mapping step. The processing utility cannot independently authenticate uploaded files as an official FlyWire export and therefore records `source_identity_verified: false`.

See [the detailed pipeline documentation](../docs/scientific-data-pipeline.md).

For the Zenodo Feather data source and validation converter, see Section 7 of the [pipeline guide](../docs/scientific-data-pipeline.md).
