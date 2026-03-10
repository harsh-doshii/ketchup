import { useState } from 'react'
import { DateTime } from 'luxon'
import { DualTimeLabel } from '@/components/DualTimeLabel'
import type { WindowWithContact } from '@/hooks/useOverlapWindows'

interface OverlapFeedProps {
  windows: WindowWithContact[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  groupId: string | null
  onSelectWindow: (window: WindowWithContact) => void
}

export function OverlapFeed({ windows, isLoading, isError, onRetry, groupId, onSelectWindow }: OverlapFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive mb-3">Failed to load overlap windows.</p>
        {onRetry && (
          <button onClick={onRetry} className="text-sm text-primary hover:underline">
            Try again
          </button>
        )}
      </div>
    )
  }

  const filtered = groupId
    ? windows.filter((w) => w.contact.groups.some((g) => g.id === groupId))
    : windows

  if (filtered.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {windows.length === 0
            ? 'No overlap windows found. Make sure you and your contacts have set availability.'
            : 'No overlap windows for this group.'}
        </p>
      </div>
    )
  }

  // Group by date (ET date)
  const byDate = new Map<string, WindowWithContact[]>()
  for (const w of filtered) {
    const etDate = DateTime.fromISO(w.startUtc, { zone: 'utc' })
      .setZone('America/New_York')
      .toFormat('cccc, LLL d')
    if (!byDate.has(etDate)) byDate.set(etDate, [])
    byDate.get(etDate)!.push(w)
  }

  return (
    <div className="space-y-4">
      {[...byDate.entries()].map(([date, dayWindows]) => (
        <div key={date}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {date}
          </p>
          <div className="space-y-1">
            {dayWindows.map((w, i) => (
              <button
                key={`${w.startUtc}-${w.contact.id}-${i}`}
                onClick={() => onSelectWindow(w)}
                className="w-full flex items-center justify-between rounded-md border bg-card px-3 py-2 text-left hover:bg-muted/50 transition-colors"
              >
                <div>
                  <DualTimeLabel startUtc={w.startUtc} endUtc={w.endUtc} />
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {w.contact.nickname ?? w.contact.name}
                    {w.contact.groups.length > 0 && (
                      <span className="ml-1">· {w.contact.groups.map((g) => g.name).join(', ')}</span>
                    )}
                  </p>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground ml-2 flex-shrink-0">
                  {w.durationMinutes}m
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
