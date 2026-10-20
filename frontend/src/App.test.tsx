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
  it('makes 3D controls available but correctly disables them without WebGL', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Top view' })).toBeDisabled()
    expect(screen.getByLabelText('3D visual quality')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Pause motion' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }))
    expect(screen.getByRole('button', { name: 'Resume motion' })).toBeInTheDocument()
  })
  it('does not present the conceptual graphic as real research data', () => {
    render(<App />)
    expect(screen.getByRole('img', { name: /conceptual illustrated bilateral fruit fly brain/i })).toBeInTheDocument()
    expect(screen.getByText(/procedural concept art · not flywire morphology/i)).toBeInTheDocument()
    expect(screen.getByText(/static visualization — webgl unavailable/i)).toBeInTheDocument()
  })
})
