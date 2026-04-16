-- Closed-loop outcomes for god mode work items.
-- Stores whether interventions actually helped so Business OS can learn by playbook.

create table if not exists public.god_work_item_outcomes (
  id            uuid primary key default gen_random_uuid(),
  work_item_id  uuid not null references public.god_work_items(id) on delete cascade,
  org_id        uuid not null references public.organizations(id) on delete cascade,
  outcome_type  text not null
               check (
                 outcome_type in (
                   'recovered',
                   'no_change',
                   'worse',
                   'churned',
                   'payment_collected',
                   'proposal_sent',
                   'proposal_approved',
                   'trip_converted'
                 )
               ),
  note          text,
  metadata      jsonb not null default '{}'::jsonb,
  recorded_by   uuid references public.profiles(id) on delete set null,
  recorded_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists idx_god_work_item_outcomes_work_item
  on public.god_work_item_outcomes (work_item_id, recorded_at desc);

create index if not exists idx_god_work_item_outcomes_org
  on public.god_work_item_outcomes (org_id, recorded_at desc);

create index if not exists idx_god_work_item_outcomes_type
  on public.god_work_item_outcomes (outcome_type, recorded_at desc);

alter table public.god_work_item_outcomes enable row level security;

do $$ begin
  create policy "super_admin_all_god_work_item_outcomes"
    on public.god_work_item_outcomes
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
