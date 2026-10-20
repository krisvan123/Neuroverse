/** Shared typed contracts for scientific source-driven FAFB v783 views. */
import { getApiBaseUrl } from '../api/client'

export interface DatasetState {
  available: boolean
  dataset?: string
  snapshot?: string
  nodes_selected?: number
  edges_selected?: number
  source_identity_verified?: boolean
  source_reference?: string
  limitations?: string[]
  message?: string
}
export interface NeuronDetails {
  root_id: string
  cell_type: string | null
  incoming_partner_count: number
  outgoing_partner_count: number
  incoming_selected_synapses: number
  outgoing_selected_synapses: number
  scope: 'selected_subgraph_only'
}
export interface Subgraph {
  seed_root_id: string
  scope: 'selected_subgraph_only'
  direction: string
  structural_not_functional: true
  nodes: Array<{ root_id: string; cell_type: string | null }>
  edges: Array<{ pre_root_id: string; post_root_id: string; syn_count: number }>
}
export interface Skeleton {
  root_id: string
  snapshot: '783'
  geometry_type: 'precomputed_neuron_skeleton_centerlines'
  units: 'nanometer'
  source_reference: string
  source_url: string
  source_sha256: string
  vertex_count: number
  edge_count: number
  vertices: number[][]
  edges: number[][]
  limitations: string[]
}

export const EXAMPLE_PROOFREAD_ID = '720575940625431866'

export function rootIdIsValid(value: string): boolean {
  return /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n
}

export function isSkeleton(value: unknown): value is Skeleton {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Partial<Skeleton>
  return (
    typeof v.root_id === 'string' && rootIdIsValid(v.root_id) &&
    v.snapshot === '783' &&
    v.geometry_type === 'precomputed_neuron_skeleton_centerlines' &&
    v.units === 'nanometer' &&
    typeof v.source_url === 'string' && v.source_url.startsWith('https://') &&
    typeof v.source_sha256 === 'string' && /^[a-f0-9]{64}$/.test(v.source_sha256) &&
    Number.isInteger(v.vertex_count) && (v.vertex_count ?? 0) >= 1 && (v.vertex_count ?? 0) <= 200000 &&
    Number.isInteger(v.edge_count) && (v.edge_count ?? 0) >= 0 && (v.edge_count ?? 0) <= 400000 &&
    Array.isArray(v.vertices) && v.vertices.length === v.vertex_count &&
    Array.isArray(v.edges) && v.edges.length === v.edge_count &&
    v.vertices.every((p) => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite)) &&
    v.edges.every((edge) => Array.isArray(edge) && edge.length === 2 && edge.every((index) => Number.isInteger(index) && index >= 0 && index < v.vertex_count!))
  )
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(getApiBaseUrl() + path, {
    headers: { Accept: 'application/json' },
    signal,
  })
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'detail' in result &&
      typeof result.detail === 'string'
        ? result.detail
        : 'Research API returned HTTP ' + response.status
    throw new Error(message)
  }
  return result as T
}

export async function fetchSkeleton(root: string, signal?: AbortSignal): Promise<Skeleton> {
  const result = await apiGet<unknown>('/api/v1/neurons/' + root + '/skeleton', signal)
  if (!isSkeleton(result) || result.root_id !== root) {
    throw new Error('The morphology service returned invalid or mismatched skeleton data')
  }
  return result
}
