-- Allow authenticated users (e.g. owner testing guest links while logged in)
-- to also read and write contact_availability, same as anon guests.

create policy "authenticated can insert contact_availability"
  on public.contact_availability
  for insert
  to authenticated
  with check (true);

create policy "authenticated can update contact_availability"
  on public.contact_availability
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete contact_availability"
  on public.contact_availability
  for delete
  to authenticated
  using (true);
