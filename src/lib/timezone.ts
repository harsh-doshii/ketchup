import { DateTime } from 'luxon'

export const ET_ZONE = 'America/New_York' // handles EDT/EST automatically
export const IST_ZONE = 'Asia/Kolkata'    // UTC+5:30, no DST

// Days of week labels
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Convert any DateTime to ET (handles EDT/EST automatically) */
export function toET(dt: DateTime): DateTime {
  return dt.setZone(ET_ZONE)
}

/** Convert any DateTime to IST */
export function toIST(dt: DateTime): DateTime {
  return dt.setZone(IST_ZONE)
}

/**
 * Given a recurring weekly slot (dayOfWeek + "HH:MM" time in `zone`),
 * return the next upcoming occurrence as a UTC DateTime.
 *
 * dayOfWeek: 0 = Sunday … 6 = Saturday (in the given zone)
 */
export function slotToUTC(dayOfWeek: number, timeStr: string, zone: string): DateTime {
  const [hours, minutes] = timeStr.split(':').map(Number)

  // Start from today in the target zone
  let dt = DateTime.now().setZone(zone).startOf('day').set({ hour: hours, minute: minutes })

  // Find the next (or current) occurrence of dayOfWeek
  const todayWeekday = dt.weekday % 7 // luxon: Mon=1…Sun=7, convert to 0=Sun…6=Sat
  const targetWeekday = dayOfWeek

  // Days until the target weekday
  let diff = targetWeekday - todayWeekday
  if (diff < 0) diff += 7
  // If same day but time has already passed, go to next week
  if (diff === 0 && DateTime.now().setZone(zone) > dt) diff = 7

  dt = dt.plus({ days: diff })
  return dt.toUTC()
}

export interface DualTime {
  et: string
  ist: string
  etDay: string
  istDay: string
  /** "(next day)" | "(prev day)" | "" — relative to ET anchor */
  dayDiff: string
}

/**
 * Format a UTC DateTime into labelled ET and IST display strings.
 * Returns time strings like "6:00 PM" and day strings like "Mon".
 */
export function formatDualTime(utcDt: DateTime): DualTime {
  const etDt = utcDt.setZone(ET_ZONE)
  const istDt = utcDt.setZone(IST_ZONE)

  const et = etDt.toFormat('h:mm a')
  const ist = istDt.toFormat('h:mm a')
  const etDay = DAY_NAMES[etDt.weekday % 7]
  const istDay = DAY_NAMES[istDt.weekday % 7]

  const dayDiff = getDayDiffLabel(etDt, istDt)

  return { et, ist, etDay, istDay, dayDiff }
}

/**
 * Returns a "(next day)" or "(prev day)" label for IST relative to ET,
 * or "" if they fall on the same calendar day.
 * Compares local calendar dates (year/month/day) directly — no UTC conversion.
 */
export function getDayDiffLabel(etDt: DateTime, istDt: DateTime): string {
  const etPlain = DateTime.fromObject({ year: etDt.year, month: etDt.month, day: etDt.day })
  const istPlain = DateTime.fromObject({ year: istDt.year, month: istDt.month, day: istDt.day })
  const diffDays = Math.round(istPlain.diff(etPlain, 'days').days)
  if (diffDays > 0) return '(next day)'
  if (diffDays < 0) return '(prev day)'
  return ''
}

/**
 * Format a slot window for display on the dashboard.
 * e.g. "Mon 6:00 PM–8:00 PM ET / Tue 4:30 AM–6:30 AM IST (next day)"
 */
export function formatWindowLabel(startUtc: DateTime, endUtc: DateTime): string {
  const start = formatDualTime(startUtc)
  const end = formatDualTime(endUtc)

  const istNote = start.dayDiff ? ` ${start.dayDiff}` : ''

  return `${start.etDay} ${start.et}–${end.et} ET / ${start.istDay} ${start.ist}–${end.ist} IST${istNote}`
}

/**
 * Human-readable relative date label.
 * e.g. "3 days ago", "yesterday", "never"
 */
export function relativeDate(date: string | null): string {
  if (!date) return 'Never'
  const dt = DateTime.fromISO(date)
  const now = DateTime.now()
  const diffDays = Math.floor(now.diff(dt, 'days').days)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  const diffMonths = Math.floor(now.diff(dt, 'months').months)
  if (diffMonths < 12) return `${diffMonths} months ago`
  return `${Math.floor(now.diff(dt, 'years').years)} years ago`
}
