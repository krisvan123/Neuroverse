import { apiGet, rootIdIsValid } from './api'

export type AtlasPoint = [string, number, number, number, 0 | 1]
export interface NeuronAtlasData {
  snapshot: '783'
  annotation_release: string
  units: 'nanometer'
  total_neurons: number
  soma_count: number
  unpositioned_count: number
  points: AtlasPoint[]
  source_reference: string
  source_sha256: string
}
export interface AtlasNeuron {
  root_id: string
  label: string
  cell_type: string | null
  hemibrain_type: string | null
  cell_class: string | null
  super_class: string | null
  side: string | null
  position_nm: number[] | null
  position_kind: 'soma' | 'anchor' | null
  top_nt: string | null
  top_nt_conf: string | null
  known_nt: string | null
  known_nt_source: string | null
  status: string | null
}
export interface NeuronProfile extends AtlasNeuron {
  snapshot: '783'
  annotation_release: string
  source_reference: string
  source_url: string
  source_sha256: string
  codex_url: string
  function: {
    title: string
    summary: string
    limitation: string
    evidence: 'cell_class_context' | 'not_established'
    source_reference: string
  }
}
export interface AtlasSearch { results: AtlasNeuron[]; total: number; offset: number }

export function isAtlasData(value: unknown): value is NeuronAtlasData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<NeuronAtlasData>
  if (data.snapshot !== '783' || data.units !== 'nanometer' || !Array.isArray(data.points) ||
      data.points.length > 200000 || !Number.isInteger(data.total_neurons) ||
      !Number.isInteger(data.soma_count) || !Number.isInteger(data.unpositioned_count)) return false
  const ids = new Set<string>()
  let somas = 0
  for (const point of data.points) {
    if (!Array.isArray(point) || point.length !== 5 || typeof point[0] !== 'string' ||
        !rootIdIsValid(point[0]) || ids.has(point[0]) ||
        !point.slice(1, 4).every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 10000000) ||
        (point[4] !== 0 && point[4] !== 1)) return false
    ids.add(point[0])
    if (point[4] === 0) somas++
  }
  return data.total_neurons === data.points.length + data.unpositioned_count! &&
    data.unpositioned_count! >= 0 && data.soma_count === somas
}

export async function fetchAtlas(signal?: AbortSignal): Promise<NeuronAtlasData> {
  const response = await fetch('/data/fafb-v783-atlas.json', { signal })
  if (!response.ok) throw new Error('The published brain preview could not be loaded. Please retry.')
  const manifest = await response.json() as NeuronAtlasData & {
    file: string; asset_sha256: string; asset_bytes: number; point_count: number; format_version: number
  }
  if (!/^fafb-v783-[a-f0-9]{16}\.bin$/.test(manifest.file) || !/^[a-f0-9]{64}$/.test(manifest.asset_sha256) || manifest.format_version !== 1) {
    throw new Error('Invalid published atlas manifest.')
  }
  const asset = await fetch('/data/' + manifest.file, { signal })
  if (!asset.ok) throw new Error('The published cell positions are unavailable. Please retry.')
  const buffer = await asset.arrayBuffer()
  if (buffer.byteLength !== manifest.asset_bytes || buffer.byteLength > 4_500_000) throw new Error('Unexpected atlas asset size.')
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), v => v.toString(16).padStart(2, '0')).join('')
  if (hash !== manifest.asset_sha256) throw new Error('Atlas source checksum verification failed.')
  const data = { ...manifest, points: decodeAtlasPositions(buffer) }
  if (data.points.length !== manifest.point_count || !isAtlasData(data)) throw new Error('The source returned invalid atlas coordinates.')
  return data
}

export function decodeAtlasPositions(buffer: ArrayBuffer): AtlasPoint[] {
  if (buffer.byteLength < 12) throw new Error('Truncated atlas positions.')
  const view = new DataView(buffer)
  if (view.getUint32(0, false) !== 0x4e564150 || view.getUint32(4, true) !== 1) throw new Error('Unsupported atlas position format.')
  const count = view.getUint32(8, true)
  if (count > 200000 || buffer.byteLength !== 12 + count * 21) throw new Error('Invalid atlas position count.')
  return Array.from({ length: count }, (_, i) => {
    const offset = 12 + i * 21
    return [view.getBigUint64(offset, true).toString(), view.getFloat32(offset + 8, true),
      view.getFloat32(offset + 12, true), view.getFloat32(offset + 16, true), view.getUint8(offset + 20)] as AtlasPoint
  })
}

export function searchAtlas(query: string, offset: number, signal?: AbortSignal): Promise<AtlasSearch> {
  return apiGet<AtlasSearch>('/api/v1/atlas/search?' + new URLSearchParams({ q: query, offset: String(offset), limit: '12' }), signal)
}

export async function fetchNeuronProfile(id: string, signal?: AbortSignal): Promise<NeuronProfile> {
  if (!rootIdIsValid(id)) throw new Error('Enter a valid FlyWire neuron ID.')
  const data = await apiGet<NeuronProfile>('/api/v1/atlas/neurons/' + id, signal)
  if (data.root_id !== id || data.snapshot !== '783' || !data.function || typeof data.label !== 'string') {
    throw new Error('The annotation service returned a mismatched neuron.')
  }
  return data
}

/** One common transform preserves the positions of every neuron relative to every other. */
export function atlasPositions(points: AtlasPoint[]): Float32Array {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const point of points) for (let a = 0; a < 3; a++) {
    min[a] = Math.min(min[a]!, point[a + 1] as number)
    max[a] = Math.max(max[a]!, point[a + 1] as number)
  }
  const extent = Math.max(...max.map((v, a) => v - min[a]!))
  const scale = extent > 0 ? 5 / extent : 1
  const positions = new Float32Array(points.length * 3)
  points.forEach((point, i) => {
    for (let a = 0; a < 3; a++) positions[i * 3 + a] = ((point[a + 1] as number) - (max[a]! + min[a]!) / 2) * scale
  })
  return positions
}
