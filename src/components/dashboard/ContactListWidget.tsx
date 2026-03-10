import { Link } from 'react-router-dom'
import { DateTime } from 'luxon'
import { cn } from '@/lib/utils'
import { relativeDate } from '@/lib/timezone'
import type { Contact } from '@/hooks/useContacts'
import type { WindowWithContact } from '@/hooks/useOverlapWindows'

interface ContactListWidgetProps {
  contacts: Contact[]
  windows: WindowWithContact[]
  sortByOverdue?: boolean
}

export function ContactListWidget({ contacts, windows, sortByOverdue }: ContactListWidgetProps) {
  const overlapCounts = new Map<string, number>()
  for (const w of windows) {
    overlapCounts.set(w.contact.id, (overlapCounts.get(w.contact.id) ?? 0) + 1)
  }

  const now = DateTime.now()

  const sorted = [...contacts].sort((a, b) => {
    if (!sortByOverdue) return 0
    const daysA = a.last_called_at
      ? now.diff(DateTime.fromISO(a.last_called_at), 'days').days
      : Infinity
    const daysB = b.last_called_at
      ? now.diff(DateTime.fromISO(b.last_called_at), 'days').days
      : Infinity
    return daysB - daysA
  })

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">No contacts yet.</p>
    )
  }

  return (
    <div className="space-y-1">
      {sorted.map((c) => {
        const isOverdue = c.last_called_at
          ? now.diff(DateTime.fromISO(c.last_called_at), 'days').days >= 14
          : true
        const count = overlapCounts.get(c.id) ?? 0

        return (
          <Link
            key={c.id}
            to={`/contacts/${c.id}`}
            className={cn(
              'flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors',
              isOverdue && 'border-l-2 border-orange-400'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  'h-2 w-2 rounded-full flex-shrink-0',
                  c.has_availability ? 'bg-green-500' : 'bg-muted-foreground/40'
                )}
              />
              <span className="font-medium truncate">{c.nickname ?? c.name}</span>
              {c.groups.length > 0 && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {c.groups.map((g) => g.name).join(', ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {count > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {count} window{count !== 1 ? 's' : ''}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{relativeDate(c.last_called_at)}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
