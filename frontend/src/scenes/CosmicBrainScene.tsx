import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  CAMERA_PRESETS, SCENE_BUDGETS, makeDNA, makeFilaments, makeStars,
  type CameraView, type VisualQuality,
} from './geometry'

export interface BrainSceneProps {
  quality: VisualQuality
  paused: boolean
  view: CameraView
  resetToken: number
  onReady: () => void
}

/** The shell is intentionally anatomical *concept art*, not verified FlyWire mesh. */
function BrainSculpture({ quality, paused }: Pick<BrainSceneProps, 'quality' | 'paused'>) {
  const group = useRef<THREE.Group>(null)
  const fibers = useMemo(() => makeFilaments(SCENE_BUDGETS[quality].fibers), [quality])
  useEffect(() => () => fibers.dispose(), [fibers])

  useFrame((_, delta) => {
    if (!group.current || paused || quality === 'saver') return
    group.current.rotation.y += Math.min(delta, 0.05) * 0.07
    group.current.rotation.x = Math.sin(group.current.rotation.y * 1.7) * 0.05
  })

  return (
    <group ref={group} position={[0, 0.02, 0]}>
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          {/* Core bilateral lobes */}
          <mesh position={[side * 0.72, 0.22, 0]} scale={[1.12, 1.26, 0.92]} rotation={[0, side * 0.13, side * -0.1]}>
            <icosahedronGeometry args={[1, quality === 'saver' ? 2 : 3]} />
            <meshPhysicalMaterial
              color={side < 0 ? '#3b74af' : '#8275c0'}
              emissive={side < 0 ? '#163c66' : '#352856'}
              emissiveIntensity={0.55}
              roughness={0.52}
              metalness={0.15}
              transparent
              opacity={0.36}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Optic-lobe-like masses enhance fly-brain silhouette. */}
          <mesh position={[side * 1.83, -0.24, 0.1]} scale={[0.58, 0.79, 0.73]} rotation={[0.2, 0, side * 0.3]}>
            <icosahedronGeometry args={[1, quality === 'saver' ? 2 : 3]} />
            <meshPhysicalMaterial color="#497e9d" transparent opacity={0.32} depthWrite={false} side={THREE.DoubleSide} roughness={0.6} />
          </mesh>
          {/* Paired raised caps suggest sensory neuropil lobes. */}
          <mesh position={[side * 0.4, 1.18, -0.1]} scale={[0.41, 0.36, 0.53]}>
            <icosahedronGeometry args={[1, 2]} />
            <meshBasicMaterial color="#86bedb" transparent opacity={0.16} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.92, 0.05]} scale={[0.55, 0.7, 0.64]}>
        <icosahedronGeometry args={[1, 3]} />
        <meshPhysicalMaterial color="#6683ad" emissive="#3a4779" emissiveIntensity={0.3} transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {/* Fiber network and neural points are purely procedural decoration. */}
      <lineSegments geometry={fibers}>
        <lineBasicMaterial vertexColors transparent opacity={0.79} depthWrite={false} />
      </lineSegments>
      <mesh position={[0, -0.26, 0.75]} scale={[0.09, 0.09, 0.09]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshBasicMaterial color="#bcefff" />
      </mesh>
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
function CameraRig({ view, resetToken, paused, quality }: Omit<BrainSceneProps, 'onReady'>) {
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
      aria-label="Interactive conceptual 3D fruit fly brain illustration"
      camera={{ position: CAMERA_PRESETS.front, fov: 43, near: 0.1, far: 100 }}
      frameloop={props.paused || props.quality === 'saver' ? 'demand' : 'always'}
      dpr={[1, budget.pixelRatio]}
      gl={{ antialias: props.quality !== 'saver', alpha: true, powerPreference: 'default' }}
      onCreated={props.onReady}
      fallback={<div className="neuro-webgl-fallback">3D display unavailable. Use the illustrated fallback.</div>}
    >
      <ambientLight intensity={0.85} />
      <pointLight position={[-2.5, 3.5, 4]} intensity={34} color="#62bfee" decay={2} distance={10} />
      <pointLight position={[2.7, -1.2, 3]} intensity={24} color="#a481ec" decay={2} distance={9} />
      <ParticleField quality={props.quality} />
      {budget.helices > 0 && <DNAHelix x={3.1} paused={props.paused} quality={props.quality} />}
      {budget.helices > 1 && <DNAHelix x={-3.2} paused={props.paused} quality={props.quality} />}
      <BrainSculpture quality={props.quality} paused={props.paused} />
      <CameraRig view={props.view} resetToken={props.resetToken} paused={props.paused} quality={props.quality} />
    </Canvas>
  )
}
