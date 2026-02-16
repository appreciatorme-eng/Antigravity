-- Migration: Payment Infrastructure for India (Razorpay)
-- Created: 2026-02-15
-- Description: Complete payment infrastructure with GST compliance, subscriptions, and payment methods

-- ============================================================================
-- Payment Methods Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'upi', 'card', 'netbanking', 'wallet'
    provider VARCHAR(100) DEFAULT 'razorpay', -- 'razorpay' for India
    token TEXT, -- Encrypted payment method token
    last_four VARCHAR(4), -- Last 4 digits of card/account
    card_brand VARCHAR(50), -- 'visa', 'mastercard', 'rupay'
    upi_id VARCHAR(255), -- user@bank for UPI
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    expires_at DATE, -- For cards
    metadata JSONB DEFAULT '{}', -- Additional provider-specific data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment methods
CREATE INDEX idx_payment_methods_org ON public.payment_methods(organization_id);
CREATE INDEX idx_payment_methods_type ON public.payment_methods(type);
CREATE INDEX idx_payment_methods_default ON public.payment_methods(is_default) WHERE is_default = true;

-- Only one default payment method per organization
CREATE UNIQUE INDEX idx_payment_methods_org_default ON public.payment_methods(organization_id) WHERE is_default = true;

-- ============================================================================
-- Subscriptions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id VARCHAR(100) NOT NULL, -- 'free', 'pro_monthly', 'pro_annual', 'enterprise'
    razorpay_subscription_id VARCHAR(255) UNIQUE, -- External subscription ID from Razorpay
    razorpay_plan_id VARCHAR(255), -- Razorpay plan ID
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'paused', 'expired', 'trial'
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'annual'
    amount NUMERIC(10,2) NOT NULL, -- Base amount in INR
    gst_amount NUMERIC(10,2) DEFAULT 0, -- GST amount (18%)
    total_amount NUMERIC(10,2) NOT NULL, -- Total amount including GST
    currency VARCHAR(3) DEFAULT 'INR',
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    next_billing_date DATE,
    failed_payment_count INTEGER DEFAULT 0,
    last_payment_attempt_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}', -- Additional subscription data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON public.subscriptions(next_billing_date);
CREATE INDEX idx_subscriptions_razorpay_id ON public.subscriptions(razorpay_subscription_id);

-- Only one active subscription per organization
CREATE UNIQUE INDEX idx_subscriptions_org_active ON public.subscriptions(organization_id)
    WHERE status = 'active';

-- ============================================================================
-- Payment Events Table (Audit Log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 'payment.success', 'payment.failed', 'subscription.created', etc.
    external_id VARCHAR(255), -- Razorpay event ID
    amount NUMERIC(10,2),
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(50),
    error_code VARCHAR(100),
    error_description TEXT,
    metadata JSONB DEFAULT '{}', -- Full webhook payload or event data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment events
CREATE INDEX idx_payment_events_org ON public.payment_events(organization_id);
CREATE INDEX idx_payment_events_subscription ON public.payment_events(subscription_id);
CREATE INDEX idx_payment_events_invoice ON public.payment_events(invoice_id);
CREATE INDEX idx_payment_events_type ON public.payment_events(event_type);
CREATE INDEX idx_payment_events_created ON public.payment_events(created_at DESC);
CREATE INDEX idx_payment_events_external_id ON public.payment_events(external_id);

-- ============================================================================
-- Update Invoices Table for GST Compliance
-- ============================================================================
-- Add GST-related columns to existing invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS gstin VARCHAR(15); -- GST Identification Number
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(100); -- State for GST calculation
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sac_code VARCHAR(10) DEFAULT '998314'; -- SAC code for software services
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2); -- Amount before GST
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cgst NUMERIC(10,2) DEFAULT 0; -- Central GST (9%)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sgst NUMERIC(10,2) DEFAULT 0; -- State GST (9%)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS igst NUMERIC(10,2) DEFAULT 0; -- Integrated GST (18%)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tds_amount NUMERIC(10,2) DEFAULT 0; -- TDS deduction (10%)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS razorpay_invoice_id VARCHAR(255); -- Razorpay invoice ID
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255); -- Razorpay payment ID

-- Index for Razorpay IDs
CREATE INDEX IF NOT EXISTS idx_invoices_razorpay_invoice ON public.invoices(razorpay_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_razorpay_payment ON public.invoices(razorpay_payment_id);

-- ============================================================================
-- Update Organizations Table
-- ============================================================================
-- Add Razorpay customer ID to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS gstin VARCHAR(15); -- Company GSTIN
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS billing_address JSONB DEFAULT '{}'; -- Address for GST invoice
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100); -- State for CGST/SGST calculation

CREATE INDEX IF NOT EXISTS idx_organizations_razorpay_customer ON public.organizations(razorpay_customer_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Payment Methods RLS Policies
CREATE POLICY "Organizations can manage their payment methods"
    ON public.payment_methods
    USING (organization_id = auth.uid_organization_id());

-- Subscriptions RLS Policies
CREATE POLICY "Organizations can view their subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (organization_id = auth.uid_organization_id());

CREATE POLICY "Organizations can update their subscriptions"
    ON public.subscriptions
    FOR UPDATE
    USING (organization_id = auth.uid_organization_id());

-- Payment Events RLS Policies (Read-only for organizations)
CREATE POLICY "Organizations can view their payment events"
    ON public.payment_events
    FOR SELECT
    USING (organization_id = auth.uid_organization_id());

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to calculate GST based on state
CREATE OR REPLACE FUNCTION calculate_gst(
    p_subtotal NUMERIC,
    p_company_state VARCHAR,
    p_customer_state VARCHAR
)
RETURNS TABLE(cgst NUMERIC, sgst NUMERIC, igst NUMERIC, total_gst NUMERIC)
LANGUAGE plpgsql
AS $$
DECLARE
    v_gst_rate NUMERIC := 0.18; -- 18% GST for software services
    v_total_gst NUMERIC;
BEGIN
    v_total_gst := p_subtotal * v_gst_rate;

    IF p_company_state = p_customer_state THEN
        -- Intra-state: CGST (9%) + SGST (9%)
        RETURN QUERY SELECT
            ROUND(p_subtotal * 0.09, 2) AS cgst,
            ROUND(p_subtotal * 0.09, 2) AS sgst,
            0::NUMERIC AS igst,
            ROUND(v_total_gst, 2) AS total_gst;
    ELSE
        -- Inter-state: IGST (18%)
        RETURN QUERY SELECT
            0::NUMERIC AS cgst,
            0::NUMERIC AS sgst,
            ROUND(v_total_gst, 2) AS igst,
            ROUND(v_total_gst, 2) AS total_gst;
    END IF;
END;
$$;

-- Function to get organization's current subscription
CREATE OR REPLACE FUNCTION get_current_subscription(p_organization_id UUID)
RETURNS TABLE(
    subscription_id UUID,
    plan_id VARCHAR,
    status VARCHAR,
    billing_cycle VARCHAR,
    amount NUMERIC,
    current_period_end TIMESTAMPTZ,
    is_trial BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.plan_id,
        s.status,
        s.billing_cycle,
        s.total_amount,
        s.current_period_end,
        (s.trial_end IS NOT NULL AND s.trial_end > NOW()) AS is_trial
    FROM public.subscriptions s
    WHERE s.organization_id = p_organization_id
        AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$;

-- Function to check if organization has reached tier limit
CREATE OR REPLACE FUNCTION check_tier_limit(
    p_organization_id UUID,
    p_feature VARCHAR, -- 'clients', 'trips', 'proposals', 'users'
    p_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_count INTEGER;
    v_tier_limit INTEGER;
BEGIN
    -- Get current usage count based on feature
    CASE p_feature
        WHEN 'clients' THEN
            SELECT COUNT(*) INTO v_current_count
            FROM public.clients
            WHERE organization_id = p_organization_id;

        WHEN 'trips' THEN
            SELECT COUNT(*) INTO v_current_count
            FROM public.trips
            WHERE organization_id = p_organization_id
                AND created_at >= DATE_TRUNC('month', NOW());

        WHEN 'proposals' THEN
            SELECT COUNT(*) INTO v_current_count
            FROM public.proposals
            WHERE organization_id = p_organization_id
                AND created_at >= DATE_TRUNC('month', NOW());

        WHEN 'users' THEN
            SELECT COUNT(*) INTO v_current_count
            FROM public.user_profiles
            WHERE organization_id = p_organization_id;

        ELSE
            RETURN TRUE; -- Unknown feature, allow by default
    END CASE;

    -- Check if limit exceeded
    RETURN v_current_count < p_limit;
END;
$$;

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

-- Trigger for payment_methods
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- Trigger for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.payment_methods IS 'Saved payment methods for organizations (UPI, cards, net banking, wallets)';
COMMENT ON TABLE public.subscriptions IS 'Organization subscription management with Razorpay integration';
COMMENT ON TABLE public.payment_events IS 'Audit log for all payment-related events and webhooks';

COMMENT ON FUNCTION calculate_gst IS 'Calculate CGST/SGST (intra-state) or IGST (inter-state) for GST compliance';
COMMENT ON FUNCTION get_current_subscription IS 'Get active subscription for an organization';
COMMENT ON FUNCTION check_tier_limit IS 'Check if organization has reached their tier limit for a feature';
