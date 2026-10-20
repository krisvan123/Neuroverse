import { createExport, type LabExport } from '../lab/export'
import { validateLabGraph, type LabOptions } from '../lab/engine'

export const JOURNAL_STORAGE_KEY = 'neuroverse.journal.v1'
export const JOURNAL_EVENT = 'neuroverse-journal-change'
export const JOURNAL_MAX_RECORDS = 12
export const JOURNAL_MAX_IMPORT_BYTES = 1_500_000
const MAX_RECORD_BYTES = 250_000
const MAX_STORAGE_BYTES = 1_500_000

export interface JournalRecord {
  id: string
  createdAt: string
  title: string
  experiment: LabExport
}
interface JournalBundle {
  schema: 'neuroverse-journal/v1'
  records: JournalRecord[]
}
const encoder = new TextEncoder()
const obj = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const exactKeys = (value: Record<string, unknown>, keys: string[]): boolean =>
  Object.keys(value).sort().join('|') === [...keys].sort().join('|')
const sizeOf = (value: string): number => encoder.encode(value).length

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted)
  if (obj(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])]))
  return value
}
function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right))
}
function reject(message: string): never {
  throw new Error('Journal rejected the data: ' + message)
}
function reasonableString(value: unknown, max = 1500): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max
}

/** A stored result must be a reproducible Phase 07 export, never trusted summary numbers. */
export function verifyExperiment(value: unknown): LabExport {
  if (!obj(value) || !exactKeys(value, ['schema','analysis','graph','parameters','result','limitations']))
    return reject('unexpected experiment fields or missing fields')
  if (value.schema !== 'neuroverse-lab/v1' ||
    value.analysis !== 'graph-model-only-not-functional-brain-evidence')
    return reject('unsupported scientific analysis schema')
  if (!obj(value.graph) || !exactKeys(value.graph, [
    'origin','snapshot','seed','nodes','edges','sourceReference',
    'sourceIdentityVerified','databaseSha256','selection','license',
  ])) return reject('invalid graph metadata')
  const graph = value.graph
  for (const field of ['snapshot','sourceReference','selection','license']) {
    if (!reasonableString(graph[field])) return reject('graph source metadata exceeds limits')
  }
  if (typeof graph.seed !== 'string' || graph.seed.length > 40) return reject('invalid source seed')
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges) ||
    graph.nodes.length > 80 || graph.edges.length > 250) return reject('graph exceeds limits')
  for (const node of graph.nodes) {
    if (!obj(node) || !exactKeys(node, Object.hasOwn(node,'label')?['id','label']:['id']) ||
      (node.label !== undefined && node.label !== null &&
        (typeof node.label !== 'string' || node.label.length > 200))) return reject('invalid node fields')
  }
  for (const edge of graph.edges) {
    if (!obj(edge) || !exactKeys(edge,['from','to','weight'])) return reject('invalid directed edge fields')
  }
  if (!obj(value.parameters) || !exactKeys(value.parameters,['traversal','start','minimumWeight','removeNode']))
    return reject('invalid algorithm parameters')
  if (!Array.isArray(value.limitations) || value.limitations.length !== 5 ||
    !value.limitations.every(item => reasonableString(item))) return reject('missing model limitations')
  // Make an independently recomputed export using the original scientific engine.
  const expected = createExport(validateLabGraph(graph as unknown as LabExport['graph']),
    value.parameters as unknown as LabOptions)
  if (!equal(value.result, expected.result)) return reject('stored numerical outcomes do not reproduce')
  if (!equal(value.limitations, expected.limitations)) return reject('scientific caveats were altered')
  return expected
}

function validateRecord(value: unknown): JournalRecord {
  if (!obj(value) || !exactKeys(value,['id','createdAt','title','experiment']))
    return reject('invalid journal record fields')
  if (typeof value.id !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(value.id))
    return reject('invalid record identifier')
  if (!reasonableString(value.title, 80)) return reject('invalid record title')
  if (typeof value.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    new Date(value.createdAt).toISOString() !== value.createdAt ||
    Date.parse(value.createdAt) > Date.now() + 86_400_000)
    return reject('invalid or future record date')
  const experiment = verifyExperiment(value.experiment)
  const record: JournalRecord = {
    id:value.id, title:value.title, createdAt:value.createdAt, experiment,
  }
  if (sizeOf(JSON.stringify(record)) > MAX_RECORD_BYTES) return reject('experiment record is too large')
  return record
}

function parseBundle(value: unknown): JournalRecord[] {
  if (!obj(value) || !exactKeys(value,['schema','records']) ||
    value.schema !== 'neuroverse-journal/v1' ||
    !Array.isArray(value.records) || value.records.length > JOURNAL_MAX_RECORDS)
    return reject('unsupported journal or too many records')
  const records = value.records.map(validateRecord)
  if (new Set(records.map(item => item.id)).size !== records.length) return reject('duplicate record identifiers')
  return records
}
function notify(): void { window.dispatchEvent(new Event(JOURNAL_EVENT)) }

export function readJournal(): JournalRecord[] {
  const raw = localStorage.getItem(JOURNAL_STORAGE_KEY)
  if (raw === null) return []
  if (sizeOf(raw) > MAX_STORAGE_BYTES) return reject('stored journal exceeds size limit')
  let decoded: unknown
  try { decoded = JSON.parse(raw) } catch { return reject('stored journal JSON is corrupted') }
  return parseBundle(decoded)
}
function writeJournal(records: JournalRecord[]): void {
  if (records.length > JOURNAL_MAX_RECORDS) return reject('journal is full; export or delete a record first')
  const payload: JournalBundle = { schema:'neuroverse-journal/v1', records }
  const content = JSON.stringify(payload)
  if (sizeOf(content) > MAX_STORAGE_BYTES) return reject('browser storage budget exceeded')
  // This operation is atomic within localStorage; failures do not replace existing records.
  localStorage.setItem(JOURNAL_STORAGE_KEY,content)
  notify()
}
function newId(): string {
  return 'nv-' + (globalThis.crypto?.randomUUID?.() ?? (Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)))
}
export function saveExperiment(experiment: LabExport): {duplicate:boolean} {
  const verified = verifyExperiment(experiment)
  const records = readJournal()
  if (records.some(record => equal(record.experiment,verified))) return {duplicate:true}
  const record = validateRecord({
    id:newId(),createdAt:new Date().toISOString(),
    title:(verified.graph.origin==='synthetic-teaching-example'?'Synthetic graph':'Imported FAFB v783') +
      ' · '+verified.parameters.traversal.toUpperCase(),
    experiment:verified,
  })
  writeJournal([record,...records])
  return {duplicate:false}
}
export function removeExperiment(id: string): void {
  const records = readJournal()
  if (!records.some(record => record.id === id)) return reject('record does not exist')
  writeJournal(records.filter(record => record.id !== id))
}
export function clearJournal(): void {
  localStorage.removeItem(JOURNAL_STORAGE_KEY)
  notify()
}
export function exportJournalJSON(): string {
  return JSON.stringify({schema:'neuroverse-journal/v1',records:readJournal()})+'\n'
}

/** Import is all-or-nothing: validate every entry and storage size before a write.
 * The original Phase 07 single-experiment JSON can also be imported directly.
 */
export function importJournalJSON(raw: string): {added:number;skipped:number} {
  if (sizeOf(raw) > JOURNAL_MAX_IMPORT_BYTES) return reject('JSON import exceeds 1.5 MB')
  let parsed: unknown
  try { parsed=JSON.parse(raw) } catch { return reject('file is not valid JSON') }
  let incoming: JournalRecord[]
  if (obj(parsed) && parsed.schema === 'neuroverse-lab/v1') {
    const experiment = verifyExperiment(parsed)
    incoming = [validateRecord({
      id:newId(),createdAt:new Date().toISOString(),
      title:'Imported '+experiment.parameters.traversal.toUpperCase()+' experiment',
      experiment,
    })]
  } else {
    incoming=parseBundle(parsed)
  }
  const records = readJournal()
  const merged = [...records]
  let added=0,skipped=0
  for (const record of incoming) {
    const known = merged.find(item => item.id === record.id)
    if (known && !equal(known,record)) return reject('record ID conflicts with a different saved experiment')
    if (known || merged.some(item=>equal(item.experiment,record.experiment))) {
      skipped++
      continue
    }
    merged.unshift(record)
    added++
  }
  if (added) writeJournal(merged)
  return {added,skipped}
}
