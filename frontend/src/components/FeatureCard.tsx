interface FeatureCardProps {
  number: string
  icon: string
  title: string
  description: string
  state: string
  href: string
}

export function FeatureCard({ number, icon, title, description, state, href }: FeatureCardProps) {
  return (
    <a href={href} className="feature-card">
      <div className="feature-top"><span className="feature-number">{number} / 03</span><span className="feature-icon" aria-hidden="true">{icon}</span></div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="feature-footer"><span>{state}</span><span aria-hidden="true">↗</span></div>
    </a>
  )
}
