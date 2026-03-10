import { cn } from '@/lib/utils'
import type { ContactGroup } from '@/hooks/useContacts'

export interface ContactFormValues {
  name: string
  nickname: string
  phone: string
  groupIds: string[]
}

interface Props {
  values: ContactFormValues
  onChange: (values: ContactFormValues) => void
  groups: ContactGroup[]
  loading?: boolean
  onSubmit: () => void
  submitLabel: string
}

export function ContactForm({ values, onChange, groups, loading, onSubmit, submitLabel }: Props) {
  function set<K extends keyof ContactFormValues>(key: K, val: ContactFormValues[K]) {
    onChange({ ...values, [key]: val })
  }

  function toggleGroup(id: string) {
    const next = values.groupIds.includes(id)
      ? values.groupIds.filter((g) => g !== id)
      : [...values.groupIds, id]
    set('groupIds', next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Name *</label>
        <input
          required
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Priya Sharma"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Nickname</label>
        <input
          value={values.nickname}
          onChange={(e) => set('nickname', e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Priya"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Phone (WhatsApp)</label>
        <input
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="+91 98765 43210"
        />
      </div>

      {groups.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Groups</label>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const selected = values.groupIds.includes(g.id)
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    selected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground hover:border-foreground'
                  )}
                >
                  {g.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !values.name.trim()}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
