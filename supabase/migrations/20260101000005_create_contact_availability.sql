create table public.contact_availability (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  updated_at timestamptz not null default now()
);

create index on public.contact_availability (contact_id);
