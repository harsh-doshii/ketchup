import { relativeDate } from '@/lib/timezone'

interface RelativeDateProps {
  date: string | null
  className?: string
}

export function RelativeDate({ date, className }: RelativeDateProps) {
  return <span className={className}>{relativeDate(date)}</span>
}
