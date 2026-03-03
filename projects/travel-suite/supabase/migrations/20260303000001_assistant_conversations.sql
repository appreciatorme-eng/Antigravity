-- Persistent conversation history for the assistant chat.
-- Each row represents one user <-> assistant exchange within a conversation.

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL DEFAULT gen_random_uuid()::text,
  title text,
  message_role text NOT NULL CHECK (message_role IN ('user', 'assistant')),
  message_content text NOT NULL,
  action_name text,
  action_result jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_assistant_conv_org_user
  ON assistant_conversations (organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assistant_conv_session
  ON assistant_conversations (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_assistant_conv_search
  ON assistant_conversations USING gin (to_tsvector('english', message_content));

-- RLS
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations"
  ON assistant_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage conversations"
  ON assistant_conversations FOR ALL
  USING (true)
  WITH CHECK (true);
