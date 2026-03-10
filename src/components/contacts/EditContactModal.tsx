import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/Modal'
import { ContactForm, type ContactFormValues } from '@/components/contacts/ContactForm'
import { useUpdateContact, type Contact } from '@/hooks/useContacts'
import { useGroups } from '@/hooks/useGroups'

interface Props {
  contact: Contact | null
  onClose: () => void
}

export function EditContactModal({ contact, onClose }: Props) {
  const [values, setValues] = useState<ContactFormValues>({
    name: '',
    nickname: '',
    phone: '',
    groupIds: [],
  })
  const { data: groups = [] } = useGroups()
  const { mutateAsync: update, isPending } = useUpdateContact()

  useEffect(() => {
    if (contact) {
      setValues({
        name: contact.name,
        nickname: contact.nickname ?? '',
        phone: contact.phone ?? '',
        groupIds: contact.groups.map((g) => g.id),
      })
    }
  }, [contact])

  async function handleSubmit() {
    if (!contact) return
    try {
      await update({ id: contact.id, ...values })
      toast.success('Contact updated')
      onClose()
    } catch {
      toast.error('Failed to update contact')
    }
  }

  return (
    <Modal open={!!contact} onClose={onClose} title="Edit contact">
      <ContactForm
        values={values}
        onChange={setValues}
        groups={groups}
        loading={isPending}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </Modal>
  )
}
