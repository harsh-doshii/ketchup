import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react'
import { useGroups, useCreateGroup, useDeleteGroup, useRenameGroup } from '@/hooks/useGroups'

export function GroupManager() {
  const { data: groups = [] } = useGroups()
  const { mutateAsync: createGroup } = useCreateGroup()
  const { mutateAsync: deleteGroup } = useDeleteGroup()
  const { mutateAsync: renameGroup } = useRenameGroup()

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await createGroup(newName.trim())
      setNewName('')
      toast.success(`Group "${newName.trim()}" created`)
    } catch {
      toast.error('Failed to create group')
    }
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return
    try {
      await renameGroup({ id, name: editingName.trim() })
      setEditingId(null)
      toast.success('Group renamed')
    } catch {
      toast.error('Failed to rename group')
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await deleteGroup(id)
      toast.success(`Group "${name}" deleted`)
    } catch {
      toast.error('Failed to delete group')
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Groups</h2>

      <ul className="space-y-1">
        {groups.map((g) => (
          <li key={g.id} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted group">
            {editingId === g.id ? (
              <>
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(g.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 rounded border bg-background px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <button onClick={() => handleRename(g.id)} className="text-green-600 hover:text-green-700">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{g.name}</span>
                <button
                  onClick={() => { setEditingId(g.id); setEditingName(g.name) }}
                  className="hidden group-hover:block text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(g.id, g.name)}
                  className="hidden group-hover:block text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </li>
        ))}
        {groups.length === 0 && (
          <li className="text-xs text-muted-foreground px-2 py-1">No groups yet</li>
        )}
      </ul>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New group…"
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="rounded-md bg-muted px-3 py-1.5 text-sm hover:bg-muted/80 disabled:opacity-40 transition-opacity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
