CREATE TABLE IF NOT EXISTS public.whatsapp_proposal_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    chatbot_session_id uuid NOT NULL UNIQUE REFERENCES public.whatsapp_chatbot_sessions(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    template_id uuid REFERENCES public.tour_templates(id) ON DELETE SET NULL,
    traveler_name text,
    traveler_phone text NOT NULL,
    traveler_email text,
    destination text,
    travel_dates text,
    trip_start_date date,
    trip_end_date date,
    group_size integer CHECK (group_size IS NULL OR group_size > 0),
    budget_inr integer CHECK (budget_inr IS NULL OR budget_inr >= 0),
    title text NOT NULL,
    source_context jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'ready'
        CHECK (status IN ('ready', 'opened', 'converted', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_proposal_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org admins manage whatsapp proposal drafts"
    ON public.whatsapp_proposal_drafts;
CREATE POLICY "org admins manage whatsapp proposal drafts"
    ON public.whatsapp_proposal_drafts
    FOR ALL
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE INDEX IF NOT EXISTS idx_whatsapp_proposal_drafts_org_status
    ON public.whatsapp_proposal_drafts (organization_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_proposal_drafts_client
    ON public.whatsapp_proposal_drafts (client_id);
