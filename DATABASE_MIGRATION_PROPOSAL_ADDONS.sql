-- Migration: Add proposal_addons table for add-on selection
-- Purpose: Allow tour operators to add optional add-ons to proposals
--          and let clients select which ones they want

-- Create proposal_addons table
CREATE TABLE IF NOT EXISTS proposal_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    is_selected_by_client BOOLEAN NOT NULL DEFAULT false,
    is_included_by_default BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, addon_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposal_addons_proposal_id ON proposal_addons(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_addons_addon_id ON proposal_addons(addon_id);
CREATE INDEX IF NOT EXISTS idx_proposal_addons_selected ON proposal_addons(is_selected_by_client);

-- Add RLS (Row Level Security) policies
ALTER TABLE proposal_addons ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view proposal add-ons
CREATE POLICY "Allow authenticated users to view proposal addons"
    ON proposal_addons FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow users to insert add-ons for their organization's proposals
CREATE POLICY "Allow users to insert proposal addons"
    ON proposal_addons FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM proposals
            WHERE proposals.id = proposal_addons.proposal_id
            AND proposals.organization_id = auth.uid()::uuid
        )
    );

-- Policy: Allow users to update add-ons for their organization's proposals
CREATE POLICY "Allow users to update proposal addons"
    ON proposal_addons FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM proposals
            WHERE proposals.id = proposal_addons.proposal_id
            AND proposals.organization_id = auth.uid()::uuid
        )
    );

-- Policy: Allow users to delete add-ons for their organization's proposals
CREATE POLICY "Allow users to delete proposal addons"
    ON proposal_addons FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM proposals
            WHERE proposals.id = proposal_addons.proposal_id
            AND proposals.organization_id = auth.uid()::uuid
        )
    );

-- Policy: Allow clients to update selection status via share token
CREATE POLICY "Allow clients to select addons via share token"
    ON proposal_addons FOR UPDATE
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM proposals
            WHERE proposals.id = proposal_addons.proposal_id
            AND current_setting('request.jwt.claims', true)::jsonb->>'share_token' = proposals.share_token
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM proposals
            WHERE proposals.id = proposal_addons.proposal_id
            AND current_setting('request.jwt.claims', true)::jsonb->>'share_token' = proposals.share_token
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_proposal_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_proposal_addons_updated_at
    BEFORE UPDATE ON proposal_addons
    FOR EACH ROW
    EXECUTE FUNCTION update_proposal_addons_updated_at();

-- Create function to recalculate proposal price when add-ons change
CREATE OR REPLACE FUNCTION recalculate_proposal_price_on_addon_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the proposal's client_selected_price based on add-ons
    UPDATE proposals
    SET client_selected_price = (
        -- Base price
        COALESCE(total_price, 0) +
        -- Add price of all selected or default add-ons
        COALESCE((
            SELECT SUM(addons.price)
            FROM proposal_addons
            JOIN addons ON addons.id = proposal_addons.addon_id
            WHERE proposal_addons.proposal_id = COALESCE(NEW.proposal_id, OLD.proposal_id)
            AND (proposal_addons.is_selected_by_client = true OR proposal_addons.is_included_by_default = true)
        ), 0)
    )
    WHERE id = COALESCE(NEW.proposal_id, OLD.proposal_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to recalculate price on add-on changes
CREATE TRIGGER trigger_recalculate_proposal_price_on_addon_change
    AFTER INSERT OR UPDATE OR DELETE ON proposal_addons
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_proposal_price_on_addon_change();

-- Grant permissions
GRANT ALL ON proposal_addons TO authenticated;
GRANT SELECT ON proposal_addons TO anon;

-- Comments for documentation
COMMENT ON TABLE proposal_addons IS 'Junction table linking proposals to add-ons with client selection status';
COMMENT ON COLUMN proposal_addons.is_selected_by_client IS 'Whether the client has selected this add-on';
COMMENT ON COLUMN proposal_addons.is_included_by_default IS 'Whether this add-on is included by default in the proposal price';
COMMENT ON COLUMN proposal_addons.notes IS 'Additional notes or customizations for this add-on in this proposal';
