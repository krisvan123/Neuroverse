/** A fully SYNTHETIC directed example for graph-literacy practice.
 * This file never contains or claims FlyWire neuron IDs / synapse records.
 * Algorithms run in memory, deterministically and do not alter source data.
 */
export const TEACHING_NODES = ['A','B','C','D','E','F'] as const
export type TeachingNode = typeof TEACHING_NODES[number]
export type TeachingEdge = readonly [TeachingNode, TeachingNode]

export const TEACHING_EDGES: readonly TeachingEdge[] = [
  ['A','B'], ['A','C'], ['B','D'], ['B','F'], ['C','D'], ['D','E'],
] as const

export interface BfsFrame {
  current: TeachingNode | null
  visited: readonly TeachingNode[]
  queue: readonly TeachingNode[]
  discovered: readonly TeachingNode[]
  message: string
}

export function bfsFrames(
  edges: readonly TeachingEdge[] = TEACHING_EDGES,
  removed: TeachingNode | null = null,
  start: TeachingNode = 'A',
): readonly BfsFrame[] {
  if (removed === start) return [{
    current: null, visited:[], queue:[], discovered:[],
    message:'The starting node was removed; there is no traversal.',
  }]
  const remaining = edges.filter(([a,b]) => a !== removed && b !== removed)
  const discovered: TeachingNode[] = [start]
  const visited: TeachingNode[] = []
  const queue: TeachingNode[] = [start]
  const frames: BfsFrame[] = [{
    current:null, visited:[], queue:[...queue], discovered:[...discovered],
    message:'Start at A. The queue holds the first node.',
  }]
  while (queue.length) {
    const current = queue.shift()!
    visited.push(current)
    const introduced: TeachingNode[] = []
    // Outgoing edges only. Input ordering is fixed and tested.
    for (const [from,to] of remaining) {
      if (from === current && !discovered.includes(to)) {
        discovered.push(to)
        introduced.push(to)
        queue.push(to)
      }
    }
    frames.push({
      current, visited:[...visited], queue:[...queue], discovered:[...discovered],
      message:introduced.length
        ? 'Process '+current+'; enqueue unseen outgoing neighbors '+introduced.join(', ')+'.'
        : 'Process '+current+'; no new outgoing neighbors.',
    })
  }
  return frames
}

export function comparison(): { original: readonly TeachingNode[]; removedD: readonly TeachingNode[]; lost: readonly TeachingNode[] } {
  const original = bfsFrames().at(-1)!.visited
  const removedD = bfsFrames(TEACHING_EDGES, 'D').at(-1)!.visited
  return { original, removedD, lost: original.filter((node) => !removedD.includes(node)) }
}
