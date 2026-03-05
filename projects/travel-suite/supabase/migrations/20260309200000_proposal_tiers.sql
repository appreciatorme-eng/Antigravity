-- Proposal packaging tiers: Core / Plus / Signature
-- Adds package_tier (active selection) and tier_pricing (operator-defined prices)
-- to the proposals table. Both are nullable — existing proposals are unaffected.

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS package_tier TEXT
    CHECK (package_tier IS NULL OR package_tier IN ('core', 'plus', 'signature')),
  ADD COLUMN IF NOT EXISTS tier_pricing JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.proposals.package_tier IS
  'Which tier the client selected: core, plus, or signature.';

COMMENT ON COLUMN public.proposals.tier_pricing IS
  'Operator-defined prices per tier, e.g. {"core":45000,"plus":65000,"signature":89000}.';
