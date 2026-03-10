import { useEffect } from 'react'
import { toast } from 'sonner'
import { WeeklyAvailabilityGrid } from '@/components/WeeklyAvailabilityGrid'
import { useAvailabilityStore } from '@/store/availabilityStore'
import { useOwnerAvailability, useSaveOwnerAvailability, rowToSlotKey } from '@/hooks/useOwnerAvailability'

export function AvailabilitySetupPage() {
  const { slots, setSlots, setSlotValue, markSaved, hasUnsavedChanges } = useAvailabilityStore()
  const { data: dbRows, isLoading } = useOwnerAvailability()
  const { mutateAsync: save, isPending: isSaving } = useSaveOwnerAvailability()

  // Load saved availability into grid on first fetch
  useEffect(() => {
    if (!dbRows) return
    const loaded = new Set(dbRows.map(rowToSlotKey))
    setSlots(loaded)
    // Mark as saved so hasUnsavedChanges starts false
    useAvailabilityStore.getState().markSaved()
  }, [dbRows, setSlots])

  async function handleSave() {
    try {
      await save(slots)
      markSaved()
      toast.success('Availability saved')
    } catch {
      toast.error('Failed to save — please try again')
    }
  }

  const unsaved = hasUnsavedChanges()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Availability</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set your weekly recurring free time in ET. Your contacts will see overlap windows based on this.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            unsaved
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-default'
          } disabled:opacity-50`}
        >
          {isSaving ? 'Saving…' : unsaved ? 'Save changes' : 'Saved'}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-1">
          <div className="h-6 w-full rounded bg-muted animate-pulse mb-3" />
          {Array.from({ length: 18 }, (_, i) => (
            <div key={i} className="flex gap-1">
              <div className="w-16 h-6 rounded bg-muted animate-pulse" />
              {Array.from({ length: 7 }, (_, j) => (
                <div key={j} className="flex-1 h-6 rounded bg-muted animate-pulse opacity-60" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <WeeklyAvailabilityGrid
          slots={slots}
          onSlotChange={setSlotValue}
        />
      )}
    </div>
  )
}
