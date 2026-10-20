import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js'
import { getApiBaseUrl } from '../api/client'
import { applySourceDepthColors } from './surfaceColors'
import {
  CAMERA_PRESETS, SCENE_BUDGETS, makeDNA, makeStars,
  type CameraView, type VisualQuality, type AnatomySource, type AnatomyStyle,
} from './geometry'

export interface BrainSceneProps {
  quality: VisualQuality
  paused: boolean
  anatomySource: AnatomySource
  anatomyStyle: AnatomyStyle
  view: CameraView
  resetToken: number
  onReady: () => void
  onModelStatus: (state: 'loading' | 'ready' | 'error', message?: string) => void
}

/** Developer-only renderer telemetry for honest browser-based frame-rate audits. */
function SceneFrameProbe() {
  const samples = useRef<number[]>([])
  const previous = useRef(0)
  const counter = useRef(0)
  useFrame(({ gl }) => {
    if (!import.meta.env.DEV) return
    const current = performance.now()
    if (previous.current > 0) {
      samples.current.push(current - previous.current)
      if (samples.current.length > 90) samples.current.shift()
    }
    previous.current = current
    counter.current += 1
    if (counter.current % 15 !== 0 || samples.current.length === 0) return
    const ordered = [...samples.current].sort((one, two) => one - two)
    const statistics = {
      sampledSceneFrames: ordered.length,
      renderedSceneFrames: counter.current,
      medianSceneFrameMs: ordered[Math.floor(ordered.length / 2)] ?? 0,
      rendererDrawCalls: gl.info.render.calls,
      note: 'Headless/dev scene frames for on-screen/off-screen profiling; not a physical GPU benchmark',
    }
    ;(window as typeof window & { __neuroverseSceneDiagnostics?: typeof statistics }).__neuroverseSceneDiagnostics = statistics
  })
  return null
}

/**
 * Render *published FAFB specimen-derived tissue* from the verified backend.
 *
 * Unlike the earlier stacked polyhedra, every visible surface triangle comes
 * from the pinned and checksum-validated scientific PLY (see backend/app/data/tissue.py).
 * The normalized presentation transform is uniform: no fabricated anatomy.
 */
function AuthenticBrain({ quality, paused, onModelStatus, anatomySource, anatomyStyle }: Pick<BrainSceneProps, 'quality' | 'paused' | 'onModelStatus' | 'anatomySource' | 'anatomyStyle'>) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const group = useRef<THREE.Group>(null)

  useEffect(() => {
    const controller = new AbortController()
    onModelStatus('loading')
    setGeometry(null)
    async function load() {
      const endpoint = anatomySource === 'neuropil' ? '/api/v1/brain/neuropil-mesh' : '/api/v1/brain/tissue-mesh'
      const response = await fetch(getApiBaseUrl() + endpoint, {
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Source-derived brain anatomy unavailable. Verify that FastAPI is running.')
      const checksum = response.headers.get('X-Neuroverse-Source-SHA256')
      if (!checksum || !/^[a-f0-9]{64}$/.test(checksum)) {
        throw new Error('The research mesh lacks a validated source checksum')
      }
      const rawBytes = await response.arrayBuffer()
      if (rawBytes.byteLength < 1000 || rawBytes.byteLength > 20_000_000) {
        throw new Error('Research mesh has an unexpected file size')
      }
      const parsed = new PLYLoader().parse(rawBytes)
      try {
        parsed.computeBoundingBox()
        if (!parsed.boundingBox) throw new Error('Research mesh has no 3D bounds')
        const size = new THREE.Vector3()
        parsed.boundingBox.getSize(size)
        const extent = Math.max(size.x, size.y, size.z)
        if (!Number.isFinite(extent) || extent <= 0) throw new Error('Research mesh has invalid geometry')
        if (!parsed.getAttribute('normal')) parsed.computeVertexNormals()
        // Preserve topology, proportions and contours from the original surface.
        parsed.center()
        const scale = 5.7 / extent
        parsed.scale(scale, scale, scale)
        applySourceDepthColors(parsed)
        if (controller.signal.aborted) return
        setGeometry(parsed)
        onModelStatus('ready')
      } catch (error) {
        parsed.dispose()
        throw error
      }
    }
    load().catch((error: unknown) => {
      if (!controller.signal.aborted) {
        onModelStatus('error', error instanceof Error ? error.message : 'The scientific brain mesh could not be loaded')
      }
    })
    return () => controller.abort()
  }, [onModelStatus, anatomySource])

  useEffect(() => () => geometry?.dispose(), [geometry])

  useFrame((state, delta) => {
    if (!group.current || paused || quality === 'saver') return
    group.current.rotation.y += Math.min(delta, 0.05) * 0.09
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.06
  })

  if (!geometry) return null
  return (
    <group ref={group} rotation={[0.06, -0.14, 0]}>
      {/* Both surfaces are authenticated *source-derived* FlyWire/FAFB PLYs.
          Materials enhance depth but NEVER add triangles or false brain regions. */}
      <mesh name="neuroverse-published-anatomy" geometry={geometry} castShadow receiveShadow>
        {anatomyStyle === 'shaded' && (
          <meshStandardMaterial
            color="#96beca"
            roughness={0.86}
            metalness={0}
            emissive="#0c2330"
            emissiveIntensity={0.012}
            flatShading={false}
            side={THREE.DoubleSide}
          />
        )}
        {anatomyStyle === 'depth' && (
          <meshStandardMaterial vertexColors roughness={0.7} metalness={0}
            side={THREE.DoubleSide} />
        )}
        {anatomyStyle === 'mesh' && (
          <meshStandardMaterial color="#264253" roughness={0.92}
            side={THREE.DoubleSide} transparent opacity={0.19} />
        )}
      </mesh>
      {anatomyStyle === 'mesh' && (
        <mesh name="neuroverse-wireframe-overlay" geometry={geometry}>
          <meshBasicMaterial color="#a8efff" wireframe transparent
            opacity={0.68} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

/** Independent sky-space geometry: orbiting the camera cannot sweep stars to one side. */
function ParticleField({ quality }: { quality: VisualQuality }) {
  const geometry = useMemo(() => makeStars(SCENE_BUDGETS[quality].stars), [quality])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial size={0.055} sizeAttenuation vertexColors transparent opacity={0.78} depthWrite={false} />
    </points>
  )
}

/** Decorative DNA in the *environment*, not connected to actual fly morphology. */
function DNAHelix({ x, paused, quality }: { x: number; paused: boolean; quality: VisualQuality }) {
  const ref = useRef<THREE.Group>(null)
  const tracer = useRef<THREE.Mesh>(null)
  const geometry = useMemo(makeDNA, [])
  const strands = useMemo(
    () => geometry.strands.map((strand, index) => new THREE.Line(
      strand,
      new THREE.LineBasicMaterial({
        color: index === 0 ? '#7ce7ff' : '#cfadff',
        transparent: true,
        opacity: 0.77,
        depthWrite: false,
      }),
    )),
    [geometry],
  )
  useEffect(() => () => {
    for (const line of strands) line.material.dispose()
    for (const strand of geometry.strands) strand.dispose()
    geometry.rungs.dispose()
  }, [geometry, strands])

  useFrame((state, delta) => {
    if (!ref.current || paused || quality === 'saver') return
    const elapsed = state.clock.elapsedTime
    ref.current.rotation.y += Math.min(delta, 0.05) * 0.56
    ref.current.rotation.x = 0.16 + Math.sin(elapsed * 0.4) * 0.05
    for (const [index, line] of strands.entries()) {
      const material = line.material as THREE.LineBasicMaterial
      material.opacity = 0.68 + Math.sin(elapsed * 1.2 + index * 2.2) * 0.15
    }
    const progress = (elapsed * 0.13) % 1
    const theta = progress * Math.PI * 6
    tracer.current?.position.set(
      Math.cos(theta) * 0.36,
      (progress - 0.5) * 4.2,
      Math.sin(theta) * 0.36,
    )
  })

  return (
    <group ref={ref} position={[x, -0.08, 0.72]}
      rotation={[0.16, 0.12, x < 0 ? -0.26 : 0.22]}
      scale={quality === 'saver' ? 0.64 : 0.73}>
      {strands.map((strand, index) => (
        <primitive key={index} object={strand} />
      ))}
      <lineSegments geometry={geometry.rungs}>
        <lineBasicMaterial color="#abd9f8" transparent opacity={0.39} depthWrite={false} />
      </lineSegments>
      <mesh ref={tracer}>
        <sphereGeometry args={[0.085, 10, 10]} />
        <meshBasicMaterial color="#dbfbff" />
      </mesh>
    </group>
  )
}

/** OrbitControls respects manual drag and a deterministic keyboard-accessible view toolbar. */
function CameraRig({ view, resetToken, paused, quality }: Pick<BrainSceneProps, 'view' | 'resetToken' | 'paused' | 'quality'>) {
  const { camera, gl, invalidate } = useThree()
  const controls = useRef<OrbitControls | null>(null)
  const moving = useRef(false)
  const target = useRef(new THREE.Vector3(...CAMERA_PRESETS.front))

  useEffect(() => {
    const instance = new OrbitControls(camera, gl.domElement)
    instance.enablePan = false
    instance.enableZoom = true
    instance.enableRotate = true
    instance.minDistance = 5.1
    instance.maxDistance = 13.5
    instance.minPolarAngle = 0.2
    instance.maxPolarAngle = Math.PI - 0.2
    instance.target.set(0, 0, 0)
    instance.addEventListener('start', () => { moving.current = false })
    const onChange = () => invalidate()
    instance.addEventListener('change', onChange)
    controls.current = instance
    instance.update()
    return () => {
      instance.removeEventListener('change', onChange)
      instance.dispose()
      controls.current = null
    }
  }, [camera, gl, invalidate])

  useEffect(() => {
    // A temporary pause (offscreen, hidden tab, global reduced motion) must
    // NOT reset visitors' manually dragged viewing angles. Camera presets
    // should change only from an explicit view/reset control.
    target.current.set(...CAMERA_PRESETS[view])
    moving.current = true
    invalidate()
  }, [view, resetToken, invalidate])

  useFrame((_, delta) => {
    if (moving.current) {
      camera.position.lerp(target.current, paused || quality === 'saver' ? 1 : Math.min(1, delta * 4.5))
      camera.lookAt(0, 0, 0)
      if (camera.position.distanceTo(target.current) < 0.015) {
        camera.position.copy(target.current)
        moving.current = false
      }
    }
    controls.current?.update()
  })
  return null
}

/** Lazy-loaded only when WebGL exists; 2D DOM poster remains the accessible fallback. */
export default function CosmicBrainScene(props: BrainSceneProps) {
  const budget = SCENE_BUDGETS[props.quality]
  return (
    <Canvas
      className="neuro-canvas"
      aria-label="Interactive 3D FAFB specimen-derived fly brain tissue surface"
      camera={{ position: CAMERA_PRESETS.front, fov: 43, near: 0.1, far: 100 }}
      frameloop={props.paused || props.quality === 'saver' ? 'demand' : 'always'}
      dpr={[1, budget.pixelRatio]}
      gl={{ antialias: props.quality !== 'saver', alpha: true, powerPreference: 'default' }}
      onCreated={props.onReady}
      fallback={<div className="neuro-webgl-fallback">3D display unavailable. Use the illustrated fallback.</div>}
    >
      <ambientLight intensity={0.38} />
      <hemisphereLight args={['#d6f5ff', '#162541', 0.85]} />
      <directionalLight position={[-4.7, 5, 8]} intensity={2.0} color="#eaf9ff" />
      <directionalLight position={[4.5, 2.2, -4.7]} intensity={1.5} color="#a598ee" />
      <directionalLight position={[2, -4, 5]} intensity={0.95} color="#65dce9" />
      <SceneFrameProbe />
      <ParticleField quality={props.quality} />
      {budget.helices > 0 && <DNAHelix x={3.06} paused={props.paused} quality={props.quality} />}
      {budget.helices > 1 && <DNAHelix x={-3.06} paused={props.paused} quality={props.quality} />}
      <AuthenticBrain quality={props.quality} paused={props.paused} anatomySource={props.anatomySource} anatomyStyle={props.anatomyStyle} onModelStatus={props.onModelStatus} />
      <CameraRig view={props.view} resetToken={props.resetToken} paused={props.paused} quality={props.quality} />
    </Canvas>
  )
}
