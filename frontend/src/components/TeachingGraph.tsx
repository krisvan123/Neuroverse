import { useEffect, useState } from 'react'
import { bfsFrames, comparison, TEACHING_EDGES, TEACHING_NODES } from '../academy/graphDemo'
import type { TeachingNode } from '../academy/graphDemo'

const POSITIONS: Record<TeachingNode, [number, number]> = {
  A:[65,140], B:[195,65], C:[195,215], D:[345,140], E:[495,140], F:[345,34],
}

/**
 * Original, deterministic educational graph. Every edge/node is invented
 * and visually labelled SYNTHETIC. It never substitutes for actual FAFB data.
 */
export function TeachingGraph({ onComplete }: { onComplete: () => void }) {
  const [removeD, setRemoveD] = useState(false)
  const [index, setIndex] = useState(0)
  const [finishedOriginal, setFinishedOriginal] = useState(false)
  const [compared, setCompared] = useState(false)
  const frames=bfsFrames(TEACHING_EDGES,removeD?'D':null)
  const frame=frames[Math.min(index,frames.length-1)]!
  const result=comparison()

  useEffect(() => {
    if (finishedOriginal && compared) onComplete()
  }, [finishedOriginal,compared,onComplete])

  const nextStep=() => {
    const next=Math.min(index+1,frames.length-1)
    setIndex(next)
    if (!removeD && next===frames.length-1) setFinishedOriginal(true)
  }
  const changeRemoval=() => { setRemoveD((old)=>!old);setIndex(0) }
  return (
    <section className="academy-graph" aria-labelledby="academy-graph-title">
      <div className="academy-graph-head">
        <div>
          <span className="academy-synthetic">SYNTHETIC TEACHING EXAMPLE · NOT FLYWIRE DATA</span>
          <h4 id="academy-graph-title">A tiny network, one question: what can A reach?</h4>
          <p>Arrows are directional. Discover the next node using BFS; optionally remove D from the MODEL, then compare.</p>
        </div>
        <span className="academy-graph-badge">FIFO QUEUE</span>
      </div>
      <div className="academy-network">
        <svg viewBox="0 0 565 282" role="img" aria-label="Synthetic graph: A points to B and C, B to D and F, C to D, D to E">
          <defs>
            <marker id="academy-arrow-tip" viewBox="0 0 10 10" refX="11" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L10 5 L0 10 Z" fill="#8bdbe8" />
            </marker>
          </defs>
          {TEACHING_EDGES.filter(([from,to])=>!removeD || (from!=='D'&&to!=='D')).map(([from,to])=>{
            const a=POSITIONS[from],b=POSITIONS[to]
            const angle=Math.atan2(b[1]-a[1],b[0]-a[0])
            return (
              <line key={from+to} x1={a[0]+Math.cos(angle)*29} y1={a[1]+Math.sin(angle)*29}
                x2={b[0]-Math.cos(angle)*29} y2={b[1]-Math.sin(angle)*29}
                stroke="#8bdbe8" strokeWidth="2" strokeOpacity=".7" markerEnd="url(#academy-arrow-tip)" />
            )
          })}
          {TEACHING_NODES.filter(node=>!removeD||node!=='D').map(node=>{
            const [x,y]=POSITIONS[node]
            const processed=frame.visited.includes(node)
            const next=frame.queue.includes(node)
            return (
              <g key={node}>
                <circle cx={x} cy={y} r="25" fill={processed?'#7ce9d4':next?'#254b65':'#12283f'}
                  stroke={processed?'#aaffee':next?'#9adcf1':'#4e7897'} strokeWidth="2"/>
                <text x={x} y={y+6} textAnchor="middle" fontWeight="700"
                  fontSize="18" fill={processed?'#092233':'#ecf8ff'}>{node}</text>
              </g>
            )
          })}
          {removeD&&<text x="345" y="145" textAnchor="middle" fontSize="14" fill="#f3bdb1">D removed</text>}
        </svg>
        <div className="academy-network-key" aria-label="Teaching graph legend">
          <span><i className="academy-dot queued"/>Queued</span>
          <span><i className="academy-dot processed"/>Processed</span>
          <span><i className="academy-dot unseen"/>Not yet reached</span>
        </div>
      </div>
      <div className="academy-graph-controls">
        <button type="button" onClick={nextStep} disabled={index===frames.length-1}>
          {index===frames.length-1?'Traversal complete':'Next BFS step →'}
        </button>
        <button type="button" className="academy-secondary" onClick={()=>setIndex(0)}>Replay</button>
        <button type="button" className="academy-secondary" aria-pressed={removeD} onClick={changeRemoval}>
          {removeD?'Restore model node D':'Remove model node D'}
        </button>
      </div>
      <div className="academy-queue" role="status" aria-live="polite">
        <span>STEP {index}/{frames.length-1}</span>
        <p>{frame.message}</p>
        <p><strong>Queue:</strong> {frame.queue.length?frame.queue.join(' → '):'empty'} · <strong>Processed:</strong> {frame.visited.length?frame.visited.join(', '):'none'}</p>
      </div>
      <div className="academy-comparison">
        <button type="button" className="academy-secondary" onClick={()=>setCompared(true)}>
          Compare original vs node D removed
        </button>
        {compared&&(
          <div className="academy-comparison-result" role="status">
            <p><strong>Original:</strong> {result.original.length} nodes reachable from A, including A.</p>
            <p><strong>After D removed:</strong> {result.removedD.length} nodes reachable, including A.</p>
            <p><strong>No longer reachable in the modified graph:</strong> {result.lost.join(', ')}. D is removed; E remains but is unreachable.</p>
            <small>Mathematical reachability only; this does not model neuronal damage, learning, behavior or measured electrical signals.</small>
          </div>
        )}
      </div>
      {finishedOriginal&&compared&&<p className="academy-demo-done" role="status">Teaching demo complete. Continue the knowledge checks to finish Mission 001.</p>}
      {!finishedOriginal&&<p className="academy-tip">Finish the original A → ... BFS traversal and inspect the comparison to complete this demo.</p>}
    </section>
  )
}
