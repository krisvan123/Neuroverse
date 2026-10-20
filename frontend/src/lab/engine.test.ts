import { describe,expect,it } from 'vitest'
import cases from './reference-cases.json'
import {
  analyzeGraph,compareNodeIds,SYNTHETIC_LAB_GRAPH,validateLabGraph,
  type LabGraph,type LabOptions,
} from './engine'
import { graphFromImportedFAFB } from './fromFAFB'

function input(entry:(typeof cases)[number]):LabGraph {
  return {
    origin:entry.origin as LabGraph['origin'],
    snapshot:entry.origin==='fafb-v783-local-subgraph'?'783':'none — synthetic',
    seed:entry.start,
    nodes:entry.nodes.map(id=>({id})),
    edges:entry.edges.map(([from,to,weight])=>({from:String(from),to:String(to),weight:Number(weight)})),
    selection:'Independent reference fixture '+entry.name,
    sourceReference:'Independently authored test fixture, no research import.',
    sourceIdentityVerified:false,databaseSha256:null,
    license:'Educational reference data',
  }
}

describe('Phase 07 — independently specified NetworkX cross-check fixtures',()=>{
  for(const fixture of cases) {
    it(fixture.name+' correct BFS and DFS, directed metrics and non-destructive deletion',()=>{
      const graph=input(fixture)
      const untouched=JSON.stringify(graph)
      for(const algorithm of ['bfs','dfs'] as const) {
        const opts:LabOptions={
          traversal:algorithm,start:fixture.start,
          minimumWeight:fixture.minimumWeight,removeNode:fixture.removeNode,
        }
        const result=analyzeGraph(graph,opts)
        expect(result.baseline.visitOrder).toEqual(fixture.baseline[algorithm])
        expect(result.modified.visitOrder).toEqual(fixture.modified[algorithm])
        expect(result.baseline.metrics.nodes).toBe(fixture.baseline.nodes)
        expect(result.baseline.metrics.edges).toBe(fixture.baseline.edges)
        expect(result.baseline.metrics.reachable).toBe(fixture.baseline.reachable)
        expect(result.modified.metrics.nodes).toBe(fixture.modified.nodes)
        expect(result.modified.metrics.edges).toBe(fixture.modified.edges)
        expect(result.modified.metrics.reachable).toBe(fixture.modified.reachable)
        expect(result.newlyUnreachableSurvivors).toEqual(fixture.newlyUnreachableSurvivors)
        expect(result.baseline.metrics.directedDensity).toBeGreaterThanOrEqual(0)
        expect(result.modified.metrics.directedDensity).toBeLessThanOrEqual(1)
        expect(JSON.stringify(graph)).toBe(untouched)
        expect(analyzeGraph(graph,opts)).toEqual(result)
      }
    })
  }

  it('computes loop-excluded directed density, exact sums and out-degrees',()=>{
    const fixture=cases.find(x=>x.name==='self-loop-and-cycle')!
    const r=analyzeGraph(input(fixture),{
      traversal:'bfs',start:'A',minimumWeight:2,removeNode:'B',
    })
    expect(r.baseline.metrics.directedDensity).toBeCloseTo(0.5)
    expect(r.baseline.metrics.meanOutDegree).toBeCloseTo(4/3)
    expect(r.baseline.metrics.retainedWeightSum).toBe(13)
    expect(r.baseline.metrics.startOutDegree).toBe(2)
    expect(r.modified.metrics.startOutDegree).toBe(1)
    expect(r.modified.metrics.directedDensity).toBe(0)
    expect(r.modified.metrics.retainedWeightSum).toBe(2)
  })
  it('sorts huge FAFB root IDs without floating-point loss',()=>{
    const a='720575940625431866'
    const b='720575940625448968'
    expect(compareNodeIds(a,b)).toBe(-1)
    expect(compareNodeIds('2','10')).toBe(-1)
  })
  it('rejects duplicate IDs, duplicate pairs, missing endpoints and invalid thresholds',()=>{
    const invalid=(changes:Partial<LabGraph>)=>validateLabGraph({...SYNTHETIC_LAB_GRAPH,...changes})
    expect(()=>invalid({nodes:[{id:'A'},{id:'A'}]})).toThrow(/duplicate node/)
    expect(()=>invalid({edges:[...SYNTHETIC_LAB_GRAPH.edges,...SYNTHETIC_LAB_GRAPH.edges]})).toThrow(/duplicate directed edge/)
    expect(()=>invalid({edges:[{from:'A',to:'Z',weight:1}]})).toThrow(/endpoint/)
    expect(()=>analyzeGraph(SYNTHETIC_LAB_GRAPH,{traversal:'bfs',start:'A',minimumWeight:0,removeNode:null})).toThrow(/threshold/)
    expect(()=>analyzeGraph(SYNTHETIC_LAB_GRAPH,{traversal:'bfs',start:'Z',minimumWeight:1,removeNode:null})).toThrow(/start/)
    expect(()=>invalid({nodes:Array.from({length:81},(_,i)=>({id:String.fromCharCode(65+i)}))})).toThrow(/node count/)
  })
  it('fails closed on unimported or mismatched real biological data',()=>{
    const dataset={available:true,snapshot:'783',seed_root_id:'720575940625431866',
      source_identity_verified:false,database_sha256:'a'.repeat(64),license:'CC BY-NC 4.0'}
    const response={
      seed_root_id:'720575940625431866',scope:'selected_subgraph_only' as const,
      direction:'presynaptic_to_postsynaptic',structural_not_functional:true as const,
      nodes:[{root_id:'720575940625431866',cell_type:null},
        {root_id:'720575940625448968',cell_type:'known label'}],
      edges:[{pre_root_id:'720575940625431866',post_root_id:'720575940625448968',syn_count:5}],
    }
    const graph=graphFromImportedFAFB(dataset,response)
    expect(graph.sourceIdentityVerified).toBe(false)
    expect(graph.snapshot).toBe('783')
    expect(graph.nodes[0]?.id).toBe('720575940625431866')
    expect(graph.edges[0]?.weight).toBe(5)
    expect(()=>graphFromImportedFAFB({...dataset,available:false},response)).toThrow(/imported/)
    expect(()=>graphFromImportedFAFB(dataset,{...response,direction:'undirected'})).toThrow(/source or direction/)
    expect(()=>graphFromImportedFAFB(dataset,{...response,
      edges:[{...response.edges[0]!,syn_count:-2}]})).toThrow(/edge weight/)
    expect(()=>graphFromImportedFAFB(dataset,{...response,
      edges:[{...response.edges[0]!,post_root_id:'1234'}]})).toThrow(/endpoint/)
  })
})
