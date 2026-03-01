create table if not exists public.cost_alert_acknowledgments (
  id uuid default gen_random_uuid() primary key,
  alert_id text not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (alert_id, organization_id)
);

create table if not exists public.cost_alert_ack_events (
  id uuid default gen_random_uuid() primary key,
  alert_id text not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text not null default 'admin',
  event_type text not null default 'acknowledged' check (event_type in ('acknowledged', 'reopened')),
  metadata jsonb default '{}'::jsonb not null,
  event_at timestamptz default now() not null
);

create index if not exists idx_cost_alert_ack_org_alert
  on public.cost_alert_acknowledgments(organization_id, alert_id);
create index if not exists idx_cost_alert_ack_alert
  on public.cost_alert_acknowledgments(alert_id);

create index if not exists idx_cost_alert_ack_events_org_event
  on public.cost_alert_ack_events(organization_id, event_at desc);
create index if not exists idx_cost_alert_ack_events_alert
  on public.cost_alert_ack_events(alert_id, event_at desc);

drop trigger if exists set_updated_at_cost_alert_acknowledgments
  on public.cost_alert_acknowledgments;
create trigger set_updated_at_cost_alert_acknowledgments
  before update on public.cost_alert_acknowledgments
  for each row execute function public.handle_updated_at();

alter table public.cost_alert_acknowledgments enable row level security;
alter table public.cost_alert_ack_events enable row level security;

drop policy if exists "Admins can manage cost alert acknowledgments"
  on public.cost_alert_acknowledgments;
create policy "Admins can manage cost alert acknowledgments"
  on public.cost_alert_acknowledgments for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

drop policy if exists "Admins can view cost alert acknowledgment events"
  on public.cost_alert_ack_events;
create policy "Admins can view cost alert acknowledgment events"
  on public.cost_alert_ack_events for select
  using (public.is_org_admin(organization_id));

drop policy if exists "Admins can insert cost alert acknowledgment events"
  on public.cost_alert_ack_events;
create policy "Admins can insert cost alert acknowledgment events"
  on public.cost_alert_ack_events for insert
  with check (public.is_org_admin(organization_id));
