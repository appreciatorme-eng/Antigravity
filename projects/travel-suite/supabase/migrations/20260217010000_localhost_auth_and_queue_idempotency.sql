-- Enforce notification queue idempotency.

-- 1) Normalize duplicate idempotency keys so we can add a unique index safely.
WITH duplicate_rows AS (
    SELECT
        id,
        idempotency_key,
        ROW_NUMBER() OVER (
            PARTITION BY idempotency_key
            ORDER BY created_at DESC, id DESC
        ) AS rn
    FROM public.notification_queue
    WHERE idempotency_key IS NOT NULL
)
UPDATE public.notification_queue nq
SET idempotency_key = duplicate_rows.idempotency_key || ':dedup:' || nq.id::text
FROM duplicate_rows
WHERE nq.id = duplicate_rows.id
  AND duplicate_rows.rn > 1;

-- 3) Enforce one queue row per idempotency key (when key is present).
CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_queue_idempotency_key
    ON public.notification_queue (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
