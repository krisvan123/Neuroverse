import { lazy, Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { supportsWebGL } from '../scenes/browserSupport'
import { fetchSkeleton, type Skeleton } from '../science/api'
import { fetchAtlas, fetchNeuronProfile, searchAtlas, type AtlasSearch, type NeuronAtlasData, type NeuronProfile } from '../science/atlas'
import type { ScientificView } from '../scenes/RealBrainScene'

const NeuronAtlasScene = lazy(() => import('../scenes/NeuronAtlasScene'))
const RealBrainScene = lazy(() => import('../scenes/RealBrainScene'))
const message = (error: unknown) => error instanceof Error ? error.message : 'The scientific source is unavailable.'

export function NeuronAtlas({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const [webgl] = useState(supportsWebGL)
  const [enabled, setEnabled] = useState(false)
  const [atlas, setAtlas] = useState<NeuronAtlasData | null>(null)
  const [mapError, setMapError] = useState('')
  const [retry, setRetry] = useState(0)
  const [draftQuery, setDraftQuery] = useState('')
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState<AtlasSearch | null>(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [profile, setProfile] = useState<NeuronProfile | null>(null)
  const [profileError, setProfileError] = useState('')
  const [skeleton, setSkeleton] = useState<Skeleton | null>(null)
  const [skeletonError, setSkeletonError] = useState('')
  const [selectionRetry, setSelectionRetry] = useState(0)
  const [view, setView] = useState<ScientificView>('front')
  const [resetKey, setResetKey] = useState(0)
  const detailHeading = useRef<HTMLHeadingElement>(null)
  const sourceControl = useRef<HTMLElement | null>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [focusing, setFocusing] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const markMapReady = useCallback(() => setMapReady(true), [])
  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current) }, [])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setMapError('')
    void fetchAtlas(controller.signal).then(data => {
      if (!controller.signal.aborted) setAtlas(data)
    }).catch(error => { if (!controller.signal.aborted) setMapError(message(error)) })
    return () => controller.abort()
  }, [enabled, retry])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setSearching(true)
    setSearchError('')
    void searchAtlas(query, offset, controller.signal).then(data => {
      if (!controller.signal.aborted) setSearch(data)
    }).catch(error => { if (!controller.signal.aborted) setSearchError(message(error)) })
      .finally(() => { if (!controller.signal.aborted) setSearching(false) })
    return () => controller.abort()
  }, [enabled, query, offset, retry])

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    setProfile(null)
    setSkeleton(null)
    setProfileError('')
    setSkeletonError('')
    detailHeading.current?.focus({ preventScroll: true })
    // Annotation and morphology fail independently; an unavailable skeleton
    // must not hide the identity and scientific context of the selected cell.
    void fetchNeuronProfile(selected, controller.signal).then(data => {
      if (!controller.signal.aborted) setProfile(data)
    }).catch(error => { if (!controller.signal.aborted) setProfileError(message(error)) })
    void fetchSkeleton(selected, controller.signal).then(data => {
      if (!controller.signal.aborted) setSkeleton(data)
    }).catch(error => { if (!controller.signal.aborted) setSkeletonError(message(error)) })
    return () => controller.abort()
  }, [selected, selectionRetry])

  const choose = useCallback((id: string) => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    const animate = !selected && !reducedMotion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setFocusing(animate)
    if (animate) transitionTimer.current = setTimeout(() => setFocusing(false), 460)
    sourceControl.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (sourceControl.current?.closest('.cells-results')) {
      viewport.current?.scrollIntoView({ block: 'center', behavior: animate ? 'smooth' : 'auto' })
    }
    setProfile(null)
    setSkeleton(null)
    setProfileError('')
    setSkeletonError('')
    setSelected(id)
    setSelectionRetry(n => n + 1)
  }, [selected, reducedMotion])

  const back = () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    setFocusing(false)
    setMapReady(false)
    setSelected(null)
    if (sourceControl.current && sourceControl.current !== document.body) sourceControl.current.focus()
    else viewport.current?.focus({ preventScroll: true })
  }
  const updateScene = useCallback((status: 'loading' | 'ready' | 'error', reason?: string) => {
    if (status === 'error') setSkeletonError(reason || 'The neuron could not be rendered.')
  }, [])
  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setQuery(draftQuery.trim())
    setOffset(0)
  }

  return <section id="neurons" className="cells container" aria-labelledby="cells-title">
    <div className="atlas-heading">
      <div><div className="eyebrow"><span className="eyebrow-dash" /> FLYWIRE / CELL ATLAS</div>
        <h2 id="cells-title">A brain of cells.<br /><em>Choose one. Look closer.</em></h2></div>
      <p>Explore mapped neurons from the adult fruit fly. Select a cell to open its reconstructed branches, identity and scientific context.</p>
    </div>
    {!enabled ? <div className="cells-welcome">
      <div><span className="atlas-overline">ORIGINAL POSITIONS · FAFB 783</span>
        <h3>Start with the whole map.</h3>
        <p>Load the published cell positions, then click a point or search by neuron ID and cell type. Detailed neuron shapes load when you select a cell.</p></div>
      <button className="atlas-primary" onClick={() => setEnabled(true)}>Load mapped neurons →</button>
    </div> : <>
      <div className="cells-toolbar">
        {selected ? <button className="cells-back" onClick={back}>← Back to neuron map</button> : <span>NEURON POSITION MAP</span>}
        <span>{atlas ? `${atlas.points.length.toLocaleString()} mapped cells · FAFB 783` : 'Loading published cell positions…'}</span>
      </div>
      <div className="cells-workspace">
        <div className="cells-observatory">
          <div ref={viewport} tabIndex={-1} className="cells-viewport" data-map-ready={mapReady} data-transition={focusing ? 'focusing' : 'idle'} aria-label={selected ? 'Selected neuron viewer' : 'Neuron map viewer'}>
            {!webgl ? <div className="atlas-loading" role="status">3D requires WebGL. You can still search every neuron and read its annotations below.</div> : (!selected || focusing) && atlas ?
              <Suspense fallback={<div className="atlas-loading">Opening cell map…</div>}>
                <NeuronAtlasScene points={atlas.points} view={view} resetKey={resetKey} onSelect={choose} onReady={markMapReady} focusId={focusing ? selected : null} />
              </Suspense> : selected ?
              skeleton && !skeletonError ? <Suspense fallback={<div className="atlas-loading">Opening neuron renderer…</div>}>
                <RealBrainScene key={selected} mode="skeleton" skeleton={skeleton} view={view} resetKey={resetKey} tissueDisplay="surface" onStatus={updateScene} />
              </Suspense> : <div className="atlas-loading" role="status">
                {skeletonError ? <><strong>Neuron shape unavailable</strong><p>{skeletonError}</p><p>The cell annotations remain available.</p>
                  <button className="atlas-secondary" onClick={() => setSelectionRetry(n => n + 1)}>Retry neuron details</button></> : 'Loading the original neuron reconstruction…'}
              </div> : <div className="atlas-loading" role="status">{mapError || 'Loading the verified FlyWire atlas…'}</div>}
            {webgl && !selected && atlas && <div className="cells-map-hint">Drag to rotate · scroll to zoom · click a cell</div>}
          </div>
          <div className="atlas-camera-row" role="group" aria-label="Cell atlas camera">
            {(['front', 'side', 'top'] as const).map(direction => <button key={direction} disabled={!webgl}
              aria-pressed={view === direction} className={view === direction ? 'selected' : ''} onClick={() => setView(direction)}>{direction[0]!.toUpperCase() + direction.slice(1)}</button>)}
            <button disabled={!webgl} onClick={() => { setView('front'); setResetKey(n => n + 1) }}>Reset view</button>
          </div>
          <p className="atlas-figure-foot">{selected
            ? 'Original neuron centerlines, centered and uniformly scaled for inspection. A reconstruction of branches, not a photograph or a full cell membrane.'
            : 'Each point marks a published cell-body location or source anchor. Point sizes aid selection; they do not represent the size or shape of a neuron.'}</p>
          {!selected && <div className="cells-legend"><span><i className="cells-soma-dot" /> Cell body (soma)</span><span><i className="cells-anchor-dot" /> Source anchor · soma not recorded</span></div>}
        </div>
        <aside key={selected || 'map'} className={selected ? 'cells-inspector cells-inspector-open' : 'cells-inspector'} aria-label="Neuron details">
          {selected ? <>
            <div className="atlas-overline">SELECTED CELL / FAFB 783</div>
            <h3 tabIndex={-1} ref={detailHeading}>{profile?.label || 'Neuron details'}</h3>
            <code className="cells-root-id">{selected}</code>
            {profileError ? <div role="alert"><p>{profileError}</p><button className="atlas-secondary" onClick={() => setSelectionRetry(n => n + 1)}>Retry annotation</button></div> : profile ? <>
              <dl className="cells-facts">
                <div><dt>Cell class</dt><dd>{profile.cell_class || 'Not annotated'}</dd></div>
                <div><dt>Cell type</dt><dd>{profile.cell_type || 'Not annotated'}</dd></div>
                <div><dt>Hemibrain type match</dt><dd>{profile.hemibrain_type || 'Not annotated'}</dd></div>
                <div><dt>Side</dt><dd>{profile.side || 'Not annotated'}</dd></div>
                <div><dt>Predicted transmitter</dt><dd>{profile.top_nt || 'Not available'}{profile.top_nt_conf && Number.isFinite(Number(profile.top_nt_conf)) ? ` · ${(Number(profile.top_nt_conf) * 100).toFixed(1)}% mean source confidence` : ''}</dd></div>
                {profile.known_nt && <div><dt>Reported transmitter</dt><dd>{profile.known_nt}<small>{profile.known_nt_source}</small></dd></div>}
              </dl>
              <div className="cells-function">
                <span className="atlas-overline">{profile.function.evidence === 'cell_class_context' ? 'CELL-CLASS CONTEXT' : 'FUNCTION NOT ESTABLISHED'}</span>
                <h4>{profile.function.title}</h4><p>{profile.function.summary}</p>
                <p className="cells-evidence-note">{profile.function.limitation}</p>
                <a href={profile.function.source_reference} target="_blank" rel="noopener noreferrer">Annotation study & methods ↗</a>
              </div>
              {profile.position_nm && <p className="cells-position">{profile.position_kind === 'soma' ? 'Soma' : 'Source anchor'} coordinates (nm): <code>{profile.position_nm.map(n => n.toLocaleString('en-US')).join(' / ')}</code></p>}
              {profile.status && <p className="atlas-caution">Source quality flag: {profile.status}</p>}
              {skeleton && <p>{skeleton.vertex_count.toLocaleString()} recorded vertices · {skeleton.edge_count.toLocaleString()} branch segments</p>}
              {skeletonError && !webgl && <p role="status">Neuron shape unavailable: {skeletonError}</p>}
              <div className="cells-source-links"><a href={profile.codex_url} target="_blank" rel="noopener noreferrer">Open cell in FlyWire Codex ↗</a>
                <a href={profile.source_url} target="_blank" rel="noopener noreferrer">Original annotation table ↗</a></div>
            </> : <p role="status">Loading this cell’s annotations…</p>}
          </> : <>
            <div className="atlas-overline">ONE POINT, ONE NEURON</div><h3>Meet the cells.</h3>
            <p>Select a point in the map, or choose a neuron from the searchable list below.</p>
            {atlas && <dl className="cells-facts cells-counts">
              <div><dt>Neurons in this release</dt><dd>{atlas.total_neurons.toLocaleString()}</dd></div>
              <div><dt>Recorded soma positions</dt><dd>{atlas.soma_count.toLocaleString()}</dd></div>
              <div><dt>Anchor positions</dt><dd>{(atlas.points.length - atlas.soma_count).toLocaleString()}</dd></div>
              {atlas.unpositioned_count > 0 && <div><dt>Without a mapped position</dt><dd>{atlas.unpositioned_count.toLocaleString()}</dd></div>}
            </dl>}
            <p>Positions come from the published FlyWire annotations. Individual branches open on selection; connections between cells are explored separately.</p>
            <a href="#explore">Explore brain surfaces & connections ↓</a>
          </>}
        </aside>
      </div>
      {mapError && <div className="cells-error" role="alert">{mapError}<button className="atlas-secondary" onClick={() => setRetry(n => n + 1)}>Retry atlas</button></div>}
      <div className="cells-catalog">
        <form className="cells-search" onSubmit={submitSearch}>
          <label htmlFor="cells-query">Find a neuron</label>
          <div><input id="cells-query" value={draftQuery} onChange={e => setDraftQuery(e.target.value)} maxLength={80} placeholder="Cell type, class or root ID" />
            <button className="atlas-primary" type="submit">Search cells</button></div>
        </form>
        {searchError && <div role="alert"><p>{searchError}</p><button className="atlas-secondary" onClick={() => setRetry(n => n + 1)}>Retry search</button></div>}
        <p className="cells-result-count" role="status">{searching ? 'Searching the annotation release…' : search ? `${search.total.toLocaleString()} matching neurons${query ? ` for “${query}”` : ''}` : ''}</p>
        {!searching && !searchError && search?.results.length === 0 && <p>No neurons match this search. Try a root ID or class such as ALPN or Kenyon_Cell.</p>}
        {!searching && !searchError && <ul className="cells-results" aria-label="Neuron search results">{search?.results.map(neuron => <li key={neuron.root_id}>
          <button aria-pressed={selected === neuron.root_id} onClick={() => choose(neuron.root_id)} aria-label={`Inspect ${neuron.label}, neuron ${neuron.root_id}`}>
            <span>{neuron.label}</span><small>{neuron.cell_class || 'Class not annotated'} · {neuron.side || 'Side unannotated'}</small>
            <code>{neuron.root_id}</code><span aria-hidden="true" className="cells-card-arrow">↗</span>
          </button></li>)}</ul>}
        {search && <div className="cells-pagination">
          <button disabled={searching || offset === 0} onClick={() => setOffset(n => Math.max(0, n - 12))}>← Previous</button>
          <span>{search.total > 0 ? `${offset + 1}–${Math.min(offset + 12, search.total)} of ${search.total.toLocaleString()}` : '0 results'}</span>
          <button disabled={searching || offset + 12 >= search.total} onClick={() => setOffset(n => n + 12)}>Next →</button>
        </div>}
      </div>
      <p className="cells-provenance">FlyWire FAFB 783 · annotations v2.1.0 · Schlegel et al. (2024). <a href="https://doi.org/10.1038/s41586-024-07686-5" target="_blank" rel="noopener noreferrer">Source study ↗</a> · <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC 4.0</a>. Original positions share one uniform display scale; source anchors are not soma measurements.</p>
    </>}
  </section>
}
