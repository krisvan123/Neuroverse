import { describe, expect, it } from 'vitest'
import { createRandom, CAMERA_PRESETS, SCENE_BUDGETS, makeDNA, makeFilaments, makeStars } from './geometry'
import { supportsWebGL } from './browserSupport'

describe('procedural cosmic geometry', () => {
  it('is deterministic for the same seed', () => {
    const one = createRandom(123)
    const two = createRandom(123)
    expect(Array.from({ length: 16 }, one)).toEqual(Array.from({ length: 16 }, two))
  })
  it('keeps saver strictly cheaper than balanced and high', () => {
    expect(SCENE_BUDGETS.saver.stars).toBeLessThan(SCENE_BUDGETS.balanced.stars)
    expect(SCENE_BUDGETS.balanced.stars).toBeLessThan(SCENE_BUDGETS.high.stars)
    expect(SCENE_BUDGETS.saver.helices).toBe(1)
    expect(SCENE_BUDGETS.balanced.helices).toBe(2)
    expect(SCENE_BUDGETS.saver.pixelRatio).toBe(1)
  })
  it('builds continuous finite and deterministic fiber segments', () => {
    const a = makeFilaments(20)
    const b = makeFilaments(20)
    const positions = a.getAttribute('position').array
    expect(positions.length).toBeGreaterThan(0)
    expect(Array.from(positions).every(Number.isFinite)).toBe(true)
    expect(Array.from(positions)).toEqual(Array.from(b.getAttribute('position').array))
    a.dispose()
    b.dispose()
  })
  it('distributes deterministic particles evenly in ALL directions, not only behind the brain', () => {
    const g = makeStars(960)
    const repeat = makeStars(960)
    const points = g.getAttribute('position')
    const repeated = repeat.getAttribute('position')
    expect(points.count).toBe(960)
    expect(Array.from(points.array)).toEqual(Array.from(repeated.array))
    const octants = Array.from({ length: 8 }, () => 0)
    for (let i = 0; i < points.count; i++) {
      const x = points.getX(i), y = points.getY(i), z = points.getZ(i)
      const distance = Math.hypot(x, y, z)
      expect(Number.isFinite(distance)).toBe(true)
      expect(distance).toBeGreaterThanOrEqual(15.49)
      expect(distance).toBeLessThanOrEqual(20.01)
      const octant = (x >= 0 ? 1 : 0) + (y >= 0 ? 2 : 0) + (z >= 0 ? 4 : 0)
      octants[octant] = (octants[octant] ?? 0) + 1
    }
    // A near-uniform sphere must populate ALL eight octants comparably.
    for (const count of octants) {
      expect(count).toBeGreaterThan(90)
      expect(count).toBeLessThan(150)
    }
    g.dispose()
    repeat.dispose()
  })
  it('generates a symmetrical double helix with structural rungs', () => {
    const dna = makeDNA()
    expect(dna.strands).toHaveLength(2)
    expect(dna.rungs.getAttribute('position').count).toBe(52)
    for (const g of dna.strands) {
      expect(g.getAttribute('position').count).toBe(131)
      g.dispose()
    }
    dna.rungs.dispose()
  })
  it('exposes explicit reusable camera angles', () => {
    expect(CAMERA_PRESETS.front).toHaveLength(3)
    expect(CAMERA_PRESETS.left[0]).toBeLessThan(0)
    expect(CAMERA_PRESETS.right[0]).toBeGreaterThan(0)
  })
})

describe('WebGL fallback feature detection', () => {
  it('does not throw even when canvas APIs are unavailable in test environment', () => {
    expect(typeof supportsWebGL()).toBe('boolean')
  })
})
