import { describe, expect, it } from 'vitest'
import { bfsFrames, comparison, TEACHING_EDGES } from './graphDemo'

describe('Academy mission 001: explicitly synthetic directed traversal', () => {
  it('walks all six nodes from A with a deterministic FIFO queue', () => {
    const frames=bfsFrames()
    expect(frames[0]?.queue).toEqual(['A'])
    expect(frames[1]?.queue).toEqual(['B','C'])
    expect(frames[2]?.queue).toEqual(['C','D','F'])
    expect(frames.at(-1)?.visited).toEqual(['A','B','C','D','F','E'])
    expect(frames.at(-1)?.queue).toEqual([])
    expect(frames).toHaveLength(7)
  })
  it('models removing D without mutating the original edge list or inventing activity', () => {
    const edges=TEACHING_EDGES.map((pair)=>[...pair])
    const modified=bfsFrames(TEACHING_EDGES, 'D')
    expect(modified.at(-1)?.visited).toEqual(['A','B','C','F'])
    expect(comparison()).toEqual({
      original:['A','B','C','D','F','E'],
      removedD:['A','B','C','F'],
      lost:['D','E'],
    })
    expect(TEACHING_EDGES).toEqual(edges)
  })
  it('respects arrow direction and handles disconnected or missing starting nodes', () => {
    expect(bfsFrames([['B','A']], null,'A').at(-1)?.visited).toEqual(['A'])
    expect(bfsFrames([], null,'A').at(-1)?.visited).toEqual(['A'])
    expect(bfsFrames(TEACHING_EDGES,'A').at(-1)?.visited).toEqual([])
  })
})
