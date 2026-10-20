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
    expect(SCENE_BUDGETS.saver.helices).toBe(0)
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
  it('creates quality-bounded particles behind the brain', () => {
    const g = makeStars(55)
    expect(g.getAttribute('position').count).toBe(55)
    for (let i = 0; i < 55; i++) expect(g.getAttribute('position').getZ(i)).toBeLessThan(-2)
    g.dispose()
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
