create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nickname text,
  phone text,
  slug uuid not null unique default gen_random_uuid(),
  last_called_at timestamptz,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);
