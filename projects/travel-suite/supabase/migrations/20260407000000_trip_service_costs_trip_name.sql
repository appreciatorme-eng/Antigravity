-- Add trip_name to trip_service_costs for ad-hoc / standalone expenses
-- where no existing trip is linked via trip_id but the user still wants
-- to label the expense with a descriptive name (e.g. "Thailand").
ALTER TABLE trip_service_costs
  ADD COLUMN IF NOT EXISTS trip_name TEXT;
