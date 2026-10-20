# Neuroverse — Data & Third-Party Notices

These are **source and license notices**, not a statement that the Neuroverse code itself has been released under a particular open-source license. No license is granted to reuse original project code unless the owner explicitly publishes one.

## Scientific data and geometry

- **FlyWire / FAFB adult fruit fly connectome public release (snapshot 783):** [FlyWire data use and citation guidelines](https://home.flywire.ai/guidelines) describe public release data under **Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0)**. Public demonstration must respect noncommercial scope and full attribution; do not infer permission for commercial repackaging.
- **FAFB-aligned neuropil and processed tissue surface:** the published polygons come from [navis-org/navis-flybrains](https://github.com/navis-org/navis-flybrains), whose repository identifies its software license as **GPL-3.0**. Mesh/data rights and original FlyWire data terms may be distinct; a software license alone does not override underlying data restrictions.
  - Pinned code snapshot: [273333c8d8bf5adeebebd274e554621462e388bd](https://github.com/navis-org/navis-flybrains/tree/273333c8d8bf5adeebebd274e554621462e388bd).
  - Neuropil: `flybrains/meshes/FLYWIRE.ply` (pinned Git blob `468c217c41602a8d34df2af6afd00a2aa1c11077`).
  - Whole-brain envelope: `flybrains/meshes/FLYWIRE_whole_brain.ply` (pinned Git blob `3cf14cdd1399f212057f40c918493452abf056da`); [original preparation notes](https://github.com/navis-org/navis-flybrains/blob/273333c8d8bf5adeebebd274e554621462e388bd/flybrains/meshes/FLYWIRE_whole_brain.md).
  - The Neuroverse service downloads these original resources at runtime and checks each pinned Git blob before serving it. Neither mesh is stored in the repository or Docker build.
- **FAFB v783 neuron centerlines:** source-dependent skeletons come from a published scientific resource via an HTTP API; provenance and source hashes are returned with individual responses. Availability is not guaranteed.
- **Local FAFB connection CSV:** the optional importer reads a separately obtained user file, computes its SHA-256 and validates schema and selected graph consistency. It does **not** independently authenticate the file's stated original publisher. No such CSV is distributed in the repository or the release image.

## Educational references and software

- Scientific publications, OpenStax teaching sources, graph algorithm references and provenance links appear in [Scientific Standards](scientific-standards.md), [Academy notes](phase-06-learning-academy.md), and the lesson UI. The app uses original teaching prose rather than redistributing research articles.
- React, Vite, Three.js, FastAPI and their dependencies retain their own upstream licenses. See the package manifests and dependency source repositories for their exact versions and license texts.
- Hero stars, DNA accents, color gradients and node layouts are decorative/modeling choices, **not** scientific measurements.

## Boundaries for a public release

1. Cite the FlyWire research and mesh authors, and keep their scope and license links visible.
2. Do not portray an anatomical 3D surface as a complete EM voxel atlas or reconstructed synapse geometry.
3. Do not interpret BFS/DFS, graph-node removal, or edge weights as physiological firing, lesions, clinical findings or causation.
4. Do not distribute unpublished data, unauthorized annotations, credentials or restricted datasets.
5. A separate rights review is required before claiming that Neuroverse or these assets are approved for commercial exploitation.
6. Neuroverse is independent and is **not affiliated with or endorsed by** FlyWire, Princeton, the authors of cited papers, or source repositories.
