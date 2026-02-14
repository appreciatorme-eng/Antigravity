-- Migration: Phase 2 Navigation - Add-ons, Concierge Requests, Travel Documents
-- Created: 2026-02-14
-- Description: Database tables to support new mobile navigation (Explore, Concierge, Bookings)

-- ============================================================================
-- Add-ons Table (for Explore screen)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Activities', 'Dining', 'Transport', 'Upgrades'
    image_url TEXT,
    duration VARCHAR(100), -- e.g., '2 hours', 'Per night'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_add_ons_org_id ON public.add_ons(organization_id);
CREATE INDEX idx_add_ons_category ON public.add_ons(category);
CREATE INDEX idx_add_ons_active ON public.add_ons(is_active);

-- Enable RLS
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Organizations can manage their own add-ons
CREATE POLICY "Organizations can manage their add-ons"
    ON public.add_ons
    USING (organization_id = auth.uid_organization_id());

-- ============================================================================
-- Client Add-ons Table (purchased add-ons)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.client_add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    add_on_id UUID NOT NULL REFERENCES public.add_ons(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed'
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_client_add_ons_client_id ON public.client_add_ons(client_id);
CREATE INDEX idx_client_add_ons_trip_id ON public.client_add_ons(trip_id);

-- Enable RLS
ALTER TABLE public.client_add_ons ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can view their own purchases
CREATE POLICY "Clients can view their add-on purchases"
    ON public.client_add_ons
    FOR SELECT
    USING (client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
    ));

-- RLS Policy: Organizations can manage client purchases
CREATE POLICY "Organizations can manage client add-on purchases"
    ON public.client_add_ons
    USING (
        client_id IN (
            SELECT id FROM public.clients WHERE organization_id = auth.uid_organization_id()
        )
    );

-- ============================================================================
-- Concierge Requests Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.concierge_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'Dietary', 'Accessibility', 'Special Occasion', 'Medical', 'Other'
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    response TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_concierge_requests_client_id ON public.concierge_requests(client_id);
CREATE INDEX idx_concierge_requests_trip_id ON public.concierge_requests(trip_id);
CREATE INDEX idx_concierge_requests_status ON public.concierge_requests(status);

-- Enable RLS
ALTER TABLE public.concierge_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can view and create their own requests
CREATE POLICY "Clients can manage their concierge requests"
    ON public.concierge_requests
    USING (
        client_id IN (
            SELECT id FROM public.clients WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Organizations can view and manage all client requests
CREATE POLICY "Organizations can manage all concierge requests"
    ON public.concierge_requests
    USING (
        client_id IN (
            SELECT id FROM public.clients WHERE organization_id = auth.uid_organization_id()
        )
    );

-- ============================================================================
-- Travel Documents Table (for Bookings screen)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.travel_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Flight', 'Accommodation', 'Insurance', 'Visa', 'Other'
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_travel_documents_client_id ON public.travel_documents(client_id);
CREATE INDEX idx_travel_documents_trip_id ON public.travel_documents(trip_id);
CREATE INDEX idx_travel_documents_type ON public.travel_documents(type);

-- Enable RLS
ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can view their own documents
CREATE POLICY "Clients can view their travel documents"
    ON public.travel_documents
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM public.clients WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Organizations can manage client documents
CREATE POLICY "Organizations can manage travel documents"
    ON public.travel_documents
    USING (
        client_id IN (
            SELECT id FROM public.clients WHERE organization_id = auth.uid_organization_id()
        )
    );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get organization ID from auth.uid()
CREATE OR REPLACE FUNCTION auth.uid_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

-- Trigger for add_ons
CREATE OR REPLACE FUNCTION update_add_ons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_ons_updated_at
    BEFORE UPDATE ON public.add_ons
    FOR EACH ROW
    EXECUTE FUNCTION update_add_ons_updated_at();

-- Trigger for concierge_requests
CREATE OR REPLACE FUNCTION update_concierge_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_concierge_requests_updated_at
    BEFORE UPDATE ON public.concierge_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_concierge_requests_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.add_ons IS 'Tour operator add-ons available for upselling (Explore screen)';
COMMENT ON TABLE public.client_add_ons IS 'Purchased add-ons by clients';
COMMENT ON TABLE public.concierge_requests IS 'Special requests from travelers (Concierge screen)';
COMMENT ON TABLE public.travel_documents IS 'Travel documents for bookings (Bookings screen)';
