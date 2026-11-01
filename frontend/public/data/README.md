# FlyWire coordinate preview

Attribution: **FlyWire Consortium; Schlegel et al. (2024)**,
*Whole-brain annotation and multi-connectome cell typing of Drosophila*, Nature.
<https://doi.org/10.1038/s41586-024-07686-5>

Source data and this derived position preview: **CC BY-NC 4.0**.
<https://creativecommons.org/licenses/by-nc/4.0/>

The manifest links the original annotation table, pinned commit, coordinate
documentation, source checksum and preview checksum. The preview preserves
139,255 original root IDs with soma positions (or source anchors when no soma is
annotated). Source 4 × 4 × 40 nm voxel coordinates are converted to nanometers and
encoded losslessly. These markers are not complete neuron shapes or activity.

The 12-byte little-endian header stores `NVAP`, uint32 version, uint32 count.
Each 21-byte record stores uint64 root ID, three float32 nanometer coordinates,
and uint8 position kind (0 soma, 1 anchor). The original TSV is not bundled.

Regenerate from the verified source by running, from `backend/`:

```bash
.venv/bin/python -m app.data.build_atlas_asset
```

Keep this notice and the manifest with redistributed data. Neuroverse is
independent of FlyWire and the cited authors. This notice grants no separate
license for original Neuroverse application code.
