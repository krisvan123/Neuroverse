import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./components/ApiStatus', () => ({ ApiStatus: () => <span>API test placeholder</span> }))
vi.mock('./scenes/browserSupport', () => ({ supportsWebGL: () => false }))

afterEach(cleanup)

describe('Neuroverse foundation', () => {
  it('exposes navigable learning and research content', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /the universe inside every connection/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start your discovery/i })).toHaveAttribute('href', '#learning')
    expect(screen.getByRole('heading', { name: /wonder, with evidence/i })).toBeInTheDocument()
  })
  it('renders the mission once for readers and a decorative duplicate for seamless movement', () => {
    const { container } = render(<App />)
    expect(screen.getByRole('region', { name: 'The Neuroverse mission' })).toBeInTheDocument()
    expect(container.querySelectorAll('.mission-banner__unit')).toHaveLength(2)
    expect(container.querySelector('.mission-banner__unit--duplicate')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.mission-banner__text')?.textContent).toContain('Science should be something you experience')
  })
  it('labels the selected original scientific surface render mode on the 3D stage', () => {
    const { container } = render(<App />)
    expect(container.querySelector('.brain-stage')).toHaveAttribute('data-anatomy-style', 'shaded')
    expect(screen.getByText('SOLID ANATOMY')).toBeInTheDocument()
  })
  it('renders global decorative stars independently from the scientific 3D model', () => {
    const { container } = render(<App />)
    expect(container.querySelectorAll('.cosmic-backdrop .starlayer')).toHaveLength(3)
    expect(container.querySelector('.cosmic-backdrop .cosmic-shooting-star')).toBeInTheDocument()
    expect(container.querySelector('.cosmic-backdrop')).toHaveAttribute('aria-hidden', 'true')
  })
  it('lets learners disable and re-enable ambient motion', () => {
    render(<App />)
    const reduceButton = screen.getByRole('button', { name: 'Reduce ambient motion' })
    expect(reduceButton).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(reduceButton)
    expect(document.documentElement.dataset.motion).toBe('quiet')
    const enableButton = screen.getByRole('button', { name: 'Enable ambient motion' })
    expect(enableButton).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(enableButton)
    expect(document.documentElement.dataset.motion).toBe('ambient')
  })
  it('shows a faithful original neuropil source with explicit controls even when unavailable', () => {
    render(<App />)
    const choices = screen.getByRole('group', { name: 'Original fly-brain anatomical source' })
    expect(choices).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Neuropil' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Whole tissue' })).toBeDisabled()
  })
  it('makes 3D controls available but correctly disables them without WebGL', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Top view' })).toBeDisabled()
    expect(screen.getByLabelText('Quality')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Pause motion' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }))
    expect(screen.getByRole('button', { name: 'Resume motion' })).toBeInTheDocument()
  })
  it('labels the verified source viewer separately from its static conceptual fallback', () => {
    render(<App />)
    expect(screen.getByRole('img', { name: /conceptual illustrated bilateral fruit fly brain/i })).toBeInTheDocument()
    expect(screen.getByText(/fafb-aligned neuropil surface · original published mesh/i)).toBeInTheDocument()
    expect(screen.getByText(/static visualization — webgl unavailable/i)).toBeInTheDocument()
  })
})
