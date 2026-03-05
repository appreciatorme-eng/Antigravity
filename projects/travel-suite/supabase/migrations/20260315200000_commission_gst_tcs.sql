-- Commission tracking per vendor line item + GST/TCS rates per trip
-- Indian tour operators earn commission from vendors and collect GST/TCS from clients

-- Per-service-cost commission fields (vendor-level tracking)
ALTER TABLE trip_service_costs
  ADD COLUMN IF NOT EXISTS commission_pct    NUMERIC(5,2)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2) DEFAULT 0;

-- Trip-level tax rate settings (applied to total price for client invoice)
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS gst_pct NUMERIC(5,2) DEFAULT 5,
  ADD COLUMN IF NOT EXISTS tcs_pct NUMERIC(5,2) DEFAULT 1;

-- Seed existing cost rows with realistic commission percentages for demo data
UPDATE trip_service_costs
SET
  commission_pct = CASE category
    WHEN 'hotels'    THEN 10
    WHEN 'flights'   THEN 3
    WHEN 'vehicle'   THEN 15
    WHEN 'train'     THEN 5
    WHEN 'bus'       THEN 8
    WHEN 'visa'      THEN 12
    WHEN 'insurance' THEN 20
    ELSE 8
  END,
  commission_amount = ROUND(
    cost_amount * CASE category
      WHEN 'hotels'    THEN 0.10
      WHEN 'flights'   THEN 0.03
      WHEN 'vehicle'   THEN 0.15
      WHEN 'train'     THEN 0.05
      WHEN 'bus'       THEN 0.08
      WHEN 'visa'      THEN 0.12
      WHEN 'insurance' THEN 0.20
      ELSE 0.08
    END,
    2
  )
WHERE commission_amount = 0 AND cost_amount > 0;
