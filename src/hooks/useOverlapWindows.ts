import { useQueries } from '@tanstack/react-query'
import { fetchOverlapWindows, type OverlapWindow } from '@/lib/overlapApi'
import type { Contact } from '@/hooks/useContacts'

export interface WindowWithContact extends OverlapWindow {
  contact: Contact
}

export function useAllOverlapWindows(contacts: Contact[]) {
  const eligible = contacts.filter((c) => c.has_availability)

  const queries = useQueries({
    queries: eligible.map((contact) => ({
      queryKey: ['overlap', 'contact', contact.id],
      queryFn: () => fetchOverlapWindows({ type: 'contact', id: contact.id, weeksAhead: 2 }),
      staleTime: 5 * 60 * 1000, // 5 min
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const isError = queries.some((q) => q.isError)

  const windows: WindowWithContact[] = queries
    .flatMap((q, i) =>
      (q.data ?? []).map((w) => ({ ...w, contact: eligible[i] }))
    )
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())

  return { windows, isLoading, isError }
}

export function useContactOverlapWindows(contactId: string) {
  return useQueries({
    queries: [
      {
        queryKey: ['overlap', 'contact', contactId],
        queryFn: () => fetchOverlapWindows({ type: 'contact', id: contactId, weeksAhead: 2 }),
        staleTime: 5 * 60 * 1000,
      },
    ],
  })[0]
}
