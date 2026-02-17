-- Fix pickup reminder upserts: ON CONFLICT(idempotency_key) requires a non-partial unique index.

-- Preserve only one canonical row per key by rewriting duplicate keys.
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
SET idempotency_key = duplicate_rows.idempotency_key || ':dedup2:' || nq.id::text
FROM duplicate_rows
WHERE nq.id = duplicate_rows.id
  AND duplicate_rows.rn > 1;

-- Replace partial unique index with full unique index so ON CONFLICT can infer it.
DROP INDEX IF EXISTS public.uq_notification_queue_idempotency_key;
DROP INDEX IF EXISTS public.idx_notification_queue_idempotency;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_queue_idempotency_key
    ON public.notification_queue (idempotency_key);
