import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DateTime } from 'https://esm.sh/luxon@3'

// ── Zone constants ────────────────────────────────────────────────────────
const ET_ZONE = 'America/New_York'
const IST_ZONE = 'Asia/Kolkata'
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── CORS ──────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Types ─────────────────────────────────────────────────────────────────
interface Slot { day_of_week: number; start_time: string; end_time: string }
interface Interval { start: DateTime; end: DateTime }

// ── Algorithm ─────────────────────────────────────────────────────────────

function expandSlotToUTC(slot: Slot, zone: string, weeksAhead: number): Interval[] {
  const today = DateTime.now().setZone(zone).startOf('day')
  const todayDow = today.weekday % 7 // 0=Sun…6=Sat
  let daysUntil = slot.day_of_week - todayDow
  if (daysUntil < 0) daysUntil += 7
  const firstOccurrence = today.plus({ days: daysUntil })
  const [sh, sm] = slot.start_time.split(':').map(Number)
  const [eh, em] = slot.end_time.split(':').map(Number)
  const intervals: Interval[] = []
  for (let w = 0; w < weeksAhead; w++) {
    const date = firstOccurrence.plus({ weeks: w })
    const start = date.set({ hour: sh, minute: sm }).toUTC()
    const end = date.set({ hour: eh, minute: em }).toUTC()
    if (end > start) intervals.push({ start, end })
  }
  return intervals
}

function intersect(a: Interval[], b: Interval[]): Interval[] {
  const result: Interval[] = []
  for (const ia of a) {
    for (const ib of b) {
      const start = ia.start > ib.start ? ia.start : ib.start
      const end = ia.end < ib.end ? ia.end : ib.end
      if (start < end) result.push({ start, end })
    }
  }
  return result.sort((x, y) => x.start.toMillis() - y.start.toMillis())
}

function getDayDiffLabel(etDt: DateTime, istDt: DateTime): string {
  const etPlain = DateTime.fromObject({ year: etDt.year, month: etDt.month, day: etDt.day })
  const istPlain = DateTime.fromObject({ year: istDt.year, month: istDt.month, day: istDt.day })
  const diff = Math.round(istPlain.diff(etPlain, 'days').days)
  if (diff > 0) return '(next day)'
  if (diff < 0) return '(prev day)'
  return ''
}

function formatWindow(iv: Interval, contactIds: string[]) {
  const etStart = iv.start.setZone(ET_ZONE)
  const etEnd = iv.end.setZone(ET_ZONE)
  const istStart = iv.start.setZone(IST_ZONE)
  const istEnd = iv.end.setZone(IST_ZONE)
  return {
    startUtc: iv.start.toISO(),
    endUtc: iv.end.toISO(),
    startET: etStart.toFormat('h:mm a'),
    endET: etEnd.toFormat('h:mm a'),
    startIST: istStart.toFormat('h:mm a'),
    endIST: istEnd.toFormat('h:mm a'),
    etDay: DAY_NAMES[etStart.weekday % 7],
    istDay: DAY_NAMES[istStart.weekday % 7],
    dayDiff: getDayDiffLabel(etStart, istStart),
    durationMinutes: Math.round(iv.end.diff(iv.start, 'minutes').minutes),
    contactIds,
  }
}

// ── Handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { type, id, weeksAhead = 2 } = await req.json()

    if (!type || !id) {
      return new Response(JSON.stringify({ error: 'type and id are required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !anonKey) {
      throw new Error(`Missing env vars: SUPABASE_URL=${!!supabaseUrl} SUPABASE_ANON_KEY=${!!anonKey}`)
    }

    // Forward the caller's JWT so PostgREST evaluates them as authenticated.
    // All RLS policies are "to authenticated using (true)" so this is sufficient.
    const authHeader = req.headers.get('Authorization') ?? `Bearer ${anonKey}`

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Fetch owner availability
    const { data: ownerSlots, error: ownerErr } = await supabase
      .from('owner_availability')
      .select('day_of_week, start_time, end_time')
    if (ownerErr) throw ownerErr

    const ownerIntervals = (ownerSlots ?? []).flatMap((s: Slot) =>
      expandSlotToUTC(s, ET_ZONE, weeksAhead)
    )

    let windows: ReturnType<typeof formatWindow>[] = []

    if (type === 'contact') {
      const { data: contactSlots, error: contactErr } = await supabase
        .from('contact_availability')
        .select('day_of_week, start_time, end_time')
        .eq('contact_id', id)
      if (contactErr) throw contactErr

      const contactIntervals = (contactSlots ?? []).flatMap((s: Slot) =>
        expandSlotToUTC(s, IST_ZONE, weeksAhead)
      )
      const overlaps = intersect(ownerIntervals, contactIntervals)
      windows = overlaps.map((w) => formatWindow(w, [id]))
    }

    if (type === 'group') {
      // Get all contacts in the group
      const { data: groupMembers, error: groupErr } = await supabase
        .from('contact_groups')
        .select('contact_id')
        .eq('group_id', id)
      if (groupErr) throw groupErr

      let intervals = ownerIntervals
      const contactIds: string[] = []

      for (const member of groupMembers ?? []) {
        const { data: memberSlots, error: memberErr } = await supabase
          .from('contact_availability')
          .select('day_of_week, start_time, end_time')
          .eq('contact_id', member.contact_id)
        if (memberErr) throw memberErr

        const memberIntervals = (memberSlots ?? []).flatMap((s: Slot) =>
          expandSlotToUTC(s, IST_ZONE, weeksAhead)
        )
        intervals = intersect(intervals, memberIntervals)
        contactIds.push(member.contact_id)
        if (intervals.length === 0) break
      }

      windows = intervals.map((w) => formatWindow(w, contactIds))
    }

    return new Response(JSON.stringify({ windows }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error
      ? err.message
      : (err && typeof err === 'object' ? JSON.stringify(err) : String(err))
    console.error('overlap function error:', message, err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
