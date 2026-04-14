-- Error events: lightweight correlation + resolution tracker for Sentry issues.
-- Sentry is the source of truth for stack traces and event details.
-- This table provides: permanent storage (beyond Sentry's 30-day free retention),
-- business context (which org/user was affected), and resolution tracking.

create table if not exists public.error_events (
    id                uuid        default gen_random_uuid() primary key,
    sentry_issue_id   text        unique not null,         -- Sentry issue ID (dedup key)
    sentry_issue_url  text,                                -- Deep link to Sentry issue
    title             text        not null,                -- Error title from Sentry
    level             text        not null default 'error' -- fatal/error/warning/info
                          check (level in ('fatal', 'error', 'warning', 'info', 'debug')),
    culprit           text,                                -- File/function where it occurred
    environment       text,                                -- production/preview/development
    event_count       integer     not null default 1,      -- How many times seen (from Sentry)
    user_count        integer     not null default 0,      -- Unique users affected

    -- Business context (populated from Sentry user metadata set via SentryUserContext)
    affected_user_id  uuid        references public.profiles(id) on delete set null,
    organization_id   uuid        references public.organizations(id) on delete set null,
    context           jsonb       not null default '{}',   -- Extra: trip_id, route, etc.

    -- Resolution tracking
    status            text        not null default 'open'
                          check (status in ('open', 'investigating', 'resolved', 'wont_fix')),
    resolution_notes  text,                                -- What was done to fix it
    resolved_at       timestamptz,
    resolved_by       uuid        references public.profiles(id) on delete set null,

    -- Timestamps
    first_seen_at     timestamptz,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

-- Composite index for the most common query: open errors by recency
create index if not exists idx_error_events_status_created
    on public.error_events(status, created_at desc);

-- Index for filtering by org (admin dashboards, future UI)
create index if not exists idx_error_events_org_created
    on public.error_events(organization_id, created_at desc)
    where organization_id is not null;

-- Index for filtering by severity
create index if not exists idx_error_events_level_created
    on public.error_events(level, created_at desc);

-- Auto-update updated_at on every row change
create or replace function public.set_error_events_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_error_events_updated_at
    before update on public.error_events
    for each row execute function public.set_error_events_updated_at();

-- RLS: super_admin only — this is an internal debugging tool, not user-facing.
-- The webhook handler uses the service-role admin client which bypasses RLS.
alter table public.error_events enable row level security;

create policy "Super admins can manage error events"
    on public.error_events for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'super_admin'
        )
    );
