import { beforeEach, describe, expect, it } from 'vitest'
import { createExport } from '../lab/export'
import { SYNTHETIC_LAB_GRAPH } from '../lab/engine'
import {
  JOURNAL_STORAGE_KEY, clearJournal, exportJournalJSON, importJournalJSON,
  readJournal, removeExperiment, saveExperiment, verifyExperiment,
} from './storage'

const example = () => createExport(SYNTHETIC_LAB_GRAPH,{
  traversal:'bfs',start:'A',minimumWeight:1,removeNode:'D',
})
beforeEach(()=>localStorage.clear())

describe('Phase 08 reproducible and bounded local journal',()=>{
  it('saves locally, reads reproducible graph results and prevents duplicates',()=>{
    expect(saveExperiment(example())).toEqual({duplicate:false})
    expect(saveExperiment(example())).toEqual({duplicate:true})
    expect(readJournal()).toHaveLength(1)
    expect(readJournal()[0]!.experiment.result.modified.metrics.reachable).toBe(4)
    expect(exportJournalJSON()).toContain('neuroverse-journal/v1')
    const id=readJournal()[0]!.id
    removeExperiment(id)
    expect(readJournal()).toEqual([])
  })
  it('round-trips export/import without overwriting or duplicating',()=>{
    saveExperiment(example())
    const file=exportJournalJSON()
    clearJournal()
    expect(importJournalJSON(file)).toEqual({added:1,skipped:0})
    expect(importJournalJSON(file)).toEqual({added:0,skipped:1})
    expect(readJournal()).toHaveLength(1)
  })
  it('accepts Phase 07 JSON and refuses altered numeric results and missing warnings',()=>{
    const exp=example()
    expect(importJournalJSON(JSON.stringify(exp))).toEqual({added:1,skipped:0})
    const bad=structuredClone(exp)
    bad.result.modified.metrics.reachable=500
    expect(()=>verifyExperiment(bad)).toThrow(/do not reproduce/)
    expect(()=>importJournalJSON(JSON.stringify(bad))).toThrow(/do not reproduce/)
    bad.result.modified.metrics.reachable=4
    bad.limitations=[]
    expect(()=>importJournalJSON(JSON.stringify(bad))).toThrow(/limitations/)
    expect(readJournal()).toHaveLength(1)
  })
  it('rejects corrupted, oversized, conflicting and non-atomic inputs',()=>{
    expect(()=>importJournalJSON('{')).toThrow(/not valid JSON/)
    expect(()=>importJournalJSON(' '.repeat(1_500_001))).toThrow(/exceeds/)
    saveExperiment(example())
    const original=exportJournalJSON()
    const bundle=JSON.parse(original)
    bundle.records.push({...bundle.records[0],title:'Tampered same ID'})
    expect(()=>importJournalJSON(JSON.stringify(bundle))).toThrow(/duplicate record identifiers/)
    expect(localStorage.getItem(JOURNAL_STORAGE_KEY)).toBe(JSON.stringify(JSON.parse(original)))
    localStorage.setItem(JOURNAL_STORAGE_KEY,'{')
    expect(()=>readJournal()).toThrow(/corrupted/)
    expect(localStorage.getItem(JOURNAL_STORAGE_KEY)).toBe('{')
  })
  it('does not trust extra provenance data or invalid graph fields',()=>{
    const exp=example()
    const unknown={...exp,graph:{...exp.graph,unreviewed:'external'}}
    expect(()=>verifyExperiment(unknown)).toThrow(/graph metadata/)
    const oversized={...exp,graph:{...exp.graph,selection:'x'.repeat(5000)}}
    expect(()=>verifyExperiment(oversized)).toThrow(/metadata exceeds/)
  })
})
