import { describe, expect, it } from 'vitest'
import { atlasPositions, isAtlasData, type AtlasPoint } from './atlas'

const points: AtlasPoint[] = [['100', 100, 200, 300, 0], ['200', 200, 400, 600, 1]]
describe('published cell positions', () => {
  it('uses one uniform transform that preserves relative positions and anisotropy', () => {
    const result = atlasPositions(points)
    const dx = result[3]! - result[0]!, dy = result[4]! - result[1]!, dz = result[5]! - result[2]!
    expect(dy / dx).toBeCloseTo(2)
    expect(dz / dx).toBeCloseTo(3)
    expect(points[0]).toEqual(['100', 100, 200, 300, 0])
    expect(result[0]! + result[3]!).toBeCloseTo(0)
  })
  it('rejects corrupt coordinates, duplicate identities, and inconsistent point counts', () => {
    const data = { snapshot: '783', units: 'nanometer', points, total_neurons: 2, soma_count: 1, unpositioned_count: 0 }
    expect(isAtlasData(data)).toBe(true)
    expect(isAtlasData({ ...data, total_neurons: 3 })).toBe(false)
    expect(isAtlasData({ ...data, soma_count: 2 })).toBe(false)
    expect(isAtlasData({ ...data, points: [points[0], points[0]] })).toBe(false)
    expect(isAtlasData({ ...data, points: [['100', NaN, 2, 3, 0]] })).toBe(false)
    expect(isAtlasData({ ...data, units: 'voxel' })).toBe(false)
  })
})
