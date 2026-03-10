import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CallLogEntry {
  id: string
  contact_id: string
  called_at: string
  notes: string | null
}

export function useCallLog(contactId: string) {
  return useQuery({
    queryKey: ['call-log', contactId],
    queryFn: async (): Promise<CallLogEntry[]> => {
      const { data, error } = await supabase
        .from('call_log')
        .select('*')
        .eq('contact_id', contactId)
        .order('called_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!contactId,
  })
}

export function useMarkCallDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contactId: string) => {
      const now = new Date().toISOString()

      const { error: logError } = await supabase
        .from('call_log')
        .insert({ contact_id: contactId, called_at: now })
      if (logError) throw logError

      const { error: contactError } = await supabase
        .from('contacts')
        .update({ last_called_at: now })
        .eq('id', contactId)
      if (contactError) throw contactError
    },
    onSuccess: (_data, contactId) => {
      queryClient.invalidateQueries({ queryKey: ['call-log', contactId] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
