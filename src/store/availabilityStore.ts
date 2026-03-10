import { create } from 'zustand'

interface AvailabilityStore {
  // Current grid state — keys like "0-12" (dayOfWeek-slotIndex)
  slots: Set<string>
  // Last saved state — used to detect unsaved changes
  savedSlots: Set<string>

  setSlots: (slots: Set<string>) => void
  setSlotValue: (key: string, value: boolean) => void
  markSaved: () => void
  hasUnsavedChanges: () => boolean
}

export const useAvailabilityStore = create<AvailabilityStore>((set, get) => ({
  slots: new Set(),
  savedSlots: new Set(),

  setSlots: (slots) => set({ slots: new Set(slots) }),

  setSlotValue: (key, value) =>
    set((state) => {
      const next = new Set(state.slots)
      if (value) next.add(key)
      else next.delete(key)
      return { slots: next }
    }),

  markSaved: () =>
    set((state) => ({ savedSlots: new Set(state.slots) })),

  hasUnsavedChanges: () => {
    const { slots, savedSlots } = get()
    if (slots.size !== savedSlots.size) return true
    for (const key of slots) {
      if (!savedSlots.has(key)) return true
    }
    return false
  },
}))
