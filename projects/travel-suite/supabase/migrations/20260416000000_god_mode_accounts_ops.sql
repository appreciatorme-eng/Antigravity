-- God Mode V1 Accounts + Revenue Ops foundations
-- Adds durable account state, unified work items, and real user suspension state.

alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

create table if not exists public.god_account_state (
  org_id               uuid primary key references public.organizations(id) on delete cascade,
  owner_id             uuid references public.profiles(id) on delete set null,
  lifecycle_stage      text not null default 'active'
                       check (lifecycle_stage in ('new', 'onboarding', 'active', 'watch', 'at_risk', 'churned')),
  health_score         integer not null default 75
                       check (health_score >= 0 and health_score <= 100),
  health_band          text not null default 'healthy'
                       check (health_band in ('healthy', 'watch', 'at_risk')),
  next_action          text,
  next_action_due_at   timestamptz,
  last_contacted_at    timestamptz,
  renewal_at           timestamptz,
  playbook             text,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_god_account_state_owner_health
  on public.god_account_state(owner_id, health_band, lifecycle_stage);

create table if not exists public.god_work_items (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null
               check (kind in ('collections', 'renewal', 'churn_risk', 'support_escalation', 'incident_followup', 'growth_followup')),
  target_type  text not null
               check (target_type in ('organization', 'invoice', 'proposal', 'ticket', 'error_event')),
  target_id    text not null,
  org_id       uuid references public.organizations(id) on delete cascade,
  owner_id     uuid references public.profiles(id) on delete set null,
  status       text not null default 'open'
               check (status in ('open', 'in_progress', 'blocked', 'snoozed', 'done')),
  severity     text not null default 'medium'
               check (severity in ('low', 'medium', 'high', 'critical')),
  title        text not null,
  summary      text,
  due_at       timestamptz,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_god_work_items_org_status_due
  on public.god_work_items(org_id, status, due_at asc nulls last);

create index if not exists idx_god_work_items_owner_status_due
  on public.god_work_items(owner_id, status, due_at asc nulls last);

create index if not exists idx_god_work_items_target
  on public.god_work_items(target_type, target_id);

create or replace function public.set_god_mode_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_god_account_state_updated_at on public.god_account_state;
create trigger trg_god_account_state_updated_at
  before update on public.god_account_state
  for each row execute function public.set_god_mode_updated_at();

drop trigger if exists trg_god_work_items_updated_at on public.god_work_items;
create trigger trg_god_work_items_updated_at
  before update on public.god_work_items
  for each row execute function public.set_god_mode_updated_at();

alter table public.god_account_state enable row level security;
alter table public.god_work_items enable row level security;

do $$ begin
  create policy "super_admin_all_god_account_state"
    on public.god_account_state
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
  create policy "super_admin_all_god_work_items"
    on public.god_work_items
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
