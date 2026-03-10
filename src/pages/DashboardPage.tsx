import { useState } from 'react'
import { useContacts } from '@/hooks/useContacts'
import { useGroups } from '@/hooks/useGroups'
import { useAllOverlapWindows } from '@/hooks/useOverlapWindows'
import { WeekStrip } from '@/components/dashboard/WeekStrip'
import { NudgeBanner } from '@/components/dashboard/NudgeBanner'
import { GroupTabs } from '@/components/dashboard/GroupTabs'
import { OverlapFeed } from '@/components/dashboard/OverlapFeed'
import { ContactListWidget } from '@/components/dashboard/ContactListWidget'
import { OwnerAvailabilityMiniView } from '@/components/dashboard/OwnerAvailabilityMiniView'
import { SlotConfirmModal } from '@/components/SlotConfirmModal'
import type { WindowWithContact } from '@/hooks/useOverlapWindows'

export function DashboardPage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [sortByOverdue, setSortByOverdue] = useState(false)
  const [selectedWindow, setSelectedWindow] = useState<WindowWithContact | null>(null)

  const { data: contacts = [], isLoading: contactsLoading } = useContacts()
  const { data: groups = [] } = useGroups()
  const { windows, isLoading: windowsLoading, isError: windowsError } = useAllOverlapWindows(contacts)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Week strip */}
      <WeekStrip />

      {/* Nudge banner — overdue contacts */}
      {!contactsLoading && contacts.length > 0 && (
        <section>
          <NudgeBanner contacts={contacts} />
        </section>
      )}

      {/* Main layout: overlap feed + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: overlap feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Upcoming windows
            </h2>
          </div>

          <GroupTabs
            groups={groups}
            selected={selectedGroup}
            onChange={setSelectedGroup}
          />

          <OverlapFeed
            windows={windows}
            isLoading={windowsLoading || contactsLoading}
            isError={windowsError}
            groupId={selectedGroup}
            onSelectWindow={setSelectedWindow}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Owner availability mini view */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              My availability
            </h2>
            <OwnerAvailabilityMiniView />
          </section>

          {/* Contact list */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Contacts
              </h2>
              <button
                onClick={() => setSortByOverdue((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                {sortByOverdue ? 'Default order' : 'Sort by overdue'}
              </button>
            </div>
            {contactsLoading ? (
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <ContactListWidget
                contacts={contacts}
                windows={windows}
                sortByOverdue={sortByOverdue}
              />
            )}
          </section>
        </div>
      </div>
      <SlotConfirmModal
        window={selectedWindow}
        onClose={() => setSelectedWindow(null)}
      />
    </div>
  )
}
