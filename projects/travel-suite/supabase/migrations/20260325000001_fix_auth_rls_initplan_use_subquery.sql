-- L-01 S29: Fix auth_rls_initplan — replace bare auth.uid() with (select auth.uid())
-- PostgreSQL evaluates bare auth.uid() once per row; the subquery form forces a single
-- evaluation per query plan, eliminating the per-row overhead across 92 policy expressions.
-- See: https://supabase.com/docs/guides/database/database-advisors#auth_rls_initplan

-- assistant_audit_log
ALTER POLICY "Users can view own org audit logs" ON public.assistant_audit_log
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- assistant_conversations
ALTER POLICY "Users can read own conversations" ON public.assistant_conversations
  USING ((user_id = (select auth.uid())));

-- assistant_preferences
ALTER POLICY "Users can manage their own preferences" ON public.assistant_preferences
  USING ((user_id = (select auth.uid())));

-- assistant_sessions
ALTER POLICY "Users can delete own sessions" ON public.assistant_sessions
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users can update own sessions" ON public.assistant_sessions
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users can view own sessions" ON public.assistant_sessions
  USING ((user_id = (select auth.uid())));

-- calendar_events
ALTER POLICY "org members can view calendar events" ON public.calendar_events
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "users can delete own calendar events" ON public.calendar_events
  USING ((created_by = (select auth.uid())));

ALTER POLICY "users can update own calendar events" ON public.calendar_events
  USING ((created_by = (select auth.uid())));

-- client_add_ons
ALTER POLICY "Clients can view their add-on purchases" ON public.client_add_ons
  USING ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = (select auth.uid())))));

-- client_referral_events
ALTER POLICY "org_admin_access_referral_events" ON public.client_referral_events
  USING ((organization_id = ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- client_referral_incentives
ALTER POLICY "org_admin_access_referral_incentives" ON public.client_referral_incentives
  USING ((organization_id = ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- clients
ALTER POLICY "Clients can view their own record" ON public.clients
  USING ((user_id = (select auth.uid())));

-- concierge_requests
ALTER POLICY "Clients can manage their concierge requests" ON public.concierge_requests
  USING ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = (select auth.uid())))));

-- conversion_events
ALTER POLICY "Admins manage conversion events" ON public.conversion_events
  USING ((EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.organization_id = conversion_events.organization_id) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'manager'::text]))))));

-- dashboard_task_dismissals
ALTER POLICY "Users can manage own dismissals" ON public.dashboard_task_dismissals
  USING (((select auth.uid()) = user_id));

-- driver_accounts
ALTER POLICY "Admins can manage driver accounts" ON public.driver_accounts
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))));

ALTER POLICY "Drivers can view own mapping" ON public.driver_accounts
  USING ((profile_id = (select auth.uid())));

-- driver_locations
ALTER POLICY "Clients can view driver location for their trips" ON public.driver_locations
  USING ((EXISTS ( SELECT 1 FROM trips WHERE ((trips.id = driver_locations.trip_id) AND (trips.client_id = (select auth.uid())) AND (trips.status = 'in_progress'::text)))));

ALTER POLICY "Drivers can view their own locations" ON public.driver_locations
  USING (((select auth.uid()) = driver_id));

-- external_drivers
ALTER POLICY "Admins can manage external drivers" ON public.external_drivers
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text) AND (profiles.organization_id = external_drivers.organization_id)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text) AND (profiles.organization_id = external_drivers.organization_id)))));

ALTER POLICY "Clients can view assigned drivers" ON public.external_drivers
  USING ((EXISTS ( SELECT 1 FROM (trip_driver_assignments tda JOIN trips t ON ((t.id = tda.trip_id))) WHERE ((tda.external_driver_id = external_drivers.id) AND (t.client_id = (select auth.uid()))))));

ALTER POLICY "Clients can view assigned external drivers" ON public.external_drivers
  USING ((EXISTS ( SELECT 1 FROM (trip_driver_assignments a JOIN trips t ON ((t.id = a.trip_id))) WHERE ((a.external_driver_id = external_drivers.id) AND (t.client_id = (select auth.uid()))))));

ALTER POLICY "Clients can view their driver details" ON public.external_drivers
  USING ((id IN ( SELECT tda.external_driver_id FROM (trip_driver_assignments tda JOIN trips t ON ((tda.trip_id = t.id))) WHERE (t.client_id = (select auth.uid())))));

-- geocoding_cache
ALTER POLICY "Authenticated users can write to geocoding cache" ON public.geocoding_cache
  USING (((select auth.uid()) IS NOT NULL));

-- geocoding_usage
ALTER POLICY "Geocoding usage stats are readable by authenticated users" ON public.geocoding_usage
  USING (((select auth.uid()) IS NOT NULL));

-- itineraries
ALTER POLICY "Admins can view org itineraries" ON public.itineraries
  USING ((EXISTS ( SELECT 1 FROM (profiles admin JOIN profiles owner ON ((owner.id = itineraries.user_id))) WHERE ((admin.id = (select auth.uid())) AND (admin.role = 'admin'::text) AND (admin.organization_id = owner.organization_id)))));

ALTER POLICY "Clients can view trip itineraries" ON public.itineraries
  USING ((EXISTS ( SELECT 1 FROM trips t WHERE ((t.itinerary_id = itineraries.id) AND (t.client_id = (select auth.uid()))))));

ALTER POLICY "Drivers can view assigned itineraries" ON public.itineraries
  USING (((EXISTS ( SELECT 1 FROM trips t WHERE ((t.itinerary_id = itineraries.id) AND (t.driver_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1 FROM ((trips t JOIN trip_driver_assignments a ON ((a.trip_id = t.id))) JOIN driver_accounts da ON (((da.external_driver_id = a.external_driver_id) AND (da.is_active = true)))) WHERE ((t.itinerary_id = itineraries.id) AND (da.profile_id = (select auth.uid())))))));

ALTER POLICY "Users can delete their own itineraries" ON public.itineraries
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can update their own itineraries" ON public.itineraries
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view their own itineraries" ON public.itineraries
  USING (((select auth.uid()) = user_id));

-- itinerary_cache_analytics
ALTER POLICY "Users can read their own analytics" ON public.itinerary_cache_analytics
  USING (((user_id = (select auth.uid())) OR (user_id IS NULL)));

-- lead_events
ALTER POLICY "Admins manage lead events" ON public.lead_events
  USING ((EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (select auth.uid())) AND (p.organization_id = lead_events.organization_id) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'manager'::text]))))));

-- marketplace_inquiries
ALTER POLICY "Orgs can see their own inquiries" ON public.marketplace_inquiries
  USING (((sender_org_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))) OR (receiver_org_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid()))))));

-- marketplace_listing_subscriptions
ALTER POLICY "org_members_manage_marketplace_listing_subscriptions" ON public.marketplace_listing_subscriptions
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.organization_id = marketplace_listing_subscriptions.organization_id)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.organization_id = marketplace_listing_subscriptions.organization_id)))));

ALTER POLICY "org_members_view_marketplace_listing_subscriptions" ON public.marketplace_listing_subscriptions
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.organization_id = marketplace_listing_subscriptions.organization_id)))));

-- marketplace_profiles
ALTER POLICY "org_owners_manage_own_profile" ON public.marketplace_profiles
  USING ((EXISTS ( SELECT 1 FROM organizations o WHERE ((o.id = marketplace_profiles.organization_id) AND (o.owner_id = (select auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM organizations o WHERE ((o.id = marketplace_profiles.organization_id) AND (o.owner_id = (select auth.uid()))))));

-- monthly_overhead_expenses
ALTER POLICY "monthly_overhead_expenses_delete" ON public.monthly_overhead_expenses
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "monthly_overhead_expenses_select" ON public.monthly_overhead_expenses
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "monthly_overhead_expenses_update" ON public.monthly_overhead_expenses
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- notification_delivery_status
ALTER POLICY "Admins can manage notification delivery status" ON public.notification_delivery_status
  USING ((EXISTS ( SELECT 1 FROM profiles admin WHERE ((admin.id = (select auth.uid())) AND (admin.role = 'admin'::text) AND (admin.organization_id = COALESCE(notification_delivery_status.organization_id, ( SELECT t.organization_id FROM trips t WHERE (t.id = notification_delivery_status.trip_id)), ( SELECT p.organization_id FROM profiles p WHERE (p.id = notification_delivery_status.user_id))))))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles admin WHERE ((admin.id = (select auth.uid())) AND (admin.role = 'admin'::text) AND (admin.organization_id = COALESCE(notification_delivery_status.organization_id, ( SELECT t.organization_id FROM trips t WHERE (t.id = notification_delivery_status.trip_id)), ( SELECT p.organization_id FROM profiles p WHERE (p.id = notification_delivery_status.user_id))))))));

ALTER POLICY "Admins can view notification delivery status" ON public.notification_delivery_status
  USING ((EXISTS ( SELECT 1 FROM profiles admin WHERE ((admin.id = (select auth.uid())) AND (admin.role = 'admin'::text) AND (admin.organization_id = COALESCE(notification_delivery_status.organization_id, ( SELECT t.organization_id FROM trips t WHERE (t.id = notification_delivery_status.trip_id)), ( SELECT p.organization_id FROM profiles p WHERE (p.id = notification_delivery_status.user_id))))))));

ALTER POLICY "Users can view own delivery status" ON public.notification_delivery_status
  USING (((select auth.uid()) = user_id));

-- notification_logs
ALTER POLICY "Admins can view all notification logs" ON public.notification_logs
  USING ((EXISTS ( SELECT 1 FROM profiles admin WHERE ((admin.id = (select auth.uid())) AND (admin.role = 'admin'::text) AND (admin.organization_id = COALESCE(( SELECT t.organization_id FROM trips t WHERE (t.id = notification_logs.trip_id)), ( SELECT p.organization_id FROM profiles p WHERE (p.id = notification_logs.recipient_id))))))));

ALTER POLICY "Users can view their own notifications" ON public.notification_logs
  USING (((select auth.uid()) = recipient_id));

-- notification_queue
ALTER POLICY "Admins can manage notification queue" ON public.notification_queue
  USING ((EXISTS ( SELECT 1 FROM profiles admin WHERE ((admin.id = (select auth.uid())) AND (admin.role = 'admin'::text) AND (admin.organization_id = COALESCE(( SELECT t.organization_id FROM trips t WHERE (t.id = notification_queue.trip_id)), ( SELECT p.organization_id FROM profiles p WHERE (p.id = notification_queue.user_id))))))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles admin WHERE ((admin.id = (select auth.uid())) AND (admin.role = 'admin'::text) AND (admin.organization_id = COALESCE(( SELECT t.organization_id FROM trips t WHERE (t.id = notification_queue.trip_id)), ( SELECT p.organization_id FROM profiles p WHERE (p.id = notification_queue.user_id))))))));

ALTER POLICY "Admins can view notification queue" ON public.notification_queue
  USING ((EXISTS ( SELECT 1 FROM profiles admin WHERE ((admin.id = (select auth.uid())) AND (admin.role = 'admin'::text) AND (admin.organization_id = COALESCE(( SELECT t.organization_id FROM trips t WHERE (t.id = notification_queue.trip_id)), ( SELECT p.organization_id FROM profiles p WHERE (p.id = notification_queue.user_id))))))));

-- operator_scorecards
ALTER POLICY "org_admins_manage_operator_scorecards" ON public.operator_scorecards
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.organization_id = operator_scorecards.organization_id) AND (COALESCE(profiles.role, ''::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.organization_id = operator_scorecards.organization_id) AND (COALESCE(profiles.role, ''::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));

ALTER POLICY "org_members_view_operator_scorecards" ON public.operator_scorecards
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.organization_id = operator_scorecards.organization_id)))));

-- organization_ai_usage
ALTER POLICY "Admins can view organization ai usage" ON public.organization_ai_usage
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND ((profiles.role = 'super_admin'::text) OR (profiles.organization_id = organization_ai_usage.organization_id))))));

-- organizations
ALTER POLICY "Org owners can view their organization" ON public.organizations
  USING (((select auth.uid()) = owner_id));

-- payment_links
ALTER POLICY "Org members can update payment links" ON public.payment_links
  USING ((organization_id = ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))))
  WITH CHECK ((organization_id = ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "Org members can view payment links" ON public.payment_links
  USING ((organization_id = ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- pdf_imports
ALTER POLICY "Admins can update own organization PDF imports" ON public.pdf_imports
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))));

ALTER POLICY "Users can view own organization PDF imports" ON public.pdf_imports
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- platform_announcements
ALTER POLICY "super_admin_all_platform_announcements" ON public.platform_announcements
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'super_admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'super_admin'::text)))));

-- platform_audit_log
ALTER POLICY "super_admin_all_platform_audit_log" ON public.platform_audit_log
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'super_admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'super_admin'::text)))));

-- platform_settings
ALTER POLICY "super_admin_all_platform_settings" ON public.platform_settings
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'super_admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'super_admin'::text)))));

-- profiles
ALTER POLICY "Profiles viewable within same organization" ON public.profiles
  USING ((((select auth.uid()) = id) OR (organization_id = get_my_org_id())));

ALTER POLICY "Users can update their own profile" ON public.profiles
  USING (((select auth.uid()) = id));

ALTER POLICY "Users can view profiles in their organization" ON public.profiles
  USING (((organization_id = ( SELECT p.organization_id FROM profiles p WHERE (p.id = (select auth.uid())))) OR (id = (select auth.uid()))));

ALTER POLICY "Users can view their own profile" ON public.profiles
  USING (((select auth.uid()) = id));

-- proposal_payment_milestones
ALTER POLICY "org_admin_access_payment_milestones" ON public.proposal_payment_milestones
  USING ((organization_id = ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- proposal_payment_plans
ALTER POLICY "org_admin_access_payment_plans" ON public.proposal_payment_plans
  USING ((organization_id = ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- push_tokens
ALTER POLICY "Admins can manage push tokens" ON public.push_tokens
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))));

ALTER POLICY "Users can manage their own push tokens" ON public.push_tokens
  USING (((select auth.uid()) = user_id));

-- referrals
ALTER POLICY "Users can view their own referrals" ON public.referrals
  USING ((referrer_profile_id = (select auth.uid())));

-- shared_itineraries
ALTER POLICY "Owners can delete own shares" ON public.shared_itineraries
  USING ((EXISTS ( SELECT 1 FROM itineraries WHERE ((itineraries.id = shared_itineraries.itinerary_id) AND (itineraries.user_id = (select auth.uid()))))));

ALTER POLICY "Owners can view own shares" ON public.shared_itineraries
  USING ((EXISTS ( SELECT 1 FROM itineraries WHERE ((itineraries.id = shared_itineraries.itinerary_id) AND (itineraries.user_id = (select auth.uid()))))));

-- support_tickets
ALTER POLICY "Users can view support tickets for their org" ON public.support_tickets
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- template_usage
ALTER POLICY "Users can view template_usage for their organization" ON public.template_usage
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- template_views
ALTER POLICY "Users can view template_views for their organization" ON public.template_views
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- travel_documents
ALTER POLICY "Clients can view their travel documents" ON public.travel_documents
  USING ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = (select auth.uid())))));

-- trip_accommodations
ALTER POLICY "trip_accommodations_delete" ON public.trip_accommodations
  USING ((trip_id IN ( SELECT trips.id FROM trips WHERE (trips.organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))))));

ALTER POLICY "trip_accommodations_select" ON public.trip_accommodations
  USING ((trip_id IN ( SELECT trips.id FROM trips WHERE (trips.organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))))));

ALTER POLICY "trip_accommodations_update" ON public.trip_accommodations
  USING ((trip_id IN ( SELECT trips.id FROM trips WHERE (trips.organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))))));

-- trip_driver_assignments
ALTER POLICY "Admins can manage assignments" ON public.trip_driver_assignments
  USING ((EXISTS ( SELECT 1 FROM (trips JOIN profiles client ON ((client.id = trips.client_id))) WHERE ((trips.id = trip_driver_assignments.trip_id) AND (client.organization_id = ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))) AND (( SELECT profiles.role FROM profiles WHERE (profiles.id = (select auth.uid()))) = 'admin'::text)))));

ALTER POLICY "Clients can view their trip assignments" ON public.trip_driver_assignments
  USING ((EXISTS ( SELECT 1 FROM trips WHERE ((trips.id = trip_driver_assignments.trip_id) AND (trips.client_id = (select auth.uid()))))));

ALTER POLICY "Drivers can view their trip assignments" ON public.trip_driver_assignments
  USING (((EXISTS ( SELECT 1 FROM trips t WHERE ((t.id = trip_driver_assignments.trip_id) AND (t.driver_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1 FROM driver_accounts da WHERE ((da.profile_id = (select auth.uid())) AND (da.is_active = true) AND (da.external_driver_id = trip_driver_assignments.external_driver_id))))));

-- trip_location_share_access_logs
ALTER POLICY "Admins can view share access logs" ON public.trip_location_share_access_logs
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))));

-- trip_location_shares
ALTER POLICY "Admins can manage trip location shares" ON public.trip_location_shares
  USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text)))));

ALTER POLICY "Clients can view own trip location shares" ON public.trip_location_shares
  USING ((EXISTS ( SELECT 1 FROM trips WHERE ((trips.id = trip_location_shares.trip_id) AND (trips.client_id = (select auth.uid()))))));

-- trip_service_costs
ALTER POLICY "trip_service_costs_delete" ON public.trip_service_costs
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "trip_service_costs_select" ON public.trip_service_costs
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

ALTER POLICY "trip_service_costs_update" ON public.trip_service_costs
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- trips
ALTER POLICY "Clients can update their own trips" ON public.trips
  USING (((select auth.uid()) = client_id));

ALTER POLICY "Clients can view their trips" ON public.trips
  USING (((select auth.uid()) = client_id));

ALTER POLICY "Drivers can view assigned trips" ON public.trips
  USING (((select auth.uid()) = driver_id));

ALTER POLICY "Drivers can view trips via external driver assignments" ON public.trips
  USING (driver_has_external_trip_assignment(id, (select auth.uid())));

-- whatsapp_connections
ALTER POLICY "org_members_read_own_connection" ON public.whatsapp_connections
  USING ((organization_id IN ( SELECT profiles.organization_id FROM profiles WHERE (profiles.id = (select auth.uid())))));

-- workflow_stage_events
ALTER POLICY "Users can view own workflow stage events" ON public.workflow_stage_events
  USING (((select auth.uid()) = profile_id));
