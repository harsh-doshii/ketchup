import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ContactGroup {
  id: string
  name: string
}

export interface Contact {
  id: string
  name: string
  nickname: string | null
  phone: string | null
  slug: string
  last_called_at: string | null
  is_deleted: boolean
  created_at: string
  groups: ContactGroup[]
  has_availability: boolean
}

const CONTACTS_KEY = ['contacts']

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 24)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

export function useContacts() {
  return useQuery({
    queryKey: CONTACTS_KEY,
    queryFn: async (): Promise<Contact[]> => {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_groups(group_id, groups(id, name)),
          contact_availability(id)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row) => ({
        ...row,
        groups: (row.contact_groups ?? [])
          .map((cg: { groups: { id: string; name: string } | null }) => cg.groups)
          .filter(Boolean) as ContactGroup[],
        has_availability: (row.contact_availability ?? []).length > 0,
      }))
    },
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      name,
      nickname,
      phone,
      groupIds,
    }: {
      name: string
      nickname: string
      phone: string
      groupIds: string[]
    }) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert({ name, nickname: nickname || null, phone: phone || null, slug: generateSlug(name) })
        .select('id')
        .single()
      if (error) throw error

      if (groupIds.length > 0) {
        const { error: groupError } = await supabase
          .from('contact_groups')
          .insert(groupIds.map((group_id) => ({ contact_id: data.id, group_id })))
        if (groupError) throw groupError
      }
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTACTS_KEY }),
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      name,
      nickname,
      phone,
      groupIds,
    }: {
      id: string
      name: string
      nickname: string
      phone: string
      groupIds: string[]
    }) => {
      const { error } = await supabase
        .from('contacts')
        .update({ name, nickname: nickname || null, phone: phone || null })
        .eq('id', id)
      if (error) throw error

      // Replace group assignments
      await supabase.from('contact_groups').delete().eq('contact_id', id)
      if (groupIds.length > 0) {
        const { error: groupError } = await supabase
          .from('contact_groups')
          .insert(groupIds.map((group_id) => ({ contact_id: id, group_id })))
        if (groupError) throw groupError
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTACTS_KEY }),
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .update({ is_deleted: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTACTS_KEY }),
  })
}
