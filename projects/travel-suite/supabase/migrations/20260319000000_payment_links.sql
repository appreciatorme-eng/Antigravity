-- Enable pgcrypto for gen_random_bytes token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    booking_id UUID, -- FK to bookings added later (table not yet created)
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
    client_name TEXT,
    client_phone TEXT,
    client_email TEXT,
    amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
    currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR', 'USD')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'paid', 'expired', 'cancelled')),
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    expires_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_links_organization_id ON public.payment_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_token ON public.payment_links(token);
CREATE INDEX IF NOT EXISTS idx_payment_links_proposal_id ON public.payment_links(proposal_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON public.payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_created_by ON public.payment_links(created_by);

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view payment links" ON public.payment_links;
CREATE POLICY "Org members can view payment links"
    ON public.payment_links
    FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org members can create payment links" ON public.payment_links;
CREATE POLICY "Org members can create payment links"
    ON public.payment_links
    FOR INSERT
    WITH CHECK (
        organization_id = (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org members can update payment links" ON public.payment_links;
CREATE POLICY "Org members can update payment links"
    ON public.payment_links
    FOR UPDATE
    USING (
        organization_id = (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id = (
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org admins can delete payment links" ON public.payment_links;
CREATE POLICY "Org admins can delete payment links"
    ON public.payment_links
    FOR DELETE
    USING (public.is_org_admin(organization_id));

ALTER TABLE public.payment_events
    ADD COLUMN IF NOT EXISTS payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_link_id ON public.payment_events(payment_link_id);

DROP POLICY IF EXISTS "Organizations can view their payment events" ON public.payment_events;
CREATE POLICY "Organizations can view their payment events"
    ON public.payment_events
    FOR SELECT
    USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Organizations can create payment events" ON public.payment_events;
CREATE POLICY "Organizations can create payment events"
    ON public.payment_events
    FOR INSERT
    WITH CHECK (organization_id = public.get_user_organization_id());

DROP TRIGGER IF EXISTS set_updated_at_payment_links ON public.payment_links;
CREATE TRIGGER set_updated_at_payment_links
    BEFORE UPDATE ON public.payment_links
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
