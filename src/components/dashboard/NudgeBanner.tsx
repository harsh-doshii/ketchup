import { DateTime } from 'luxon'
import { Link } from 'react-router-dom'
import type { Contact } from '@/hooks/useContacts'

interface NudgeBannerProps {
  contacts: Contact[]
}

export function NudgeBanner({ contacts }: NudgeBannerProps) {
  const now = DateTime.now()

  const overdue = contacts
    .filter((c) => {
      if (!c.last_called_at) return true
      const daysSince = now.diff(DateTime.fromISO(c.last_called_at), 'days').days
      return daysSince >= 14
    })
    .sort((a, b) => {
      const daysA = a.last_called_at
        ? now.diff(DateTime.fromISO(a.last_called_at), 'days').days
        : Infinity
      const daysB = b.last_called_at
        ? now.diff(DateTime.fromISO(b.last_called_at), 'days').days
        : Infinity
      return daysB - daysA
    })

  if (overdue.length === 0) return null

  return (
    <div className="space-y-1">
      {overdue.map((c) => {
        const days = c.last_called_at
          ? Math.floor(now.diff(DateTime.fromISO(c.last_called_at), 'days').days)
          : null
        const label = days === null ? 'Never called' : `${days} days ago`

        return (
          <Link
            key={c.id}
            to={`/contacts/${c.id}`}
            className="flex items-center justify-between rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-sm hover:bg-orange-100 transition-colors"
          >
            <span>
              <span className="font-medium text-orange-900">
                {c.nickname ?? c.name}
              </span>
              <span className="text-orange-700 ml-1">— last called: {label}</span>
            </span>
            <span className="text-orange-500 text-xs">Catch up →</span>
          </Link>
        )
      })}
    </div>
  )
}
