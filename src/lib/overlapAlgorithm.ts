import { DateTime } from 'luxon'
import { ET_ZONE, IST_ZONE, DAY_NAMES, getDayDiffLabel } from '@/lib/timezone'

// ── Types ─────────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  day_of_week: number // 0=Sun … 6=Sat in the slot's local zone
  start_time: string  // "HH:MM"
  end_time: string    // "HH:MM"
}

export interface UTCInterval {
  start: DateTime // UTC
  end: DateTime   // UTC
}

export interface OverlapWindow {
  startUtc: string
  endUtc: string
  startET: string
  endET: string
  startIST: string
  endIST: string
  etDay: string
  istDay: string
  dayDiff: string
  durationMinutes: number
  contactIds: string[]
}

// ── Core helpers ──────────────────────────────────────────────────────────

/**
 * Expand a recurring weekly slot into concrete UTC intervals.
 * Looks forward `weeksAhead` weeks from today in the given zone.
 *
 * day_of_week: 0=Sun … 6=Sat (in `zone`)
 */
export function expandSlotToUTC(
  slot: AvailabilitySlot,
  zone: string,
  weeksAhead: number
): UTCInterval[] {
  const today = DateTime.now().setZone(zone).startOf('day')

  // Luxon weekday: Mon=1 … Sun=7. Convert to 0=Sun…6=Sat:
  const todayDow = today.weekday % 7
  let daysUntil = slot.day_of_week - todayDow
  if (daysUntil < 0) daysUntil += 7

  const firstOccurrence = today.plus({ days: daysUntil })

  const intervals: UTCInterval[] = []
  const [sh, sm] = slot.start_time.split(':').map(Number)
  const [eh, em] = slot.end_time.split(':').map(Number)

  for (let w = 0; w < weeksAhead; w++) {
    const date = firstOccurrence.plus({ weeks: w })
    const start = date.set({ hour: sh, minute: sm }).toUTC()
    const end = date.set({ hour: eh, minute: em }).toUTC()
    // Guard: end must be after start (handles midnight edge cases)
    if (end > start) {
      intervals.push({ start, end })
    }
  }

  return intervals
}

/**
 * Find intersecting UTC intervals between two sets.
 * Returns sorted by start time.
 */
export function intersectIntervals(
  a: UTCInterval[],
  b: UTCInterval[]
): UTCInterval[] {
  const result: UTCInterval[] = []
  for (const ia of a) {
    for (const ib of b) {
      const start = ia.start > ib.start ? ia.start : ib.start
      const end = ia.end < ib.end ? ia.end : ib.end
      if (start < end) {
        result.push({ start, end })
      }
    }
  }
  return result.sort((x, y) => x.start.toMillis() - y.start.toMillis())
}

/**
 * Format a UTC interval into an OverlapWindow with ET + IST labels.
 */
export function formatWindow(
  interval: UTCInterval,
  contactIds: string[]
): OverlapWindow {
  const etStart = interval.start.setZone(ET_ZONE)
  const etEnd = interval.end.setZone(ET_ZONE)
  const istStart = interval.start.setZone(IST_ZONE)
  const istEnd = interval.end.setZone(IST_ZONE)

  return {
    startUtc: interval.start.toISO()!,
    endUtc: interval.end.toISO()!,
    startET: etStart.toFormat('h:mm a'),
    endET: etEnd.toFormat('h:mm a'),
    startIST: istStart.toFormat('h:mm a'),
    endIST: istEnd.toFormat('h:mm a'),
    etDay: DAY_NAMES[etStart.weekday % 7],
    istDay: DAY_NAMES[istStart.weekday % 7],
    dayDiff: getDayDiffLabel(etStart, istStart),
    durationMinutes: Math.round(interval.end.diff(interval.start, 'minutes').minutes),
    contactIds,
  }
}

// ── Main entry points ─────────────────────────────────────────────────────

/**
 * Compute overlap windows between owner and a single contact.
 */
export function computeContactOverlap(
  ownerSlots: AvailabilitySlot[],
  contactSlots: AvailabilitySlot[],
  contactId: string,
  weeksAhead = 2
): OverlapWindow[] {
  const ownerIntervals = ownerSlots.flatMap((s) => expandSlotToUTC(s, ET_ZONE, weeksAhead))
  const contactIntervals = contactSlots.flatMap((s) => expandSlotToUTC(s, IST_ZONE, weeksAhead))
  const windows = intersectIntervals(ownerIntervals, contactIntervals)
  return windows.map((w) => formatWindow(w, [contactId]))
}

/**
 * Compute overlap windows between owner and a group of contacts.
 * All members must be free simultaneously.
 */
export function computeGroupOverlap(
  ownerSlots: AvailabilitySlot[],
  members: Array<{ contactId: string; slots: AvailabilitySlot[] }>,
  weeksAhead = 2
): OverlapWindow[] {
  if (members.length === 0) return []

  let intervals = ownerSlots.flatMap((s) => expandSlotToUTC(s, ET_ZONE, weeksAhead))

  for (const member of members) {
    const memberIntervals = member.slots.flatMap((s) =>
      expandSlotToUTC(s, IST_ZONE, weeksAhead)
    )
    intervals = intersectIntervals(intervals, memberIntervals)
    if (intervals.length === 0) return []
  }

  const contactIds = members.map((m) => m.contactId)
  return intervals.map((w) => formatWindow(w, contactIds))
}
