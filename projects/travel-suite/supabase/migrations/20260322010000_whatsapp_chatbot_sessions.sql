CREATE TABLE IF NOT EXISTS public.whatsapp_chatbot_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone text NOT NULL,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    state text NOT NULL DEFAULT 'new'
        CHECK (state IN ('new', 'qualifying', 'proposal_ready', 'handed_off')),
    context jsonb NOT NULL DEFAULT '{}'::jsonb,
    ai_reply_count integer NOT NULL DEFAULT 0 CHECK (ai_reply_count >= 0),
    last_message_at timestamptz,
    last_ai_reply_at timestamptz,
    handed_off_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (phone, organization_id)
);

ALTER TABLE public.whatsapp_chatbot_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org admins manage chatbot sessions"
    ON public.whatsapp_chatbot_sessions;
CREATE POLICY "org admins manage chatbot sessions"
    ON public.whatsapp_chatbot_sessions
    FOR ALL
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE INDEX IF NOT EXISTS idx_whatsapp_chatbot_sessions_org_phone
    ON public.whatsapp_chatbot_sessions (organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chatbot_sessions_org_state
    ON public.whatsapp_chatbot_sessions (organization_id, state);

