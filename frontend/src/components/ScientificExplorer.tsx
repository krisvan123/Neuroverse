import { lazy, Suspense, useCallback, useEffect, useState, type FormEvent } from 'react'
import { supportsWebGL } from '../scenes/browserSupport'
import {
  apiGet, EXAMPLE_PROOFREAD_ID, fetchSkeleton, rootIdIsValid,
  type DatasetState, type NeuronDetails, type Skeleton, type Subgraph,
} from '../science/api'
import type { ScientificMode, ScientificView, TissueDisplayMode } from '../scenes/RealBrainScene'

const RealBrainScene = lazy(() => import('../scenes/RealBrainScene'))

const TISSUE_SOURCE = 'https://github.com/navis-org/navis-flybrains/blob/273333c8d8bf5adeebebd274e554621462e388bd/flybrains/meshes/FLYWIRE_whole_brain.md'
const SKELETON_SOURCE = 'https://fafbseg-py.readthedocs.io/en/latest/_modules/fafbseg/flywire/skeletonize.html'
const RESEARCH_SOURCE = 'https://doi.org/10.1038/s41586-024-07558-y'

function NetworkGraph({ graph, onChoose }: { graph: Subgraph; onChoose: (value: string) => void }) {
  const nodes = graph.nodes.slice(0, 50)
  const edges = graph.edges.slice(0, 160)
  const coords = new Map(nodes.map((node, index) => {
    const angle = index * Math.PI * 2 / Math.max(nodes.length, 1) - Math.PI / 2
    return [node.root_id, {
      x: 250 + Math.cos(angle) * (nodes.length === 1 ? 0 : 180),
      y: 235 + Math.sin(angle) * (nodes.length === 1 ? 0 : 177),
    }] as const
  }))
  return (
    <div className="atlas-network-wrap">
      <p className="atlas-overline">GRAPH-THEORETIC LAYOUT · NOT BRAIN COORDINATES</p>
      <svg className="atlas-network-svg" viewBox="0 0 500 470" role="img"
        aria-label="Directed connectivity graph with nodes distributed by layout algorithm, not anatomical position">
        <defs><marker id="atlas-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#78bed5" /></marker></defs>
        {edges.map((edge) => {
          const source = coords.get(edge.pre_root_id)
          const target = coords.get(edge.post_root_id)
          return source && target ? (
            <line key={edge.pre_root_id + ':' + edge.post_root_id}
              x1={source.x} y1={source.y} x2={target.x} y2={target.y}
              stroke="#6ca4c0" strokeOpacity=".47" strokeWidth="1.3" markerEnd="url(#atlas-arrow)">
              <title>{edge.pre_root_id + ' → ' + edge.post_root_id + ' · ' + edge.syn_count + ' identified synapses'}</title>
            </line>
          ) : null
        })}
        {nodes.map((node) => {
          const position = coords.get(node.root_id)
          if (!position) return null
          const active = node.root_id === graph.seed_root_id
          return (
            <g key={node.root_id} onClick={() => onChoose(node.root_id)} role="button"
              aria-label={'Select neuron ' + node.root_id} tabIndex={0}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onChoose(node.root_id) } }}
              style={{ cursor: 'pointer' }}>
              <circle cx={position.x} cy={position.y} r={active ? 10 : 7}
                fill={active ? '#ffd391' : '#8ad7f1'} stroke="#071524" strokeWidth="2" />
              <text x={position.x + 11} y={position.y - 9} fill="#d4eafb" fontSize="11">
                {node.root_id.slice(-5)}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="atlas-figure-foot">
        Showing up to {nodes.length} of {graph.nodes.length} selected neurons and {edges.length} of {graph.edges.length} directed edges.
        Node labels show only the final five digits. Missing connections outside the subset are not evidence of biological absence.
      </p>
      <details className="atlas-graph-table">
        <summary>Accessible complete edge list ({graph.edges.length} selected edges)</summary>
        <div className="atlas-table-scroll">
          <table><thead><tr><th>Presynaptic neuron</th><th>Postsynaptic neuron</th><th>Synapse count</th></tr></thead>
            <tbody>{graph.edges.map((edge) => (
              <tr key={edge.pre_root_id + ':' + edge.post_root_id}>
                <td>{edge.pre_root_id}</td><td>{edge.post_root_id}</td><td>{edge.syn_count}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

/** The scientific workspace is intentionally calmer than the artistic homepage. */
export function ScientificExplorer() {
  const [webglAvailable] = useState(supportsWebGL)
  const [mode, setMode] = useState<ScientificMode>('neuropil')
  const [tissueDisplay, setTissueDisplay] = useState<TissueDisplayMode>('surface')
  const [view, setView] = useState<ScientificView>('front')
  const [resetKey, setResetKey] = useState(0)
  const [root, setRoot] = useState(EXAMPLE_PROOFREAD_ID)
  const [skeleton, setSkeleton] = useState<Skeleton | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [renderMessage, setRenderMessage] = useState('')
  const [dataset, setDataset] = useState<DatasetState | null>(null)
  const [datasetError, setDatasetError] = useState('')
  const [showImportSteps, setShowImportSteps] = useState(false)
  const [checkingDataset, setCheckingDataset] = useState(false)
  const [details, setDetails] = useState<NeuronDetails | null>(null)
  const [graph, setGraph] = useState<Subgraph | null>(null)
  const [working, setWorking] = useState<'skeleton' | 'graph' | null>(null)
  const [error, setError] = useState('')

  const updateStatus = useCallback((next: 'loading' | 'ready' | 'error', message?: string) => {
    setStatus(next)
    setRenderMessage(message ?? '')
  }, [])

  const refreshDataset = useCallback(async (signal?: AbortSignal) => {
    setCheckingDataset(true)
    setDatasetError('')
    try {
      const result = await apiGet<DatasetState>('/api/v1/datasets/current', signal)
      if (signal?.aborted) return
      setDataset(result)
      // A local selected subgraph may not contain the example neuron.
      // Suggest its actual seed only if the visitor has not edited the field.
      if (result.available && result.seed_root_id && rootIdIsValid(result.seed_root_id)) {
        setRoot((value) => value === EXAMPLE_PROOFREAD_ID ? result.seed_root_id! : value)
      }
    } catch {
      if (!signal?.aborted) {
        setDatasetError('Connectome API is offline. Start FastAPI and try again.')
      }
    } finally {
      if (!signal?.aborted) setCheckingDataset(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void refreshDataset(controller.signal)
    return () => controller.abort()
  }, [refreshDataset])

  const loadRealSkeleton = async (event?: FormEvent) => {
    event?.preventDefault()
    setError('')
    setDetails(null)
    setGraph(null)
    if (!rootIdIsValid(root)) { setError('Enter a valid FAFB root ID (ASCII digits, signed 64-bit range).'); return }
    setWorking('skeleton')
    try {
      const original = await fetchSkeleton(root)
      setSkeleton(original)
      setMode('skeleton')
      setResetKey((value) => value + 1)
    } catch (issue) {
      setSkeleton(null)
      setError(issue instanceof Error ? issue.message : 'Scientific morphology unavailable')
    } finally { setWorking(null) }
  }

  const loadRealConnections = async () => {
    setError('')
    setGraph(null)
    setDetails(null)
    if (!rootIdIsValid(root)) { setError('Enter a valid FAFB root ID.'); return }
    if (!dataset?.available) {
      setShowImportSteps(true)
      setError('Connectome connections need a locally imported, original FAFB dataset. See the real-data setup guide below.')
      return
    }
    setWorking('graph')
    try {
      const [neuron, neighborhood] = await Promise.all([
        apiGet<NeuronDetails>('/api/v1/neurons/' + root),
        apiGet<Subgraph>('/api/v1/neurons/' + root + '/neighborhood?max_nodes=50&max_edges=160'),
      ])
      if (neuron.root_id !== root || neighborhood.seed_root_id !== root ||
        neighborhood.scope !== 'selected_subgraph_only' || neighborhood.structural_not_functional !== true) {
        throw new Error('The API returned a mismatched or scientifically ambiguous graph')
      }
      setDetails(neuron)
      setGraph(neighborhood)
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Connectivity lookup failed')
    } finally { setWorking(null) }
  }

  return (
    <section id="explore" className="atlas container" aria-labelledby="explore-title">
      <div className="atlas-heading">
        <div><div className="eyebrow"><span className="eyebrow-dash" /> 05.3 / SCIENTIFIC EXPLORER</div>
          <h2 id="explore-title">The real anatomy.<br /><em>The real evidence.</em></h2>
        </div>
        <p>Compare published FlyWire-space neuropil and processed FAFB tissue surfaces, inspect original neuron centerlines, and examine source-based structural connectivity. No simulated anatomy masquerading as research.</p>
      </div>

      <div className="atlas-main">
        <div className="atlas-observatory">
          <div className="atlas-tab-row" role="group" aria-label="Scientific anatomy mode">
            <button type="button" className={mode === 'neuropil' ? 'atlas-tab selected' : 'atlas-tab'}
              aria-pressed={mode === 'neuropil'} onClick={() => setMode('neuropil')}>FAFB neuropil</button>
            <button type="button" className={mode === 'tissue' ? 'atlas-tab selected' : 'atlas-tab'}
              aria-pressed={mode === 'tissue'} onClick={() => setMode('tissue')}>Whole-brain surface</button>
            <button type="button" className={mode === 'skeleton' ? 'atlas-tab selected' : 'atlas-tab'}
              aria-pressed={mode === 'skeleton'} onClick={() => setMode('skeleton')}>Neuron skeleton</button>
          </div>
          {mode !== 'skeleton' && (
            <div className="atlas-render-modes" role="group" aria-label="FAFB scientific surface display mode">
              <span className="atlas-render-label">SHOW THE SOURCE MESH AS</span>
              {([
                ['surface', 'Tissue shading'],
                ['depth', 'Depth colors'],
                ['mesh', 'Triangle mesh'],
              ] as const).map(([value, label]) => (
                <button type="button" key={value} disabled={!webglAvailable}
                  aria-pressed={tissueDisplay === value}
                  className={tissueDisplay === value ? 'selected' : ''}
                  onClick={() => setTissueDisplay(value)}>{label}</button>
              ))}
            </div>
          )}
          <div className="atlas-viewport">
            {webglAvailable ? (
              <Suspense fallback={<p className="atlas-loading">Loading scientific renderer…</p>}>
                <RealBrainScene mode={mode} skeleton={skeleton} view={view} resetKey={resetKey} tissueDisplay={tissueDisplay} onStatus={updateStatus} />
              </Suspense>
            ) : (
              <div className="atlas-loading" role="status">
                WebGL is unavailable. Authentic anatomy cannot be rendered on this device; metadata and source references remain accessible.
              </div>
            )}
            <div className="atlas-status" role="status" aria-live="polite">
              {webglAvailable ? status === 'ready' ? 'SOURCE-DERIVED 3D' :
                status === 'error' ? 'SOURCE UNAVAILABLE' : 'LOADING VERIFIED DATA' : 'WEBGL UNAVAILABLE'}
            </div>
            {status === 'error' && <p role="alert" className="atlas-error-overlay">{renderMessage}</p>}
            <span className="atlas-axis-label">Preserved relative geometry · normalized scale for display</span>
          </div>
          <div className="atlas-camera-row" role="group" aria-label="Scientific camera controls">
            {(['front', 'side', 'top'] as const).map((choice) => (
              <button key={choice} type="button" aria-pressed={view === choice}
                className={view === choice ? 'selected' : ''} disabled={!webglAvailable}
                onClick={() => setView(choice)}>{choice.charAt(0).toUpperCase() + choice.slice(1)}</button>
            ))}
            <button type="button" disabled={!webglAvailable} onClick={() => { setView('front'); setResetKey((v) => v + 1) }}>Reset camera</button>
          </div>
          {mode !== 'skeleton' && tissueDisplay === 'depth' && (
            <div className="atlas-depth-legend" role="note" aria-label="Depth colors legend">
              <span className="atlas-depth-ramp" aria-hidden="true" />
              <span>Relative mesh Z: back → front. <strong>Colors represent position, NOT anatomical regions.</strong></span>
            </div>
          )}
          {mode !== 'skeleton' && tissueDisplay === 'mesh' && (
            <p className="atlas-topology-note" role="note">Triangle edges come from the original FAFB-derived mesh; these lines are not neurons or synapses.</p>
          )}
          <p className="atlas-figure-foot">The two independent FAFB-derived surfaces represent different segmentation/preparation methods and must not be assumed geometrically identical. The 3D scene is a scientific visualization, not a measurement of live neuronal signals. The surface and skeleton use separate display coordinates until alignment has been independently verified.</p>
        </div>

        <aside className="atlas-inspector" aria-label="Scientific data inspector">
          <div className="atlas-overline">DATASET · FAFB / 783</div>
          <h3>Inspect a neuron</h3>
          <p>Enter a proofread neuron root ID. IDs are strings to preserve precision.</p>
          <form onSubmit={loadRealSkeleton} className="atlas-search-form">
            <label htmlFor="atlas-neuron">Neuron root ID</label>
            <input id="atlas-neuron" inputMode="numeric" value={root}
              onChange={(e) => setRoot(e.target.value.trim())} maxLength={19} autoComplete="off" />
            <button type="submit" className="atlas-primary" disabled={working !== null}>
              {working === 'skeleton' ? 'Loading original skeleton…' : 'Load real neuron skeleton'}
            </button>
          </form>
          <button type="button" className="atlas-secondary" disabled={working !== null || checkingDataset}
            onClick={loadRealConnections}>{working === 'graph' ? 'Searching…' : 'Inspect directed connections'}</button>
          {error && <p className="atlas-message-error" role="alert">{error}</p>}
          <div className="atlas-rule" />
          <div className="atlas-overline">CURRENT DATA AVAILABILITY</div>
          {datasetError ? <p className="atlas-message-error" role="status">{datasetError}</p> :
            dataset === null ? <p>Checking research API…</p> :
            dataset.available ? (
              <div className="atlas-metrics">
                <p><strong>{dataset.nodes_selected}</strong> selected neurons</p>
                <p><strong>{dataset.edges_selected}</strong> directed connections</p>
                <span className="atlas-caution">Imported local subset · source identity {dataset.source_identity_verified ? 'authenticated' : 'not independently authenticated'}</span>
                {dataset.seed_root_id && rootIdIsValid(dataset.seed_root_id) && (
                  <button type="button" className="atlas-seed-button" onClick={() => setRoot(dataset.seed_root_id!)}>
                    Use this dataset's seed neuron
                  </button>
                )}
                <p className="atlas-dataset-note">The selected subset may exclude other valid FAFB neuron IDs. These connection counts do not describe the complete brain.</p>
              </div>
            ) : (
              <div className="atlas-empty-data">
                <p className="atlas-caution"><strong>3D anatomy is ready. Directed connectivity needs one additional local dataset.</strong> The published FAFB mesh and neuron-skeleton viewer work independently; no fictitious connections will be generated.</p>
                <details className="atlas-import-steps" open={showImportSteps}
                  onToggle={(event) => setShowImportSteps(event.currentTarget.open)}>
                  <summary>Set up real FAFB directed connections (Windows)</summary>
                  <div className="atlas-import-body">
                    <p>1. Obtain the original FAFB v783 connectivity CSV/CSV.gz from the <a href="https://codex.flywire.ai/api/download?dataset=fafb" target="_blank" rel="noopener noreferrer">FlyWire Codex download portal ↗</a>. Codex may require a login. Do not paste an API token into this site.</p>
                    <p>2. Save the file as <code>Neuroverse/data/raw/connections_princeton.csv.gz</code>. From the <code>backend</code> folder with your Python environment activated, import a bounded original-data subset:</p>
                    <pre><code>{'python -m app.data.pipeline --connections ../data/raw/connections_princeton.csv.gz --out ../data/processed/fafb_sample.sqlite3 --max-neurons 120 --max-edges 750'}</code></pre>
                    <p>3. Restart FastAPI in that same terminal with the actual database path:</p>
                    <pre><code>{'$env:NEUROVERSE_DATASET_DB = (Resolve-Path ../data/processed/fafb_sample.sqlite3).Path\npython -m uvicorn app.main:app --reload'}</code></pre>
                    <p>For different filenames, formats and scientific limitations, see the <a href="https://github.com/krisvan123/Neuroverse/blob/main/docs/scientific-data-pipeline.md" target="_blank" rel="noopener noreferrer">complete Phase 03 import guide ↗</a>. Verify data availability again after the backend restarts.</p>
                  </div>
                </details>
              </div>
            )}
          <button type="button" className="atlas-refresh-data" onClick={() => { void refreshDataset() }} disabled={checkingDataset}>
            {checkingDataset ? 'Checking local dataset…' : 'Recheck dataset availability'}
          </button>
          {skeleton && mode === 'skeleton' && (
            <div className="atlas-observation">
              <div className="atlas-overline">SOURCE-DERIVED MORPHOLOGY</div>
              <p><strong>Neuron {skeleton.root_id}</strong></p>
              <p>{skeleton.vertex_count.toLocaleString()} recorded skeleton vertices · {skeleton.edge_count.toLocaleString()} skeletal segments</p>
              <p>Stored coordinates: {skeleton.units} · source SHA-256: <code>{skeleton.source_sha256.slice(0, 16)}…</code></p>
              <a href={skeleton.source_reference} target="_blank" rel="noopener noreferrer">Published skeleton source ↗</a>
            </div>
          )}
          {details && (
            <div className="atlas-observation">
              <div className="atlas-overline">SELECTED SUBGRAPH ONLY</div>
              <p><strong>{details.cell_type ?? 'Cell type not annotated'}</strong></p>
              <p>Incoming partners: {details.incoming_partner_count}</p>
              <p>Outgoing partners: {details.outgoing_partner_count}</p>
              <p>Identified incoming synapses: {details.incoming_selected_synapses.toLocaleString()}</p>
              <p>Identified outgoing synapses: {details.outgoing_selected_synapses.toLocaleString()}</p>
            </div>
          )}
          <div className="atlas-rule" />
          <details className="atlas-methods">
            <summary>Scientific sources and limitations</summary>
            <p><a href={TISSUE_SOURCE} target="_blank" rel="noopener noreferrer">Whole-brain mask-derived surface and preparation ↗</a></p>
            <p><a href={SKELETON_SOURCE} target="_blank" rel="noopener noreferrer">FAFB v783 skeleton hosting methodology ↗</a></p>
            <p><a href={RESEARCH_SOURCE} target="_blank" rel="noopener noreferrer">Peer-reviewed FlyWire reconstruction ↗</a></p>
            <p>The tissue mesh was manually cleaned and transformed by its source authors; it does not encode neurons or synapses. Skeletons are precomputed anatomical centerlines, not proof of electrical activity. The 2D network layout below is algorithmic rather than spatial.</p>
          </details>
        </aside>
      </div>
      {graph && <div className="atlas-connectivity">
        <div className="atlas-heading"><div><div className="eyebrow"><span className="eyebrow-dash" /> EXPLORE CONNECTIVITY</div>
          <h3>Directed structural network</h3></div>
          <p>Connections from the currently imported FAFB subset. Arrowheads represent presynaptic → postsynaptic direction; the drawn node positions have no anatomical meaning.</p>
        </div>
        <NetworkGraph graph={graph} onChoose={setRoot} />
      </div>}
    </section>
  )
}
