import { describe, expect, it } from 'vitest'
import { isSkeleton, rootIdIsValid } from './api'

describe('scientific data validity', () => {
  it('supports large neuron IDs without JavaScript number precision loss', () => {
    expect(rootIdIsValid('720575940625431866')).toBe(true)
    expect(rootIdIsValid('9223372036854775807')).toBe(true)
    expect(rootIdIsValid('9223372036854775808')).toBe(false)
    expect(rootIdIsValid('000012')).toBe(false)
    expect(rootIdIsValid('123/../456')).toBe(false)
  })
  it('does not accept invented or structurally invalid morphology', () => {
    const data = {
      root_id: '720575940625431866', snapshot: '783',
      geometry_type: 'precomputed_neuron_skeleton_centerlines',
      units: 'nanometer', source_url: 'https://source.example/123',
      source_sha256: 'a'.repeat(64), vertex_count: 2, edge_count: 1,
      vertices: [[1, 2, 3], [4, 5, 6]], edges: [[0, 1]],
    }
    expect(isSkeleton(data)).toBe(true)
    expect(isSkeleton({ ...data, units: 'micrometer' })).toBe(false)
    expect(isSkeleton({ ...data, edges: [[0, 2]] })).toBe(false)
    expect(isSkeleton({ ...data, vertices: [[NaN, 2, 3], [4, 5, 6]] })).toBe(false)
    expect(isSkeleton({ ...data, geometry_type: 'real-time-brain-signals' })).toBe(false)
  })
})
