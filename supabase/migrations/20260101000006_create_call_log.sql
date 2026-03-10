create table public.call_log (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  called_at timestamptz not null default now(),
  notes text
);

create index on public.call_log (contact_id);
