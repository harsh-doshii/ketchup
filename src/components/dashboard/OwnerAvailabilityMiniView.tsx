import { Link } from 'react-router-dom'
import { WeeklyAvailabilityGrid } from '@/components/WeeklyAvailabilityGrid'
import { useOwnerAvailability, rowToSlotKey } from '@/hooks/useOwnerAvailability'

export function OwnerAvailabilityMiniView() {
  const { data: rows, isLoading } = useOwnerAvailability()

  const slots = new Set((rows ?? []).map(rowToSlotKey))
  const hasSlots = slots.size > 0

  if (isLoading) {
    return <div className="h-16 rounded-md bg-muted animate-pulse" />
  }

  if (!hasSlots) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">No availability set.</p>
        <Link to="/availability/setup" className="text-sm text-primary hover:underline">
          Set your availability →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          My availability (ET)
        </span>
        <Link to="/availability/setup" className="text-xs text-primary hover:underline">
          Edit
        </Link>
      </div>
      <div className="scale-[0.7] origin-top-left" style={{ height: '14rem', overflow: 'hidden' }}>
        <WeeklyAvailabilityGrid slots={slots} onSlotChange={() => {}} readonly timezoneLabel="ET" />
      </div>
    </div>
  )
}
