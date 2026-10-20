import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
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
  it('does not present the conceptual graphic as real research data', () => {
    render(<App />)
    expect(screen.getByRole('img', { name: /conceptual network illustration/i })).toBeInTheDocument()
    expect(screen.getByText(/illustrative model · not scientific data/i)).toBeInTheDocument()
  })
})
