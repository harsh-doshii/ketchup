create table public.contact_groups (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  primary key (contact_id, group_id)
);
