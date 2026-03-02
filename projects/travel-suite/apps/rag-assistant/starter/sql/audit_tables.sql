create table if not exists public.chat_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid,
  channel text not null check (channel in ('web', 'whatsapp')),
  event_type text not null,
  action_name text,
  message_text text,
  retrieved_ids jsonb,
  tool_payload jsonb,
  tool_result jsonb,
  -- Idempotency: for WhatsApp messages use the provider_message_id here
  -- to prevent duplicate processing (matches existing whatsapp_webhook_events pattern)
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_audit_org_created_at
  on public.chat_audit_events (organization_id, created_at desc);
