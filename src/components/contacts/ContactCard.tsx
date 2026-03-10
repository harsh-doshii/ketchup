import { Link } from 'react-router-dom'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { relativeDate } from '@/lib/timezone'
import { cn } from '@/lib/utils'
import type { Contact } from '@/hooks/useContacts'

interface Props {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
  baseUrl: string
}

export function ContactCard({ contact, onEdit, onDelete, baseUrl }: Props) {
  const availabilityUrl = `${baseUrl}/availability/${contact.slug}`
  const isOverdue =
    !contact.last_called_at ||
    new Date().getTime() - new Date(contact.last_called_at).getTime() > 14 * 24 * 60 * 60 * 1000

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 space-y-3 transition-colors',
        isOverdue && !contact.last_called_at && 'border-muted'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            to={`/contacts/${contact.id}`}
            className="font-medium hover:underline"
          >
            {contact.name}
          </Link>
          {contact.nickname && (
            <span className="ml-1.5 text-sm text-muted-foreground">({contact.nickname})</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(contact)}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(contact)}
            className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Group tags */}
      {contact.groups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {contact.groups.map((g) => (
            <span
              key={g.id}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {g.name}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {/* Availability status */}
          <div className="flex items-center gap-1">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                contact.has_availability ? 'bg-green-500' : 'bg-muted-foreground/40'
              )}
            />
            <span>{contact.has_availability ? 'Availability set' : 'No availability'}</span>
          </div>

          {/* Last called */}
          <span
            className={cn(isOverdue && contact.last_called_at && 'text-orange-500')}
          >
            {contact.last_called_at
              ? `Called ${relativeDate(contact.last_called_at).toLowerCase()}`
              : 'Never called'}
          </span>
        </div>

        {/* Link actions */}
        <div className="flex items-center gap-1">
          <CopyButton text={availabilityUrl} label="Copy link" />
          <a
            href={availabilityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 hover:text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
