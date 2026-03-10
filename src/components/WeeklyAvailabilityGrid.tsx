import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const SLOT_COUNT = 36 // 6:00 AM – 11:30 PM (18 hours × 2)

export function slotToLabel(slotIdx: number): string {
  const totalMinutes = 6 * 60 + slotIdx * 30
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`
}

export function slotKey(day: number, slot: number) {
  return `${day}-${slot}`
}

interface Props {
  slots: Set<string>
  onSlotChange: (key: string, value: boolean) => void
  readonly?: boolean
  timezoneLabel?: string // e.g. "IST" or "ET" — shown next to time labels
}

export function WeeklyAvailabilityGrid({ slots, onSlotChange, readonly = false, timezoneLabel }: Props) {
  const isDragging = useRef(false)
  const dragMode = useRef<boolean>(true) // true = selecting, false = deselecting

  const handleMouseDown = useCallback(
    (key: string) => {
      if (readonly) return
      isDragging.current = true
      dragMode.current = !slots.has(key)
      onSlotChange(key, dragMode.current)
    },
    [slots, onSlotChange, readonly]
  )

  const handleMouseEnter = useCallback(
    (key: string) => {
      if (!isDragging.current || readonly) return
      onSlotChange(key, dragMode.current)
    },
    [onSlotChange, readonly]
  )

  // Touch: route touchmove through elementFromPoint so drag-to-select works on mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (readonly) return
      const touch = e.touches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
      const key = el?.dataset?.slotKey
      if (!key) return
      isDragging.current = true
      dragMode.current = !slots.has(key)
      onSlotChange(key, dragMode.current)
    },
    [slots, onSlotChange, readonly]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current || readonly) return
      e.preventDefault() // prevent page scroll while selecting
      const touch = e.touches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
      const key = el?.dataset?.slotKey
      if (key) onSlotChange(key, dragMode.current)
    },
    [onSlotChange, readonly]
  )

  useEffect(() => {
    const stop = () => { isDragging.current = false }
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [])

  return (
    <div
      className="select-none overflow-x-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{ touchAction: readonly ? undefined : 'none' }}
    >
      <div className="inline-grid min-w-full" style={{ gridTemplateColumns: '4rem repeat(7, 1fr)' }}>

        {/* Header row */}
        <div className="pb-1 text-right pr-2 text-[10px] text-muted-foreground/60 self-end">
          {timezoneLabel ?? ''}
        </div>
        {DAYS.map((day) => (
          <div key={day} className="pb-1 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Slot rows */}
        {Array.from({ length: SLOT_COUNT }, (_, slotIdx) => (
          <div key={slotIdx} className="contents">
            {/* Time label — only show on the hour */}
            <div className="flex items-start justify-end pr-2 text-[10px] text-muted-foreground leading-none" style={{ height: '1.5rem' }}>
              {slotIdx % 2 === 0 ? slotToLabel(slotIdx) : ''}
            </div>

            {/* Cells for each day */}
            {DAYS.map((_, dayIdx) => {
              const key = slotKey(dayIdx, slotIdx)
              const selected = slots.has(key)
              const isHourBoundary = slotIdx % 2 === 0

              return (
                <div
                  key={key}
                  data-slot-key={key}
                  onMouseDown={() => handleMouseDown(key)}
                  onMouseEnter={() => handleMouseEnter(key)}
                  className={cn(
                    'h-6 border-l border-r border-b cursor-pointer transition-colors',
                    isHourBoundary && 'border-t',
                    selected
                      ? 'bg-primary hover:bg-primary/80'
                      : 'bg-background hover:bg-muted',
                    readonly && 'cursor-default',
                    dayIdx === 0 && 'rounded-l',
                    dayIdx === 6 && 'rounded-r'
                  )}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border bg-background" />
          <span>Unavailable</span>
        </div>
        {!readonly && (
          <span className="ml-2 text-muted-foreground/60 hidden sm:inline">Click or drag to toggle</span>
        )}
        {!readonly && (
          <span className="ml-2 text-muted-foreground/60 sm:hidden">Tap or drag to select</span>
        )}
      </div>
    </div>
  )
}
