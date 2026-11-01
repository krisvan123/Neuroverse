import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { webcrypto } from 'node:crypto'
import { atlasPositions, decodeAtlasPositions, fetchAtlas, isAtlasData, type AtlasPoint } from './atlas'

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

describe('the distributed source preview', () => {
  const manifest = JSON.parse(readFileSync('public/data/fafb-v783-atlas.json', 'utf8'))
  const binary = readFileSync('public/data/' + manifest.file)
  const buffer = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength) as ArrayBuffer
  afterEach(() => vi.unstubAllGlobals())

  function serve(asset: ArrayBuffer) {
    vi.stubGlobal('crypto', webcrypto)
    const request = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => manifest })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => asset })
    vi.stubGlobal('fetch', request)
    return request
  }

  it('verifies and decodes the published positions without losing root-ID or coordinate precision', async () => {
    const request = serve(buffer)
    const result = await fetchAtlas()
    expect(request).toHaveBeenCalledTimes(2)
    expect(result.total_neurons).toBe(139255)
    expect(result.soma_count).toBe(118107)
    expect(result.source_sha256).toBe('30be6c73975a70c56d930e27911f36455d3886e15abf383b78edd2a5d679e0b6')
    expect(result.points.find(point => point[0] === '720575940625431866'))
      .toEqual(['720575940625431866', 500352, 208192, 31280, 0])
  })

  it('rejects corrupted bytes before displaying scientific positions', async () => {
    const corrupt = buffer.slice(0)
    const bytes = new Uint8Array(corrupt)
    bytes[40] = bytes[40]! ^ 1
    serve(corrupt)
    await expect(fetchAtlas()).rejects.toThrow('checksum verification failed')
  })

  it('rejects truncated files, wrong versions and a mismatched record count', () => {
    expect(() => decodeAtlasPositions(buffer.slice(0, 11))).toThrow('Truncated')
    expect(() => decodeAtlasPositions(buffer.slice(0, -1))).toThrow('count')
    const wrongVersion = buffer.slice(0)
    new DataView(wrongVersion).setUint32(4, 2, true)
    expect(() => decodeAtlasPositions(wrongVersion)).toThrow('Unsupported')
  })
})
