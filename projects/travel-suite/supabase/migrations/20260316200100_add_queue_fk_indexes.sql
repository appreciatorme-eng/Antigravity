-- M-11: Add missing FK indexes on queue tables for cron join performance
--
-- notification_queue.notification_id — does not exist; skipped.
-- notification_dead_letters.queue_id — index already created in 20260212123000; included
--   with IF NOT EXISTS guard for idempotency.
-- pdf_extraction_queue.import_id — actual column is pdf_import_id; using correct name.

CREATE INDEX IF NOT EXISTS idx_notification_dead_letters_queue_id
  ON public.notification_dead_letters(queue_id);

CREATE INDEX IF NOT EXISTS idx_pdf_extraction_queue_import_id
  ON public.pdf_extraction_queue(pdf_import_id);
