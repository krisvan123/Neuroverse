import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js'
import { getApiBaseUrl } from '../api/client'
import {
  CAMERA_PRESETS, SCENE_BUDGETS, makeDNA, makeStars,
  type CameraView, type VisualQuality,
} from './geometry'

export interface BrainSceneProps {
  quality: VisualQuality
  paused: boolean
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
      medianSceneFrameMs: ordered[Math.floor(ordered.length / 2)] ?? 0,
      rendererDrawCalls: gl.info.render.calls,
      note: 'Headless/dev scene frames; not a physical-device GPU benchmark',
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
function AuthenticBrain({ quality, paused, onModelStatus }: Pick<BrainSceneProps, 'quality' | 'paused' | 'onModelStatus'>) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const group = useRef<THREE.Group>(null)

  useEffect(() => {
    const controller = new AbortController()
    onModelStatus('loading')
    async function load() {
      const response = await fetch(getApiBaseUrl() + '/api/v1/brain/tissue-mesh', {
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Research mesh unavailable. Start the FastAPI backend.')
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
        const scale = 5.65 / extent
        parsed.scale(scale, scale, scale)
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
  }, [onModelStatus])

  useEffect(() => () => geometry?.dispose(), [geometry])

  useFrame((state, delta) => {
    if (!group.current || paused || quality === 'saver') return
    group.current.rotation.y += Math.min(delta, 0.05) * 0.09
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.06
  })

  if (!geometry) return null
  return (
    <group ref={group} rotation={[0.11, -0.23, 0]}>
      {/* Physically lit opaque tissue makes real depth, occlusion and contours visible. */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#9acbdb"
          metalness={0.13}
          roughness={0.43}
          clearcoat={0.36}
          clearcoatRoughness={0.27}
          emissive="#0f3562"
          emissiveIntensity={0.14}
          side={THREE.DoubleSide}
        />
      </mesh>
      {quality === 'high' && (
        <mesh geometry={geometry}>
          <meshBasicMaterial color="#b5ddff" wireframe transparent opacity={0.035} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

function ParticleField({ quality }: { quality: VisualQuality }) {
  const geometry = useMemo(() => makeStars(SCENE_BUDGETS[quality].stars), [quality])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial size={0.034} sizeAttenuation vertexColors transparent opacity={0.74} depthWrite={false} />
    </points>
  )
}

function DNAHelix({ x, paused, quality }: { x: number; paused: boolean; quality: VisualQuality }) {
  const ref = useRef<THREE.Group>(null)
  const geometry = useMemo(makeDNA, [])
  const strands = useMemo(
    () => geometry.strands.map((strand, index) => new THREE.Line(
      strand,
      new THREE.LineBasicMaterial({
        color: index === 0 ? '#82cde9' : '#b8a4e5',
        transparent: true,
        opacity: 0.31,
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

  useFrame((_, delta) => {
    if (ref.current && !paused && quality !== 'saver') {
      ref.current.rotation.y += Math.min(delta, 0.05) * 0.14
    }
  })

  return (
    <group ref={ref} position={[x, -0.15, -2.25]} rotation={[0.2, 0.12, x < 0 ? -0.28 : 0.25]} scale={0.9}>
      {strands.map((strand, index) => (
        <primitive key={index} object={strand} />
      ))}
      <lineSegments geometry={geometry.rungs}>
        <lineBasicMaterial color="#78aac8" transparent opacity={0.17} depthWrite={false} />
      </lineSegments>
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
    target.current.set(...CAMERA_PRESETS[view])
    if (paused || quality === 'saver') {
      camera.position.copy(target.current)
      camera.lookAt(0, 0, 0)
      controls.current?.update()
      moving.current = false
      invalidate()
    } else {
      moving.current = true
      invalidate()
    }
  }, [view, resetToken, paused, quality, camera, invalidate])

  useFrame((_, delta) => {
    if (moving.current) {
      camera.position.lerp(target.current, Math.min(1, delta * 4.5))
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
      <ambientLight intensity={1.3} />
      <hemisphereLight args={['#b8edff', '#15214a', 1.45]} />
      <directionalLight position={[-3.5, 5, 7]} intensity={3.1} color="#d9f5ff" />
      <directionalLight position={[4.5, 0.2, -3]} intensity={3.9} color="#987aff" />
      <directionalLight position={[2, -4, 5]} intensity={1.1} color="#54d6f3" />
      <SceneFrameProbe />
      <ParticleField quality={props.quality} />
      {budget.helices > 0 && <DNAHelix x={3.1} paused={props.paused} quality={props.quality} />}
      {budget.helices > 1 && <DNAHelix x={-3.2} paused={props.paused} quality={props.quality} />}
      <AuthenticBrain quality={props.quality} paused={props.paused} onModelStatus={props.onModelStatus} />
      <CameraRig view={props.view} resetToken={props.resetToken} paused={props.paused} quality={props.quality} />
    </Canvas>
  )
}
