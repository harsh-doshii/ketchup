import { supabase } from '@/lib/supabase'

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

export interface OverlapRequest {
  type: 'contact' | 'group'
  id: string
  weeksAhead?: number
}

export async function fetchOverlapWindows(req: OverlapRequest): Promise<OverlapWindow[]> {
  const { data, error } = await supabase.functions.invoke('overlap', { body: req })
  if (error) throw error
  return (data as { windows: OverlapWindow[] }).windows
}
