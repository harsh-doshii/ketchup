import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { ContactCard } from '@/components/contacts/ContactCard'
import { AddContactModal } from '@/components/contacts/AddContactModal'
import { EditContactModal } from '@/components/contacts/EditContactModal'
import { GroupManager } from '@/components/contacts/GroupManager'
import { useContacts, useDeleteContact, type Contact } from '@/hooks/useContacts'

const BASE_URL = import.meta.env.VITE_APP_BASE_URL ?? window.location.origin

export function ContactsPage() {
  const { data: contacts = [], isLoading, isError, refetch } = useContacts()
  const { mutateAsync: deleteContact } = useDeleteContact()

  const [showAdd, setShowAdd] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  async function handleDelete(contact: Contact) {
    if (!confirm(`Remove ${contact.name}? This won't delete their availability history.`)) return
    try {
      await deleteContact(contact.id)
      toast.success(`${contact.name} removed`)
    } catch {
      toast.error('Failed to remove contact')
    }
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Main content */}
      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Contacts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add contact
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-lg border bg-muted animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive mb-3">Failed to load contacts.</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">No contacts yet.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Add your first contact
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={setEditingContact}
                onDelete={handleDelete}
                baseUrl={BASE_URL}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="w-full lg:w-56 shrink-0">
        <GroupManager />
      </aside>

      {/* Modals */}
      <AddContactModal open={showAdd} onClose={() => setShowAdd(false)} />
      <EditContactModal contact={editingContact} onClose={() => setEditingContact(null)} />
    </div>
  )
}
