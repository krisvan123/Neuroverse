/** Infinite, seamless mission statement. The second copy is decorative only.
 * Animating one CSS track costs no JS frame loop and honors global motion pause.
 */
export default function MissionBanner() {
  const slogan = (
    <>Science should be something you <em>experience</em> — not just something you read.</>
  )

  return (
    <section className="insight-band mission-banner" aria-label="The Neuroverse mission">
      <div className="container mission-banner__layout">
        <span className="mission-banner__label">THE NEUROVERSE MISSION</span>
        <div className="mission-banner__marquee">
          <div className="mission-banner__track">
            <div className="mission-banner__unit">
              <p className="mission-banner__text">{slogan}</p>
              <span className="mission-banner__asterisk" aria-hidden="true">✳</span>
            </div>
            <div className="mission-banner__unit mission-banner__unit--duplicate" aria-hidden="true">
              <p className="mission-banner__text">{slogan}</p>
              <span className="mission-banner__asterisk">✳</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
