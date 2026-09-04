-- Owenis.me request queue
-- Run this in the Supabase SQL editor, or: supabase db push
--
-- The public site only ever inserts. Reads, updates and deletes are
-- closed to the anon role, so work the queue from the dashboard or
-- with the service role key.

create extension if not exists pgcrypto;

create table if not exists public.requests (
  id            uuid primary key default gen_random_uuid(),
  reference     text        not null,
  handle        text        not null,
  project_id    text        not null,
  contact_email text        not null,
  dns_records   text        not null,
  note          text        not null default '',
  status        text        not null default 'new',
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists requests_created_at_idx on public.requests (created_at desc);
create index if not exists requests_status_idx     on public.requests (status);
create index if not exists requests_reference_idx  on public.requests (reference);

alter table public.requests enable row level security;

-- Insert only, and only rows that pass the same checks the form applies.
-- A determined caller can still post junk, but not junk of the wrong shape.
drop policy if exists "anon can submit a request" on public.requests;
create policy "anon can submit a request"
  on public.requests
  for insert
  to anon
  with check (
        char_length(handle) between 1 and 32
    and handle ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
    and char_length(project_id) between 1 and 120
    and char_length(contact_email) <= 200
    and contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    and char_length(dns_records) between 20 and 5000
    and char_length(note) <= 1000
    and char_length(reference) between 4 and 16
    and status = 'new'
  );

-- No select/update/delete policy exists, so RLS denies all three to anon.
revoke all on public.requests from anon;
grant insert on public.requests to anon;
