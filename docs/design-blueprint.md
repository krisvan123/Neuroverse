# Neuroverse — Cosmic Neuroscience Design Blueprint

**Document ID:** NV-UX-001  
**Version:** 1.0 · **Date:** 2026-10-20  
**Status:** Design specification; visuals and interactions have not yet been implemented or usability-tested

## 1. Experience vision

**Art direction:** Cosmic Neuroscience — a restrained fusion of a digital science museum and a professional connectomics workspace.

**Product principle:** **Homepage = wonder; Explorer = wonder + control; Lesson/Lab = clarity + precision.**

Neuroverse makes real structural neuroscience approachable through an engaging visual story, while maintaining explicit separation between decorative imagery and scientific data.

### Experience pillars
1. **Immediate wonder:** an impressive, optional 3D fly-brain hero in a deep-space environment.
2. **Visible purpose:** the user understands "Learn, Explore, Experiment" in the first screen.
3. **Scientific trust:** each factual visual can be traced to a dataset, model, or cited source.
4. **Control:** users can stop motion, reset the camera, change display quality and fall back to a list/graph view.
5. **Learning before spectacle:** animations and microinteractions support comprehension, not distract from it.

## 2. Brand and design tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--space-950` | `#070C18` | Main cosmic background |
| `--space-900` | `#0D1629` | Content surface |
| `--space-800` | `#15243B` | Panel surface |
| `--stroke-soft` | `#2A3B54` | Borders |
| `--text-primary` | `#F4F7FC` | Primary text |
| `--text-secondary` | `#B4C3D8` | Secondary text |
| `--accent-cyan` | `#73D8FA` | Interactive focus and main accent |
| `--accent-violet` | `#B7A0FF` | Alternative series/layer |
| `--accent-teal` | `#79DCCB` | Graph/lesson category |
| `--accent-gold` | `#FFD391` | Scientific insight accent |
| `--danger` | `#FF8A9E` | Destructive experiment action |

**Typography:** accessible system stack initially (`Inter` optional, with system fallbacks). Clear sans-serif for prose; tabular numerals for statistics. Never use decorative display type for lesson paragraphs.

**Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64px. General content width 1120–1280px; line length ~65–80 characters for long lessons. Main canvas can stretch wider.

**Panel treatment:** subtle opaque dark surface with optional light translucency; avoid stacking large backdrop blurs. Minimum visible focus outlines, not glow-only focus.

**Accessibility:** verify WCAG 2.2 AA contrast for each pair; colors listed above are *candidates* until audited. Do not rely on color alone to encode selected regions, edge direction, correctness, or warnings.

## 3. Site map

```text
/
├── learn
│   ├── tracks
│   └── missions/001
├── explore
│   ├── overview
│   └── neuron/:id  (supported subset only)
├── lab
│   └── graph-experiment
├── methods
│   ├── sources
│   ├── datasets
│   └── limitations
└── settings  (motion, graphics quality, labels)
```

**Primary navigation:** Learn · Explore · Lab · Methods. Home is reachable via logo. Avoid burying documentation behind an obscure icon.

## 4. Homepage: layout and narrative

### 4.1 Hero (desktop: 100vh maximum, content-first)

```text
┌───────────────────────────────────────────────────────────┐
│ NEUROVERSE   Learn   Explore   Lab   Methods    Settings   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  EXPLORE THE HIDDEN                                       │
│  ARCHITECTURE OF                                          │
│  INTELLIGENCE.         [3D brain / verified asset]        │
│                                                           │
│  Discover the science of neurons,                          │
│  connections, and computational networks.                 │
│                                                           │
│  [Start Learning]  [Explore Connectome]                    │
│                                                           │
│  Source/disclosure label          [Pause motion] [Reset]  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

- Title and CTA must be visible before the 3D bundle loads.
- Brain object occupies about 45–55% of desktop hero visual space and remains visually unobstructed.
- **Decorative DNA** stays behind foreground copy, with reduced opacity and no implication of direct connectome relevance.
- Star particles create depth in the background; no bright, rapid flashing.
- Scientific claim captions appear as linked sources, not unsupported dramatic numbers.
- Initial hero may use a **clearly labeled conceptual brain** until a genuine, properly licensed morphology asset is proven suitable. No unverifiable "real 3D scan" claim.

### 4.2 Section sequence

1. **What is Neuroverse?** Three paths: Learn · Explore · Experiment.
2. **Why a fly brain?** Short scientifically supported explanation; differentiate neurons, synapses and connections.
3. **How it works.** Four-step Learn → Explore → Experiment → Explain demonstration.
4. **Interactive preview.** Very small locally loaded toy graph; explicitly labeled "Synthetic teaching example."
5. **Learning tracks.** Biology, Neuroscience, Graph Algorithms, Scientific Computing.
6. **Methods and trust.** Link to source registry, limitations and FlyWire attribution.
7. **Final CTA.** Start Mission 001.

**Homepage anti-patterns:** autoplay sound/video, scroll hijacking, excessive full-page parallax, canvas hiding CTAs, decorative stats incorrectly attributed to biology.

## 5. The Cosmic Scene: layering and animation rules

**Render layering:**
1. CSS static background gradient, faint structured dots;
2. GPU background point particles (non-interactive);
3. one or two subtle procedural DNA double helices (decorative);
4. main brain model (illustrative or clearly data-driven);
5. carefully controlled neuron highlights where meaningful;
6. DOM UI with readable text, navigation, labels and panels.

**DNA helix specification:** two twisting spline strands joined by periodic rungs; render as low-segment instanced tubes/lines, or a simpler CSS/SVG fallback; transparent and off-center; label as artwork in the About Visualization panel.

**Star field:** use a batched `THREE.Points` or instancing rather than one mesh per star. Depth/parallax should be subtle, not tied to precise mouse movement.

**Camera:** perspective on hero; mild auto-orbit only when user has not interacted and motion is allowed. Never rotate an educational data view automatically while user is selecting nodes.

**Animation timings (initial hypotheses, subject to usability tests):**
- Button/selection feedback: 100–180ms.
- Inspector drawer: 180–280ms.
- Camera focus: 550–900ms with cancellation on user input.
- Idle motion: slow enough to remain unobtrusive; disabled during controls, tab hidden, or reduced motion.
- Guided educational traversal: user-controlled steps with optional speed slider; default to pause between steps.

**No autoplay critical narrative:** the user controls movement through lessons. Support pause/disable/low-motion options globally.

## 6. Interactive 3D Brain Explorer

### 6.1 Desktop layout

```text
┌───────────────────────────────────────────────────────────┐
│ Logo  / Explore / Dataset FAFB v783  [3D|Graph] [Help]    │
├───────────────┬─────────────────────────┬─────────────────┤
│ SEARCH &      │                         │ SELECTED OBJECT │
│ FILTERS       │   3D brain / graph      │ Name / ID       │
│               │                         │ Type / region   │
│ Region        │   Orbit • Pan • Zoom    │ Synapse metrics │
│ Neuron ID     │   Focus • Reset         │ Provenance      │
│ Layers        │                         │ Learn / Lab     │
│ Threshold     │                         │                 │
├───────────────┴─────────────────────────┴─────────────────┤
│ Dataset and model limitations · Export · Camera controls  │
└───────────────────────────────────────────────────────────┘
```

**Initial layout targets:** left inspector ~240–280px, right details ~300–360px, middle canvas fluid with minimum practical width; collapse panels at smaller breakpoints.

### 6.2 Explorer interaction state machine

`idle → loading → overview → selected → focused → neighborhood_loaded`

Error states can interrupt the sequence and return to the last valid state. A selection must be shareable internally as typed data, not coupled to scene object names.

- **Overview:** show brain overview or region guide; textual instruction "Drag to rotate; scroll to zoom."
- **Selected:** inspector updates ID, class/region if known, evidence/source and visualization label.
- **Focused:** camera interpolates toward centroid; selecting a different neuron cancels previous tween.
- **Neighborhood loaded:** only requested and bounded edges appear; direction arrows/legend must be visible.
- **Graph mode:** Cytoscape.js displays the same subgraph in an explicit directed network representation; graph node IDs must match API IDs.
- **No result:** provide explanation, reset filters, and retry action.
- **WebGL unavailable:** show informational illustration and accessible graph/list navigation instead.

**Keyboard operations:** visible controls for rotate presets (front/side/top), zoom, focus selected, reset view, clear selection. 3D gestures are enhancements, not the only route to access data.

### 6.3 Data visualization rules

- Every data layer says one of: **Real FAFB v783**, **Derived from FAFB**, **Synthetic Example**, **Mathematical Simulation**, **Illustrative Artwork**.
- Neuron pair edge thickness/color may encode retained synapse count only with a labeled, accessible legend; clarify nonlinear scaling if used.
- Inbound and outbound direction use arrows/labels in addition to color.
- Show threshold and subgraph selection; missing graph neighbors outside the subset do not prove missing biological connections.
- Use selected-neuron details from the dataset, not made-up anatomical names.
- Animated "signals" over edges must display "conceptual path traversal" or a similarly clear label.

## 7. Learning page layout

**Desktop:** narrow reading column on left, an interactive visualization on right; assessment drawer below.  
**Mobile:** vertically stacked explanations and diagrams with sticky, compact Next/Back controls.

**Lesson components:** objective list, evidence footnotes, glossary popover, labeled interactive diagram, worked example, independent test, limitation panel, and "view raw source" link.

**Mission 001:** neuron anatomy → structural graph abstraction → labeled synthetic graph → real subgraph → BFS traversal → node-removal comparison → reflection. A learner must be able to complete this path without 3D.

## 8. Experiment Lab layout

Use a two-column analysis workspace:
- left: scope, parameters, version, graph controls and hypothesis;
- right: synchronized before/after plots, result table, time/step log and "What this means" explanation.

Show transparent outputs: `nodes_before`, `edges_before`, `nodes_after`, `edges_after`, `reachability_delta` and any algorithm-specific values. **Never use visual animation as the sole way to obtain results.**

Require explicit confirmation before irreversible user-authored modifications; MVP experiments work on copies, so "Remove Node" affects only the temporary graph.

## 9. Responsive behavior

| Viewport | Layout | 3D behavior | Controls |
| --- | --- | --- | --- |
| Desktop >= 1200px | 3 panels | Full optional scene | Visible mode switch and side panels |
| Tablet 768–1199px | Main canvas + drawers | Reduced scene complexity | Collapsible filter/info |
| Mobile < 768px | Single column + bottom sheet | Static or low-quality limited 3D | Search, preset view buttons, accessible list |
| Reduced motion at any size | Unanimated UI fallback | No idle orbit/ambient parallax | Manual view changes allowed |

These thresholds are design proposals and should be tuned through real-device tests.

## 10. Technical design mapping

| Component | Responsibility | Candidate implementation |
| --- | --- | --- |
| `HeroScene` | Accessible cosmic entrance | React Three Fiber with poster fallback |
| `BrainModel` | Clearly labeled main object | glTF/GLB only after asset audit |
| `DNAHelix` | Procedural decorative geometry | Three.js buffer geometry/instancing |
| `StarField` | Batched ambient particles | `THREE.Points` |
| `BrainExplorerScene` | Selection, focus, bounded 3D layers | React Three Fiber + Drei |
| `GraphView` | Directed connectivity analysis | Cytoscape.js |
| `ScientificInfoPanel` | Annotations, provenance, source links | Accessible React DOM |
| `ExperimentComparison` | Controlled analysis and results | React + chart/table |
| `MotionSettings` | Graphic quality and reduced motion | Application settings respecting OS preference |

**Architecture rule:** React state owns selected neuron ID and active mode; the 3D renderer consumes immutable data and reports user selections. Never use canvas-only text for essential labels.

## 11. Performance budget and fallback strategy

Target metrics to measure (not yet validated):
- Visible title, navigation and CTAs regardless of 3D bundle/load failure.
- Hero scene loaded lazily after shell; no massive dataset in homepage bundle.
- Default first explorer query capped at **300 nodes / 1,000 edges** (provisional, benchmark and adjust).
- Render target ~60 FPS on a defined desktop fixture and graceful fallback around 30 FPS on low-power devices.
- Avoid frame-blocking operations; move expensive graph preparation to backend or worker only when justified by measurement.
- Use asset compression, visibility-based pause, lazy imports, pixel ratio caps, reduced particle counts and quality presets.
- Track p50/p95 scene readiness, frame rate, selection response, data payload size and browser memory on actual hardware.

**Quality modes:**
- High: visual detail and particles, subject to measured performance.
- Balanced: default adaptive density.
- Saver: lower pixel ratio, minimal particles, no ambient camera movement.
- Reduced motion: overrides ambient motion even when High is selected.

## 12. Accessibility, usability, and visual review gate

- Verify contrast using tooling; do not assume neon-on-dark automatically passes.
- Visible semantic headings, labels, validation, and focus rings.
- 3D canvas has descriptive adjacent text and keyboard-friendly alternatives.
- Any controls with icons alone have accessible names.
- `prefers-reduced-motion` disables non-essential movement; on-screen motion toggle is easy to find.
- Mouse wheel and touch gestures should not trap document scrolling; 3D interactions are confined to the canvas.
- Selected state and graph edges are not encoded by color alone.
- Font remains readable when zoomed to 200% and reflow remains usable.
- Screen reader users can access neuron details and experiment results in DOM tables.
- Test zoom, empty state, slow network, WebGL-off, touch, and keyboard-only navigation.

## 13. Research honesty and media attribution

**Asset acceptance test:** record URL/creator/license, allow/disallow modification, file type/size, proof that source IDs match data, and whether redistribution is permitted. Keep the hero brain labeled "Conceptual illustration" until this passes.

Any scientific render derived from FlyWire must show dataset attribution and version. No suggestion of official endorsement. Do not assume article figure licenses permit republishing altered art.

## 14. Design acceptance criteria

- [x] Navigation, hierarchy, interaction states and responsive transitions specified
- [x] Science versus decoration distinction explicit
- [x] 3D scene, camera and accessibility fallbacks specified
- [x] Technical component boundaries described
- [x] Performance risks and test methods recorded
- [ ] Wireframes validated in a browser on actual screen sizes
- [ ] Real asset license and neuron morphology mapping verified
- [ ] Accessibility and contrast audited on implementation
- [ ] Motion tested with users and reduced-motion settings

Unchecked items are intentionally implementation-dependent; the Phase 01 deliverable is a documented design, not a polished running interface.
