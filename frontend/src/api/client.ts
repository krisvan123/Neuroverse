/** Keep all backend URL construction in one place. Never embed API secrets in Vite env. */
export const getApiBaseUrl = () => (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export interface HealthResponse {
  status: 'ok'
  service: 'neuroverse-api'
  phase: number
  version: string
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/health`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(`Health check failed (${response.status})`)
  const body: unknown = await response.json()
  if (!isHealthResponse(body)) throw new Error('The server sent an unexpected response')
  return body
}

export function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return obj.status === 'ok' && obj.service === 'neuroverse-api' &&
    typeof obj.phase === 'number' && typeof obj.version === 'string'
}
