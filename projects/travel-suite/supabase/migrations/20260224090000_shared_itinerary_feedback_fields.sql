-- Add feedback/approval metadata to shared itinerary links used by /api/share/[token]
-- Idempotent so it can run safely on environments that already have some columns.

alter table public.shared_itineraries
  add column if not exists status text,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists client_comments jsonb;

update public.shared_itineraries
set status = coalesce(nullif(status, ''), 'viewed')
where status is null or status = '';

update public.shared_itineraries
set client_comments = coalesce(client_comments, '[]'::jsonb)
where client_comments is null;

alter table public.shared_itineraries
  alter column status set default 'viewed';

alter table public.shared_itineraries
  alter column client_comments set default '[]'::jsonb;

alter table public.shared_itineraries
  alter column status set not null;

alter table public.shared_itineraries
  alter column client_comments set not null;

create index if not exists idx_shared_itineraries_status
  on public.shared_itineraries(status);
