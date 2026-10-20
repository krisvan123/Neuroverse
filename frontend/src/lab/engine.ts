/**
 * Phase 07 — bounded, deterministic, directed graph analysis.
 *
 * SYNTHETIC fixtures are not biological observations. Real data only enter
 * through an explicitly validated local imported FAFB v783 neighborhood.
 * All calculations are pure; graph originals are never mutated.
 */
export type GraphOrigin = 'synthetic-teaching-example' | 'fafb-v783-local-subgraph'
export type Traversal = 'bfs' | 'dfs'

export interface LabNode {
  id: string
  label?: string | null
}
export interface LabEdge {
  from: string
  to: string
  weight: number
}
export interface LabGraph {
  origin: GraphOrigin
  snapshot: string
  seed: string
  nodes: LabNode[]
  edges: LabEdge[]
  sourceReference: string
  sourceIdentityVerified: boolean
  databaseSha256: string | null
  selection: string
  license: string
}
export interface LabOptions {
  traversal: Traversal
  start: string
  minimumWeight: number
  removeNode: string | null
}
export interface TraversalFrame {
  current: string | null
  visited: string[]
  frontier: string[]
  note: string
}
export interface LabMetrics {
  nodes: number
  edges: number
  retainedWeightSum: number
  reachable: number
  reachableFraction: number
  meanOutDegree: number
  directedDensity: number
  startOutDegree: number
}
export interface LabScenario {
  metrics: LabMetrics
  visitOrder: string[]
  frames: TraversalFrame[]
  availableNodes: string[]
  retainedEdges: LabEdge[]
}
export interface LabResult {
  engine: 'neuroverse-directed-v1'
  options: LabOptions
  baseline: LabScenario
  modified: LabScenario
  removedFromModel: string | null
  lostFromBaseline: string[]
  newlyUnreachableSurvivors: string[]
}
const MAX_NODES=80
const MAX_EDGES=250
const NUMERIC_ID=/^[1-9][0-9]{0,18}$/
const SYNTHETIC_ID=/^[A-Z]$/
const MAX_SIGNED_64=9223372036854775807n

export const SYNTHETIC_LAB_GRAPH: LabGraph = {
  origin:'synthetic-teaching-example',
  snapshot:'none — synthetic',
  seed:'A',
  nodes:['A','B','C','D','E','F','G'].map(id=>({id})),
  edges:[
    {from:'A',to:'B',weight:1},
    {from:'A',to:'C',weight:1},
    {from:'B',to:'D',weight:1},
    {from:'B',to:'F',weight:1},
    {from:'C',to:'D',weight:1},
    {from:'D',to:'E',weight:1},
    {from:'F',to:'B',weight:1},
  ],
  sourceReference:'Neuroverse independently authored directed teaching graph; not a FAFB connectome.',
  sourceIdentityVerified:false,
  databaseSha256:null,
  selection:'Original invented A–G graph; G is disconnected; a B↔F cycle is intentional.',
  license:'Original educational example',
}

/** Use numeric ordering for FAFB decimal root IDs; alphabetical for teaching labels.
 * Avoid converting huge IDs to JavaScript Numbers (lossy above 2^53).
 */
export function compareNodeIds(a:string,b:string):number {
  if (NUMERIC_ID.test(a) && NUMERIC_ID.test(b)) {
    const an=BigInt(a),bn=BigInt(b)
    return an<bn?-1:an>bn?1:0
  }
  return a<b?-1:a>b?1:0
}

function fail(message:string):never { throw new Error('Experiment input rejected: '+message) }

export function validateLabGraph(input:LabGraph):LabGraph {
  if (input.origin!=='synthetic-teaching-example'&&input.origin!=='fafb-v783-local-subgraph') {
    return fail('unsupported graph origin')
  }
  if (input.origin==='fafb-v783-local-subgraph' && input.snapshot!=='783') {
    return fail('only the FAFB v783 snapshot is supported')
  }
  if (!Array.isArray(input.nodes)||input.nodes.length<1||input.nodes.length>MAX_NODES) {
    return fail('node count must be 1–80')
  }
  if (!Array.isArray(input.edges)||input.edges.length>MAX_EDGES) return fail('edge count exceeds 250')
  if (typeof input.sourceReference!=='string'||!input.sourceReference.trim())return fail('missing source provenance')
  if (typeof input.selection!=='string'||!input.selection.trim())return fail('missing graph selection method')
  if (typeof input.license!=='string'||!input.license.trim())return fail('missing license')
  if (input.databaseSha256!==null && !/^[a-f0-9]{64}$/.test(input.databaseSha256))return fail('invalid database SHA-256')
  if (typeof input.sourceIdentityVerified!=='boolean')return fail('missing source-authentication status')
  const ids=new Set<string>()
  for (const node of input.nodes) {
    const id=node?.id
    if (typeof id!=='string')return fail('invalid node ID')
    if (input.origin==='fafb-v783-local-subgraph') {
      if (!NUMERIC_ID.test(id)||BigInt(id)>MAX_SIGNED_64)return fail('invalid FAFB root ID')
    } else if (!SYNTHETIC_ID.test(id)) return fail('invalid teaching node label')
    if (ids.has(id))return fail('duplicate node')
    ids.add(id)
  }
  if (!ids.has(input.seed))return fail('seed is not in the graph')
  const seenEdges=new Set<string>()
  for (const edge of input.edges) {
    if (!edge||!ids.has(edge.from)||!ids.has(edge.to))return fail('edge endpoint is absent')
    if (!Number.isSafeInteger(edge.weight)||edge.weight<1||edge.weight>100000000)return fail('invalid edge weight')
    const key=edge.from+'\u0000'+edge.to
    if (seenEdges.has(key))return fail('duplicate directed edge; aggregate records before analysis')
    seenEdges.add(key)
  }
  // Sort and copy; keep the caller's baseline untouched for comparison/export.
  return {
    ...input,
    nodes:input.nodes.map(node=>({id:node.id,label:node.label??null}))
      .sort((a,b)=>compareNodeIds(a.id,b.id)),
    edges:input.edges.map(e=>({...e})).sort((a,b)=>
      compareNodeIds(a.from,b.from)||compareNodeIds(a.to,b.to)),
  }
}

function checkOptions(graph:LabGraph, options:LabOptions):void {
  if(options.traversal!=='bfs'&&options.traversal!=='dfs')fail('unknown traversal algorithm')
  if(!Number.isSafeInteger(options.minimumWeight)||options.minimumWeight<1||
    options.minimumWeight>100000000)fail('invalid edge-weight threshold')
  if(!graph.nodes.some(n=>n.id===options.start))fail('start node is not in the graph')
  if(options.removeNode!==null&&!graph.nodes.some(n=>n.id===options.removeNode))fail('removal node is not in the graph')
}

/** The FIFO order and DFS recursion are explicit, deterministic and source-order independent.
 * DFS frontiers represent the current call stack, not the queue used by BFS.
 */
function traverse(ids:string[], edges:LabEdge[], start:string, mode:Traversal):{
  visitOrder:string[];frames:TraversalFrame[]
} {
  const neighbors=new Map<string,string[]>(ids.map(id=>[id,[]]))
  for(const edge of edges) neighbors.get(edge.from)?.push(edge.to)
  for(const list of neighbors.values())list.sort(compareNodeIds)
  if(!neighbors.has(start))return {visitOrder:[],frames:[{
    current:null,visited:[],frontier:[],note:'Start node is absent from this model.',
  }]}
  const order:string[]=[]
  const frames:TraversalFrame[]=[]
  if(mode==='bfs') {
    const queue=[start],seen=new Set([start])
    frames.push({current:null,visited:[],frontier:[...queue],note:'FIFO queue starts with '+start+'.'})
    while(queue.length) {
      const node=queue.shift()!
      order.push(node)
      const fresh:string[]=[]
      for(const next of neighbors.get(node)??[]) {
        if(!seen.has(next)){seen.add(next);queue.push(next);fresh.push(next)}
      }
      frames.push({
        current:node,visited:[...order],frontier:[...queue],
        note:'Process '+node+(fresh.length?'; discover '+fresh.join(', ')+'.':'; no new neighbors.'),
      })
    }
  } else {
    const seen=new Set<string>()
    const path:string[]=[]
    frames.push({current:null,visited:[],frontier:[start],note:'Depth-first traversal begins at '+start+'.'})
    const visit=(node:string):void=>{
      seen.add(node);path.push(node);order.push(node)
      frames.push({
        current:node,visited:[...order],frontier:[...path],
        note:'Visit '+node+'; the frontier shows the DFS recursion path.',
      })
      for(const next of neighbors.get(node)??[])if(!seen.has(next))visit(next)
      path.pop()
    }
    visit(start)
  }
  return {visitOrder:order,frames}
}

function scenario(graph:LabGraph, options:LabOptions, removed:string|null):LabScenario {
  const availableNodes=graph.nodes.map(n=>n.id).filter(id=>id!==removed)
  const present=new Set(availableNodes)
  const retainedEdges=graph.edges.filter(e=>
    present.has(e.from)&&present.has(e.to)&&e.weight>=options.minimumWeight)
  const trace=traverse(availableNodes,retainedEdges,options.start,options.traversal)
  const degree=new Map(availableNodes.map(id=>[id,0]))
  let withoutLoops=0
  let weight=0
  for(const e of retainedEdges){
    degree.set(e.from,(degree.get(e.from)??0)+1)
    if(e.from!==e.to)withoutLoops++
    weight+=e.weight
  }
  const n=availableNodes.length
  return {
    metrics:{
      nodes:n,edges:retainedEdges.length,retainedWeightSum:weight,
      reachable:trace.visitOrder.length,
      reachableFraction:n?trace.visitOrder.length/n:0,
      meanOutDegree:n?retainedEdges.length/n:0,
      // Self-loops are expressly excluded from the density numerator.
      directedDensity:n>1?withoutLoops/(n*(n-1)):0,
      startOutDegree:degree.get(options.start)??0,
    },
    visitOrder:trace.visitOrder,
    frames:trace.frames,
    availableNodes,
    retainedEdges,
  }
}

/** The original graph and unmodified snapshot always survive a node deletion. */
export function analyzeGraph(raw:LabGraph, options:LabOptions):LabResult {
  const graph=validateLabGraph(raw)
  checkOptions(graph,options)
  const baseline=scenario(graph,options,null)
  const modified=scenario(graph,options,options.removeNode)
  const visited=new Set(modified.visitOrder)
  const lostFromBaseline=baseline.visitOrder.filter(id=>!visited.has(id))
  return {
    engine:'neuroverse-directed-v1',
    options:{...options},
    baseline,modified,removedFromModel:options.removeNode,
    lostFromBaseline,
    newlyUnreachableSurvivors:lostFromBaseline.filter(id=>id!==options.removeNode),
  }
}

export const LAB_BOUNDS={maxNodes:MAX_NODES,maxEdges:MAX_EDGES}
