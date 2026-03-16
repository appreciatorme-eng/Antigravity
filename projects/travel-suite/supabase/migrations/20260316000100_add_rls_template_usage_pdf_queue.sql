-- Add RLS to tables that were missing it
-- template_usage_attribution: service-role only (internal tracking)
ALTER TABLE public.template_usage_attribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only - template_usage_attribution"
  ON public.template_usage_attribution
  USING ((select auth.role()) = 'service_role');

-- pdf_extraction_queue: service-role only (background processing)
ALTER TABLE public.pdf_extraction_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only - pdf_extraction_queue"
  ON public.pdf_extraction_queue
  USING ((select auth.role()) = 'service_role');
