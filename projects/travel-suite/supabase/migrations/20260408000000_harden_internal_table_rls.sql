-- Harden internal operational tables that were created without RLS.
-- These tables should never be directly exposed to browser clients.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'template_usage_attribution'
  ) THEN
    EXECUTE 'ALTER TABLE public.template_usage_attribution ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.template_usage_attribution FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Service role only - template_usage_attribution" ON public.template_usage_attribution';
    EXECUTE 'DROP POLICY IF EXISTS "Service role only" ON public.template_usage_attribution';
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access" ON public.template_usage_attribution';
    EXECUTE $sql$
      CREATE POLICY "Service role full access"
        ON public.template_usage_attribution
        FOR ALL
        USING ((select auth.role()) = 'service_role'::text)
        WITH CHECK ((select auth.role()) = 'service_role'::text)
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'pdf_extraction_queue'
  ) THEN
    EXECUTE 'ALTER TABLE public.pdf_extraction_queue ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.pdf_extraction_queue FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Service role only - pdf_extraction_queue" ON public.pdf_extraction_queue';
    EXECUTE 'DROP POLICY IF EXISTS "Service role only" ON public.pdf_extraction_queue';
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access" ON public.pdf_extraction_queue';
    EXECUTE $sql$
      CREATE POLICY "Service role full access"
        ON public.pdf_extraction_queue
        FOR ALL
        USING ((select auth.role()) = 'service_role'::text)
        WITH CHECK ((select auth.role()) = 'service_role'::text)
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'whatsapp_webhook_events'
  ) THEN
    EXECUTE 'ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.whatsapp_webhook_events FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Service role only" ON public.whatsapp_webhook_events';
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access" ON public.whatsapp_webhook_events';
    EXECUTE $sql$
      CREATE POLICY "Service role full access"
        ON public.whatsapp_webhook_events
        FOR ALL
        USING ((select auth.role()) = 'service_role'::text)
        WITH CHECK ((select auth.role()) = 'service_role'::text)
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'notification_dead_letters'
  ) THEN
    EXECUTE 'ALTER TABLE public.notification_dead_letters ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.notification_dead_letters FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Service role only" ON public.notification_dead_letters';
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access" ON public.notification_dead_letters';
    EXECUTE $sql$
      CREATE POLICY "Service role full access"
        ON public.notification_dead_letters
        FOR ALL
        USING ((select auth.role()) = 'service_role'::text)
        WITH CHECK ((select auth.role()) = 'service_role'::text)
    $sql$;
  END IF;
END $$;
