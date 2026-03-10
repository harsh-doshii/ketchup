import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const QUERY_KEY = ['owner_availability']

// ── Slot ↔ DB conversion ──────────────────────────────────────────────────

/** "day-slotIdx" → { day_of_week, start_time, end_time } */
export function slotKeyToRow(key: string) {
  const [day, slot] = key.split('-').map(Number)
  const startTotal = 6 * 60 + slot * 30
  const endTotal = startTotal + 30
  const pad = (n: number) => n.toString().padStart(2, '0')
  return {
    day_of_week: day,
    start_time: `${pad(Math.floor(startTotal / 60))}:${pad(startTotal % 60)}`,
    end_time: `${pad(Math.floor(endTotal / 60))}:${pad(endTotal % 60)}`,
  }
}

/** { day_of_week, start_time } → "day-slotIdx" */
export function rowToSlotKey(row: { day_of_week: number; start_time: string }) {
  const [h, m] = row.start_time.split(':').map(Number)
  const slotIdx = (h - 6) * 2 + (m === 30 ? 1 : 0)
  return `${row.day_of_week}-${slotIdx}`
}

// ── Hooks ─────────────────────────────────────────────────────────────────

export function useOwnerAvailability() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owner_availability')
        .select('day_of_week, start_time, end_time')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSaveOwnerAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (slotKeys: Set<string>) => {
      // Delete all existing slots, then insert selected ones
      const { error: deleteError } = await supabase
        .from('owner_availability')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // delete all rows

      if (deleteError) throw deleteError

      if (slotKeys.size === 0) return

      const rows = Array.from(slotKeys).map(slotKeyToRow)
      const { error: insertError } = await supabase
        .from('owner_availability')
        .insert(rows)

      if (insertError) throw insertError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
