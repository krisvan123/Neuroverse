/** Lightweight, non-animated accessible poster; no external image licenses. */
export function BrainPoster() {
  return (
    <svg className="brain-poster-svg" viewBox="0 0 660 540" role="img" aria-label="Conceptual illustrated bilateral fruit fly brain, not FlyWire morphology" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nvrBrainGlow">
          <stop offset="0%" stopColor="#9acbf3" stopOpacity=".35" />
          <stop offset="55%" stopColor="#4778cc" stopOpacity=".12" />
          <stop offset="100%" stopColor="#111c37" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nvrBrainShell" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#418eac" stopOpacity=".75" />
          <stop offset="70%" stopColor="#8572bf" stopOpacity=".56" />
          <stop offset="100%" stopColor="#4b9da4" stopOpacity=".4" />
        </linearGradient>
      </defs>
      <ellipse cx="332" cy="252" rx="255" ry="235" fill="url(#nvrBrainGlow)" />
      <g fill="url(#nvrBrainShell)" stroke="#7bbad4" strokeOpacity=".75" strokeWidth="2">
        <path d="M329 107 C275 64 181 72 150 132 C106 163 115 222 138 254 C115 308 158 351 209 363 C246 402 297 363 326 323 Z"/>
        <path d="M332 107 C387 62 474 73 502 132 C550 165 543 223 523 253 C551 303 510 350 465 362 C426 401 366 364 335 323 Z"/>
        <ellipse cx="130" cy="271" rx="61" ry="88" transform="rotate(-22 130 271)" />
        <ellipse cx="530" cy="272" rx="61" ry="88" transform="rotate(22 530 272)" />
        <path d="M300 321 C291 354 303 408 330 429 C355 405 366 348 354 320 Z"/>
      </g>
      <g fill="none" stroke="#c0ebff" strokeOpacity=".6" strokeWidth="1.8" strokeLinecap="round">
        <path d="M328 340 Q222 301 198 173 Q179 149 170 147"/>
        <path d="M330 341 Q244 261 240 139 L221 122"/>
        <path d="M331 343 Q389 288 415 152 L439 120"/>
        <path d="M330 345 Q424 319 467 226 L503 210"/>
        <path d="M327 356 Q264 358 212 295 L182 268"/>
        <path d="M333 357 Q402 354 455 292 L475 280"/>
        <path d="M280 279 Q234 223 190 227"/>
        <path d="M382 291 Q445 239 468 244"/>
      </g>
      {[[221, 122], [170,147], [439,120], [503,210], [182,268], [475,280], [190,227], [468,244]] .map(([x,y],index)=> (
        <circle key={index} cx={x} cy={y} r="4.5" fill={index % 2 ? '#bfa4ff' : '#a9ecf9'} />
      ))}
      <ellipse cx="330" cy="264" rx="226" ry="189" fill="none" stroke="#87c8e7" strokeOpacity=".2" strokeWidth="1" strokeDasharray="4 9" />
    </svg>
  )
}
