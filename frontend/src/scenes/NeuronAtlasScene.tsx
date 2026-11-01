import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { atlasPositions, type AtlasPoint } from '../science/atlas'
import type { Skeleton } from '../science/api'
import type { ScientificView } from './RealBrainScene'
import { neuronColor, sourceFrame, tracePositions } from './connectomeGeometry'

interface Props {
  points: AtlasPoint[]; traces?: Skeleton[]; view: ScientificView; resetKey: number
  onSelect: (id: string) => void; onReady: () => void; onInteract?: () => void
  onHover?: (id: string | null) => void; focusId?: string | null; hoveredId?: string | null
  playing?: boolean; active?: boolean; reducedMotion?: boolean; showTraces?: boolean
}

function MappedCells({ points, onSelect, onHover, subdued }: Pick<Props, 'points' | 'onSelect' | 'onHover'> & { subdued: boolean }) {
  const { gl } = useThree()
  const geometry = useMemo(() => {
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(atlasPositions(points), 3))
    const colors = new Float32Array(points.length * 3)
    points.forEach((point, i) => new THREE.Color(neuronColor(point[0])).toArray(colors, i * 3))
    result.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    result.computeBoundingSphere()
    return result
  }, [points])
  useEffect(() => () => geometry.dispose(), [geometry])
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, vertexColors: true,
    uniforms: { size: { value: 2.1 * gl.getPixelRatio() }, opacity: { value: 0.92 } },
    vertexShader: 'varying vec3 cellColor; uniform float size; void main(){ cellColor=color; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize=size; }',
    fragmentShader: 'varying vec3 cellColor; uniform float opacity; void main(){ float d=length(gl_PointCoord-vec2(.5)); float a=smoothstep(.5,.12,d); if(a<.02)discard; gl_FragColor=vec4(cellColor,a*opacity);\n#include <colorspace_fragment>\n}',
  }), [gl])
  useEffect(() => { material.uniforms.opacity!.value = subdued ? 0.2 : 0.92 }, [material, subdued])
  useEffect(() => () => material.dispose(), [material])
  const choose = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5) return
    event.stopPropagation()
    if (event.index !== undefined && points[event.index]) onSelect(points[event.index]![0])
  }
  return <points geometry={geometry} material={material} onClick={choose}
    onPointerMove={event => { if (event.index !== undefined) { event.stopPropagation(); onHover?.(points[event.index]?.[0] || null) } }}
    onPointerOut={() => onHover?.(null)} />
}

function TracedCell({ skeleton, frame, onSelect, onHover, highlighted }: {
  skeleton: Skeleton; frame: ReturnType<typeof sourceFrame>; onSelect: Props['onSelect']; onHover: Props['onHover']; highlighted: boolean
}) {
  const geometry = useMemo(() => {
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(tracePositions(skeleton, frame), 3))
    return result
  }, [skeleton, frame])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <lineSegments geometry={geometry} onClick={e => { if (e.delta < 5) { e.stopPropagation(); onSelect(skeleton.root_id) } }}
    onPointerOver={e => { e.stopPropagation(); onHover?.(skeleton.root_id) }} onPointerOut={() => onHover?.(null)}>
    <lineBasicMaterial color={highlighted ? '#ffffff' : neuronColor(skeleton.root_id)} transparent opacity={highlighted ? 1 : 0.76} depthWrite={false} toneMapped={false} />
  </lineSegments>
}

function Highlight({ target }: { target: THREE.Vector3 | null }) {
  const marker = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => { if (marker.current) marker.current.quaternion.copy(camera.quaternion) })
  return target ? <mesh ref={marker} position={target} renderOrder={10}>
    <ringGeometry args={[0.045, 0.056, 40]} /><meshBasicMaterial color="#ffffff" depthTest={false} transparent opacity={0.9} />
  </mesh> : null
}

function CameraRig({ view, resetKey, playing, active, target, reducedMotion, onInteract }: {
  view: ScientificView; resetKey: number; playing: boolean; active: boolean; target: THREE.Vector3 | null; reducedMotion: boolean; onInteract: Props['onInteract']
}) {
  const { camera, gl, invalidate, size } = useThree()
  // Keep both lobes in frame on portrait screens and in portrait fullscreen.
  const distance = 7.2 / Math.min(1, size.width / Math.max(1, size.height))
  const controls = useRef<OrbitControls | null>(null)
  const transition = useRef<{ started: number; duration: number; from: THREE.Vector3; to: THREE.Vector3; lookFrom: THREE.Vector3; lookTo: THREE.Vector3 } | null>(null)
  const interaction = useRef(onInteract)
  useEffect(() => { interaction.current = onInteract }, [onInteract])
  useEffect(() => {
    const control = new OrbitControls(camera, gl.domElement)
    control.minDistance = 1.5; control.maxDistance = 32
    control.autoRotateSpeed = 0.5; control.enableDamping = false
    const changed = () => invalidate()
    const started = () => { transition.current = null; interaction.current?.() }
    control.addEventListener('change', changed); control.addEventListener('start', started)
    controls.current = control
    return () => { control.removeEventListener('change', changed); control.removeEventListener('start', started); control.dispose(); controls.current = null }
  }, [camera, gl, invalidate])
  useEffect(() => {
    if (controls.current) controls.current.autoRotate = playing && active && !target && !reducedMotion
    invalidate()
  }, [playing, active, target, reducedMotion, invalidate])
  useEffect(() => {
    const presets: Record<ScientificView, [number, number, number]> = { front: [0, 0, distance], side: [distance, 0, 0], top: [0, distance, 0.01] }
    const to = target ? camera.position.clone().sub(target).normalize().multiplyScalar(2).add(target) : new THREE.Vector3(...presets[view])
    transition.current = { started: performance.now(), duration: reducedMotion ? 0 : target ? 420 : 650,
      from: camera.position.clone(), to, lookFrom: controls.current?.target.clone() || new THREE.Vector3(), lookTo: target || new THREE.Vector3() }
    invalidate()
  }, [view, resetKey, target, reducedMotion, camera, invalidate, distance])
  useFrame((_, delta) => {
    const step = transition.current
    if (step) {
      const t = step.duration === 0 ? 1 : Math.min(1, (performance.now() - step.started) / step.duration)
      const eased = 1 - (1 - t) ** 3
      camera.position.lerpVectors(step.from, step.to, eased)
      controls.current?.target.lerpVectors(step.lookFrom, step.lookTo, eased)
      camera.lookAt(controls.current?.target || step.lookTo)
      if (t === 1) transition.current = null
      else invalidate()
    } else if (active) controls.current?.update(delta)
  })
  return null
}

function Ready({ onReady }: { onReady: () => void }) {
  const reported = useRef(false)
  useFrame(() => { if (!reported.current) { reported.current = true; onReady() } })
  return null
}

export default function NeuronAtlasScene({ points, traces = [], view, resetKey, onSelect, onReady, onInteract, onHover,
  focusId = null, hoveredId = null, playing = false, active = true, reducedMotion = false, showTraces = true }: Props) {
  const frame = useMemo(() => sourceFrame(points), [points])
  const targets = useMemo(() => new Map(points.map(p => [p[0], new THREE.Vector3(
    (p[1] - frame.center[0]!) * frame.scale, (p[2] - frame.center[1]!) * frame.scale, (p[3] - frame.center[2]!) * frame.scale)])), [points, frame])
  const focused = focusId ? targets.get(focusId) || null : null
  const highlighted = hoveredId ? targets.get(hoveredId) || null : null
  return <Canvas camera={{ position: [0, 0, 7.2], fov: 42, near: 0.05, far: 100 }}
    raycaster={{ params: { Mesh: {}, LOD: {}, Sprite: {}, Points: { threshold: 0.018 }, Line: { threshold: 0.012 } } }}
    frameloop={playing && active && !reducedMotion ? 'always' : 'demand'} dpr={[1, 1.5]}
    aria-label="Interactive FlyWire brain. Rotate, zoom and select an original neuron.">
    <color attach="background" args={['#101a2c']} />
    <MappedCells points={points} onSelect={onSelect} onHover={onHover} subdued={showTraces && traces.length > 0} />
    {showTraces && traces.map(skeleton => <TracedCell key={skeleton.root_id} skeleton={skeleton} frame={frame}
      onSelect={onSelect} onHover={onHover} highlighted={hoveredId === skeleton.root_id} />)}
    <Highlight target={focused || highlighted} />
    <CameraRig view={view} resetKey={resetKey} playing={playing} active={active} target={focused} reducedMotion={reducedMotion} onInteract={onInteract} />
    <Ready onReady={onReady} />
  </Canvas>
}
