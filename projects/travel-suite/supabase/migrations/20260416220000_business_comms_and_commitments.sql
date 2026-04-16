-- Customer communication orchestration and commitment/SLA tracking for Business OS.

create table if not exists public.god_comms_sequences (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations(id) on delete cascade,
  owner_id          uuid references public.profiles(id) on delete set null,
  sequence_type     text not null
                   check (
                     sequence_type in (
                       'activation_rescue',
                       'viewed_not_approved',
                       'collections',
                       'incident_recovery',
                       'renewal_prep'
                     )
                   ),
  status            text not null default 'active'
                   check (status in ('active', 'paused', 'completed')),
  channel           text not null default 'mixed'
                   check (channel in ('email', 'whatsapp', 'in_app', 'mixed')),
  step_index        int not null default 0,
  last_sent_at      timestamptz,
  next_follow_up_at timestamptz,
  promise           text,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_god_comms_sequences_org_status
  on public.god_comms_sequences (org_id, status, next_follow_up_at);

create index if not exists idx_god_comms_sequences_next_follow_up
  on public.god_comms_sequences (next_follow_up_at)
  where status = 'active';

drop trigger if exists trg_god_comms_sequences_updated_at on public.god_comms_sequences;
create trigger trg_god_comms_sequences_updated_at
  before update on public.god_comms_sequences
  for each row execute function public.set_god_mode_updated_at();

create table if not exists public.god_commitments (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  owner_id     uuid references public.profiles(id) on delete set null,
  source       text not null default 'ops'
              check (source in ('support', 'sales', 'collections', 'incident', 'ops')),
  title        text not null,
  detail       text,
  severity     text not null default 'medium'
              check (severity in ('low', 'medium', 'high', 'critical')),
  status       text not null default 'open'
              check (status in ('open', 'met', 'breached', 'cancelled')),
  promised_at  timestamptz not null default now(),
  due_at       timestamptz not null,
  resolved_at  timestamptz,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_god_commitments_org_status
  on public.god_commitments (org_id, status, due_at);

create index if not exists idx_god_commitments_due_at
  on public.god_commitments (due_at)
  where status = 'open';

drop trigger if exists trg_god_commitments_updated_at on public.god_commitments;
create trigger trg_god_commitments_updated_at
  before update on public.god_commitments
  for each row execute function public.set_god_mode_updated_at();

alter table public.god_comms_sequences enable row level security;
alter table public.god_commitments enable row level security;

do $$ begin
  create policy "super_admin_all_god_comms_sequences"
    on public.god_comms_sequences
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
  create policy "super_admin_all_god_commitments"
    on public.god_commitments
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
