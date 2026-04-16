-- Business OS phase 2 review-loop fields
-- Adds persisted review memory so AI and operators can reason about what changed
-- since the last human pass without introducing a second source of truth.

alter table public.god_account_state
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists last_review_summary text;

create index if not exists idx_god_account_state_last_reviewed_at
  on public.god_account_state (last_reviewed_at desc nulls last);
