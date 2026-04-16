-- Org memory for Business OS
-- Stores support-ready event history and operator notes at the organization level.

create table if not exists public.org_activity_events (
  id           uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  actor_id      uuid references public.profiles(id) on delete set null,
  event_type    text not null,
  title         text not null,
  detail        text,
  entity_type   text,
  entity_id     text,
  source        text not null default 'system',
  metadata      jsonb not null default '{}'::jsonb,
  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists idx_org_activity_events_org_occurred
  on public.org_activity_events (org_id, occurred_at desc);

create index if not exists idx_org_activity_events_entity
  on public.org_activity_events (entity_type, entity_id);

create table if not exists public.org_memory_notes (
  id           uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  author_id     uuid references public.profiles(id) on delete set null,
  category      text not null default 'context'
               check (category in ('context', 'handoff', 'promise', 'support')),
  title         text not null,
  body          text not null,
  pinned        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_org_memory_notes_org_created
  on public.org_memory_notes (org_id, pinned desc, created_at desc);

drop trigger if exists trg_org_memory_notes_updated_at on public.org_memory_notes;
create trigger trg_org_memory_notes_updated_at
  before update on public.org_memory_notes
  for each row execute function public.set_god_mode_updated_at();

alter table public.org_activity_events enable row level security;
alter table public.org_memory_notes enable row level security;

do $$ begin
  create policy "super_admin_all_org_activity_events"
    on public.org_activity_events
    for all
    to authenticated
    using (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'super_admin'
      )
    )
    with check (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'super_admin'
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "super_admin_all_org_memory_notes"
    on public.org_memory_notes
    for all
    to authenticated
    using (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'super_admin'
      )
    )
    with check (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'super_admin'
      )
    );
exception when duplicate_object then null; end $$;
