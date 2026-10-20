import { useCallback,useEffect,useState } from 'react'
import type { ChangeEvent } from 'react'
import type { LabExport } from '../lab/export'
import { clearAcademyProgress, readAcademyProgress } from '../academy/progress'
import {
  JOURNAL_EVENT,JOURNAL_MAX_IMPORT_BYTES,JOURNAL_MAX_RECORDS,
  clearJournal,exportJournalJSON,importJournalJSON,readJournal,removeExperiment,
  type JournalRecord,
} from '../journal/storage'

function downloadJournal():void {
  const blob=new Blob([exportJournalJSON()],{type:'application/json;charset=utf-8'})
  const url=URL.createObjectURL(blob)
  const link=document.createElement('a')
  link.href=url;link.download='neuroverse-research-journal.json'
  document.body.appendChild(link);link.click();link.remove()
  URL.revokeObjectURL(url)
}
export function ResearchJournal({onReopen}:{onReopen:(experiment:LabExport)=>void}){
  const [records,setRecords]=useState<JournalRecord[]>([])
  const [progress,setProgress]=useState(()=>readAcademyProgress().value)
  const [status,setStatus]=useState('')
  const [error,setError]=useState('')
  const [storageError,setStorageError]=useState('')
  const refresh=useCallback(()=>{
    try {
      const saved=readJournal()
      setRecords(saved)
      setProgress(readAcademyProgress().value)
      setError('')
      setStorageError('')
    } catch(e) {
      setStorageError('The local journal could not be read. Existing data were not overwritten: '+
        (e instanceof Error?e.message:'storage unavailable'))
    }
  },[])
  useEffect(()=>{
    refresh()
    const storage=(e:StorageEvent)=>{
      if(e.key===null||e.key==='neuroverse.journal.v1'||e.key==='neuroverse.academy.v1')refresh()
    }
    window.addEventListener(JOURNAL_EVENT,refresh)
    window.addEventListener('storage',storage)
    window.addEventListener('neuroverse-academy-reset',refresh)
    return ()=>{
      window.removeEventListener(JOURNAL_EVENT,refresh)
      window.removeEventListener('storage',storage)
      window.removeEventListener('neuroverse-academy-reset',refresh)
    }
  },[refresh])
  const erase=(id:string)=>{
    if(!window.confirm('Delete this saved experiment from this browser? This cannot be undone.'))return
    try { removeExperiment(id);setStatus('Experiment deleted from this browser.');refresh() }
    catch(e){setError(e instanceof Error?e.message:'Deletion failed')}
  }
  const reset=()=>{
    if(!window.confirm('Delete ALL saved experiments and Mission 001 learning progress on this browser? Export a backup first. This cannot be undone.'))return
    try {
      // Complete both storage operations before displaying success.
      clearJournal();clearAcademyProgress()
      setStatus('Journal and Academy progress cleared.');refresh()
    } catch(e){setError('Reset could not be completed: '+(e instanceof Error?e.message:'storage unavailable'))}
  }
  const importFile=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0]
    event.target.value=''
    if(!file)return
    if(file.size>JOURNAL_MAX_IMPORT_BYTES){
      setError('The file exceeds the 1.5 MB import limit. Nothing was changed.')
      return
    }
    try {
      const report=importJournalJSON(await file.text())
      setStatus(report.added+' experiments imported, '+report.skipped+' duplicates skipped. Existing records preserved.')
      refresh()
    }catch(e) {setError('Import failed without changing your journal: '+(e instanceof Error?e.message:'invalid file'))}
  }
  const handleExport=()=>{
    try{downloadJournal();setStatus('Journal JSON exported. Keep the file somewhere safe.')}
    catch(e){setError('Could not export journal: '+(e instanceof Error?e.message:'storage unavailable'))}
  }
  return (
    <section id="journal" className="journal-section container" aria-labelledby="journal-title">
      <div className="journal-heading">
        <div><span className="eyebrow"><span className="eyebrow-dash"/> PHASE 08 / LOCAL RESEARCH JOURNAL</span>
          <h2 id="journal-title">Your discoveries.<br/><em>Worth revisiting.</em></h2></div>
        <p>Keep reproducible experiments and continue learning where you left off. Everything below stays in this browser unless you explicitly export a file.</p>
      </div>
      <div className="journal-summary">
        <div><span>Saved experiments</span><strong>{records.length}<small> / {JOURNAL_MAX_RECORDS}</small></strong></div>
        <div><span>Academy checks passed</span><strong>{progress.passed.length}<small> / 10</small></strong></div>
        <div><span>Graph lesson explored</span><strong>{progress.demoDone?'Complete':'Not yet'}</strong></div>
        <div><span>Last Academy chapter</span><strong>{String(progress.chapter+1).padStart(2,'0')}<small> / 05</small></strong></div>
      </div>
      <div className="journal-tools">
        <div><h3>Personal research archive</h3>
          <p>Results are recomputed and validated when loaded, not treated as observed brain activity.</p></div>
        <div className="journal-actions">
          <button type="button" onClick={handleExport} disabled={Boolean(storageError)}>Export journal JSON ↓</button>
          <input id="journal-import-file" type="file" accept=".json,application/json"
            onChange={event=>{void importFile(event)}}/>
          <label className="journal-import" htmlFor="journal-import-file">Import JSON ↑</label>
        </div>
      </div>
      {error&&<p className="journal-notice journal-error" role="alert">{error}</p>}
      {storageError&&<p className="journal-notice journal-error" role="alert">{storageError}
        <button type="button" onClick={refresh}>Retry reading storage</button></p>}
      {status&&<p className="journal-notice" role="status">{status}</p>}
      <div className="journal-records" aria-label="Saved computational experiments">
        {records.length===0&&!storageError?(
          <div className="journal-empty"><span aria-hidden="true">✧</span>
            <h3>Your research begins with a question.</h3>
            <p>No experiments saved on this browser. Run a synthetic example in the Lab, then select “Save to journal”. You can also import an original Phase 07 JSON export.</p>
            <a href="#lab">Open the experiment lab ↗</a></div>
        ):!storageError?records.map(item=>(
          <article className="journal-card" key={item.id}>
            <div><span className="journal-tag">{item.experiment.graph.origin==='synthetic-teaching-example'
              ?'SYNTHETIC TEACHING MODEL':'USER-IMPORTED FAFB V783 · UNVERIFIED FILE ORIGIN'}</span>
              <h3>{item.title}</h3>
              <p>Saved {new Date(item.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})} · Start {item.experiment.parameters.start} · Threshold {item.experiment.parameters.minimumWeight}</p>
              <p>{item.experiment.result.baseline.metrics.reachable} reachable original → {item.experiment.result.modified.metrics.reachable} modified · {item.experiment.graph.nodes.length} nodes</p>
              <small>Graph-model inference only. Node removal is not biological intervention.</small></div>
            <div className="journal-card-actions">
              <button type="button" onClick={()=>onReopen(item.experiment)}>Reopen in Lab ↗</button>
              <button type="button" className="journal-delete" onClick={()=>erase(item.id)}>Delete record</button>
            </div>
          </article>
        )):<p className="journal-notice journal-error" role="status">Journal contents are hidden until storage can be read safely. Existing records are left unchanged.</p>}
      </div>
      <div className="journal-privacy">
        <div><h3>Privacy & data ownership</h3>
          <p>Neuroverse uses browser localStorage for small, versioned Academy and Journal records. No login, tracking, cloud upload or personal profile is required. The site cannot read records stored by another browser or device. Clearing browser data, private browsing or storage quotas may erase them. Export the journal to create a backup; progress is currently local only.</p>
          <p>Imported records are user-supplied and are never independently authenticated as official FAFB datasets. Untrusted JSON is size-limited, schema-checked and numerically recomputed; it is never executed as code. Graph data are capped at 80 nodes / 250 edges per experiment, and the journal holds up to {JOURNAL_MAX_RECORDS} records.</p></div>
        <button className="journal-reset" type="button" onClick={reset}>Clear all local progress & experiments</button>
      </div>
    </section>
  )
}
