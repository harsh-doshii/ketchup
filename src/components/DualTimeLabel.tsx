import { DateTime } from 'luxon'
import { formatDualTime } from '@/lib/timezone'

interface DualTimeLabelProps {
  startUtc: string
  endUtc: string
}

/**
 * Renders "Mon 7:30 AM IST / Sun 6:00 PM ET (prev day)" format
 */
export function DualTimeLabel({ startUtc, endUtc }: DualTimeLabelProps) {
  const start = formatDualTime(DateTime.fromISO(startUtc, { zone: 'utc' }))
  const end = formatDualTime(DateTime.fromISO(endUtc, { zone: 'utc' }))

  return (
    <div className="text-sm">
      <span className="font-medium">
        {start.istDay} {start.ist}–{end.ist} IST
      </span>
      {start.dayDiff && (
        <span className="text-muted-foreground ml-1 text-xs">{start.dayDiff}</span>
      )}
      <span className="text-muted-foreground mx-1">/</span>
      <span className="text-muted-foreground">
        {start.etDay} {start.et}–{end.et} ET
      </span>
    </div>
  )
}
