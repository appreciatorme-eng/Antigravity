-- Business OS AI-native ops fields
-- Adds activation fields to god_account_state so Business OS and MCP can share
-- the same persisted lifecycle posture while keeping derived adoption metrics on read.

alter table public.god_account_state
  add column if not exists activation_stage text not null default 'signed_up'
    check (activation_stage in ('signed_up', 'onboarding', 'first_proposal_sent', 'active', 'expansion', 'at_risk', 'churned')),
  add column if not exists first_proposal_sent_at timestamptz,
  add column if not exists last_proposal_sent_at timestamptz;

create index if not exists idx_god_account_state_activation_stage
  on public.god_account_state (activation_stage);
