-- Allow anon to delete their own contact_availability rows
-- (needed for the guest page "delete all + insert" save pattern)
create policy "public can delete contact_availability"
  on public.contact_availability
  for delete
  to anon
  using (true);
