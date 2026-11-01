import { lazy, Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { supportsWebGL } from '../scenes/browserSupport'
import { fetchSkeleton, ResearchApiError, type Skeleton } from '../science/api'
import { fetchAtlas, fetchNeuronProfile, searchAtlas, type AtlasSearch, type NeuronAtlasData, type NeuronProfile } from '../science/atlas'
import type { ScientificView } from '../scenes/RealBrainScene'
import { CELL_PALETTE, overviewIds } from '../scenes/connectomeGeometry'
import { NeuronProfilePanel } from './NeuronProfilePanel'
import { ScientificExplorer } from './ScientificExplorer'

const NeuronAtlasScene = lazy(() => import('../scenes/NeuronAtlasScene'))
const RealBrainScene = lazy(() => import('../scenes/RealBrainScene'))
const message = (error: unknown) => error instanceof Error ? error.message : 'The scientific source is unavailable.'

export function NeuronAtlas({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const [webgl] = useState(supportsWebGL)
  const stage = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [tabVisible, setTabVisible] = useState(!document.hidden)
  const [paused, setPaused] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [atlas, setAtlas] = useState<NeuronAtlasData | null>(null)
  const [mapError, setMapError] = useState('')
  const [retry, setRetry] = useState(0)
  const [traces, setTraces] = useState<Skeleton[]>([])
  const [traceState, setTraceState] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [traceRetry, setTraceRetry] = useState(0)
  const [showTraces, setShowTraces] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
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
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [focusing, setFocusing] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const markMapReady = useCallback(() => setMapReady(true), [])
  const stopRotation = useCallback(() => setPaused(true), [])
  const rotating = !paused && !reducedMotion && !selected && onScreen && tabVisible

  useEffect(() => {
    // Vite renders the section after the browser's initial fragment lookup.
    const followLink = () => {
      if (window.location.hash === '#explore' || window.location.hash === '#neurons') {
        setEnabled(true)
        stage.current?.closest('section')?.scrollIntoView({ block: 'start', behavior: 'instant' })
      }
    }
    followLink()
    window.addEventListener('hashchange', followLink)
    return () => window.removeEventListener('hashchange', followLink)
  }, [])

  useEffect(() => {
    if (!stage.current || typeof IntersectionObserver === 'undefined') { setEnabled(true); setOnScreen(true); return }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) { setOnScreen(entry.isIntersecting); if (entry.isIntersecting) setEnabled(true) }
    }, { rootMargin: '180px' })
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const visible = () => setTabVisible(!document.hidden)
    const expanded = () => setFullscreen(document.fullscreenElement === stage.current)
    document.addEventListener('visibilitychange', visible); document.addEventListener('fullscreenchange', expanded)
    return () => { document.removeEventListener('visibilitychange', visible); document.removeEventListener('fullscreenchange', expanded) }
  }, [])
  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current) }, [])
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setMapError('')
    void fetchAtlas(controller.signal).then(data => { if (!controller.signal.aborted) setAtlas(data) })
      .catch(error => { if (!controller.signal.aborted) setMapError(message(error)) })
    return () => controller.abort()
  }, [enabled, retry])

  useEffect(() => {
    if (!atlas || !webgl) return
    const controller = new AbortController()
    const ids = overviewIds(atlas.points)
    let cursor = 0, edges = 0, stopped = false, loaded = 0
    setTraces([]); setTraceState('loading')
    const worker = async () => {
      while (!controller.signal.aborted && !stopped && cursor < ids.length) {
        const id = ids[cursor++]!
        try {
          const original = await fetchSkeleton(id, controller.signal)
          if (controller.signal.aborted) return
          if (original.coordinate_space !== 'FlyWire FAFB v783 precomputed skeleton coordinate frame' || !original.edge_count) continue
          if (edges + original.edge_count > 600000) { stopped = true; break }
          edges += original.edge_count; loaded++
          setTraces(previous => [...previous, original])
        } catch (error) {
          if (controller.signal.aborted) return
          // A source outage stops the queue, rather than repeating dozens of failed requests.
          if (!(error instanceof ResearchApiError) || error.status !== 404) stopped = true
        }
      }
    }
    void Promise.all([worker(), worker()]).then(() => {
      if (!controller.signal.aborted) setTraceState(loaded ? 'ready' : 'unavailable')
    })
    return () => controller.abort()
  }, [atlas, webgl, traceRetry])

  useEffect(() => {
    if (catalogOpen) {
      const input = document.getElementById('cells-query')
      input?.focus({ preventScroll: true })
      input?.closest('.cells-catalog')?.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'instant' : 'smooth' })
    }
  }, [catalogOpen, reducedMotion])
  useEffect(() => {
    if (!catalogOpen) return
    const controller = new AbortController()
    setSearching(true); setSearchError('')
    void searchAtlas(query, offset, controller.signal).then(data => { if (!controller.signal.aborted) setSearch(data) })
      .catch(error => { if (!controller.signal.aborted) setSearchError(message(error)) })
      .finally(() => { if (!controller.signal.aborted) setSearching(false) })
    return () => controller.abort()
  }, [catalogOpen, query, offset, retry])

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    setProfile(null); setSkeleton(null); setProfileError(''); setSkeletonError('')
    detailHeading.current?.focus({ preventScroll: true })
    void fetchNeuronProfile(selected, controller.signal).then(data => { if (!controller.signal.aborted) setProfile(data) })
      .catch(error => { if (!controller.signal.aborted) setProfileError(message(error)) })
    void fetchSkeleton(selected, controller.signal).then(data => { if (!controller.signal.aborted) setSkeleton(data) })
      .catch(error => { if (!controller.signal.aborted) setSkeletonError(message(error)) })
    return () => controller.abort()
  }, [selected, selectionRetry])

  const choose = useCallback((id: string) => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    const animate = !selected && !reducedMotion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setFocusing(animate); setPaused(true); setHovered(null)
    if (animate) transitionTimer.current = setTimeout(() => setFocusing(false), 460)
    sourceControl.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (sourceControl.current?.closest('.cells-results')) viewport.current?.scrollIntoView({ block: 'center', behavior: animate ? 'smooth' : 'auto' })
    setProfile(null); setSkeleton(null); setProfileError(''); setSkeletonError('')
    setSelected(id); setSelectionRetry(n => n + 1)
  }, [selected, reducedMotion])
  const back = () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    setFocusing(false); if (skeleton && !skeletonError) setMapReady(false); setSelected(null); setResetKey(n => n + 1)
    if (sourceControl.current && sourceControl.current !== document.body) sourceControl.current.focus()
    else viewport.current?.focus({ preventScroll: true })
  }
  const updateScene = useCallback((status: 'loading' | 'ready' | 'error', reason?: string) => {
    if (status === 'error') setSkeletonError(reason || 'The neuron could not be rendered.')
  }, [])
  const submitSearch = (event: FormEvent) => { event.preventDefault(); setQuery(draftQuery.trim()); setOffset(0) }
  const filter = (value: string) => { setCatalogOpen(true); setDraftQuery(value); setQuery(value); setOffset(0) }
  const expand = async () => {
    try { if (fullscreen) await document.exitFullscreen(); else await stage.current?.requestFullscreen() }
    catch { /* A browser may decline fullscreen; the inline viewer remains usable. */ }
  }
  const isolated = !!selected && !!skeleton && !skeletonError && !focusing

  return <section id="explore" className="cells connectome container" aria-labelledby="connectome-title">
    <span id="neurons" className="connectome-anchor" />
    <div className="connectome-heading"><div>
      <div className="eyebrow"><span className="eyebrow-dash" /> EXPLORE THE CONNECTOME</div>
      <h2 id="connectome-title">Small brain.<br /><em>Extraordinary universe.</em></h2>
    </div><p>Turn it. Explore it. Meet the neurons.<br />A whole fly brain, mapped one cell at a time.</p></div>
    <div ref={stage} className={'connectome-shell' + (selected ? ' has-selection' : '')} data-render-state={rotating ? 'rotating' : 'paused'}>
      <div className="connectome-topbar"><div className="connectome-dataset"><span className="connectome-live" /><strong>FAFB</strong><span>v783</span><span className="connectome-dataset-name">Female adult fly brain</span></div>
        <div className="connectome-top-actions"><button onClick={() => setCatalogOpen(value => !value)} aria-expanded={catalogOpen}>⌕ Find a neuron</button>
          <button onClick={() => { void expand() }} disabled={!document.fullscreenEnabled} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>⛶</button></div>
      </div>
      <div className="cells-workspace">
        <div className="cells-observatory">
          <div ref={viewport} tabIndex={-1} className="cells-viewport" data-map-ready={mapReady} data-transition={focusing ? 'focusing' : 'idle'} aria-label={selected ? 'Selected neuron viewer' : 'Neuron map viewer'}>
            {!webgl ? <div className="connectome-empty" role="status"><strong>Explore the neurons, even without 3D.</strong><p>This browser cannot render WebGL. Search still opens each cell’s scientific details.</p><button onClick={() => setCatalogOpen(true)}>Browse neurons →</button></div> : isolated ?
              <Suspense fallback={<div className="connectome-empty">Opening neuron…</div>}><RealBrainScene key={selected} mode="skeleton" skeleton={skeleton} view={view} resetKey={resetKey} tissueDisplay="surface" onStatus={updateScene} /></Suspense> : atlas ?
              <Suspense fallback={<div className="connectome-empty">Preparing the brain…</div>}><NeuronAtlasScene points={atlas.points} traces={traces} view={view} resetKey={resetKey}
                onSelect={choose} onReady={markMapReady} focusId={selected} hoveredId={hovered} onHover={setHovered}
                playing={rotating} active={onScreen && tabVisible} reducedMotion={reducedMotion} onInteract={stopRotation} showTraces={showTraces} /></Suspense> :
              <div className="connectome-empty" role="status"><span className="connectome-loader" /><strong>{mapError || 'Opening the FlyWire brain…'}</strong>
                {mapError && <button onClick={() => setRetry(n => n + 1)}>Retry brain preview</button>}</div>}
            {atlas && <div className="connectome-stage-label"><span>{selected ? 'ONE NEURON. A CLOSER LOOK.' : atlas.total_neurons.toLocaleString() + ' STORIES. ONE BRAIN.'}</span>
              <strong>{selected ? profile?.label || selected : atlas.total_neurons.toLocaleString() + ' mapped cells'}</strong>
              <small>{isolated ? 'Original branch reconstruction' : traces.length && showTraces ? traces.length + ' traced neurons · spatial overview' : 'Original cell positions · color identifies cells'}</small></div>}
            {selected && <button className="connectome-return" onClick={back}>← Whole brain</button>}
            {!selected && webgl && <div className="connectome-gesture">Drag to orbit <span>·</span> Scroll to zoom <span>·</span> Click to discover</div>}
            {hovered && !selected && <div className="connectome-hover">Neuron <code>{hovered}</code><span>Click to explore ↗</span></div>}
            {selected && skeletonError && <div className="connectome-source-notice" role="status">Original branches are temporarily unavailable. Showing the selected cell’s mapped location.<button onClick={() => setSelectionRetry(n => n + 1)}>Retry shape</button></div>}
          </div>
          <div className="connectome-controls"><div role="group" aria-label="Brain motion and camera">
            <button className="connectome-play" disabled={!webgl || !!selected || reducedMotion} aria-pressed={!paused && !reducedMotion} onClick={() => setPaused(value => !value)}>{paused || reducedMotion ? '▶ Rotate brain' : 'Ⅱ Pause rotation'}</button>
            {(['front', 'side', 'top'] as const).map(direction => <button key={direction} disabled={!webgl} aria-pressed={view === direction}
              onClick={() => { setView(direction); setPaused(true); setResetKey(n => n + 1) }}>{direction[0]!.toUpperCase() + direction.slice(1)}</button>)}
            <button disabled={!webgl} onClick={() => { setView('front'); setResetKey(n => n + 1) }}>Reset</button>
          </div><div className="connectome-layer-control"><button onClick={() => setShowTraces(value => !value)} aria-pressed={showTraces} disabled={!!selected || traces.length === 0}>Neuron branches</button><span className="connectome-spectrum" aria-label="Colors distinguish neurons">{CELL_PALETTE.map(color => <i key={color} style={{ background: color }} />)}</span></div></div>
          {isolated && skeleton && <p className="connectome-shape-note">{skeleton.vertex_count.toLocaleString()} recorded vertices · {skeleton.edge_count.toLocaleString()} branch segments · colors are visual identifiers, not activity.</p>}
        </div>
        {selected && <NeuronProfilePanel key={selected} id={selected} profile={profile} error={profileError} headingRef={detailHeading} onClose={back} onRetry={() => setSelectionRetry(n => n + 1)} />}
      </div>
      {!selected && <div className="connectome-bottom"><div><span className="connectome-source-dot" />{traceState === 'loading' && atlas && webgl ? 'Loading original neuron branches…' : traces.length ? traces.length + ' original reconstructions loaded' : 'Published cell positions'}
        {traceState === 'unavailable' && <><span className="connectome-subtle"> · Branch source unavailable</span><button onClick={() => setTraceRetry(n => n + 1)}>Retry</button></>}</div>
        <div className="connectome-quick"><span>DISCOVER</span><button onClick={() => filter('Kenyon_Cell')}>Memory & learning ↗</button><button onClick={() => filter('ALPN')}>Olfactory circuits ↗</button></div></div>}
    </div>
    {catalogOpen && <div className="cells-catalog" id="neuron-catalog">
      <form className="cells-search" onSubmit={submitSearch}><label htmlFor="cells-query">Find a neuron</label><div><input id="cells-query" value={draftQuery} onChange={e => setDraftQuery(e.target.value)} maxLength={80} placeholder="Cell type, class or root ID" /><button className="atlas-primary" type="submit">Search cells</button></div></form>
      {searchError && <div role="alert"><p>{searchError}</p><button className="atlas-secondary" onClick={() => setRetry(n => n + 1)}>Retry search</button></div>}
      <p className="cells-result-count" role="status">{searching ? 'Searching the annotation release…' : search ? `${search.total.toLocaleString()} matching neurons${query ? ` for “${query}”` : ''}` : ''}</p>
      {!searching && !searchError && search?.results.length === 0 && <p>No neurons match this search. Try a root ID or class such as ALPN or Kenyon_Cell.</p>}
      {!searching && !searchError && <ul className="cells-results" aria-label="Neuron search results">{search?.results.map(neuron => <li key={neuron.root_id}><button aria-pressed={selected === neuron.root_id} onClick={() => choose(neuron.root_id)} aria-label={`Inspect ${neuron.label}, neuron ${neuron.root_id}`}>
        <span>{neuron.label}</span><small>{neuron.cell_class || 'Class not annotated'} · {neuron.side || 'Side unannotated'}</small><code>{neuron.root_id}</code><span aria-hidden="true" className="cells-card-arrow">↗</span></button></li>)}</ul>}
      {search && <div className="cells-pagination"><button disabled={searching || offset === 0} onClick={() => setOffset(n => Math.max(0, n - 12))}>← Previous</button><span>{search.total > 0 ? `${offset + 1}–${Math.min(offset + 12, search.total)} of ${search.total.toLocaleString()}` : '0 results'}</span><button disabled={searching || offset + 12 >= search.total} onClick={() => setOffset(n => n + 12)}>Next →</button></div>}
    </div>}
    <div className="connectome-footnote"><p>Real FlyWire data. Colors distinguish cells; motion is a viewing aid. The overview loads a bounded set of branches, not every neuron’s morphology.</p><span><a href="https://doi.org/10.1038/s41586-024-07686-5" target="_blank" rel="noopener noreferrer">Schlegel et al.</a> · <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC 4.0 ↗</a></span></div>
    <details className="connectome-research" onToggle={e => setToolsOpen(e.currentTarget.open)}><summary>Data sources & advanced research tools <span>Surface meshes, connectivity and import guides</span></summary>{toolsOpen && <ScientificExplorer />}</details>
  </section>
}
