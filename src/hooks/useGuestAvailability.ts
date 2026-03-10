import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ── Contact by slug (public) ───────────────────────────────────────────────

export function useContactBySlug(slug: string) {
  return useQuery({
    queryKey: ['contact-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, nickname')
        .eq('slug', slug)
        .eq('is_deleted', false)
        .single()
      if (error) throw error
      return data
    },
    retry: false,
  })
}

// ── Contact availability (public read) ────────────────────────────────────

export function useContactAvailability(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-availability', contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_availability')
        .select('day_of_week, start_time')
        .eq('contact_id', contactId!)
      if (error) throw error
      return data ?? []
    },
  })
}

// ── Save contact availability (public upsert) ─────────────────────────────

/** "day-slotIdx" → { contact_id, day_of_week, start_time, end_time } in IST */
function slotKeyToRow(key: string, contactId: string) {
  const [day, slot] = key.split('-').map(Number)
  const startTotal = 6 * 60 + slot * 30
  const endTotal = startTotal + 30
  const pad = (n: number) => n.toString().padStart(2, '0')
  return {
    contact_id: contactId,
    day_of_week: day,
    start_time: `${pad(Math.floor(startTotal / 60))}:${pad(startTotal % 60)}`,
    end_time: `${pad(Math.floor(endTotal / 60))}:${pad(endTotal % 60)}`,
  }
}

/** { day_of_week, start_time } → "day-slotIdx" */
export function guestRowToSlotKey(row: { day_of_week: number; start_time: string }) {
  const [h, m] = row.start_time.split(':').map(Number)
  const slotIdx = (h - 6) * 2 + (m === 30 ? 1 : 0)
  return `${row.day_of_week}-${slotIdx}`
}

export function useSaveContactAvailability(contactId: string) {
  return useMutation({
    mutationFn: async (slotKeys: Set<string>) => {
      // Delete existing rows for this contact, then insert new ones
      const { error: deleteError } = await supabase
        .from('contact_availability')
        .delete()
        .eq('contact_id', contactId)
      if (deleteError) throw deleteError

      if (slotKeys.size === 0) return

      const rows = Array.from(slotKeys).map((key) => slotKeyToRow(key, contactId))
      const { error: insertError } = await supabase
        .from('contact_availability')
        .insert(rows)
      if (insertError) throw insertError
    },
  })
}
