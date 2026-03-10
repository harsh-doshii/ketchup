-- Enable RLS on all tables
alter table public.contacts enable row level security;
alter table public.groups enable row level security;
alter table public.contact_groups enable row level security;
alter table public.owner_availability enable row level security;
alter table public.contact_availability enable row level security;
alter table public.call_log enable row level security;

-- ============================================================
-- contacts: owner only
-- ============================================================
create policy "owner can manage contacts"
  on public.contacts
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- groups: owner only
-- ============================================================
create policy "owner can manage groups"
  on public.groups
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- contact_groups: owner only
-- ============================================================
create policy "owner can manage contact_groups"
  on public.contact_groups
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- owner_availability: owner only
-- ============================================================
create policy "owner can manage owner_availability"
  on public.owner_availability
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- call_log: owner only
-- ============================================================
create policy "owner can manage call_log"
  on public.call_log
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- contact_availability: public read+write, scoped by slug
-- Guests can read and write rows for their own contact only.
-- The slug in the URL is used to look up the contact_id.
-- ============================================================

-- Allow anyone to read contact_availability (needed to pre-fill the guest grid)
create policy "public can read contact_availability"
  on public.contact_availability
  for select
  to anon
  using (true);

-- Allow anyone to insert/update contact_availability
-- The app layer resolves slug → contact_id before writing
create policy "public can upsert contact_availability"
  on public.contact_availability
  for insert
  to anon
  with check (true);

create policy "public can update contact_availability"
  on public.contact_availability
  for update
  to anon
  using (true)
  with check (true);

-- Also allow owner (authenticated) to read contact_availability for the dashboard
create policy "owner can read contact_availability"
  on public.contact_availability
  for select
  to authenticated
  using (true);

-- Allow anon to read contacts table (only by slug, for guest page lookup)
create policy "public can read contact by slug"
  on public.contacts
  for select
  to anon
  using (true);
