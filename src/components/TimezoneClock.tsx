import { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { ET_ZONE, IST_ZONE } from '@/lib/timezone'

export function TimezoneClock() {
  const [now, setNow] = useState(DateTime.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(DateTime.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const et = now.setZone(ET_ZONE).toFormat('h:mm a z')
  const ist = now.setZone(IST_ZONE).toFormat('h:mm a z')

  return (
    <div className="flex gap-3 text-xs text-muted-foreground font-mono">
      <span>{et}</span>
      <span className="text-border">|</span>
      <span>{ist}</span>
    </div>
  )
}
