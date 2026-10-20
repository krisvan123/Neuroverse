import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BrainPoster } from './BrainPoster'
import { supportsWebGL } from '../scenes/browserSupport'
import { CAMERA_PRESETS, type CameraView, type VisualQuality, type AnatomySource, type AnatomyStyle } from '../scenes/geometry'

const BrainScene = lazy(() => import('../scenes/CosmicBrainScene'))

interface ErrorBoundaryProps { children: ReactNode }
class SceneErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true } }
  render() {
    if (this.state.failed) return (
      <div className="scene-crash-fallback" role="status">
        <BrainPoster />
        <span>3D rendering stopped on this device. The illustrated alternative remains available.</span>
      </div>
    )
    return this.props.children
  }
}

const VIEWS: Array<{ id: CameraView; label: string }> = [
  { id: 'front', label: 'Front view' },
  { id: 'left', label: 'Left view' },
  { id: 'right', label: 'Right view' },
  { id: 'top', label: 'Top view' },
]

interface BrainExperienceProps {
  paused: boolean
  onToggleMotion: () => void
}

/**
 * UI controls stay in the DOM, not inside WebGL. They remain keyboard reachable
 * and clearly distinguish published tissue anatomy from decorative cosmic details.
 */
export function BrainExperience({ paused, onToggleMotion }: BrainExperienceProps) {
  const [webglSupported] = useState(supportsWebGL)
  const [sceneReady, setSceneReady] = useState(false)
  const [quality, setQuality] = useState<VisualQuality>('balanced')
  const stageRef = useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = useState(true)
  const [tabVisible, setTabVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [anatomySource, setAnatomySource] = useState<AnatomySource>('neuropil')
  const [anatomyStyle, setAnatomyStyle] = useState<AnatomyStyle>('shaded')
  const [view, setView] = useState<CameraView>('front')
  const [resetToken, setResetToken] = useState(0)
  const onReady = useCallback(() => setSceneReady(true), [])
  const [modelState, setModelState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [modelMessage, setModelMessage] = useState('')
  const onModelStatus = useCallback((state: 'loading' | 'ready' | 'error', message?: string) => {
    setModelState(state)
    setModelMessage(message ?? '')
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setOnScreen(entry.isIntersecting)
    }, { rootMargin: '120px 0px' })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const sceneEnabled = webglSupported
  const renderingPaused = paused || !onScreen || !tabVisible
  const handleReset = () => {
    setView('front')
    setResetToken((previous) => previous + 1)
  }

  return (
    <div className="brain-experience" data-quality={quality}>
      <div className="brain-stage" ref={stageRef} data-anatomy-style={anatomyStyle} data-render-state={renderingPaused ? 'paused' : 'animating'}>
        <div className="brain-stage-outline" aria-hidden="true" />
        {!sceneReady && <div className="poster-underlay"><BrainPoster /></div>}
        {sceneEnabled && (
          <SceneErrorBoundary>
            <Suspense fallback={<div className="scene-loading" role="status">Preparing interactive 3D visualization…</div>}>
              <BrainScene
                quality={quality}
                paused={renderingPaused}
                anatomySource={anatomySource}
                anatomyStyle={anatomyStyle}
                view={view}
                resetToken={resetToken}
                onReady={onReady}
                onModelStatus={onModelStatus}
              />
            </Suspense>
          </SceneErrorBoundary>
        )}
        {sceneEnabled && sceneReady && modelState !== 'ready' && (
          <div className={modelState === 'error' ? 'hero-model-alert' : 'hero-model-loading'} role="status">
            {modelState === 'error' ? modelMessage : 'Loading source-verified 3D fly-brain anatomy…'}
          </div>
        )}
        {!sceneEnabled && (
          <div className="poster-fallback" role="status">
            <span>Static visualization — WebGL unavailable</span>
          </div>
        )}
        <div className="brain-stage-kicker">
          <span className="live-dot" aria-hidden="true" />
          {modelState === 'ready' ? 'INTERACTIVE / VERIFIED FAFB 3D' : 'INTERACTIVE / 3D VIEWER'}
        </div>
        <span className="brain-stage-index" aria-hidden="true">NV—005.2 / FAFB NEUROANATOMY</span>
        <div className="brain-stage-render-mode" aria-live="polite">{anatomyStyle === 'shaded' ? 'SOLID ANATOMY' : anatomyStyle === 'depth' ? 'COORDINATE DEPTH' : 'TRIANGLE WIREFRAME'}</div>
        <div className="brain-stage-caption">{anatomySource === 'neuropil' ? 'FAFB-ALIGNED NEUROPIL SURFACE' : 'FAFB WHOLE-BRAIN TISSUE SURFACE'} · ORIGINAL PUBLISHED MESH</div>
      </div>

      <div className="brain-anatomy-controls">
        <div className="brain-source-choices" role="group" aria-label="Original fly-brain anatomical source">
          <span className="brain-source-heading">PUBLISHED FAFB SHAPE</span>
          <button type="button" aria-pressed={anatomySource === 'neuropil'} disabled={!sceneEnabled}
            onClick={() => setAnatomySource('neuropil')}>Neuropil</button>
          <button type="button" aria-pressed={anatomySource === 'tissue'} disabled={!sceneEnabled}
            onClick={() => setAnatomySource('tissue')}>Whole tissue</button>
        </div>
        <div className="brain-surface-choices" role="group" aria-label="Hero anatomical material">
          <span className="brain-source-heading">INSPECT AS</span>
          {([
            ['shaded', 'Anatomy'],
            ['depth', 'Depth'],
            ['mesh', 'Wireframe'],
          ] as const).map(([mode, name]) => (
            <button type="button" key={mode} aria-pressed={anatomyStyle === mode}
              disabled={!sceneEnabled} onClick={() => setAnatomyStyle(mode)}>{name}</button>
          ))}
        </div>
      </div>
      {anatomyStyle === 'shaded' && <p className="brain-source-disclaimer" role="note">Anatomy shows the original published surface as a solid shaded shape; fine contours are from the source mesh, not drawn triangle edges.</p>}
      {anatomyStyle === 'depth' && <p className="brain-source-disclaimer" role="note">Depth colors encode source-mesh coordinates, not biological brain regions.</p>}
      {anatomyStyle === 'mesh' && <p className="brain-source-disclaimer" role="note">Wireframe edges are published mesh triangles, not neurons.</p>}

      <div className="brain-controls" aria-label="Three-dimensional visualization controls">
        <div className="brain-view-controls" role="group" aria-label="Camera angle">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'brain-control active' : 'brain-control'}
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
              disabled={!sceneEnabled}
              title={item.label}
            >
              {item.label}
            </button>
          ))}
          <button
            className="brain-control brain-control-reset"
            type="button"
            disabled={!sceneEnabled}
            onClick={handleReset}
            title="Reset camera to front"
          >
            Reset
          </button>
        </div>
        <div className="brain-prefs">
          <label className="quality-label" htmlFor="neuro-quality">Quality</label>
          <select
            id="neuro-quality"
            value={quality}
            onChange={(event) => setQuality(event.target.value as VisualQuality)}
            disabled={!sceneEnabled}
          >
            <option value="high">High</option>
            <option value="balanced">Balanced</option>
            <option value="saver">Saver</option>
          </select>
          <button type="button" className="motion-control" onClick={onToggleMotion} aria-pressed={paused}>
            {paused ? 'Resume motion' : 'Pause motion'}
          </button>
        </div>
      </div>
      <p className="brain-instructions">
        {sceneEnabled
          ? 'Drag to orbit · Scroll over the object to zoom · Use camera buttons for keyboard access. 3D motion pauses automatically when offscreen or the tab is hidden.'
          : 'WebGL is unavailable. The accessible illustration and science references remain visible.'}
      </p>
      <details className="visualization-disclosure">
        <summary>About this 3D visualization</summary>
        <p>
          Choose between two independently published, pinned FlyWire-space meshes:
          a FAFB14-aligned <strong>neuropil template</strong> and a manually processed
          <strong> whole-brain tissue-mask surface</strong>. The Neuroverse API authenticates
          both with an exact upstream Git blob checksum; centering and uniform scaling
          are display-only. Shading, local-Z depth colors and wireframe are visual
          inspection styles, not segmentation labels or reconstructed individual neurons.
          <strong> Neither mesh is the original unprocessed EM volume, and they are
          not claimed to be perfectly registered to each other.</strong> Orbiting DNA,
          stars and lighting are decorative rather than anatomical. Read the
          <a href="https://github.com/navis-org/navis-flybrains/blob/273333c8d8bf5adeebebd274e554621462e388bd/flybrains/templates.py"
          target="_blank" rel="noopener noreferrer">FlyWire neuropil template provenance</a> and
          <a href="https://github.com/navis-org/navis-flybrains/blob/273333c8d8bf5adeebebd274e554621462e388bd/flybrains/meshes/FLYWIRE_whole_brain.md"
          target="_blank" rel="noopener noreferrer"> whole-brain tissue preparation</a>.
        </p>
      </details>
      <span className="sr-only">Available camera presets: {Object.keys(CAMERA_PRESETS).join(', ')}.</span>
    </div>
  )
}
