/** This diagram is concept artwork, not FlyWire or physiological activity data. */
const edges: Array<[number, number]> = [
  [0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 4], [2, 6], [3, 5], [3, 7],
  [4, 8], [5, 8], [5, 9], [6, 8], [6, 10], [7, 9], [8, 11], [9, 11],
  [10, 11], [1, 3], [4, 5], [6, 7], [8, 9],
]
const points = [
  [300, 188], [216, 105], [390, 97], [222, 273], [320, 47], [333, 271],
  [465, 171], [133, 194], [443, 274], [274, 351], [530, 260], [388, 381],
]

export function NetworkIllustration() {
  return (
    <div className="network-visual" aria-label="Conceptual network illustration, not a brain scan" role="img">
      <div className="orbit orbit-outer" aria-hidden="true" />
      <div className="orbit orbit-inner" aria-hidden="true" />
      <svg className="network-svg" viewBox="0 0 620 445" focusable="false" aria-hidden="true">
        <defs>
          <linearGradient id="connectionLine" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#4a80a9" stopOpacity=".16" />
            <stop offset=".6" stopColor="#63d2ed" stopOpacity=".68" />
            <stop offset="1" stopColor="#c8a8ff" stopOpacity=".14" />
          </linearGradient>
          <radialGradient id="nodeGlow">
            <stop stopColor="#e5fcff" />
            <stop offset=".3" stopColor="#8adfff" />
            <stop offset="1" stopColor="#6c7ac4" />
          </radialGradient>
        </defs>
        <g stroke="url(#connectionLine)" strokeWidth="1.3">
          {edges.map(([a, b]) => {
            const start = points[a]; const end = points[b]
            if (!start || !end) return null
            return <line key={`${a}-${b}`} x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} />
          })}
        </g>
        {points.map(([x, y], index) => (
          <g key={index}>
            <circle cx={x} cy={y} r={index === 0 ? '20' : '12'} fill="#70b9e8" opacity=".09" />
            <circle cx={x} cy={y} r={index === 0 ? '7' : '4'} fill="url(#nodeGlow)" />
          </g>
        ))}
      </svg>
      <div className="visual-label visual-label-top"><span className="live-dot" /> NETWORK MAPPING / CONCEPT</div>
      <div className="visual-label visual-label-bottom">BIOLOGY <span>×</span> COMPUTATION</div>
      <div className="visual-caption">ILLUSTRATIVE MODEL · NOT SCIENTIFIC DATA</div>
    </div>
  )
}
