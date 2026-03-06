-- Pricing & Profit: trip-level cost tracking + monthly overhead expenses
-- Replaces the Excel-based costing/pricing workflow for tour operators

-- Table 1: Per-trip service cost line items
CREATE TABLE IF NOT EXISTS trip_service_costs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trip_id          UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category         TEXT NOT NULL CHECK (category IN ('hotels','vehicle','flights','visa','insurance','train','bus','other')),
  vendor_name      TEXT,
  description      TEXT,
  pax_count        INTEGER DEFAULT 1,
  cost_amount      NUMERIC(12,2) DEFAULT 0,
  price_amount     NUMERIC(12,2) DEFAULT 0,
  currency         TEXT DEFAULT 'INR',
  notes            TEXT,
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_service_costs_org_trip
  ON trip_service_costs (organization_id, trip_id);

CREATE INDEX IF NOT EXISTS idx_trip_service_costs_org_date
  ON trip_service_costs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trip_service_costs_vendor
  ON trip_service_costs (organization_id, category, vendor_name);

-- Table 2: Monthly overhead / fixed expenses
CREATE TABLE IF NOT EXISTS monthly_overhead_expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month_start      DATE NOT NULL,
  category         TEXT NOT NULL,
  description      TEXT,
  amount           NUMERIC(12,2) DEFAULT 0,
  currency         TEXT DEFAULT 'INR',
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, month_start, category)
);

-- Add pax_count to trips if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'pax_count'
  ) THEN
    ALTER TABLE trips ADD COLUMN pax_count INTEGER DEFAULT 1 CHECK (pax_count > 0);
  END IF;
END $$;

-- RLS: trip_service_costs
ALTER TABLE trip_service_costs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "trip_service_costs_select" ON trip_service_costs
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "trip_service_costs_insert" ON trip_service_costs
    FOR INSERT WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "trip_service_costs_update" ON trip_service_costs
    FOR UPDATE USING (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "trip_service_costs_delete" ON trip_service_costs
    FOR DELETE USING (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS: monthly_overhead_expenses
ALTER TABLE monthly_overhead_expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "monthly_overhead_expenses_select" ON monthly_overhead_expenses
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "monthly_overhead_expenses_insert" ON monthly_overhead_expenses
    FOR INSERT WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "monthly_overhead_expenses_update" ON monthly_overhead_expenses
    FOR UPDATE USING (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "monthly_overhead_expenses_delete" ON monthly_overhead_expenses
    FOR DELETE USING (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_trip_service_costs_updated_at ON trip_service_costs;
CREATE TRIGGER set_trip_service_costs_updated_at
  BEFORE UPDATE ON trip_service_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_monthly_overhead_expenses_updated_at ON monthly_overhead_expenses;
CREATE TRIGGER set_monthly_overhead_expenses_updated_at
  BEFORE UPDATE ON monthly_overhead_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
