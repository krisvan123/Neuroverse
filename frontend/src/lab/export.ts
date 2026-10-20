import { analyzeGraph, validateLabGraph, type LabGraph, type LabOptions, type LabResult } from './engine'

/** Format v1 includes the entire bounded graph, not only summary numbers,
 * so a later analyst can re-run the exact same deterministic model.
 * No cookie, account, server persistence or external analytics.
 */
export interface LabExport {
  schema:'neuroverse-lab/v1'
  analysis:'graph-model-only-not-functional-brain-evidence'
  graph:LabGraph
  parameters:LabOptions
  result:LabResult
  limitations:string[]
}
export function createExport(graph:LabGraph,params:LabOptions):LabExport{
  const original=validateLabGraph(graph)
  return {
    schema:'neuroverse-lab/v1',
    analysis:'graph-model-only-not-functional-brain-evidence',
    graph:original,
    parameters:{...params},
    result:analyzeGraph(original,params),
    limitations:[
      'Directed reachability and graph metrics are mathematical model properties, not observed neural activity or behavior.',
      'A modeled node deletion is not a physical intervention in a brain.',
      original.origin==='synthetic-teaching-example'
        ? 'Every node and edge is independently invented for teaching; no FAFB neuron data were used.'
        : 'Imported user-provided FAFB v783 connectivity is a bounded, filtered local subset; upstream file identity is not independently authenticated unless verified by a separate official checksum.',
      'Removing a graph node also removes adjacent edges; original input and the original baseline are preserved.',
      'A synapse-count threshold here filters previously retained local edges; it cannot restore edges excluded by the importer or neighborhood API.',
    ],
  }
}
export function toLabJSON(data:LabExport):string{
  return JSON.stringify(data,null,2)+'\n'
}

/** Flatten metadata, every input node/edge, results and visit orders.
 * Rows are deterministic. Quote every cell, escape spreadsheets' formula
 * prefix to avoid dangerous content when source metadata is user-provided.
 */
export function toLabCSV(data:LabExport):string {
  const rows:(string|number|null)[][]=[
    ['record_type','subject','target','value','units_or_notes'],
    ['metadata','schema','',data.schema,'version'],
    ['metadata','analysis','',data.analysis,'caution'],
    ['metadata','origin','',data.graph.origin,'provenance'],
    ['metadata','snapshot','',data.graph.snapshot,'dataset snapshot'],
    ['metadata','selection','',data.graph.selection,'sampling method'],
    ['metadata','sourceReference','',data.graph.sourceReference,'reference'],
    ['metadata','sourceIdentityVerified','',String(data.graph.sourceIdentityVerified),'boolean'],
    ['metadata','databaseSha256','',data.graph.databaseSha256??'','SHA-256'],
    ['metadata','license','',data.graph.license,'data license'],
    ['setting','traversal','',data.parameters.traversal,'algorithm'],
    ['setting','start','',data.parameters.start,'node ID'],
    ['setting','minimumWeight','',data.parameters.minimumWeight,data.graph.origin==='fafb-v783-local-subgraph'?'identified synapses per retained pair':'illustrative teaching weight'],
    ['setting','removeNode','',data.parameters.removeNode??'','node ID or blank'],
    ['setting','seed','',data.graph.seed,'source seed'],
  ]
  for(const node of data.graph.nodes) rows.push(['node',node.id,'',node.label??'','label'])
  for(const edge of data.graph.edges) rows.push(['edge',edge.from,edge.to,edge.weight,
    data.graph.origin==='fafb-v783-local-subgraph'?'identified chemical synapses':'synthetic teaching weight'])
  for(const [label,scenario] of [
    ['baseline',data.result.baseline],
    ['modified',data.result.modified],
  ] as const){
    for(const [name,value] of Object.entries(scenario.metrics)){
      rows.push(['metric',label,name,value,name==='retainedWeightSum'?'sum of retained weights':'graph quantity'])
    }
    scenario.visitOrder.forEach((id,i)=>rows.push(['visit',label,id,i+1,'traversal order']))
  }
  rows.push(['result','lostFromBaseline','',data.result.lostFromBaseline.join(';'),'node IDs'])
  rows.push(['result','newlyUnreachableSurvivors','',data.result.newlyUnreachableSurvivors.join(';'),'node IDs'])
  for(const item of data.limitations)rows.push(['limitation','','',item,'methodological warning'])
  const quote=(value:string|number|null):string=>{
    let text=String(value??'')
    if(/^[=+\-@\t\r]/.test(text))text="'"+text
    return '"'+text.replace(/"/g,'""')+'"'
  }
  return rows.map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n'
}
