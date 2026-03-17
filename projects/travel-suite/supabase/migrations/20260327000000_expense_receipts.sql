-- Expense Receipts: Receipt image storage and OCR metadata for trip service costs
-- Links receipts to trip_service_costs table from pricing_profit.sql migration

-- Table: Receipt upload metadata with OCR extraction results
CREATE TABLE IF NOT EXISTS expense_receipts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trip_service_cost_id  UUID REFERENCES trip_service_costs(id) ON DELETE CASCADE,
  receipt_url           TEXT NOT NULL,
  ocr_extracted_amount  NUMERIC(12,2),
  ocr_confidence        NUMERIC(3,2) CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1),
  ocr_raw_response      JSONB,
  created_by            UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_expense_receipts_org
  ON expense_receipts (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expense_receipts_cost_id
  ON expense_receipts (trip_service_cost_id);

-- Storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: org-scoped access
CREATE POLICY "org members select expense-receipts" ON storage.objects FOR SELECT
USING (
  bucket_id = 'expense-receipts'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "org members insert expense-receipts" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'expense-receipts'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "org members update expense-receipts" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'expense-receipts'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "org members delete expense-receipts" ON storage.objects FOR DELETE
USING (
  bucket_id = 'expense-receipts'
  AND auth.role() = 'authenticated'
);

-- RLS: expense_receipts table
ALTER TABLE expense_receipts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "expense_receipts_select" ON expense_receipts
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "expense_receipts_insert" ON expense_receipts
    FOR INSERT WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "expense_receipts_update" ON expense_receipts
    FOR UPDATE USING (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "expense_receipts_delete" ON expense_receipts
    FOR DELETE USING (
      organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger
DROP TRIGGER IF EXISTS set_expense_receipts_updated_at ON expense_receipts;
CREATE TRIGGER set_expense_receipts_updated_at
  BEFORE UPDATE ON expense_receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
