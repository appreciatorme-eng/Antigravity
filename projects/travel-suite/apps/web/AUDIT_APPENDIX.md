# Audit Appendix

## TypeScript Suppressions

```text
src/components/map/ItineraryMap.tsx:21:    // @ts-expect-error _getIconUrl exists at runtime
```

## Explicit `any` Suppressions

```text
src/lib/social/poster-renderer-types.ts:5:// eslint-disable-next-line @typescript-eslint/no-explicit-any
src/lib/api-dispatch.ts:13:// eslint-disable-next-line @typescript-eslint/no-explicit-any
src/lib/api-dispatch.ts:14:type HandlerModule = Record<string, any>;
src/lib/payments/subscription-service.ts:219:    // eslint-disable-next-line @typescript-eslint/no-explicit-any
src/lib/payments/subscription-service.ts:220:    const updates: any = {
src/lib/payments/payment-logger.ts:19:  metadata: any; // eslint-disable-line @typescript-eslint/no-explicit-any
src/app/proposals/create/page.tsx:34:function formatFeatureLimitError(payload: any, fallback: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
src/components/CreateTripModal.tsx:44:function formatFeatureLimitError(payload: any, fallback: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
src/components/god-mode/TrendChart.tsx:56:        // eslint-disable-next-line @typescript-eslint/no-explicit-any
src/components/god-mode/TrendChart.tsx:57:        onClick: onClickBar ? (payload: any) => {
src/app/api/_handlers/superadmin/monitoring/health/route.ts:19:// eslint-disable-next-line @typescript-eslint/no-explicit-any
src/app/api/_handlers/superadmin/monitoring/health/route.ts:20:async function checkDatabase(client: any): Promise<{ status: "healthy" | "degraded" | "down"; latency_ms: number }> {
src/app/api/_handlers/social/posts/route.ts:87:        // eslint-disable-next-line @typescript-eslint/no-explicit-any
src/app/api/_handlers/social/posts/route.ts:88:        const insertPayload: any = {
src/app/api/_handlers/integrations/places/route.ts:24:  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reputation connection tables are not fully represented in generated types yet.
src/app/api/_handlers/integrations/places/route.ts:25:  supabaseAdmin: any,
src/app/api/_handlers/integrations/places/route.ts:41:  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- organization settings and reputation tables are not fully typed yet.
src/app/api/_handlers/integrations/places/route.ts:42:  supabaseAdmin: any,
```

## TODO / FIXME / HACK

```text
src/lib/payments/payment-receipt-config.ts:1:// TODO: Move to organization settings when multi-rate GST is needed.
```

## Circular Dependencies

```text
src/lib/social/poster-premium-blocks.ts -> src/lib/social/poster-premium-layouts-a.ts
src/lib/social/poster-premium-blocks.ts -> src/lib/social/poster-premium-layouts-b.ts
```

## Files Over 600 LOC

| File | Lines |
|---|---:|
| `src/components/pdf/templates/ItineraryTemplatePages.tsx` | 916 |
| `src/app/clients/page.tsx` | 912 |
| `src/app/admin/tour-templates/create/page.tsx` | 907 |
| `src/app/inbox/page.tsx` | 899 |
| `src/app/admin/cost/page.tsx` | 888 |
| `src/components/dashboard/ActionQueue.tsx` | 884 |
| `src/app/dashboard/tasks/page.tsx` | 883 |
| `src/app/add-ons/page.tsx` | 877 |
| `src/app/social/_components/TemplateGallery.tsx` | 864 |
| `src/app/social/_components/BackgroundPicker.tsx` | 845 |
| `src/app/onboarding/page.tsx` | 824 |
| `src/features/admin/billing/BillingView.tsx` | 819 |
| `src/app/settings/page.tsx` | 815 |
| `src/app/proposals/create/page.tsx` | 806 |
| `src/app/admin/page.tsx` | 804 |
| `src/app/api/_handlers/admin/cost/overview/route.ts` | 799 |
| `src/app/clients/[id]/page.tsx` | 799 |
| `src/app/drivers/page.tsx` | 799 |
| `src/components/whatsapp/UnifiedInbox.tsx` | 799 |
| `src/features/admin/revenue/AdminRevenueView.tsx` | 795 |
| `src/app/admin/insights/page.tsx` | 788 |
| `src/components/CreateTripModal.tsx` | 787 |
| `src/lib/whatsapp/india-templates.ts` | 787 |
| `src/app/api/_handlers/itinerary/generate/route.ts` | 752 |
| `src/app/admin/settings/page.tsx` | 749 |
| `src/components/leads/LeadToBookingFlow.tsx` | 748 |
| `src/app/proposals/[id]/page.tsx` | 742 |
| `src/app/api/_handlers/admin/clients/route.ts` | 738 |
| `src/app/p/[token]/page.tsx` | 737 |
| `src/app/admin/notifications/page.tsx` | 736 |
| `src/components/glass/QuickQuoteModal.tsx` | 727 |
| `src/components/whatsapp/AutomationRules.tsx` | 722 |
| `src/app/api/_handlers/assistant/chat/stream/route.ts` | 694 |
| `src/app/admin/trips/[id]/page.tsx` | 693 |
| `src/components/whatsapp/ContextActionModal.tsx` | 692 |
| `src/lib/assistant/orchestrator.ts` | 683 |
| `src/components/assistant/TourAssistantPresentation.tsx` | 672 |
| `src/app/admin/kanban/page.tsx` | 670 |
| `src/app/planner/page.tsx` | 665 |
| `src/app/admin/invoices/page.tsx` | 654 |
| `src/app/marketplace/[id]/page.tsx` | 651 |
| `src/components/planner/ApprovalManager.tsx` | 651 |
| `src/app/reputation/_components/ReputationDashboard.tsx` | 639 |
| `src/features/admin/analytics/AdminAnalyticsView.tsx` | 635 |
| `src/components/trips/GroupManager.tsx` | 632 |
| `src/components/trips/TripTemplates.tsx` | 629 |
| `src/app/admin/settings/marketplace/page.tsx` | 602 |

## Long Functions (>80 lines, top 80)

| File:Line | Function | Lines |
|---|---|---:|
| `src/app/settings/page.tsx:26` | `SettingsPage` | 789 |
| `src/features/admin/billing/BillingView.tsx:46` | `BillingView` | 773 |
| `src/app/admin/cost/page.tsx:116` | `AdminCostOverviewPage` | 772 |
| `src/app/clients/[id]/page.tsx:36` | `ClientProfilePage` | 763 |
| `src/app/social/_components/TemplateGallery.tsx:103` | `TemplateGallery` | 761 |
| `src/app/api/_handlers/admin/cost/overview/route.ts:32` | `GET` | 760 |
| `src/app/admin/insights/page.tsx:29` | `AdminInsightsPage` | 759 |
| `src/app/proposals/create/page.tsx:48` | `CreateProposalPage` | 758 |
| `src/components/whatsapp/UnifiedInbox.tsx:58` | `UnifiedInbox` | 741 |
| `src/app/add-ons/page.tsx:137` | `AddOnsPage` | 740 |
| `src/app/drivers/page.tsx:61` | `DriversPage` | 738 |
| `src/components/CreateTripModal.tsx:64` | `CreateTripModal` | 723 |
| `src/app/admin/settings/page.tsx:38` | `SettingsPage` | 711 |
| `src/app/admin/notifications/page.tsx:30` | `NotificationLogsPage` | 706 |
| `src/app/social/_components/BackgroundPicker.tsx:140` | `BackgroundPicker` | 705 |
| `src/app/clients/page.tsx:209` | `ClientsPage` | 703 |
| `src/app/p/[token]/page.tsx:38` | `PublicProposalPage` | 699 |
| `src/app/onboarding/page.tsx:119` | `OnboardingPageContent` | 686 |
| `src/app/admin/page.tsx:120` | `AdminDashboard` | 684 |
| `src/features/admin/revenue/AdminRevenueView.tsx:112` | `AdminRevenueView` | 683 |
| `src/app/proposals/[id]/page.tsx:74` | `AdminProposalViewPage` | 668 |
| `src/app/admin/trips/[id]/page.tsx:38` | `TripDetailPage` | 655 |
| `src/app/admin/invoices/page.tsx:23` | `AdminInvoicesPage` | 631 |
| `src/components/assistant/TourAssistantPresentation.tsx:60` | `TourAssistantPresentation` | 612 |
| `src/app/planner/page.tsx:61` | `PlannerPage` | 604 |
| `src/components/planner/ApprovalManager.tsx:51` | `ApprovalManager` | 600 |
| `src/app/admin/kanban/page.tsx:85` | `AdminKanbanPage` | 585 |
| `src/components/trips/GroupManager.tsx:46` | `GroupManager` | 584 |
| `src/app/marketplace/[id]/page.tsx:89` | `OperatorDetailPage` | 562 |
| `src/features/admin/analytics/AdminAnalyticsView.tsx:89` | `AdminAnalyticsView` | 546 |
| `src/app/inbox/page.tsx:56` | `BroadcastTab` | 528 |
| `src/app/api/_handlers/itinerary/generate/route.ts:226` | `POST` | 526 |
| `src/app/admin/settings/marketplace/page.tsx:78` | `MarketplaceSettingsPage` | 524 |
| `src/app/social/_components/TemplateEditor.tsx:45` | `TemplateEditor` | 513 |
| `src/components/glass/QuickQuoteModal.tsx:224` | `QuickQuoteModal` | 503 |
| `src/app/admin/tour-templates/create/page.tsx:53` | `CreateTemplatePage` | 499 |
| `src/app/social/_components/SocialStudioClient.tsx:45` | `SocialStudioClient` | 492 |
| `src/app/reputation/_components/CampaignBuilder.tsx:51` | `CampaignBuilder` | 486 |
| `src/app/api/_handlers/proposals/public/[token]/route.ts:78` | `POST` | 483 |
| `src/components/whatsapp/WhatsAppConnectModal.tsx:34` | `WhatsAppConnectModal` | 463 |
| `src/components/admin/ProposalAddOnsManager.tsx:63` | `ProposalAddOnsManager` | 462 |
| `src/app/admin/tour-templates/import/page.tsx:18` | `ImportTourPage` | 458 |
| `src/app/billing/BillingPageClient.tsx:124` | `BillingPageClient` | 455 |
| `src/app/admin/tour-templates/[id]/page.tsx:76` | `ViewTemplatePage` | 454 |
| `src/app/social/_components/ContentBar.tsx:96` | `ContentBar` | 451 |
| `src/app/admin/operations/page.tsx:135` | `AdminOperationsPage` | 450 |
| `src/app/proposals/page.tsx:92` | `ProposalsPage` | 440 |
| `src/app/admin/tour-templates/page.tsx:49` | `TourTemplatesPage` | 421 |
| `src/app/admin/tour-templates/[id]/edit/page.tsx:64` | `EditTemplatePage` | 412 |
| `src/app/settings/marketplace/page.tsx:16` | `MarketplaceSettingsPage` | 412 |
| `src/components/assistant/TourAssistantChat.tsx:13` | `TourAssistantChat` | 392 |
| `src/app/admin/trips/page.tsx:69` | `AdminTripsPage` | 384 |
| `src/app/portal/[token]/page.tsx:82` | `PortalPage` | 379 |
| `src/app/marketplace/page.tsx:43` | `MarketplacePage` | 371 |
| `src/app/reputation/_components/ReviewInbox.tsx:229` | `ReviewInbox` | 365 |
| `src/app/social/_components/ReviewsToInsta.tsx:131` | `ReviewsToInsta` | 360 |
| `src/app/admin/gst-report/page.tsx:193` | `GSTReportPage` | 352 |
| `src/app/page.tsx:80` | `DashboardPage` | 350 |
| `src/app/social/_components/PublishKitDrawer.tsx:22` | `PublishKitDrawer` | 347 |
| `src/app/reputation/_components/PlatformConnectionCards.tsx:58` | `PlatformConnectionCards` | 342 |
| `src/components/bookings/FlightSearch.tsx:63` | `FlightSearch` | 338 |
| `src/features/admin/invoices/InvoiceCreateForm.tsx:40` | `InvoiceCreateForm` | 334 |
| `src/components/social/templates/layouts/ThemeDecorations.tsx:36` | `renderTheme` | 329 |
| `src/components/itinerary-templates/ProfessionalView.tsx:7` | `ProfessionalView` | 327 |
| `src/app/api/_handlers/portal/[token]/route.ts:37` | `GET` | 326 |
| `src/app/api/_handlers/admin/operations/command-center/route.ts:212` | `GET` | 325 |
| `src/app/admin/pricing/page.tsx:47` | `PricingPage` | 324 |
| `src/app/reputation/_components/WidgetConfigurator.tsx:50` | `WidgetConfigurator` | 319 |
| `src/components/itinerary-templates/UrbanBriefView.tsx:6` | `UrbanBriefView` | 317 |
| `src/components/proposals/ESignature.tsx:33` | `ESignature` | 315 |
| `src/components/whatsapp/MessageThread.tsx:230` | `MessageThread` | 315 |
| `src/app/planner/ClientFeedbackPanel.tsx:41` | `ClientFeedbackPanel` | 311 |
| `src/app/reputation/_components/BrandVoiceSettings.tsx:215` | `BrandVoiceSettings` | 311 |
| `src/components/itinerary-templates/SafariStoryView.tsx:8` | `SafariStoryView` | 311 |
| `src/app/reputation/nps/[token]/page.tsx:107` | `NPSSurveyPage` | 310 |
| `src/components/client/ProposalAddOnsSelector.tsx:49` | `ProposalAddOnsSelector` | 309 |
| `src/app/admin/settings/SettingsIntegrationsSection.tsx:45` | `SettingsIntegrationsSection` | 307 |
| `src/features/calendar/useCalendarActions.ts:87` | `useCalendarActions` | 305 |
| `src/app/admin/support/page.tsx:71` | `SupportPage` | 304 |
| `src/app/social/_components/BulkExporter.tsx:124` | `BulkExporter` | 302 |

Total functions >80 lines: 623

## Deep Nesting (>4 levels, top 80)

| File:Line | Function | Depth |
|---|---|---:|
| `src/app/api/_handlers/proposals/public/[token]/route.ts:78` | `POST` | 15 |
| `src/app/planner/page.tsx:61` | `PlannerPage` | 15 |
| `src/app/api/_handlers/admin/trips/[id]/route.ts:56` | `GET` | 14 |
| `src/app/api/_handlers/itinerary/generate/route.ts:226` | `POST` | 14 |
| `src/app/api/_handlers/trips/[id]/route.ts:90` | `GET` | 14 |
| `src/app/planner/page.tsx:138` | `fetchImagesForItinerary` | 14 |
| `src/app/social/_components/TripImporter.tsx:86` | `TripImporter` | 14 |
| `src/app/api/_handlers/reputation/sync/route.ts:98` | `POST` | 13 |
| `src/app/planner/page.tsx:157` | `worker` | 13 |
| `src/app/social/_components/TripImporter.tsx:146` | `(anonymous)` | 13 |
| `src/components/assistant/TourAssistantChat.tsx:13` | `TourAssistantChat` | 13 |
| `src/app/auth/page.tsx:14` | `AuthPageContent` | 12 |
| `src/components/assistant/TourAssistantChat.tsx:145` | `sendMessage` | 12 |
| `src/features/admin/billing/useBillingData.ts:67` | `useBillingData` | 12 |
| `src/app/admin/tour-templates/[id]/page.tsx:76` | `ViewTemplatePage` | 11 |
| `src/app/admin/trips/[id]/_components/utils.ts:84` | `optimizeActivitiesForRoute` | 11 |
| `src/app/api/_handlers/assistant/chat/stream/route.ts:363` | `handleStreamingRequest` | 11 |
| `src/app/api/_handlers/bookings/hotels/search/route.ts:44` | `GET` | 11 |
| `src/app/api/_handlers/itineraries/route.ts:6` | `GET` | 11 |
| `src/app/api/_handlers/itinerary/generate/route.ts:173` | `geocodeItineraryActivities` | 11 |
| `src/app/api/_handlers/reputation/campaigns/trigger/route.ts:18` | `POST` | 11 |
| `src/app/auth/page.tsx:31` | `handleAuth` | 11 |
| `src/app/social/_components/ReviewsToInsta.tsx:131` | `ReviewsToInsta` | 11 |
| `src/components/ShareTripModal.tsx:29` | `ShareTripModal` | 11 |
| `src/components/demo/WelcomeModal.tsx:14` | `WelcomeModal` | 11 |
| `src/components/map/ItineraryMap.tsx:85` | `optimizeRouteIndices` | 11 |
| `src/features/admin/billing/useBillingData.ts:83` | `(anonymous)` | 11 |
| `src/lib/admin/operator-scorecard.ts:258` | `computeWhatsAppReplyMinutes` | 11 |
| `src/lib/assistant/alerts.ts:250` | `generateAndQueueAlerts` | 11 |
| `src/lib/image-search.ts:41` | `getWikiImage` | 11 |
| `src/lib/payments/webhook-handlers.ts:129` | `handlePaymentFailed` | 11 |
| `src/lib/social/template-selector.ts:55` | `selectBestTemplate` | 11 |
| `src/app/admin/templates/page.tsx:84` | `TemplatesPage` | 10 |
| `src/app/admin/tour-templates/[id]/edit/page.tsx:64` | `EditTemplatePage` | 10 |
| `src/app/admin/tour-templates/[id]/page.tsx:90` | `(anonymous)` | 10 |
| `src/app/admin/tour-templates/create/page.tsx:53` | `CreateTemplatePage` | 10 |
| `src/app/admin/trips/[id]/page.tsx:38` | `TripDetailPage` | 10 |
| `src/app/api/_handlers/admin/cost/overview/route.ts:32` | `GET` | 10 |
| `src/app/social/_components/ReviewsToInsta.tsx:141` | `(anonymous)` | 10 |
| `src/components/ShareTripModal.tsx:44` | `generateShareLink` | 10 |
| `src/components/demo/WelcomeModal.tsx:20` | `(anonymous)` | 10 |
| `src/features/admin/revenue/useAdminRevenue.ts:84` | `useAdminRevenue` | 10 |
| `src/app/admin/insights/page.tsx:29` | `AdminInsightsPage` | 9 |
| `src/app/admin/support/page.tsx:71` | `SupportPage` | 9 |
| `src/app/admin/templates/page.tsx:94` | `(anonymous)` | 9 |
| `src/app/admin/tour-templates/[id]/edit/page.tsx:205` | `handleSave` | 9 |
| `src/app/admin/tour-templates/create/page.tsx:200` | `handleSave` | 9 |
| `src/app/admin/tour-templates/import/page.tsx:18` | `ImportTourPage` | 9 |
| `src/app/admin/tour-templates/page.tsx:49` | `TourTemplatesPage` | 9 |
| `src/app/admin/trips/[id]/page.tsx:411` | `saveChanges` | 9 |
| `src/app/api/_handlers/admin/insights/win-loss/route.ts:11` | `GET` | 9 |
| `src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:336` | `DELETE` | 9 |
| `src/app/api/_handlers/admin/pricing/dashboard/route.ts:16` | `GET` | 9 |
| `src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:76` | `PATCH` | 9 |
| `src/app/api/_handlers/admin/whatsapp/health/route.ts:54` | `GET` | 9 |
| `src/app/api/_handlers/assistant/chat/stream/route.ts:186` | `streamOpenAI` | 9 |
| `src/app/api/_handlers/drivers/search/route.ts:37` | `GET` | 9 |
| `src/app/api/_handlers/marketplace/route.ts:209` | `GET` | 9 |
| `src/app/api/_handlers/notifications/schedule-followups/route.ts:77` | `POST` | 9 |
| `src/app/api/_handlers/onboarding/setup/route.ts:306` | `POST` | 9 |
| `src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:110` | `POST` | 9 |
| `src/app/api/_handlers/social/process-queue/route.ts:54` | `POST` | 9 |
| `src/app/api/_handlers/social/refresh-tokens/route.ts:12` | `POST` | 9 |
| `src/app/api/_handlers/social/smart-poster/route.ts:14` | `POST` | 9 |
| `src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:16` | `GET` | 9 |
| `src/app/api/_handlers/trips/[id]/clone/route.ts:25` | `POST` | 9 |
| `src/app/api/_handlers/whatsapp/broadcast/route.ts:363` | `POST` | 9 |
| `src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:54` | `POST` | 9 |
| `src/app/pay/[token]/PaymentCheckoutClient.tsx:48` | `PaymentCheckoutClient` | 9 |
| `src/app/planner/SaveItineraryButton.tsx:21` | `SaveItineraryButton` | 9 |
| `src/app/proposals/create/page.tsx:48` | `CreateProposalPage` | 9 |
| `src/app/settings/marketplace/MarketplaceListingPlans.tsx:94` | `MarketplaceListingPlans` | 9 |
| `src/components/CreateTripModal.tsx:64` | `CreateTripModal` | 9 |
| `src/components/payments/RazorpayModal.tsx:93` | `RazorpayModal` | 9 |
| `src/components/pdf/DownloadPDFButton.tsx:20` | `DownloadPDFButton` | 9 |
| `src/components/pdf/itinerary-pdf.tsx:63` | `hydrateItineraryImages` | 9 |
| `src/features/admin/revenue/useAdminRevenue.ts:97` | `(anonymous)` | 9 |
| `src/features/calendar/utils.ts:323` | `computeTimeGridColumns` | 9 |
| `src/lib/api-dispatch.ts:23` | `extractRateLimitIdentifier` | 9 |
| `src/lib/assistant/actions/reads/trips.ts:382` | `(anonymous)` | 9 |

Total functions over nesting depth 4: 1130

## Non-null Assertions Inventory

```text
src/app/(superadmin)/god/kill-switch/page.tsx:178:76 settings!.org_suspensions!
src/app/(superadmin)/god/kill-switch/page.tsx:178:59 settings!
src/app/(superadmin)/god/kill-switch/page.tsx:181:51 settings!.org_suspensions!
src/app/(superadmin)/god/kill-switch/page.tsx:181:34 settings!
src/app/(superadmin)/god/monitoring/page.tsx:172:67 queues!
src/app/admin/notifications/page.tsx:616:106 row.queue_id!
src/app/admin/tour-templates/[id]/page.tsx:463:55 accommodations[day.id].amenities!
src/app/admin/tour-templates/[id]/page.tsx:465:60 accommodations[day.id].amenities!
src/app/admin/trips/[id]/_components/utils.ts:169:108 optimizedActivities[0]!.start_time!
src/app/admin/trips/[id]/_components/utils.ts:169:96 optimizedActivities[0]!
src/app/admin/trips/[id]/_components/utils.ts:176:84 activity.start_time!
src/app/admin/trips/[id]/page.tsx:387:55 center!
src/app/api/_handlers/add-ons/stats/route.ts:87:50 addOnCounts.get(addOnId)!
src/app/api/_handlers/admin/clear-cache/route.ts:82:60 admin.organizationId!
src/app/api/_handlers/admin/dashboard/stats/route.ts:30:70 resolveScopedOrgWithDemo(req, admin.organizationId)!
src/app/api/_handlers/admin/leads/[id]/route.ts:58:48 admin.organizationId!
src/app/api/_handlers/admin/leads/[id]/route.ts:84:48 admin.organizationId!
src/app/api/_handlers/admin/leads/[id]/route.ts:118:57 nextStage!
src/app/api/_handlers/admin/leads/[id]/route.ts:126:48 admin.organizationId!
src/app/api/_handlers/admin/leads/[id]/route.ts:140:42 admin.organizationId!
src/app/api/_handlers/admin/leads/[id]/route.ts:149:56 nextStage!
src/app/api/_handlers/admin/leads/[id]/route.ts:152:46 admin.organizationId!
src/app/api/_handlers/admin/leads/route.ts:58:48 admin.organizationId!
src/app/api/_handlers/admin/leads/route.ts:128:42 admin.organizationId!
src/app/api/_handlers/admin/leads/route.ts:165:44 admin.organizationId!
src/app/api/_handlers/admin/leads/route.ts:176:44 admin.organizationId!
src/app/api/_handlers/admin/pricing/dashboard/route.ts:40:70 resolveScopedOrgWithDemo(req, admin.organizationId)!
src/app/api/_handlers/admin/pricing/overheads/route.ts:31:70 resolveScopedOrgWithDemo(req, admin.organizationId)!
src/app/api/_handlers/admin/pricing/transactions/route.ts:47:70 resolveScopedOrgWithDemo(req, admin.organizationId)!
src/app/api/_handlers/admin/pricing/transactions/route.ts:53:100 url.searchParams.get("sort")!
src/app/api/_handlers/ai/pricing-suggestion/route.ts:27:42 sorted[middle - 1]!
src/app/api/_handlers/ai/pricing-suggestion/route.ts:27:60 sorted[middle]!
src/app/api/_handlers/ai/pricing-suggestion/route.ts:29:24 sorted[middle]!
src/app/api/_handlers/health/route.ts:168:34 response!
src/app/api/_handlers/health/route.ts:212:26 response!
src/app/api/_handlers/health/route.ts:248:26 response!
src/app/api/_handlers/health/route.ts:272:54 weatherReq.response!
src/app/api/_handlers/health/route.ts:273:38 weatherReq.response!
src/app/api/_handlers/health/route.ts:280:55 currencyReq.response!
src/app/api/_handlers/health/route.ts:281:39 currencyReq.response!
src/app/api/_handlers/invoices/[id]/pay/route.ts:36:49 auth.organizationId!
src/app/api/_handlers/invoices/[id]/pay/route.ts:69:45 auth.organizationId!
src/app/api/_handlers/invoices/[id]/pay/route.ts:120:49 auth.organizationId!
src/app/api/_handlers/invoices/[id]/pay/route.ts:134:49 auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:67:92 auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:78:49 auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:118:92 auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:202:49 auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:243:92 auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:258:49 auth.organizationId!
src/app/api/_handlers/invoices/route.ts:45:49 auth.organizationId!
src/app/api/_handlers/invoices/route.ts:94:47 auth.organizationId!
src/app/api/_handlers/invoices/send-pdf/route.ts:56:49 auth.organizationId!
src/app/api/_handlers/notifications/process-queue/route.ts:75:84 i.trip_id!
src/app/api/_handlers/notifications/process-queue/route.ts:76:98 i.user_id!
src/app/api/_handlers/notifications/process-queue/route.ts:229:28 tripId!
src/app/api/_handlers/proposals/[id]/send/route.ts:245:43 admin.organizationId!
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:166:56 r.response_posted_at!
src/app/api/availability/route.ts:41:56 adminResult.organizationId!
src/app/api/availability/route.ts:91:46 admin.organizationId!
src/app/api/availability/route.ts:136:50 admin.organizationId!
src/app/drivers/page.tsx:252:50 formData.full_name!
src/app/drivers/page.tsx:253:42 formData.phone!
src/app/inbox/page.tsx:186:74 TARGET_OPTIONS.find((t) => t.key === state.target)!
src/app/planner/page.tsx:356:75 result!
src/app/planner/page.tsx:359:123 result!
src/app/planner/page.tsx:360:121 result!
src/app/planner/page.tsx:361:124 result!
src/app/planner/page.tsx:362:125 result!
src/app/planner/page.tsx:363:127 result!
src/app/planner/page.tsx:364:125 result!
src/app/planner/page.tsx:368:64 result!
src/app/planner/page.tsx:450:44 result!
src/app/planner/page.tsx:452:80 result!
src/app/planner/page.tsx:469:75 result!
src/app/planner/page.tsx:500:73 result!
src/app/planner/page.tsx:503:44 result!
src/app/planner/page.tsx:509:80 result!
src/app/reputation/_components/CompetitorBenchmark.tsx:124:32 c.latest_rating!
src/app/social/_components/SocialStudioClient.tsx:445:89 data.heroImage!
src/components/assistant/TourAssistantPresentation.tsx:349:87 msg.actionProposal!
src/components/assistant/TourAssistantPresentation.tsx:350:87 msg.actionProposal!
src/components/assistant/TourAssistantPresentation.tsx:366:87 msg.actionProposal!
src/components/assistant/TourAssistantPresentation.tsx:367:87 msg.actionProposal!
src/components/map/ItineraryMap.tsx:80:77 route[i]!
src/components/map/ItineraryMap.tsx:80:92 route[i + 1]!
src/components/map/ItineraryMap.tsx:94:45 order[order.length - 1]!
src/components/map/ItineraryMap.tsx:98:47 points[last]!
src/components/map/ItineraryMap.tsx:98:61 points[idx]!
src/components/map/ItineraryMap.tsx:114:52 points[order[i - 1]!]!
src/components/map/ItineraryMap.tsx:114:50 order[i - 1]!
src/components/map/ItineraryMap.tsx:115:48 points[order[i]!]!
src/components/map/ItineraryMap.tsx:115:46 order[i]!
src/components/map/ItineraryMap.tsx:116:48 points[order[k]!]!
src/components/map/ItineraryMap.tsx:116:46 order[k]!
src/components/map/ItineraryMap.tsx:117:52 points[order[k + 1]!]!
src/components/map/ItineraryMap.tsx:117:50 order[k + 1]!
src/components/map/ItineraryMap.tsx:248:46 a.coordinates!
src/components/map/ItineraryMap.tsx:248:66 a.coordinates!
src/components/map/ItineraryMap.tsx:255:45 positions[i]!
src/components/map/ItineraryMap.tsx:354:51 act.coordinates!
src/components/map/ItineraryMap.tsx:354:73 act.coordinates!
src/components/map/ItineraryMap.tsx:376:95 driverLocation!
src/components/whatsapp/CannedResponses.tsx:151:25 groups[t.category]!
src/components/whatsapp/CannedResponses.tsx:328:39 templates!
src/components/whatsapp/useSmartReplySuggestions.ts:25:28 message.body!
src/features/admin/analytics/useAdminAnalytics.ts:144:22 monthMap.get(key)!
src/features/admin/analytics/useAdminAnalytics.ts:159:40 monthMap.get(key)!
src/features/admin/analytics/useAdminAnalytics.ts:168:22 monthMap.get(key)!
src/features/admin/analytics/useAdminAnalytics.ts:172:34 monthMap.get(key)!
src/features/admin/revenue/useAdminRevenue.ts:187:37 monthMap.get(monthKey)!
src/features/admin/revenue/useAdminRevenue.ts:188:37 monthMap.get(monthKey)!
src/features/admin/revenue/useAdminRevenue.ts:236:59 monthMap.get(key)!
src/features/calendar/DayDrawer.tsx:130:53 grouped.get(type)!
src/features/calendar/EventDetailModal.tsx:131:53 event.drillHref!
src/features/calendar/utils.ts:218:36 a.endDate!
src/features/calendar/utils.ts:219:36 b.endDate!
src/features/calendar/utils.ts:229:44 event.endDate!
src/features/trip-detail/tabs/ClientCommsTab.tsx:53:26 max!
src/features/trip-detail/tabs/OverviewTab.tsx:201:65 action.tab!
src/features/trip-detail/tabs/OverviewTab.tsx:230:26 max!
src/features/trip-detail/utils.ts:64:37 day.activities[0].start_time!
src/lib/admin/dashboard-metrics.ts:104:21 buckets.get(key)!
src/lib/admin/dashboard-metrics.ts:111:21 buckets.get(key)!
src/lib/admin/dashboard-metrics.ts:117:36 buckets.get(key)!
src/lib/admin/date-range.ts:116:47 safeDate(fallback.from)!
src/lib/admin/date-range.ts:117:43 safeDate(fallback.to)!
src/lib/assistant/actions/reads/clients.ts:181:31 row.profiles!
src/lib/image-search.ts:85:42 queue.shift()!
src/lib/social/review-queue.server.ts:110:36 input.templateId!
src/lib/social/review-queue.server.ts:195:37 input.scheduleDate!
TOTAL=131
```
