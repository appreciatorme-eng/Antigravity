-- Additive indexes for new final-sprint hot paths.

CREATE INDEX IF NOT EXISTS idx_payment_links_paid_at_desc
ON public.payment_links(paid_at DESC)
WHERE paid_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_links_pending_created_at
ON public.payment_links(created_at DESC)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_proposals_org_created_at
ON public.proposals(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reputation_reviews_org_response_status
ON public.reputation_reviews(organization_id, response_status);

COMMENT ON INDEX idx_payment_links_paid_at_desc IS
  'Supports paid revenue trend queries and payment recency widgets';

COMMENT ON INDEX idx_payment_links_pending_created_at IS
  'Supports pending payment reminder scans and pending-link dashboards';

COMMENT ON INDEX idx_proposals_org_created_at IS
  'Supports admin proposal trend charts and recent proposal dashboards';

COMMENT ON INDEX idx_reputation_reviews_org_response_status IS
  'Supports reputation inbox filtering for reviews needing a response';
