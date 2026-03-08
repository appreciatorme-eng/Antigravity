ALTER TABLE payment_links
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

