-- Change slug column from UUID to TEXT so name-based slugs can be stored.
-- Existing UUID slugs are valid text and remain unchanged.
alter table public.contacts alter column slug type text using slug::text;
alter table public.contacts alter column slug drop default;
