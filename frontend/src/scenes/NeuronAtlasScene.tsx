import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { atlasPositions, type AtlasPoint } from '../science/atlas'
import { NavigationCamera, type ScientificView } from './RealBrainScene'

function MappedCells({ points, onSelect }: { points: AtlasPoint[]; onSelect: (id: string) => void }) {
  const geometry = useMemo(() => {
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(atlasPositions(points), 3))
    const colors = new Float32Array(points.length * 3)
    const soma = new THREE.Color('#79d9ef'), anchor = new THREE.Color('#f3b97c')
    points.forEach((point, i) => (point[4] === 0 ? soma : anchor).toArray(colors, i * 3))
    result.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    result.computeBoundingSphere()
    return result
  }, [points])
  useEffect(() => () => geometry.dispose(), [geometry])
  const choose = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5) return // An orbit drag must not select a cell.
    event.stopPropagation()
    if (event.index !== undefined && points[event.index]) onSelect(points[event.index]![0])
  }
  return <points geometry={geometry} onClick={choose}>
    <pointsMaterial size={2.5} sizeAttenuation={false} vertexColors transparent opacity={0.88} />
  </points>
}

function Ready({ onReady }: { onReady: () => void }) {
  const reported = useRef(false)
  useFrame(() => {
    if (!reported.current) { reported.current = true; onReady() }
  })
  return null
}

function FocusCell({ points, id }: { points: AtlasPoint[]; id: string }) {
  const { camera, invalidate } = useThree()
  const marker = useRef<THREE.Mesh>(null)
  const target = useMemo(() => {
    const index = points.findIndex(point => point[0] === id)
    return index < 0 ? null : new THREE.Vector3().fromArray(atlasPositions(points), index * 3)
  }, [points, id])
  const animation = useRef<{ started: number; from: THREE.Vector3; to: THREE.Vector3; look: THREE.Vector3 } | null>(null)
  useEffect(() => {
    if (!target) return
    const look = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(camera.position.distanceTo(target)).add(camera.position)
    animation.current = { started: performance.now(), from: camera.position.clone(),
      to: camera.position.clone().sub(target).normalize().multiplyScalar(2).add(target), look }
    invalidate()
  }, [target, camera, invalidate])
  useFrame(() => {
    if (!animation.current || !target) return
    const { started, from, to, look } = animation.current
    const progress = Math.min(1, (performance.now() - started) / 420)
    const eased = 1 - (1 - progress) ** 3
    camera.position.lerpVectors(from, to, eased)
    camera.lookAt(look.clone().lerp(target, eased))
    if (marker.current) {
      marker.current.quaternion.copy(camera.quaternion)
      marker.current.scale.setScalar(1 + 0.5 * Math.sin(progress * Math.PI))
    }
    if (progress < 1) invalidate()
  })
  return target ? <mesh ref={marker} position={target} renderOrder={2}>
    <ringGeometry args={[0.045, 0.055, 40]} />
    <meshBasicMaterial color="#ffdb9f" depthTest={false} transparent opacity={0.95} />
  </mesh> : null
}

export default function NeuronAtlasScene({ points, view, resetKey, onSelect, onReady, focusId = null }: {
  points: AtlasPoint[]; view: ScientificView; resetKey: number; onSelect: (id: string) => void; onReady: () => void; focusId?: string | null
}) {
  return <Canvas camera={{ position: [0, 0, 8.4], fov: 45, near: 0.1, far: 100 }}
    raycaster={{ params: { Mesh: {}, LOD: {}, Sprite: {}, Points: { threshold: 0.022 }, Line: { threshold: 0.02 } } }}
    frameloop="demand" dpr={[1, 1.5]} aria-label="FlyWire neuron position map. Select a point or use the neuron list.">
    <color attach="background" args={['#081422']} />
    <MappedCells points={points} onSelect={onSelect} />
    <NavigationCamera view={view} resetKey={resetKey} enabled={!focusId} />
    {focusId && <FocusCell points={points} id={focusId} />}
    <Ready onReady={onReady} />
  </Canvas>
}
