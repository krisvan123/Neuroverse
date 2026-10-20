import { useEffect, useState } from 'react'
import { ApiStatus } from './components/ApiStatus'
import { FeatureCard } from './components/FeatureCard'
import { BrainExperience } from './components/BrainExperience'

const resources = [
  { label: 'Nature · Adult fruit fly connectome', href: 'https://doi.org/10.1038/s41586-024-07558-y' },
  { label: 'FlyWire Codex · Dataset portal', href: 'https://codex.flywire.ai/' },
  { label: 'Research methods & sources', href: 'https://github.com/krisvan123/Neuroverse/blob/main/docs/scientific-standards.md' },
]

export default function App() {
  const [quietMode, setQuietMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    document.documentElement.dataset.motion = quietMode ? 'quiet' : 'ambient'
    return () => { delete document.documentElement.dataset.motion }
  }, [quietMode])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to main content</a>
      <div className="cosmic-backdrop" aria-hidden="true"><span className="starlayer layer-one" /><span className="starlayer layer-two" /><span className="cosmic-haze" /></div>
      <header className="site-header">
        <div className="container navigation">
          <a href="#home" className="brand" aria-label="Neuroverse home"><span className="brand-mark" aria-hidden="true">✺</span>NEUROVERSE<span className="brand-period">.</span></a>
          <nav className="nav-links" aria-label="Primary navigation">
            <a href="#learning">Learn</a><a href="#explore">Explore</a><a href="#lab">The Lab</a><a href="#sources">Research</a>
          </nav>
          <div className="nav-actions"><ApiStatus /><a className="nav-cta" href="#learning">Enter the universe <span aria-hidden="true">↗</span></a></div>
        </div>
      </header>

      <main id="main">
        <section id="home" className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dash" /> THE FUTURE OF SCIENCE EXPLORATION</div>
            <h1 id="hero-title">The universe<br />inside <em>every</em><br />connection<span className="heading-period">.</span></h1>
            <p className="hero-subtitle">Journey into the architecture of intelligence. Discover how biological networks inspire new ways to understand science and computation.</p>
            <div className="hero-actions"><a className="button-primary" href="#learning">Start your discovery <span aria-hidden="true">↗</span></a><a className="button-text" href="#explore">Explore the concept <span aria-hidden="true">→</span></a></div>
            <div className="hero-meta"><span>01 / 03 — DISCOVER</span><span className="meta-line" /><span>AN INTERACTIVE SCIENCE EXPERIENCE</span></div>
          </div>
          <div className="hero-art"><BrainExperience paused={quietMode} onToggleMotion={() => setQuietMode((value) => !value)} /></div>
          <div className="hero-side-caption" aria-hidden="true">CONNECTING KNOWLEDGE · INSPIRED BY NATURE</div>
        </section>

        <section className="insight-band" aria-label="Project vision"><div className="container band-inner"><span>THE NEUROVERSE MISSION</span><p>Science should be something you <em>experience</em> — not just something you read.</p><span className="band-star" aria-hidden="true">✳</span></div></section>

        <section id="learning" className="pathways container" aria-labelledby="pathways-title">
          <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dash" /> THREE WAYS TO SEE FURTHER</div><h2 id="pathways-title">Curiosity has<br /><em>no limits.</em></h2></div><p>One universe. Three journeys. Follow the pathways from introductory neuroscience to real connectome research and computational thinking.</p></div>
          <div className="feature-grid">
            <FeatureCard number="01" icon="✺" title="Understand the science" description="Uncover the fundamentals of neurons, synapses, and the incredible systems they form." state="LEARNING ACADEMY · PLANNED" href="#sources" />
            <FeatureCard number="02" icon="⌁" title="Explore the connections" description="Navigate research-backed structural networks with scientific context and verifiable sources." state="CONNECTOME EXPLORER · PLANNED" href="#explore" />
            <FeatureCard number="03" icon="⟡" title="Experiment with ideas" description="Turn biological questions into graph algorithms, structured experiments, and reproducible results." state="EXPERIMENT STUDIO · PLANNED" href="#lab" />
          </div>
        </section>

        <section id="explore" className="explore-section container" aria-labelledby="explore-title">
          <div className="explore-panel"><div className="explore-orbit" aria-hidden="true"><div className="orbit-core">✳</div></div><div className="explore-description"><div className="eyebrow"><span className="eyebrow-dash" /> BENEATH THE SURFACE</div><h2 id="explore-title">A real network.<br /><em>A universe of questions.</em></h2><p>Neuroverse will use an attributed subset of the adult fruit fly connectome. The source-validated connectome data pipeline is available. Data-linked anatomical exploration arrives in a later phase. The 3D fly-brain hero is original procedural concept art, not a biological reconstruction.</p><div className="tag-row"><span>FAFB V783 PIPELINE · AVAILABLE</span><span>FLYWIRE FAFB V783</span></div></div></div>
        </section>

        <section id="lab" className="lab-section container" aria-labelledby="lab-title"><div><div className="eyebrow"><span className="eyebrow-dash" /> THE EXPERIMENTAL MINDSET</div><h2 id="lab-title">Don't just observe.<br /><em>Ask what happens next.</em></h2></div><div><p>Future labs will combine graph theory, computational experiments, and clear distinctions between model results and biological evidence. We are building the foundation first.</p><a href="https://github.com/krisvan123/Neuroverse" target="_blank" rel="noopener noreferrer" className="button-outline">View development on GitHub <span aria-hidden="true">↗</span></a></div></section>

        <section id="sources" className="sources-section container" aria-labelledby="sources-title"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dash" /> GROUNDED IN RESEARCH</div><h2 id="sources-title">Wonder, with <em>evidence.</em></h2></div><p>Our aim is to clearly separate observed scientific data, mathematical models, and visual illustration. Follow the sources behind the ideas.</p></div><ul className="source-list">{resources.map((resource) => <li key={resource.href}><a href={resource.href} target="_blank" rel="noopener noreferrer"><span>{resource.label}</span><span aria-hidden="true">↗</span></a></li>)}</ul></section>
      </main>
      <footer className="site-footer"><div className="container footer-content"><a className="brand" href="#home"><span className="brand-mark" aria-hidden="true">✺</span>NEUROVERSE<span className="brand-period">.</span></a><div><p>Independent, research-inspired science education. Not affiliated with FlyWire.</p><button className="quiet-toggle" type="button" onClick={() => setQuietMode((value) => !value)} aria-pressed={quietMode}>{quietMode ? 'Enable ambient motion' : 'Reduce ambient motion'}</button></div><span>PHASE 04 / COSMIC EXPERIENCE</span></div></footer>
    </div>
  )
}
