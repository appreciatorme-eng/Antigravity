-- Avoid full scans for reputation batch sentiment analysis jobs.
CREATE INDEX IF NOT EXISTS idx_rep_reviews_pending_sentiment
ON reputation_reviews (created_at ASC, organization_id)
WHERE sentiment_score IS NULL AND comment IS NOT NULL;

COMMENT ON INDEX idx_rep_reviews_pending_sentiment IS
  'Speeds up batch sentiment analysis by indexing unanalyzed reviews with comments ordered by created_at';
