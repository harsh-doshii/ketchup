import { cn } from '@/lib/utils'
import type { ContactGroup } from '@/hooks/useContacts'

interface GroupTabsProps {
  groups: ContactGroup[]
  selected: string | null
  onChange: (groupId: string | null) => void
}

export function GroupTabs({ groups, selected, onChange }: GroupTabsProps) {
  const tabs = [{ id: null, name: 'All' }, ...groups.map((g) => ({ id: g.id, name: g.name }))]

  return (
    <div className="flex gap-1 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id ?? 'all'}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium transition-colors',
            selected === tab.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {tab.name}
        </button>
      ))}
    </div>
  )
}
