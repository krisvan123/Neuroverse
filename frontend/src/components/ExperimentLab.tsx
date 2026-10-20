import { useEffect,useMemo,useState } from 'react'
import { apiGet,rootIdIsValid,type DatasetState,type Subgraph } from '../science/api'
import {
  analyzeGraph,compareNodeIds,SYNTHETIC_LAB_GRAPH,
  type LabGraph,type LabMetrics,type LabOptions,type LabScenario,
  type Traversal,type TraversalFrame,
} from '../lab/engine'
import { graphFromImportedFAFB } from '../lab/fromFAFB'
import { createExport,toLabCSV,toLabJSON, type LabExport } from '../lab/export'
import { saveExperiment,verifyExperiment } from '../journal/storage'

const EXPERIMENT_GUIDE='https://github.com/krisvan123/Neuroverse/blob/main/docs/phase-07-experiment-lab.md'
const SETUP_GUIDE='https://github.com/krisvan123/Neuroverse/blob/main/docs/scientific-data-pipeline.md'

function downloadText(filename:string,content:string,type:string):void {
  const blob=new Blob([content],{type})
  const url=URL.createObjectURL(blob)
  const anchor=document.createElement('a')
  anchor.href=url
  anchor.download=filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const METRICS=[
  ['nodes','Included graph nodes','nodes'],
  ['edges','Retained directed pairs','edges'],
  ['reachable','Reachable from start','nodes incl. start'],
  ['startOutDegree','Starting-node out-degree','directed edges'],
  ['meanOutDegree','Mean out-degree','edges / node'],
  ['directedDensity','Loop-excluded directed density','proportion'],
  ['retainedWeightSum','Retained sum of edge weights','source-dependent'],
] as const

function fmtMetric(name:keyof LabMetrics,value:number):string {
  if(name==='meanOutDegree')return value.toFixed(2)
  if(name==='directedDensity')return value.toFixed(3)
  return value.toLocaleString('en-US')
}

function DrawGraph({
  scenario,frame,title,seed,origin,
}:{
  scenario:LabScenario
  frame:TraversalFrame
  title:string
  seed:string
  origin:LabGraph['origin']
}) {
  const showing=[...scenario.availableNodes].sort((a,b)=>{
    if(a===seed)return -1
    if(b===seed)return 1
    return compareNodeIds(a,b)
  }).slice(0,18)
  const shown=new Set(showing)
  const coordinates=new Map(showing.map((id,index)=>{
    const angle=index*2*Math.PI/Math.max(1,showing.length)-Math.PI/2
    const radius=showing.length===1?0:158
    return [id,{x:260+radius*Math.cos(angle),y:198+radius*Math.sin(angle)}] as const
  }))
  const previewEdges=scenario.retainedEdges.filter(e=>shown.has(e.from)&&shown.has(e.to))
  const processed=new Set(frame.visited)
  const queued=new Set(frame.frontier)
  return (
    <figure className="lab-graph-figure">
      <figcaption>
        <strong>{title}</strong>
        <span>GRAPH-THEORETIC LAYOUT · NOT ANATOMICAL POSITION</span>
      </figcaption>
      <svg viewBox="0 0 520 400" className="lab-graph-svg" role="img"
        aria-label={title+': mathematical graph preview of '+showing.length+' nodes with '+previewEdges.length+' visible directed edges'}>
        <defs>
          <marker id="nv-lab-arrow" viewBox="0 0 10 10" refX="10" refY="5"
            markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L10 5 L0 10 Z" fill="#9acfe5" />
          </marker>
        </defs>
        {previewEdges.map(edge=>{
          const a=coordinates.get(edge.from),b=coordinates.get(edge.to)
          if(!a||!b)return null
          if(edge.from===edge.to) {
            return <circle key={edge.from+'→'+edge.to} cx={a.x+23} cy={a.y-20} r="14"
              fill="none" stroke="#96cee1" strokeWidth="1.5" strokeDasharray="4 3">
              <title>Self-loop at {edge.from}, weight {edge.weight}</title>
            </circle>
          }
          const angle=Math.atan2(b.y-a.y,b.x-a.x)
          return <line key={edge.from+'→'+edge.to}
            x1={a.x+Math.cos(angle)*23} y1={a.y+Math.sin(angle)*23}
            x2={b.x-Math.cos(angle)*26} y2={b.y-Math.sin(angle)*26}
            markerEnd="url(#nv-lab-arrow)" stroke="#8ac5d9" strokeWidth="1.5" strokeOpacity=".7">
            <title>{edge.from+' → '+edge.to+' · weight '+edge.weight}</title>
          </line>
        })}
        {showing.map(id=>{
          const pos=coordinates.get(id)!
          const isCurrent=frame.current===id
          const isVisited=processed.has(id)
          const isQueued=queued.has(id)
          const fill=isCurrent?'#b9f5ef':isVisited?'#72d9be':isQueued?'#4683a7':'#203a54'
          const label=origin==='synthetic-teaching-example'?id:'…'+id.slice(-4)
          return (
            <g key={id}>
              <circle cx={pos.x} cy={pos.y} r={isCurrent?22:19} fill={fill}
                stroke={isCurrent?'#effffb':'#b1e3f2'} strokeWidth={isCurrent?3:1.5}>
                <title>{id+(isCurrent?' current':isVisited?' visited':isQueued?' queued':' unvisited')}</title>
              </circle>
              <text x={pos.x} y={pos.y+4} fontSize={origin==='synthetic-teaching-example'?15:9}
                fontWeight="800" fill={isVisited||isCurrent?'#062238':'#edf9ff'} textAnchor="middle">{label}</text>
            </g>
          )
        })}
      </svg>
      <p className="lab-preview-note">Showing {showing.length} of {scenario.availableNodes.length} included nodes and {previewEdges.length} of {scenario.retainedEdges.length} directed edges.
        Node positions are a mathematical circle layout, NOT fruit-fly brain locations.</p>
      {scenario.availableNodes.length>showing.length && <p className="lab-preview-note">The table and computed metrics use all selected nodes, not only the 18-node preview.</p>}
      <div className="lab-legend" aria-label="Graph legend">
        <span>● Current</span><span>● Processed</span><span>● Frontier</span><span>○ Not reached</span>
      </div>
    </figure>
  )
}

function MetricTable({ baseline,modified,removed,origin }:{
  baseline:LabMetrics;modified:LabMetrics;removed:string|null;origin:LabGraph['origin']
}){
  return (
    <div className="lab-metric-scroll">
      <table className="lab-metrics-table">
        <caption>Numerical results — original baseline versus the changed model</caption>
        <thead><tr><th scope="col">Graph metric</th><th scope="col">Original</th>
          <th scope="col">{removed?'After removal':'Unchanged comparison'}</th><th scope="col">Unit</th></tr></thead>
        <tbody>{METRICS.map(([name,label,unit])=>(
          <tr key={name}>
            <th scope="row">{label}</th>
            <td>{fmtMetric(name,baseline[name])}</td>
            <td>{fmtMetric(name,modified[name])}</td>
            <td>{name==='retainedWeightSum'
              ?origin==='fafb-v783-local-subgraph'?'identified synapses on retained pairs':'illustrative weight units'
              :unit}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

export function ExperimentLab({restoreRecord}:{restoreRecord?:LabExport|null}) {
  const [origin,setOrigin]=useState<'synthetic'|'real'>('synthetic')
  const [graph,setGraph]=useState<LabGraph|null>(SYNTHETIC_LAB_GRAPH)
  const [loading,setLoading]=useState(false)
  const [loadError,setLoadError]=useState('')
  const [traversal,setTraversal]=useState<Traversal>('bfs')
  const [start,setStart]=useState('A')
  const [removed,setRemoved]=useState('')
  const [minimum,setMinimum]=useState(1)
  const [panel,setPanel]=useState<'baseline'|'modified'>('baseline')
  const [frameIndex,setFrameIndex]=useState(0)
  const [lastExport,setLastExport]=useState('')

  useEffect(()=>{
    if(!restoreRecord)return
    try {
      const imported=verifyExperiment(restoreRecord)
      setGraph(imported.graph)
      setOrigin(imported.graph.origin==='synthetic-teaching-example'?'synthetic':'real')
      setTraversal(imported.parameters.traversal)
      setStart(imported.parameters.start)
      setRemoved(imported.parameters.removeNode??'')
      setMinimum(imported.parameters.minimumWeight)
      setLoadError('');setFrameIndex(0);setPanel('baseline')
      setLastExport('Verified journal experiment restored. Recomputed outputs match the saved record.')
    } catch(error) {
      setLastExport('Record could not be reopened: '+(error instanceof Error?error.message:'invalid experiment'))
    }
  },[restoreRecord])

  const options:LabOptions={
    traversal,start,minimumWeight:minimum,removeNode:removed||null,
  }
  const computed=useMemo(()=>{
    if(!graph)return {result:null,error:''}
    try{return {result:analyzeGraph(graph,{
      traversal,start,minimumWeight:minimum,removeNode:removed||null,
    }),error:''}}
    catch(e){return {result:null,error:e instanceof Error?e.message:'Graph calculation failed'}}
  },[graph,traversal,start,removed,minimum])

  const chooseSynthetic=()=>{
    setOrigin('synthetic');setGraph(SYNTHETIC_LAB_GRAPH);setStart('A')
    setRemoved('');setMinimum(1);setLoadError('');setFrameIndex(0);setPanel('baseline')
    setLastExport('')
  }
  const chooseReal=()=>{
    setOrigin('real');setGraph(null);setStart('');setRemoved('')
    setLoadError('');setFrameIndex(0);setPanel('baseline');setLastExport('')
  }
  const loadReal=async()=>{
    setLoading(true);setLoadError('')
    try {
      const dataset=await apiGet<DatasetState>('/api/v1/datasets/current')
      if(!dataset.available||dataset.snapshot!=='783'){
        throw new Error('No valid local FAFB v783 dataset is configured. Follow the scientific data setup guide, then restart FastAPI.')
      }
      if(!dataset.seed_root_id||!rootIdIsValid(dataset.seed_root_id)) {
        throw new Error('The imported dataset did not report a valid seed root ID.')
      }
      const response=await apiGet<Subgraph>(
        '/api/v1/neurons/'+dataset.seed_root_id+'/neighborhood?max_nodes=60&max_edges=160',
      )
      if(response.seed_root_id!==dataset.seed_root_id)throw new Error('FAFB neighborhood seed mismatches dataset selection.')
      const converted=graphFromImportedFAFB(dataset,response)
      setGraph(converted);setStart(converted.seed);setRemoved('')
      setMinimum(1);setFrameIndex(0);setPanel('baseline')
    }catch(e){
      setGraph(null)
      setLoadError(e instanceof Error?e.message:'Real network request failed')
    }finally{setLoading(false)}
  }

  const changeSetting=()=>{setFrameIndex(0);setLastExport('')}
  const result=computed.result
  const scenario=result?.[panel]
  const frames=scenario?.frames??[]
  const frame=frames[Math.min(frameIndex,Math.max(0,frames.length-1))]
  const record = ():ReturnType<typeof createExport>|null => {
    if(!graph||!result)return null
    return createExport(graph,options)
  }
  const exportAs=(kind:'json'|'csv')=>{
    const data=record()
    if(!data)return
    const name='neuroverse-phase07-'+(origin==='real'?'fafb-v783':'synthetic')+'-'+traversal+'.'+kind
    downloadText(name,kind==='json'?toLabJSON(data):toLabCSV(data),
      kind==='json'?'application/json;charset=utf-8':'text/csv;charset=utf-8')
    setLastExport(name+' saved from this session. The original graph is unchanged.')
  }

  const saveToJournal=()=>{
    const data=record()
    if(!data)return
    try {
      const saved=saveExperiment(data)
      setLastExport(saved.duplicate?'This exact experiment is already in your journal.':
        'Experiment saved in this browser. Open the Research Journal to review it.')
    } catch(error) {
      setLastExport('Experiment was NOT saved: '+(error instanceof Error?error.message:'storage unavailable'))
    }
  }

  const maxForBar=Math.max(1,result?.baseline.metrics.nodes??1)
  return (
    <section id="lab" className="lab-workspace container" aria-labelledby="lab-title">
      <div className="lab-intro">
        <div>
          <div className="eyebrow"><span className="eyebrow-dash"/> PHASE 07 / COMPUTATIONAL EXPERIMENT LAB</div>
          <h2 id="lab-title">Don't just observe.<br/><em>Test the network.</em></h2>
        </div>
        <p>Trace directed connectivity with BFS or DFS, change one graph-model assumption, and inspect what the numbers actually establish. Original data are preserved; these are mathematical experiments, not recordings of living neural activity.</p>
      </div>

      <div className="lab-shell">
        <aside className="lab-settings" aria-label="Experiment configuration">
          <div className="lab-overline">01 / CHOOSE EVIDENCE</div>
          <h3>Experiment setup</h3>
          <div className="lab-source-picker" role="group" aria-label="Experiment graph source">
            <button type="button" aria-pressed={origin==='synthetic'} onClick={chooseSynthetic}>Synthetic teaching graph</button>
            <button type="button" aria-pressed={origin==='real'} onClick={chooseReal}>Imported FAFB v783</button>
          </div>
          {origin==='real' && (
            <div className="lab-data-import">
              <p>This mode reads your <strong>original user-imported, filtered FAFB v783 subgraph</strong> from the local FastAPI backend. No fake fallback or live API scraping.</p>
              <button type="button" onClick={()=>{void loadReal()}} disabled={loading}>
                {loading?'Checking original FAFB subset…':'Load local FAFB subgraph'}
              </button>
              {loadError && <p className="lab-error" role="alert">{loadError}</p>}
              {!graph && <p><a href={SETUP_GUIDE} target="_blank" rel="noopener noreferrer">How to import real FAFB connections ↗</a></p>}
            </div>
          )}
          {graph && (
            <>
              <div className="lab-source-badge">
                {graph.origin==='synthetic-teaching-example'?'SYNTHETIC TEACHING GRAPH · NOT BIOLOGICAL DATA':'USER-IMPORTED FAFB V783 · LOCAL FILTERED SUBGRAPH'}
              </div>
              <div className="lab-options">
                <label htmlFor="lab-algorithm">Traversal algorithm</label>
                <select id="lab-algorithm" value={traversal} onChange={event=>{
                  setTraversal(event.target.value as Traversal);changeSetting()
                }}>
                  <option value="bfs">BFS — breadth-first search</option>
                  <option value="dfs">DFS — depth-first search</option>
                </select>
                <label htmlFor="lab-start">Starting node</label>
                <select id="lab-start" value={start} onChange={event=>{
                  setStart(event.target.value);changeSetting()
                }}>
                  {graph.nodes.map(n=><option key={n.id} value={n.id}>{n.id+(n.label?' · '+n.label:'')}</option>)}
                </select>
                <label htmlFor="lab-weight">
                  {origin==='real'?'Minimum identified synapses / retained pair':'Minimum synthetic edge weight'}
                </label>
                <input id="lab-weight" type="number" inputMode="numeric" min={1} max={100000000} step={1}
                  value={minimum} onChange={event=>{
                    setMinimum(Math.max(1,Math.min(100000000,Math.floor(Number(event.target.value)||1))))
                    changeSetting()
                  }}/>
                <small>{origin==='real'
                  ?'Applied AFTER the original importer and neighborhood API filters. Raising this cannot recover excluded edges.'
                  :'All invented teaching edges have illustrative weight 1. Raise to 2 to remove their links mathematically.'}</small>
                <label htmlFor="lab-remove">Structural comparison — remove model node</label>
                <select id="lab-remove" value={removed} onChange={event=>{
                  setRemoved(event.target.value);changeSetting()
                }}>
                  <option value="">None — keep baseline unchanged</option>
                  {graph.nodes.map(n=><option key={n.id} value={n.id}>{n.id}</option>)}
                </select>
                <small>Removing a node also removes its adjacent edges from the modified model. The original baseline is untouched.</small>
              </div>
              <div className="lab-source-details">
                <strong>Source and limits</strong>
                <p>{graph.selection}</p>
                <p>Snapshot: {graph.snapshot}. Source identity: {graph.sourceIdentityVerified?'marked verified by source metadata':'NOT independently authenticated'}.</p>
                <p>License: {graph.license}.</p>
                <p className="lab-reference">{graph.sourceReference}</p>
                {graph.databaseSha256 && <p>Local database SHA-256: <code>{graph.databaseSha256}</code></p>}
              </div>
            </>
          )}
        </aside>

        <div className="lab-results">
          {!graph ? (
            <div className="lab-wait" role="status">
              <h3>No real connectivity data loaded</h3>
              <p>Import an official FAFB dataset, start FastAPI and load its selected neighborhood. For a completely offline exercise choose <strong>Synthetic teaching graph</strong>. No fabricated scientific records will appear here.</p>
            </div>
          ) : !result || !scenario || !frame ? (
            <div className="lab-wait" role="alert"><h3>Experiment could not be evaluated</h3>
              <p>{computed.error||'Unknown input error.'}</p></div>
          ) : (
            <>
              <div className="lab-results-top">
                <div>
                  <span className="lab-overline">02 / EXPLORE THE OUTCOME</span>
                  <h3>Directed-network analysis</h3>
                  <p>{traversal.toUpperCase()} visits {result.baseline.metrics.reachable} nodes from {start} in the original, filtered graph. {removed?'Compare removal of '+removed+' without changing that original.':'Choose a node removal for a structural comparison.'}</p>
                </div>
                <span className="lab-method-tag">DIRECTED · DETERMINISTIC · GRAPH MODEL</span>
              </div>

              <div className="lab-kpis">
                <div><span>Original reachable</span><strong>{result.baseline.metrics.reachable}</strong><small>of {result.baseline.metrics.nodes} selected nodes</small></div>
                <div><span>Modified reachable</span><strong>{result.modified.metrics.reachable}</strong><small>of {result.modified.metrics.nodes} remaining nodes</small></div>
                <div><span>Additional survivors unreachable</span><strong>{result.newlyUnreachableSurvivors.length}</strong><small>besides the removed node</small></div>
              </div>

              <div className="lab-graph-panels">
                <div className="lab-graph-switch" role="group" aria-label="Graph scenario display">
                  <button type="button" aria-pressed={panel==='baseline'} onClick={()=>{setPanel('baseline');setFrameIndex(0)}}>Original graph</button>
                  <button type="button" aria-pressed={panel==='modified'} onClick={()=>{setPanel('modified');setFrameIndex(0)}}>Modified model</button>
                </div>
                <DrawGraph scenario={scenario} frame={frame} seed={start}
                  title={panel==='baseline'?'Original, unmodified network':'Modified model'+(removed?' (without '+removed+')':' (no change)')}
                  origin={graph.origin}/>
              </div>

              <div className="lab-traversal">
                <div className="lab-traversal-top">
                  <div><span className="lab-overline">03 / STEP THROUGH THE ALGORITHM</span>
                    <h4>{traversal.toUpperCase()} traversal timeline</h4></div>
                  <span>Step {Math.min(frameIndex,frames.length-1)} / {Math.max(0,frames.length-1)}</span>
                </div>
                <div className="lab-step-controls">
                  <button type="button" onClick={()=>setFrameIndex(0)} disabled={frameIndex===0}>Reset steps</button>
                  <button type="button" onClick={()=>setFrameIndex(Math.max(0,frameIndex-1))}
                    disabled={frameIndex===0}>← Previous</button>
                  <button type="button" className="primary" onClick={()=>setFrameIndex(Math.min(frames.length-1,frameIndex+1))}
                    disabled={frameIndex>=frames.length-1}>Next step →</button>
                </div>
                <div className="lab-traversal-note" role="status" aria-live="polite">
                  <p>{frame.note}</p>
                  <div><strong>{traversal==='bfs'?'Queue':'DFS call stack'}:</strong> {frame.frontier.join(' → ')||'empty'}</div>
                  <div><strong>Processed order:</strong> {frame.visited.join(' → ')||'none yet'}</div>
                </div>
              </div>

              <div className="lab-metrics">
                <span className="lab-overline">04 / COMPARE AND INTERPRET</span>
                <h4>Before and after — model reachability</h4>
                <div className="lab-bar-chart" role="img" aria-label={'Original reachable '+result.baseline.metrics.reachable+'; modified reachable '+result.modified.metrics.reachable}>
                  <div><span>Original</span><div className="lab-bar-track"><span style={{width:result.baseline.metrics.reachable/maxForBar*100+'%'}}/></div><strong>{result.baseline.metrics.reachable}</strong></div>
                  <div><span>Modified</span><div className="lab-bar-track"><span className="modified" style={{width:result.modified.metrics.reachable/maxForBar*100+'%'}}/></div><strong>{result.modified.metrics.reachable}</strong></div>
                </div>
                <p className="lab-caution">Chart bars use the original graph's total selected node count as the shared scale. Self-loops are excluded from density but are counted in out-degree and retained edge totals.</p>
                <MetricTable baseline={result.baseline.metrics} modified={result.modified.metrics}
                  removed={result.removedFromModel} origin={graph.origin}/>
                <div className="lab-impact">
                  <strong>Structural comparison</strong>
                  {removed?(
                    <p>Removed from the mathematical model: <code>{removed}</code>. Nodes no longer reachable from <code>{start}</code>, including the removed node if formerly reachable: {result.lostFromBaseline.join(', ')||'none'}. Surviving nodes newly unreachable: <strong>{result.newlyUnreachableSurvivors.join(', ')||'none'}</strong>.</p>
                  ):<p>No intervention selected, so the comparison reproduces the exact original baseline.</p>}
                  <p>This result measures <em>graph reachability</em> in the selected, thresholded model. It does not establish signal transmission, firing times, lesions, behavior, cognition or biological causation.</p>
                </div>
              </div>

              <div className="lab-export">
                <div><span className="lab-overline">05 / REPRODUCE YOUR RESULT</span>
                  <h4>Export the actual input and output</h4>
                  <p>Download the source-selected nodes and edges, weights, threshold, start, algorithm, before/after metrics, traversals, provenance and limitations. Save locally to your Research Journal, or export the exact research inputs and results. Browser storage is device-specific and not backed up.</p>
                </div>
                <div className="lab-export-buttons">
                  <button type="button" onClick={()=>exportAs('json')}>Export JSON ↓</button>
                  <button type="button" onClick={()=>exportAs('csv')}>Export CSV ↓</button>
                  <button type="button" onClick={saveToJournal}>Save to journal ☆</button>
                  <a className="lab-journal-link" href="#journal">Open journal ↗</a>
                </div>
                {lastExport&&<p role="status" className="lab-export-status">{lastExport}</p>}
                <a href={EXPERIMENT_GUIDE} target="_blank" rel="noopener noreferrer">Methods, mathematical definitions and reproducibility guide ↗</a>
              </div>
              <details className="lab-edge-list">
                <summary>Inspect all retained source edges ({scenario.retainedEdges.length})</summary>
                <div className="lab-metric-scroll">
                  <table><thead><tr><th>Source</th><th>Target</th><th>{origin==='real'?'Synapse count':'Teaching weight'}</th></tr></thead>
                    <tbody>{scenario.retainedEdges.map(e=><tr key={e.from+'-'+e.to}><td>{e.from}</td><td>{e.to}</td><td>{e.weight}</td></tr>)}</tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
