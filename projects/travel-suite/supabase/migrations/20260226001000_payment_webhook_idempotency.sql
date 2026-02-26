-- Ensure invoice payment records are idempotent across webhook retries.

WITH duplicate_refs AS (
  SELECT
    id,
    reference,
    ROW_NUMBER() OVER (PARTITION BY reference ORDER BY created_at, id) AS rn
  FROM public.invoice_payments
  WHERE reference IS NOT NULL
)
UPDATE public.invoice_payments AS ip
SET reference = duplicate_refs.reference || ':dup:' || ip.id::text
FROM duplicate_refs
WHERE ip.id = duplicate_refs.id
  AND duplicate_refs.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_payments_reference_unique
  ON public.invoice_payments(reference)
  WHERE reference IS NOT NULL;
