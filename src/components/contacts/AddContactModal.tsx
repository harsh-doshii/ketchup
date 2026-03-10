import { useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/Modal'
import { ContactForm, type ContactFormValues } from '@/components/contacts/ContactForm'
import { useCreateContact } from '@/hooks/useContacts'
import { useGroups } from '@/hooks/useGroups'

const EMPTY: ContactFormValues = { name: '', nickname: '', phone: '', groupIds: [] }

interface Props {
  open: boolean
  onClose: () => void
}

export function AddContactModal({ open, onClose }: Props) {
  const [values, setValues] = useState<ContactFormValues>(EMPTY)
  const { data: groups = [] } = useGroups()
  const { mutateAsync: create, isPending } = useCreateContact()

  async function handleSubmit() {
    try {
      await create(values)
      toast.success(`${values.name} added`)
      setValues(EMPTY)
      onClose()
    } catch {
      toast.error('Failed to add contact')
    }
  }

  function handleClose() {
    setValues(EMPTY)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add contact">
      <ContactForm
        values={values}
        onChange={setValues}
        groups={groups}
        loading={isPending}
        onSubmit={handleSubmit}
        submitLabel="Add contact"
      />
    </Modal>
  )
}
