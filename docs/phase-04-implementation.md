# Phase 04 — Cosmic Neuroscience: Implemented 3D Experience

**Document ID:** NV-UX-004 · **Scope:** homepage conceptual 3D, atmospheric design and accessible controls.

## Design contract

The 3D hero is a procedurally sculpted bilateral *inspired-by* adult fruit-fly-brain shape. The shell, connective fibers, stars and DNA are **pure concept art**, not reconstructed FAFB data. Every visual instance is labeled as illustrative. No automatic object-to-root-ID mapping exists; that work is reserved for Phase 05 and must use actually licensed morphology data.

### Technical architecture
- `components/BrainExperience.tsx`: React-owned DOM controls, feature detection, graceful fallback, lazy 3D renderer and explanatory disclosure.
- `components/BrainPoster.tsx`: SVG illustration for WebGL-disabled browsers; no external assets, fonts or license dependencies.
- `scenes/CosmicBrainScene.tsx`: React Three Fiber v9 / Three.js stable WebGL canvas; custom orbit camera, twin-lobed conceptual shell, original neural filaments, subdued DNA and star points.
- `scenes/geometry.ts`: deterministic seeded procedural geometry; one combined filament LineSegments buffer; a single star Points buffer; no repeated individual star meshes.
- `scenes/browserSupport.ts`: safe WebGL probe for unsupported contexts.

### Visual controls
1. Drag/touch to rotate the sculpture; scroll/pinch to zoom inside the canvas.
2. Click **Front**, **Left**, **Right**, **Top** or **Reset**; camera presets also provide keyboard access without requiring 3D gestures.
3. Select **High**, **Balanced** (default), or **Saver** quality.
4. Pause/resume motion in the hero or footer; honor `prefers-reduced-motion` on initial load.
5. Read **About this 3D visualization** for scientific disclaimers.

No autoplay audio, aggressive scroll hijacking, camera motion that overrides user gestures, or unbounded scene resources.

### Geometry and performance
| Mode | Procedural fibers | Star particles | DNA helices | Max render pixel ratio |
| --- | ---: | ---: | ---: | ---: |
| High | 110 | 430 | 2 | 1.7 |
| Balanced | 70 | 210 | 1 | 1.4 |
| Saver | 30 | 55 | 0 | 1.0 |

Star particles are batched, filaments are merged into one GPU line geometry, static geometry is memoized and disposed on quality changes, and the main 3D component is code-split by `React.lazy`. When paused or in Saver mode the Three.js frame loop switches to **demand rendering**; manual camera gestures still invalidate frames as needed.

**Measurement disclaimer:** budgets above are code settings, *not measured FPS*. Real device frame-rate and accessibility audits must be independently recorded before claiming performance goals are achieved.

### Responsiveness and fallback
- Desktop: conceptual 3D canvas in right hero panel with independent control bar.
- Mobile: stacked hero copy/canvas with responsive wrap-around toolbar. Content remains available without WebGL.
- Static WebGL-disabled poster is a first-party vector illustration.
- Live text, data/source disclaimers, navigation and control labels remain HTML, not opaque canvas-only text.
- Reduced motion is not a user lockout: any manual camera view remains available.

### Scientific references
- Dorkenwald et al. (2024), [Neuronal wiring diagram of an adult brain](https://doi.org/10.1038/s41586-024-07558-y).
- [FlyWire guidelines](https://home.flywire.ai/guidelines) for real-data terms and attribution.
- [React Three Fiber installation](https://r3f.docs.pmnd.rs/getting-started/installation).
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) as the accessibility review target.

Neuroverse is an independent educational project and is not an official FlyWire viewer.
