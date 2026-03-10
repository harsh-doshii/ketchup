import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DualTimeLabel } from './DualTimeLabel'

describe('DualTimeLabel', () => {
  // 2026-01-10 23:00 UTC = 6:00 PM EST (Sat) / 4:30 AM IST (Sun)
  const SAT_EVENING = { start: '2026-01-10T23:00:00Z', end: '2026-01-11T01:00:00Z' }
  // 2026-01-12 17:00 UTC = 12:00 PM EST (Mon) / 10:30 PM IST (Mon — same day)
  const WEEKDAY_NOON = { start: '2026-01-12T17:00:00Z', end: '2026-01-12T18:00:00Z' }

  it('renders IST start time', () => {
    render(<DualTimeLabel startUtc={SAT_EVENING.start} endUtc={SAT_EVENING.end} />)
    expect(screen.getByText(/4:30 AM/)).toBeInTheDocument()
  })

  it('renders ET start time', () => {
    render(<DualTimeLabel startUtc={SAT_EVENING.start} endUtc={SAT_EVENING.end} />)
    expect(screen.getByText(/6:00 PM/)).toBeInTheDocument()
  })

  it('shows "(next day)" label when IST is the following calendar day', () => {
    render(<DualTimeLabel startUtc={SAT_EVENING.start} endUtc={SAT_EVENING.end} />)
    expect(screen.getByText('(next day)')).toBeInTheDocument()
  })

  it('does not show day diff label when same calendar day', () => {
    render(<DualTimeLabel startUtc={WEEKDAY_NOON.start} endUtc={WEEKDAY_NOON.end} />)
    expect(screen.queryByText('(next day)')).not.toBeInTheDocument()
    expect(screen.queryByText('(prev day)')).not.toBeInTheDocument()
  })

  it('renders IST day label', () => {
    render(<DualTimeLabel startUtc={SAT_EVENING.start} endUtc={SAT_EVENING.end} />)
    // IST day is Sun
    expect(screen.getByText(/Sun/)).toBeInTheDocument()
  })

  it('renders ET day label', () => {
    render(<DualTimeLabel startUtc={SAT_EVENING.start} endUtc={SAT_EVENING.end} />)
    // ET day is Sat
    expect(screen.getByText(/Sat/)).toBeInTheDocument()
  })
})
