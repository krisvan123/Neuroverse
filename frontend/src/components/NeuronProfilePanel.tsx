import type { RefObject } from 'react'
import type { NeuronProfile } from '../science/atlas'
import { neuronColor } from '../scenes/connectomeGeometry'

export function NeuronProfilePanel({ id, profile, error, headingRef, onClose, onRetry }: {
  id: string; profile: NeuronProfile | null; error: string; headingRef: RefObject<HTMLHeadingElement | null>
  onClose: () => void; onRetry: () => void
}) {
  return <aside className="cells-inspector cells-inspector-open" aria-label="Neuron details">
    <div className="connectome-profile-top"><span className="atlas-overline"><i style={{ background: neuronColor(id) }} /> SELECTED NEURON</span>
      <button onClick={onClose} aria-label="Close neuron details">×</button></div>
    <h3 tabIndex={-1} ref={headingRef}>{profile?.label || 'Neuron details'}</h3>
    <code className="cells-root-id">{id}</code>
    {error ? <div role="alert"><p>{error}</p><button className="atlas-secondary" onClick={onRetry}>Retry annotation</button></div> : profile ? <>
      <div className="connectome-cell-tags"><span>{profile.cell_class || 'Unclassified'}</span><span>{profile.side || 'Side unannotated'}</span></div>
      <div className="cells-function"><span className="atlas-overline">{profile.function.evidence === 'cell_class_context' ? 'CELL-CLASS CONTEXT' : 'FUNCTION NOT ESTABLISHED'}</span>
        <h4>{profile.function.title}</h4><p>{profile.function.summary}</p>
        <p className="cells-evidence-note">{profile.function.limitation}</p>
        <a href={profile.function.source_reference} target="_blank" rel="noopener noreferrer">Read the research ↗</a>
      </div>
      <dl className="cells-facts">
        <div><dt>Cell type</dt><dd>{profile.cell_type || 'Not annotated'}</dd></div>
        <div><dt>Hemibrain type match</dt><dd>{profile.hemibrain_type || 'Not annotated'}</dd></div>
        <div><dt>Predicted transmitter</dt><dd>{profile.top_nt || 'Not available'}</dd></div>
        {profile.known_nt && <div><dt>Reported transmitter</dt><dd>{profile.known_nt}<small>{profile.known_nt_source}</small></dd></div>}
      </dl>
      <details className="connectome-cell-source"><summary>Coordinates & source</summary>
        {profile.position_nm && <p>{profile.position_kind === 'soma' ? 'Soma' : 'Source anchor'} (nm): <code>{profile.position_nm.map(n => n.toLocaleString('en-US')).join(' / ')}</code></p>}
        {profile.status && <p>Source quality flag: {profile.status}</p>}
        <a href={profile.source_url} target="_blank" rel="noopener noreferrer">Original annotation table ↗</a>
      </details>
      <a className="connectome-codex" href={profile.codex_url} target="_blank" rel="noopener noreferrer">Open this neuron in FlyWire ↗</a>
    </> : <p role="status">Loading this cell’s annotations…</p>}
  </aside>
}
