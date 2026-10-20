import { describe, expect, it } from 'vitest'
import { isHealthResponse } from './client'

describe('isHealthResponse', () => {
  it('accepts the versioned API health shape', () => {
    expect(isHealthResponse({ status: 'ok', service: 'neuroverse-api', phase: 2, version: '0.1.0' })).toBe(true)
  })
  it('rejects invalid or misleading response values', () => {
    expect(isHealthResponse({ status: 'ok', service: 'neuroverse-api', phase: 'two', version: '0.1.0' })).toBe(false)
    expect(isHealthResponse(null)).toBe(false)
  })
})
