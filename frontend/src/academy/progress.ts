import { ACADEMY_QUESTIONS } from './content'

export const ACADEMY_STORAGE_KEY = 'neuroverse.academy.v1'
export const ACADEMY_RESET_EVENT = 'neuroverse-academy-reset'

export interface AcademyProgress {
  schema: 'neuroverse-academy/v1'
  chapter: number
  passed: string[]
  demoDone: boolean
}

export const EMPTY_PROGRESS: AcademyProgress = {
  schema: 'neuroverse-academy/v1', chapter: 0, passed: [], demoDone: false,
}
const knownQuestions = new Set(ACADEMY_QUESTIONS.map(question => question.id))

function validProgress(value: unknown): value is AcademyProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const data = value as Record<string, unknown>
  return Object.keys(data).sort().join(',') === 'chapter,demoDone,passed,schema'
    && data.schema === EMPTY_PROGRESS.schema
    && Number.isInteger(data.chapter) && Number(data.chapter) >= 0 && Number(data.chapter) < 5
    && typeof data.demoDone === 'boolean'
    && Array.isArray(data.passed) && data.passed.length <= knownQuestions.size
    && data.passed.every(id => typeof id === 'string' && knownQuestions.has(id))
    && new Set(data.passed).size === data.passed.length
}

/** Malformed storage is never silently overwritten during initial hydration. */
export function readAcademyProgress(): { value: AcademyProgress; warning: string } {
  try {
    const raw = localStorage.getItem(ACADEMY_STORAGE_KEY)
    if (raw === null) return { value: { ...EMPTY_PROGRESS, passed: [] }, warning: '' }
    if (raw.length > 4096) throw new Error('Stored learning progress exceeds the safe size limit.')
    const parsed: unknown = JSON.parse(raw)
    if (!validProgress(parsed)) throw new Error('Stored learning progress has an incompatible format.')
    return { value: parsed, warning: '' }
  } catch (error) {
    return {
      value: { ...EMPTY_PROGRESS, passed: [] },
      warning: 'Saved learning progress could not be restored; the original stored value was left unchanged. ' +
        (error instanceof Error ? error.message : 'Browser storage is unavailable.'),
    }
  }
}

export function writeAcademyProgress(value: AcademyProgress): void {
  if (!validProgress(value)) throw new Error('Invalid Academy progress was not saved.')
  localStorage.setItem(ACADEMY_STORAGE_KEY, JSON.stringify(value))
}

export function clearAcademyProgress(): void {
  localStorage.removeItem(ACADEMY_STORAGE_KEY)
  window.dispatchEvent(new Event(ACADEMY_RESET_EVENT))
}
