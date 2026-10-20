import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { getApiBaseUrl } from '../api/client'
import type { Skeleton } from '../science/api'

export type ScientificMode = 'tissue' | 'skeleton'
export type ScientificView = 'front' | 'side' | 'top'
export interface ScientificSceneProps {
  mode: ScientificMode
  skeleton: Skeleton | null
  view: ScientificView
  resetKey: number
  onStatus: (status: 'loading' | 'ready' | 'error', message?: string) => void
}

function fitGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const geometry = source.clone()
  geometry.computeBoundingBox()
  if (!geometry.boundingBox) throw new Error('Scientific model has no valid bounding box')
  const dimensions = new THREE.Vector3()
  geometry.boundingBox.getSize(dimensions)
  const largest = Math.max(dimensions.x, dimensions.y, dimensions.z)
  if (!Number.isFinite(largest) || largest <= 0) throw new Error('Scientific geometry has no measurable extent')
  // Presentation-only uniform transform: shape and topology are not altered.
  geometry.center()
  geometry.scale(5 / largest, 5 / largest, 5 / largest)
  return geometry
}

function TrueTissue({ onStatus }: { onStatus: ScientificSceneProps['onStatus'] }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    onStatus('loading')
    const work = async () => {
      const response = await fetch(getApiBaseUrl() + '/api/v1/brain/tissue-mesh', { signal: controller.signal })
      if (!response.ok) throw new Error(
        'Verified FAFB tissue surface unavailable (HTTP ' + response.status + '). Check your backend connection.'
      )
      const sourceHash = response.headers.get('X-Neuroverse-Source-SHA256')
      if (!sourceHash || !/^[a-f0-9]{64}$/.test(sourceHash)) throw new Error('Source verification header is missing')
      const array = await response.arrayBuffer()
      if (array.byteLength > 20_000_000 || array.byteLength < 100) throw new Error('Unexpected scientific mesh size')
      const raw = new PLYLoader().parse(array)
      if (!raw.getAttribute('normal')) raw.computeVertexNormals()
      const fitted = fitGeometry(raw)
      raw.dispose()
      if (!controller.signal.aborted) {
        setGeometry(fitted)
        onStatus('ready')
      } else fitted.dispose()
    }
    work().catch((error: unknown) => {
      if (!controller.signal.aborted) onStatus('error', error instanceof Error ? error.message : 'Mesh unavailable')
    })
    return () => controller.abort()
  }, [onStatus])

  useEffect(() => () => { geometry?.dispose() }, [geometry])
  return (
    <group>
      {geometry && (
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#8cd0e2" roughness={0.7} metalness={0.08} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* No invented biological surface when the official source fails. */}
    </group>
  )
}

function RealSkeleton({ skeleton, onStatus }: { skeleton: Skeleton | null; onStatus: ScientificSceneProps['onStatus'] }) {
  const geometry = useMemo(() => {
    if (!skeleton) return null
    // Every segment is one pair of real skeleton vertices, never a decorative path.
    const array = new Float32Array(skeleton.edges.length * 6)
    for (let index = 0; index < skeleton.edges.length; index++) {
      const edge = skeleton.edges[index]
      if (!edge) continue
      const pre = skeleton.vertices[edge[0]]
      const post = skeleton.vertices[edge[1]]
      if (!pre || !post) continue
      const offset = index * 6
      array.set([pre[0], pre[1], pre[2], post[0], post[1], post[2]], offset)
    }
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(array, 3))
    return fitGeometry(result)
  }, [skeleton])
  useEffect(() => () => geometry?.dispose(), [geometry])
  useEffect(() => {
    onStatus(skeleton && geometry ? 'ready' : 'loading')
  }, [geometry, skeleton, onStatus])
  return geometry ? (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#92dcfa" transparent opacity={0.96} depthWrite={false} />
    </lineSegments>
  ) : null
}

function NavigationCamera({ view, resetKey }: { view: ScientificView; resetKey: number }) {
  const { camera, gl, invalidate } = useThree()
  const controls = useRef<OrbitControls | null>(null)
  useEffect(() => {
    const control = new OrbitControls(camera, gl.domElement)
    control.enableZoom = true
    control.enableRotate = true
    control.enablePan = true
    control.minDistance = 2.5
    control.maxDistance = 18
    const onChange = () => invalidate()
    control.addEventListener('change', onChange)
    controls.current = control
    return () => {
      control.removeEventListener('change', onChange)
      control.dispose()
      controls.current = null
    }
  }, [camera, gl, invalidate])
  useEffect(() => {
    const positions: Record<ScientificView, [number, number, number]> = {
      front: [0, 0, 8.4],
      side: [8.4, 0.1, 0],
      top: [0, 8.4, 0.05],
    }
    camera.position.set(...positions[view])
    controls.current?.target.set(0, 0, 0)
    camera.lookAt(0, 0, 0)
    controls.current?.update()
    invalidate()
  }, [view, resetKey, camera, invalidate])
  return null
}

export default function RealBrainScene({ mode, skeleton, view, resetKey, onStatus }: ScientificSceneProps) {
  return (
    <Canvas camera={{ position: [0, 0, 8.4], fov: 45, near: 0.1, far: 200 }}
      frameloop="demand" dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}
      aria-label="Source-derived scientific anatomy canvas; controls available below"
    >
      <color attach="background" args={['#081422']} />
      <ambientLight intensity={2.2} />
      <directionalLight position={[4, 7, 8]} intensity={2.6} color="#a4dbff" />
      <directionalLight position={[-4, -3, -6]} intensity={1.5} color="#a49aff" />
      {mode === 'tissue'
        ? <TrueTissue onStatus={onStatus} />
        : <RealSkeleton skeleton={skeleton} onStatus={onStatus} />}
      <NavigationCamera view={view} resetKey={resetKey} />
    </Canvas>
  )
}
