import { DateTime } from 'luxon'
import { ET_ZONE } from '@/lib/timezone'
import { cn } from '@/lib/utils'

export function WeekStrip() {
  const today = DateTime.now().setZone(ET_ZONE)
  // Start on Sunday
  const sunday = today.startOf('week').minus({ days: 1 })

  const days = Array.from({ length: 7 }, (_, i) => sunday.plus({ days: i }))

  return (
    <div className="flex gap-1">
      {days.map((day) => {
        const isToday = day.hasSame(today, 'day')
        return (
          <div
            key={day.toISODate()}
            className={cn(
              'flex flex-1 flex-col items-center rounded-md py-2 text-center',
              isToday ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            <span className="text-[10px] font-medium uppercase">{day.toFormat('EEE')}</span>
            <span className="text-base font-semibold leading-tight">{day.toFormat('d')}</span>
          </div>
        )
      })}
    </div>
  )
}
