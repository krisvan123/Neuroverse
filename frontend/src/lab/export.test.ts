import { describe,expect,it } from 'vitest'
import { createExport,toLabCSV,toLabJSON } from './export'
import { SYNTHETIC_LAB_GRAPH } from './engine'

describe('Phase 07 deterministic reproducible export',()=>{
  const params={traversal:'bfs' as const,start:'A',minimumWeight:1,removeNode:'D'}
  it('contains original edges, exact parameters, baseline and modified outcomes',()=>{
    const result=createExport(SYNTHETIC_LAB_GRAPH,params)
    expect(result.schema).toBe('neuroverse-lab/v1')
    expect(result.graph.edges).toHaveLength(7)
    expect(result.result.baseline.metrics.reachable).toBe(6)
    expect(result.result.modified.metrics.reachable).toBe(4)
    expect(result.result.newlyUnreachableSurvivors).toEqual(['E'])
    expect(JSON.parse(toLabJSON(result))).toEqual(result)
    expect(toLabJSON(result)).toBe(toLabJSON(createExport(SYNTHETIC_LAB_GRAPH,params)))
  })
  it('CSV serializes input, metadata, methods, results and safeguards spreadsheet formulas',()=>{
    const data=createExport({...SYNTHETIC_LAB_GRAPH,sourceReference:'=HYPERLINK("evil")'},params)
    const csv=toLabCSV(data)
    expect(csv).toContain('"edge","A","B","1"')
    expect(csv).toContain('"metric","baseline","reachable","6"')
    expect(csv).toContain('"visit","modified","F","4"')
    expect(csv).toContain('"\'=HYPERLINK(""evil"")"')
    expect(csv).toContain('"setting","removeNode",""')
    expect(csv.split('\r\n').length).toBeGreaterThan(30)
  })
})
