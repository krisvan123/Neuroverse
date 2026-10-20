import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./components/ApiStatus', () => ({ ApiStatus: () => <span>API test placeholder</span> }))

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
  it('does not present the conceptual graphic as real research data', () => {
    render(<App />)
    expect(screen.getByRole('img', { name: /conceptual network illustration/i })).toBeInTheDocument()
    expect(screen.getByText(/illustrative model · not scientific data/i)).toBeInTheDocument()
  })
})
