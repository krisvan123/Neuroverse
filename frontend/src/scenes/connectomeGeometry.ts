import type { AtlasPoint } from '../science/atlas'
import type { Skeleton } from '../science/api'

export const CELL_PALETTE = ['#72e4fa', '#ba8bff', '#ed8cdf', '#ffd483', '#9ceca9', '#73a4ff', '#f89bba', '#cce990']

export function neuronColor(id: string): string {
  let hash = 2166136261
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return CELL_PALETTE[(hash >>> 0) % CELL_PALETTE.length]!
}

export function sourceFrame(points: AtlasPoint[]) {
  const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity]
  for (const point of points) for (let axis = 0; axis < 3; axis++) {
    low[axis] = Math.min(low[axis]!, point[axis + 1] as number)
    high[axis] = Math.max(high[axis]!, point[axis + 1] as number)
  }
  const center = points.length ? low.map((v, axis) => (v + high[axis]!) / 2) : [0, 0, 0]
  const extent = points.length ? Math.max(...high.map((v, axis) => v - low[axis]!)) : 0
  return { center, scale: extent > 0 ? 5 / extent : 1 }
}

export function tracePositions(skeleton: Skeleton, frame: ReturnType<typeof sourceFrame>): Float32Array {
  if (skeleton.coordinate_space !== 'FlyWire FAFB v783 precomputed skeleton coordinate frame') {
    throw new Error('The source does not declare the shared FlyWire coordinate frame.')
  }
  const result = new Float32Array(skeleton.edges.length * 6)
  skeleton.edges.forEach((edge, i) => edge.forEach((vertex, j) => {
    const xyz = skeleton.vertices[vertex]!
    for (let axis = 0; axis < 3; axis++) result[i * 6 + j * 3 + axis] = (xyz[axis]! - frame.center[axis]!) * frame.scale
  }))
  return result
}

/** A bounded spatial preview, not a representative sample of biological classes. */
export function overviewIds(points: AtlasPoint[], limit = 48): string[] {
  const frame = sourceFrame(points)
  const bins = new Map<string, string[]>()
  for (const point of points) {
    const key = [1, 2, 3].map((axis, i) => Math.min(3, Math.max(0, Math.floor(((point[axis] as number) - frame.center[i]!) * frame.scale / 5 * 4 + 2)))).join(':')
    const bin = bins.get(key) || []
    if (bin.length < 3) bin.push(point[0])
    bins.set(key, bin)
  }
  const ids: string[] = []
  for (let layer = 0; layer < 3; layer++) for (const bin of bins.values()) {
    if (bin[layer] && ids.length < limit) ids.push(bin[layer]!)
  }
  return ids
}
