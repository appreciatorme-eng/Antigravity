-- S37 Remediation M-06: Fix auth_rls_initplan on 7 tables
-- Wraps auth.role() with (select auth.role()) to prevent per-row re-evaluation
-- of the auth context, which causes significant performance degradation at scale.
-- See: https://supabase.com/docs/guides/database/database-advisors#auth_rls_initplan

-- blog_posts — "Authenticated users can manage posts"
ALTER POLICY "Authenticated users can manage posts" ON public.blog_posts
  USING ((select auth.role()) = 'authenticated'::text);

-- notification_dead_letters — "Service role full access"
ALTER POLICY "Service role full access" ON public.notification_dead_letters
  USING ((select auth.role()) = 'service_role'::text);

-- pdf_extraction_queue — "Service role full access"
ALTER POLICY "Service role full access" ON public.pdf_extraction_queue
  USING ((select auth.role()) = 'service_role'::text);

-- shared_itinerary_cache — "service role manages shared itinerary cache"
ALTER POLICY "service role manages shared itinerary cache" ON public.shared_itinerary_cache
  USING ((select auth.role()) = 'service_role'::text)
  WITH CHECK ((select auth.role()) = 'service_role'::text);

-- shared_itinerary_cache_events — "service role manages shared itinerary cache events"
ALTER POLICY "service role manages shared itinerary cache events" ON public.shared_itinerary_cache_events
  USING ((select auth.role()) = 'service_role'::text)
  WITH CHECK ((select auth.role()) = 'service_role'::text);

-- template_usage_attribution — "Service role full access"
ALTER POLICY "Service role full access" ON public.template_usage_attribution
  USING ((select auth.role()) = 'service_role'::text);

-- whatsapp_webhook_events — "Service role full access"
ALTER POLICY "Service role full access" ON public.whatsapp_webhook_events
  USING ((select auth.role()) = 'service_role'::text);
