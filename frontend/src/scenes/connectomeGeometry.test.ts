import { describe, expect, it } from 'vitest'
import { atlasPositions, type AtlasPoint } from '../science/atlas'
import type { Skeleton } from '../science/api'
import { neuronColor, overviewIds, sourceFrame, tracePositions } from './connectomeGeometry'

// Synthetic coordinates test spatial registration, never displayed as research.
const points: AtlasPoint[] = [['100', 100, 200, 300, 0], ['200', 200, 400, 600, 1]]
const skeleton: Skeleton = {
  root_id: '100', snapshot: '783', units: 'nanometer', geometry_type: 'precomputed_neuron_skeleton_centerlines',
  coordinate_space: 'FlyWire FAFB v783 precomputed skeleton coordinate frame',
  source_url: 'https://example.org/test', source_reference: 'Test fixture', source_sha256: 'a'.repeat(64),
  vertex_count: 2, edge_count: 1, vertices: [[100, 200, 300], [120, 240, 360]], edges: [[0, 1]], limitations: ['Synthetic test'],
}

describe('the source-based branch overview', () => {
  it('registers original branches to the same global frame as cell positions', () => {
    const frame = sourceFrame(points)
    const trace = tracePositions(skeleton, frame)
    expect(Array.from(trace.slice(0, 3))).toEqual(Array.from(atlasPositions(points).slice(0, 3)))
    // A short cell remains short; it must not be separately expanded to fill the brain.
    expect(trace[3]! - trace[0]!).toBeCloseTo(20 * frame.scale)
    expect(trace[5]! - trace[2]!).toBeCloseTo(60 * frame.scale)
    expect(skeleton.vertices[0]).toEqual([100, 200, 300])
  })

  it('refuses to overlay a reconstruction from an undeclared coordinate frame', () => {
    expect(() => tracePositions({ ...skeleton, coordinate_space: undefined }, sourceFrame(points))).toThrow('coordinate frame')
  })

  it('bounds and spreads source requests and keeps neuron colors stable', () => {
    const distributed: AtlasPoint[] = Array.from({ length: 200 }, (_, i) => [String(i + 1), i % 8, Math.floor(i / 8) % 8, Math.floor(i / 64), 0])
    const ids = overviewIds(distributed)
    expect(ids.length).toBeLessThanOrEqual(48)
    expect(ids.length).toBeGreaterThan(20)
    expect(new Set(ids).size).toBe(ids.length)
    expect(overviewIds(distributed)).toEqual(ids)
    expect(ids.every(id => distributed.some(point => point[0] === id))).toBe(true)
    expect(new Set(distributed.map(point => neuronColor(point[0]))).size).toBeGreaterThan(1)
  })
})
