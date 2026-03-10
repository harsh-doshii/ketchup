import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import { WeeklyAvailabilityGrid } from '@/components/WeeklyAvailabilityGrid'
import {
  useContactBySlug,
  useContactAvailability,
  useSaveContactAvailability,
  guestRowToSlotKey,
} from '@/hooks/useGuestAvailability'

export function GuestAvailabilityPage() {
  const { slug } = useParams<{ slug: string }>()
  const [slots, setSlots] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  const {
    data: contact,
    isLoading: contactLoading,
    isError: contactError,
  } = useContactBySlug(slug ?? '')

  const { data: existingSlots, isLoading: slotsLoading } = useContactAvailability(contact?.id)

  const { mutateAsync: save, isPending: isSaving } = useSaveContactAvailability(contact?.id ?? '')

  // Pre-fill grid with existing availability on load
  useEffect(() => {
    if (!existingSlots) return
    setSlots(new Set(existingSlots.map(guestRowToSlotKey)))
  }, [existingSlots])

  function handleSlotChange(key: string, value: boolean) {
    setSlots((prev) => {
      const next = new Set(prev)
      if (value) next.add(key)
      else next.delete(key)
      return next
    })
  }

  async function handleSubmit() {
    try {
      await save(slots)
      setSubmitted(true)
    } catch {
      toast.error('Something went wrong — please try again.')
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (contactLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (contactError || !contact) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-2xl">🔗</p>
        <h1 className="text-lg font-semibold">Link not found</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          This availability link doesn't exist or may have been removed.
        </p>
      </div>
    )
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="text-lg font-semibold">You're all set!</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Thanks! Harsh will find a good time and reach out on WhatsApp.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Update my availability
        </button>
      </div>
    )
  }

  // ── Main grid ────────────────────────────────────────────────────────────
  const displayName = contact.nickname ?? contact.name

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="bottom-center" richColors />
      {/* Header */}
      <div className="border-b bg-card px-4 py-5 text-center">
        <p className="text-xl font-semibold">
          Hey {displayName}! 👋
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Harsh wants to know when you're free to catch up.
          <br />
          Tap the times that usually work for you.
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        {/* Timezone note */}
        <div className="rounded-md bg-muted px-4 py-2.5 text-sm text-muted-foreground text-center">
          All times are in <strong>IST (India Standard Time)</strong>
        </div>

        {/* Grid */}
        {slotsLoading ? (
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
        ) : (
          <WeeklyAvailabilityGrid
            slots={slots}
            onSlotChange={handleSlotChange}
            timezoneLabel="IST"
          />
        )}

        {/* Selected count */}
        <p className="text-center text-xs text-muted-foreground">
          {slots.size === 0
            ? 'No slots selected yet — tap on the grid above'
            : `${slots.size} slot${slots.size === 1 ? '' : 's'} selected (${Math.round(slots.size / 2)} hr${slots.size > 2 ? 's' : ''})`}
        </p>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSaving || slots.size === 0}
          className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {isSaving ? 'Saving…' : existingSlots && existingSlots.length > 0 ? 'Update my availability' : 'Submit my availability'}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          You can always come back to this link to update your times.
        </p>
      </div>
    </div>
  )
}
