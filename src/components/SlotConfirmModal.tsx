import { useState } from 'react'
import { toast } from 'sonner'
import { DateTime } from 'luxon'
import { Modal } from '@/components/Modal'
import { CopyButton } from '@/components/CopyButton'
import { DualTimeLabel } from '@/components/DualTimeLabel'
import { useMarkCallDone } from '@/hooks/useCallLog'
import { formatDualTime } from '@/lib/timezone'
import type { WindowWithContact } from '@/hooks/useOverlapWindows'

interface SlotConfirmModalProps {
  window: WindowWithContact | null
  onClose: () => void
}

export function SlotConfirmModal({ window: w, onClose }: SlotConfirmModalProps) {
  const [done, setDone] = useState(false)
  const markDone = useMarkCallDone()

  if (!w) return null

  const start = formatDualTime(DateTime.fromISO(w.startUtc, { zone: 'utc' }))
  const contactName = w.contact.nickname ?? w.contact.name

  const whatsappMsg = `Hey ${contactName}! Are you free ${start.istDay} at ${start.ist} IST? That's ${start.etDay} ${start.et} ET for me 😊`

  async function handleMarkDone() {
    try {
      await markDone.mutateAsync(w!.contact.id)
      setDone(true)
      toast.success(`Call with ${contactName} logged!`)
      setTimeout(onClose, 1200)
    } catch {
      toast.error('Failed to log call. Please try again.')
    }
  }

  function handleClose() {
    setDone(false)
    onClose()
  }

  return (
    <Modal open={!!w} onClose={handleClose} title="Schedule a call">
      <div className="space-y-4">
        {/* Contact name */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">With</p>
          <p className="font-semibold text-base">{contactName}</p>
          {w.contact.name !== contactName && (
            <p className="text-xs text-muted-foreground">{w.contact.name}</p>
          )}
        </div>

        {/* Time window */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Time</p>
          <DualTimeLabel startUtc={w.startUtc} endUtc={w.endUtc} />
          <p className="text-xs text-muted-foreground mt-1">{w.durationMinutes} min window</p>
        </div>

        {/* WhatsApp message */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">WhatsApp message</p>
            <CopyButton text={whatsappMsg} label="Copy" />
          </div>
          <div className="rounded-md bg-muted px-3 py-2 text-sm leading-relaxed">
            {whatsappMsg}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleMarkDone}
            disabled={markDone.isPending || done}
            className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {done ? 'Logged!' : markDone.isPending ? 'Saving...' : 'Mark call as done'}
          </button>
          <button
            onClick={handleClose}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
