-- Error autofix pipeline
-- Adds AI analysis + GitHub tracking columns to error_events,
-- creates error_patterns knowledge base, and wires up a pg_net trigger
-- that fires the /api/webhooks/error-autofix handler on every new open error.

-- ---------------------------------------------------------------------------
-- 1. Extend error_events with autofix tracking columns
-- ---------------------------------------------------------------------------

alter table public.error_events
    add column if not exists github_issue_url  text,
    add column if not exists github_pr_url     text,
    add column if not exists ai_analysis       jsonb,   -- {root_cause, affected_files, confidence, summary}
    add column if not exists ai_suggested_fix  text,    -- unified diff or prose description
    add column if not exists autofix_status    text     not null default 'pending'
        check (autofix_status in ('pending', 'analyzing', 'issue_created', 'pr_opened', 'skipped', 'failed'));

-- ---------------------------------------------------------------------------
-- 2. error_patterns — accumulating knowledge base for past fixes
-- ---------------------------------------------------------------------------

create table if not exists public.error_patterns (
    id                    uuid        primary key default gen_random_uuid(),
    error_fingerprint     text        unique not null,  -- sha256 of normalised error title
    error_message_pattern text        not null,
    root_cause            text,
    fix_summary           text,
    fix_diff              text,                         -- unified diff that fixed it
    files_affected        text[],
    github_pr_url         text,
    times_seen            integer     not null default 1,
    last_seen_at          timestamptz not null default now(),
    confidence_score      float       not null default 0,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
);

-- Index for fingerprint lookups (exact match dedup)
create index if not exists idx_error_patterns_fingerprint
    on public.error_patterns(error_fingerprint);

-- Index for full-text pattern search (fuzzy similarity in app layer)
create index if not exists idx_error_patterns_pattern_text
    on public.error_patterns using gin(to_tsvector('english', error_message_pattern));

-- Auto-update updated_at
create or replace function public.set_error_patterns_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_error_patterns_updated_at
    before update on public.error_patterns
    for each row execute function public.set_error_patterns_updated_at();

-- RLS: super_admin only (same as error_events — internal tooling)
alter table public.error_patterns enable row level security;

create policy "Super admins can manage error patterns"
    on public.error_patterns for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'super_admin'
        )
    );

-- ---------------------------------------------------------------------------
-- 3. pg_net trigger: fire /api/webhooks/error-autofix on INSERT of open errors
-- ---------------------------------------------------------------------------

-- Ensure pg_net is available (idempotent — already enabled by earlier migration)
create extension if not exists pg_net;

create or replace function public.trigger_error_autofix()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
    base_url    text;
    cron_secret text;
    request_id  bigint;
begin
    -- Only fire for newly-created open errors
    if new.status <> 'open' then
        return new;
    end if;

    base_url    := current_setting('app.settings.supabase_url', true);
    cron_secret := current_setting('app.settings.cron_secret', true);

    -- Gracefully skip if environment not fully configured
    if base_url is null or cron_secret is null then
        raise warning 'error_autofix trigger: app.settings not configured — skipping autofix for error_event %', new.id;
        return new;
    end if;

    -- Replace Supabase URL with the app URL (same base domain, different port in prod)
    -- The Next.js app lives at the same base_url with /api prefix
    select into request_id
        net.http_post(
            url     := base_url || '/api/webhooks/error-autofix',
            headers := jsonb_build_object(
                'Content-Type',              'application/json',
                'Authorization',             'Bearer ' || cron_secret,
                -- Use the event id as idempotency key so the replay-detection
                -- window (1-minute bucket) doesn't block concurrent errors
                'x-cron-idempotency-key',    new.id::text
            ),
            body    := jsonb_build_object('error_event_id', new.id::text)
        );

    raise log 'error_autofix: fired for error_event % (request_id: %)', new.id, request_id;

    return new;
exception
    when others then
        raise warning 'error_autofix trigger: failed to fire for error_event %: %', new.id, SQLERRM;
        return new;
end;
$function$;

drop trigger if exists on_error_event_created on public.error_events;

create trigger on_error_event_created
    after insert on public.error_events
    for each row execute function public.trigger_error_autofix();

comment on trigger on_error_event_created on public.error_events is
    'Fires /api/webhooks/error-autofix for every new open error event so the AI pipeline can analyse and create GitHub issues/PRs automatically.';
