import { describe, it, expect } from 'vitest'
import { DateTime } from 'luxon'
import {
  toET,
  toIST,
  formatDualTime,
  getDayDiffLabel,
  relativeDate,
  ET_ZONE,
  IST_ZONE,
} from './timezone'

// Helper: build a UTC DateTime from an ISO string
function utc(iso: string) {
  return DateTime.fromISO(iso, { zone: 'utc' })
}

// ---------------------------------------------------------------------------
// toET / toIST
// ---------------------------------------------------------------------------

describe('toET', () => {
  it('converts UTC to EST (UTC-5 in winter)', () => {
    // 2026-01-15 00:00 UTC = Jan 14 7pm EST
    const dt = utc('2026-01-15T00:00:00Z')
    const et = toET(dt)
    expect(et.zoneName).toBe(ET_ZONE)
    expect(et.hour).toBe(19)
    expect(et.day).toBe(14)
  })

  it('converts UTC to EDT (UTC-4 in summer)', () => {
    // 2026-07-01 00:00 UTC = Jun 30 8pm EDT
    const dt = utc('2026-07-01T00:00:00Z')
    const et = toET(dt)
    expect(et.zoneName).toBe(ET_ZONE)
    expect(et.hour).toBe(20)
    expect(et.day).toBe(30)
  })
})

describe('toIST', () => {
  it('converts UTC to IST (UTC+5:30)', () => {
    // midnight UTC = 5:30am IST
    const dt = utc('2026-01-15T00:00:00Z')
    const ist = toIST(dt)
    expect(ist.zoneName).toBe(IST_ZONE)
    expect(ist.hour).toBe(5)
    expect(ist.minute).toBe(30)
  })

  it('handles the 30-minute offset correctly', () => {
    // 12:30 UTC = 18:00 IST
    const dt = utc('2026-03-10T12:30:00Z')
    const ist = toIST(dt)
    expect(ist.hour).toBe(18)
    expect(ist.minute).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Day boundary crossings
// ---------------------------------------------------------------------------

describe('day boundary: 6pm ET Saturday = 4:30am IST Sunday', () => {
  // Jan 10 2026 is a Saturday (winter = EST, UTC-5)
  // 6pm EST Sat Jan 10 = 23:00 UTC Jan 10 = 4:30am IST Sun Jan 11
  it('correctly identifies IST day as Sunday when ET is Saturday evening', () => {
    const dt = utc('2026-01-10T23:00:00Z')
    const et = toET(dt)  // Sat 6pm EST
    const ist = toIST(dt) // Sun 4:30am IST

    expect(et.weekdayLong).toBe('Saturday')
    expect(ist.weekdayLong).toBe('Sunday')
  })

  it('formatDualTime labels the day crossing correctly', () => {
    const dt = utc('2026-01-10T23:00:00Z')
    const dual = formatDualTime(dt)

    expect(dual.etDay).toBe('Sat')
    expect(dual.istDay).toBe('Sun')
    expect(dual.et).toBe('6:00 PM')
    expect(dual.ist).toBe('4:30 AM')
    expect(dual.dayDiff).toBe('(next day)')
  })
})

describe('day boundary: early morning IST can be previous evening ET', () => {
  it('6am IST Tuesday = 12:30am UTC Tue = 7:30pm ET Monday (EST)', () => {
    // 6am IST = UTC 00:30
    const dt = utc('2026-03-10T00:30:00Z')
    const et = toET(dt)   // Mon 7:30pm ET (March 10 is after DST → EDT UTC-4... wait)
    // March 10 2026: DST starts March 8, so this is EDT (UTC-4)
    // 00:30 UTC - 4h = 20:30 prev day = Mar 9 8:30pm EDT (Monday)
    const ist = toIST(dt)  // Tue 6:00am IST

    expect(et.weekdayLong).toBe('Monday')
    expect(ist.weekdayLong).toBe('Tuesday')
  })
})

// ---------------------------------------------------------------------------
// getDayDiffLabel
// ---------------------------------------------------------------------------

describe('getDayDiffLabel', () => {
  it('returns "(next day)" when IST is one day ahead of ET', () => {
    // Jan 10 (Sat) 6pm EST / Jan 11 (Sun) 4:30am IST
    const et = DateTime.fromISO('2026-01-10T18:00:00', { zone: ET_ZONE })
    const ist = DateTime.fromISO('2026-01-11T04:30:00', { zone: IST_ZONE })
    expect(getDayDiffLabel(et, ist)).toBe('(next day)')
  })

  it('returns "" when both are on the same calendar day', () => {
    // 10am ET on Mar 10 → same calendar day in IST (7:30pm / 8:30pm IST)
    const et = DateTime.fromISO('2026-03-10T10:00:00', { zone: ET_ZONE })
    const ist = DateTime.fromISO('2026-03-10T19:30:00', { zone: IST_ZONE })
    expect(getDayDiffLabel(et, ist)).toBe('')
  })

  it('returns "(prev day)" when IST calendar day is behind ET', () => {
    // midnight ET March 10 (Mon) / IST is still March 9 (Sun) at that moment
    const et = DateTime.fromISO('2026-03-10T00:00:00', { zone: ET_ZONE })
    const ist = DateTime.fromISO('2026-03-09T09:30:00', { zone: IST_ZONE })
    expect(getDayDiffLabel(et, ist)).toBe('(prev day)')
  })
})

// ---------------------------------------------------------------------------
// IST 30-minute offset edge cases
// ---------------------------------------------------------------------------

describe('IST 30-minute offset', () => {
  it('9:00 UTC → 2:30 PM IST (not 2:00 PM)', () => {
    const dt = utc('2026-03-10T09:00:00Z')
    const ist = toIST(dt)
    expect(ist.hour).toBe(14)
    expect(ist.minute).toBe(30)
  })

  it('slot grid aligns to 30-min boundaries', () => {
    // 6:00 AM IST = 00:30 UTC
    const dt = utc('2026-03-10T00:30:00Z')
    const ist = toIST(dt)
    expect(ist.hour).toBe(6)
    expect(ist.minute).toBe(0)

    // 6:30 AM IST = 01:00 UTC
    const dt2 = utc('2026-03-10T01:00:00Z')
    const ist2 = toIST(dt2)
    expect(ist2.hour).toBe(6)
    expect(ist2.minute).toBe(30)
  })
})

// ---------------------------------------------------------------------------
// EDT/EST transition
// ---------------------------------------------------------------------------

describe('EDT/EST transition', () => {
  it('uses EDT offset (UTC-4) in summer', () => {
    // Jul 1 2026: EDT. midnight EDT = 04:00 UTC
    const dt = utc('2026-07-01T04:00:00Z')
    const et = toET(dt)
    expect(et.hour).toBe(0)
    expect(et.offset).toBe(-4 * 60) // -240 minutes
  })

  it('uses EST offset (UTC-5) in winter', () => {
    // Jan 15 2026: EST. midnight EST = 05:00 UTC
    const dt = utc('2026-01-15T05:00:00Z')
    const et = toET(dt)
    expect(et.hour).toBe(0)
    expect(et.offset).toBe(-5 * 60) // -300 minutes
  })
})

// ---------------------------------------------------------------------------
// relativeDate
// ---------------------------------------------------------------------------

describe('relativeDate', () => {
  it('returns "Never" for null', () => {
    expect(relativeDate(null)).toBe('Never')
  })

  it('returns "Today" for today', () => {
    const today = DateTime.now().toISO()!
    expect(relativeDate(today)).toBe('Today')
  })

  it('returns "Yesterday" for 1 day ago', () => {
    const yesterday = DateTime.now().minus({ days: 1 }).toISO()!
    expect(relativeDate(yesterday)).toBe('Yesterday')
  })

  it('returns "X days ago" for recent dates', () => {
    const fiveDaysAgo = DateTime.now().minus({ days: 5 }).toISO()!
    expect(relativeDate(fiveDaysAgo)).toBe('5 days ago')
  })

  it('returns months for older dates', () => {
    const twoMonthsAgo = DateTime.now().minus({ months: 2 }).toISO()!
    expect(relativeDate(twoMonthsAgo)).toBe('2 months ago')
  })
})
