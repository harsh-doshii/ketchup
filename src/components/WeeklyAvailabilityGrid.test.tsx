import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeeklyAvailabilityGrid, DAYS, SLOT_COUNT, slotKey } from './WeeklyAvailabilityGrid'

describe('WeeklyAvailabilityGrid', () => {
  it('renders all 7 day headers', () => {
    render(<WeeklyAvailabilityGrid slots={new Set()} onSlotChange={() => {}} />)
    for (const day of DAYS) {
      expect(screen.getByText(day)).toBeInTheDocument()
    }
  })

  it('renders 7 × 36 = 252 slot cells', () => {
    const { container } = render(
      <WeeklyAvailabilityGrid slots={new Set()} onSlotChange={() => {}} />
    )
    const cells = container.querySelectorAll('[data-slot-key]')
    expect(cells).toHaveLength(DAYS.length * SLOT_COUNT) // 252
  })

  it('pre-fills selected slots with bg-primary class', () => {
    const selected = new Set([slotKey(0, 0), slotKey(1, 4), slotKey(6, 35)])
    const { container } = render(
      <WeeklyAvailabilityGrid slots={selected} onSlotChange={() => {}} />
    )
    const highlighted = container.querySelectorAll('[data-slot-key].bg-primary')
    expect(highlighted).toHaveLength(3)
  })

  it('calls onSlotChange when a cell is clicked', () => {
    const onSlotChange = vi.fn()
    const { container } = render(
      <WeeklyAvailabilityGrid slots={new Set()} onSlotChange={onSlotChange} />
    )
    const firstCell = container.querySelector('[data-slot-key="0-0"]')!
    fireEvent.mouseDown(firstCell)
    expect(onSlotChange).toHaveBeenCalledWith('0-0', true)
  })

  it('does not call onSlotChange in readonly mode', () => {
    const onSlotChange = vi.fn()
    const { container } = render(
      <WeeklyAvailabilityGrid slots={new Set()} onSlotChange={onSlotChange} readonly />
    )
    const firstCell = container.querySelector('[data-slot-key="0-0"]')!
    fireEvent.mouseDown(firstCell)
    expect(onSlotChange).not.toHaveBeenCalled()
  })

  it('clicking a selected slot calls onSlotChange with false (deselect)', () => {
    const onSlotChange = vi.fn()
    const key = slotKey(2, 8)
    const { container } = render(
      <WeeklyAvailabilityGrid slots={new Set([key])} onSlotChange={onSlotChange} />
    )
    const cell = container.querySelector(`[data-slot-key="${key}"]`)!
    fireEvent.mouseDown(cell)
    expect(onSlotChange).toHaveBeenCalledWith(key, false)
  })

  it('shows the timezoneLabel in the grid header', () => {
    render(
      <WeeklyAvailabilityGrid slots={new Set()} onSlotChange={() => {}} timezoneLabel="IST" />
    )
    expect(screen.getByText('IST')).toBeInTheDocument()
  })

  it('shows "Tap or drag to select" hint on mobile (not readonly)', () => {
    render(<WeeklyAvailabilityGrid slots={new Set()} onSlotChange={() => {}} />)
    expect(screen.getByText('Tap or drag to select')).toBeInTheDocument()
  })

  it('does not show drag hint in readonly mode', () => {
    render(<WeeklyAvailabilityGrid slots={new Set()} onSlotChange={() => {}} readonly />)
    expect(screen.queryByText('Tap or drag to select')).not.toBeInTheDocument()
    expect(screen.queryByText('Click or drag to toggle')).not.toBeInTheDocument()
  })
})
