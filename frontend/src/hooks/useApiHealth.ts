import { useCallback, useEffect, useState } from 'react'
import { fetchHealth } from '../api/client'

type ApiStatus = 'checking' | 'online' | 'offline'

/** Aborts obsolete requests and avoids showing misleading success when the API is unavailable. */
export function useApiHealth() {
  const [status, setStatus] = useState<ApiStatus>('checking')
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    fetchHealth(controller.signal)
      .then(() => { if (!controller.signal.aborted) setStatus('online') })
      .catch(() => { if (!controller.signal.aborted) setStatus('offline') })
    return () => controller.abort()
  }, [attempt])

  return { status, retry }
}
