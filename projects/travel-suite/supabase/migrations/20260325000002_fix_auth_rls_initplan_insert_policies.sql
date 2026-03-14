-- L-01 S29 Part 2: Fix INSERT-only policies missed in first migration
-- INSERT policies only have WITH CHECK (no USING), so they were excluded by the
-- NULL comparison bug in the original filter (NULL NOT LIKE returns NULL, not TRUE).

ALTER POLICY "Users can insert own sessions" ON public.assistant_sessions
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "users can create own calendar events" ON public.calendar_events
  WITH CHECK ((created_by = (select auth.uid())));

ALTER POLICY "Drivers can insert assigned trip locations" ON public.driver_locations
  WITH CHECK ((((select auth.uid()) = driver_id) AND can_publish_driver_location(trip_id, (select auth.uid()))));

ALTER POLICY "Users can create itineraries" ON public.itineraries
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Authenticated users can save to cache" ON public.itinerary_cache
  WITH CHECK ((created_by = (select auth.uid())));

ALTER POLICY "Orgs can create inquiries" ON public.marketplace_inquiries
  WITH CHECK ((sender_org_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "authenticated_create_reviews" ON public.marketplace_reviews
  WITH CHECK (((EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.organization_id = marketplace_reviews.reviewer_org_id)))) AND (reviewer_org_id <> target_org_id)));

ALTER POLICY "monthly_overhead_expenses_insert" ON public.monthly_overhead_expenses
  WITH CHECK ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "Org members can create payment links" ON public.payment_links
  WITH CHECK ((organization_id = ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "Admins can create PDF imports" ON public.pdf_imports
  WITH CHECK ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))));

ALTER POLICY "Owners can create shares" ON public.shared_itineraries
  WITH CHECK ((EXISTS ( SELECT 1 FROM itineraries WHERE ((itineraries.id = shared_itineraries.itinerary_id) AND (itineraries.user_id = (select auth.uid()))))));

ALTER POLICY "Users can insert support tickets for their org" ON public.support_tickets
  WITH CHECK ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "Users can insert template_usage for their organization" ON public.template_usage
  WITH CHECK ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "Users can insert template_views for their organization" ON public.template_views
  WITH CHECK ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "trip_accommodations_insert" ON public.trip_accommodations
  WITH CHECK ((trip_id IN ( SELECT trips.id FROM trips WHERE (trips.organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))))));

ALTER POLICY "trip_service_costs_insert" ON public.trip_service_costs
  WITH CHECK ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "Clients can create trips" ON public.trips
  WITH CHECK (((select auth.uid()) = client_id));
