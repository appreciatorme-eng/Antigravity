ALTER TABLE assistant_trip_requests
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS form_token TEXT;

UPDATE assistant_trip_requests
SET form_token = encode(gen_random_bytes(16), 'hex')
WHERE form_token IS NULL;

ALTER TABLE assistant_trip_requests
ALTER COLUMN form_token SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'assistant_trip_requests_form_token_key'
    ) THEN
        ALTER TABLE assistant_trip_requests
        ADD CONSTRAINT assistant_trip_requests_form_token_key UNIQUE (form_token);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assistant_trip_requests_form_token
ON assistant_trip_requests(form_token);
