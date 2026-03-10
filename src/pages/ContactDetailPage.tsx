import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { useContactAvailability, guestRowToSlotKey } from '@/hooks/useGuestAvailability'
import { useContactOverlapWindows } from '@/hooks/useOverlapWindows'
import { useCallLog } from '@/hooks/useCallLog'
import { WeeklyAvailabilityGrid } from '@/components/WeeklyAvailabilityGrid'
import { DualTimeLabel } from '@/components/DualTimeLabel'
import { RelativeDate } from '@/components/RelativeDate'
import { SlotConfirmModal } from '@/components/SlotConfirmModal'
import type { WindowWithContact } from '@/hooks/useOverlapWindows'
import { DateTime } from 'luxon'

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedWindow, setSelectedWindow] = useState<WindowWithContact | null>(null)

  const { data: contacts = [], isLoading: contactsLoading } = useContacts()
  const contact = contacts.find((c) => c.id === id)

  const { data: availRows = [], isLoading: availLoading } = useContactAvailability(id)
  const overlapQuery = useContactOverlapWindows(id ?? '')
  const { data: callLog = [], isLoading: logLoading } = useCallLog(id ?? '')

  const slots = new Set(availRows.map(guestRowToSlotKey))

  // Build a WindowWithContact from the overlap data so SlotConfirmModal can use it
  const overlapWindows: WindowWithContact[] = (overlapQuery.data ?? []).map((w) => ({
    ...w,
    contact: contact!,
  }))

  if (contactsLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        <div className="h-48 rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground">Contact not found.</p>
        <Link to="/contacts" className="text-sm text-primary hover:underline mt-2 inline-block">
          ← Back to contacts
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/contacts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Contacts
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{contact.nickname ?? contact.name}</h1>
            {contact.nickname && (
              <p className="text-sm text-muted-foreground">{contact.name}</p>
            )}
            {contact.groups.length > 0 && (
              <div className="flex gap-1 mt-1">
                {contact.groups.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Last called:</p>
            <RelativeDate date={contact.last_called_at} className="font-medium text-foreground" />
          </div>
        </div>
      </div>

      {/* Availability grid */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          {contact.nickname ?? contact.name}'s availability (IST)
        </h2>
        {availLoading ? (
          <div className="h-48 rounded bg-muted animate-pulse" />
        ) : slots.size === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">No availability submitted yet.</p>
          </div>
        ) : (
          <div className="scale-[0.72] origin-top-left" style={{ height: '14rem', overflow: 'hidden' }}>
            <WeeklyAvailabilityGrid
              slots={slots}
              onSlotChange={() => {}}
              readonly
              timezoneLabel="IST"
            />
          </div>
        )}
      </section>

      {/* Overlap windows */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Upcoming overlap windows
        </h2>
        {overlapQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : overlapWindows.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No overlap windows in the next 2 weeks.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {overlapWindows.map((w, i) => (
              <button
                key={`${w.startUtc}-${i}`}
                onClick={() => setSelectedWindow(w)}
                className="w-full flex items-center justify-between rounded-md border bg-card px-3 py-2 text-left hover:bg-muted/50 transition-colors"
              >
                <DualTimeLabel startUtc={w.startUtc} endUtc={w.endUtc} />
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground ml-2 flex-shrink-0">
                  {w.durationMinutes}m
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Call log */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Call history
        </h2>
        {logLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : callLog.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">No calls logged yet.</p>
          </div>
        ) : (
          <ol className="relative border-l border-muted ml-2 space-y-4">
            {callLog.map((entry) => {
              const dt = DateTime.fromISO(entry.called_at)
              return (
                <li key={entry.id} className="ml-4">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-muted-foreground/40" />
                  <p className="text-sm font-medium">
                    {dt.toFormat('cccc, LLL d yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dt.toFormat('h:mm a')} · <RelativeDate date={entry.called_at} />
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.notes}</p>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <SlotConfirmModal
        window={selectedWindow}
        onClose={() => setSelectedWindow(null)}
      />
    </div>
  )
}
