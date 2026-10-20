# Phase 05 — Scientific Anatomy and Connectivity Implementation

Status: Phase 05 engineering gate accepted; Phase 05.2 visual refinements documented separately. Dataset: adult female fruit fly FAFB v783.

## Scientific integrity

The original Phase 04 cosmic hero was concept art. Since the Phase 05 hero upgrade, the visible 3D brain surface uses the pinned FAFB tissue-mask-derived PLY; the surrounding DNA, stars, lighting and atmospheric effects remain decorative. The fallback SVG is conceptual, not a scan. The scientific workspace shows three *distinct* sources:
1. Whole-brain tissue envelope from the real FAFB tissue mask, reconstructed through erosion, filling, marching cubes, manual cleanup and transformation (Peter Li / Google; distributed by navis-flybrains).
2. Individual neuron *skeleton centerlines* (real segment geometry) from the published FAFB v783 precomputed skeleton archive operated at MRC Laboratory of Molecular Biology, Cambridge. These are not volume meshes and do not represent electrical impulses.
3. Selected local directed synaptic graph based on an imported provenance-recorded FAFB connections file. Its radial diagram is not anatomical location.

Spatial alignment between a separate tissue surface and neuron skeleton has NOT been verified. The UI does not overlay them; each view centers and scales uniformly only to fit the camera, preserving topology and relative shape.

## Primary and technical references

- Dorkenwald et al., Nature 2024, DOI: https://doi.org/10.1038/s41586-024-07558-y
- Tissue-mask-derived FLYWIRE whole-brain mesh and preparation: https://github.com/navis-org/navis-flybrains/blob/273333c8d8bf5adeebebd274e554621462e388bd/flybrains/meshes/FLYWIRE_whole_brain.md
- Tissue source PLY Git blob SHA-1: 3cf14cdd1399f212057f40c918493452abf056da, pinned commit 273333c8d8bf5adeebebd274e554621462e388bd.
- Real neuron skeleton source and v783 provenance: https://fafbseg-py.readthedocs.io/en/latest/_modules/fafbseg/flywire/skeletonize.html
- Raw published skeleton endpoint: https://flyem.mrc-lmb.cam.ac.uk/flyconnectome/flywire_skeletons_783/{root_id}
- Binary decoding specification: https://github.com/google/neuroglancer/blob/master/src/datasource/precomputed/skeletons.md
- FlyWire data attribution/terms: https://home.flywire.ai/guidelines

The tissue model is a specimen-derived surface but has been manually processed. Its exact polygon shape is NOT the complete, unprocessed EM voxel mask. Neuron skeletons are preserved original centerlines and not claimed to show all cellular volume. The software source navis-flybrains is GPL-3.0; FlyWire's public data notice specifies CC BY-NC 4.0. Neuroverse retrieves the source asset remotely and does not bundle or relicense the original PLY. A further license audit is essential before commercialization or redistributing meshes.

## Data validation

- Tissue API downloads from one commit-pinned GitHub URL only and verifies byte-for-byte Git blob content using blob object SHA-1 before serving the unchanged PLY; SHA-256 supplied for provenance.
- Skeleton API allows only bounded, numeric signed-64-bit root IDs. It uses a fixed versioned scientific host with timeout and byte budget. It validates the Neuroglancer little-endian binary layout, vertex and edge counts, finite coordinates, radii, and topology.
- Skeleton coordinates are returned in nanometers. No invented neuron branches are added.
- A source failure produces HTTP 404/503; no invented mesh fallback in the scientific viewer.
- Local graph endpoints refuse service when no selected, validated source graph was imported. Absence from a selected subgraph does not demonstrate biological absence.

## Limitations

Precomputed v783 skeleton retrieval authenticates a fixed scientific publication-linked URL and format, but does not compare individual skeleton bytes against a separately published checksum. Tissue source Git object is cryptographically pinned at the Git blob level. Source availability depends on an internet connection. Hardware GPU, whole-brain synapse positions and human usability studies remain future work.
