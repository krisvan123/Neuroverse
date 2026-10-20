import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { applySourceDepthColors } from './surfaceColors'

describe('Phase 05.2 FAFB display encoding', () => {
  it('does not change ANY source vertex, triangle topology, or physical positions', () => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, -2, 1, 0, 0, 0, 1, 2, 1, 1, 0,
    ], 3))
    geometry.setIndex([0, 1, 2, 1, 2, 3])
    const originalPositions = Array.from(geometry.getAttribute('position').array)
    const originalIndices = Array.from(geometry.getIndex()!.array)
    applySourceDepthColors(geometry)
    expect(Array.from(geometry.getAttribute('position').array)).toEqual(originalPositions)
    expect(Array.from(geometry.getIndex()!.array)).toEqual(originalIndices)
    expect(geometry.getAttribute('color').count).toBe(4)
    expect(geometry.getAttribute('color').getX(0)).not.toBe(geometry.getAttribute('color').getX(2))
    geometry.dispose()
  })
  it('rejects invalid constant-depth or missing source geometry', () => {
    const empty = new THREE.BufferGeometry()
    expect(() => applySourceDepthColors(empty)).toThrow(/missing valid/i)
    empty.setAttribute('position', new THREE.Float32BufferAttribute([
      1, 2, 3, 2, 1, 3, 0, 0, 3,
    ], 3))
    expect(() => applySourceDepthColors(empty)).toThrow(/nonzero Z span/i)
    empty.dispose()
  })
})
