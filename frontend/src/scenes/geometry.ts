/** Deterministic conceptual fly-brain geometry, NOT FlyWire morphology. */
import * as THREE from 'three'

export type VisualQuality = 'high' | 'balanced' | 'saver'
export type CameraView = 'front' | 'left' | 'right' | 'top'

export const SCENE_BUDGETS: Record<VisualQuality, { fibers: number; stars: number; helices: number; pixelRatio: number }> = {
  high: { fibers: 110, stars: 430, helices: 2, pixelRatio: 1.7 },
  balanced: { fibers: 70, stars: 210, helices: 1, pixelRatio: 1.4 },
  saver: { fibers: 30, stars: 55, helices: 0, pixelRatio: 1 },
}

export const CAMERA_PRESETS: Record<CameraView, [number, number, number]> = {
  front: [2.1, 0.95, 8.6],
  left: [-7.9, 0.55, 2.2],
  right: [7.9, 0.55, 2.2],
  top: [0, 8.6, 0.8],
}

/** Seeded xorshift32. Produces identical decorative geometry on every visit. */
export function createRandom(seed: number): () => number {
  let value = seed | 0
  return () => {
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    return (value >>> 0) / 4294967296
  }
}

/** All fibers are drawn as ONE LineSegments geometry rather than 100 draw calls. */
export function makeFilaments(fiberCount: number): THREE.BufferGeometry {
  const rand = createRandom(7803)
  const positions: number[] = []
  const colors: number[] = []
  const cyan = new THREE.Color('#79dffc')
  const lavender = new THREE.Color('#bc96f8')

  for (let fiber = 0; fiber < fiberCount; fiber++) {
    const hemisphere = fiber % 2 === 0 ? -1 : 1
    const origin = new THREE.Vector3(
      hemisphere * (0.22 + rand() * 0.36),
      -0.62 + rand() * 0.55,
      (rand() - 0.5) * 0.55,
    )
    const tip = new THREE.Vector3(
      hemisphere * (0.9 + rand() * 1.15),
      -0.82 + rand() * 1.95,
      (rand() - 0.5) * 1.6,
    )
    const elbow = origin.clone().lerp(tip, 0.5).add(
      new THREE.Vector3(hemisphere * (rand() * 0.4), rand() * 0.8, (rand() - 0.5) * 0.6),
    )
    const curve = new THREE.CatmullRomCurve3([origin, elbow, tip])
    const tint = cyan.clone().lerp(lavender, rand() * 0.72)
    const points = curve.getPoints(16)
    for (let index = 0; index < points.length - 1; index++) {
      const p = points[index]
      const q = points[index + 1]
      if (!p || !q) continue
      positions.push(p.x, p.y, p.z, q.x, q.y, q.z)
      const brightness = 0.45 + 0.55 * (index / points.length)
      colors.push(
        tint.r * brightness, tint.g * brightness, tint.b * brightness,
        tint.r * brightness, tint.g * brightness, tint.b * brightness,
      )
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return geometry
}

export function makeStars(starCount: number): THREE.BufferGeometry {
  const random = createRandom(6174)
  const positions: number[] = []
  const colors: number[] = []
  for (let i = 0; i < starCount; i++) {
    const x = (random() - 0.5) * 15
    const y = (random() - 0.5) * 10
    const z = -3 - random() * 6
    positions.push(x, y, z)
    const brightness = 0.35 + random() * 0.65
    colors.push(0.45 * brightness, 0.74 * brightness, brightness)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return geometry
}

/** A double helix is decorative: DNA is not part of this connectome visualization. */
export function makeDNA(): { strands: THREE.BufferGeometry[]; rungs: THREE.BufferGeometry } {
  const strands: THREE.BufferGeometry[] = []
  const rungs: number[] = []
  const steps = 130
  for (let strand = 0; strand < 2; strand++) {
    const points: THREE.Vector3[] = []
    for (let index = 0; index <= steps; index++) {
      const t = index / steps
      const phase = t * Math.PI * 6 + strand * Math.PI
      points.push(new THREE.Vector3(
        Math.cos(phase) * 0.36,
        (t - 0.5) * 4.2,
        Math.sin(phase) * 0.36,
      ))
    }
    strands.push(new THREE.BufferGeometry().setFromPoints(points))
  }
  for (let index = 0; index <= 25; index++) {
    const t = index / 25
    const phase = t * Math.PI * 6
    const x = Math.cos(phase) * 0.36
    const z = Math.sin(phase) * 0.36
    const y = (t - 0.5) * 4.2
    rungs.push(x, y, z, -x, y, -z)
  }
  const rungGeometry = new THREE.BufferGeometry()
  rungGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rungs, 3))
  return { strands, rungs: rungGeometry }
}
