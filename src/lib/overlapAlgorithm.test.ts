import { describe, it, expect } from 'vitest'
import { DateTime } from 'luxon'
import {
  expandSlotToUTC,
  intersectIntervals,
  formatWindow,
  computeContactOverlap,
  computeGroupOverlap,
  type AvailabilitySlot,
  type UTCInterval,
} from './overlapAlgorithm'
import { ET_ZONE, IST_ZONE } from './timezone'

// ── expandSlotToUTC ───────────────────────────────────────────────────────

describe('expandSlotToUTC', () => {
  it('returns weeksAhead intervals', () => {
    const slot: AvailabilitySlot = { day_of_week: 1, start_time: '18:00', end_time: '20:00' }
    const intervals = expandSlotToUTC(slot, ET_ZONE, 2)
    expect(intervals).toHaveLength(2)
  })

  it('each interval has the correct duration', () => {
    const slot: AvailabilitySlot = { day_of_week: 1, start_time: '18:00', end_time: '20:00' }
    const intervals = expandSlotToUTC(slot, ET_ZONE, 2)
    for (const iv of intervals) {
      const mins = iv.end.diff(iv.start, 'minutes').minutes
      expect(mins).toBe(120)
    }
  })

  it('intervals are in UTC', () => {
    const slot: AvailabilitySlot = { day_of_week: 1, start_time: '18:00', end_time: '20:00' }
    const intervals = expandSlotToUTC(slot, ET_ZONE, 1)
    expect(intervals[0].start.zoneName).toBe('UTC')
  })

  it('consecutive intervals are exactly 7 days apart', () => {
    const slot: AvailabilitySlot = { day_of_week: 3, start_time: '09:00', end_time: '12:00' }
    const intervals = expandSlotToUTC(slot, IST_ZONE, 3)
    expect(intervals).toHaveLength(3)
    const gap1 = intervals[1].start.diff(intervals[0].start, 'days').days
    const gap2 = intervals[2].start.diff(intervals[1].start, 'days').days
    expect(Math.round(gap1)).toBe(7)
    expect(Math.round(gap2)).toBe(7)
  })

  it('slot on the correct day of week in the target zone (ET)', () => {
    const slot: AvailabilitySlot = { day_of_week: 5, start_time: '10:00', end_time: '11:00' } // Friday
    const intervals = expandSlotToUTC(slot, ET_ZONE, 1)
    const etDt = intervals[0].start.setZone(ET_ZONE)
    // weekday % 7: Mon=1..Sun=0
    expect(etDt.weekday).toBe(5) // Luxon Friday = 5
  })

  it('IST slot on correct day in IST zone', () => {
    const slot: AvailabilitySlot = { day_of_week: 0, start_time: '09:00', end_time: '10:00' } // Sunday
    const intervals = expandSlotToUTC(slot, IST_ZONE, 1)
    const istDt = intervals[0].start.setZone(IST_ZONE)
    expect(istDt.weekday % 7).toBe(0) // Sunday in our 0=Sun encoding
  })
})

// ── intersectIntervals ────────────────────────────────────────────────────

function makeInterval(startIso: string, endIso: string): UTCInterval {
  return {
    start: DateTime.fromISO(startIso, { zone: 'utc' }),
    end: DateTime.fromISO(endIso, { zone: 'utc' }),
  }
}

describe('intersectIntervals', () => {
  it('returns empty when no overlap', () => {
    const a = [makeInterval('2026-01-10T10:00:00Z', '2026-01-10T12:00:00Z')]
    const b = [makeInterval('2026-01-10T14:00:00Z', '2026-01-10T16:00:00Z')]
    expect(intersectIntervals(a, b)).toHaveLength(0)
  })

  it('returns exact overlap window', () => {
    // a: 10am–2pm, b: 12pm–4pm → overlap: 12pm–2pm
    const a = [makeInterval('2026-01-10T15:00:00Z', '2026-01-10T19:00:00Z')]
    const b = [makeInterval('2026-01-10T17:00:00Z', '2026-01-10T21:00:00Z')]
    const result = intersectIntervals(a, b)
    expect(result).toHaveLength(1)
    expect(result[0].start.toISO()).toBe('2026-01-10T17:00:00.000Z')
    expect(result[0].end.toISO()).toBe('2026-01-10T19:00:00.000Z')
  })

  it('handles touching intervals (not overlapping)', () => {
    const a = [makeInterval('2026-01-10T10:00:00Z', '2026-01-10T12:00:00Z')]
    const b = [makeInterval('2026-01-10T12:00:00Z', '2026-01-10T14:00:00Z')]
    // end === start → no overlap (strict <)
    expect(intersectIntervals(a, b)).toHaveLength(0)
  })

  it('returns multiple overlaps across weeks', () => {
    const a = [
      makeInterval('2026-01-10T15:00:00Z', '2026-01-10T19:00:00Z'),
      makeInterval('2026-01-17T15:00:00Z', '2026-01-17T19:00:00Z'),
    ]
    const b = [
      makeInterval('2026-01-10T17:00:00Z', '2026-01-10T21:00:00Z'),
      makeInterval('2026-01-17T17:00:00Z', '2026-01-17T21:00:00Z'),
    ]
    const result = intersectIntervals(a, b)
    expect(result).toHaveLength(2)
  })

  it('returns results sorted by start time', () => {
    const a = [
      makeInterval('2026-01-17T15:00:00Z', '2026-01-17T19:00:00Z'),
      makeInterval('2026-01-10T15:00:00Z', '2026-01-10T19:00:00Z'),
    ]
    const b = [
      makeInterval('2026-01-10T17:00:00Z', '2026-01-10T21:00:00Z'),
      makeInterval('2026-01-17T17:00:00Z', '2026-01-17T21:00:00Z'),
    ]
    const result = intersectIntervals(a, b)
    expect(result[0].start < result[1].start).toBe(true)
  })
})

// ── formatWindow ──────────────────────────────────────────────────────────

describe('formatWindow', () => {
  it('formats ET and IST times', () => {
    // 2026-01-10 23:00 UTC = 6pm EST / 4:30am IST Jan 11
    const iv = makeInterval('2026-01-10T23:00:00Z', '2026-01-11T01:00:00Z')
    const w = formatWindow(iv, ['contact-1'])

    expect(w.startET).toBe('6:00 PM')
    expect(w.startIST).toBe('4:30 AM')
    expect(w.etDay).toBe('Sat')
    expect(w.istDay).toBe('Sun')
    expect(w.dayDiff).toBe('(next day)')
    expect(w.durationMinutes).toBe(120)
    expect(w.contactIds).toEqual(['contact-1'])
  })

  it('calculates duration correctly', () => {
    const iv = makeInterval('2026-01-10T14:00:00Z', '2026-01-10T15:30:00Z')
    const w = formatWindow(iv, [])
    expect(w.durationMinutes).toBe(90)
  })

  it('returns empty dayDiff when same calendar day', () => {
    // noon ET on a weekday → same calendar day in IST
    const iv = makeInterval('2026-01-12T17:00:00Z', '2026-01-12T18:00:00Z') // noon EST / 10:30pm IST
    const w = formatWindow(iv, [])
    expect(w.dayDiff).toBe('')
  })
})

// ── computeContactOverlap ─────────────────────────────────────────────────

describe('computeContactOverlap', () => {
  it('returns empty when no slots', () => {
    const result = computeContactOverlap([], [], 'c1', 2)
    expect(result).toHaveLength(0)
  })

  it('returns empty when owner has no slots', () => {
    const contact: AvailabilitySlot[] = [{ day_of_week: 1, start_time: '09:00', end_time: '11:00' }]
    expect(computeContactOverlap([], contact, 'c1', 2)).toHaveLength(0)
  })

  it('returns empty when there is no time overlap', () => {
    // Owner: Mon 6pm–10pm ET (23:00–03:00 UTC)
    // Contact: Mon 9am–11am IST (03:30–05:30 UTC)
    // No overlap
    const owner: AvailabilitySlot[] = [{ day_of_week: 1, start_time: '18:00', end_time: '22:00' }]
    const contact: AvailabilitySlot[] = [{ day_of_week: 1, start_time: '09:00', end_time: '11:00' }]
    const result = computeContactOverlap(owner, contact, 'c1', 2)
    expect(result).toHaveLength(0)
  })

  it('finds overlap when schedules align', () => {
    // Owner: Mon 8pm–11pm ET → Mon 00:00–03:00 UTC (next day)
    //   EST: 8pm = 01:00 UTC next day (UTC+5 = next day)
    //   8pm EST = 20:00+5 = 01:00 UTC Tue
    // Contact: Tue 6:30am–10:30am IST → 01:00–05:00 UTC
    //   6:30am IST = 6:30 - 5:30 = 01:00 UTC
    // Overlap: 01:00–03:00 UTC (2 hours)
    const owner: AvailabilitySlot[] = [{ day_of_week: 1, start_time: '20:00', end_time: '23:00' }]
    const contact: AvailabilitySlot[] = [{ day_of_week: 2, start_time: '06:30', end_time: '10:30' }]
    const result = computeContactOverlap(owner, contact, 'c1', 2)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].durationMinutes).toBe(120)
  })

  it('includes contactId in results', () => {
    const owner: AvailabilitySlot[] = [{ day_of_week: 1, start_time: '20:00', end_time: '23:00' }]
    const contact: AvailabilitySlot[] = [{ day_of_week: 2, start_time: '06:30', end_time: '10:30' }]
    const result = computeContactOverlap(owner, contact, 'my-contact-id', 2)
    if (result.length > 0) {
      expect(result[0].contactIds).toContain('my-contact-id')
    }
  })
})

// ── computeGroupOverlap ───────────────────────────────────────────────────

describe('computeGroupOverlap', () => {
  it('returns empty for empty group', () => {
    const owner: AvailabilitySlot[] = [{ day_of_week: 1, start_time: '20:00', end_time: '23:00' }]
    expect(computeGroupOverlap(owner, [], 2)).toHaveLength(0)
  })

  it('requires all members to overlap (intersection of all)', () => {
    const owner: AvailabilitySlot[] = [{ day_of_week: 1, start_time: '20:00', end_time: '23:00' }]
    // Member 1 overlaps with owner
    const m1: AvailabilitySlot[] = [{ day_of_week: 2, start_time: '06:30', end_time: '10:30' }]
    // Member 2 does NOT overlap
    const m2: AvailabilitySlot[] = [{ day_of_week: 3, start_time: '09:00', end_time: '11:00' }]

    const result = computeGroupOverlap(
      owner,
      [
        { contactId: 'c1', slots: m1 },
        { contactId: 'c2', slots: m2 },
      ],
      2
    )
    expect(result).toHaveLength(0)
  })

  it('returns windows when all members overlap', () => {
    const owner: AvailabilitySlot[] = [{ day_of_week: 1, start_time: '20:00', end_time: '23:00' }]
    const m1: AvailabilitySlot[] = [{ day_of_week: 2, start_time: '06:30', end_time: '10:30' }]
    const m2: AvailabilitySlot[] = [{ day_of_week: 2, start_time: '06:30', end_time: '09:30' }]

    const result = computeGroupOverlap(
      owner,
      [
        { contactId: 'c1', slots: m1 },
        { contactId: 'c2', slots: m2 },
      ],
      2
    )
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].contactIds).toEqual(['c1', 'c2'])
  })
})
