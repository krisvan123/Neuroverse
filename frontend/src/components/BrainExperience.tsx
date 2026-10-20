import { Component, Suspense, lazy, useCallback, useState, type ReactNode } from 'react'
import { BrainPoster } from './BrainPoster'
import { supportsWebGL } from '../scenes/browserSupport'
import { CAMERA_PRESETS, type CameraView, type VisualQuality } from '../scenes/geometry'

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
  const [view, setView] = useState<CameraView>('front')
  const [resetToken, setResetToken] = useState(0)
  const onReady = useCallback(() => setSceneReady(true), [])
  const [modelState, setModelState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [modelMessage, setModelMessage] = useState('')
  const onModelStatus = useCallback((state: 'loading' | 'ready' | 'error', message?: string) => {
    setModelState(state)
    setModelMessage(message ?? '')
  }, [])

  const sceneEnabled = webglSupported
  const handleReset = () => {
    setView('front')
    setResetToken((previous) => previous + 1)
  }

  return (
    <div className="brain-experience" data-quality={quality}>
      <div className="brain-stage">
        <div className="brain-stage-outline" aria-hidden="true" />
        {!sceneReady && <div className="poster-underlay"><BrainPoster /></div>}
        {sceneEnabled && (
          <SceneErrorBoundary>
            <Suspense fallback={<div className="scene-loading" role="status">Preparing interactive 3D visualization…</div>}>
              <BrainScene
                quality={quality}
                paused={paused}
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
            {modelState === 'error' ? modelMessage : 'Loading authentic 3D FAFB tissue surface…'}
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
        <span className="brain-stage-index" aria-hidden="true">NV—005 / FAFB ANATOMY</span>
        <div className="brain-stage-caption">FAFB TISSUE SURFACE · NOT INDIVIDUAL NEURON MORPHOLOGY</div>
      </div>

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
          ? 'Drag to orbit · Scroll over the object to zoom · Use camera buttons for keyboard access.'
          : 'WebGL is unavailable. The accessible illustration and science references remain visible.'}
      </p>
      <details className="visualization-disclosure">
        <summary>About this 3D visualization</summary>
        <p>
          The brain surface is loaded from a published FAFB tissue-mask-derived mesh, pinned to
          its upstream repository version and verified by the Neuroverse backend.
          The sculpture preserves the source shape and topology, using only a uniform
          scale and rotation for display. <strong>This is not a live brain scan or
          a complete reconstruction of individual neuron membranes.</strong>
          Lighting, animated DNA, orbit rings, and stars are artistic additions and
          have no biological meaning. <a href="https://github.com/navis-org/navis-flybrains/blob/273333c8d8bf5adeebebd274e554621462e388bd/flybrains/meshes/FLYWIRE_whole_brain.md"
          target="_blank" rel="noopener noreferrer">Read the tissue mesh provenance</a>.
        </p>    </p>
      </details>
      <span className="sr-only">Available camera presets: {Object.keys(CAMERA_PRESETS).join(', ')}.</span>
    </div>
  )
}
