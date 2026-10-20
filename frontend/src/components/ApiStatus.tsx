import { useApiHealth } from '../hooks/useApiHealth'

export function ApiStatus() {
  const { status, retry } = useApiHealth()
  return (
    <div className="api-status" role="status" aria-live="polite">
      <span className={`api-status-dot status-${status}`} aria-hidden="true" />
      <span>{status === 'online' ? 'API CONNECTED' : status === 'checking' ? 'CHECKING API' : 'API OFFLINE'}</span>
      {status === 'offline' && <button className="retry" type="button" onClick={retry}>Retry</button>}
    </div>
  )
}
