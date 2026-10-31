# Interactive neuron atlas

Open **Explore → Load mapped neurons** (`#neurons`). The atlas displays one
selectable position per neuron in the publication-matched FlyWire FAFB v783
annotation release. Click a point or select a search result to open that cell's
original skeleton, source annotations and a description of its cell class.
The existing surface and connectivity explorer remains below this atlas.

## Scientific source and geometry

- Source: Schlegel et al., *Whole-brain annotation and multi-connectome cell typing
  of Drosophila*, Nature (2024), <https://doi.org/10.1038/s41586-024-07686-5>.
- Annotations: `flyconnectome/flywire_annotations`, release **v2.1.0**, commit
  `ebd66db2596fcc39c6950fb54ea3efa00f7fe8a0`,
  `supplemental_files/Supplemental_file1_neuron_annotations.tsv`.
- Source SHA-256: `30be6c73975a70c56d930e27911f36455d3886e15abf383b78edd2a5d679e0b6`.
- The pinned source contains **139,255** unique neuron IDs, **118,107** soma
  positions and **21,148** anchor positions used where soma coordinates are absent.
  Anchors are points on the reconstruction, not inferred cell bodies. They have a
  different legend/color. This annotation release is not every object or segment
  in the underlying electron-microscopy volume.
- The upstream [column documentation](https://github.com/flyconnectome/flywire_annotations/blob/a83b2776d60d5764cef36b927f5f9679c16c47a2/supplemental_files/README.md)
  specifies **4 × 4 × 40 nm** voxel units for both soma and anchor coordinates.
  The API converts these to nanometers before one shared uniform display transform.
  Neuron IDs remain strings throughout.
- Map points are selection markers, not neuron-sized spheres or full membrane
  meshes. The selected detail view uses the existing published v783 centerline
  skeleton endpoint and preserves source branches. It centers that one skeleton
  for inspection; it does not register it to the separate tissue meshes.

## Interpretation

Cell type, hemibrain type match, class, side, and source quality flags are shown
as annotations. The top neurotransmitter is explicitly **predicted**, with its
mean source confidence; any separately reported transmitter and citation are
shown separately. Mean confidence is not a measured probability of function.

The educational summaries describe broad classes such as ALPN and Kenyon cells,
with the annotation study linked as context. They do not assign an experimentally
established function to each individual neuron. Uncovered or missing classes show
**function not established**. A wiring diagram or an anatomical shape does not
demonstrate neuronal activity, behavioral causation, or a specific response.

## Runtime

No new package or credentials are required. Start FastAPI and Vite as described
in the main README. The annotation source is fetched on demand from
`raw.githubusercontent.com`, checksum-verified, cached under the system temporary
directory and retained in memory. A corrupt disk cache is replaced only by a
verified source download. Read-only disk storage is supported via memory.
No scientific archive is committed to the repository.

The atlas, search and annotation detail endpoints do not require the optional
local connectivity SQLite database:

- `GET /api/v1/atlas/points`
- `GET /api/v1/atlas/search?q=ALPN&offset=0&limit=12`
- `GET /api/v1/atlas/neurons/720575940625431866`

Original neuron shapes require HTTPS access to `flyem.mrc-lmb.cam.ac.uk`.
When that source is unavailable, the selected cell's annotations remain visible
and the shape view offers retry. No substitute scientific geometry is generated.
The current cloud network initially denied this domain; its addition was saved
to the environment draft, which must be applied in environment settings.

## Interaction and validation

Selecting a cell highlights its location and moves the camera toward it, then
opens the individual reconstruction. The detail panel fades in. OS reduced-motion
and the site's motion setting disable the transition. Orbit drags do not select
cells. Search results support keyboard selection, pagination, return focus and
metadata access without WebGL. Superseded requests are aborted and checked before
updating state, so fast selections cannot mix identities or geometry.

Backend tests check anisotropic coordinate conversion, missing positions, source
checksum rejection, lookup/pagination, honest unknown functions and unavailable
sources. Frontend tests check geometry transforms and source-data validation.
Browser tests use explicitly synthetic fixtures solely to test map picking,
transition state, reduced motion, keyboard access, races, failures and mobile
layout. A separate live smoke check verifies the complete original atlas and a
real profile through Vite; mocked browser geometry does not verify remote skeleton
availability.

For an installed system Chromium, run from `frontend/`:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- e2e/neurons.spec.ts --workers=1
```

The optional executable override leaves the normal Playwright-managed browser
configuration intact. Attribution and noncommercial restrictions remain in
[Data & Third-Party Notices](licenses-and-attribution.md).
