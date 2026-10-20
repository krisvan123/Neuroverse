import { beforeEach,describe,expect,it } from 'vitest'
import { ACADEMY_STORAGE_KEY,clearAcademyProgress,readAcademyProgress,writeAcademyProgress } from './progress'
beforeEach(()=>localStorage.clear())
describe('Phase 08 Academy persistence',()=>{
  it('saves only a bounded and versioned completion state',()=>{
    const value={schema:'neuroverse-academy/v1' as const,chapter:3,passed:['q01'],demoDone:true}
    // IDs are tested against the actual authored Academy question list.
    const validId=readAcademyProgress().value.passed
    expect(validId).toEqual([])
    expect(()=>writeAcademyProgress(value)).not.toThrow()
    expect(readAcademyProgress().value).toEqual(value)
    clearAcademyProgress()
    expect(readAcademyProgress().value.passed).toEqual([])
  })
  it('rejects tampering and leaves invalid stored data unchanged during read',()=>{
    localStorage.setItem(ACADEMY_STORAGE_KEY,'{broken')
    expect(readAcademyProgress().warning).toMatch(/could not be restored/)
    expect(localStorage.getItem(ACADEMY_STORAGE_KEY)).toBe('{broken')
    expect(()=>writeAcademyProgress({
      schema:'neuroverse-academy/v1',chapter:4,passed:['untrusted-id'],demoDone:false,
    })).toThrow(/Invalid/)
  })
})
