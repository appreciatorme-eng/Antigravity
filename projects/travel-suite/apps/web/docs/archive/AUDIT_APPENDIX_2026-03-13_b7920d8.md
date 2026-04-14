# Travel Suite Web Audit Appendix (2026-03-13, b7920d8)

Audit target: `origin/main` at commit `b7920d82fe368e3297704d0a795a83bcc29759f0`
Scope: `projects/travel-suite/apps/web/src/`
Purpose: exhaustive raw inventories and validation command output for the current-head audit run.

## Baseline Validation

### `npm run lint`
```text

> web@0.1.0 lint
> eslint --max-warnings=0
```

### `npm run typecheck`
```text

> web@0.1.0 typecheck
> tsc --noEmit
```

### `npx madge --circular --extensions ts,tsx src`
```text
- Finding files
Processed 1147 files (10.5s) (614 warnings)

✔ No circular dependency found!
```

## Coverage

### Coverage Summary
```text
src total files:     1149
src ts/tsx files:     1146

Top-level subtree counts
src/app      606
src/components      199
src/emails        8
src/features       84
src/hooks        4
src/lib      240
src/stores        2
src/styles        2
src/types        2
```

### Full `src/` Manifest
```text
src/app/(superadmin)/god/analytics/error.tsx
src/app/(superadmin)/god/analytics/page.tsx
src/app/(superadmin)/god/announcements/error.tsx
src/app/(superadmin)/god/announcements/page.tsx
src/app/(superadmin)/god/audit-log/error.tsx
src/app/(superadmin)/god/audit-log/page.tsx
src/app/(superadmin)/god/costs/error.tsx
src/app/(superadmin)/god/costs/org/[orgId]/error.tsx
src/app/(superadmin)/god/costs/org/[orgId]/page.tsx
src/app/(superadmin)/god/costs/page.tsx
src/app/(superadmin)/god/directory/error.tsx
src/app/(superadmin)/god/directory/page.tsx
src/app/(superadmin)/god/error.tsx
src/app/(superadmin)/god/kill-switch/error.tsx
src/app/(superadmin)/god/kill-switch/page.tsx
src/app/(superadmin)/god/layout.tsx
src/app/(superadmin)/god/monitoring/error.tsx
src/app/(superadmin)/god/monitoring/page.tsx
src/app/(superadmin)/god/page.tsx
src/app/(superadmin)/god/referrals/error.tsx
src/app/(superadmin)/god/referrals/page.tsx
src/app/(superadmin)/god/signups/error.tsx
src/app/(superadmin)/god/signups/page.tsx
src/app/(superadmin)/god/support/error.tsx
src/app/(superadmin)/god/support/page.tsx
src/app/add-ons/_components/AddOnFormModal.tsx
src/app/add-ons/_components/AddOnsGrid.tsx
src/app/add-ons/_components/CategoryFilter.tsx
src/app/add-ons/_components/StatsHeader.tsx
src/app/add-ons/_components/types.ts
src/app/add-ons/error.tsx
src/app/add-ons/page.tsx
src/app/admin/activity/error.tsx
src/app/admin/activity/page.tsx
src/app/admin/billing/error.tsx
src/app/admin/billing/page.tsx
src/app/admin/cost/_components/AlertsList.tsx
src/app/admin/cost/_components/CapEditor.tsx
src/app/admin/cost/_components/MarginReport.tsx
src/app/admin/cost/_components/OrgCostCard.tsx
src/app/admin/cost/_components/SummaryCards.tsx
src/app/admin/cost/_components/types.ts
src/app/admin/cost/error.tsx
src/app/admin/cost/page.tsx
src/app/admin/error.tsx
src/app/admin/gst-report/error.tsx
src/app/admin/gst-report/page.tsx
src/app/admin/insights/error.tsx
src/app/admin/insights/page.tsx
src/app/admin/insights/shared.ts
src/app/admin/internal/marketplace/error.tsx
src/app/admin/internal/marketplace/page.tsx
src/app/admin/invoices/error.tsx
src/app/admin/invoices/page.tsx
src/app/admin/kanban/error.tsx
src/app/admin/kanban/page.tsx
src/app/admin/layout.tsx
src/app/admin/loading.tsx
src/app/admin/notifications/error.tsx
src/app/admin/notifications/page.tsx
src/app/admin/notifications/shared.tsx
src/app/admin/operations/error.tsx
src/app/admin/operations/page.tsx
src/app/admin/page.tsx
src/app/admin/planner/error.tsx
src/app/admin/planner/page.tsx
src/app/admin/pricing/error.tsx
src/app/admin/pricing/page.tsx
src/app/admin/referrals/error.tsx
src/app/admin/referrals/page.tsx
src/app/admin/revenue/error.tsx
src/app/admin/revenue/page.tsx
src/app/admin/security/error.tsx
src/app/admin/security/page.tsx
src/app/admin/settings/SettingsIntegrationsSection.tsx
src/app/admin/settings/error.tsx
src/app/admin/settings/marketplace/error.tsx
src/app/admin/settings/marketplace/page.tsx
src/app/admin/settings/notifications/error.tsx
src/app/admin/settings/notifications/page.tsx
src/app/admin/settings/page.tsx
src/app/admin/settings/shared.ts
src/app/admin/support/error.tsx
src/app/admin/support/page.tsx
src/app/admin/templates/error.tsx
src/app/admin/templates/page.tsx
src/app/admin/tour-templates/[id]/edit/error.tsx
src/app/admin/tour-templates/[id]/edit/page.tsx
src/app/admin/tour-templates/[id]/error.tsx
src/app/admin/tour-templates/[id]/page.tsx
src/app/admin/tour-templates/create/_components/AccommodationEditor.tsx
src/app/admin/tour-templates/create/_components/ActivityEditor.tsx
src/app/admin/tour-templates/create/_components/DayEditor.tsx
src/app/admin/tour-templates/create/_components/MetadataForm.tsx
src/app/admin/tour-templates/create/_components/index.ts
src/app/admin/tour-templates/create/_components/types.ts
src/app/admin/tour-templates/create/error.tsx
src/app/admin/tour-templates/create/page.tsx
src/app/admin/tour-templates/error.tsx
src/app/admin/tour-templates/import/error.tsx
src/app/admin/tour-templates/import/page.tsx
src/app/admin/tour-templates/page.tsx
src/app/admin/trips/[id]/_components/AccommodationCard.tsx
src/app/admin/trips/[id]/_components/DayActivities.tsx
src/app/admin/trips/[id]/_components/DayTabs.tsx
src/app/admin/trips/[id]/_components/DriverAssignmentCard.tsx
src/app/admin/trips/[id]/_components/TripHeader.tsx
src/app/admin/trips/[id]/_components/index.ts
src/app/admin/trips/[id]/_components/types.ts
src/app/admin/trips/[id]/_components/utils.ts
src/app/admin/trips/[id]/clone/error.tsx
src/app/admin/trips/[id]/clone/page.tsx
src/app/admin/trips/[id]/error.tsx
src/app/admin/trips/[id]/page.tsx
src/app/admin/trips/error.tsx
src/app/admin/trips/page.tsx
src/app/analytics/drill-through/error.tsx
src/app/analytics/drill-through/page.tsx
src/app/analytics/error.tsx
src/app/analytics/page.tsx
src/app/analytics/templates/error.tsx
src/app/analytics/templates/page.tsx
src/app/api/[...path]/route.ts
src/app/api/_handlers/add-ons/[id]/route.ts
src/app/api/_handlers/add-ons/route.ts
src/app/api/_handlers/add-ons/stats/route.ts
src/app/api/_handlers/admin/cache-metrics/route.ts
src/app/api/_handlers/admin/clear-cache/route.ts
src/app/api/_handlers/admin/clients/route.ts
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts
src/app/api/_handlers/admin/contacts/route.ts
src/app/api/_handlers/admin/cost/alerts/ack/route.ts
src/app/api/_handlers/admin/cost/overview/route.ts
src/app/api/_handlers/admin/cost/overview/shared.ts
src/app/api/_handlers/admin/dashboard/stats/route.ts
src/app/api/_handlers/admin/destinations/route.ts
src/app/api/_handlers/admin/funnel/route.ts
src/app/api/_handlers/admin/generate-embeddings/route.ts
src/app/api/_handlers/admin/geocoding/usage/route.ts
src/app/api/_handlers/admin/insights/action-queue/route.ts
src/app/api/_handlers/admin/insights/ai-usage/route.ts
src/app/api/_handlers/admin/insights/auto-requote/route.ts
src/app/api/_handlers/admin/insights/batch-jobs/route.ts
src/app/api/_handlers/admin/insights/best-quote/route.ts
src/app/api/_handlers/admin/insights/daily-brief/route.ts
src/app/api/_handlers/admin/insights/margin-leak/route.ts
src/app/api/_handlers/admin/insights/ops-copilot/route.ts
src/app/api/_handlers/admin/insights/proposal-risk/route.ts
src/app/api/_handlers/admin/insights/roi/route.ts
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts
src/app/api/_handlers/admin/insights/win-loss/route.ts
src/app/api/_handlers/admin/leads/[id]/route.ts
src/app/api/_handlers/admin/leads/route.ts
src/app/api/_handlers/admin/ltv/route.ts
src/app/api/_handlers/admin/marketplace/verify/route.ts
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts
src/app/api/_handlers/admin/notifications/delivery/route.ts
src/app/api/_handlers/admin/operations/command-center/route.ts
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts
src/app/api/_handlers/admin/pdf-imports/route.ts
src/app/api/_handlers/admin/pdf-imports/upload/route.ts
src/app/api/_handlers/admin/pricing/dashboard/route.ts
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts
src/app/api/_handlers/admin/pricing/overheads/route.ts
src/app/api/_handlers/admin/pricing/transactions/route.ts
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts
src/app/api/_handlers/admin/pricing/trip-costs/route.ts
src/app/api/_handlers/admin/pricing/trips/route.ts
src/app/api/_handlers/admin/pricing/vendor-history/route.ts
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts
src/app/api/_handlers/admin/referrals/route.ts
src/app/api/_handlers/admin/reports/destinations/route.ts
src/app/api/_handlers/admin/reports/gst/route.ts
src/app/api/_handlers/admin/reports/operators/route.ts
src/app/api/_handlers/admin/reputation/client-referrals/route.ts
src/app/api/_handlers/admin/revenue/route.ts
src/app/api/_handlers/admin/security/diagnostics/route.ts
src/app/api/_handlers/admin/seed-demo/fixture.ts
src/app/api/_handlers/admin/seed-demo/guards.ts
src/app/api/_handlers/admin/seed-demo/route.ts
src/app/api/_handlers/admin/social/generate/route.ts
src/app/api/_handlers/admin/tour-templates/extract/route.ts
src/app/api/_handlers/admin/trips/[id]/clone/route.ts
src/app/api/_handlers/admin/trips/[id]/route.ts
src/app/api/_handlers/admin/trips/route.ts
src/app/api/_handlers/admin/whatsapp/health/route.ts
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts
src/app/api/_handlers/admin/workflow/events/route.ts
src/app/api/_handlers/admin/workflow/rules/route.ts
src/app/api/_handlers/ai/draft-review-response/route.ts
src/app/api/_handlers/ai/pricing-suggestion/route.ts
src/app/api/_handlers/ai/suggest-reply/route.ts
src/app/api/_handlers/assistant/chat/route.ts
src/app/api/_handlers/assistant/chat/stream/route.ts
src/app/api/_handlers/assistant/confirm/route.ts
src/app/api/_handlers/assistant/conversations/[sessionId]/route.ts
src/app/api/_handlers/assistant/conversations/route.ts
src/app/api/_handlers/assistant/export/route.ts
src/app/api/_handlers/assistant/quick-prompts/route.ts
src/app/api/_handlers/assistant/usage/route.ts
src/app/api/_handlers/auth/password-login/route.ts
src/app/api/_handlers/billing/contact-sales/route.ts
src/app/api/_handlers/billing/subscription/route.ts
src/app/api/_handlers/bookings/[id]/invoice/route.ts
src/app/api/_handlers/bookings/flights/search/route.ts
src/app/api/_handlers/bookings/hotels/search/route.ts
src/app/api/_handlers/bookings/locations/search/route.ts
src/app/api/_handlers/calendar/events/route.ts
src/app/api/_handlers/cron/assistant-alerts/route.ts
src/app/api/_handlers/cron/assistant-briefing/route.ts
src/app/api/_handlers/cron/assistant-digest/route.ts
src/app/api/_handlers/cron/operator-scorecards/route.ts
src/app/api/_handlers/cron/reputation-campaigns/route.ts
src/app/api/_handlers/currency/route.ts
src/app/api/_handlers/dashboard/schedule/route.ts
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts
src/app/api/_handlers/dashboard/tasks/route.ts
src/app/api/_handlers/debug/route.ts
src/app/api/_handlers/drivers/search/route.ts
src/app/api/_handlers/emails/welcome/route.ts
src/app/api/_handlers/health/route.ts
src/app/api/_handlers/images/pexels/route.ts
src/app/api/_handlers/images/pixabay/route.ts
src/app/api/_handlers/images/route.ts
src/app/api/_handlers/images/unsplash/route.ts
src/app/api/_handlers/integrations/places/route.ts
src/app/api/_handlers/integrations/tripadvisor/route.ts
src/app/api/_handlers/invoices/[id]/pay/route.ts
src/app/api/_handlers/invoices/[id]/route.ts
src/app/api/_handlers/invoices/route.ts
src/app/api/_handlers/invoices/send-pdf/route.ts
src/app/api/_handlers/itineraries/[id]/bookings/route.ts
src/app/api/_handlers/itineraries/[id]/feedback/route.ts
src/app/api/_handlers/itineraries/[id]/route.ts
src/app/api/_handlers/itineraries/route.ts
src/app/api/_handlers/itinerary/generate/route.ts
src/app/api/_handlers/itinerary/import/pdf/route.ts
src/app/api/_handlers/itinerary/import/url/route.ts
src/app/api/_handlers/itinerary/share/route.ts
src/app/api/_handlers/leads/convert/route.ts
src/app/api/_handlers/location/cleanup-expired/route.ts
src/app/api/_handlers/location/client-share/route.ts
src/app/api/_handlers/location/live/[token]/route.ts
src/app/api/_handlers/location/ping/route.ts
src/app/api/_handlers/location/share/route.ts
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts
src/app/api/_handlers/marketplace/[id]/reviews/route.ts
src/app/api/_handlers/marketplace/[id]/view/route.ts
src/app/api/_handlers/marketplace/inquiries/route.ts
src/app/api/_handlers/marketplace/listing-subscription/route.ts
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts
src/app/api/_handlers/marketplace/options/route.ts
src/app/api/_handlers/marketplace/route.ts
src/app/api/_handlers/marketplace/stats/route.ts
src/app/api/_handlers/nav/counts/route.ts
src/app/api/_handlers/notifications/client-landed/route.ts
src/app/api/_handlers/notifications/process-queue/batch.ts
src/app/api/_handlers/notifications/process-queue/route.ts
src/app/api/_handlers/notifications/retry-failed/route.ts
src/app/api/_handlers/notifications/schedule-followups/route.ts
src/app/api/_handlers/notifications/send/route.ts
src/app/api/_handlers/onboarding/first-value/route.ts
src/app/api/_handlers/onboarding/setup/route.ts
src/app/api/_handlers/payments/create-order/route.ts
src/app/api/_handlers/payments/links/[token]/route.ts
src/app/api/_handlers/payments/links/route.ts
src/app/api/_handlers/payments/razorpay/route.ts
src/app/api/_handlers/payments/track/[token]/route.ts
src/app/api/_handlers/payments/verify/route.ts
src/app/api/_handlers/payments/webhook/route.ts
src/app/api/_handlers/portal/[token]/route.ts
src/app/api/_handlers/proposals/[id]/convert/route.ts
src/app/api/_handlers/proposals/[id]/pdf/route.ts
src/app/api/_handlers/proposals/[id]/send/route.ts
src/app/api/_handlers/proposals/bulk/route.ts
src/app/api/_handlers/proposals/create/route.ts
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts
src/app/api/_handlers/proposals/public/[token]/route.ts
src/app/api/_handlers/proposals/send-pdf/route.ts
src/app/api/_handlers/reputation/ai/analyze/route.ts
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts
src/app/api/_handlers/reputation/ai/respond/route.ts
src/app/api/_handlers/reputation/analytics/snapshot/route.ts
src/app/api/_handlers/reputation/analytics/topics/route.ts
src/app/api/_handlers/reputation/analytics/trends/route.ts
src/app/api/_handlers/reputation/brand-voice/route.ts
src/app/api/_handlers/reputation/campaigns/[id]/route.ts
src/app/api/_handlers/reputation/campaigns/route.ts
src/app/api/_handlers/reputation/campaigns/trigger/route.ts
src/app/api/_handlers/reputation/connections/route.ts
src/app/api/_handlers/reputation/dashboard/route.ts
src/app/api/_handlers/reputation/nps/[token]/route.ts
src/app/api/_handlers/reputation/nps/submit/route.ts
src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route.ts
src/app/api/_handlers/reputation/reviews/[id]/route.ts
src/app/api/_handlers/reputation/reviews/route.ts
src/app/api/_handlers/reputation/sync/route.ts
src/app/api/_handlers/reputation/widget/[token]/route.ts
src/app/api/_handlers/reputation/widget/config/route.ts
src/app/api/_handlers/settings/integrations/route.ts
src/app/api/_handlers/settings/marketplace/route.ts
src/app/api/_handlers/settings/team/[id]/resend/route.ts
src/app/api/_handlers/settings/team/[id]/route.ts
src/app/api/_handlers/settings/team/invite/route.ts
src/app/api/_handlers/settings/team/route.ts
src/app/api/_handlers/settings/team/shared.ts
src/app/api/_handlers/settings/upi/route.ts
src/app/api/_handlers/share/[token]/public-share.ts
src/app/api/_handlers/share/[token]/route.ts
src/app/api/_handlers/social/ai-image/route.ts
src/app/api/_handlers/social/ai-poster/route.ts
src/app/api/_handlers/social/captions/route.ts
src/app/api/_handlers/social/connections/[id]/route.ts
src/app/api/_handlers/social/connections/route.ts
src/app/api/_handlers/social/extract/route.ts
src/app/api/_handlers/social/oauth/callback/route.ts
src/app/api/_handlers/social/oauth/facebook/route.ts
src/app/api/_handlers/social/oauth/google/route.ts
src/app/api/_handlers/social/oauth/linkedin/route.ts
src/app/api/_handlers/social/posts/[id]/render/route.ts
src/app/api/_handlers/social/posts/route.ts
src/app/api/_handlers/social/process-queue/route.ts
src/app/api/_handlers/social/publish/route.ts
src/app/api/_handlers/social/refresh-tokens/route.ts
src/app/api/_handlers/social/render-poster/route.ts
src/app/api/_handlers/social/reviews/import/route.ts
src/app/api/_handlers/social/reviews/public/route.ts
src/app/api/_handlers/social/reviews/route.ts
src/app/api/_handlers/social/schedule/route.ts
src/app/api/_handlers/social/smart-poster/route.ts
src/app/api/_handlers/subscriptions/cancel/route.ts
src/app/api/_handlers/subscriptions/limits/route.ts
src/app/api/_handlers/subscriptions/route.ts
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts
src/app/api/_handlers/superadmin/announcements/[id]/route.ts
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts
src/app/api/_handlers/superadmin/announcements/route.ts
src/app/api/_handlers/superadmin/audit-log/route.ts
src/app/api/_handlers/superadmin/cost/aggregate/route.ts
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts
src/app/api/_handlers/superadmin/cost/trends/route.ts
src/app/api/_handlers/superadmin/me/route.ts
src/app/api/_handlers/superadmin/monitoring/health/route.ts
src/app/api/_handlers/superadmin/monitoring/queues/route.ts
src/app/api/_handlers/superadmin/overview/route.ts
src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts
src/app/api/_handlers/superadmin/referrals/overview/route.ts
src/app/api/_handlers/superadmin/settings/kill-switch/route.ts
src/app/api/_handlers/superadmin/settings/org-suspend/route.ts
src/app/api/_handlers/superadmin/settings/route.ts
src/app/api/_handlers/superadmin/support/tickets/[id]/respond/route.ts
src/app/api/_handlers/superadmin/support/tickets/[id]/route.ts
src/app/api/_handlers/superadmin/support/tickets/route.ts
src/app/api/_handlers/superadmin/users/[id]/route.ts
src/app/api/_handlers/superadmin/users/directory/route.ts
src/app/api/_handlers/superadmin/users/signups/route.ts
src/app/api/_handlers/support/route.ts
src/app/api/_handlers/test-geocoding/route.ts
src/app/api/_handlers/trips/[id]/add-ons/route.ts
src/app/api/_handlers/trips/[id]/clone/route.ts
src/app/api/_handlers/trips/[id]/invoices/route.ts
src/app/api/_handlers/trips/[id]/notifications/route.ts
src/app/api/_handlers/trips/[id]/route.ts
src/app/api/_handlers/trips/route.ts
src/app/api/_handlers/unsplash/route.ts
src/app/api/_handlers/weather/route.ts
src/app/api/_handlers/webhooks/waha/route.ts
src/app/api/_handlers/webhooks/waha/secret.ts
src/app/api/_handlers/webhooks/whatsapp/route.ts
src/app/api/_handlers/whatsapp/broadcast/route.ts
src/app/api/_handlers/whatsapp/connect/route.ts
src/app/api/_handlers/whatsapp/conversations/route.ts
src/app/api/_handlers/whatsapp/disconnect/route.ts
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts
src/app/api/_handlers/whatsapp/health/route.ts
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts
src/app/api/_handlers/whatsapp/qr/route.ts
src/app/api/_handlers/whatsapp/send/route.ts
src/app/api/_handlers/whatsapp/status/route.ts
src/app/api/_handlers/whatsapp/test-message/route.ts
src/app/api/_handlers/whatsapp/webhook/route.ts
src/app/api/admin/[...path]/route.ts
src/app/api/assistant/[...path]/route.ts
src/app/api/availability/route.ts
src/app/api/reputation/[...path]/route.ts
src/app/api/social/[...path]/route.ts
src/app/api/superadmin/[...path]/route.ts
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts
src/app/api/whatsapp/proposal-drafts/[id]/route.ts
src/app/auth/callback/route.ts
src/app/auth/error.tsx
src/app/auth/page.tsx
src/app/auth/signout/route.ts
src/app/billing/BillingPageClient.tsx
src/app/billing/error.tsx
src/app/billing/page.tsx
src/app/bookings/error.tsx
src/app/bookings/page.tsx
src/app/calendar/error.tsx
src/app/calendar/page.tsx
src/app/clients/[id]/ClientEditButton.tsx
src/app/clients/[id]/client-profile-shared.ts
src/app/clients/[id]/error.tsx
src/app/clients/[id]/page.tsx
src/app/clients/error.tsx
src/app/clients/page.tsx
src/app/dashboard/error.tsx
src/app/dashboard/schedule/error.tsx
src/app/dashboard/schedule/page.tsx
src/app/dashboard/tasks/error.tsx
src/app/dashboard/tasks/page.tsx
src/app/design-demo/error.tsx
src/app/design-demo/page.tsx
src/app/drivers/[id]/error.tsx
src/app/drivers/[id]/page.tsx
src/app/drivers/error.tsx
src/app/drivers/page.tsx
src/app/error.tsx
src/app/favicon.ico
src/app/global-error.tsx
src/app/globals.css
src/app/inbox/error.tsx
src/app/inbox/page.tsx
src/app/layout.tsx
src/app/live/[token]/error.tsx
src/app/live/[token]/page.tsx
src/app/loading.tsx
src/app/manifest.ts
src/app/map-test/error.tsx
src/app/map-test/page.tsx
src/app/marketing/error.tsx
src/app/marketing/page.tsx
src/app/marketplace/[id]/error.tsx
src/app/marketplace/[id]/page.tsx
src/app/marketplace/analytics/error.tsx
src/app/marketplace/analytics/page.tsx
src/app/marketplace/error.tsx
src/app/marketplace/inquiries/error.tsx
src/app/marketplace/inquiries/page.tsx
src/app/marketplace/page.tsx
src/app/offline/error.tsx
src/app/offline/page.tsx
src/app/onboarding/error.tsx
src/app/onboarding/page.tsx
src/app/p/[token]/error.tsx
src/app/p/[token]/page.tsx
src/app/p/[token]/sections.tsx
src/app/p/[token]/shared.ts
src/app/page.tsx
src/app/pay/[token]/PaymentCheckoutClient.tsx
src/app/pay/[token]/error.tsx
src/app/pay/[token]/page.tsx
src/app/planner/ClientFeedbackPanel.tsx
src/app/planner/ItineraryFilterBar.tsx
src/app/planner/NeedsAttentionQueue.tsx
src/app/planner/PastItineraryCard.tsx
src/app/planner/PlannerHero.tsx
src/app/planner/SaveItineraryButton.tsx
src/app/planner/ShareItinerary.tsx
src/app/planner/error.tsx
src/app/planner/page.tsx
src/app/planner/planner.types.ts
src/app/portal/[token]/error.tsx
src/app/portal/[token]/layout.tsx
src/app/portal/[token]/page.tsx
src/app/proposals/[id]/error.tsx
src/app/proposals/[id]/page.tsx
src/app/proposals/create/_components/AddOnsGrid.tsx
src/app/proposals/create/_components/ClientSelector.tsx
src/app/proposals/create/_components/CreateProposalActions.tsx
src/app/proposals/create/_components/ProposalLimitBanner.tsx
src/app/proposals/create/_components/ProposalSummary.tsx
src/app/proposals/create/_components/TemplateSelector.tsx
src/app/proposals/create/_components/WhatsAppDraftBanner.tsx
src/app/proposals/create/_hooks/useAvailabilityCheck.ts
src/app/proposals/create/_hooks/useCreateProposal.ts
src/app/proposals/create/_hooks/usePricingSuggestion.ts
src/app/proposals/create/_hooks/useProposalData.ts
src/app/proposals/create/_hooks/useWhatsAppDraft.ts
src/app/proposals/create/_types.ts
src/app/proposals/create/error.tsx
src/app/proposals/create/page.tsx
src/app/proposals/error.tsx
src/app/proposals/page.tsx
src/app/reputation/_components/BrandVoiceSettings.tsx
src/app/reputation/_components/CampaignBuilder.tsx
src/app/reputation/_components/CampaignList.tsx
src/app/reputation/_components/CompetitorBenchmark.tsx
src/app/reputation/_components/NPSSurveyPreview.tsx
src/app/reputation/_components/PlatformConnectionCards.tsx
src/app/reputation/_components/RatingDistribution.tsx
src/app/reputation/_components/ReputationDashboard.tsx
src/app/reputation/_components/ReputationHealthScore.tsx
src/app/reputation/_components/ReputationKPIRow.tsx
src/app/reputation/_components/ReviewCard.tsx
src/app/reputation/_components/ReviewInbox.tsx
src/app/reputation/_components/ReviewResponsePanel.tsx
src/app/reputation/_components/ReviewToRevenueChart.tsx
src/app/reputation/_components/SentimentChart.tsx
src/app/reputation/_components/TopicCloud.tsx
src/app/reputation/_components/WidgetConfigurator.tsx
src/app/reputation/_components/WidgetPreview.tsx
src/app/reputation/_components/mock-data.ts
src/app/reputation/_components/useReputationDashboardData.ts
src/app/reputation/analytics/error.tsx
src/app/reputation/analytics/page.tsx
src/app/reputation/campaigns/error.tsx
src/app/reputation/campaigns/page.tsx
src/app/reputation/error.tsx
src/app/reputation/nps/[token]/error.tsx
src/app/reputation/nps/[token]/page.tsx
src/app/reputation/page.tsx
src/app/reputation/reviews/error.tsx
src/app/reputation/reviews/page.tsx
src/app/reputation/settings/error.tsx
src/app/reputation/settings/page.tsx
src/app/reputation/widget/error.tsx
src/app/reputation/widget/page.tsx
src/app/settings/_components/IntegrationCard.tsx
src/app/settings/_components/IntegrationsTab.tsx
src/app/settings/_components/MapsDataSection.tsx
src/app/settings/_components/MessagingSection.tsx
src/app/settings/_components/OrganizationTab.tsx
src/app/settings/_components/PlaceholderTab.tsx
src/app/settings/_components/ProfileTab.tsx
src/app/settings/_components/SecurityTab.tsx
src/app/settings/_components/TeamTab.tsx
src/app/settings/error.tsx
src/app/settings/marketplace/MarketplaceListingCheckoutModal.tsx
src/app/settings/marketplace/MarketplaceListingPlans.tsx
src/app/settings/marketplace/error.tsx
src/app/settings/marketplace/page.tsx
src/app/settings/marketplace/useMarketplacePresence.ts
src/app/settings/page.tsx
src/app/settings/team/error.tsx
src/app/settings/team/page.tsx
src/app/settings/team/team.types.ts
src/app/settings/team/useTeamMembers.ts
src/app/share/[token]/ShareTemplateRenderer.tsx
src/app/share/[token]/error.tsx
src/app/share/[token]/page.tsx
src/app/social/_components/AiTab.tsx
src/app/social/_components/BackgroundPicker.tsx
src/app/social/_components/BulkExporter.tsx
src/app/social/_components/CanvasMode.tsx
src/app/social/_components/CaptionEngine.tsx
src/app/social/_components/CarouselBuilder.tsx
src/app/social/_components/ContentBar.tsx
src/app/social/_components/GallerySlotPicker.tsx
src/app/social/_components/MagicPrompter.tsx
src/app/social/_components/MediaLibrary.tsx
src/app/social/_components/PlatformStatusBar.tsx
src/app/social/_components/PostHistory.tsx
src/app/social/_components/PosterExtractor.tsx
src/app/social/_components/PublishKitDrawer.tsx
src/app/social/_components/ReviewsToInsta.tsx
src/app/social/_components/SocialAnalytics.tsx
src/app/social/_components/SocialStudioClient.tsx
src/app/social/_components/StockTab.tsx
src/app/social/_components/TemplateEditor.tsx
src/app/social/_components/TemplateGallery.tsx
src/app/social/_components/ToolbarActions.tsx
src/app/social/_components/TripImporter.tsx
src/app/social/_components/UploadTab.tsx
src/app/social/_components/background-picker-types.ts
src/app/social/_components/canvas/CanvasEditorPanel.tsx
src/app/social/_components/canvas/CanvasFooter.tsx
src/app/social/_components/canvas/CanvasMode.tsx
src/app/social/_components/canvas/CanvasPreviewPane.tsx
src/app/social/_components/canvas/CanvasPublishModal.tsx
src/app/social/_components/canvas/index.ts
src/app/social/_components/canvas/layout-preview.tsx
src/app/social/_components/canvas/types.ts
src/app/social/_components/template-gallery/FestivalBanner.tsx
src/app/social/_components/template-gallery/PreviewPanel.tsx
src/app/social/_components/template-gallery/TemplateCategoryFilter.tsx
src/app/social/_components/template-gallery/TemplateGrid.tsx
src/app/social/_components/template-gallery/TemplateSearchBar.tsx
src/app/social/_components/template-gallery/TemplateStrip.tsx
src/app/social/_components/template-gallery/index.ts
src/app/social/_components/template-gallery/layout-helpers.tsx
src/app/social/_components/template-gallery/types.ts
src/app/social/error.tsx
src/app/social/page.tsx
src/app/support/error.tsx
src/app/support/page.tsx
src/app/test-db/error.tsx
src/app/test-db/page.tsx
src/app/trips/DepartingSoonSection.tsx
src/app/trips/TripCardGrid.tsx
src/app/trips/TripGridCard.tsx
src/app/trips/TripKPIStats.tsx
src/app/trips/TripListRow.tsx
src/app/trips/[id]/error.tsx
src/app/trips/[id]/page.tsx
src/app/trips/error.tsx
src/app/trips/page.tsx
src/app/trips/templates/error.tsx
src/app/trips/templates/page.tsx
src/app/trips/types.ts
src/app/trips/utils.ts
src/app/welcome/error.tsx
src/app/welcome/page.tsx
src/components/CreateTripModal.tsx
src/components/CurrencyConverter.tsx
src/components/InteractivePricing.tsx
src/components/ItineraryBuilder.tsx
src/components/NotificationSettings.tsx
src/components/ShareTripModal.tsx
src/components/TemplateAnalytics.tsx
src/components/ThemeToggle.tsx
src/components/VersionDiff.tsx
src/components/WeatherWidget.tsx
src/components/admin/ConvertProposalModal.tsx
src/components/admin/ProposalAddOnsManager.tsx
src/components/analytics/PostHogProvider.tsx
src/components/analytics/RevenueChart.tsx
src/components/assistant/ConversationHistory.tsx
src/components/assistant/TourAssistantChat.tsx
src/components/assistant/TourAssistantPresentation.tsx
src/components/assistant/UsageDashboard.tsx
src/components/assistant/tour-assistant-helpers.tsx
src/components/billing/PricingCard.tsx
src/components/billing/UpgradeModal.tsx
src/components/bookings/FlightSearch.tsx
src/components/bookings/HotelSearch.tsx
src/components/bookings/LocationAutocomplete.tsx
src/components/client/ProposalAddOnsSelector.tsx
src/components/dashboard/ActionQueue.tsx
src/components/dashboard/ActionQueuePanels.tsx
src/components/dashboard/ActivityFeed.tsx
src/components/dashboard/InfrastructureHealth.tsx
src/components/dashboard/InlineActionPanel.tsx
src/components/dashboard/KPICard.tsx
src/components/dashboard/NotificationBell.tsx
src/components/dashboard/QuickActions.tsx
src/components/dashboard/RevenueKPICard.tsx
src/components/dashboard/SystemHealth.tsx
src/components/dashboard/TaskRow.tsx
src/components/dashboard/TodaysTimeline.tsx
src/components/dashboard/WhatsAppDashboardPreview.tsx
src/components/dashboard/action-queue-types.ts
src/components/demo/DemoEmptyState.tsx
src/components/demo/DemoModeBanner.tsx
src/components/demo/DemoModeGuard.tsx
src/components/demo/DemoModeToggle.tsx
src/components/demo/DemoTour.tsx
src/components/demo/FeatureCallout.tsx
src/components/demo/WelcomeModal.tsx
src/components/forms/SearchableCreatableMultiSelect.tsx
src/components/glass/GlassBadge.tsx
src/components/glass/GlassButton.tsx
src/components/glass/GlassCard.tsx
src/components/glass/GlassInput.tsx
src/components/glass/GlassModal.tsx
src/components/glass/GlassNavBar.tsx
src/components/glass/GlassSkeleton.tsx
src/components/glass/QuickQuoteModal.tsx
src/components/god-mode/ConfirmDangerModal.tsx
src/components/god-mode/DrillDownTable.tsx
src/components/god-mode/GodModeShell.tsx
src/components/god-mode/GodModeSidebar.tsx
src/components/god-mode/KpiCard.tsx
src/components/god-mode/KpiGrid.tsx
src/components/god-mode/SlideOutPanel.tsx
src/components/god-mode/StackedCostChart.tsx
src/components/god-mode/StatCard.tsx
src/components/god-mode/StatusDot.tsx
src/components/god-mode/TimeRangePicker.tsx
src/components/god-mode/ToggleSwitch.tsx
src/components/god-mode/TrendChart.tsx
src/components/import/ImportPreview.tsx
src/components/india/GSTInvoice.tsx
src/components/india/UPIPaymentModal.tsx
src/components/itinerary-templates/BentoJourneyView.tsx
src/components/itinerary-templates/LuxuryResortView.tsx
src/components/itinerary-templates/ProfessionalView.tsx
src/components/itinerary-templates/SafariStoryView.tsx
src/components/itinerary-templates/TemplateSwitcher.tsx
src/components/itinerary-templates/UrbanBriefView.tsx
src/components/itinerary-templates/VisualJourneyView.tsx
src/components/itinerary-templates/index.ts
src/components/itinerary-templates/types.ts
src/components/itinerary/ProfessionalItineraryView.tsx
src/components/layout/AdminLayout.tsx
src/components/layout/AppShell.tsx
src/components/layout/ClientHeader.tsx
src/components/layout/CommandMenu.tsx
src/components/layout/CommandPalette.tsx
src/components/layout/FloatingActionButton.tsx
src/components/layout/GlobalShortcuts.tsx
src/components/layout/MobileNav.tsx
src/components/layout/NavHeader.tsx
src/components/layout/Sidebar.tsx
src/components/layout/TopBar.tsx
src/components/layout/useNavCounts.ts
src/components/leads/LeadToBookingFlow.tsx
src/components/leads/SmartLeadCard.tsx
src/components/map/ClientItineraryMap.tsx
src/components/map/ItineraryMap.tsx
src/components/map/MapDemo.tsx
src/components/payments/PaymentLinkButton.tsx
src/components/payments/PaymentTracker.tsx
src/components/payments/RazorpayModal.tsx
src/components/pdf/DownloadPDFButton.tsx
src/components/pdf/InvoiceDocument.tsx
src/components/pdf/ItineraryDocument.tsx
src/components/pdf/OperatorScorecardDocument.tsx
src/components/pdf/PDFDownloadButton.tsx
src/components/pdf/ProposalDocument.tsx
src/components/pdf/ProposalPDFButton.tsx
src/components/pdf/itinerary-pdf.tsx
src/components/pdf/itinerary-types.ts
src/components/pdf/templates/ItineraryTemplatePages.tsx
src/components/pdf/templates/ProfessionalTemplate.tsx
src/components/planner/ApprovalManager.tsx
src/components/planner/LogisticsManager.tsx
src/components/planner/PlannerTabs.tsx
src/components/planner/PricingManager.tsx
src/components/portal/PortalInstallPrompt.tsx
src/components/portal/PortalItinerary.tsx
src/components/portal/PortalPayment.tsx
src/components/portal/PortalReview.tsx
src/components/proposals/ESignature.tsx
src/components/providers/AppProviders.tsx
src/components/providers/query-provider.tsx
src/components/pwa/ServiceWorkerRegistrar.tsx
src/components/settings/InviteModal.tsx
src/components/settings/LanguageToggle.tsx
src/components/settings/TeamMemberCard.tsx
src/components/social/templates/layouts/BottomLayout.tsx
src/components/social/templates/layouts/CenterLayout.tsx
src/components/social/templates/layouts/ElegantLayout.tsx
src/components/social/templates/layouts/GalleryLayouts.tsx
src/components/social/templates/layouts/InfoSplitLayout.tsx
src/components/social/templates/layouts/LayoutRenderer.tsx
src/components/social/templates/layouts/PosterFooter.tsx
src/components/social/templates/layouts/PremiumLayouts.tsx
src/components/social/templates/layouts/ReviewLayout.tsx
src/components/social/templates/layouts/ServiceLayouts.tsx
src/components/social/templates/layouts/SplitLayout.tsx
src/components/social/templates/layouts/StyleLayouts.tsx
src/components/social/templates/layouts/ThemeDecorations.tsx
src/components/social/templates/layouts/layout-helpers.ts
src/components/templates/ItineraryTemplateClassic.tsx
src/components/templates/ItineraryTemplateModern.tsx
src/components/templates/TemplateRegistry.ts
src/components/templates/types.ts
src/components/trips/ConflictWarning.tsx
src/components/trips/GroupManager.tsx
src/components/trips/GroupManagerModals.tsx
src/components/trips/TripTemplates.tsx
src/components/trips/group-manager-shared.tsx
src/components/ui/AppImage.tsx
src/components/ui/Breadcrumbs.tsx
src/components/ui/EmptyState.tsx
src/components/ui/ErrorSection.tsx
src/components/ui/avatar.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/dialog.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/components/ui/map.tsx
src/components/ui/map/index.ts
src/components/ui/map/map-controls.tsx
src/components/ui/map/map-core.tsx
src/components/ui/map/map-layers.tsx
src/components/ui/map/map-markers.tsx
src/components/ui/map/map-utils.ts
src/components/ui/select.tsx
src/components/ui/separator.tsx
src/components/ui/skeleton.tsx
src/components/ui/skeletons/DashboardSkeleton.tsx
src/components/ui/skeletons/InboxSkeleton.tsx
src/components/ui/skeletons/ReviewSkeleton.tsx
src/components/ui/skeletons/SkeletonCard.tsx
src/components/ui/skeletons/TableSkeleton.tsx
src/components/ui/tabs.tsx
src/components/ui/textarea.tsx
src/components/ui/toast.tsx
src/components/whatsapp/ActionPickerModal.tsx
src/components/whatsapp/AutomationRules.tsx
src/components/whatsapp/CannedResponses.tsx
src/components/whatsapp/ContextActionModal.tsx
src/components/whatsapp/MessageThread.tsx
src/components/whatsapp/UnifiedInbox.tsx
src/components/whatsapp/UnifiedInboxContextPanel.tsx
src/components/whatsapp/WhatsAppConnectModal.tsx
src/components/whatsapp/action-picker/ActionPickerModal.tsx
src/components/whatsapp/action-picker/DriverPicker.tsx
src/components/whatsapp/action-picker/ItineraryPicker.tsx
src/components/whatsapp/action-picker/LocationRequestPicker.tsx
src/components/whatsapp/action-picker/PaymentPicker.tsx
src/components/whatsapp/action-picker/index.ts
src/components/whatsapp/action-picker/shared.ts
src/components/whatsapp/inbox-mock-data.ts
src/components/whatsapp/unified-inbox-shared.tsx
src/components/whatsapp/useSmartReplySuggestions.ts
src/components/whatsapp/whatsapp.types.ts
src/emails/BaseEmail.tsx
src/emails/BookingConfirmation.tsx
src/emails/OperatorScorecard.tsx
src/emails/PaymentReceipt.tsx
src/emails/ProposalApproved.tsx
src/emails/ProposalRejected.tsx
src/emails/ProposalSent.tsx
src/emails/TeamInvite.tsx
src/env.ts
src/features/admin/analytics/AdminAnalyticsView.tsx
src/features/admin/analytics/types.ts
src/features/admin/analytics/useAdminAnalytics.ts
src/features/admin/billing/BillingView.tsx
src/features/admin/billing/plans.ts
src/features/admin/billing/useBillingData.ts
src/features/admin/dashboard/DateRangePicker.tsx
src/features/admin/dashboard/FunnelWidget.tsx
src/features/admin/dashboard/TopCustomersWidget.tsx
src/features/admin/dashboard/TopDestinationsWidget.tsx
src/features/admin/dashboard/types.ts
src/features/admin/invoices/InvoiceCreateForm.tsx
src/features/admin/invoices/InvoiceListPanel.tsx
src/features/admin/invoices/InvoiceLivePreview.tsx
src/features/admin/invoices/constants.ts
src/features/admin/invoices/helpers.ts
src/features/admin/invoices/types.ts
src/features/admin/invoices/useInvoiceDraft.ts
src/features/admin/pricing/components/CategoryBreakdownChart.tsx
src/features/admin/pricing/components/MonthlyTripTable.tsx
src/features/admin/pricing/components/OverheadExpensesCard.tsx
src/features/admin/pricing/components/PricingKpiCards.tsx
src/features/admin/pricing/components/ProfitTrendChart.tsx
src/features/admin/pricing/components/TransactionDetailPanel.tsx
src/features/admin/pricing/components/TransactionLedger.tsx
src/features/admin/pricing/components/TripCostEditor.tsx
src/features/admin/pricing/types.ts
src/features/admin/pricing/useOverheads.ts
src/features/admin/pricing/usePricingDashboard.ts
src/features/admin/pricing/useTransactions.ts
src/features/admin/pricing/useTripCosts.ts
src/features/admin/revenue/AdminRevenueView.tsx
src/features/admin/revenue/useAdminRevenue.ts
src/features/calendar/AddEventModal.tsx
src/features/calendar/AllDayEventsBar.tsx
src/features/calendar/BlockDatesModal.tsx
src/features/calendar/CalendarCommandCenter.tsx
src/features/calendar/CalendarEmptyState.tsx
src/features/calendar/CalendarFilters.tsx
src/features/calendar/CalendarHeader.tsx
src/features/calendar/CalendarLegend.tsx
src/features/calendar/CalendarSkeleton.tsx
src/features/calendar/DayCell.tsx
src/features/calendar/DayDrawer.tsx
src/features/calendar/DayEventRow.tsx
src/features/calendar/DayView.tsx
src/features/calendar/EventChip.tsx
src/features/calendar/EventDetailModal.tsx
src/features/calendar/MonthView.tsx
src/features/calendar/TimeGridEvent.tsx
src/features/calendar/WeekTimeGrid.tsx
src/features/calendar/WeekView.tsx
src/features/calendar/availability.ts
src/features/calendar/constants.ts
src/features/calendar/details/ConciergeEventDetail.tsx
src/features/calendar/details/InvoiceEventDetail.tsx
src/features/calendar/details/PaymentEventDetail.tsx
src/features/calendar/details/PersonalEventDetail.tsx
src/features/calendar/details/ProposalEventDetail.tsx
src/features/calendar/details/SocialPostEventDetail.tsx
src/features/calendar/details/TripEventDetail.tsx
src/features/calendar/types.ts
src/features/calendar/useCalendarActions.ts
src/features/calendar/useCalendarAvailability.ts
src/features/calendar/useCalendarEvents.ts
src/features/calendar/utils.ts
src/features/trip-detail/TripDetailHeader.tsx
src/features/trip-detail/TripDetailTabBar.tsx
src/features/trip-detail/components/TripAccommodationCard.tsx
src/features/trip-detail/components/TripActivityList.tsx
src/features/trip-detail/components/TripAddOnsEditor.tsx
src/features/trip-detail/components/TripClientCard.tsx
src/features/trip-detail/components/TripDriverCard.tsx
src/features/trip-detail/components/TripFinancialSummary.tsx
src/features/trip-detail/components/TripFlightDetails.tsx
src/features/trip-detail/components/TripInvoiceSection.tsx
src/features/trip-detail/components/TripNotificationHistory.tsx
src/features/trip-detail/components/TripStatusSidebar.tsx
src/features/trip-detail/tabs/ClientCommsTab.tsx
src/features/trip-detail/tabs/FinancialsTab.tsx
src/features/trip-detail/tabs/ItineraryTab.tsx
src/features/trip-detail/tabs/OverviewTab.tsx
src/features/trip-detail/types.ts
src/features/trip-detail/utils.ts
src/hooks/useRealtimeProposal.ts
src/hooks/useRealtimeUpdates.ts
src/hooks/useShortcuts.ts
src/hooks/useUserTimezone.ts
src/lib/activities/reorder.ts
src/lib/admin/action-queue.ts
src/lib/admin/dashboard-metrics.ts
src/lib/admin/date-range.ts
src/lib/admin/insights.ts
src/lib/admin/operator-scorecard-delivery.ts
src/lib/admin/operator-scorecard.ts
src/lib/ai/cost-guardrails.ts
src/lib/ai/gemini.server.ts
src/lib/ai/upsell-engine.ts
src/lib/airport.ts
src/lib/analytics/adapters.ts
src/lib/analytics/drill-through-loaders.ts
src/lib/analytics/events.ts
src/lib/analytics/server.ts
src/lib/analytics/template-analytics.ts
src/lib/api-dispatch.ts
src/lib/api-response.ts
src/lib/api/response.ts
src/lib/assistant/actions/reads/clients.ts
src/lib/assistant/actions/reads/dashboard.ts
src/lib/assistant/actions/reads/drivers.ts
src/lib/assistant/actions/reads/invoices.ts
src/lib/assistant/actions/reads/preferences.ts
src/lib/assistant/actions/reads/proposals.ts
src/lib/assistant/actions/reads/reports.ts
src/lib/assistant/actions/reads/trips.ts
src/lib/assistant/actions/registry.ts
src/lib/assistant/actions/writes/clients.ts
src/lib/assistant/actions/writes/invoices.ts
src/lib/assistant/actions/writes/notifications.ts
src/lib/assistant/actions/writes/preferences.ts
src/lib/assistant/actions/writes/proposals.ts
src/lib/assistant/actions/writes/trips.ts
src/lib/assistant/alert-preferences.ts
src/lib/assistant/alerts.ts
src/lib/assistant/anomaly-detector.ts
src/lib/assistant/audit.ts
src/lib/assistant/briefing.ts
src/lib/assistant/channel-adapters/whatsapp.ts
src/lib/assistant/context-engine.ts
src/lib/assistant/conversation-memory.ts
src/lib/assistant/conversation-store.ts
src/lib/assistant/date-parser.ts
src/lib/assistant/direct-executor.ts
src/lib/assistant/export.ts
src/lib/assistant/guardrails.ts
src/lib/assistant/model-router.ts
src/lib/assistant/orchestrator.ts
src/lib/assistant/preferences.ts
src/lib/assistant/prompts/system.ts
src/lib/assistant/response-cache.ts
src/lib/assistant/schema-router.ts
src/lib/assistant/semantic-response-cache.ts
src/lib/assistant/session.ts
src/lib/assistant/suggested-actions.ts
src/lib/assistant/types.ts
src/lib/assistant/usage-meter.ts
src/lib/assistant/weekly-digest.ts
src/lib/assistant/workflows/definitions.ts
src/lib/assistant/workflows/engine.ts
src/lib/auth/admin-helpers.ts
src/lib/auth/admin.ts
src/lib/auth/demo-org-resolver.ts
src/lib/auth/require-super-admin.ts
src/lib/billing/credit-packs.ts
src/lib/billing/outcome-upgrade.ts
src/lib/billing/plan-catalog.ts
src/lib/billing/tiers.ts
src/lib/business/selects.ts
src/lib/cache/upstash.ts
src/lib/config/env.ts
src/lib/cost/alert-ack.ts
src/lib/cost/overview-cache.ts
src/lib/cost/spend-guardrails.ts
src/lib/database.types.ts
src/lib/date/tz.ts
src/lib/demo/constants.ts
src/lib/demo/data/clients.ts
src/lib/demo/data/index.ts
src/lib/demo/data/notifications.ts
src/lib/demo/data/proposals.ts
src/lib/demo/data/tasks.ts
src/lib/demo/data/trips.ts
src/lib/demo/demo-mode-context.tsx
src/lib/demo/use-demo-fetch.ts
src/lib/email.ts
src/lib/email/notifications.tsx
src/lib/email/resend.ts
src/lib/email/send.ts
src/lib/embeddings-v2.ts
src/lib/embeddings.ts
src/lib/external/amadeus.ts
src/lib/external/currency.ts
src/lib/external/google.server.ts
src/lib/external/linkedin.server.ts
src/lib/external/tripadvisor.server.ts
src/lib/external/weather.ts
src/lib/external/whatsapp.ts
src/lib/external/wikimedia.ts
src/lib/funnel/track.ts
src/lib/geocoding-with-cache.ts
src/lib/geocoding.ts
src/lib/i18n/hindi.ts
src/lib/image-search.ts
src/lib/import/pdf-extractor.ts
src/lib/import/types.ts
src/lib/import/url-scraper.ts
src/lib/india/destinations.ts
src/lib/india/formats.ts
src/lib/india/gst.ts
src/lib/india/pricing.ts
src/lib/integrations.ts
src/lib/invoices/module.ts
src/lib/invoices/public-link.ts
src/lib/itinerary-cache.ts
src/lib/leads/intent-parser.ts
src/lib/leads/types.ts
src/lib/marketplace-emails.ts
src/lib/marketplace-listing-plans.ts
src/lib/marketplace-options.ts
src/lib/marketplace-verify-cache.ts
src/lib/marketplace/selects.ts
src/lib/network/retry.ts
src/lib/notification-templates.ts
src/lib/notifications.shared.ts
src/lib/notifications.ts
src/lib/notifications/browser-push.ts
src/lib/observability/logger.ts
src/lib/observability/metrics.ts
src/lib/payments/customer-service.ts
src/lib/payments/errors.ts
src/lib/payments/invoice-service.ts
src/lib/payments/link-tracker.ts
src/lib/payments/order-service.ts
src/lib/payments/payment-links.server.ts
src/lib/payments/payment-links.ts
src/lib/payments/payment-logger.ts
src/lib/payments/payment-notifications.ts
src/lib/payments/payment-receipt-config.ts
src/lib/payments/payment-service.ts
src/lib/payments/payment-types.ts
src/lib/payments/payment-utils.ts
src/lib/payments/razorpay.ts
src/lib/payments/subscription-service.ts
src/lib/payments/webhook-handlers.ts
src/lib/pdf-extractor.ts
src/lib/pdf/proposal-pdf.tsx
src/lib/platform/audit.ts
src/lib/platform/settings.ts
src/lib/proposal-notifications.ts
src/lib/proposals/types.ts
src/lib/pwa/offline-mutations.ts
src/lib/queries/analytics.ts
src/lib/queries/clients.ts
src/lib/queries/dashboard-tasks.ts
src/lib/queries/dashboard.ts
src/lib/queries/itineraries.ts
src/lib/queries/proposals.ts
src/lib/queries/referrals.ts
src/lib/queries/support.ts
src/lib/queries/trip-detail.ts
src/lib/queries/trips.ts
src/lib/rag-itinerary.ts
src/lib/reputation/campaign-trigger.ts
src/lib/reputation/constants.ts
src/lib/reputation/db.ts
src/lib/reputation/referral-flywheel.ts
src/lib/reputation/review-marketing-renderer.server.ts
src/lib/reputation/review-marketing.server.ts
src/lib/reputation/score-calculator.ts
src/lib/reputation/selects.ts
src/lib/reputation/types.ts
src/lib/security/admin-bearer-auth.ts
src/lib/security/admin-mutation-csrf.ts
src/lib/security/cost-endpoint-guard.ts
src/lib/security/cron-auth.ts
src/lib/security/diagnostics-auth.ts
src/lib/security/mock-endpoint-guard.ts
src/lib/security/public-rate-limit.ts
src/lib/security/rate-limit.ts
src/lib/security/safe-equal.ts
src/lib/security/safe-error.ts
src/lib/security/sanitize.ts
src/lib/security/service-role-auth.ts
src/lib/security/social-oauth-state.ts
src/lib/security/social-token-crypto.ts
src/lib/security/whatsapp-webhook-config.ts
src/lib/semantic-cache.ts
src/lib/share/public-trip.ts
src/lib/shared-itinerary-cache.ts
src/lib/social/ai-prompts.ts
src/lib/social/color-utils.ts
src/lib/social/destination-images.ts
src/lib/social/fonts.ts
src/lib/social/indian-calendar.ts
src/lib/social/poster-background.ts
src/lib/social/poster-composer.ts
src/lib/social/poster-generic-footer.ts
src/lib/social/poster-layout-configs.ts
src/lib/social/poster-multi-image.ts
src/lib/social/poster-premium-blocks.ts
src/lib/social/poster-premium-layouts-a.ts
src/lib/social/poster-premium-layouts-b.ts
src/lib/social/poster-renderer-types.ts
src/lib/social/poster-renderer.ts
src/lib/social/poster-shapes.ts
src/lib/social/poster-standard-blocks.ts
src/lib/social/review-queue.server.ts
src/lib/social/selects.ts
src/lib/social/template-registry.ts
src/lib/social/template-selector.ts
src/lib/social/template-utils.ts
src/lib/social/templates-content.ts
src/lib/social/templates-destination-gallery.ts
src/lib/social/templates-destination.ts
src/lib/social/templates-festival.ts
src/lib/social/templates-packages.ts
src/lib/social/templates-promotion.ts
src/lib/social/templates-season.ts
src/lib/social/types.ts
src/lib/subscriptions/limits.ts
src/lib/supabase/admin.ts
src/lib/supabase/client.ts
src/lib/supabase/env.ts
src/lib/supabase/middleware.ts
src/lib/supabase/server.ts
src/lib/supabase/types.ts
src/lib/tax/gst-calculator.ts
src/lib/team/roles.ts
src/lib/tour-templates/selects.ts
src/lib/travel/selects.ts
src/lib/trips/conflict-detection.ts
src/lib/utils.ts
src/lib/whatsapp-waha.server.ts
src/lib/whatsapp.server.ts
src/lib/whatsapp/chatbot-flow.ts
src/lib/whatsapp/india-templates.ts
src/lib/whatsapp/proposal-drafts.server.ts
src/lib/whatsapp/session-health.ts
src/middleware.ts
src/stores/onboarding-store.ts
src/stores/ui-store.ts
src/styles/design-system.ts
src/styles/print.css
src/types/feedback.ts
src/types/itinerary.ts
```

## Raw Inventories

### Route files under `src/app` (264)
```text
src/app/api/[...path]/route.ts
src/app/api/_handlers/add-ons/[id]/route.ts
src/app/api/_handlers/add-ons/route.ts
src/app/api/_handlers/add-ons/stats/route.ts
src/app/api/_handlers/admin/cache-metrics/route.ts
src/app/api/_handlers/admin/clear-cache/route.ts
src/app/api/_handlers/admin/clients/route.ts
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts
src/app/api/_handlers/admin/contacts/route.ts
src/app/api/_handlers/admin/cost/alerts/ack/route.ts
src/app/api/_handlers/admin/cost/overview/route.ts
src/app/api/_handlers/admin/dashboard/stats/route.ts
src/app/api/_handlers/admin/destinations/route.ts
src/app/api/_handlers/admin/funnel/route.ts
src/app/api/_handlers/admin/generate-embeddings/route.ts
src/app/api/_handlers/admin/geocoding/usage/route.ts
src/app/api/_handlers/admin/insights/action-queue/route.ts
src/app/api/_handlers/admin/insights/ai-usage/route.ts
src/app/api/_handlers/admin/insights/auto-requote/route.ts
src/app/api/_handlers/admin/insights/batch-jobs/route.ts
src/app/api/_handlers/admin/insights/best-quote/route.ts
src/app/api/_handlers/admin/insights/daily-brief/route.ts
src/app/api/_handlers/admin/insights/margin-leak/route.ts
src/app/api/_handlers/admin/insights/ops-copilot/route.ts
src/app/api/_handlers/admin/insights/proposal-risk/route.ts
src/app/api/_handlers/admin/insights/roi/route.ts
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts
src/app/api/_handlers/admin/insights/win-loss/route.ts
src/app/api/_handlers/admin/leads/[id]/route.ts
src/app/api/_handlers/admin/leads/route.ts
src/app/api/_handlers/admin/ltv/route.ts
src/app/api/_handlers/admin/marketplace/verify/route.ts
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts
src/app/api/_handlers/admin/notifications/delivery/route.ts
src/app/api/_handlers/admin/operations/command-center/route.ts
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts
src/app/api/_handlers/admin/pdf-imports/route.ts
src/app/api/_handlers/admin/pdf-imports/upload/route.ts
src/app/api/_handlers/admin/pricing/dashboard/route.ts
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts
src/app/api/_handlers/admin/pricing/overheads/route.ts
src/app/api/_handlers/admin/pricing/transactions/route.ts
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts
src/app/api/_handlers/admin/pricing/trip-costs/route.ts
src/app/api/_handlers/admin/pricing/trips/route.ts
src/app/api/_handlers/admin/pricing/vendor-history/route.ts
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts
src/app/api/_handlers/admin/referrals/route.ts
src/app/api/_handlers/admin/reports/destinations/route.ts
src/app/api/_handlers/admin/reports/gst/route.ts
src/app/api/_handlers/admin/reports/operators/route.ts
src/app/api/_handlers/admin/reputation/client-referrals/route.ts
src/app/api/_handlers/admin/revenue/route.ts
src/app/api/_handlers/admin/security/diagnostics/route.ts
src/app/api/_handlers/admin/seed-demo/route.ts
src/app/api/_handlers/admin/social/generate/route.ts
src/app/api/_handlers/admin/tour-templates/extract/route.ts
src/app/api/_handlers/admin/trips/[id]/clone/route.ts
src/app/api/_handlers/admin/trips/[id]/route.ts
src/app/api/_handlers/admin/trips/route.ts
src/app/api/_handlers/admin/whatsapp/health/route.ts
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts
src/app/api/_handlers/admin/workflow/events/route.ts
src/app/api/_handlers/admin/workflow/rules/route.ts
src/app/api/_handlers/ai/draft-review-response/route.ts
src/app/api/_handlers/ai/pricing-suggestion/route.ts
src/app/api/_handlers/ai/suggest-reply/route.ts
src/app/api/_handlers/assistant/chat/route.ts
src/app/api/_handlers/assistant/chat/stream/route.ts
src/app/api/_handlers/assistant/confirm/route.ts
src/app/api/_handlers/assistant/conversations/[sessionId]/route.ts
src/app/api/_handlers/assistant/conversations/route.ts
src/app/api/_handlers/assistant/export/route.ts
src/app/api/_handlers/assistant/quick-prompts/route.ts
src/app/api/_handlers/assistant/usage/route.ts
src/app/api/_handlers/auth/password-login/route.ts
src/app/api/_handlers/billing/contact-sales/route.ts
src/app/api/_handlers/billing/subscription/route.ts
src/app/api/_handlers/bookings/[id]/invoice/route.ts
src/app/api/_handlers/bookings/flights/search/route.ts
src/app/api/_handlers/bookings/hotels/search/route.ts
src/app/api/_handlers/bookings/locations/search/route.ts
src/app/api/_handlers/calendar/events/route.ts
src/app/api/_handlers/cron/assistant-alerts/route.ts
src/app/api/_handlers/cron/assistant-briefing/route.ts
src/app/api/_handlers/cron/assistant-digest/route.ts
src/app/api/_handlers/cron/operator-scorecards/route.ts
src/app/api/_handlers/cron/reputation-campaigns/route.ts
src/app/api/_handlers/currency/route.ts
src/app/api/_handlers/dashboard/schedule/route.ts
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts
src/app/api/_handlers/dashboard/tasks/route.ts
src/app/api/_handlers/debug/route.ts
src/app/api/_handlers/drivers/search/route.ts
src/app/api/_handlers/emails/welcome/route.ts
src/app/api/_handlers/health/route.ts
src/app/api/_handlers/images/pexels/route.ts
src/app/api/_handlers/images/pixabay/route.ts
src/app/api/_handlers/images/route.ts
src/app/api/_handlers/images/unsplash/route.ts
src/app/api/_handlers/integrations/places/route.ts
src/app/api/_handlers/integrations/tripadvisor/route.ts
src/app/api/_handlers/invoices/[id]/pay/route.ts
src/app/api/_handlers/invoices/[id]/route.ts
src/app/api/_handlers/invoices/route.ts
src/app/api/_handlers/invoices/send-pdf/route.ts
src/app/api/_handlers/itineraries/[id]/bookings/route.ts
src/app/api/_handlers/itineraries/[id]/feedback/route.ts
src/app/api/_handlers/itineraries/[id]/route.ts
src/app/api/_handlers/itineraries/route.ts
src/app/api/_handlers/itinerary/generate/route.ts
src/app/api/_handlers/itinerary/import/pdf/route.ts
src/app/api/_handlers/itinerary/import/url/route.ts
src/app/api/_handlers/itinerary/share/route.ts
src/app/api/_handlers/leads/convert/route.ts
src/app/api/_handlers/location/cleanup-expired/route.ts
src/app/api/_handlers/location/client-share/route.ts
src/app/api/_handlers/location/live/[token]/route.ts
src/app/api/_handlers/location/ping/route.ts
src/app/api/_handlers/location/share/route.ts
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts
src/app/api/_handlers/marketplace/[id]/reviews/route.ts
src/app/api/_handlers/marketplace/[id]/view/route.ts
src/app/api/_handlers/marketplace/inquiries/route.ts
src/app/api/_handlers/marketplace/listing-subscription/route.ts
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts
src/app/api/_handlers/marketplace/options/route.ts
src/app/api/_handlers/marketplace/route.ts
src/app/api/_handlers/marketplace/stats/route.ts
src/app/api/_handlers/nav/counts/route.ts
src/app/api/_handlers/notifications/client-landed/route.ts
src/app/api/_handlers/notifications/process-queue/route.ts
src/app/api/_handlers/notifications/retry-failed/route.ts
src/app/api/_handlers/notifications/schedule-followups/route.ts
src/app/api/_handlers/notifications/send/route.ts
src/app/api/_handlers/onboarding/first-value/route.ts
src/app/api/_handlers/onboarding/setup/route.ts
src/app/api/_handlers/payments/create-order/route.ts
src/app/api/_handlers/payments/links/[token]/route.ts
src/app/api/_handlers/payments/links/route.ts
src/app/api/_handlers/payments/razorpay/route.ts
src/app/api/_handlers/payments/track/[token]/route.ts
src/app/api/_handlers/payments/verify/route.ts
src/app/api/_handlers/payments/webhook/route.ts
src/app/api/_handlers/portal/[token]/route.ts
src/app/api/_handlers/proposals/[id]/convert/route.ts
src/app/api/_handlers/proposals/[id]/pdf/route.ts
src/app/api/_handlers/proposals/[id]/send/route.ts
src/app/api/_handlers/proposals/bulk/route.ts
src/app/api/_handlers/proposals/create/route.ts
src/app/api/_handlers/proposals/public/[token]/route.ts
src/app/api/_handlers/proposals/send-pdf/route.ts
src/app/api/_handlers/reputation/ai/analyze/route.ts
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts
src/app/api/_handlers/reputation/ai/respond/route.ts
src/app/api/_handlers/reputation/analytics/snapshot/route.ts
src/app/api/_handlers/reputation/analytics/topics/route.ts
src/app/api/_handlers/reputation/analytics/trends/route.ts
src/app/api/_handlers/reputation/brand-voice/route.ts
src/app/api/_handlers/reputation/campaigns/[id]/route.ts
src/app/api/_handlers/reputation/campaigns/route.ts
src/app/api/_handlers/reputation/campaigns/trigger/route.ts
src/app/api/_handlers/reputation/connections/route.ts
src/app/api/_handlers/reputation/dashboard/route.ts
src/app/api/_handlers/reputation/nps/[token]/route.ts
src/app/api/_handlers/reputation/nps/submit/route.ts
src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route.ts
src/app/api/_handlers/reputation/reviews/[id]/route.ts
src/app/api/_handlers/reputation/reviews/route.ts
src/app/api/_handlers/reputation/sync/route.ts
src/app/api/_handlers/reputation/widget/[token]/route.ts
src/app/api/_handlers/reputation/widget/config/route.ts
src/app/api/_handlers/settings/integrations/route.ts
src/app/api/_handlers/settings/marketplace/route.ts
src/app/api/_handlers/settings/team/[id]/resend/route.ts
src/app/api/_handlers/settings/team/[id]/route.ts
src/app/api/_handlers/settings/team/invite/route.ts
src/app/api/_handlers/settings/team/route.ts
src/app/api/_handlers/settings/upi/route.ts
src/app/api/_handlers/share/[token]/route.ts
src/app/api/_handlers/social/ai-image/route.ts
src/app/api/_handlers/social/ai-poster/route.ts
src/app/api/_handlers/social/captions/route.ts
src/app/api/_handlers/social/connections/[id]/route.ts
src/app/api/_handlers/social/connections/route.ts
src/app/api/_handlers/social/extract/route.ts
src/app/api/_handlers/social/oauth/callback/route.ts
src/app/api/_handlers/social/oauth/facebook/route.ts
src/app/api/_handlers/social/oauth/google/route.ts
src/app/api/_handlers/social/oauth/linkedin/route.ts
src/app/api/_handlers/social/posts/[id]/render/route.ts
src/app/api/_handlers/social/posts/route.ts
src/app/api/_handlers/social/process-queue/route.ts
src/app/api/_handlers/social/publish/route.ts
src/app/api/_handlers/social/refresh-tokens/route.ts
src/app/api/_handlers/social/render-poster/route.ts
src/app/api/_handlers/social/reviews/import/route.ts
src/app/api/_handlers/social/reviews/public/route.ts
src/app/api/_handlers/social/reviews/route.ts
src/app/api/_handlers/social/schedule/route.ts
src/app/api/_handlers/social/smart-poster/route.ts
src/app/api/_handlers/subscriptions/cancel/route.ts
src/app/api/_handlers/subscriptions/limits/route.ts
src/app/api/_handlers/subscriptions/route.ts
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts
src/app/api/_handlers/superadmin/announcements/[id]/route.ts
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts
src/app/api/_handlers/superadmin/announcements/route.ts
src/app/api/_handlers/superadmin/audit-log/route.ts
src/app/api/_handlers/superadmin/cost/aggregate/route.ts
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts
src/app/api/_handlers/superadmin/cost/trends/route.ts
src/app/api/_handlers/superadmin/me/route.ts
src/app/api/_handlers/superadmin/monitoring/health/route.ts
src/app/api/_handlers/superadmin/monitoring/queues/route.ts
src/app/api/_handlers/superadmin/overview/route.ts
src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts
src/app/api/_handlers/superadmin/referrals/overview/route.ts
src/app/api/_handlers/superadmin/settings/kill-switch/route.ts
src/app/api/_handlers/superadmin/settings/org-suspend/route.ts
src/app/api/_handlers/superadmin/settings/route.ts
src/app/api/_handlers/superadmin/support/tickets/[id]/respond/route.ts
src/app/api/_handlers/superadmin/support/tickets/[id]/route.ts
src/app/api/_handlers/superadmin/support/tickets/route.ts
src/app/api/_handlers/superadmin/users/[id]/route.ts
src/app/api/_handlers/superadmin/users/directory/route.ts
src/app/api/_handlers/superadmin/users/signups/route.ts
src/app/api/_handlers/support/route.ts
src/app/api/_handlers/test-geocoding/route.ts
src/app/api/_handlers/trips/[id]/add-ons/route.ts
src/app/api/_handlers/trips/[id]/clone/route.ts
src/app/api/_handlers/trips/[id]/invoices/route.ts
src/app/api/_handlers/trips/[id]/notifications/route.ts
src/app/api/_handlers/trips/[id]/route.ts
src/app/api/_handlers/trips/route.ts
src/app/api/_handlers/unsplash/route.ts
src/app/api/_handlers/weather/route.ts
src/app/api/_handlers/webhooks/waha/route.ts
src/app/api/_handlers/webhooks/whatsapp/route.ts
src/app/api/_handlers/whatsapp/broadcast/route.ts
src/app/api/_handlers/whatsapp/connect/route.ts
src/app/api/_handlers/whatsapp/conversations/route.ts
src/app/api/_handlers/whatsapp/disconnect/route.ts
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts
src/app/api/_handlers/whatsapp/health/route.ts
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts
src/app/api/_handlers/whatsapp/qr/route.ts
src/app/api/_handlers/whatsapp/send/route.ts
src/app/api/_handlers/whatsapp/status/route.ts
src/app/api/_handlers/whatsapp/test-message/route.ts
src/app/api/_handlers/whatsapp/webhook/route.ts
src/app/api/admin/[...path]/route.ts
src/app/api/assistant/[...path]/route.ts
src/app/api/availability/route.ts
src/app/api/reputation/[...path]/route.ts
src/app/api/social/[...path]/route.ts
src/app/api/superadmin/[...path]/route.ts
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts
src/app/api/whatsapp/proposal-drafts/[id]/route.ts
src/app/auth/callback/route.ts
src/app/auth/signout/route.ts
```

### Catch-all dispatcher declarations (6)
```text
src/app/api/social/[...path]/route.ts:5:const routes = createCatchAllHandlers([
src/app/api/[...path]/route.ts:5:const routes = createCatchAllHandlers([
src/app/api/assistant/[...path]/route.ts:5:const routes = createCatchAllHandlers([
src/app/api/admin/[...path]/route.ts:11:const routes = createCatchAllHandlers([
src/app/api/superadmin/[...path]/route.ts:14:const routes = createCatchAllHandlers([
src/app/api/reputation/[...path]/route.ts:5:const routes = createCatchAllHandlers([
```

### TS suppressions (0)
```text
_No hits._
```

### Explicit `any` occurrences (9)
```text
src/lib/payments/subscription-service.ts:220:    const updates: any = {
src/lib/payments/payment-logger.ts:19:  metadata: any; // eslint-disable-line @typescript-eslint/no-explicit-any
src/app/proposals/create/_hooks/useProposalData.ts:7:export function formatFeatureLimitError(payload: any, fallback: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
src/components/god-mode/TrendChart.tsx:57:        onClick: onClickBar ? (payload: any) => {
src/components/CreateTripModal.tsx:44:function formatFeatureLimitError(payload: any, fallback: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
src/app/api/_handlers/social/posts/route.ts:88:        const insertPayload: any = {
src/app/api/_handlers/integrations/places/route.ts:25:  supabaseAdmin: any,
src/app/api/_handlers/integrations/places/route.ts:42:  supabaseAdmin: any,
src/app/api/_handlers/superadmin/monitoring/health/route.ts:20:async function checkDatabase(client: any): Promise<{ status: "healthy" | "degraded" | "down"; latency_ms: number }> {
```

### Non-null assertions (157)
```text
src/app/(superadmin)/god/kill-switch/page.tsx:178:settings!.org_suspensions!
src/app/(superadmin)/god/kill-switch/page.tsx:178:settings!
src/app/(superadmin)/god/kill-switch/page.tsx:181:settings!.org_suspensions!
src/app/(superadmin)/god/kill-switch/page.tsx:181:settings!
src/app/(superadmin)/god/monitoring/page.tsx:172:queues!
src/app/admin/notifications/page.tsx:616:row.queue_id!
src/app/admin/tour-templates/[id]/page.tsx:463:accommodations[day.id].amenities!
src/app/admin/tour-templates/[id]/page.tsx:465:accommodations[day.id].amenities!
src/app/admin/trips/[id]/_components/utils.ts:169:optimizedActivities[0]!.start_time!
src/app/admin/trips/[id]/_components/utils.ts:169:optimizedActivities[0]!
src/app/admin/trips/[id]/_components/utils.ts:176:activity.start_time!
src/app/admin/trips/[id]/page.tsx:387:center!
src/app/api/_handlers/add-ons/stats/route.ts:87:addOnCounts.get(addOnId)!
src/app/api/_handlers/admin/clear-cache/route.ts:82:admin.organizationId!
src/app/api/_handlers/admin/dashboard/stats/route.ts:30:resolveScopedOrgWithDemo(req, admin.organizationId)!
src/app/api/_handlers/admin/leads/[id]/route.ts:58:admin.organizationId!
src/app/api/_handlers/admin/leads/[id]/route.ts:84:admin.organizationId!
src/app/api/_handlers/admin/leads/[id]/route.ts:118:nextStage!
src/app/api/_handlers/admin/leads/[id]/route.ts:126:admin.organizationId!
src/app/api/_handlers/admin/leads/[id]/route.ts:140:admin.organizationId!
src/app/api/_handlers/admin/leads/[id]/route.ts:149:nextStage!
src/app/api/_handlers/admin/leads/[id]/route.ts:152:admin.organizationId!
src/app/api/_handlers/admin/leads/route.ts:58:admin.organizationId!
src/app/api/_handlers/admin/leads/route.ts:128:admin.organizationId!
src/app/api/_handlers/admin/leads/route.ts:165:admin.organizationId!
src/app/api/_handlers/admin/leads/route.ts:176:admin.organizationId!
src/app/api/_handlers/admin/pricing/dashboard/route.ts:40:resolveScopedOrgWithDemo(req, admin.organizationId)!
src/app/api/_handlers/admin/pricing/overheads/route.ts:31:resolveScopedOrgWithDemo(req, admin.organizationId)!
src/app/api/_handlers/admin/pricing/transactions/route.ts:47:resolveScopedOrgWithDemo(req, admin.organizationId)!
src/app/api/_handlers/admin/pricing/transactions/route.ts:53:url.searchParams.get("sort")!
src/app/api/_handlers/ai/pricing-suggestion/route.ts:27:sorted[middle - 1]!
src/app/api/_handlers/ai/pricing-suggestion/route.ts:27:sorted[middle]!
src/app/api/_handlers/ai/pricing-suggestion/route.ts:29:sorted[middle]!
src/app/api/_handlers/billing/subscription/route.ts:40:organizationId!
src/app/api/_handlers/billing/subscription/route.ts:42:organizationId!
src/app/api/_handlers/billing/subscription/route.ts:43:organizationId!
src/app/api/_handlers/billing/subscription/route.ts:47:organizationId!
src/app/api/_handlers/billing/subscription/route.ts:51:organizationId!
src/app/api/_handlers/billing/subscription/route.ts:59:organizationId!
src/app/api/_handlers/dashboard/schedule/route.ts:97:auth.organizationId!
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:31:organizationId!
src/app/api/_handlers/dashboard/tasks/route.ts:310:organizationId!
src/app/api/_handlers/drivers/search/route.ts:44:auth.organizationId!
src/app/api/_handlers/health/route.ts:168:response!
src/app/api/_handlers/health/route.ts:212:response!
src/app/api/_handlers/health/route.ts:248:response!
src/app/api/_handlers/health/route.ts:272:weatherReq.response!
src/app/api/_handlers/health/route.ts:273:weatherReq.response!
src/app/api/_handlers/health/route.ts:280:currencyReq.response!
src/app/api/_handlers/health/route.ts:281:currencyReq.response!
src/app/api/_handlers/invoices/[id]/pay/route.ts:36:auth.organizationId!
src/app/api/_handlers/invoices/[id]/pay/route.ts:69:auth.organizationId!
src/app/api/_handlers/invoices/[id]/pay/route.ts:120:auth.organizationId!
src/app/api/_handlers/invoices/[id]/pay/route.ts:134:auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:67:auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:78:auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:118:auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:202:auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:243:auth.organizationId!
src/app/api/_handlers/invoices/[id]/route.ts:258:auth.organizationId!
src/app/api/_handlers/invoices/route.ts:45:auth.organizationId!
src/app/api/_handlers/invoices/route.ts:94:auth.organizationId!
src/app/api/_handlers/invoices/send-pdf/route.ts:56:auth.organizationId!
src/app/api/_handlers/notifications/process-queue/route.ts:75:i.trip_id!
src/app/api/_handlers/notifications/process-queue/route.ts:76:i.user_id!
src/app/api/_handlers/notifications/process-queue/route.ts:229:tripId!
src/app/api/_handlers/payments/create-order/route.ts:82:organizationId!
src/app/api/_handlers/payments/create-order/route.ts:102:organizationId!
src/app/api/_handlers/payments/create-order/route.ts:114:organizationId!
src/app/api/_handlers/payments/links/route.ts:52:organizationId!
src/app/api/_handlers/payments/links/route.ts:74:organizationId!
src/app/api/_handlers/payments/links/route.ts:90:organizationId!
src/app/api/_handlers/proposals/[id]/send/route.ts:245:admin.organizationId!
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:166:r.response_posted_at!
src/app/api/_handlers/reputation/dashboard/route.ts:143:auth.organizationId!
src/app/api/_handlers/settings/marketplace/route.ts:93:organizationId!
src/app/api/_handlers/settings/marketplace/route.ts:98:organizationId!
src/app/api/_handlers/settings/marketplace/route.ts:115:organizationId!
src/app/api/_handlers/settings/upi/route.ts:30:organizationId!
src/app/api/_handlers/settings/upi/route.ts:60:organizationId!
src/app/api/_handlers/subscriptions/cancel/route.ts:46:organizationId!
src/app/api/_handlers/subscriptions/route.ts:161:organizationId!
src/app/api/_handlers/subscriptions/route.ts:164:organizationId!
src/app/api/_handlers/subscriptions/route.ts:195:organizationId!
src/app/api/_handlers/whatsapp/broadcast/route.ts:105:organizationId!
src/app/api/_handlers/whatsapp/broadcast/route.ts:118:organizationId!
src/app/api/_handlers/whatsapp/connect/route.ts:47:organizationId!
src/app/api/_handlers/whatsapp/conversations/route.ts:51:organizationId!
src/app/api/_handlers/whatsapp/disconnect/route.ts:20:organizationId!
src/app/api/_handlers/whatsapp/disconnect/route.ts:25:organizationId!
src/app/api/_handlers/whatsapp/disconnect/route.ts:39:organizationId!
src/app/api/_handlers/whatsapp/health/route.ts:16:organizationId!
src/app/api/_handlers/whatsapp/qr/route.ts:17:organizationId!
src/app/api/_handlers/whatsapp/qr/route.ts:22:organizationId!
src/app/api/_handlers/whatsapp/send/route.ts:32:organizationId!
src/app/api/_handlers/whatsapp/status/route.ts:19:organizationId!
src/app/api/_handlers/whatsapp/test-message/route.ts:20:organizationId!
src/app/api/availability/route.ts:41:adminResult.organizationId!
src/app/api/availability/route.ts:91:admin.organizationId!
src/app/api/availability/route.ts:136:admin.organizationId!
src/app/drivers/page.tsx:252:formData.full_name!
src/app/drivers/page.tsx:253:formData.phone!
src/app/inbox/page.tsx:186:TARGET_OPTIONS.find((t) => t.key === state.target)!
src/app/planner/page.tsx:356:result!
src/app/planner/page.tsx:359:result!
src/app/planner/page.tsx:360:result!
src/app/planner/page.tsx:361:result!
src/app/planner/page.tsx:362:result!
src/app/planner/page.tsx:363:result!
src/app/planner/page.tsx:364:result!
src/app/planner/page.tsx:368:result!
src/app/planner/page.tsx:450:result!
src/app/planner/page.tsx:452:result!
src/app/planner/page.tsx:469:result!
src/app/planner/page.tsx:500:result!
src/app/planner/page.tsx:503:result!
src/app/planner/page.tsx:509:result!
src/app/reputation/_components/CompetitorBenchmark.tsx:124:c.latest_rating!
src/app/social/_components/SocialStudioClient.tsx:445:data.heroImage!
src/components/assistant/TourAssistantPresentation.tsx:349:msg.actionProposal!
src/components/assistant/TourAssistantPresentation.tsx:350:msg.actionProposal!
src/components/assistant/TourAssistantPresentation.tsx:366:msg.actionProposal!
src/components/assistant/TourAssistantPresentation.tsx:367:msg.actionProposal!
src/components/map/ItineraryMap.tsx:262:a.coordinates!
src/components/map/ItineraryMap.tsx:262:a.coordinates!
src/components/map/ItineraryMap.tsx:269:positions[i]!
src/components/map/ItineraryMap.tsx:368:act.coordinates!
src/components/map/ItineraryMap.tsx:368:act.coordinates!
src/components/map/ItineraryMap.tsx:390:driverLocation!
src/components/whatsapp/CannedResponses.tsx:151:groups[t.category]!
src/components/whatsapp/CannedResponses.tsx:328:templates!
src/components/whatsapp/useSmartReplySuggestions.ts:25:message.body!
src/features/admin/analytics/useAdminAnalytics.ts:144:monthMap.get(key)!
src/features/admin/analytics/useAdminAnalytics.ts:159:monthMap.get(key)!
src/features/admin/analytics/useAdminAnalytics.ts:168:monthMap.get(key)!
src/features/admin/analytics/useAdminAnalytics.ts:172:monthMap.get(key)!
src/features/admin/revenue/useAdminRevenue.ts:187:monthMap.get(monthKey)!
src/features/admin/revenue/useAdminRevenue.ts:188:monthMap.get(monthKey)!
src/features/admin/revenue/useAdminRevenue.ts:236:monthMap.get(key)!
src/features/calendar/DayDrawer.tsx:130:grouped.get(type)!
src/features/calendar/EventDetailModal.tsx:131:event.drillHref!
src/features/calendar/utils.ts:218:a.endDate!
src/features/calendar/utils.ts:219:b.endDate!
src/features/calendar/utils.ts:229:event.endDate!
src/features/trip-detail/tabs/ClientCommsTab.tsx:53:max!
src/features/trip-detail/tabs/OverviewTab.tsx:201:action.tab!
src/features/trip-detail/tabs/OverviewTab.tsx:230:max!
src/features/trip-detail/utils.ts:64:day.activities[0].start_time!
src/lib/admin/dashboard-metrics.ts:104:buckets.get(key)!
src/lib/admin/dashboard-metrics.ts:111:buckets.get(key)!
src/lib/admin/dashboard-metrics.ts:117:buckets.get(key)!
src/lib/admin/date-range.ts:116:safeDate(fallback.from)!
src/lib/admin/date-range.ts:117:safeDate(fallback.to)!
src/lib/assistant/actions/reads/clients.ts:181:row.profiles!
src/lib/image-search.ts:85:queue.shift()!
src/lib/social/review-queue.server.ts:110:input.templateId!
src/lib/social/review-queue.server.ts:195:input.scheduleDate!
```

### Loose equality occurrences (41)
```text
src/lib/notification-templates.ts:61:    if (value == null) return fallback;
src/lib/trips/conflict-detection.ts:85:    from.lat == null || from.lng == null ||
src/lib/trips/conflict-detection.ts:86:    to.lat == null || to.lng == null
src/components/whatsapp/ContextActionModal.tsx:535:    { icon: <Users className="w-3.5 h-3.5" />, label: 'Group', val: extracted?.group_size != null ? `${extracted.group_size} people` : null },
src/components/whatsapp/ContextActionModal.tsx:536:    { icon: <IndianRupee className="w-3.5 h-3.5" />, label: 'Budget', val: extracted?.budget_inr != null ? `₹${extracted.budget_inr.toLocaleString('en-IN')}` : null },
src/lib/assistant/actions/reads/dashboard.ts:255:            row.total_price != null ? ` -- ${formatINR(row.total_price)}` : "";
src/lib/assistant/actions/reads/dashboard.ts:390:          p.status != null &&
src/lib/assistant/actions/reads/dashboard.ts:395:          p.status != null &&
src/app/admin/notifications/page.tsx:687:                                                    {item.age_minutes == null ? "No ping" : `${item.age_minutes}m`}
src/app/(superadmin)/god/announcements/page.tsx:254:                                    {ann.recipient_count != null && <span>{ann.recipient_count} recipients</span>}
src/app/clients/[id]/page.tsx:699:                                                {proposal.total_price != null && (
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:57:  (m) => m.amount_percent != null || m.amount_fixed != null,
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:332:  if (milestone.amount_percent != null) {
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:334:  } else if (milestone.amount_fixed != null) {
src/app/api/_handlers/admin/whatsapp/health/route.ts:221:      if (ageMin == null || ageMin > staleThresholdMinutes) {
src/app/api/_handlers/admin/whatsapp/health/route.ts:241:            ageMinutes != null && ageMinutes <= staleThresholdMinutes
src/components/pdf/DownloadPDFButton.tsx:50:          imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
src/components/ui/toast.tsx:173:    if (message == null) return "Action completed";
src/components/assistant/TourAssistantPresentation.tsx:283:                                                        msg.actionResult.data != null &&
src/components/assistant/tour-assistant-helpers.tsx:47:        if (match[2] != null) {
src/components/assistant/tour-assistant-helpers.tsx:49:        } else if (match[3] != null) {
src/components/assistant/tour-assistant-helpers.tsx:51:        } else if (match[4] != null) {
src/components/assistant/tour-assistant-helpers.tsx:61:        } else if (match[5] != null && match[6] != null) {
src/features/admin/pricing/components/TripCostEditor.tsx:41:          if (data.cost_amount != null) setCostAmount(String(data.cost_amount));
src/features/admin/pricing/components/TripCostEditor.tsx:42:          if (data.price_amount != null) setPriceAmount(String(data.price_amount));
src/features/admin/pricing/components/TripCostEditor.tsx:43:          if (data.commission_pct != null) setCommissionPct(String(data.commission_pct));
src/features/admin/pricing/components/TripCostEditor.tsx:44:          if (data.pax_count != null) setPaxCount(String(data.pax_count));
src/app/live/[token]/page.tsx:112:                                heading: row.heading == null ? null : Number(row.heading),
src/app/live/[token]/page.tsx:113:                                speed: row.speed == null ? null : Number(row.speed),
src/app/live/[token]/page.tsx:114:                                accuracy: row.accuracy == null ? null : Number(row.accuracy),
src/features/trip-detail/tabs/ClientCommsTab.tsx:49:  if (min == null && max == null) return null;
src/features/trip-detail/tabs/ClientCommsTab.tsx:51:  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
src/features/trip-detail/tabs/ClientCommsTab.tsx:52:  if (min != null) return `From ${fmt(min)}`;
src/features/trip-detail/tabs/OverviewTab.tsx:226:  if (min == null && max == null) return null;
src/features/trip-detail/tabs/OverviewTab.tsx:228:  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
src/features/trip-detail/tabs/OverviewTab.tsx:229:  if (min != null) return `From ${fmt(min)}`;
src/app/api/_handlers/location/ping/route.ts:29:        const heading = body.heading != null ? Number(body.heading) : null;
src/app/api/_handlers/location/ping/route.ts:30:        const speed = body.speed != null ? Number(body.speed) : null;
src/app/api/_handlers/location/ping/route.ts:31:        const accuracy = body.accuracy != null ? Number(body.accuracy) : null;
src/app/api/_handlers/reputation/ai/analyze/route.ts:39:  const ratingContext = rating != null ? `\nThe reviewer gave a rating of ${rating}/5.` : "";
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:50:  const ratingContext = rating != null ? `\nThe reviewer gave a rating of ${rating}/5.` : "";
```

### TODO / FIXME / HACK comments (1)
```text
src/lib/payments/payment-receipt-config.ts:1:// TODO: Move to organization settings when multi-rate GST is needed.
```

### File-size threshold breaches (>600 LOC) (40)
```text
src/app/admin/insights/page.tsx:788
src/app/admin/invoices/page.tsx:654
src/app/admin/kanban/page.tsx:670
src/app/admin/notifications/page.tsx:736
src/app/admin/page.tsx:804
src/app/admin/settings/marketplace/page.tsx:602
src/app/admin/settings/page.tsx:749
src/app/admin/trips/[id]/page.tsx:693
src/app/api/_handlers/admin/clients/route.ts:738
src/app/api/_handlers/admin/cost/overview/route.ts:799
src/app/api/_handlers/assistant/chat/stream/route.ts:694
src/app/api/_handlers/itinerary/generate/route.ts:752
src/app/clients/[id]/page.tsx:799
src/app/clients/page.tsx:912
src/app/dashboard/tasks/page.tsx:883
src/app/drivers/page.tsx:799
src/app/inbox/page.tsx:899
src/app/marketplace/[id]/page.tsx:651
src/app/onboarding/page.tsx:824
src/app/p/[token]/page.tsx:737
src/app/planner/page.tsx:665
src/app/proposals/[id]/page.tsx:742
src/app/reputation/_components/ReputationDashboard.tsx:639
src/components/CreateTripModal.tsx:787
src/components/assistant/TourAssistantPresentation.tsx:672
src/components/glass/QuickQuoteModal.tsx:727
src/components/leads/LeadToBookingFlow.tsx:749
src/components/pdf/templates/ItineraryTemplatePages.tsx:916
src/components/planner/ApprovalManager.tsx:651
src/components/trips/GroupManager.tsx:632
src/components/trips/TripTemplates.tsx:629
src/components/whatsapp/AutomationRules.tsx:722
src/components/whatsapp/ContextActionModal.tsx:692
src/components/whatsapp/UnifiedInbox.tsx:799
src/features/admin/analytics/AdminAnalyticsView.tsx:635
src/features/admin/billing/BillingView.tsx:819
src/features/admin/revenue/AdminRevenueView.tsx:795
src/lib/assistant/orchestrator.ts:683
src/lib/database.types.ts:6821
src/lib/whatsapp/india-templates.ts:787
```

### Function-length threshold breaches (>80 LOC) (627)
```text
src/app/(superadmin)/god/analytics/page.tsx:106:AnalyticsPage:151
src/app/(superadmin)/god/announcements/page.tsx:54:AnnouncementsPage:223
src/app/(superadmin)/god/audit-log/page.tsx:59:AuditLogPage:171
src/app/(superadmin)/god/costs/org/[orgId]/page.tsx:33:OrgCostPage:107
src/app/(superadmin)/god/costs/page.tsx:82:CostsPage:142
src/app/(superadmin)/god/directory/page.tsx:100:DirectoryPage:248
src/app/(superadmin)/god/kill-switch/page.tsx:24:KillSwitchPage:186
src/app/(superadmin)/god/monitoring/page.tsx:55:MonitoringPage:140
src/app/(superadmin)/god/page.tsx:54:GodCommandCenter:196
src/app/(superadmin)/god/referrals/page.tsx:76:ReferralsPage:102
src/app/(superadmin)/god/signups/page.tsx:90:SignupsPage:107
src/app/(superadmin)/god/support/page.tsx:68:SupportPage:240
src/app/add-ons/_components/AddOnFormModal.tsx:44:AddOnFormModal:160
src/app/add-ons/_components/AddOnsGrid.tsx:26:AddOnsGrid:126
src/app/add-ons/_components/AddOnsGrid.tsx:58:(anonymous):98
src/app/add-ons/page.tsx:51:AddOnsPage:320
src/app/admin/activity/page.tsx:80:ActivityPage:177
src/app/admin/cost/_components/AlertsList.tsx:17:AlertsList:185
src/app/admin/cost/_components/CapEditor.tsx:17:CapEditor:131
src/app/admin/cost/_components/MarginReport.tsx:12:MarginReport:92
src/app/admin/cost/page.tsx:48:AdminCostOverviewPage:266
src/app/admin/gst-report/page.tsx:193:GSTReportPage:352
src/app/admin/insights/page.tsx:29:AdminInsightsPage:759
src/app/admin/insights/page.tsx:48:(anonymous):116
src/app/admin/internal/marketplace/page.tsx:27:InternalMarketplaceAdmin:137
src/app/admin/invoices/page.tsx:23:AdminInvoicesPage:631
src/app/admin/kanban/page.tsx:85:AdminKanbanPage:585
src/app/admin/kanban/page.tsx:552:(anonymous):86
src/app/admin/layout.tsx:19:AdminLayout:82
src/app/admin/notifications/page.tsx:30:NotificationLogsPage:706
src/app/admin/notifications/shared.tsx:158:NotificationLogsTable:112
src/app/admin/operations/page.tsx:135:AdminOperationsPage:450
src/app/admin/page.tsx:120:AdminDashboard:684
src/app/admin/page.tsx:152:(anonymous):155
src/app/admin/page.tsx:153:fetchData:151
src/app/admin/planner/page.tsx:77:PlannerPage:255
src/app/admin/pricing/page.tsx:47:PricingPage:324
src/app/admin/referrals/page.tsx:14:ReferralsPage:196
src/app/admin/security/page.tsx:44:AdminSecurityPage:170
src/app/admin/settings/SettingsIntegrationsSection.tsx:45:SettingsIntegrationsSection:283
src/app/admin/settings/marketplace/page.tsx:78:MarketplaceSettingsPage:524
src/app/admin/settings/page.tsx:38:SettingsPage:711
src/app/admin/support/page.tsx:71:SupportPage:304
src/app/admin/support/page.tsx:81:(anonymous):99
src/app/admin/templates/page.tsx:84:TemplatesPage:209
src/app/admin/templates/page.tsx:94:(anonymous):81
src/app/admin/tour-templates/[id]/edit/page.tsx:64:EditTemplatePage:412
src/app/admin/tour-templates/[id]/edit/page.tsx:86:(anonymous):114
src/app/admin/tour-templates/[id]/edit/page.tsx:205:handleSave:128
src/app/admin/tour-templates/[id]/page.tsx:76:ViewTemplatePage:454
src/app/admin/tour-templates/[id]/page.tsx:90:(anonymous):91
src/app/admin/tour-templates/[id]/page.tsx:346:(anonymous):135
src/app/admin/tour-templates/create/_components/AccommodationEditor.tsx:13:AccommodationEditor:114
src/app/admin/tour-templates/create/_components/ActivityEditor.tsx:12:ActivityEditor:84
src/app/admin/tour-templates/create/_components/DayEditor.tsx:22:DayEditor:111
src/app/admin/tour-templates/create/_components/MetadataForm.tsx:22:MetadataForm:152
src/app/admin/tour-templates/create/page.tsx:73:CreateTemplatePage:337
src/app/admin/tour-templates/create/page.tsx:192:(anonymous):149
src/app/admin/tour-templates/import/page.tsx:18:ImportTourPage:458
src/app/admin/tour-templates/import/page.tsx:163:handleSaveTemplate:98
src/app/admin/tour-templates/page.tsx:49:TourTemplatesPage:421
src/app/admin/tour-templates/page.tsx:340:(anonymous):113
src/app/admin/trips/[id]/_components/AccommodationCard.tsx:17:AccommodationCard:122
src/app/admin/trips/[id]/_components/DayActivities.tsx:156:ActivityRow:97
src/app/admin/trips/[id]/_components/DriverAssignmentCard.tsx:15:DriverAssignmentCard:102
src/app/admin/trips/[id]/_components/TripHeader.tsx:35:TripHeader:227
src/app/admin/trips/[id]/_components/utils.ts:84:optimizeActivitiesForRoute:82
src/app/admin/trips/[id]/clone/page.tsx:28:CloneTripPage:218
src/app/admin/trips/[id]/page.tsx:38:TripDetailPage:655
src/app/admin/trips/[id]/page.tsx:316:fetchNearbyHotels:92
src/app/admin/trips/page.tsx:69:AdminTripsPage:384
src/app/analytics/drill-through/page.tsx:76:DrillThroughContent:171
src/app/analytics/templates/page.tsx:13:TemplateAnalyticsPage:285
src/app/api/_handlers/add-ons/stats/route.ts:34:GET:103
src/app/api/_handlers/admin/clear-cache/route.ts:38:clearCacheForRequest:93
src/app/api/_handlers/admin/clients/route.ts:128:POST:217
src/app/api/_handlers/admin/clients/route.ts:418:DELETE:88
src/app/api/_handlers/admin/clients/route.ts:507:PATCH:231
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:44:POST:173
src/app/api/_handlers/admin/contacts/route.ts:49:GET:88
src/app/api/_handlers/admin/contacts/route.ts:138:POST:146
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:14:POST:91
src/app/api/_handlers/admin/cost/overview/route.ts:32:GET:760
src/app/api/_handlers/admin/dashboard/stats/route.ts:22:GET:185
src/app/api/_handlers/admin/funnel/route.ts:10:GET:101
src/app/api/_handlers/admin/insights/action-queue/route.ts:11:GET:94
src/app/api/_handlers/admin/insights/ai-usage/route.ts:17:GET:93
src/app/api/_handlers/admin/insights/auto-requote/route.ts:12:GET:96
src/app/api/_handlers/admin/insights/best-quote/route.ts:30:POST:165
src/app/api/_handlers/admin/insights/daily-brief/route.ts:11:GET:96
src/app/api/_handlers/admin/insights/margin-leak/route.ts:12:GET:112
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:26:GET:196
src/app/api/_handlers/admin/insights/proposal-risk/route.ts:16:GET:111
src/app/api/_handlers/admin/insights/roi/route.ts:16:GET:166
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:12:GET:126
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:40:GET:173
src/app/api/_handlers/admin/insights/win-loss/route.ts:11:GET:109
src/app/api/_handlers/admin/leads/[id]/route.ts:68:PATCH:91
src/app/api/_handlers/admin/leads/route.ts:80:POST:107
src/app/api/_handlers/admin/marketplace/verify/route.ts:98:GET:94
src/app/api/_handlers/admin/marketplace/verify/route.ts:193:POST:182
src/app/api/_handlers/admin/notifications/delivery/route.ts:55:GET:107
src/app/api/_handlers/admin/operations/command-center/route.ts:212:GET:325
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:152:PATCH:177
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:336:DELETE:83
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:61:POST:145
src/app/api/_handlers/admin/pricing/dashboard/route.ts:16:GET:171
src/app/api/_handlers/admin/pricing/transactions/route.ts:39:GET:136
src/app/api/_handlers/admin/pricing/trips/route.ts:17:GET:113
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:297:handleSendMilestone:120
src/app/api/_handlers/admin/referrals/route.ts:22:GET:84
src/app/api/_handlers/admin/referrals/route.ts:107:POST:123
src/app/api/_handlers/admin/revenue/route.ts:38:(anonymous):85
src/app/api/_handlers/admin/security/diagnostics/route.ts:21:GET:100
src/app/api/_handlers/admin/social/generate/route.ts:232:POST:115
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:72:cloneAndCustomize:84
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:221:POST:177
src/app/api/_handlers/admin/trips/[id]/route.ts:56:GET:262
src/app/api/_handlers/admin/trips/route.ts:120:GET:111
src/app/api/_handlers/admin/trips/route.ts:232:POST:118
src/app/api/_handlers/admin/whatsapp/health/route.ts:54:GET:244
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:10:POST:118
src/app/api/_handlers/admin/workflow/events/route.ts:13:GET:118
src/app/api/_handlers/ai/pricing-suggestion/route.ts:109:GET:82
src/app/api/_handlers/assistant/chat/route.ts:9:POST:93
src/app/api/_handlers/assistant/chat/stream/route.ts:258:executeToolCall:93
src/app/api/_handlers/assistant/chat/stream/route.ts:363:handleStreamingRequest:206
src/app/api/_handlers/assistant/chat/stream/route.ts:581:POST:113
src/app/api/_handlers/assistant/confirm/route.ts:11:POST:130
src/app/api/_handlers/billing/contact-sales/route.ts:64:POST:107
src/app/api/_handlers/billing/subscription/route.ts:15:GET:101
src/app/api/_handlers/bookings/flights/search/route.ts:24:GET:121
src/app/api/_handlers/bookings/hotels/search/route.ts:44:GET:142
src/app/api/_handlers/currency/route.ts:43:GET:104
src/app/api/_handlers/dashboard/schedule/route.ts:92:GET:109
src/app/api/_handlers/drivers/search/route.ts:37:GET:106
src/app/api/_handlers/health/route.ts:362:GET:100
src/app/api/_handlers/invoices/[id]/pay/route.ts:21:POST:135
src/app/api/_handlers/invoices/[id]/route.ts:108:PUT:120
src/app/api/_handlers/invoices/route.ts:88:POST:141
src/app/api/_handlers/invoices/send-pdf/route.ts:26:POST:92
src/app/api/_handlers/itineraries/[id]/bookings/route.ts:101:POST:91
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:59:POST:143
src/app/api/_handlers/itineraries/route.ts:6:GET:152
src/app/api/_handlers/itinerary/generate/route.ts:226:POST:526
src/app/api/_handlers/itinerary/import/pdf/route.ts:46:POST:85
src/app/api/_handlers/itinerary/import/url/route.ts:101:POST:102
src/app/api/_handlers/leads/convert/route.ts:40:POST:141
src/app/api/_handlers/location/client-share/route.ts:13:GET:89
src/app/api/_handlers/location/live/[token]/route.ts:23:GET:110
src/app/api/_handlers/location/ping/route.ts:12:POST:117
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:96:POST:173
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:108:POST:92
src/app/api/_handlers/marketplace/[id]/view/route.ts:14:POST:96
src/app/api/_handlers/marketplace/inquiries/route.ts:47:GET:100
src/app/api/_handlers/marketplace/inquiries/route.ts:148:PATCH:92
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:83:POST:127
src/app/api/_handlers/marketplace/options/route.ts:165:GET:100
src/app/api/_handlers/marketplace/route.ts:209:GET:284
src/app/api/_handlers/marketplace/route.ts:494:PATCH:85
src/app/api/_handlers/marketplace/stats/route.ts:13:GET:135
src/app/api/_handlers/notifications/client-landed/route.ts:23:POST:157
src/app/api/_handlers/notifications/process-queue/route.ts:244:processQueueRow:214
src/app/api/_handlers/notifications/process-queue/route.ts:464:POST:125
src/app/api/_handlers/notifications/schedule-followups/route.ts:77:POST:128
src/app/api/_handlers/notifications/send/route.ts:122:POST:136
src/app/api/_handlers/onboarding/first-value/route.ts:23:GET:129
src/app/api/_handlers/onboarding/setup/route.ts:306:POST:201
src/app/api/_handlers/payments/create-order/route.ts:33:POST:100
src/app/api/_handlers/payments/links/route.ts:24:POST:84
src/app/api/_handlers/payments/webhook/route.ts:136:POST:126
src/app/api/_handlers/payments/webhook/route.ts:263:handlePaymentCaptured:109
src/app/api/_handlers/portal/[token]/route.ts:37:GET:323
src/app/api/_handlers/proposals/[id]/convert/route.ts:105:POST:233
src/app/api/_handlers/proposals/[id]/pdf/route.ts:92:GET:149
src/app/api/_handlers/proposals/[id]/send/route.ts:90:POST:179
src/app/api/_handlers/proposals/bulk/route.ts:12:POST:92
src/app/api/_handlers/proposals/create/route.ts:52:POST:181
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:414:buildPublicPayload:173
src/app/api/_handlers/proposals/public/[token]/route.ts:78:POST:480
src/app/api/_handlers/proposals/send-pdf/route.ts:34:POST:113
src/app/api/_handlers/reputation/ai/analyze/route.ts:95:POST:118
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:110:POST:130
src/app/api/_handlers/reputation/ai/respond/route.ts:168:POST:139
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:87:POST:170
src/app/api/_handlers/reputation/analytics/trends/route.ts:18:GET:141
src/app/api/_handlers/reputation/brand-voice/route.ts:103:PUT:160
src/app/api/_handlers/reputation/campaigns/route.ts:58:POST:83
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:18:POST:183
src/app/api/_handlers/reputation/dashboard/route.ts:18:(anonymous):116
src/app/api/_handlers/reputation/nps/[token]/route.ts:9:GET:95
src/app/api/_handlers/reputation/nps/submit/route.ts:12:POST:123
src/app/api/_handlers/reputation/reviews/route.ts:11:GET:136
src/app/api/_handlers/reputation/sync/route.ts:98:POST:249
src/app/api/_handlers/reputation/widget/[token]/route.ts:42:GET:125
src/app/api/_handlers/reputation/widget/config/route.ts:61:POST:86
src/app/api/_handlers/reputation/widget/config/route.ts:148:PUT:120
src/app/api/_handlers/settings/team/invite/route.ts:21:POST:112
src/app/api/_handlers/settings/team/shared.ts:255:loadTeamMembers:102
src/app/api/_handlers/share/[token]/route.ts:144:POST:219
src/app/api/_handlers/social/oauth/callback/route.ts:39:handleFacebookCallback:104
src/app/api/_handlers/social/process-queue/route.ts:54:POST:148
src/app/api/_handlers/social/refresh-tokens/route.ts:12:POST:102
src/app/api/_handlers/social/reviews/import/route.ts:6:POST:82
src/app/api/_handlers/social/reviews/public/route.ts:105:POST:129
src/app/api/_handlers/social/smart-poster/route.ts:14:POST:143
src/app/api/_handlers/subscriptions/route.ts:140:POST:83
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:31:POST:85
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:16:GET:110
src/app/api/_handlers/superadmin/cost/trends/route.ts:15:GET:82
src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts:42:GET:99
src/app/api/_handlers/superadmin/referrals/overview/route.ts:36:GET:105
src/app/api/_handlers/superadmin/users/signups/route.ts:18:GET:86
src/app/api/_handlers/trips/[id]/clone/route.ts:25:POST:118
src/app/api/_handlers/trips/[id]/invoices/route.ts:44:GET:124
src/app/api/_handlers/trips/[id]/route.ts:90:GET:270
src/app/api/_handlers/trips/[id]/route.ts:361:DELETE:89
src/app/api/_handlers/trips/route.ts:163:GET:216
src/app/api/_handlers/webhooks/waha/route.ts:54:POST:198
src/app/api/_handlers/whatsapp/broadcast/route.ts:342:POST:122
src/app/api/_handlers/whatsapp/conversations/route.ts:45:GET:126
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:54:POST:112
src/app/api/_handlers/whatsapp/send/route.ts:13:POST:103
src/app/api/_handlers/whatsapp/webhook/route.ts:90:POST:148
src/app/api/_handlers/whatsapp/webhook/route.ts:292:processWhatsAppImages:86
src/app/auth/page.tsx:14:AuthPageContent:248
src/app/billing/BillingPageClient.tsx:124:BillingPageClient:455
src/app/bookings/page.tsx:39:BookingsPage:289
src/app/clients/[id]/ClientEditButton.tsx:48:ClientEditButton:193
src/app/clients/[id]/page.tsx:36:ClientProfilePage:759
src/app/clients/page.tsx:209:ClientsPage:703
src/app/clients/page.tsx:592:(anonymous):161
src/app/clients/page.tsx:638:(anonymous):111
src/app/dashboard/schedule/page.tsx:161:EventCard:168
src/app/dashboard/tasks/page.tsx:162:AssignDriverPanel:93
src/app/dashboard/tasks/page.tsx:508:ActiveTaskCard:123
src/app/dashboard/tasks/page.tsx:688:AllTasksPage:195
src/app/design-demo/page.tsx:22:DesignDemoPage:257
src/app/drivers/[id]/page.tsx:27:DriverDetailsPage:270
src/app/drivers/page.tsx:61:DriversPage:738
src/app/drivers/page.tsx:538:(anonymous):116
src/app/inbox/page.tsx:56:BroadcastTab:528
src/app/inbox/page.tsx:587:TemplatesListView:150
src/app/inbox/page.tsx:747:InboxPage:152
src/app/live/[token]/page.tsx:42:LiveLocationPage:185
src/app/marketing/page.tsx:9:MarketingPage:160
src/app/marketplace/[id]/page.tsx:89:OperatorDetailPage:562
src/app/marketplace/analytics/page.tsx:52:MarketplaceAnalyticsPage:261
src/app/marketplace/inquiries/page.tsx:33:MarketplaceInquiriesPage:229
src/app/marketplace/inquiries/page.tsx:163:(anonymous):89
src/app/marketplace/page.tsx:43:MarketplacePage:371
src/app/marketplace/page.tsx:304:(anonymous):103
src/app/onboarding/page.tsx:119:OnboardingPageContent:686
src/app/p/[token]/page.tsx:38:PublicProposalPage:699
src/app/p/[token]/page.tsx:497:(anonymous):187
src/app/page.tsx:80:DashboardPage:350
src/app/pay/[token]/PaymentCheckoutClient.tsx:48:PaymentCheckoutClient:205
src/app/pay/[token]/PaymentCheckoutClient.tsx:68:handleCheckout:88
src/app/planner/ClientFeedbackPanel.tsx:41:ClientFeedbackPanel:306
src/app/planner/ClientFeedbackPanel.tsx:157:(anonymous):108
src/app/planner/ItineraryFilterBar.tsx:150:ItineraryFilterBar:180
src/app/planner/NeedsAttentionQueue.tsx:104:NeedsAttentionQueue:180
src/app/planner/NeedsAttentionQueue.tsx:163:(anonymous):116
src/app/planner/PastItineraryCard.tsx:44:PastItineraryCard:283
src/app/planner/PlannerHero.tsx:48:PlannerHero:231
src/app/planner/SaveItineraryButton.tsx:21:SaveItineraryButton:153
src/app/planner/SaveItineraryButton.tsx:36:handleSave:102
src/app/planner/ShareItinerary.tsx:12:ShareItinerary:100
src/app/planner/page.tsx:61:PlannerPage:604
src/app/portal/[token]/page.tsx:82:PortalPage:379
src/app/proposals/[id]/page.tsx:74:AdminProposalViewPage:668
src/app/proposals/create/_components/AddOnsGrid.tsx:15:AddOnsGrid:135
src/app/proposals/create/_components/ClientSelector.tsx:34:ClientSelector:255
src/app/proposals/create/_components/TemplateSelector.tsx:26:TemplateSelector:173
src/app/proposals/create/_hooks/useCreateProposal.ts:34:useCreateProposal:172
src/app/proposals/create/_hooks/useCreateProposal.ts:40:handleCreateProposal:163
src/app/proposals/create/_hooks/useProposalData.ts:37:useProposalData:191
src/app/proposals/create/_hooks/useProposalData.ts:79:(anonymous):95
src/app/proposals/create/_hooks/useWhatsAppDraft.ts:27:useWhatsAppDraft:84
src/app/proposals/create/page.tsx:25:CreateProposalPage:214
src/app/proposals/page.tsx:92:ProposalsPage:440
src/app/proposals/page.tsx:321:(anonymous):120
src/app/reputation/_components/BrandVoiceSettings.tsx:215:BrandVoiceSettings:308
src/app/reputation/_components/CampaignBuilder.tsx:51:CampaignBuilder:482
src/app/reputation/_components/CampaignList.tsx:84:CampaignList:174
src/app/reputation/_components/CampaignList.tsx:142:(anonymous):113
src/app/reputation/_components/CompetitorBenchmark.tsx:77:CompetitorBenchmark:222
src/app/reputation/_components/NPSSurveyPreview.tsx:13:NPSSurveyPreview:196
src/app/reputation/_components/PlatformConnectionCards.tsx:58:PlatformConnectionCards:339
src/app/reputation/_components/PlatformConnectionCards.tsx:209:(anonymous):114
src/app/reputation/_components/ReputationDashboard.tsx:108:OverviewTab:154
src/app/reputation/_components/ReputationDashboard.tsx:489:ReputationDashboard:150
src/app/reputation/_components/ReviewCard.tsx:75:ReviewCard:208
src/app/reputation/_components/ReviewInbox.tsx:65:AddReviewModal:153
src/app/reputation/_components/ReviewInbox.tsx:229:ReviewInbox:365
src/app/reputation/_components/ReviewResponsePanel.tsx:56:ReviewResponsePanel:296
src/app/reputation/_components/ReviewToRevenueChart.tsx:66:ReviewToRevenueChart:170
src/app/reputation/_components/SentimentChart.tsx:67:SentimentChart:92
src/app/reputation/_components/WidgetConfigurator.tsx:50:WidgetConfigurator:316
src/app/reputation/_components/useReputationDashboardData.ts:73:useReputationDashboardData:136
src/app/reputation/nps/[token]/page.tsx:107:NPSSurveyPage:310
src/app/settings/_components/IntegrationsTab.tsx:20:IntegrationsTab:269
src/app/settings/_components/MapsDataSection.tsx:14:MapsDataSection:117
src/app/settings/marketplace/MarketplaceListingPlans.tsx:94:MarketplaceListingPlans:281
src/app/settings/marketplace/MarketplaceListingPlans.tsx:151:handleConfirmUpgrade:107
src/app/settings/marketplace/page.tsx:16:MarketplaceSettingsPage:412
src/app/settings/marketplace/useMarketplacePresence.ts:96:useMarketplacePresence:157
src/app/settings/page.tsx:29:SettingsPage:181
src/app/settings/team/page.tsx:26:TeamPage:170
src/app/settings/team/useTeamMembers.ts:26:useTeamMembers:125
src/app/share/[token]/ShareTemplateRenderer.tsx:26:ShareTemplateRenderer:97
src/app/share/[token]/page.tsx:12:SharedTripPage:104
src/app/social/_components/AiTab.tsx:55:AiTab:342
src/app/social/_components/BackgroundPicker.tsx:24:BackgroundPicker:164
src/app/social/_components/BulkExporter.tsx:124:BulkExporter:298
src/app/social/_components/CaptionEngine.tsx:177:CaptionEngine:183
src/app/social/_components/CarouselBuilder.tsx:24:CarouselBuilder:166
src/app/social/_components/ContentBar.tsx:96:ContentBar:446
src/app/social/_components/GallerySlotPicker.tsx:29:GallerySlotPicker:169
src/app/social/_components/MagicPrompter.tsx:14:MagicPrompter:106
src/app/social/_components/MediaLibrary.tsx:34:MediaLibrary:239
src/app/social/_components/PlatformStatusBar.tsx:19:PlatformStatusBar:137
src/app/social/_components/PostHistory.tsx:40:PostHistory:199
src/app/social/_components/PostHistory.tsx:132:(anonymous):102
src/app/social/_components/PosterExtractor.tsx:23:PosterExtractor:112
src/app/social/_components/PublishKitDrawer.tsx:22:PublishKitDrawer:339
src/app/social/_components/ReviewsToInsta.tsx:131:ReviewsToInsta:360
src/app/social/_components/SocialAnalytics.tsx:48:SocialAnalytics:208
src/app/social/_components/SocialStudioClient.tsx:45:SocialStudioClient:492
src/app/social/_components/StockTab.tsx:36:StockTab:218
src/app/social/_components/TemplateEditor.tsx:45:TemplateEditor:503
src/app/social/_components/TemplateGallery.tsx:32:TemplateGallery:286
src/app/social/_components/TripImporter.tsx:86:TripImporter:294
src/app/social/_components/TripImporter.tsx:146:(anonymous):89
src/app/social/_components/canvas/CanvasEditorPanel.tsx:39:CanvasEditorPanel:211
src/app/social/_components/canvas/CanvasMode.tsx:20:CanvasMode:247
src/app/social/_components/canvas/CanvasPreviewPane.tsx:32:CanvasPreviewPane:107
src/app/social/_components/canvas/CanvasPublishModal.tsx:40:CanvasPublishModal:258
src/app/social/_components/template-gallery/PreviewPanel.tsx:23:PreviewPanel:90
src/app/social/_components/template-gallery/TemplateGrid.tsx:162:TemplateGrid:208
src/app/social/_components/template-gallery/TemplateGrid.tsx:211:(anonymous):173
src/app/social/_components/template-gallery/TemplateGrid.tsx:222:(anonymous):159
src/app/support/page.tsx:22:SupportPage:261
src/app/trips/TripCardGrid.tsx:55:TripCardGrid:144
src/app/trips/TripCardGrid.tsx:92:(anonymous):103
src/app/trips/TripGridCard.tsx:32:TripGridCard:85
src/app/trips/TripListRow.tsx:34:TripListRow:117
src/app/trips/[id]/page.tsx:29:TripDetailPage:199
src/app/trips/page.tsx:41:TripsPage:274
src/app/trips/templates/page.tsx:12:TripTemplatesPage:90
src/app/welcome/page.tsx:6:WelcomePage:84
src/components/CreateTripModal.tsx:64:CreateTripModal:723
src/components/CreateTripModal.tsx:318:handleCreateTrip:104
src/components/CurrencyConverter.tsx:54:CurrencyConverter:258
src/components/InteractivePricing.tsx:11:InteractivePricing:111
src/components/ItineraryBuilder.tsx:119:ItineraryBuilder:195
src/components/NotificationSettings.tsx:21:NotificationSettings:259
src/components/ShareTripModal.tsx:29:ShareTripModal:192
src/components/ShareTripModal.tsx:44:generateShareLink:98
src/components/TemplateAnalytics.tsx:18:TemplateAnalyticsComponent:165
src/components/VersionDiff.tsx:93:VersionDiff:141
src/components/WeatherWidget.tsx:43:WeatherWidget:119
src/components/admin/ConvertProposalModal.tsx:18:ConvertProposalModal:102
src/components/admin/ProposalAddOnsManager.tsx:63:ProposalAddOnsManager:459
src/components/admin/ProposalAddOnsManager.tsx:348:(anonymous):90
src/components/analytics/RevenueChart.tsx:51:RevenueChart:118
src/components/assistant/ConversationHistory.tsx:45:ConversationHistory:225
src/components/assistant/TourAssistantChat.tsx:13:TourAssistantChat:392
src/components/assistant/TourAssistantChat.tsx:145:sendMessage:167
src/components/assistant/TourAssistantPresentation.tsx:60:TourAssistantPresentation:588
src/components/assistant/TourAssistantPresentation.tsx:188:(anonymous):260
src/components/assistant/UsageDashboard.tsx:34:UsageDashboard:152
src/components/billing/PricingCard.tsx:39:PricingCard:129
src/components/billing/UpgradeModal.tsx:80:UpgradeModal:167
src/components/bookings/FlightSearch.tsx:63:FlightSearch:332
src/components/bookings/FlightSearch.tsx:309:(anonymous):88
src/components/bookings/HotelSearch.tsx:40:HotelSearch:193
src/components/bookings/LocationAutocomplete.tsx:28:LocationAutocomplete:203
src/components/client/ProposalAddOnsSelector.tsx:49:ProposalAddOnsSelector:306
src/components/dashboard/ActionQueue.tsx:119:ActionQueue:103
src/components/dashboard/ActionQueuePanels.tsx:39:AssignDriverPanel:93
src/components/dashboard/InlineActionPanel.tsx:96:AssignDriverPanel:90
src/components/dashboard/KPICard.tsx:57:KPICard:82
src/components/dashboard/NotificationBell.tsx:48:NotificationBell:170
src/components/dashboard/RevenueKPICard.tsx:32:RevenueKPICard:190
src/components/dashboard/TaskRow.tsx:35:(anonymous):119
src/components/dashboard/TodaysTimeline.tsx:135:TimelineCard:116
src/components/dashboard/TodaysTimeline.tsx:283:TodaysTimeline:111
src/components/dashboard/WhatsAppDashboardPreview.tsx:128:MessageRow:94
src/components/demo/DemoModeBanner.tsx:17:DemoModeBanner:89
src/components/demo/DemoTour.tsx:86:DemoTour:248
src/components/demo/WelcomeModal.tsx:14:WelcomeModal:155
src/components/forms/SearchableCreatableMultiSelect.tsx:24:SearchableCreatableMultiSelect:142
src/components/glass/GlassModal.tsx:30:GlassModal:171
src/components/glass/QuickQuoteModal.tsx:109:DestinationInput:95
src/components/glass/QuickQuoteModal.tsx:224:QuickQuoteModal:503
src/components/god-mode/DrillDownTable.tsx:37:DrillDownTable:140
src/components/god-mode/TrendChart.tsx:42:TrendChart:91
src/components/import/ImportPreview.tsx:14:ImportPreview:239
src/components/import/ImportPreview.tsx:149:(anonymous):82
src/components/india/GSTInvoice.tsx:68:InvoicePrintView:159
src/components/india/GSTInvoice.tsx:230:GSTInvoice:145
src/components/india/UPIPaymentModal.tsx:43:ConfirmPaymentModal:83
src/components/india/UPIPaymentModal.tsx:234:UPIPaymentModal:259
src/components/itinerary-templates/BentoJourneyView.tsx:8:BentoJourneyView:255
src/components/itinerary-templates/BentoJourneyView.tsx:138:(anonymous):100
src/components/itinerary-templates/LuxuryResortView.tsx:8:LuxuryResortView:226
src/components/itinerary-templates/ProfessionalView.tsx:7:ProfessionalView:321
src/components/itinerary-templates/ProfessionalView.tsx:136:(anonymous):150
src/components/itinerary-templates/SafariStoryView.tsx:8:SafariStoryView:311
src/components/itinerary-templates/SafariStoryView.tsx:173:(anonymous):114
src/components/itinerary-templates/UrbanBriefView.tsx:6:UrbanBriefView:317
src/components/itinerary-templates/UrbanBriefView.tsx:154:(anonymous):123
src/components/itinerary-templates/UrbanBriefView.tsx:184:(anonymous):89
src/components/itinerary-templates/VisualJourneyView.tsx:8:VisualJourneyView:284
src/components/itinerary-templates/VisualJourneyView.tsx:151:(anonymous):114
src/components/itinerary/ProfessionalItineraryView.tsx:31:ProfessionalItineraryView:167
src/components/itinerary/ProfessionalItineraryView.tsx:283:ActivityCard:84
src/components/layout/CommandPalette.tsx:22:CommandPalette:160
src/components/layout/FloatingActionButton.tsx:23:FloatingActionButton:184
src/components/layout/MobileNav.tsx:119:MobileNav:194
src/components/layout/NavHeader.tsx:15:NavHeader:242
src/components/layout/Sidebar.tsx:142:NavItemRow:83
src/components/layout/Sidebar.tsx:234:Sidebar:262
src/components/layout/TopBar.tsx:39:TopBar:95
src/components/layout/useNavCounts.ts:21:useNavCounts:94
src/components/layout/useNavCounts.ts:26:(anonymous):86
src/components/leads/LeadToBookingFlow.tsx:169:Step1ConfirmLead:119
src/components/leads/LeadToBookingFlow.tsx:299:Step2ReviewQuote:103
src/components/leads/LeadToBookingFlow.tsx:413:Step3CreateAndNotify:170
src/components/leads/LeadToBookingFlow.tsx:594:LeadToBookingFlow:149
src/components/leads/SmartLeadCard.tsx:49:SmartLeadCard:91
src/components/map/ItineraryMap.tsx:233:ItineraryMap:159
src/components/payments/PaymentLinkButton.tsx:38:PaymentLinkButton:223
src/components/payments/PaymentTracker.tsx:58:PaymentTracker:251
src/components/payments/RazorpayModal.tsx:93:RazorpayModal:272
src/components/payments/RazorpayModal.tsx:133:handleLaunchCheckout:102
src/components/pdf/DownloadPDFButton.tsx:20:DownloadPDFButton:117
src/components/pdf/DownloadPDFButton.tsx:24:handleDownload:93
src/components/pdf/InvoiceDocument.tsx:106:InvoiceDocument:107
src/components/pdf/InvoiceDocument.tsx:231:buildStyles:216
src/components/pdf/OperatorScorecardDocument.tsx:133:OperatorScorecardDocument:102
src/components/pdf/ProposalDocument.tsx:312:ProposalDocument:239
src/components/pdf/ProposalPDFButton.tsx:23:ProposalPDFButton:200
src/components/pdf/templates/ItineraryTemplatePages.tsx:368:SafariStoryPages:176
src/components/pdf/templates/ItineraryTemplatePages.tsx:740:UrbanBriefPages:152
src/components/pdf/templates/ProfessionalTemplate.tsx:37:createStyles:278
src/components/pdf/templates/ProfessionalTemplate.tsx:316:ProfessionalTemplate:213
src/components/pdf/templates/ProfessionalTemplate.tsx:384:(anonymous):82
src/components/planner/ApprovalManager.tsx:51:ApprovalManager:600
src/components/planner/LogisticsManager.tsx:23:LogisticsManager:216
src/components/planner/PricingManager.tsx:22:PricingManager:188
src/components/portal/PortalItinerary.tsx:37:PortalItinerary:141
src/components/portal/PortalItinerary.tsx:49:(anonymous):126
src/components/portal/PortalPayment.tsx:29:PortalPayment:209
src/components/portal/PortalReview.tsx:13:PortalReview:193
src/components/proposals/ESignature.tsx:33:ESignature:315
src/components/settings/InviteModal.tsx:42:InviteModal:248
src/components/settings/LanguageToggle.tsx:15:LanguageToggle:114
src/components/settings/TeamMemberCard.tsx:44:TeamMemberCard:144
src/components/social/templates/layouts/CenterLayout.tsx:10:CenterLayout:83
src/components/social/templates/layouts/ElegantLayout.tsx:10:ElegantLayout:85
src/components/social/templates/layouts/GalleryLayouts.tsx:306:MosaicStripLayout:81
src/components/social/templates/layouts/InfoSplitLayout.tsx:10:InfoSplitLayout:86
src/components/social/templates/layouts/ReviewLayout.tsx:41:CarouselSlideLayout:81
src/components/social/templates/layouts/ServiceLayouts.tsx:10:ServiceShowcaseLayout:95
src/components/social/templates/layouts/SplitLayout.tsx:10:SplitLayout:83
src/components/social/templates/layouts/ThemeDecorations.tsx:36:renderTheme:329
src/components/templates/ItineraryTemplateClassic.tsx:6:ItineraryTemplateClassic:207
src/components/templates/ItineraryTemplateModern.tsx:6:ItineraryTemplateModern:251
src/components/trips/ConflictWarning.tsx:15:ConflictWarning:171
src/components/trips/GroupManager.tsx:46:GroupManager:584
src/components/trips/GroupManagerModals.tsx:28:ManifestModal:100
src/components/trips/GroupManagerModals.tsx:149:WhatsAppBroadcastModal:174
src/components/trips/TripTemplates.tsx:359:TemplateCard:150
src/components/trips/TripTemplates.tsx:516:TripTemplates:111
src/components/ui/map/map-controls.tsx:78:MapControls:99
src/components/ui/map/map-controls.tsx:243:MapPopup:85
src/components/ui/map/map-core.tsx:118:(anonymous):176
src/components/ui/map/map-layers.tsx:31:MapRoute:106
src/components/ui/map/map-layers.tsx:177:MapClusterLayer:262
src/components/ui/map/map-layers.tsx:203:(anonymous):86
src/components/ui/map/map-layers.tsx:348:(anonymous):91
src/components/ui/map/map-markers.tsx:55:MapMarker:110
src/components/ui/toast.tsx:60:ToastProvider:103
src/components/whatsapp/AutomationRules.tsx:293:RuleCard:98
src/components/whatsapp/AutomationRules.tsx:400:CreateRuleModal:137
src/components/whatsapp/AutomationRules.tsx:538:AutomationRules:184
src/components/whatsapp/CannedResponses.tsx:113:CannedResponses:237
src/components/whatsapp/ContextActionModal.tsx:185:CreateTripPanel:128
src/components/whatsapp/ContextActionModal.tsx:322:SendQuotePanel:98
src/components/whatsapp/ContextActionModal.tsx:441:CreateProposalPanel:121
src/components/whatsapp/MessageThread.tsx:100:MessageBubble:96
src/components/whatsapp/MessageThread.tsx:230:MessageThread:305
src/components/whatsapp/UnifiedInbox.tsx:58:UnifiedInbox:741
src/components/whatsapp/UnifiedInbox.tsx:281:handleSendMessage:90
src/components/whatsapp/UnifiedInboxContextPanel.tsx:37:UnifiedInboxContextPanel:221
src/components/whatsapp/WhatsAppConnectModal.tsx:34:WhatsAppConnectModal:459
src/components/whatsapp/action-picker/ActionPickerModal.tsx:63:ActionPickerModal:96
src/components/whatsapp/action-picker/DriverPicker.tsx:25:DriverPicker:169
src/components/whatsapp/action-picker/ItineraryPicker.tsx:18:ItineraryPicker:127
src/components/whatsapp/action-picker/LocationRequestPicker.tsx:20:LocationRequestPicker:177
src/components/whatsapp/action-picker/PaymentPicker.tsx:24:PaymentPicker:242
src/features/admin/analytics/AdminAnalyticsView.tsx:89:AdminAnalyticsView:546
src/features/admin/analytics/useAdminAnalytics.ts:68:buildSnapshot:221
src/features/admin/analytics/useAdminAnalytics.ts:290:useAdminAnalytics:186
src/features/admin/analytics/useAdminAnalytics.ts:301:(anonymous):111
src/features/admin/billing/BillingView.tsx:46:BillingView:773
src/features/admin/billing/useBillingData.ts:67:useBillingData:218
src/features/admin/billing/useBillingData.ts:83:(anonymous):86
src/features/admin/dashboard/DateRangePicker.tsx:28:DateRangePicker:154
src/features/admin/dashboard/FunnelWidget.tsx:19:FunnelWidget:82
src/features/admin/invoices/InvoiceCreateForm.tsx:40:InvoiceCreateForm:308
src/features/admin/invoices/InvoiceCreateForm.tsx:213:(anonymous):85
src/features/admin/invoices/InvoiceListPanel.tsx:46:InvoiceListPanel:227
src/features/admin/invoices/InvoiceLivePreview.tsx:16:InvoiceLivePreview:267
src/features/admin/invoices/helpers.ts:66:buildInvoiceMarkup:105
src/features/admin/invoices/useInvoiceDraft.ts:6:useInvoiceDraft:149
src/features/admin/pricing/components/MonthlyTripTable.tsx:30:MonthlyTripTable:260
src/features/admin/pricing/components/MonthlyTripTable.tsx:134:(anonymous):93
src/features/admin/pricing/components/OverheadExpensesCard.tsx:24:OverheadExpensesCard:184
src/features/admin/pricing/components/PricingKpiCards.tsx:78:PricingKpiCards:94
src/features/admin/pricing/components/TransactionDetailPanel.tsx:35:TransactionDetailPanel:243
src/features/admin/pricing/components/TransactionLedger.tsx:43:TransactionLedger:259
src/features/admin/pricing/components/TripCostEditor.tsx:19:TripCostEditor:250
src/features/admin/pricing/useTripCosts.ts:7:useTripCosts:82
src/features/admin/revenue/AdminRevenueView.tsx:112:AdminRevenueView:683
src/features/admin/revenue/useAdminRevenue.ts:84:useAdminRevenue:204
src/features/admin/revenue/useAdminRevenue.ts:97:(anonymous):164
src/features/calendar/AddEventModal.tsx:82:AddEventModal:205
src/features/calendar/BlockDatesModal.tsx:23:BlockDatesModal:239
src/features/calendar/CalendarCommandCenter.tsx:33:CalendarCommandCenter:261
src/features/calendar/CalendarHeader.tsx:57:CalendarHeader:99
src/features/calendar/DayCell.tsx:26:DayCell:91
src/features/calendar/DayDrawer.tsx:21:DayDrawer:157
src/features/calendar/DayView.tsx:40:DayView:225
src/features/calendar/EventDetailModal.tsx:23:EventDetailModal:118
src/features/calendar/TimeGridEvent.tsx:19:TimeGridEvent:91
src/features/calendar/WeekTimeGrid.tsx:34:WeekTimeGrid:212
src/features/calendar/WeekTimeGrid.tsx:139:(anonymous):88
src/features/calendar/WeekView.tsx:27:WeekView:108
src/features/calendar/details/PersonalEventDetail.tsx:29:PersonalEventDetail:92
src/features/calendar/useCalendarActions.ts:87:useCalendarActions:305
src/features/trip-detail/TripDetailHeader.tsx:85:TripDetailHeader:98
src/features/trip-detail/components/TripActivityList.tsx:40:ActivityCard:89
src/features/trip-detail/components/TripAddOnsEditor.tsx:189:TripAddOnsEditor:85
src/features/trip-detail/components/TripDriverCard.tsx:25:TripDriverCard:99
src/features/trip-detail/components/TripInvoiceSection.tsx:103:InvoiceRow:97
src/features/trip-detail/components/TripNotificationHistory.tsx:88:TripNotificationHistory:112
src/features/trip-detail/components/TripStatusSidebar.tsx:90:TripStatusSidebar:95
src/features/trip-detail/tabs/ClientCommsTab.tsx:87:ClientProfileCard:118
src/features/trip-detail/tabs/FinancialsTab.tsx:237:CreateInvoiceModal:193
src/features/trip-detail/tabs/FinancialsTab.tsx:458:FinancialsTab:87
src/hooks/useRealtimeProposal.ts:43:useRealtimeProposal:112
src/hooks/useRealtimeProposal.ts:66:(anonymous):95
src/hooks/useRealtimeUpdates.ts:120:useRealtimeUpdates:121
src/hooks/useRealtimeUpdates.ts:153:(anonymous):85
src/hooks/useUserTimezone.ts:12:useUserTimezone:90
src/lib/admin/action-queue.ts:36:buildRevenueRiskActionQueue:126
src/lib/ai/cost-guardrails.ts:26:getOrgAiUsageSnapshot:91
src/lib/ai/upsell-engine.ts:167:scoreAddOn:133
src/lib/assistant/actions/reads/clients.ts:116:(anonymous):92
src/lib/assistant/actions/reads/clients.ts:234:(anonymous):141
src/lib/assistant/actions/reads/clients.ts:401:(anonymous):132
src/lib/assistant/actions/reads/dashboard.ts:78:(anonymous):93
src/lib/assistant/actions/reads/dashboard.ts:187:(anonymous):120
src/lib/assistant/actions/reads/dashboard.ts:331:(anonymous):101
src/lib/assistant/actions/reads/drivers.ts:160:execute:118
src/lib/assistant/actions/reads/invoices.ts:121:(anonymous):118
src/lib/assistant/actions/reads/invoices.ts:265:(anonymous):180
src/lib/assistant/actions/reads/invoices.ts:470:(anonymous):113
src/lib/assistant/actions/reads/proposals.ts:149:execute:113
src/lib/assistant/actions/reads/proposals.ts:288:execute:83
src/lib/assistant/actions/reads/reports.ts:131:(anonymous):186
src/lib/assistant/actions/reads/trips.ts:76:(anonymous):118
src/lib/assistant/actions/reads/trips.ts:220:(anonymous):137
src/lib/assistant/actions/reads/trips.ts:382:(anonymous):123
src/lib/assistant/actions/writes/clients.ts:52:(anonymous):95
src/lib/assistant/actions/writes/clients.ts:176:(anonymous):86
src/lib/assistant/actions/writes/invoices.ts:48:(anonymous):116
src/lib/assistant/actions/writes/invoices.ts:194:(anonymous):137
src/lib/assistant/actions/writes/notifications.ts:87:execute:90
src/lib/assistant/actions/writes/notifications.ts:212:execute:137
src/lib/assistant/actions/writes/proposals.ts:83:execute:85
src/lib/assistant/actions/writes/proposals.ts:193:execute:118
src/lib/assistant/actions/writes/trips.ts:38:(anonymous):81
src/lib/assistant/actions/writes/trips.ts:148:(anonymous):104
src/lib/assistant/alerts.ts:80:detectAlerts:111
src/lib/assistant/alerts.ts:250:generateAndQueueAlerts:92
src/lib/assistant/anomaly-detector.ts:174:detectAnomalies:93
src/lib/assistant/channel-adapters/whatsapp.ts:170:handleWhatsAppMessage:123
src/lib/assistant/orchestrator.ts:256:executeToolCall:120
src/lib/assistant/orchestrator.ts:420:handleMessage:226
src/lib/assistant/weekly-digest.ts:75:buildWeeklyInsights:111
src/lib/auth/admin.ts:162:requireAdmin:112
src/lib/billing/outcome-upgrade.ts:80:buildOutcomeUpgradePrompts:93
src/lib/cost/spend-guardrails.ts:270:reserveDailySpendUsd:109
src/lib/import/pdf-extractor.ts:26:extractTourFromPDF:119
src/lib/import/url-scraper.ts:57:extractTourFromURL:108
src/lib/india/gst.ts:168:createTourPackageInvoice:100
src/lib/india/pricing.ts:102:calculateTripPrice:114
src/lib/notification-templates.ts:65:renderTemplate:97
src/lib/notification-templates.ts:163:renderWhatsAppTemplate:110
src/lib/notifications/browser-push.ts:123:createEventNotification:84
src/lib/payments/customer-service.ts:11:ensureCustomer:93
src/lib/payments/invoice-service.ts:31:createInvoice:118
src/lib/payments/invoice-service.ts:156:recordPayment:127
src/lib/payments/subscription-service.ts:54:createSubscription:115
src/lib/payments/subscription-service.ts:176:cancelSubscription:87
src/lib/payments/webhook-handlers.ts:26:handleSubscriptionCharged:94
src/lib/payments/webhook-handlers.ts:129:handlePaymentFailed:97
src/lib/pdf-extractor.ts:88:extractTemplateFromPDF:176
src/lib/pdf/proposal-pdf.tsx:287:ProposalPDF:149
src/lib/pdf/proposal-pdf.tsx:337:(anonymous):87
src/lib/rag-itinerary.ts:147:assembleItinerary:112
src/lib/reputation/campaign-trigger.ts:49:triggerCampaignSendsForOrg:192
src/lib/security/cost-endpoint-guard.ts:146:guardCostEndpoint:232
src/lib/shared-itinerary-cache.ts:150:getSharedCachedItinerary:107
src/lib/social/ai-prompts.ts:278:generateFullPosterPrompt:81
src/lib/social/poster-composer.ts:198:buildCompositionPlan:171
src/lib/social/poster-premium-layouts-a.ts:13:buildWaveDividerText:185
src/lib/social/poster-premium-layouts-a.ts:209:buildCircleAccentText:86
src/lib/social/poster-premium-layouts-a.ts:305:buildFloatingCardText:146
src/lib/social/poster-premium-layouts-b.ts:13:buildPremiumCollageText:81
src/lib/social/poster-premium-layouts-b.ts:167:buildSplitWaveText:96
src/lib/social/poster-standard-blocks.ts:113:buildHeroBlock:156
src/lib/whatsapp/chatbot-flow.ts:415:processChatbotMessage:115
```

### Nesting-depth threshold breaches (>4) (99)
```text
src/app/admin/notifications/shared.tsx:243:ConditionalExpression:depth=5
src/app/admin/pricing/page.tsx:301:ConditionalExpression:depth=5
src/app/admin/trips/[id]/_components/utils.ts:155:IfStatement:depth=5
src/app/api/_handlers/admin/cost/overview/route.ts:427:IfStatement:depth=5
src/app/api/_handlers/admin/cost/overview/route.ts:431:IfStatement:depth=5
src/app/api/_handlers/admin/trips/[id]/route.ts:272:ForStatement:depth=5
src/app/api/_handlers/admin/trips/[id]/route.ts:280:IfStatement:depth=6
src/app/api/_handlers/admin/trips/[id]/route.ts:283:IfStatement:depth=6
src/app/api/_handlers/admin/trips/[id]/route.ts:291:IfStatement:depth=6
src/app/api/_handlers/admin/trips/[id]/route.ts:296:IfStatement:depth=6
src/app/api/_handlers/assistant/chat/stream/route.ts:482:ForOfStatement:depth=5
src/app/api/_handlers/assistant/chat/stream/route.ts:489:IfStatement:depth=5
src/app/api/_handlers/bookings/hotels/search/route.ts:127:ConditionalExpression:depth=5
src/app/api/_handlers/bookings/hotels/search/route.ts:128:IfStatement:depth=5
src/app/api/_handlers/itineraries/route.ts:78:IfStatement:depth=5
src/app/api/_handlers/itineraries/route.ts:105:IfStatement:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:205:IfStatement:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:307:ConditionalExpression:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:307:ConditionalExpression:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:340:ConditionalExpression:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:340:ConditionalExpression:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:340:ConditionalExpression:depth=7
src/app/api/_handlers/itinerary/generate/route.ts:343:ConditionalExpression:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:377:ConditionalExpression:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:377:ConditionalExpression:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:418:IfStatement:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:420:IfStatement:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:437:ConditionalExpression:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:437:ConditionalExpression:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:437:ConditionalExpression:depth=7
src/app/api/_handlers/itinerary/generate/route.ts:591:CatchClause:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:696:CatchClause:depth=5
src/app/api/_handlers/proposals/public/[token]/route.ts:352:IfStatement:depth=5
src/app/api/_handlers/proposals/public/[token]/route.ts:364:IfStatement:depth=5
src/app/api/_handlers/proposals/public/[token]/route.ts:381:TryStatement:depth=5
src/app/api/_handlers/proposals/public/[token]/route.ts:400:IfStatement:depth=6
src/app/api/_handlers/proposals/public/[token]/route.ts:407:IfStatement:depth=7
src/app/api/_handlers/proposals/public/[token]/route.ts:432:CatchClause:depth=6
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:112:IfStatement:depth=5
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:176:IfStatement:depth=5
src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route.ts:81:ConditionalExpression:depth=5
src/app/api/_handlers/reputation/sync/route.ts:237:IfStatement:depth=5
src/app/api/_handlers/reputation/sync/route.ts:250:IfStatement:depth=5
src/app/api/_handlers/reputation/sync/route.ts:254:ConditionalExpression:depth=5
src/app/api/_handlers/reputation/sync/route.ts:279:ConditionalExpression:depth=5
src/app/api/_handlers/reputation/sync/route.ts:285:IfStatement:depth=5
src/app/api/_handlers/reputation/sync/route.ts:292:IfStatement:depth=6
src/app/api/_handlers/reputation/sync/route.ts:307:IfStatement:depth=5
src/app/api/_handlers/reputation/sync/route.ts:320:ConditionalExpression:depth=5
src/app/api/_handlers/social/process-queue/route.ts:143:ConditionalExpression:depth=5
src/app/api/_handlers/social/process-queue/route.ts:148:ConditionalExpression:depth=5
src/app/api/_handlers/social/process-queue/route.ts:155:ConditionalExpression:depth=5
src/app/api/_handlers/social/process-queue/route.ts:166:ConditionalExpression:depth=5
src/app/api/_handlers/social/publish/route.ts:69:ConditionalExpression:depth=5
src/app/api/_handlers/social/schedule/route.ts:71:ConditionalExpression:depth=5
src/app/api/_handlers/social/smart-poster/route.ts:93:ConditionalExpression:depth=5
src/app/api/_handlers/trips/[id]/route.ts:299:ForStatement:depth=5
src/app/api/_handlers/trips/[id]/route.ts:307:IfStatement:depth=6
src/app/api/_handlers/trips/[id]/route.ts:310:IfStatement:depth=6
src/app/api/_handlers/trips/[id]/route.ts:318:IfStatement:depth=6
src/app/api/_handlers/trips/[id]/route.ts:323:IfStatement:depth=6
src/app/api/_handlers/whatsapp/broadcast/route.ts:441:ConditionalExpression:depth=5
src/app/auth/page.tsx:71:IfStatement:depth=5
src/app/planner/page.tsx:165:TryStatement:depth=5
src/app/planner/page.tsx:168:IfStatement:depth=6
src/app/planner/page.tsx:169:CatchClause:depth=6
src/app/social/_components/ReviewsToInsta.tsx:158:IfStatement:depth=5
src/app/social/_components/ReviewsToInsta.tsx:167:ConditionalExpression:depth=5
src/app/social/_components/ReviewsToInsta.tsx:179:IfStatement:depth=5
src/app/social/_components/ReviewsToInsta.tsx:181:IfStatement:depth=5
src/app/social/_components/TripImporter.tsx:164:IfStatement:depth=5
src/app/social/_components/TripImporter.tsx:188:IfStatement:depth=5
src/app/social/_components/TripImporter.tsx:193:IfStatement:depth=6
src/app/social/_components/TripImporter.tsx:212:IfStatement:depth=5
src/app/social/_components/TripImporter.tsx:213:IfStatement:depth=6
src/app/social/_components/TripImporter.tsx:216:IfStatement:depth=6
src/app/social/_components/TripImporter.tsx:219:IfStatement:depth=6
src/components/CreateTripModal.tsx:612:ConditionalExpression:depth=5
src/components/ShareTripModal.tsx:93:CatchClause:depth=5
src/components/assistant/TourAssistantChat.tsx:218:CatchClause:depth=5
src/components/assistant/TourAssistantChat.tsx:230:ConditionalExpression:depth=5
src/components/assistant/TourAssistantChat.tsx:240:ConditionalExpression:depth=5
src/components/assistant/TourAssistantChat.tsx:258:ConditionalExpression:depth=5
src/components/assistant/TourAssistantChat.tsx:266:IfStatement:depth=5
src/components/assistant/TourAssistantChat.tsx:269:ConditionalExpression:depth=6
src/components/assistant/TourAssistantChat.tsx:284:IfStatement:depth=5
src/components/assistant/TourAssistantChat.tsx:287:ConditionalExpression:depth=6
src/components/assistant/tour-assistant-helpers.tsx:61:IfStatement:depth=5
src/components/map/ItineraryMap.tsx:131:IfStatement:depth=5
src/components/map/ItineraryMap.tsx:132:IfStatement:depth=5
src/features/admin/billing/useBillingData.ts:145:IfStatement:depth=5
src/features/admin/pricing/components/TransactionLedger.tsx:279:ConditionalExpression:depth=5
src/lib/admin/operator-scorecard.ts:287:IfStatement:depth=5
src/lib/admin/operator-scorecard.ts:289:IfStatement:depth=5
src/lib/assistant/alerts.ts:326:IfStatement:depth=5
src/lib/image-search.ts:60:IfStatement:depth=5
src/lib/payments/webhook-handlers.ts:183:IfStatement:depth=5
src/lib/social/template-selector.ts:81:IfStatement:depth=5
src/lib/whatsapp.server.ts:83:ConditionalExpression:depth=5
```

### Potential dead exports (`ts-prune` raw output; includes Next.js framework false positives) (982)
```text
e2e/playwright.config.ts:20 - default
e2e/playwright.prod.config.ts:9 - default
e2e/playwright.public.config.ts:9 - default
e2e/playwright.pwa.config.ts:7 - default
src/middleware.ts:72 - middleware
src/middleware.ts:119 - config
e2e/fixtures/auth.ts:171 - isLoggedIn
e2e/fixtures/auth.ts:182 - logout
e2e/utils/helpers.ts:6 - waitForPageLoad
e2e/utils/helpers.ts:13 - waitForApi
e2e/utils/helpers.ts:25 - clearForm
e2e/utils/helpers.ts:37 - fillForm
e2e/utils/helpers.ts:50 - expectToast
e2e/utils/helpers.ts:69 - goToAdmin
e2e/utils/helpers.ts:82 - debugScreenshot
e2e/utils/helpers.ts:92 - mockApiResponse
e2e/utils/helpers.ts:109 - generateTestData
e2e/utils/helpers.ts:121 - expectTableColumns
e2e/utils/helpers.ts:138 - clickRowAction
src/app/global-error.tsx:6 - default
src/app/layout.tsx:46 - default
src/app/layout.tsx:24 - metadata
src/app/layout.tsx:42 - viewport
src/app/loading.tsx:1 - default
src/app/manifest.ts:3 - default
src/app/page.tsx:80 - default
src/components/TemplateAnalytics.tsx:18 - default
src/hooks/useRealtimeProposal.ts:165 - useRealtimeProposals
src/hooks/useRealtimeUpdates.ts:120 - useRealtimeUpdates
src/hooks/useRealtimeUpdates.ts:7 - RealtimeMetrics (used in module)
src/hooks/useRealtimeUpdates.ts:18 - RealtimeUpdate (used in module)
src/lib/api-dispatch.ts:17 - DispatcherRateLimitConfig (used in module)
src/lib/api-response.ts:33 - apiPaginated
src/lib/api-response.ts:3 - ApiSuccessResponse (used in module)
src/lib/api-response.ts:8 - ApiErrorResponse (used in module)
src/lib/api-response.ts:14 - ApiResponse
src/lib/api-response.ts:16 - ApiPaginatedResponse (used in module)
src/lib/database.types.ts:6703 - Tables (used in module)
src/lib/database.types.ts:6732 - TablesInsert
src/lib/database.types.ts:6757 - TablesUpdate
src/lib/database.types.ts:6782 - Enums (used in module)
src/lib/database.types.ts:6799 - CompositeTypes (used in module)
src/lib/database.types.ts:6816 - Constants
src/lib/email.ts:3 - WelcomeEmailResult (used in module)
src/lib/embeddings-v2.ts:8 - EMBEDDING_DIMENSIONS_V2 (used in module)
src/lib/embeddings.ts:21 - generateEmbedding (used in module)
src/lib/embeddings.ts:35 - embedTemplate (used in module)
src/lib/geocoding-with-cache.ts:266 - batchGeocodeLocations
src/lib/geocoding.ts:54 - geocodeLocation (used in module)
src/lib/geocoding.ts:120 - batchGeocodeLocations
src/lib/geocoding.ts:144 - getCityCenter
src/lib/geocoding.ts:153 - clearGeocodeCache
src/lib/image-search.ts:41 - getWikiImage (used in module)
src/lib/itinerary-cache.ts:106 - getCacheStats
src/lib/itinerary-cache.ts:23 - CacheKey (used in module)
src/lib/marketplace-listing-plans.ts:18 - MARKETPLACE_LISTING_PLANS (used in module)
src/lib/marketplace-options.ts:191 - normalizeMarketplaceOptionCatalog (used in module)
src/lib/marketplace-options.ts:184 - MarketplaceOptionCatalog (used in module)
src/lib/marketplace-verify-cache.ts:3 - MARKETPLACE_VERIFY_CACHE_VERSION (used in module)
src/lib/notification-templates.ts:54 - WhatsAppTemplateEnvelope (used in module)
src/lib/notifications.shared.ts:44 - formatDailyBriefingMessage
src/lib/notifications.ts:7 - NotificationPayload (used in module)
src/lib/pdf-extractor.ts:88 - extractTemplateFromPDF (used in module)
src/lib/pdf-extractor.ts:37 - ExtractedTemplate (used in module)
src/lib/pdf-extractor.ts:77 - ExtractionResult (used in module)
src/lib/proposal-notifications.ts:49 - getProposalShareUrl
src/lib/proposal-notifications.ts:58 - sendProposalEmail
src/lib/proposal-notifications.ts:64 - sendProposalWhatsApp
src/lib/proposal-notifications.ts:70 - sendProposalNotification
src/lib/proposal-notifications.ts:80 - notifyOperatorOfActivity
src/lib/proposal-notifications.ts:1 - ProposalNotification (used in module)
src/lib/proposal-notifications.ts:12 - ProposalNotificationResult (used in module)
src/lib/rag-itinerary.ts:27 - RAGItineraryRequest (used in module)
src/lib/whatsapp-waha.server.ts:19 - WahaStatus (used in module)
src/lib/whatsapp-waha.server.ts:26 - WahaSession (used in module)
src/lib/whatsapp.server.ts:5 - WhatsAppSendResult (used in module)
src/lib/whatsapp.server.ts:12 - WhatsAppLocationMessage (used in module)
src/lib/whatsapp.server.ts:205 - WhatsAppImageMessage (used in module)
src/lib/whatsapp.server.ts:214 - WhatsAppTextMessage (used in module)
src/stores/onboarding-store.ts:16 - useOnboardingStore
src/styles/design-system.ts:15 - DesignSystem (used in module)
src/styles/design-system.ts:226 - glassEffect
src/styles/design-system.ts:234 - tailwindExtension
src/styles/design-system.ts:271 - DesignSystemType
src/types/itinerary.ts:1 - Coordinate (used in module)
src/types/itinerary.ts:58 - Logistics (used in module)
src/app/add-ons/error.tsx:10 - default
src/app/add-ons/page.tsx:51 - default
src/app/admin/error.tsx:3 - default
src/app/admin/layout.tsx:19 - default
src/app/admin/loading.tsx:1 - default
src/app/admin/page.tsx:120 - default
src/app/analytics/error.tsx:10 - default
src/app/analytics/page.tsx:5 - default
src/app/auth/error.tsx:10 - default
src/app/auth/page.tsx:274 - default
src/app/billing/error.tsx:3 - default
src/app/billing/page.tsx:3 - default
src/app/bookings/error.tsx:10 - default
src/app/bookings/page.tsx:39 - default
src/app/calendar/error.tsx:3 - default
src/app/calendar/page.tsx:7 - default
src/app/clients/error.tsx:10 - default
src/app/clients/page.tsx:209 - default
src/app/dashboard/error.tsx:10 - default
src/app/design-demo/error.tsx:10 - default
src/app/design-demo/page.tsx:22 - default
src/app/drivers/error.tsx:10 - default
src/app/drivers/page.tsx:61 - default
src/app/inbox/error.tsx:10 - default
src/app/inbox/page.tsx:747 - default
src/app/map-test/error.tsx:10 - default
src/app/map-test/page.tsx:7 - default
src/app/marketing/error.tsx:10 - default
src/app/marketing/page.tsx:9 - default
src/app/marketplace/error.tsx:3 - default
src/app/marketplace/page.tsx:43 - default
src/app/offline/error.tsx:10 - default
src/app/offline/page.tsx:4 - default
src/app/onboarding/error.tsx:10 - default
src/app/onboarding/page.tsx:817 - default
src/app/planner/error.tsx:10 - default
src/app/planner/ItineraryFilterBar.tsx:125 - getFilterLabel (used in module)
src/app/planner/NeedsAttentionQueue.tsx:14 - AttentionItem (used in module)
src/app/planner/page.tsx:61 - default
src/app/planner/PlannerHero.tsx:286 - BUDGET_OPTIONS (used in module)
src/app/planner/PlannerHero.tsx:286 - INTEREST_OPTIONS (used in module)
src/app/planner/ShareItinerary.tsx:12 - default
src/app/proposals/error.tsx:3 - default
src/app/proposals/page.tsx:92 - default
src/app/reputation/error.tsx:3 - default
src/app/reputation/page.tsx:5 - default
src/app/settings/error.tsx:10 - default
src/app/settings/page.tsx:29 - default
src/app/social/error.tsx:3 - default
src/app/social/page.tsx:5 - default
src/app/support/error.tsx:10 - default
src/app/support/page.tsx:22 - default
src/app/test-db/error.tsx:10 - default
src/app/test-db/page.tsx:4 - default
src/app/trips/error.tsx:3 - default
src/app/trips/page.tsx:41 - default
src/app/trips/TripCardGrid.tsx:55 - default
src/app/trips/types.ts:1 - TripInvoiceSummary (used in module)
src/app/trips/types.ts:8 - CoverageSummary (used in module)
src/app/welcome/error.tsx:10 - default
src/app/welcome/page.tsx:6 - default
src/components/assistant/ConversationHistory.tsx:45 - default
src/components/assistant/UsageDashboard.tsx:34 - default
src/components/billing/UpgradeModal.tsx:80 - UpgradeModal
src/components/client/ProposalAddOnsSelector.tsx:49 - default
src/components/dashboard/action-queue-types.ts:19 - ActionType (used in module)
src/components/dashboard/action-queue-types.ts:39 - TASK_ACTION_CONFIG (used in module)
src/components/dashboard/action-queue-types.ts:48 - TYPE_ICONS (used in module)
src/components/dashboard/ActionQueuePanels.tsx:39 - AssignDriverPanel
src/components/dashboard/ActionQueuePanels.tsx:145 - SendReminderPanel
src/components/dashboard/ActionQueuePanels.tsx:216 - ViewLeadsPanel
src/components/dashboard/ActionQueuePanels.tsx:268 - FollowUpPanel
src/components/dashboard/ActionQueuePanels.tsx:327 - ViewSchedulePanel
src/components/dashboard/ActionQueuePanels.tsx:383 - ReviewDocsPanel
src/components/dashboard/InlineActionPanel.tsx:25 - InlineActionPanelProps (used in module)
src/components/dashboard/SystemHealth.tsx:1 - SystemHealth
src/components/dashboard/TaskRow.tsx:22 - TaskRowProps (used in module)
src/components/dashboard/WhatsAppDashboardPreview.tsx:228 - WhatsAppDashboardPreview
src/components/demo/DemoEmptyState.tsx:15 - default
src/components/demo/DemoModeGuard.tsx:20 - default
src/components/demo/FeatureCallout.tsx:55 - default
src/components/demo/FeatureCallout.tsx:116 - resetFeatureCallouts
src/components/glass/GlassButton.tsx:15 - GlassButtonProps (used in module)
src/components/glass/GlassCard.tsx:96 - GlassContainer
src/components/glass/GlassInput.tsx:14 - GlassInputProps (used in module)
src/components/glass/GlassInput.tsx:86 - GlassTextareaProps (used in module)
src/components/glass/GlassInput.tsx:149 - GlassSelectProps (used in module)
src/components/glass/GlassModal.tsx:18 - GlassModalProps (used in module)
src/components/glass/GlassModal.tsx:212 - GlassConfirmModalProps (used in module)
src/components/glass/GlassNavBar.tsx:121 - ConciergeNavButton
src/components/glass/GlassNavBar.tsx:23 - NavItem (used in module)
src/components/glass/GlassNavBar.tsx:112 - driverNavItems
src/components/glass/GlassSkeleton.tsx:109 - GlassStatsSkeleton
src/components/glass/GlassSkeleton.tsx:12 - GlassSkeletonProps (used in module)
src/components/glass/QuickQuoteModal.tsx:224 - QuickQuoteModal
src/components/god-mode/StackedCostChart.tsx:9 - CostDataPoint (used in module)
src/components/god-mode/TimeRangePicker.tsx:7 - TimeRange (used in module)
src/components/god-mode/TrendChart.tsx:12 - ChartSeries (used in module)
src/components/india/GSTInvoice.tsx:230 - GSTInvoice
src/components/india/GSTInvoice.tsx:377 - formatDate (used in module)
src/components/india/GSTInvoice.tsx:377 - getDueDate (used in module)
src/components/india/UPIPaymentModal.tsx:234 - UPIPaymentModal
src/components/itinerary/ProfessionalItineraryView.tsx:31 - default
src/components/itinerary-templates/BentoJourneyView.tsx:264 - default
src/components/itinerary-templates/index.ts:1 - SafariStoryView
src/components/itinerary-templates/index.ts:2 - UrbanBriefView
src/components/itinerary-templates/index.ts:3 - ProfessionalView
src/components/itinerary-templates/index.ts:4 - LuxuryResortView
src/components/itinerary-templates/index.ts:5 - VisualJourneyView
src/components/itinerary-templates/index.ts:6 - BentoJourneyView
src/components/itinerary-templates/index.ts:7 - TemplateSwitcher
src/components/itinerary-templates/index.ts:8 - ItineraryTemplateProps
src/components/itinerary-templates/index.ts:8 - ItineraryTemplateId
src/components/itinerary-templates/LuxuryResortView.tsx:235 - default
src/components/itinerary-templates/SafariStoryView.tsx:320 - default
src/components/itinerary-templates/VisualJourneyView.tsx:293 - default
src/components/layout/ClientHeader.tsx:6 - ClientHeader
src/components/layout/FloatingActionButton.tsx:23 - default
src/components/layout/GlobalShortcuts.tsx:6 - GlobalShortcuts
src/components/layout/useNavCounts.ts:7 - NavCounts (used in module)
src/components/leads/LeadToBookingFlow.tsx:594 - default
src/components/leads/SmartLeadCard.tsx:49 - default
src/components/payments/PaymentLinkButton.tsx:38 - default
src/components/payments/RazorpayModal.tsx:93 - default
src/components/payments/RazorpayModal.tsx:35 - RazorpayModalProps (used in module)
src/components/pdf/itinerary-pdf.tsx:19 - ItineraryPdfPreferences (used in module)
src/components/pdf/itinerary-pdf.tsx:209 - fetchItineraryBranding
src/components/pdf/PDFDownloadButton.tsx:25 - default
src/components/pdf/ProposalPDFButton.tsx:23 - ProposalPDFButton
src/components/portal/PortalItinerary.tsx:6 - ItineraryActivity (used in module)
src/components/portal/PortalItinerary.tsx:13 - ItineraryAccommodation (used in module)
src/components/settings/LanguageToggle.tsx:15 - LanguageToggle
src/components/templates/TemplateRegistry.ts:18 - TEMPLATE_REGISTRY (used in module)
src/components/templates/TemplateRegistry.ts:78 - getTemplateById
src/components/trips/ConflictWarning.tsx:187 - default
src/components/trips/GroupManager.tsx:631 - default
src/components/ui/avatar.tsx:103 - Avatar (used in module)
src/components/ui/avatar.tsx:104 - AvatarImage (used in module)
src/components/ui/avatar.tsx:105 - AvatarFallback (used in module)
src/components/ui/avatar.tsx:106 - AvatarBadge (used in module)
src/components/ui/avatar.tsx:107 - AvatarGroup (used in module)
src/components/ui/avatar.tsx:108 - AvatarGroupCount (used in module)
src/components/ui/badge.tsx:48 - badgeVariants (used in module)
src/components/ui/button.tsx:64 - buttonVariants (used in module)
src/components/ui/card.tsx:89 - CardAction (used in module)
src/components/ui/dialog.tsx:149 - DialogClose (used in module)
src/components/ui/dialog.tsx:154 - DialogOverlay (used in module)
src/components/ui/dialog.tsx:155 - DialogPortal (used in module)
src/components/ui/dropdown-menu.tsx:242 - DropdownMenu (used in module)
src/components/ui/dropdown-menu.tsx:243 - DropdownMenuPortal (used in module)
src/components/ui/dropdown-menu.tsx:244 - DropdownMenuTrigger (used in module)
src/components/ui/dropdown-menu.tsx:245 - DropdownMenuContent (used in module)
src/components/ui/dropdown-menu.tsx:246 - DropdownMenuGroup (used in module)
src/components/ui/dropdown-menu.tsx:247 - DropdownMenuLabel (used in module)
src/components/ui/dropdown-menu.tsx:248 - DropdownMenuItem (used in module)
src/components/ui/dropdown-menu.tsx:249 - DropdownMenuCheckboxItem (used in module)
src/components/ui/dropdown-menu.tsx:250 - DropdownMenuRadioGroup (used in module)
src/components/ui/dropdown-menu.tsx:251 - DropdownMenuRadioItem (used in module)
src/components/ui/dropdown-menu.tsx:252 - DropdownMenuSeparator (used in module)
src/components/ui/dropdown-menu.tsx:253 - DropdownMenuShortcut (used in module)
src/components/ui/dropdown-menu.tsx:254 - DropdownMenuSub (used in module)
src/components/ui/dropdown-menu.tsx:255 - DropdownMenuSubTrigger (used in module)
src/components/ui/dropdown-menu.tsx:256 - DropdownMenuSubContent (used in module)
src/components/ui/label.tsx:24 - Label (used in module)
src/components/ui/map.tsx:1 - useMap
src/components/ui/map.tsx:2 - MarkerPopup
src/components/ui/map.tsx:2 - MarkerTooltip
src/components/ui/map.tsx:2 - MarkerLabel
src/components/ui/map.tsx:3 - MapPopup
src/components/ui/map.tsx:4 - MapRoute
src/components/ui/map.tsx:4 - MapClusterLayer
src/components/ui/map.tsx:5 - MapRef
src/components/ui/map.tsx:5 - MapViewport
src/components/ui/select.tsx:183 - SelectGroup (used in module)
src/components/ui/select.tsx:185 - SelectLabel (used in module)
src/components/ui/select.tsx:186 - SelectScrollDownButton (used in module)
src/components/ui/select.tsx:187 - SelectScrollUpButton (used in module)
src/components/ui/select.tsx:188 - SelectSeparator (used in module)
src/components/ui/skeleton.tsx:13 - Skeleton (used in module)
src/components/ui/toast.tsx:10 - ToastOptions (used in module)
src/components/whatsapp/ActionPickerModal.tsx:2 - ActionPickerModalProps
src/components/whatsapp/MessageThread.tsx:32 - MessageType (used in module)
src/components/whatsapp/MessageThread.tsx:33 - MessageStatus (used in module)
src/components/whatsapp/MessageThread.tsx:34 - MessageDirection (used in module)
src/components/whatsapp/unified-inbox-shared.tsx:33 - getLastMessage (used in module)
src/components/whatsapp/unified-inbox-shared.tsx:37 - lastMessagePreview (used in module)
src/components/whatsapp/unified-inbox-shared.tsx:48 - LabelChip (used in module)
src/components/whatsapp/whatsapp.types.ts:3 - ContactType (used in module)
src/components/whatsapp/whatsapp.types.ts:5 - ChatbotState (used in module)
src/features/calendar/availability.ts:26 - slotOverlapsRange (used in module)
src/features/calendar/CalendarEmptyState.tsx:13 - CalendarEmptyState
src/features/calendar/types.ts:164 - CreatePersonalEventInput
src/features/calendar/useCalendarAvailability.ts:6 - calendarAvailabilityKeys (used in module)
src/features/calendar/utils.ts:8 - getDaysInMonth (used in module)
src/features/calendar/utils.ts:12 - getFirstDayOfMonth (used in module)
src/features/calendar/utils.ts:122 - isSameDay (used in module)
src/features/trip-detail/types.ts:64 - TripItinerary (used in module)
src/features/trip-detail/types.ts:149 - InvoiceLineItem (used in module)
src/features/trip-detail/types.ts:211 - StatusItemData
src/features/trip-detail/utils.ts:7 - isValidTime (used in module)
src/features/trip-detail/utils.ts:11 - timeToMinutes (used in module)
src/features/trip-detail/utils.ts:16 - minutesToTime (used in module)
src/features/trip-detail/utils.ts:23 - roundToNearestThirty (used in module)
src/features/trip-detail/utils.ts:31 - haversineKm (used in module)
src/features/trip-detail/utils.ts:46 - estimateTravelMinutes (used in module)
src/features/trip-detail/utils.ts:98 - formatINRShort
src/lib/activities/reorder.ts:16 - updateActivityDisplayOrders (used in module)
src/lib/activities/reorder.ts:60 - reorderArray (used in module)
src/lib/activities/reorder.ts:87 - reorderActivities
src/lib/admin/action-queue.ts:3 - QueueAction (used in module)
src/lib/admin/date-range.ts:40 - toInputDate (used in module)
src/lib/admin/date-range.ts:44 - formatRangeLabel (used in module)
src/lib/admin/insights.ts:3 - RiskLevel (used in module)
src/lib/admin/insights.ts:5 - ProposalRiskInput (used in module)
src/lib/admin/insights.ts:15 - ProposalRiskScore (used in module)
src/lib/admin/operator-scorecard-delivery.ts:34 - renderOperatorScorecardPdf (used in module)
src/lib/admin/operator-scorecard-delivery.ts:44 - deliverOperatorScorecard (used in module)
src/lib/admin/operator-scorecard.ts:78 - OperatorScorecardMetrics (used in module)
src/lib/admin/operator-scorecard.ts:98 - OperatorScorecardComparison (used in module)
src/lib/admin/operator-scorecard.ts:107 - OperatorScorecardRecipient (used in module)
src/lib/admin/operator-scorecard.ts:132 - PersistedOperatorScorecard (used in module)
src/lib/ai/cost-guardrails.ts:3 - AiUsageEventKind (used in module)
src/lib/ai/cost-guardrails.ts:5 - OrgAiUsageSnapshot (used in module)
src/lib/ai/gemini.server.ts:18 - cleanGeminiJson (used in module)
src/lib/ai/upsell-engine.ts:424 - createUpsellEngine
src/lib/ai/upsell-engine.ts:43 - Client (used in module)
src/lib/ai/upsell-engine.ts:53 - Trip (used in module)
src/lib/ai/upsell-engine.ts:61 - AddOn (used in module)
src/lib/ai/upsell-engine.ts:73 - RecommendedAddOn (used in module)
src/lib/ai/upsell-engine.ts:79 - UpsellEngineConfig (used in module)
src/lib/ai/upsell-engine.ts:97 - UpsellEngine (used in module)
src/lib/analytics/adapters.ts:78 - MoMInputPoint (used in module)
src/lib/analytics/drill-through-loaders.ts:25 - DrillResult (used in module)
src/lib/analytics/template-analytics.ts:37 - trackTemplateView
src/lib/analytics/template-analytics.ts:76 - trackTemplateUsage
src/lib/analytics/template-analytics.ts:175 - getTemplateViewTimeline
src/lib/api/response.ts:60 - setRequestIdHeader
src/lib/assistant/alerts.ts:80 - detectAlerts (used in module)
src/lib/assistant/alerts.ts:205 - getEligibleOrgsForAlerts (used in module)
src/lib/assistant/alerts.ts:33 - AlertTrigger (used in module)
src/lib/assistant/audit.ts:23 - AuditEventType (used in module)
src/lib/assistant/audit.ts:31 - AuditEvent (used in module)
src/lib/assistant/briefing.ts:61 - formatBriefingMessage (used in module)
src/lib/assistant/briefing.ts:124 - getEligibleOrgsForBriefing (used in module)
src/lib/assistant/context-engine.ts:29 - getTodaysTrips (used in module)
src/lib/assistant/context-engine.ts:68 - getPendingInvoices (used in module)
src/lib/assistant/context-engine.ts:108 - getRecentlyActiveClients (used in module)
src/lib/assistant/context-engine.ts:159 - getFailedNotifications (used in module)
src/lib/assistant/conversation-store.ts:17 - StoredMessage (used in module)
src/lib/assistant/conversation-store.ts:26 - ConversationSummary (used in module)
src/lib/assistant/conversation-store.ts:34 - ConversationDetail (used in module)
src/lib/assistant/export.ts:15 - ExportColumn (used in module)
src/lib/assistant/export.ts:20 - ExportResult (used in module)
src/lib/assistant/guardrails.ts:47 - getBlocklistDescription
src/lib/assistant/guardrails.ts:65 - checkSessionWriteLimit
src/lib/assistant/guardrails.ts:82 - resetSessionWriteCount
src/lib/assistant/guardrails.ts:87 - getSessionWriteCount
src/lib/assistant/guardrails.ts:96 - MAX_MESSAGE_LENGTH
src/lib/assistant/guardrails.ts:99 - MAX_TOOL_ROUNDS
src/lib/assistant/guardrails.ts:102 - MAX_HISTORY_MESSAGES
src/lib/assistant/model-router.ts:47 - isComplexQuery (used in module)
src/lib/assistant/preferences.ts:23 - PreferenceEntry (used in module)
src/lib/assistant/response-cache.ts:72 - normalizeQuery (used in module)
src/lib/assistant/response-cache.ts:92 - hashQuery (used in module)
src/lib/assistant/response-cache.ts:101 - buildCacheKey (used in module)
src/lib/assistant/session.ts:28 - PendingAction (used in module)
src/lib/assistant/session.ts:36 - SessionData (used in module)
src/lib/assistant/suggested-actions.ts:16 - SuggestedAction (used in module)
src/lib/assistant/types.ts:17 - ActionCategory (used in module)
src/lib/assistant/types.ts:20 - ActionChannel (used in module)
src/lib/assistant/types.ts:63 - ActionParameterSchema (used in module)
src/lib/assistant/types.ts:127 - TripSnapshot (used in module)
src/lib/assistant/types.ts:136 - InvoiceSnapshot (used in module)
src/lib/assistant/types.ts:148 - ClientSnapshot (used in module)
src/lib/assistant/types.ts:157 - FailedNotification (used in module)
src/lib/assistant/usage-meter.ts:27 - UsageStatus (used in module)
src/lib/assistant/usage-meter.ts:36 - UsageIncrementOptions (used in module)
src/lib/assistant/usage-meter.ts:385 - buildLimitReachedMessage (used in module)
src/lib/assistant/weekly-digest.ts:193 - formatDigestMessage (used in module)
src/lib/assistant/weekly-digest.ts:253 - getEligibleOrgsForDigest (used in module)
src/lib/auth/require-super-admin.ts:16 - RequireSuperAdminResult (used in module)
src/lib/billing/credit-packs.ts:8 - CreditPackKey (used in module)
src/lib/billing/credit-packs.ts:14 - CreditPackCategory (used in module)
src/lib/billing/credit-packs.ts:16 - CreditPackDefinition (used in module)
src/lib/billing/outcome-upgrade.ts:1 - OutcomePackageKey (used in module)
src/lib/billing/outcome-upgrade.ts:3 - OutcomePackage (used in module)
src/lib/billing/outcome-upgrade.ts:11 - OutcomeUpgradePrompt (used in module)
src/lib/billing/outcome-upgrade.ts:24 - OutcomeUpgradeInputs (used in module)
src/lib/billing/plan-catalog.ts:4 - CanonicalPlan (used in module)
src/lib/billing/tiers.ts:197 - isFeatureAllowed
src/lib/billing/tiers.ts:203 - getTripLimit
src/lib/billing/tiers.ts:207 - formatPrice
src/lib/cache/upstash.ts:37 - isUpstashConfigured (used in module)
src/lib/config/env.ts:44 - missingEnv
src/lib/cost/alert-ack.ts:12 - CostAlertAckMap (used in module)
src/lib/cost/overview-cache.ts:20 - getCostOverviewCachePrefix (used in module)
src/lib/cost/overview-cache.ts:3 - COST_OVERVIEW_CACHE_VERSION (used in module)
src/lib/cost/spend-guardrails.ts:137 - getDefaultEmergencyDailySpendCapUsd (used in module)
src/lib/cost/spend-guardrails.ts:213 - recordDailySpendUsd
src/lib/cost/spend-guardrails.ts:237 - SpendReservationResult (used in module)
src/lib/date/tz.ts:33 - isValidTimezone (used in module)
src/lib/email/notifications.tsx:10 - formatInr
src/lib/external/amadeus.ts:71 - AmadeusLocation (used in module)
src/lib/external/currency.ts:229 - getCurrencySymbol
src/lib/external/currency.ts:236 - getCurrencyForCountry
src/lib/external/google.server.ts:60 - refreshGoogleToken
src/lib/external/google.server.ts:8 - GoogleTokens (used in module)
src/lib/external/google.server.ts:16 - GoogleUserInfo (used in module)
src/lib/external/linkedin.server.ts:7 - LinkedInTokens (used in module)
src/lib/external/linkedin.server.ts:13 - LinkedInProfile (used in module)
src/lib/external/tripadvisor.server.ts:6 - TripAdvisorLocation (used in module)
src/lib/external/tripadvisor.server.ts:18 - TripAdvisorReview (used in module)
src/lib/external/weather.ts:232 - getWeatherIcon
src/lib/external/weather.ts:12 - WeatherForecast (used in module)
src/lib/external/whatsapp.ts:22 - sendItineraryToWhatsApp
src/lib/i18n/hindi.ts:127 - t (used in module)
src/lib/i18n/hindi.ts:131 - useTranslation
src/lib/i18n/hindi.ts:1 - LangKey (used in module)
src/lib/i18n/hindi.ts:15 - Language (used in module)
src/lib/i18n/hindi.ts:17 - EN (used in module)
src/lib/i18n/hindi.ts:72 - HI (used in module)
src/lib/import/types.ts:1 - ExtractedDay (used in module)
src/lib/import/types.ts:9 - ExtractedActivity (used in module)
src/lib/import/types.ts:20 - ExtractedAccommodation (used in module)
src/lib/india/destinations.ts:558 - getDestinationsByRegion
src/lib/india/destinations.ts:576 - allDestinations
src/lib/india/formats.ts:106 - formatIndianPhone
src/lib/india/formats.ts:129 - getISTTime (used in module)
src/lib/india/formats.ts:140 - formatISTDateTime
src/lib/india/formats.ts:163 - formatISTTime
src/lib/india/formats.ts:181 - getGreeting
src/lib/india/gst.ts:72 - calculateGST (used in module)
src/lib/india/gst.ts:97 - generateInvoiceNumber (used in module)
src/lib/india/gst.ts:133 - amountToWords (used in module)
src/lib/india/gst.ts:168 - createTourPackageInvoice
src/lib/india/gst.ts:4 - GSTRates (used in module)
src/lib/india/gst.ts:17 - GSTBreakdown (used in module)
src/lib/india/pricing.ts:221 - getQuickEstimate
src/lib/india/pricing.ts:256 - BASE_DAILY_RATES (used in module)
src/lib/india/pricing.ts:256 - TIER_BASE_RATE (used in module)
src/lib/invoices/module.ts:230 - asObjectJson (used in module)
src/lib/invoices/module.ts:6 - INVOICE_STATUS_VALUES (used in module)
src/lib/invoices/module.ts:15 - PAYMENT_STATUS_VALUES (used in module)
src/lib/invoices/module.ts:17 - InvoiceLineItemSchema (used in module)
src/lib/invoices/module.ts:54 - InvoiceLineItemInput (used in module)
src/lib/invoices/module.ts:56 - InvoiceLineItem (used in module)
src/lib/invoices/module.ts:62 - InvoiceTotals (used in module)
src/lib/invoices/module.ts:69 - InvoiceTaxBreakdown (used in module)
src/lib/invoices/module.ts:89 - OrganizationSnapshot (used in module)
src/lib/invoices/module.ts:99 - ClientSnapshot (used in module)
src/lib/invoices/module.ts:106 - NormalizedInvoiceMetadata (used in module)
src/lib/invoices/public-link.ts:8 - signInvoiceAccess (used in module)
src/lib/leads/intent-parser.ts:40 - detectDestination (used in module)
src/lib/leads/intent-parser.ts:66 - extractTravelerCount (used in module)
src/lib/leads/intent-parser.ts:91 - extractDuration (used in module)
src/lib/leads/intent-parser.ts:112 - extractBudget (used in module)
src/lib/leads/intent-parser.ts:148 - isLikelyInquiry (used in module)
src/lib/leads/types.ts:15 - LeadEventType (used in module)
src/lib/leads/types.ts:59 - Lead
src/lib/leads/types.ts:88 - LeadEvent
src/lib/leads/types.ts:101 - ConversionEvent
src/lib/notifications/browser-push.ts:10 - NotificationType (used in module)
src/lib/notifications/browser-push.ts:12 - PushNotification (used in module)
src/lib/observability/logger.ts:3 - LogLevel (used in module)
src/lib/observability/logger.ts:5 - LogContext (used in module)
src/lib/payments/errors.ts:25 - PaymentErrorTags (used in module)
src/lib/payments/link-tracker.ts:79 - markPaymentLinkPaid
src/lib/payments/link-tracker.ts:93 - CreatePaymentLinkInput (used in module)
src/lib/payments/payment-links.server.ts:146 - appendPaymentLinkEvent (used in module)
src/lib/payments/payment-service.ts:3 - SubscriptionPlan
src/lib/payments/payment-service.ts:18 - PaymentService (used in module)
src/lib/payments/payment-utils.ts:13 - severityForCode (used in module)
src/lib/payments/razorpay.ts:21 - Payment (used in module)
src/lib/payments/razorpay.ts:35 - Subscription (used in module)
src/lib/payments/razorpay.ts:62 - Customer (used in module)
src/lib/payments/razorpay.ts:73 - PaymentLink (used in module)
src/lib/payments/razorpay.ts:82 - Invoice (used in module)
src/lib/payments/subscription-service.ts:271 - Subscription (used in module)
src/lib/pdf/proposal-pdf.tsx:287 - ProposalPDF
src/lib/platform/audit.ts:37 - logPlatformActionWithTarget
src/lib/platform/audit.ts:8 - AuditCategory (used in module)
src/lib/platform/settings.ts:138 - getMaintenanceSettings
src/lib/platform/settings.ts:166 - getFeatureFlags
src/lib/platform/settings.ts:197 - getAllPlatformSettings
src/lib/proposals/types.ts:12 - TIER_LABELS
src/lib/pwa/offline-mutations.ts:167 - enqueueOfflineMutation (used in module)
src/lib/pwa/offline-mutations.ts:197 - listOfflineMutations (used in module)
src/lib/pwa/offline-mutations.ts:218 - getOfflineMutationQueueSize (used in module)
src/lib/pwa/offline-mutations.ts:248 - replayOfflineMutationsFromClient (used in module)
src/lib/pwa/offline-mutations.ts:340 - registerOfflineSync (used in module)
src/lib/pwa/offline-mutations.ts:1 - OFFLINE_MUTATION_DB (used in module)
src/lib/pwa/offline-mutations.ts:2 - OFFLINE_MUTATION_STORE (used in module)
src/lib/pwa/offline-mutations.ts:3 - OFFLINE_SYNC_TAG (used in module)
src/lib/pwa/offline-mutations.ts:7 - OfflineMutationRecord (used in module)
src/lib/pwa/offline-mutations.ts:18 - OfflineReplayResult (used in module)
src/lib/queries/analytics.ts:11 - useRevenueAnalytics
src/lib/queries/analytics.ts:39 - useConversionAnalytics
src/lib/queries/analytics.ts:4 - analyticsKeys (used in module)
src/lib/queries/clients.ts:46 - useClient
src/lib/queries/clients.ts:9 - clientsKeys (used in module)
src/lib/queries/dashboard-tasks.ts:23 - DashboardTasksResponse (used in module)
src/lib/queries/dashboard-tasks.ts:43 - DashboardScheduleResponse (used in module)
src/lib/queries/dashboard-tasks.ts:48 - DriverSearchResult (used in module)
src/lib/queries/dashboard-tasks.ts:62 - dashboardTasksKeys (used in module)
src/lib/queries/dashboard-tasks.ts:236 - DismissTaskInput (used in module)
src/lib/queries/dashboard.ts:33 - DashboardStatsResponse (used in module)
src/lib/queries/dashboard.ts:40 - dashboardKeys (used in module)
src/lib/queries/proposals.ts:149 - useProposal
src/lib/queries/proposals.ts:75 - proposalsKeys (used in module)
src/lib/queries/referrals.ts:4 - ReferralStats (used in module)
src/lib/queries/referrals.ts:12 - Referral (used in module)
src/lib/queries/referrals.ts:21 - ReferralData (used in module)
src/lib/queries/support.ts:4 - SupportTicket (used in module)
src/lib/queries/support.ts:20 - CreateSupportTicketParams (used in module)
src/lib/queries/trip-detail.ts:15 - tripDetailKeys (used in module)
src/lib/queries/trips.ts:61 - useTrip
src/lib/queries/trips.ts:11 - tripsKeys (used in module)
src/lib/reputation/campaign-trigger.ts:7 - CampaignTriggerResult (used in module)
src/lib/reputation/constants.ts:3 - REPUTATION_PLATFORMS
src/lib/reputation/constants.ts:53 - RATING_THRESHOLDS
src/lib/reputation/constants.ts:61 - RESPONSE_TIME_TARGETS
src/lib/reputation/constants.ts:86 - ReputationTierLimits (used in module)
src/lib/reputation/constants.ts:142 - HEALTH_SCORE_LABELS
src/lib/reputation/constants.ts:157 - DEFAULT_REVIEWS_PER_PAGE
src/lib/reputation/review-marketing.server.ts:239 - isReviewEligibleForMarketing (used in module)
src/lib/reputation/score-calculator.ts:60 - classifySentiment
src/lib/reputation/score-calculator.ts:82 - calculateNPS
src/lib/reputation/score-calculator.ts:90 - calculateResponseRate
src/lib/reputation/score-calculator.ts:98 - calculateAvgRating
src/lib/reputation/score-calculator.ts:104 - getRatingDistribution
src/lib/reputation/types.ts:21 - SendStatus (used in module)
src/lib/reputation/types.ts:281 - ReviewsListParams
src/lib/reputation/types.ts:294 - CreateReviewInput
src/lib/reputation/types.ts:309 - UpdateReviewInput
src/lib/reputation/types.ts:332 - NPSSubmission
src/lib/reputation/types.ts:367 - CampaignFunnelStats
src/lib/security/admin-mutation-csrf.ts:12 - isBearerRequest (used in module)
src/lib/security/admin-mutation-csrf.ts:17 - hasTrustedSameOrigin (used in module)
src/lib/security/cost-endpoint-guard.ts:53 - CostEndpointGuardContext (used in module)
src/lib/security/cost-endpoint-guard.ts:76 - CostEndpointGuardResult (used in module)
src/lib/security/cron-auth.ts:118 - isCronSecretHeader (used in module)
src/lib/security/cron-auth.ts:6 - CronAuthOptions (used in module)
src/lib/security/cron-auth.ts:14 - CronAuthResult (used in module)
src/lib/security/public-rate-limit.ts:13 - getRequestIp (used in module)
src/lib/security/public-rate-limit.ts:24 - withRateLimitHeaders (used in module)
src/lib/security/rate-limit.ts:12 - RateLimitOptions (used in module)
src/lib/security/sanitize.ts:1 - SanitizeTextOptions (used in module)
src/lib/security/social-token-crypto.ts:65 - isEncryptedSocialToken (used in module)
src/lib/security/social-token-crypto.ts:89 - decryptSocialToken (used in module)
src/lib/social/ai-prompts.ts:231 - generateStyleVariations
src/lib/social/ai-prompts.ts:380 - generatePosterStyleVariations
src/lib/social/color-utils.ts:19 - generateOverlayGradients
src/lib/social/destination-images.ts:334 - getDestinationNames
src/lib/social/destination-images.ts:48 - DESTINATION_LIBRARY (used in module)
src/lib/social/fonts.ts:6 - SatoriFont (used in module)
src/lib/social/indian-calendar.ts:1 - IndianFestival (used in module)
src/lib/social/indian-calendar.ts:12 - indianCalendarDesc (used in module)
src/lib/social/poster-composer.ts:53 - CompositionPlan (used in module)
src/lib/social/poster-renderer.ts:29 - DIMENSIONS (used in module)
src/lib/social/poster-renderer.ts:29 - LAYOUT_CONFIGS (used in module)
src/lib/social/poster-renderer.ts:30 - MULTI_IMAGE_SLOTS (used in module)
src/lib/social/poster-renderer.ts:30 - prepareMultiImageCanvas (used in module)
src/lib/social/poster-renderer.ts:32 - buildGradientOverlay
src/lib/social/poster-renderer.ts:33 - buildHeaderBlock
src/lib/social/poster-renderer.ts:34 - buildHeroBlock
src/lib/social/poster-renderer.ts:35 - buildPriceBlock
src/lib/social/poster-renderer.ts:36 - buildFooterBlock
src/lib/social/poster-renderer.ts:37 - buildPosterJsx (used in module)
src/lib/social/poster-renderer.ts:39 - buildPremiumTextJsx (used in module)
src/lib/social/poster-renderer.ts:39 - buildGenericFooter
src/lib/social/poster-renderer.ts:40 - prepareBackground (used in module)
src/lib/social/poster-renderer.ts:41 - LayoutConfig
src/lib/social/poster-renderer.ts:41 - ImageSlot
src/lib/social/poster-renderer.ts:41 - SatoriNode
src/lib/social/poster-renderer.ts:41 - Dimensions
src/lib/social/poster-shapes.ts:126 - createDropShadow
src/lib/social/review-queue.server.ts:43 - PublishReviewInput (used in module)
src/lib/social/review-queue.server.ts:44 - ScheduleReviewInput (used in module)
src/lib/social/template-registry.ts:53 - getTemplateById (used in module)
src/lib/social/template-registry.ts:57 - getTemplatesByTier (used in module)
src/lib/social/template-registry.ts:62 - TIER_ORDER (used in module)
src/lib/social/template-registry.ts:65 - festivalTemplates (used in module)
src/lib/social/template-registry.ts:66 - seasonTemplates (used in module)
src/lib/social/template-registry.ts:67 - destinationTemplates (used in module)
src/lib/social/template-registry.ts:68 - destinationGalleryTemplates (used in module)
src/lib/social/template-registry.ts:69 - packageTemplates (used in module)
src/lib/social/template-registry.ts:70 - promotionTemplates (used in module)
src/lib/social/template-registry.ts:71 - contentTemplates (used in module)
src/lib/social/types.ts:49 - TierLevel (used in module)
src/lib/social/types.ts:86 - CarouselSlide
src/lib/social/types.ts:96 - PostStatus
src/lib/social/types.ts:97 - PostSource
src/lib/subscriptions/limits.ts:11 - SubscriptionPlanId (used in module)
src/lib/subscriptions/limits.ts:12 - LimitedFeature (used in module)
src/lib/subscriptions/limits.ts:19 - SubscriptionLifecycleStatus (used in module)
src/lib/subscriptions/limits.ts:31 - LifecyclePlanResolutionInput (used in module)
src/lib/subscriptions/limits.ts:49 - FeatureLimitStatus (used in module)
src/lib/supabase/types.ts:1 - Json (used in module)
src/lib/supabase/types.ts:9 - Database
src/lib/tax/gst-calculator.ts:132 - calculateGSTForItems
src/lib/tax/gst-calculator.ts:155 - calculateReverseGST
src/lib/tax/gst-calculator.ts:180 - calculateTDS
src/lib/tax/gst-calculator.ts:199 - formatGSTBreakdown
src/lib/tax/gst-calculator.ts:235 - validateGSTIN (used in module)
src/lib/tax/gst-calculator.ts:281 - getStateCodeFromGSTIN (used in module)
src/lib/tax/gst-calculator.ts:294 - isGSTINFromState
src/lib/tax/gst-calculator.ts:342 - getStateNameFromCode
src/lib/tax/gst-calculator.ts:17 - GSTCalculation (used in module)
src/lib/tax/gst-calculator.ts:26 - GST_RATE (used in module)
src/lib/tax/gst-calculator.ts:27 - CGST_RATE (used in module)
src/lib/tax/gst-calculator.ts:28 - SGST_RATE (used in module)
src/lib/tax/gst-calculator.ts:29 - IGST_RATE (used in module)
src/lib/tax/gst-calculator.ts:72 - IndianState
src/lib/tax/gst-calculator.ts:300 - STATE_CODES (used in module)
src/lib/team/roles.ts:105 - hasPermission
src/lib/team/roles.ts:109 - getRoleLabel
src/lib/team/roles.ts:3 - RoleDefinition (used in module)
src/lib/trips/conflict-detection.ts:38 - timeToMinutes (used in module)
src/lib/trips/conflict-detection.ts:50 - formatConflictMessage
src/lib/trips/conflict-detection.ts:83 - estimateTravelTime (used in module)
src/lib/trips/conflict-detection.ts:101 - detectOverlaps (used in module)
src/lib/trips/conflict-detection.ts:136 - checkTravelFeasibility (used in module)
src/lib/trips/conflict-detection.ts:186 - validateDurations (used in module)
src/lib/trips/conflict-detection.ts:222 - checkMealBreaks (used in module)
src/lib/trips/conflict-detection.ts:17 - ConflictType (used in module)
src/lib/whatsapp/chatbot-flow.ts:15 - ChatbotState (used in module)
src/lib/whatsapp/chatbot-flow.ts:17 - ChatbotSessionSummary (used in module)
src/lib/whatsapp/india-templates.ts:697 - extractVariables
src/lib/whatsapp/india-templates.ts:705 - getTemplatesByCategory
src/lib/whatsapp/india-templates.ts:712 - getTemplatesByLanguage
src/lib/whatsapp/india-templates.ts:720 - getPreferredTemplate
src/lib/whatsapp/proposal-drafts.server.ts:71 - buildLeadPlaceholderEmail
src/lib/whatsapp/proposal-drafts.server.ts:77 - parseGroupSize (used in module)
src/lib/whatsapp/proposal-drafts.server.ts:102 - parseBudgetInr (used in module)
src/lib/whatsapp/proposal-drafts.server.ts:138 - parseLooseDateRange (used in module)
src/lib/whatsapp/proposal-drafts.server.ts:162 - buildProposalDraftTitle (used in module)
src/lib/whatsapp/proposal-drafts.server.ts:10 - WhatsAppCollectedFields (used in module)
src/lib/whatsapp/proposal-drafts.server.ts:17 - WhatsAppProposalDraft (used in module)
src/lib/whatsapp/proposal-drafts.server.ts:38 - WhatsAppProposalDraftSummary (used in module)
src/app/(superadmin)/god/error.tsx:10 - default
src/app/(superadmin)/god/layout.tsx:12 - default
src/app/(superadmin)/god/page.tsx:54 - default
src/app/add-ons/_components/types.ts:24 - BadgeVariant (used in module)
src/app/add-ons/_components/types.ts:26 - CATEGORY_BADGE_VARIANTS (used in module)
src/app/admin/activity/error.tsx:10 - default
src/app/admin/activity/page.tsx:80 - default
src/app/admin/billing/error.tsx:10 - default
src/app/admin/billing/page.tsx:5 - default
src/app/admin/cost/error.tsx:10 - default
src/app/admin/cost/page.tsx:48 - default
src/app/admin/gst-report/error.tsx:10 - default
src/app/admin/gst-report/page.tsx:193 - default
src/app/admin/insights/error.tsx:10 - default
src/app/admin/insights/page.tsx:29 - default
src/app/admin/insights/shared.ts:1 - ActionItem (used in module)
src/app/admin/insights/shared.ts:21 - LeakItem (used in module)
src/app/admin/insights/shared.ts:35 - UpsellRec (used in module)
src/app/admin/invoices/error.tsx:10 - default
src/app/admin/invoices/page.tsx:23 - default
src/app/admin/kanban/error.tsx:10 - default
src/app/admin/kanban/page.tsx:85 - default
src/app/admin/notifications/error.tsx:10 - default
src/app/admin/notifications/page.tsx:30 - default
src/app/admin/notifications/shared.tsx:107 - getNotificationStatusIcon (used in module)
src/app/admin/notifications/shared.tsx:135 - normalizePhone (used in module)
src/app/admin/notifications/shared.tsx:139 - buildWhatsAppLink (used in module)
src/app/admin/notifications/shared.tsx:76 - WhatsAppHealthSummary (used in module)
src/app/admin/notifications/shared.tsx:87 - WhatsAppHealthPing (used in module)
src/app/admin/operations/error.tsx:10 - default
src/app/admin/operations/page.tsx:135 - default
src/app/admin/planner/error.tsx:10 - default
src/app/admin/planner/page.tsx:77 - default
src/app/admin/pricing/error.tsx:10 - default
src/app/admin/pricing/page.tsx:47 - default
src/app/admin/referrals/error.tsx:10 - default
src/app/admin/referrals/page.tsx:14 - default
src/app/admin/revenue/error.tsx:10 - default
src/app/admin/revenue/page.tsx:5 - default
src/app/admin/security/error.tsx:10 - default
src/app/admin/security/page.tsx:44 - default
src/app/admin/settings/error.tsx:10 - default
src/app/admin/settings/page.tsx:38 - default
src/app/admin/settings/shared.ts:64 - EMPTY_BILLING_ADDRESS (used in module)
src/app/admin/support/error.tsx:10 - default
src/app/admin/support/page.tsx:71 - default
src/app/admin/templates/error.tsx:10 - default
src/app/admin/templates/page.tsx:84 - default
src/app/admin/tour-templates/error.tsx:10 - default
src/app/admin/tour-templates/page.tsx:49 - default
src/app/admin/trips/error.tsx:10 - default
src/app/admin/trips/page.tsx:69 - default
src/app/analytics/drill-through/error.tsx:10 - default
src/app/analytics/drill-through/page.tsx:248 - default
src/app/analytics/templates/error.tsx:10 - default
src/app/analytics/templates/page.tsx:13 - default
src/app/api/[...path]/route.ts:3 - maxDuration
src/app/api/[...path]/route.ts:126 - GET
src/app/api/[...path]/route.ts:126 - POST
src/app/api/[...path]/route.ts:126 - PATCH
src/app/api/[...path]/route.ts:126 - PUT
src/app/api/[...path]/route.ts:126 - DELETE
src/app/api/[...path]/route.ts:126 - OPTIONS
src/app/api/availability/route.ts:18 - GET
src/app/api/availability/route.ts:67 - POST
src/app/api/availability/route.ts:117 - DELETE
src/app/auth/callback/route.ts:4 - GET
src/app/auth/signout/route.ts:4 - POST
src/app/clients/[id]/client-profile-shared.ts:62 - getInitials (used in module)
src/app/clients/[id]/client-profile-shared.ts:248 - TAG_CONFIG (used in module)
src/app/clients/[id]/error.tsx:7 - default
src/app/clients/[id]/page.tsx:36 - default
src/app/dashboard/schedule/error.tsx:10 - default
src/app/dashboard/schedule/page.tsx:385 - default
src/app/dashboard/tasks/error.tsx:10 - default
src/app/dashboard/tasks/page.tsx:688 - default
src/app/drivers/[id]/error.tsx:10 - default
src/app/drivers/[id]/page.tsx:27 - default
src/app/live/[token]/error.tsx:10 - default
src/app/live/[token]/page.tsx:42 - default
src/app/marketplace/[id]/error.tsx:10 - default
src/app/marketplace/[id]/page.tsx:89 - default
src/app/marketplace/analytics/error.tsx:10 - default
src/app/marketplace/analytics/page.tsx:52 - default
src/app/marketplace/inquiries/error.tsx:10 - default
src/app/marketplace/inquiries/page.tsx:33 - default
src/app/p/[token]/error.tsx:10 - default
src/app/p/[token]/page.tsx:38 - default
src/app/pay/[token]/error.tsx:10 - default
src/app/pay/[token]/page.tsx:19 - default
src/app/portal/[token]/error.tsx:10 - default
src/app/portal/[token]/layout.tsx:20 - default
src/app/portal/[token]/page.tsx:82 - default
src/app/proposals/[id]/error.tsx:10 - default
src/app/proposals/[id]/page.tsx:74 - default
src/app/proposals/create/error.tsx:10 - default
src/app/proposals/create/page.tsx:25 - default
src/app/reputation/_components/CompetitorBenchmark.tsx:77 - default
src/app/reputation/_components/mock-data.ts:12 - MOCK_REVIEWS
src/app/reputation/_components/mock-data.ts:292 - MOCK_DASHBOARD_DATA
src/app/reputation/_components/mock-data.ts:327 - MOCK_CAMPAIGNS
src/app/reputation/_components/mock-data.ts:409 - MOCK_SENTIMENT_DATA
src/app/reputation/_components/mock-data.ts:419 - MOCK_TOPICS
src/app/reputation/_components/mock-data.ts:438 - MOCK_REVENUE_DATA
src/app/reputation/_components/mock-data.ts:448 - MOCK_COMPETITORS
src/app/reputation/_components/mock-data.ts:491 - MOCK_CONNECTIONS
src/app/reputation/_components/mock-data.ts:523 - MOCK_BRAND_VOICE
src/app/reputation/_components/mock-data.ts:549 - MOCK_WIDGET
src/app/reputation/_components/RatingDistribution.tsx:18 - default
src/app/reputation/_components/ReviewToRevenueChart.tsx:66 - default
src/app/reputation/_components/useReputationDashboardData.ts:15 - TopicAnalyticsPoint (used in module)
src/app/reputation/analytics/error.tsx:10 - default
src/app/reputation/analytics/page.tsx:3 - default
src/app/reputation/campaigns/error.tsx:10 - default
src/app/reputation/campaigns/page.tsx:3 - default
src/app/reputation/reviews/error.tsx:10 - default
src/app/reputation/reviews/page.tsx:3 - default
src/app/reputation/settings/error.tsx:10 - default
src/app/reputation/settings/page.tsx:3 - default
src/app/reputation/widget/error.tsx:10 - default
src/app/reputation/widget/page.tsx:3 - default
src/app/settings/_components/IntegrationCard.tsx:7 - IntegrationCardProps (used in module)
src/app/settings/_components/IntegrationsTab.tsx:13 - IntegrationsTabProps (used in module)
src/app/settings/_components/MapsDataSection.tsx:9 - MapsDataSectionProps (used in module)
src/app/settings/_components/MessagingSection.tsx:13 - MessagingSectionProps (used in module)
src/app/settings/_components/OrganizationTab.tsx:6 - OrganizationTabProps (used in module)
src/app/settings/_components/ProfileTab.tsx:7 - ProfileTabProps (used in module)
src/app/settings/marketplace/error.tsx:10 - default
src/app/settings/marketplace/page.tsx:16 - default
src/app/settings/team/error.tsx:10 - default
src/app/settings/team/page.tsx:26 - default
src/app/settings/team/team.types.ts:3 - TeamMemberStatus (used in module)
src/app/share/[token]/error.tsx:10 - default
src/app/share/[token]/page.tsx:12 - default
src/app/social/_components/AiTab.tsx:36 - AiTabProps (used in module)
src/app/social/_components/background-picker-types.ts:91 - loadCachedImages (used in module)
src/app/social/_components/CaptionEngine.tsx:31 - CAPTION_TONES (used in module)
src/app/social/_components/StockTab.tsx:25 - StockTabProps (used in module)
src/app/social/_components/TemplateEditor.tsx:45 - TemplateEditor
src/app/social/_components/UploadTab.tsx:10 - UploadTabProps (used in module)
src/app/trips/[id]/error.tsx:10 - default
src/app/trips/[id]/page.tsx:29 - default
src/app/trips/templates/error.tsx:10 - default
src/app/trips/templates/page.tsx:12 - default
src/components/ui/map/map-core.tsx:307 - MapContext (used in module)
src/components/ui/map/map-core.tsx:308 - MapContextValue (used in module)
src/components/ui/map/map-utils.ts:29 - getDocumentTheme (used in module)
src/components/ui/map/map-utils.ts:37 - getSystemTheme (used in module)
src/components/whatsapp/action-picker/index.ts:1 - ActionPickerModal
src/components/whatsapp/action-picker/index.ts:2 - MOCK_TRIPS
src/features/admin/analytics/types.ts:36 - DestinationRank (used in module)
src/features/admin/analytics/types.ts:41 - TopClientEntry (used in module)
src/features/admin/billing/plans.ts:3 - BillingPlan (used in module)
src/features/admin/billing/useBillingData.ts:9 - Subscription (used in module)
src/features/admin/billing/useBillingData.ts:21 - Invoice (used in module)
src/features/admin/invoices/types.ts:32 - ClientSnapshot (used in module)
src/features/admin/invoices/types.ts:39 - InvoicePayment (used in module)
src/features/admin/pricing/types.ts:75 - TopProfitableTrip (used in module)
src/lib/assistant/actions/registry.ts:65 - getActionSchemas
src/lib/assistant/actions/registry.ts:75 - getReadOnlySchemas
src/lib/assistant/actions/registry.ts:82 - getActionCount
src/lib/assistant/channel-adapters/whatsapp.ts:76 - resolveWhatsAppSender (used in module)
src/lib/assistant/channel-adapters/whatsapp.ts:50 - WhatsAppHandlerResult (used in module)
src/lib/assistant/prompts/system.ts:19 - formatDate (used in module)
src/lib/assistant/prompts/system.ts:38 - buildContextBlock (used in module)
src/lib/assistant/workflows/definitions.ts:15 - WorkflowStep (used in module)
src/lib/assistant/workflows/engine.ts:56 - saveWorkflowState (used in module)
src/lib/assistant/workflows/engine.ts:71 - clearWorkflowState (used in module)
src/lib/assistant/workflows/engine.ts:24 - WorkflowState (used in module)
src/lib/demo/data/index.ts:4 - DEMO_CLIENTS
src/lib/demo/data/index.ts:5 - DEMO_TRIPS
src/lib/demo/data/index.ts:6 - DEMO_PROPOSALS
src/lib/demo/data/index.ts:7 - DEMO_NOTIFICATIONS
src/lib/demo/data/index.ts:8 - DEMO_TASKS
src/lib/demo/data/index.ts:8 - DEMO_SCHEDULE
src/app/(superadmin)/god/analytics/error.tsx:10 - default
src/app/(superadmin)/god/analytics/page.tsx:106 - default
src/app/(superadmin)/god/announcements/error.tsx:10 - default
src/app/(superadmin)/god/announcements/page.tsx:54 - default
src/app/(superadmin)/god/audit-log/error.tsx:10 - default
src/app/(superadmin)/god/audit-log/page.tsx:59 - default
src/app/(superadmin)/god/costs/error.tsx:10 - default
src/app/(superadmin)/god/costs/page.tsx:82 - default
src/app/(superadmin)/god/directory/error.tsx:10 - default
src/app/(superadmin)/god/directory/page.tsx:100 - default
src/app/(superadmin)/god/kill-switch/error.tsx:10 - default
src/app/(superadmin)/god/kill-switch/page.tsx:24 - default
src/app/(superadmin)/god/monitoring/error.tsx:10 - default
src/app/(superadmin)/god/monitoring/page.tsx:55 - default
src/app/(superadmin)/god/referrals/error.tsx:10 - default
src/app/(superadmin)/god/referrals/page.tsx:76 - default
src/app/(superadmin)/god/signups/error.tsx:10 - default
src/app/(superadmin)/god/signups/page.tsx:90 - default
src/app/(superadmin)/god/support/error.tsx:10 - default
src/app/(superadmin)/god/support/page.tsx:68 - default
src/app/admin/cost/_components/AlertsList.tsx:10 - AlertsListProps (used in module)
src/app/admin/cost/_components/CapEditor.tsx:12 - CapEditorProps (used in module)
src/app/admin/cost/_components/MarginReport.tsx:8 - MarginReportProps (used in module)
src/app/admin/cost/_components/OrgCostCard.tsx:8 - OrgCostCardProps (used in module)
src/app/admin/cost/_components/SummaryCards.tsx:6 - SummaryCardsProps (used in module)
src/app/admin/cost/_components/types.ts:3 - CategoryAggregate (used in module)
src/app/admin/cost/_components/types.ts:22 - AlertRunbook (used in module)
src/app/admin/internal/marketplace/error.tsx:10 - default
src/app/admin/internal/marketplace/page.tsx:27 - default
src/app/admin/settings/marketplace/error.tsx:10 - default
src/app/admin/settings/marketplace/page.tsx:78 - default
src/app/admin/settings/notifications/error.tsx:10 - default
src/app/admin/settings/notifications/page.tsx:13 - default
src/app/admin/tour-templates/[id]/error.tsx:10 - default
src/app/admin/tour-templates/[id]/page.tsx:76 - default
src/app/admin/tour-templates/create/error.tsx:10 - default
src/app/admin/tour-templates/create/page.tsx:73 - default
src/app/admin/tour-templates/import/error.tsx:10 - default
src/app/admin/tour-templates/import/page.tsx:18 - default
src/app/admin/trips/[id]/error.tsx:10 - default
src/app/admin/trips/[id]/page.tsx:38 - default
src/app/api/admin/[...path]/route.ts:3 - maxDuration
src/app/api/admin/[...path]/route.ts:76 - GET
src/app/api/admin/[...path]/route.ts:76 - POST
src/app/api/admin/[...path]/route.ts:76 - PATCH
src/app/api/admin/[...path]/route.ts:76 - PUT
src/app/api/admin/[...path]/route.ts:76 - DELETE
src/app/api/admin/[...path]/route.ts:76 - OPTIONS
src/app/api/assistant/[...path]/route.ts:3 - maxDuration
src/app/api/assistant/[...path]/route.ts:22 - GET
src/app/api/assistant/[...path]/route.ts:22 - POST
src/app/api/assistant/[...path]/route.ts:22 - PATCH
src/app/api/assistant/[...path]/route.ts:22 - PUT
src/app/api/assistant/[...path]/route.ts:22 - DELETE
src/app/api/assistant/[...path]/route.ts:22 - OPTIONS
src/app/api/reputation/[...path]/route.ts:3 - maxDuration
src/app/api/reputation/[...path]/route.ts:34 - GET
src/app/api/reputation/[...path]/route.ts:34 - POST
src/app/api/reputation/[...path]/route.ts:34 - PATCH
src/app/api/reputation/[...path]/route.ts:34 - PUT
src/app/api/reputation/[...path]/route.ts:34 - DELETE
src/app/api/reputation/[...path]/route.ts:34 - OPTIONS
src/app/api/social/[...path]/route.ts:3 - maxDuration
src/app/api/social/[...path]/route.ts:35 - GET
src/app/api/social/[...path]/route.ts:35 - POST
src/app/api/social/[...path]/route.ts:35 - PATCH
src/app/api/social/[...path]/route.ts:35 - PUT
src/app/api/social/[...path]/route.ts:35 - DELETE
src/app/api/social/[...path]/route.ts:35 - OPTIONS
src/app/api/superadmin/[...path]/route.ts:6 - maxDuration
src/app/api/superadmin/[...path]/route.ts:41 - GET
src/app/api/superadmin/[...path]/route.ts:41 - POST
src/app/api/superadmin/[...path]/route.ts:41 - PATCH
src/app/api/superadmin/[...path]/route.ts:41 - PUT
src/app/api/superadmin/[...path]/route.ts:41 - DELETE
src/app/api/superadmin/[...path]/route.ts:41 - OPTIONS
src/app/proposals/create/_components/AddOnsGrid.tsx:6 - AddOnsGridProps (used in module)
src/app/proposals/create/_components/ClientSelector.tsx:22 - ClientSelectorProps (used in module)
src/app/proposals/create/_components/CreateProposalActions.tsx:6 - CreateProposalActionsProps (used in module)
src/app/proposals/create/_components/ProposalLimitBanner.tsx:6 - ProposalLimitBannerProps (used in module)
src/app/proposals/create/_components/ProposalSummary.tsx:3 - ProposalSummaryProps (used in module)
src/app/proposals/create/_components/TemplateSelector.tsx:10 - TemplateSelectorProps (used in module)
src/app/proposals/create/_components/WhatsAppDraftBanner.tsx:7 - WhatsAppDraftBannerProps (used in module)
src/app/proposals/create/_hooks/useAvailabilityCheck.ts:9 - UseAvailabilityCheckReturn (used in module)
src/app/proposals/create/_hooks/useCreateProposal.ts:11 - CreateProposalParams (used in module)
src/app/proposals/create/_hooks/useCreateProposal.ts:29 - UseCreateProposalReturn (used in module)
src/app/proposals/create/_hooks/usePricingSuggestion.ts:6 - UsePricingSuggestionReturn (used in module)
src/app/proposals/create/_hooks/useProposalData.ts:21 - UseProposalDataReturn (used in module)
src/app/proposals/create/_hooks/useWhatsAppDraft.ts:6 - WhatsAppDraftFormUpdates (used in module)
src/app/proposals/create/_hooks/useWhatsAppDraft.ts:14 - UseWhatsAppDraftOptions (used in module)
src/app/proposals/create/_hooks/useWhatsAppDraft.ts:20 - UseWhatsAppDraftReturn (used in module)
src/app/reputation/nps/[token]/error.tsx:10 - default
src/app/reputation/nps/[token]/page.tsx:107 - default
src/app/social/_components/canvas/index.ts:1 - CanvasMode
src/app/social/_components/template-gallery/FestivalBanner.tsx:11 - FestivalBannerProps (used in module)
src/app/social/_components/template-gallery/index.ts:1 - TemplateSearchBar
src/app/social/_components/template-gallery/index.ts:2 - TemplateCategoryFilter
src/app/social/_components/template-gallery/index.ts:3 - PreviewPanel
src/app/social/_components/template-gallery/index.ts:4 - TemplateGrid
src/app/social/_components/template-gallery/index.ts:5 - FestivalBanner
src/app/social/_components/template-gallery/index.ts:6 - TemplateStrip
src/app/social/_components/template-gallery/index.ts:7 - renderLayout
src/app/social/_components/template-gallery/index.ts:7 - renderBg
src/app/social/_components/template-gallery/index.ts:8 - RATIO_DIMS
src/app/social/_components/template-gallery/index.ts:8 - toTemplateTier
src/app/social/_components/template-gallery/index.ts:8 - FAVORITES_KEY
src/app/social/_components/template-gallery/index.ts:8 - RECENT_KEY
src/app/social/_components/template-gallery/index.ts:8 - MAX_RECENT
src/app/social/_components/template-gallery/index.ts:9 - AspectRatio
src/app/social/_components/template-gallery/index.ts:9 - Dimensions
src/app/social/_components/template-gallery/PreviewPanel.tsx:9 - PreviewPanelProps (used in module)
src/app/social/_components/template-gallery/TemplateCategoryFilter.tsx:8 - TemplateCategoryFilterProps (used in module)
src/app/social/_components/template-gallery/TemplateGrid.tsx:143 - TemplateGridProps (used in module)
src/app/social/_components/template-gallery/TemplateSearchBar.tsx:5 - TemplateSearchBarProps (used in module)
src/app/social/_components/template-gallery/TemplateStrip.tsx:8 - TemplateStripProps (used in module)
src/components/social/templates/layouts/layout-helpers.ts:10 - SERVICE_ICONS (used in module)
src/components/social/templates/layouts/LayoutRenderer.tsx:36 - LayoutProps
src/components/social/templates/layouts/LayoutRenderer.tsx:37 - PosterFooter
src/components/social/templates/layouts/ThemeDecorations.tsx:7 - resolveTheme (used in module)
src/app/admin/tour-templates/[id]/edit/error.tsx:10 - default
src/app/admin/tour-templates/[id]/edit/page.tsx:64 - default
src/app/admin/tour-templates/create/_components/index.ts:1 - DayEditor
src/app/admin/tour-templates/create/_components/index.ts:2 - ActivityEditor
src/app/admin/tour-templates/create/_components/index.ts:3 - AccommodationEditor
src/app/admin/tour-templates/create/_components/index.ts:4 - MetadataForm
src/app/admin/tour-templates/create/_components/index.ts:5 - DayEditorProps
src/app/admin/tour-templates/create/_components/index.ts:6 - ActivityEditorProps
src/app/admin/tour-templates/create/_components/index.ts:7 - AccommodationEditorProps
src/app/admin/tour-templates/create/_components/index.ts:8 - MetadataFormProps
src/app/admin/tour-templates/create/_components/index.ts:8 - TemplateMetadata
src/app/admin/tour-templates/create/_components/index.ts:9 - TemplateDay
src/app/admin/tour-templates/create/_components/index.ts:9 - TemplateActivity
src/app/admin/tour-templates/create/_components/index.ts:9 - TemplateAccommodation
src/app/admin/trips/[id]/_components/index.ts:1 - TripHeader
src/app/admin/trips/[id]/_components/index.ts:2 - DayTabs
src/app/admin/trips/[id]/_components/index.ts:3 - DriverAssignmentCard
src/app/admin/trips/[id]/_components/index.ts:4 - AccommodationCard
src/app/admin/trips/[id]/_components/index.ts:5 - DayActivities
src/app/admin/trips/[id]/_components/index.ts:1 - Driver
src/app/admin/trips/[id]/_components/index.ts:10 - DriverAssignment
src/app/admin/trips/[id]/_components/index.ts:19 - Accommodation
src/app/admin/trips/[id]/_components/index.ts:28 - Activity
src/app/admin/trips/[id]/_components/index.ts:41 - Day
src/app/admin/trips/[id]/_components/index.ts:47 - HotelSuggestion
src/app/admin/trips/[id]/_components/index.ts:56 - Trip
src/app/admin/trips/[id]/_components/index.ts:79 - ReminderDayStatus
src/app/admin/trips/[id]/_components/index.ts:87 - DriverLocationSnapshot
src/app/admin/trips/[id]/_components/index.ts:96 - TripDetailApiPayload
src/app/admin/trips/[id]/_components/index.ts:106 - ErrorPayload
src/app/admin/trips/[id]/_components/index.ts:110 - OverpassElement
src/app/admin/trips/[id]/_components/index.ts:120 - OverpassResponse
src/app/admin/trips/[id]/_components/index.ts:3 - isValidTime
src/app/admin/trips/[id]/_components/index.ts:7 - timeToMinutes
src/app/admin/trips/[id]/_components/index.ts:12 - minutesToTime
src/app/admin/trips/[id]/_components/index.ts:19 - roundToNearestThirty
src/app/admin/trips/[id]/_components/index.ts:23 - haversineKm
src/app/admin/trips/[id]/_components/index.ts:38 - estimateTravelMinutes
src/app/admin/trips/[id]/_components/index.ts:56 - inferExploreDurationMinutes
src/app/admin/trips/[id]/_components/index.ts:70 - enrichDayDurations
src/app/admin/trips/[id]/_components/index.ts:167 - buildDaySchedule
src/app/admin/trips/[id]/_components/index.ts:203 - formatDate
src/app/admin/trips/[id]/clone/error.tsx:10 - default
src/app/admin/trips/[id]/clone/page.tsx:28 - default
src/app/api/_handlers/admin/seed-demo/fixture.ts:8 - DEMO_CLIENT_IDS (used in module)
src/app/api/_handlers/admin/seed-demo/fixture.ts:23 - DEMO_DRIVER_IDS (used in module)
src/app/api/_handlers/admin/seed-demo/fixture.ts:30 - DEMO_ITINERARY_IDS (used in module)
src/app/api/_handlers/admin/seed-demo/fixture.ts:43 - DEMO_TRIP_IDS (used in module)
src/app/api/_handlers/notifications/process-queue/batch.ts:1 - BatchProcessorOptions (used in module)
src/app/api/_handlers/settings/team/shared.ts:39 - TeamMemberStatus (used in module)
src/app/api/_handlers/settings/team/shared.ts:41 - TeamMemberPayload (used in module)
src/app/api/_handlers/share/[token]/public-share.ts:118 - parsePreferences (used in module)
src/app/api/_handlers/share/[token]/public-share.ts:20 - ShareComment (used in module)
src/app/api/_handlers/webhooks/whatsapp/route.ts:81 - GET
src/app/api/_handlers/webhooks/whatsapp/route.ts:104 - POST
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:12 - PATCH
src/app/api/whatsapp/proposal-drafts/[id]/route.ts:36 - GET
src/app/api/whatsapp/proposal-drafts/[id]/route.ts:64 - POST
src/app/(superadmin)/god/costs/org/[orgId]/error.tsx:10 - default
src/app/(superadmin)/god/costs/org/[orgId]/page.tsx:33 - default
src/app/api/_handlers/admin/cost/overview/shared.ts:20 - UpdateEmergencyCapSchema (used in module)
src/app/api/_handlers/admin/cost/overview/shared.ts:107 - OperationalAlertCategory (used in module)
src/app/api/_handlers/admin/cost/overview/shared.ts:210 - CostOverviewCacheMeta (used in module)
```

### CommonJS `require()` calls (0)
```text
_No hits._
```

### Dynamic `import(variable)` hits (0)
```text
_No hits._
```

### Missing-package imports (0)
```text
_No hits._
```

### Raw `<img>` tag hits (26)
```text
src/components/proposals/ESignature.tsx:205:            <img
src/components/itinerary-templates/LuxuryResortView.tsx:171:                                                    <img
src/components/itinerary-templates/VisualJourneyView.tsx:25:                <img
src/components/itinerary-templates/VisualJourneyView.tsx:203:                                                <img
src/components/itinerary-templates/UrbanBriefView.tsx:190:                          <img
src/components/templates/ItineraryTemplateClassic.tsx:153:                                                    <img
src/components/itinerary-templates/SafariStoryView.tsx:237:                                  <img
src/components/templates/ItineraryTemplateModern.tsx:13:                    <img
src/components/templates/ItineraryTemplateModern.tsx:159:                                                                <img
src/components/itinerary-templates/ProfessionalView.tsx:37:                                <img
src/components/itinerary-templates/ProfessionalView.tsx:212:                                                            <img
src/components/itinerary/ProfessionalItineraryView.tsx:61:                            <img
src/components/itinerary/ProfessionalItineraryView.tsx:290:                    <img
src/features/admin/invoices/InvoiceLivePreview.tsx:69:                  <img
src/features/admin/invoices/helpers.ts:76:    ? `<img src="${org.logo_url}" alt="${org?.name || "Logo"}" style="width:56px;height:56px;object-fit:contain;border-radius:8px;border:1px solid #e2e8f0;margin-right:14px;" />`
src/app/social/_components/StockTab.tsx:205:                                        <img
src/app/social/_components/StockTab.tsx:240:                                    <img
src/app/social/_components/BackgroundPicker.tsx:78:                                <img
src/app/social/_components/PostHistory.tsx:147:                                        <img
src/app/social/_components/MediaLibrary.tsx:210:                            <img
src/app/trips/TripCardGrid.tsx:111:                                            <img
src/app/social/_components/AiTab.tsx:356:                                            <img
src/app/social/_components/GallerySlotPicker.tsx:100:                            <img
src/app/social/_components/GallerySlotPicker.tsx:149:                                    <img
src/app/social/_components/canvas/CanvasEditorPanel.tsx:140:            <img
src/app/social/_components/canvas/CanvasEditorPanel.tsx:180:              <img
```

### Raw non-interactive `onClick` hits (3)
```text
src/components/god-mode/ConfirmDangerModal.tsx:41:            <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
src/app/planner/PastItineraryCard.tsx:150:                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
src/app/planner/PastItineraryCard.tsx:312:                <div onClick={(e) => e.stopPropagation()}>
```

### Raw bad-anchor hits (`href="#"` / `javascript:void`) (0)
```text
_No hits._
```

### `JSON.parse` hits (42)
```text
src/lib/rag-itinerary.ts:245:        const assembledItinerary = JSON.parse(
src/lib/notifications/browser-push.ts:287:      return JSON.parse(stored);
src/lib/import/pdf-extractor.ts:127:    const extractedData: ExtractedTourData = JSON.parse(jsonText);
src/lib/security/social-oauth-state.ts:120:    const parsed = JSON.parse(raw) as Partial<OAuthStatePayload>;
src/lib/import/url-scraper.ts:156:    const extractedData: ExtractedTourData = JSON.parse(jsonText);
src/lib/import/url-scraper.ts:212:    const preview = JSON.parse(jsonText);
src/components/assistant/TourAssistantChat.tsx:217:                        payload = JSON.parse(dataMatch[1]) as Record<string, unknown>;
src/lib/ai/gemini.server.ts:26:  return JSON.parse(cleanGeminiJson(rawText)) as T;
src/lib/pdf-extractor.ts:222:            template = JSON.parse(jsonText);
src/components/trips/GroupManager.tsx:53:      return saved ? (JSON.parse(saved) as Traveler[]) : DEFAULT_TRAVELERS
src/lib/queries/dashboard-tasks.ts:79:    return new Set(JSON.parse(raw) as string[]);
src/lib/assistant/orchestrator.ts:84:    return lines.map((line) => JSON.parse(line) as FaqRow);
src/lib/assistant/orchestrator.ts:303:    params = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
src/components/leads/LeadToBookingFlow.tsx:461:        try { drafts = JSON.parse(localStorage.getItem('bookingDrafts') || '[]'); } catch { drafts = []; }
src/app/admin/tour-templates/import/page.tsx:71:        result = JSON.parse(text);
src/app/social/_components/ContentBar.tsx:119:        const parsed = JSON.parse(raw);
src/app/social/_components/TemplateGallery.tsx:52:            return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
src/app/social/_components/TemplateGallery.tsx:76:            return stored ? JSON.parse(stored) : [];
src/app/social/_components/SocialStudioClient.tsx:172:            const draft = JSON.parse(raw);
src/app/social/_components/background-picker-types.ts:94:        return JSON.parse(localStorage.getItem(key) || "[]");
src/app/api/_handlers/ai/suggest-reply/route.ts:40:      JSON.parse(serializedInput) as z.infer<typeof SuggestReplySchema>,
src/app/api/_handlers/debug/route.ts:44:      return NextResponse.json({ success: true, model: 'gemini-2.5-flash', response: JSON.parse(text) });
src/app/api/_handlers/social/ai-poster/route.ts:65:        const response = JSON.parse(result.response.text());
src/app/api/_handlers/social/extract/route.ts:91:    const response = JSON.parse(result.response.text());
src/app/api/_handlers/social/smart-poster/route.ts:64:        const parsed = JSON.parse(geminiResult.response.text());
src/app/api/_handlers/social/captions/route.ts:108:    const response = JSON.parse(result.response.text());
src/app/api/_handlers/itinerary/import/url/route.ts:188:        const itineraryJson = JSON.parse(itineraryText);
src/app/api/_handlers/itinerary/import/pdf/route.ts:116:        const itineraryJson = JSON.parse(itineraryText);
src/app/api/_handlers/itinerary/generate/route.ts:343:                        typeof cachedRedis === 'string' ? JSON.parse(cachedRedis) : cachedRedis;
src/app/api/_handlers/itinerary/generate/route.ts:588:                    itinerary = JSON.parse(responseContent) as ItineraryLike;
src/app/api/_handlers/itinerary/generate/route.ts:609:                itinerary = JSON.parse(responseText.trim()) as ItineraryLike;
src/app/api/_handlers/webhooks/whatsapp/route.ts:134:    payload = JSON.parse(rawBody) as MetaWebhookPayload;
src/app/api/_handlers/webhooks/waha/route.ts:80:        event = JSON.parse(rawBody) as WppEvent;
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:195:    const parsed = JSON.parse(raw) as { summary?: unknown; dayThemes?: unknown };
src/app/api/_handlers/whatsapp/webhook/route.ts:137:        const payload = JSON.parse(rawBody) as unknown;
src/app/api/_handlers/admin/social/generate/route.ts:216:    const parsedJson = JSON.parse(raw);
src/app/api/_handlers/assistant/chat/stream/route.ts:237:        const chunk = JSON.parse(jsonStr) as {
src/app/api/_handlers/assistant/chat/stream/route.ts:298:    params = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
src/app/api/_handlers/payments/webhook/route.ts:183:    const parsed = JSON.parse(body) as unknown;
src/app/api/_handlers/reputation/ai/analyze/route.ts:64:  const parsed = JSON.parse(cleaned);
src/app/api/_handlers/reputation/ai/respond/route.ts:110:  const parsed = JSON.parse(cleaned);
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:75:  const parsed = JSON.parse(cleaned);
```

### `Math.random` / `Date.now` hits (228)
```text
src/app/(superadmin)/god/announcements/page.tsx:36:    const diff = Date.now() - new Date(iso).getTime();
src/app/(superadmin)/god/audit-log/page.tsx:48:    const diff = Date.now() - new Date(iso).getTime();
src/app/(superadmin)/god/support/page.tsx:60:    const diff = Date.now() - new Date(iso).getTime();
src/app/admin/trips/[id]/_components/DayActivities.tsx:110:    const [now] = useState(() => Date.now());
src/app/api/_handlers/admin/clients/route.ts:61:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/clients/route.ts:719:                idempotency_key: `lifecycle-stage:${existingProfile.id}:${existingProfile.lifecycle_stage || "lead"}:${lifecycleStage}:${Date.now()}`,
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:192:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:45:    const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/route.ts:114:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/contacts/route.ts:139:  const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/route.ts:260:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/contacts/route.ts:50:  const startedAt = Date.now();
src/app/api/_handlers/admin/cost/overview/shared.ts:246:    Math.round((Date.now() - new Date(cachedAt).getTime()) / 1000),
src/app/api/_handlers/admin/dashboard/stats/route.ts:32:    const yearAgoISO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/action-queue/route.ts:28:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/action-queue/route.ts:30:    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/auto-requote/route.ts:29:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/auto-requote/route.ts:53:          ? (new Date(proposal.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:69:    const idempotencyKey = `analytics-batch:${admin.organizationId}:${parsed.data.job_type}:${Date.now()}`;
src/app/api/_handlers/admin/insights/daily-brief/route.ts:26:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/daily-brief/route.ts:28:    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/margin-leak/route.ts:29:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/margin-leak/route.ts:65:          ? Math.max(0, (Date.now() - new Date(proposal.created_at).getTime()) / (1000 * 60 * 60 * 24))
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:169:    const staleLeadCutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:49:    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:50:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/roi/route.ts:37:  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:29:    const endWindow = new Date(Date.now() + parsed.data.daysForward * 24 * 60 * 60 * 1000);
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:79:          ? Math.max(0, Math.round((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:63:    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/win-loss/route.ts:26:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/marketplace/verify/route.ts:162:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/marketplace/verify/route.ts:194:    const startedAt = Date.now();
src/app/api/_handlers/admin/marketplace/verify/route.ts:332:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/marketplace/verify/route.ts:90:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/marketplace/verify/route.ts:99:    const startedAt = Date.now();
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:14:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/notifications/delivery/route.ts:13:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:142:    const fileName = `${scopedOrg.organizationId}/${Date.now()}-${safeFileName}`;
src/app/api/_handlers/admin/referrals/route.ts:175:        (Date.now() - new Date(myOrg.created_at).getTime()) /
src/app/api/_handlers/admin/reports/gst/route.ts:64:      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/security/diagnostics/route.ts:13:  const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/security/diagnostics/route.ts:46:    const now = Date.now();
src/app/api/_handlers/admin/social/generate/route.ts:249:      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/tour-templates/extract/route.ts:28:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:241:      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/trips/[id]/route.ts:48:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/trips/route.ts:82:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/whatsapp/health/route.ts:14:  return Math.max(0, Math.floor((Date.now() - t) / 60000));
src/app/api/_handlers/admin/workflow/events/route.ts:108:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/workflow/events/route.ts:14:    const startedAt = Date.now();
src/app/api/_handlers/admin/workflow/events/route.ts:31:            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/workflow/rules/route.ts:26:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/assistant/chat/stream/route.ts:659:    const sessionId = `s-${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
src/app/api/_handlers/auth/password-login/route.ts:65:        Math.ceil((rateLimit.reset - Date.now()) / 1000)
src/app/api/_handlers/dashboard/tasks/route.ts:163:    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/health/route.ts:110:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:115:    const latency = Date.now() - startedAt;
src/app/api/_handlers/health/route.ts:338:        ? Math.max(0, Math.round((Date.now() - new Date(oldestPendingIso).getTime()) / 60000))
src/app/api/_handlers/health/route.ts:363:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:371:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/health/route.ts:408:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/health/route.ts:49:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:53:        return { response, latency: Date.now() - startedAt };
src/app/api/_handlers/health/route.ts:57:            latency: Date.now() - startedAt,
src/app/api/_handlers/location/cleanup-expired/route.ts:35:    if (Math.abs(Date.now() - tsMs) > 5 * 60_000) return false;
src/app/api/_handlers/location/client-share/route.ts:72:        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/location/live/[token]/route.ts:35:        const windowStartIso = new Date(Date.now() - SHARE_RATE_LIMIT_WINDOW_MS).toISOString();
src/app/api/_handlers/location/ping/route.ts:100:            const sinceMs = Date.now() - new Date(latestPing.recorded_at).getTime();
src/app/api/_handlers/location/share/route.ts:120:        const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:100:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:237:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:109:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:172:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:49:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:80:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/view/route.ts:18:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/view/route.ts:86:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/inquiries/route.ts:108:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/inquiries/route.ts:149:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/inquiries/route.ts:212:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/inquiries/route.ts:48:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:93:    new Date(subscription.current_period_end).getTime() < Date.now()
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:72:  const now = Date.now();
src/app/api/_handlers/marketplace/options/route.ts:166:  const startedAt = Date.now();
src/app/api/_handlers/marketplace/options/route.ts:187:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/options/route.ts:227:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/route.ts:210:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/route.ts:370:                isFeatured && featuredUntil !== null && Date.parse(featuredUntil) > Date.now();
src/app/api/_handlers/marketplace/route.ts:456:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/route.ts:495:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/route.ts:553:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/stats/route.ts:113:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/stats/route.ts:14:    const startedAt = Date.now();
src/app/api/_handlers/notifications/process-queue/route.ts:224:    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/notifications/process-queue/route.ts:465:    const startedAt = Date.now();
src/app/api/_handlers/notifications/process-queue/route.ts:549:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/notifications/schedule-followups/route.ts:49:  const minimum = new Date(Date.now() + 2 * 60_000);
src/app/api/_handlers/notifications/send/route.ts:123:    const startedAt = Date.now();
src/app/api/_handlers/notifications/send/route.ts:148:            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/notifications/send/route.ts:221:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/onboarding/setup/route.ts:127:    const timePart = Date.now().toString(36).slice(-4);
src/app/api/_handlers/payments/razorpay/route.ts:29:      receipt: receipt ?? `rcpt_${Date.now()}`,
src/app/api/_handlers/payments/razorpay/route.ts:32:      created_at: Math.floor(Date.now() / 1000),
src/app/api/_handlers/proposals/[id]/pdf/route.ts:148:      if (Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
src/app/api/_handlers/proposals/[id]/send/route.ts:225:    proposal.expires_at && new Date(proposal.expires_at).getTime() > Date.now()
src/app/api/_handlers/proposals/[id]/send/route.ts:227:      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/proposals/public/[token]/route.ts:97:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:121:          Date.now() + 7 * 24 * 60 * 60 * 1000
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:61:        Date.now() - delayHours * 60 * 60 * 1000
src/app/api/_handlers/settings/team/shared.ts:94:  const diffMs = Date.now() - timestamp;
src/app/api/_handlers/share/[token]/route.ts:117:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/share/[token]/route.ts:163:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/share/[token]/route.ts:83:  return parsed.getTime() < Date.now();
src/app/api/_handlers/social/posts/[id]/render/route.ts:38:        const storagePath = `${profile.organization_id}/posts/${Date.now()}-${filename}`;
src/app/api/_handlers/social/process-queue/route.ts:125:                const platformPostId = `cron_${platform}_${Date.now()}`;
src/app/api/_handlers/social/reviews/public/route.ts:133:            const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/social/reviews/public/route.ts:160:        const duplicateCutoffIso = new Date(Date.now() - 15 * 60_000).toISOString();
src/app/api/_handlers/social/reviews/public/route.ts:203:            const template_id = reviewTemplateIds[Math.floor(Math.random() * reviewTemplateIds.length)];
src/app/api/_handlers/social/reviews/public/route.ts:56:    return Number.isFinite(ts) && ts <= Date.now();
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts:42:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts:8:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:105:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:13:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/cost/trends/route.ts:29:            const d = new Date(Date.now() - i * 86_400_000);
src/app/api/_handlers/superadmin/cost/trends/route.ts:52:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/superadmin/cost/trends/route.ts:8:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:21:    const start = Date.now();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:25:        return { status: "healthy", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:27:        return { status: "down", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:34:    const start = Date.now();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:37:        return { status: "healthy", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:39:        return { status: "down", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:42:            oldestPendingMinutes = Math.floor((Date.now() - oldest.getTime()) / 60_000);
src/app/api/_handlers/superadmin/overview/route.ts:13:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/overview/route.ts:54:            const d = new Date(Date.now() - (29 - i) * 86_400_000);
src/app/api/_handlers/superadmin/users/signups/route.ts:15:    return new Date(Date.now() - days * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/users/signups/route.ts:75:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/whatsapp/test-message/route.ts:47:            messageId: "wpp_" + Date.now(),
src/app/api/_handlers/whatsapp/webhook/route.ts:112:                    provider_message_id: `invalid-signature-${Date.now()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
src/app/api/_handlers/whatsapp/webhook/route.ts:347:        const fileName = `wa_${image.imageId}_${Date.now()}.${fileExt}`;
src/app/clients/[id]/client-profile-shared.ts:51:  const ms = Date.now() - new Date(dateStr).getTime();
src/app/clients/[id]/client-profile-shared.ts:74:  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
src/app/drivers/page.tsx:130:            const slug = `agency-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
src/app/p/[token]/page.tsx:308:      ? Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
src/app/planner/NeedsAttentionQueue.tsx:53:    const hoursAgo = (Date.now() - latestActivity.getTime()) / (1000 * 60 * 60);
src/app/proposals/[id]/page.tsx:641:                      {formatLocalDate(comment.created_at || Date.now(), timezone)}
src/app/proposals/[id]/page.tsx:700:                {formatLocalDateTime(comments[0].created_at || Date.now(), timezone)}
src/app/proposals/page.tsx:373:                          <span>{formatLocalDate(proposal.created_at || Date.now(), timezone)}</span>
src/app/social/_components/AiTab.tsx:147:                    timestamp: Date.now(),
src/app/social/_components/AiTab.tsx:212:                timestamp: Date.now(),
src/app/social/_components/CarouselBuilder.tsx:32:            id: Date.now().toString(),
src/app/social/_components/ContentBar.tsx:153:      id: Date.now().toString(36),
src/app/social/_components/MediaLibrary.tsx:90:            const fileName = `${Date.now()}-${file.name}`;
src/app/social/_components/PlatformStatusBar.tsx:28:                const nowMs = Date.now();
src/app/social/_components/SocialStudioClient.tsx:157:                savedAt: Date.now(),
src/app/social/_components/SocialStudioClient.tsx:174:            if (Date.now() - draft.savedAt > TWENTY_FOUR_HOURS) return;
src/app/social/_components/StockTab.tsx:82:                      ? [{ id: `single-${Date.now()}`, url: data.url }]
src/app/social/_components/TemplateEditor.tsx:235:                                    link.download = `smart-poster-${Date.now()}.png`;
src/app/social/_components/template-gallery/FestivalBanner.tsx:19:        (new Date(festival.date).getTime() - Date.now()) / 86400000
src/components/assistant/TourAssistantChat.tsx:150:            id: `u-${Date.now()}`,
src/components/assistant/TourAssistantChat.tsx:161:        const assistantId = `a-${Date.now()}`;
src/components/assistant/TourAssistantChat.tsx:356:                id: `a-${Date.now()}`,
src/components/assistant/TourAssistantChat.tsx:365:                { id: `err-${Date.now()}`, role: "assistant", content: "Connection error. Please try again." },
src/components/bookings/HotelSearch.tsx:44:    const [checkOut, setCheckOut] = useState(toDateInput(new Date(Date.now() + 86400000)));
src/components/payments/PaymentLinkButton.tsx:30:  const diff = Date.now() - new Date(isoString).getTime()
src/components/payments/PaymentTracker.tsx:38:  const diff = Date.now() - new Date(isoString).getTime()
src/components/planner/ApprovalManager.tsx:200:          id: `queued-${Date.now()}`,
src/components/whatsapp/UnifiedInbox.tsx:290:            id: `m_${Date.now()}`,
src/components/whatsapp/UnifiedInbox.tsx:311:    const optimisticId = `pending_${Date.now()}`;
src/components/whatsapp/WhatsAppConnectModal.tsx:54:        setSessionName("demo_" + Date.now());
src/features/admin/revenue/useAdminRevenue.ts:119:        const purchasedAfter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
src/lib/admin/action-queue.ts:33:  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000));
src/lib/admin/action-queue.ts:68:  const staleCutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
src/lib/admin/insights.ts:36:  return (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
src/lib/admin/insights.ts:43:  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
src/lib/ai/upsell-engine.ts:326:      .gte('purchased_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
src/lib/analytics/template-analytics.ts:193:      .gte('viewed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
src/lib/analytics/template-analytics.ts:203:      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
src/lib/analytics/template-analytics.ts:212:      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
src/lib/api-dispatch.ts:79:            const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
src/lib/assistant/actions/reads/dashboard.ts:58:  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
src/lib/assistant/alerts.ts:63:  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
src/lib/assistant/alerts.ts:67:  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
src/lib/assistant/context-engine.ts:22:  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
src/lib/assistant/context-engine.ts:238:  if (cached && cached.expiresAt > Date.now()) {
src/lib/assistant/context-engine.ts:246:    expiresAt: Date.now() + CACHE_TTL_MS,
src/lib/assistant/weekly-digest.ts:60:  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
src/lib/assistant/weekly-digest.ts:64:  return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
src/lib/auth/admin-helpers.ts:26:  return Math.random() < ANON_AUTH_FAILURE_SAMPLE_RATE;
src/lib/cache/upstash.ts:52:    if (entry.expiresAt <= Date.now()) {
src/lib/cache/upstash.ts:76:    const now = Date.now();
src/lib/cost/spend-guardrails.ts:115:  const now = Date.now();
src/lib/external/amadeus.ts:36:  if (cachedToken && Date.now() < tokenExpiry - 30000) {
src/lib/external/amadeus.ts:66:  tokenExpiry = Date.now() + data.expires_in * 1000;
src/lib/geocoding.ts:32:    if (Date.now() > entry.expiresAt) {
src/lib/geocoding.ts:45:    geocodeCache.set(key, { result, expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS });
src/lib/network/retry.ts:54:        const waitMs = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 100);
src/lib/notifications/browser-push.ts:90:      timestamp: Date.now(),
src/lib/observability/logger.ts:72:    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
src/lib/observability/logger.ts:72:    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
src/lib/payments/invoice-service.ts:111:        due_date: (options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
src/lib/payments/invoice-service.ts:98:        invoice_number: `INV-${Date.now()}`,
src/lib/payments/order-service.ts:31:      receipt: `rcpt_${Date.now()}`,
src/lib/payments/payment-links.server.ts:253:    ? new Date(Date.now() + args.expiresInHours * 60 * 60 * 1000).toISOString()
src/lib/payments/payment-links.server.ts:254:    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
src/lib/pwa/offline-mutations.ts:185:    createdAt: Date.now(),
src/lib/pwa/offline-mutations.ts:39:  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
src/lib/pwa/offline-mutations.ts:39:  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
src/lib/reputation/campaign-trigger.ts:143:        Date.now() + 7 * 24 * 60 * 60 * 1000
src/lib/reputation/campaign-trigger.ts:83:      Date.now() - delayHours * 60 * 60 * 1000
src/lib/security/cost-endpoint-guard.ts:230:      Math.ceil((Math.min(burstLimit.reset, dailyLimit.reset) - Date.now()) / 1000)
src/lib/security/cron-auth.ts:107:    const now = Date.now();
src/lib/security/cron-auth.ts:139:    const now = Date.now();
src/lib/security/cron-auth.ts:173:    const minuteBucket = Math.floor(Date.now() / 60_000);
src/lib/security/public-rate-limit.ts:46:  const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/lib/security/rate-limit.ts:131:                reset: Date.now() + options.windowMs,
src/lib/security/rate-limit.ts:144:            reset: typeof result.reset === "number" ? result.reset : Date.now() + options.windowMs,
src/lib/security/rate-limit.ts:71:    const now = Date.now();
src/lib/security/social-oauth-state.ts:109:    ts: Date.now(),
src/lib/security/social-oauth-state.ts:166:  const now = Date.now();
src/lib/security/social-oauth-state.ts:92:  const now = Date.now();
src/lib/shared-itinerary-cache.ts:154:  const startedAt = Date.now();
src/lib/shared-itinerary-cache.ts:185:        responseTimeMs: Date.now() - startedAt,
src/lib/shared-itinerary-cache.ts:227:        responseTimeMs: Date.now() - startedAt,
src/lib/shared-itinerary-cache.ts:248:      responseTimeMs: Date.now() - startedAt,
src/lib/shared-itinerary-cache.ts:316:  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
src/lib/whatsapp/chatbot-flow.ts:315:  const cutoff = new Date(Date.now() - RECENT_HUMAN_REPLY_WINDOW_MS).toISOString();
```

### Admin-client usage hits (410)
```text
src/app/share/[token]/page.tsx:17:    const supabaseAdmin = createAdminClient();
src/app/share/[token]/page.tsx:26:    const { data: share, error: shareError } = await supabaseAdmin
src/app/share/[token]/page.tsx:63:    await supabaseAdmin
src/lib/whatsapp/chatbot-flow.ts:228:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:292:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:314:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:343:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:386:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:418:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:541:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:232:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:268:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:329:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:392:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:435:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:475:  const admin = createAdminClient();
src/lib/admin/operator-scorecard.ts:503:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard.ts:554:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard-delivery.ts:50:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard-delivery.ts:116:  const admin = createAdminClient();
src/lib/platform/audit.ts:24:    const adminClient = createAdminClient();
src/lib/platform/audit.ts:47:    const adminClient = createAdminClient();
src/lib/platform/settings.ts:60:  const adminClient = createAdminClient();
src/lib/platform/settings.ts:102:  const adminClient = createAdminClient();
src/lib/platform/settings.ts:198:  const adminClient = createAdminClient();
src/lib/reputation/referral-flywheel.ts:111:    const supabase = createAdminClient();
src/lib/reputation/referral-flywheel.ts:157:    const supabase = createAdminClient();
src/lib/notifications.ts:5:const supabaseAdmin = createAdminClient();
src/lib/notifications.ts:43:        const { error } = await supabaseAdmin.functions.invoke("send-notification", {
src/lib/notifications.ts:63:        await supabaseAdmin.from("notification_logs").insert({
src/lib/notifications.ts:96:        const { data: trip, error: tripError } = await supabaseAdmin
src/lib/auth/admin.ts:167:  const adminClient = createAdminClient();
src/lib/security/admin-bearer-auth.ts:3:const supabaseAdmin = createAdminClient();
src/lib/security/admin-bearer-auth.ts:17:    await supabaseAdmin.auth.getUser(token);
src/lib/security/admin-bearer-auth.ts:20:  const { data: profile } = await supabaseAdmin
src/app/pay/[token]/page.tsx:25:  const admin = createAdminClient();
src/lib/ai/cost-guardrails.ts:27:  const admin = createAdminClient();
src/lib/ai/cost-guardrails.ts:126:  const admin = createAdminClient();
src/lib/security/cost-endpoint-guard.ts:120:    const adminClient = createAdminClient();
src/lib/payments/payment-utils.ts:30:  return context === 'admin' ? createAdminClient() : createClient();
src/app/api/_handlers/share/[token]/route.ts:102:  const supabaseAdmin = createAdminClient();
src/app/api/_handlers/share/[token]/route.ts:123:    const { data: shareData, error: shareError } = await supabaseAdmin
src/app/api/_handlers/share/[token]/route.ts:148:  const supabaseAdmin = createAdminClient();
src/app/api/_handlers/share/[token]/route.ts:177:    const dynamicAdmin = supabaseAdmin as unknown as {
src/app/api/_handlers/share/[token]/route.ts:228:      const { error: updateError } = await supabaseAdmin
src/app/api/_handlers/share/[token]/route.ts:251:      const { error: updateError } = await supabaseAdmin
src/app/api/_handlers/share/[token]/route.ts:271:      const { error: updateError } = await supabaseAdmin
src/app/api/_handlers/share/[token]/route.ts:299:      const { error: updateError } = await supabaseAdmin
src/app/api/_handlers/share/[token]/route.ts:330:      const { error: updateError } = await supabaseAdmin
src/app/api/_handlers/share/[token]/route.ts:346:      const { error: updateError } = await supabaseAdmin
src/lib/assistant/alerts.ts:209:    const supabase = createAdminClient();
src/lib/assistant/alerts.ts:257:  const supabase = createAdminClient();
src/app/api/_handlers/cron/reputation-campaigns/route.ts:40:    const supabase = createAdminClient();
src/app/api/_handlers/proposals/[id]/convert/route.ts:48:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/proposals/[id]/convert/route.ts:72:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/proposals/[id]/convert/route.ts:89:    const { data: adminProfile } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:125:        const { data: proposal, error: proposalError } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:139:        const { data: daysData, error: daysError } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:155:            const { data, error: activitiesError } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:214:        const { data: itineraryData, error: insertItineraryError } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:226:        const { data: tripData, error: insertTripError } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:245:        await supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:253:            const invoiceNumber = await getNextInvoiceNumber(supabaseAdmin, admin.organizationId);
src/app/api/_handlers/proposals/[id]/convert/route.ts:255:            const { data: invoiceData } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:278:            supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:283:            supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:288:            supabaseAdmin
src/app/api/_handlers/proposals/[id]/send/route.ts:119:  const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/proposals/[id]/send/route.ts:120:  const { data: proposalData, error: proposalError } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/send/route.ts:233:  await supabaseAdmin
src/app/api/_handlers/proposals/[id]/send/route.ts:244:      supabase: supabaseAdmin,
src/app/api/_handlers/proposals/[id]/send/route.ts:252:  await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:11:export const supabaseAdmin = createAdminClient();
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:217:      const { data: operatorProfile } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:235:    const { data: organization } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:245:    const { data: ownerProfile } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:353:  const { data, error } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:387:  const { data: newPrice, error } = await supabaseAdmin.rpc('calculate_proposal_price', {
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:398:    const { error: updateError } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:424:    const { error: viewedUpdateError } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:443:        supabase: supabaseAdmin,
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:472:  const { data: daysData } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:494:    const { data: activitiesData } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:520:    const { data: accommodationsData } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:540:  const { data: commentsData } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:554:  const { data: addOnsData } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:34:  supabaseAdmin,
src/app/api/_handlers/proposals/public/[token]/route.ts:127:      const { data: activity } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:137:      const { data: day } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:148:      const { error: activityError } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:173:      const { data: addOn } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:185:        await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:192:      const { error: addOnError } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:216:      const { data: addOn } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:227:      await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:233:      const { error: vehicleError } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:262:        const { data: day } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:274:      const { error: commentError } = await supabaseAdmin.from('proposal_comments').insert({
src/app/api/_handlers/proposals/public/[token]/route.ts:288:        await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:305:      const { error: approveError } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:321:          supabase: supabaseAdmin,
src/app/api/_handlers/proposals/public/[token]/route.ts:346:          const { data: operatorProfile } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:358:          const { data: clientProfile } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:382:            const { link } = await createPaymentLinkRecord(supabaseAdmin, {
src/app/api/_handlers/proposals/public/[token]/route.ts:401:              const { data: connection } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:421:                await recordPaymentLinkEvent(supabaseAdmin, {
src/app/api/_handlers/proposals/public/[token]/route.ts:476:      const { error: rejectError } = await supabaseAdmin
src/app/api/_handlers/proposals/public/[token]/route.ts:533:      const { error: tierError } = await supabaseAdmin
src/app/api/_handlers/proposals/bulk/route.ts:29:    const admin = createAdminClient();
src/app/clients/[id]/page.tsx:47:        const admin = createAdminClient();
src/lib/assistant/orchestrator.ts:436:  const adminClient = createAdminClient();
src/lib/assistant/channel-adapters/whatsapp.ts:79:  const supabase = createAdminClient();
src/lib/assistant/channel-adapters/whatsapp.ts:206:  const adminClient = createAdminClient();
src/lib/assistant/briefing.ts:128:    const supabase = createAdminClient();
src/lib/assistant/briefing.ts:216:  const supabase = createAdminClient();
src/lib/assistant/weekly-digest.ts:257:    const supabase = createAdminClient();
src/lib/assistant/weekly-digest.ts:320:  const supabase = createAdminClient();
src/lib/supabase/admin.ts:18:export function createAdminClient() {
src/app/api/_handlers/whatsapp/webhook/route.ts:25:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/whatsapp/webhook/route.ts:39:    const { data } = await supabaseAdmin
src/app/api/_handlers/whatsapp/webhook/route.ts:111:                await supabaseAdmin.from("whatsapp_webhook_events").insert({
src/app/api/_handlers/whatsapp/webhook/route.ts:143:            const { error: eventError } = await supabaseAdmin
src/app/api/_handlers/whatsapp/webhook/route.ts:163:            const { data: profile } = await supabaseAdmin
src/app/api/_handlers/whatsapp/webhook/route.ts:170:                await supabaseAdmin
src/app/api/_handlers/whatsapp/webhook/route.ts:181:            const { error } = await supabaseAdmin.from("driver_locations").insert({
src/app/api/_handlers/whatsapp/webhook/route.ts:191:                await supabaseAdmin
src/app/api/_handlers/whatsapp/webhook/route.ts:199:                await supabaseAdmin
src/app/api/_handlers/whatsapp/webhook/route.ts:253:        const { error: eventError } = await supabaseAdmin
src/app/api/_handlers/whatsapp/webhook/route.ts:273:            await supabaseAdmin.from("whatsapp_webhook_events").update({
src/app/api/_handlers/whatsapp/webhook/route.ts:284:            await supabaseAdmin.from("whatsapp_webhook_events").update({
src/app/api/_handlers/whatsapp/webhook/route.ts:306:        const { error: eventError } = await supabaseAdmin
src/app/api/_handlers/whatsapp/webhook/route.ts:323:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/whatsapp/webhook/route.ts:330:            await supabaseAdmin.from("whatsapp_webhook_events").update({
src/app/api/_handlers/whatsapp/webhook/route.ts:339:            await supabaseAdmin.from("whatsapp_webhook_events").update({
src/app/api/_handlers/whatsapp/webhook/route.ts:350:        const { error: uploadError } = await supabaseAdmin.storage
src/app/api/_handlers/whatsapp/webhook/route.ts:358:            await supabaseAdmin.from("whatsapp_webhook_events").update({
src/app/api/_handlers/whatsapp/webhook/route.ts:365:        await supabaseAdmin.from('social_media_library').insert({
src/app/api/_handlers/whatsapp/webhook/route.ts:378:        await supabaseAdmin.from("whatsapp_webhook_events").update({
src/app/api/_handlers/bookings/[id]/invoice/route.ts:75:    const adminClient = createAdminClient();
src/app/api/_handlers/onboarding/setup/route.ts:9:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/onboarding/setup/route.ts:96:  const { data, error } = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:152:  const { data: profile, error: profileError } = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:164:  const { data: inserted, error: insertError } = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:184:  const { data: organizationWithTemplate, error: organizationWithTemplateError } = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:215:    await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:239:  const { data: marketplace } = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:350:      const { data: existingOrg } = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:387:        let insertResult = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:394:          insertResult = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:434:    let { error: organizationUpdateError } = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:444:      const fallbackUpdateResult = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:455:    const { error: profileUpdateError } = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:473:    const { data: existingMarketplace } = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:479:    const { error: marketplaceError } = await supabaseAdmin
src/app/api/_handlers/health/route.ts:30:const supabaseAdmin =
src/app/api/_handlers/health/route.ts:32:        ? createAdminClient()
src/app/api/_handlers/health/route.ts:106:    if (!supabaseAdmin) {
src/app/api/_handlers/health/route.ts:111:    const { error } = await supabaseAdmin
src/app/api/_handlers/health/route.ts:300:    if (!supabaseAdmin) {
src/app/api/_handlers/health/route.ts:305:        supabaseAdmin
src/app/api/_handlers/health/route.ts:309:        supabaseAdmin
src/app/api/_handlers/health/route.ts:313:        supabaseAdmin
src/app/api/_handlers/health/route.ts:316:        supabaseAdmin
src/app/api/_handlers/onboarding/first-value/route.ts:34:    const adminClient = createAdminClient();
src/app/api/_handlers/leads/convert/route.ts:78:  const supabase = createAdminClient();
src/app/api/_handlers/billing/contact-sales/route.ts:99:    const admin = createAdminClient();
src/app/api/_handlers/notifications/retry-failed/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/retry-failed/route.ts:22:            const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/notifications/retry-failed/route.ts:27:            const { data: profile } = await supabaseAdmin
src/app/api/_handlers/notifications/retry-failed/route.ts:40:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/notifications/retry-failed/route.ts:56:            await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/notifications/process-queue/route.ts:30:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/process-queue/route.ts:80:            ? supabaseAdmin.from("trips").select("id,organization_id").in("id", tripIds)
src/app/api/_handlers/notifications/process-queue/route.ts:83:            ? supabaseAdmin.from("profiles").select("id,organization_id").in("id", userIds)
src/app/api/_handlers/notifications/process-queue/route.ts:123:    await supabaseAdmin.from("notification_delivery_status").insert({
src/app/api/_handlers/notifications/process-queue/route.ts:165:    await supabaseAdmin.from("notification_dead_letters").insert({
src/app/api/_handlers/notifications/process-queue/route.ts:183:    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/notifications/process-queue/route.ts:185:    const { data: profile } = await supabaseAdmin
src/app/api/_handlers/notifications/process-queue/route.ts:203:    let existingQuery = supabaseAdmin
src/app/api/_handlers/notifications/process-queue/route.ts:226:    const { data: inserted } = await supabaseAdmin
src/app/api/_handlers/notifications/process-queue/route.ts:252:    const { data: claimedRows } = await supabaseAdmin
src/app/api/_handlers/notifications/process-queue/route.ts:332:        await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/notifications/process-queue/route.ts:395:        await supabaseAdmin
src/app/api/_handlers/notifications/process-queue/route.ts:425:        await supabaseAdmin
src/app/api/_handlers/notifications/process-queue/route.ts:436:        await supabaseAdmin
src/app/api/_handlers/notifications/process-queue/route.ts:495:        const { data: dueRows, error: dueError } = await supabaseAdmin
src/app/api/_handlers/notifications/process-queue/route.ts:538:            await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/notifications/schedule-followups/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/schedule-followups/route.ts:90:    const { data: completedTrips, error: tripsError } = await supabaseAdmin
src/app/api/_handlers/notifications/schedule-followups/route.ts:127:    const { data: existingRows, error: existingError } = await supabaseAdmin
src/app/api/_handlers/notifications/schedule-followups/route.ts:187:      const { error: insertError } = await supabaseAdmin
src/app/api/_handlers/notifications/client-landed/route.ts:10:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/client-landed/route.ts:32:        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/notifications/client-landed/route.ts:56:        const { data: trip, error: tripError } = await supabaseAdmin
src/app/api/_handlers/notifications/client-landed/route.ts:91:        const { data: assignmentRaw } = await supabaseAdmin
src/app/api/_handlers/notifications/client-landed/route.ts:113:        const { data: accommodation } = await supabaseAdmin
src/app/api/_handlers/notifications/client-landed/route.ts:159:        await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/payments/webhook/route.ts:281:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:394:    const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:461:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:494:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:524:  const supabase = createAdminClient();
src/app/api/_handlers/drivers/search/route.ts:16:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/drivers/search/route.ts:56:        let query = supabaseAdmin
src/app/api/_handlers/drivers/search/route.ts:84:        const { data: assignments, error: assignError } = await supabaseAdmin
src/app/api/_handlers/settings/team/shared.ts:190:  const admin = createAdminClient();
src/app/api/_handlers/payments/track/[token]/route.ts:35:    const admin = createAdminClient();
src/app/api/_handlers/payments/track/[token]/route.ts:69:    const admin = createAdminClient();
src/app/api/_handlers/assistant/quick-prompts/route.ts:45:  const admin = createAdminClient();
src/app/api/_handlers/location/live/[token]/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/live/[token]/route.ts:37:        const { count: recentCount } = await supabaseAdmin
src/app/api/_handlers/location/live/[token]/route.ts:48:        void supabaseAdmin.from("trip_location_share_access_logs").insert({
src/app/api/_handlers/location/live/[token]/route.ts:53:        const { data: share, error: shareError } = await supabaseAdmin
src/app/api/_handlers/location/live/[token]/route.ts:83:        const { data: latestLocation } = await supabaseAdmin
src/app/api/_handlers/location/live/[token]/route.ts:91:        const assignmentQuery = supabaseAdmin
src/app/api/_handlers/portal/[token]/route.ts:58:    const admin = createAdminClient();
src/app/api/_handlers/payments/verify/route.ts:28:    const admin = createAdminClient();
src/app/api/_handlers/assistant/conversations/[sessionId]/route.ts:48:      supabase: createAdminClient(),
src/app/api/_handlers/assistant/conversations/route.ts:47:    supabase: createAdminClient(),
src/app/api/_handlers/assistant/usage/route.ts:40:      supabase: createAdminClient(),
src/app/api/_handlers/assistant/confirm/route.ts:70:    const adminClient = createAdminClient();
src/app/api/_handlers/assistant/chat/stream/route.ts:385:    const adminClient = createAdminClient();
src/app/api/_handlers/location/cleanup-expired/route.ts:10:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/cleanup-expired/route.ts:15:    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/location/cleanup-expired/route.ts:18:    const { data: profile } = await supabaseAdmin
src/app/api/_handlers/location/cleanup-expired/route.ts:59:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/location/cleanup-expired/route.ts:72:            await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/location/ping/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/ping/route.ts:20:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/location/ping/route.ts:42:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:48:        const { data: trip } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:62:        const { data: assignmentRows } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:73:            const { data: driverAccount } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:90:        const { data: latestPing } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:106:        const { error: insertError } = await supabaseAdmin
src/app/api/_handlers/reputation/dashboard/route.ts:19:    const supabase = createAdminClient();
src/app/api/_handlers/integrations/tripadvisor/route.ts:31:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/integrations/tripadvisor/route.ts:32:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/integrations/tripadvisor/route.ts:50:        await supabaseAdmin.from('organization_settings').upsert(
src/app/api/_handlers/integrations/tripadvisor/route.ts:86:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/integrations/tripadvisor/route.ts:87:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/integrations/tripadvisor/route.ts:97:        const { data: settings } = await supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:13:  const supabaseAdmin = createAdminClient();
src/app/api/_handlers/integrations/places/route.ts:14:  const { data: profile } = await supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:25:  supabaseAdmin: any,
src/app/api/_handlers/integrations/places/route.ts:28:  const { data: connection } = await supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:42:  supabaseAdmin: any,
src/app/api/_handlers/integrations/places/route.ts:47:  const existingConnection = await getGooglePlaceConnection(supabaseAdmin, organizationId);
src/app/api/_handlers/integrations/places/route.ts:50:    await supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:62:    await supabaseAdmin.from("reputation_platform_connections").insert({
src/app/api/_handlers/integrations/places/route.ts:72:  await supabaseAdmin.from("organization_settings").upsert(
src/app/api/_handlers/integrations/places/route.ts:133:    const supabaseAdmin = createAdminClient();
src/app/api/_handlers/integrations/places/route.ts:135:      supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:140:      getGooglePlaceConnection(supabaseAdmin, organizationId),
src/app/api/_handlers/integrations/places/route.ts:175:    const supabaseAdmin = createAdminClient();
src/app/api/_handlers/integrations/places/route.ts:177:      await ensureGooglePlaceConfigured(supabaseAdmin, organizationId, googlePlaceId);
src/app/api/_handlers/integrations/places/route.ts:185:    await supabaseAdmin.from("organization_settings").upsert(
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:100:        const adminClient = createAdminClient();
src/app/api/_handlers/dashboard/tasks/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/dashboard/tasks/route.ts:42:    const { data: trips, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:108:    const { data: invoices, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:165:    const { data: proposals, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:231:    const { data: trips, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:292:    const { data, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/schedule/route.ts:9:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/dashboard/schedule/route.ts:100:        const { data: trips, error } = await supabaseAdmin
src/app/api/_handlers/subscriptions/limits/route.ts:33:    const dataClient = canUseAdminClient ? createAdminClient() : supabase;
src/app/api/_handlers/nav/counts/route.ts:28:    const admin = createAdminClient();
src/app/api/_handlers/location/client-share/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/client-share/route.ts:21:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/location/client-share/route.ts:32:        const { data: trip } = await supabaseAdmin
src/app/api/_handlers/location/client-share/route.ts:47:        let existingQuery = supabaseAdmin
src/app/api/_handlers/location/client-share/route.ts:74:        const { data: inserted, error: insertError } = await supabaseAdmin
src/app/api/_handlers/payments/links/[token]/route.ts:47:    const admin = createAdminClient();
src/app/api/_handlers/payments/links/[token]/route.ts:97:    const admin = createAdminClient();
src/app/api/_handlers/webhooks/waha/route.ts:85:    const admin = createAdminClient();
src/app/api/_handlers/trips/[id]/notifications/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/notifications/route.ts:14:    const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/notifications/route.ts:37:    const { data: logs } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/notifications/route.ts:45:    const { data: queue } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:12:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/admin/clients/route.ts:206:        let { data: existingProfile } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:213:            const { data: phoneProfile } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:223:                supabaseAdmin,
src/app/api/_handlers/admin/clients/route.ts:257:            const { data: existingOrgProfile } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:269:            const { error: profileError } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:279:            const { error: clientUpsertError } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:297:        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
src/app/api/_handlers/admin/clients/route.ts:311:        const { error: profileError } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:325:        const { error: clientInsertError } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:379:        let profilesQuery = supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:400:                const { count } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:449:        const { data: targetProfile } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:466:        const { data: profileSnapshotData } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:472:        const { data: clientSnapshotData } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:479:        const { error: profileDeleteError } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:488:        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(clientId);
src/app/api/_handlers/admin/clients/route.ts:493:                await supabaseAdmin.from("profiles").upsert(profileSnapshot);
src/app/api/_handlers/admin/clients/route.ts:496:                await supabaseAdmin.from("clients").upsert(clientSnapshot);
src/app/api/_handlers/admin/clients/route.ts:615:        const { data: existingProfile } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:665:        const { error } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:679:            await supabaseAdmin.from("workflow_stage_events").insert({
src/app/api/_handlers/admin/clients/route.ts:693:                const { data: stageRule } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:711:            await supabaseAdmin.from("notification_queue").insert({
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:15:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:24:        const { data: authData } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:26:            const { data: profile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:38:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:60:        const { data: targetProfile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:72:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:134:        const { data: targetProfile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:158:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:22:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:71:        await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:182:            supabaseAdmin
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:187:            supabaseAdmin
src/app/api/_handlers/marketplace/route.ts:18:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/route.ts:185:        const { data: authData } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/route.ts:187:            const { data: profile } = await supabaseAdmin
src/app/api/_handlers/marketplace/route.ts:199:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/marketplace/route.ts:236:        let supabaseQuery = supabaseAdmin
src/app/api/_handlers/marketplace/route.ts:308:            const { data: reviewData } = await supabaseAdmin
src/app/api/_handlers/marketplace/route.ts:545:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/marketplace/listing-subscription/route.ts:55:  const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:138:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:195:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:270:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:53:  const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:106:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/options/route.ts:22:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/options/route.ts:74:    const { data } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/options/route.ts:88:  const queryClient = supabaseAdmin as unknown as {
src/app/api/_handlers/marketplace/options/route.ts:139:  const { data, error } = await supabaseAdmin
src/app/api/_handlers/social/reviews/public/route.ts:60:    supabaseAdmin: ReturnType<typeof createAdminClient>,
src/app/api/_handlers/social/reviews/public/route.ts:65:    const { data: sharedItinerary } = await supabaseAdmin
src/app/api/_handlers/social/reviews/public/route.ts:72:        const { data: itinerary } = await supabaseAdmin
src/app/api/_handlers/social/reviews/public/route.ts:79:            const { data: profile } = await supabaseAdmin
src/app/api/_handlers/social/reviews/public/route.ts:91:    const { data: proposal } = await supabaseAdmin
src/app/api/_handlers/social/reviews/public/route.ts:142:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/reviews/public/route.ts:144:        const organizationId = await resolveOrganizationIdFromToken(supabaseAdmin, token);
src/app/api/_handlers/social/reviews/public/route.ts:161:        const { data: duplicateReview } = await supabaseAdmin
src/app/api/_handlers/social/reviews/public/route.ts:184:        const { data: reviewData, error } = await supabaseAdmin
src/app/api/_handlers/social/reviews/public/route.ts:213:            const { error: postError } = await supabaseAdmin.from("social_posts").insert({
src/app/api/_handlers/emails/welcome/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/emails/welcome/route.ts:18:        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/emails/welcome/route.ts:34:        const { data: profile, error: profileError } = await supabaseAdmin
src/app/api/_handlers/emails/welcome/route.ts:59:            await supabaseAdmin
src/app/api/_handlers/trips/[id]/invoices/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/invoices/route.ts:32:        const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/invoices/route.ts:66:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/invoices/route.ts:83:        const { data: invoices, error } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/invoices/route.ts:113:            const { data: payments } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:40:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/clone/route.ts:43:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:56:        let tripQuery = supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:81:            const { data: originalItinerary, error: itinError } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:98:                const { data: newItinerary, error: insertItinError } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:124:        const { data: newTrip, error: insertTripError } = await supabaseAdmin
src/app/api/_handlers/social/refresh-tokens/route.ts:31:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/refresh-tokens/route.ts:36:        const { data: expiringConnections, error } = await supabaseAdmin
src/app/api/_handlers/social/refresh-tokens/route.ts:78:                    await supabaseAdmin
src/app/api/_handlers/social/refresh-tokens/route.ts:87:                    await supabaseAdmin
src/app/api/_handlers/social/oauth/callback/route.ts:44:    const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/oauth/callback/route.ts:45:    const { data: profile } = await supabaseAdmin
src/app/api/_handlers/social/oauth/callback/route.ts:102:        await supabaseAdmin.from('social_connections').upsert(
src/app/api/_handlers/social/oauth/callback/route.ts:128:        await supabaseAdmin.from('social_connections').upsert(
src/app/api/_handlers/social/oauth/callback/route.ts:145:    const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/oauth/callback/route.ts:146:    const { data: profile } = await supabaseAdmin
src/app/api/_handlers/social/oauth/callback/route.ts:182:    await supabaseAdmin.from('social_connections').upsert(
src/app/api/_handlers/social/oauth/callback/route.ts:199:    const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/oauth/callback/route.ts:200:    const { data: profile } = await supabaseAdmin
src/app/api/_handlers/social/oauth/callback/route.ts:235:    await supabaseAdmin.from('social_connections').upsert(
src/app/api/_handlers/trips/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/route.ts:76:        supabaseAdmin.from("invoices")
src/app/api/_handlers/trips/route.ts:79:        supabaseAdmin.from("trip_driver_assignments")
src/app/api/_handlers/trips/route.ts:82:        supabaseAdmin.from("trip_accommodations")
src/app/api/_handlers/trips/route.ts:172:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/trips/route.ts:190:            let query = supabaseAdmin
src/app/api/_handlers/trips/route.ts:283:        let query = supabaseAdmin
src/app/api/_handlers/admin/revenue/route.ts:47:    const db = createAdminClient();
src/app/api/_handlers/trips/[id]/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/route.ts:59:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/route.ts:73:    const { data: profile } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:106:        let tripQuery = supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:183:        const { data: driversData } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:190:        const { data: assignmentsData } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:207:        const { data: accommodationsData } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:224:        const { data: reminderRows } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:260:        const { data: latestLocation } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:282:            const { data: overlappingTrips } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:292:                const { data: remoteAssignments } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:332:        const { data: invoiceAggData } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:380:        let tripLookup = supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:409:                const { error } = await supabaseAdmin.from(table).delete().eq("trip_id", tripId);
src/app/api/_handlers/trips/[id]/route.ts:422:        const { error: deleteTripError } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:432:            const { count: remainingTrips } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/route.ts:438:                await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:67:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/process-queue/route.ts:71:        const { data: pendingItems, error: fetchError } = await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:92:            const { data: claimedRows } = await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:106:                    await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:128:                await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:152:                await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:175:            const { data: remaining } = await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:185:                await supabaseAdmin
src/app/api/_handlers/trips/[id]/add-ons/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/add-ons/route.ts:13:        const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:47:        const { data: proposals } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/add-ons/route.ts:60:        const { data: addOns, error } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/add-ons/route.ts:125:        const { data: updated, error } = await supabaseAdmin
```

### `createAdminClient()` hits (121)
```text
src/lib/whatsapp/chatbot-flow.ts:228:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:292:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:314:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:343:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:386:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:418:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:541:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:232:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:268:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:329:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:392:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:435:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:475:  const admin = createAdminClient();
src/lib/ai/cost-guardrails.ts:27:  const admin = createAdminClient();
src/lib/ai/cost-guardrails.ts:126:  const admin = createAdminClient();
src/lib/platform/audit.ts:24:    const adminClient = createAdminClient();
src/lib/platform/audit.ts:47:    const adminClient = createAdminClient();
src/lib/platform/settings.ts:60:  const adminClient = createAdminClient();
src/lib/platform/settings.ts:102:  const adminClient = createAdminClient();
src/lib/platform/settings.ts:198:  const adminClient = createAdminClient();
src/lib/reputation/referral-flywheel.ts:111:    const supabase = createAdminClient();
src/lib/reputation/referral-flywheel.ts:157:    const supabase = createAdminClient();
src/lib/notifications.ts:5:const supabaseAdmin = createAdminClient();
src/lib/auth/admin.ts:167:  const adminClient = createAdminClient();
src/lib/admin/operator-scorecard.ts:503:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard.ts:554:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard-delivery.ts:50:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard-delivery.ts:116:  const admin = createAdminClient();
src/lib/supabase/admin.ts:18:export function createAdminClient() {
src/lib/security/admin-bearer-auth.ts:3:const supabaseAdmin = createAdminClient();
src/lib/security/cost-endpoint-guard.ts:120:    const adminClient = createAdminClient();
src/lib/assistant/alerts.ts:209:    const supabase = createAdminClient();
src/lib/assistant/alerts.ts:257:  const supabase = createAdminClient();
src/lib/payments/payment-utils.ts:30:  return context === 'admin' ? createAdminClient() : createClient();
src/app/share/[token]/page.tsx:17:    const supabaseAdmin = createAdminClient();
src/lib/assistant/orchestrator.ts:436:  const adminClient = createAdminClient();
src/app/clients/[id]/page.tsx:47:        const admin = createAdminClient();
src/lib/assistant/channel-adapters/whatsapp.ts:79:  const supabase = createAdminClient();
src/lib/assistant/channel-adapters/whatsapp.ts:206:  const adminClient = createAdminClient();
src/lib/assistant/briefing.ts:128:    const supabase = createAdminClient();
src/lib/assistant/briefing.ts:216:  const supabase = createAdminClient();
src/lib/assistant/weekly-digest.ts:257:    const supabase = createAdminClient();
src/lib/assistant/weekly-digest.ts:320:  const supabase = createAdminClient();
src/app/pay/[token]/page.tsx:25:  const admin = createAdminClient();
src/app/api/_handlers/share/[token]/route.ts:102:  const supabaseAdmin = createAdminClient();
src/app/api/_handlers/share/[token]/route.ts:148:  const supabaseAdmin = createAdminClient();
src/app/api/_handlers/cron/reputation-campaigns/route.ts:40:    const supabase = createAdminClient();
src/app/api/_handlers/proposals/[id]/convert/route.ts:48:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/admin/clients/route.ts:12:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:11:export const supabaseAdmin = createAdminClient();
src/app/api/_handlers/proposals/bulk/route.ts:29:    const admin = createAdminClient();
src/app/api/_handlers/whatsapp/webhook/route.ts:25:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/onboarding/setup/route.ts:9:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/onboarding/first-value/route.ts:34:    const adminClient = createAdminClient();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:15:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:22:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/route.ts:18:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:55:  const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:138:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:195:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:270:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:53:  const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:106:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/options/route.ts:22:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/emails/welcome/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/leads/convert/route.ts:78:  const supabase = createAdminClient();
src/app/api/_handlers/location/live/[token]/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/client-share/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/ping/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/bookings/[id]/invoice/route.ts:75:    const adminClient = createAdminClient();
src/app/api/_handlers/reputation/dashboard/route.ts:19:    const supabase = createAdminClient();
src/app/api/_handlers/billing/contact-sales/route.ts:99:    const admin = createAdminClient();
src/app/api/_handlers/admin/revenue/route.ts:47:    const db = createAdminClient();
src/app/api/_handlers/location/cleanup-expired/route.ts:10:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/reviews/public/route.ts:142:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/process-queue/route.ts:67:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/notifications/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/clone/route.ts:40:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/add-ons/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/invoices/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/health/route.ts:32:        ? createAdminClient()
src/app/api/_handlers/trips/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/webhooks/waha/route.ts:85:    const admin = createAdminClient();
src/app/api/_handlers/notifications/schedule-followups/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/client-landed/route.ts:10:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/process-queue/route.ts:30:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/assistant/quick-prompts/route.ts:45:  const admin = createAdminClient();
src/app/api/_handlers/assistant/conversations/[sessionId]/route.ts:48:      supabase: createAdminClient(),
src/app/api/_handlers/assistant/conversations/route.ts:47:    supabase: createAdminClient(),
src/app/api/_handlers/assistant/usage/route.ts:40:      supabase: createAdminClient(),
src/app/api/_handlers/assistant/confirm/route.ts:70:    const adminClient = createAdminClient();
src/app/api/_handlers/integrations/tripadvisor/route.ts:31:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/integrations/tripadvisor/route.ts:86:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/integrations/places/route.ts:13:  const supabaseAdmin = createAdminClient();
src/app/api/_handlers/integrations/places/route.ts:133:    const supabaseAdmin = createAdminClient();
src/app/api/_handlers/integrations/places/route.ts:175:    const supabaseAdmin = createAdminClient();
src/app/api/_handlers/assistant/chat/stream/route.ts:385:    const adminClient = createAdminClient();
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:100:        const adminClient = createAdminClient();
src/app/api/_handlers/dashboard/tasks/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/dashboard/schedule/route.ts:9:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/payments/links/[token]/route.ts:47:    const admin = createAdminClient();
src/app/api/_handlers/payments/links/[token]/route.ts:97:    const admin = createAdminClient();
src/app/api/_handlers/subscriptions/limits/route.ts:33:    const dataClient = canUseAdminClient ? createAdminClient() : supabase;
src/app/api/_handlers/payments/verify/route.ts:28:    const admin = createAdminClient();
src/app/api/_handlers/payments/track/[token]/route.ts:35:    const admin = createAdminClient();
src/app/api/_handlers/payments/track/[token]/route.ts:69:    const admin = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:281:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:394:    const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:461:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:494:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:524:  const supabase = createAdminClient();
src/app/api/_handlers/settings/team/shared.ts:190:  const admin = createAdminClient();
src/app/api/_handlers/drivers/search/route.ts:16:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/refresh-tokens/route.ts:31:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/portal/[token]/route.ts:58:    const admin = createAdminClient();
src/app/api/_handlers/nav/counts/route.ts:28:    const admin = createAdminClient();
src/app/api/_handlers/notifications/retry-failed/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/oauth/callback/route.ts:44:    const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/oauth/callback/route.ts:145:    const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/oauth/callback/route.ts:199:    const supabaseAdmin = createAdminClient();
```

### Auth guard hits (`requireAdmin` / `requireAuth` / `requireAdminAuth`) (135)
```text
src/app/api/_handlers/admin/cache-metrics/route.ts:10:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/clear-cache/route.ts:42:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:130:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:348:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:427:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:509:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:51:    const admin = await requireAdmin(nextReq, { requireOrganization: false });
src/app/api/_handlers/admin/contacts/route.ts:144:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/contacts/route.ts:55:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:15:  const admin = await requireAdmin(request);
src/app/api/_handlers/admin/cost/overview/route.ts:33:  const admin = await requireAdmin(request);
src/app/api/_handlers/admin/cost/overview/route.ts:794:  const admin = await requireAdmin(request);
src/app/api/_handlers/admin/dashboard/stats/route.ts:24:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/destinations/route.ts:25:    const admin = await requireAdmin(request);
src/app/api/_handlers/admin/funnel/route.ts:12:    const admin = await requireAdmin(request);
src/app/api/_handlers/admin/generate-embeddings/route.ts:38:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/generate-embeddings/route.ts:99:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/geocoding/usage/route.ts:35:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/insights/action-queue/route.ts:13:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/ai-usage/route.ts:19:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/auto-requote/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:19:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:56:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/best-quote/route.ts:32:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/daily-brief/route.ts:13:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/margin-leak/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:28:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/proposal-risk/route.ts:18:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/roi/route.ts:17:  const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:42:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/win-loss/route.ts:13:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/leads/[id]/route.ts:46:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/leads/[id]/route.ts:72:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/leads/route.ts:45:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/leads/route.ts:81:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/ltv/route.ts:15:    const admin = await requireAdmin(request);
src/app/api/_handlers/admin/marketplace/verify/route.ts:103:        const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/marketplace/verify/route.ts:198:        const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:57:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/notifications/delivery/route.ts:57:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/operations/command-center/route.ts:214:    const admin = await requireAdmin(request);
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:101:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:157:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:341:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/pdf-imports/route.ts:58:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:63:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/pricing/dashboard/route.ts:18:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:108:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:24:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:59:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/route.ts:25:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/route.ts:73:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/transactions/route.ts:41:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:110:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:30:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:61:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:27:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:65:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trips/route.ts:19:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/vendor-history/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:136:  const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:188:  const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:36:    const admin = await requireAdmin(request);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:81:    const admin = await requireAdmin(request);
src/app/api/_handlers/admin/referrals/route.ts:109:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/referrals/route.ts:24:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/reports/gst/route.ts:34:    const authResult = await requireAdmin(request);
src/app/api/_handlers/admin/reports/operators/route.ts:12:        const admin = await requireAdmin(request);
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:101:    const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:25:    const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/revenue/route.ts:137:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/security/diagnostics/route.ts:23:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/seed-demo/route.ts:39:  const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/social/generate/route.ts:234:    const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/tour-templates/extract/route.ts:13:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:226:    const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/trips/[id]/route.ts:58:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/trips/route.ts:122:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/trips/route.ts:234:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/whatsapp/health/route.ts:56:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:12:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/workflow/events/route.ts:19:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/workflow/rules/route.ts:139:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/workflow/rules/route.ts:91:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/billing/subscription/route.ts:17:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/bookings/[id]/invoice/route.ts:93:      const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/cron/operator-scorecards/route.ts:13:      const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/dashboard/schedule/route.ts:94:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:27:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/dashboard/tasks/route.ts:306:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/debug/route.ts:24:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/drivers/search/route.ts:41:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/[id]/pay/route.ts:26:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/[id]/route.ts:113:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/[id]/route.ts:237:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/[id]/route.ts:61:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/route.ts:30:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/route.ts:90:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/send-pdf/route.ts:39:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/location/share/route.ts:155:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/location/share/route.ts:31:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/location/share/route.ts:79:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/nav/counts/route.ts:97:      const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/notifications/send/route.ts:128:        const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/payments/create-order/route.ts:43:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/payments/links/route.ts:30:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/proposals/[id]/convert/route.ts:111:        const admin = await requireAdmin(req);
src/app/api/_handlers/proposals/[id]/convert/route.ts:83:async function requireAdmin(req: Request) {
src/app/api/_handlers/proposals/[id]/send/route.ts:94:  const admin = await requireAdmin(request);
src/app/api/_handlers/proposals/create/route.ts:54:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/dashboard/route.ts:140:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/settings/integrations/route.ts:19:        const admin = await requireAdmin(request);
src/app/api/_handlers/settings/marketplace/route.ts:82:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/settings/upi/route.ts:12:        const auth = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/settings/upi/route.ts:52:        const auth = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/subscriptions/cancel/route.ts:36:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/subscriptions/route.ts:153:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/broadcast/route.ts:97:  const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/connect/route.ts:29:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/conversations/route.ts:47:      const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/disconnect/route.ts:15:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:56:        const authResult = await requireAdmin(request);
src/app/api/_handlers/whatsapp/health/route.ts:8:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts:15:        const authResult = await requireAdmin(request);
src/app/api/_handlers/whatsapp/qr/route.ts:12:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/send/route.ts:15:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/status/route.ts:10:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/test-message/route.ts:12:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/availability/route.ts:119:    const admin = await requireAdmin(request);
src/app/api/availability/route.ts:20:    const adminResult = await requireAdmin(request);
src/app/api/availability/route.ts:69:    const admin = await requireAdmin(request);
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:17:    const admin = await requireAdmin(request);
src/lib/auth/admin.ts:162:export async function requireAdmin(
src/lib/auth/require-super-admin.ts:23:  const result = await requireAdmin(request, { requireOrganization: false });
```

### CSRF-related hits (39)
```text
src/lib/security/admin-mutation-csrf.ts:46:export function passesMutationCsrfGuard(req: RequestLike): boolean {
src/lib/security/admin-mutation-csrf.ts:51:  const configuredToken = process.env.ADMIN_MUTATION_CSRF_TOKEN?.trim();
src/lib/security/admin-mutation-csrf.ts:53:    const providedToken = (req.headers.get("x-admin-csrf") || "").trim();
src/lib/api-dispatch.ts:4:import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
src/lib/api-dispatch.ts:103:    const csrfExempt = routePath.startsWith("webhook") || routePath.startsWith("cron/") || routePath === "payments/webhook" || routePath === "webhooks/waha";
src/lib/api-dispatch.ts:104:    if (isMutation && !csrfExempt && !passesMutationCsrfGuard(req)) {
src/lib/api-dispatch.ts:105:      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:5:import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:21:    if (!passesMutationCsrfGuard(request)) {
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:22:      return apiError("CSRF validation failed for admin mutation", 403);
src/app/api/availability/route.ts:4:import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
src/app/api/availability/route.ts:73:    if (!passesMutationCsrfGuard(request)) {
src/app/api/availability/route.ts:74:      return apiError("CSRF validation failed for admin mutation", 403);
src/app/api/availability/route.ts:123:    if (!passesMutationCsrfGuard(request)) {
src/app/api/availability/route.ts:124:      return apiError("CSRF validation failed for admin mutation", 403);
src/app/api/_handlers/superadmin/announcements/route.ts:7:import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
src/app/api/_handlers/superadmin/announcements/route.ts:61:    if (!passesMutationCsrfGuard(request)) {
src/app/api/_handlers/superadmin/announcements/route.ts:63:            { error: "CSRF validation failed for admin mutation" },
src/app/api/_handlers/admin/clients/route.ts:9:import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
src/app/api/_handlers/admin/clients/route.ts:134:        if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/clients/route.ts:136:                { error: "CSRF validation failed for admin mutation" },
src/app/api/_handlers/admin/trips/route.ts:7:import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
src/app/api/_handlers/admin/trips/route.ts:238:        if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/trips/route.ts:240:                { error: "CSRF validation failed for admin mutation" },
src/app/api/_handlers/admin/clear-cache/route.ts:7:import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
src/app/api/_handlers/admin/clear-cache/route.ts:57:    if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/clear-cache/route.ts:58:        return apiError("CSRF validation failed for admin mutation", 403);
src/app/api/_handlers/admin/leads/route.ts:9:import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
src/app/api/_handlers/admin/leads/route.ts:83:  if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/leads/route.ts:85:      { error: "CSRF validation failed for admin mutation" },
src/app/api/_handlers/admin/generate-embeddings/route.ts:5:import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
src/app/api/_handlers/admin/generate-embeddings/route.ts:40:  if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/generate-embeddings/route.ts:42:      { error: "CSRF validation failed for admin mutation" },
src/app/api/_handlers/admin/contacts/route.ts:10:import { passesMutationCsrfGuard } from '@/lib/security/admin-mutation-csrf';
src/app/api/_handlers/admin/contacts/route.ts:152:    if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/contacts/route.ts:154:        { error: 'CSRF validation failed for admin mutation' },
src/app/api/_handlers/admin/seed-demo/route.ts:10:import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
src/app/api/_handlers/admin/seed-demo/route.ts:57:  if (!passesMutationCsrfGuard(request)) {
src/app/api/_handlers/admin/seed-demo/route.ts:58:    return apiError("CSRF validation failed for admin mutation", 403);
```

### Rate-limit hits (`enforceRateLimit` / `rateLimit:`) (80)
```text
src/app/api/[...path]/route.ts:124:], { rateLimit: { limit: 200, windowMs: 5 * 60 * 1000, prefix: "api:main" } });
src/app/api/_handlers/admin/clear-cache/route.ts:47:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:144:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:363:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:435:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:517:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:59:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:65:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/contacts/route.ts:172:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/contacts/route.ts:80:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/marketplace/verify/route.ts:120:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/marketplace/verify/route.ts:215:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/marketplace/verify/route.ts:88:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>,
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:12:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:66:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/notifications/delivery/route.ts:11:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/notifications/delivery/route.ts:72:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:109:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:165:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:349:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/route.ts:69:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:71:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/referrals/route.ts:117:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/referrals/route.ts:32:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/security/diagnostics/route.ts:11:  rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/security/diagnostics/route.ts:32:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/seed-demo/route.ts:44:  const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/social/generate/route.ts:242:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/tour-templates/extract/route.ts:21:  const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:234:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/[id]/route.ts:46:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/trips/[id]/route.ts:63:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/route.ts:137:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/route.ts:248:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/route.ts:80:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/whatsapp/health/route.ts:67:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:20:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/workflow/events/route.ts:24:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/workflow/rules/route.ts:101:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/workflow/rules/route.ts:144:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/workflow/rules/route.ts:24:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/assistant/chat/route.ts:37:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/assistant/chat/stream/route.ts:613:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/assistant/confirm/route.ts:39:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/auth/password-login/route.ts:56:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/currency/route.ts:53:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/emails/welcome/route.ts:24:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/itinerary/import/pdf/route.ts:61:        const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/itinerary/import/url/route.ts:116:        const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/leads/convert/route.ts:52:  const rl = await enforceRateLimit({
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:129:        const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/notifications/client-landed/route.ts:38:        const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/notifications/send/route.ts:141:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/onboarding/setup/route.ts:252:    const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/onboarding/setup/route.ts:311:    const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/payments/create-order/route.ts:48:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/payments/track/[token]/route.ts:26:    const rl = await enforceRateLimit({ identifier: ip, limit: 60, windowMs: 60_000, prefix: "api:payments:track:get" });
src/app/api/_handlers/payments/track/[token]/route.ts:54:    const rl = await enforceRateLimit({ identifier: ip, limit: 20, windowMs: 60_000, prefix: "api:payments:track:post" });
src/app/api/_handlers/proposals/create/route.ts:57:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/proposals/public/[token]/route.ts:89:    const limiter = await enforceRateLimit({
src/app/api/_handlers/reputation/nps/[token]/route.ts:21:    const rl = await enforceRateLimit({
src/app/api/_handlers/reputation/nps/submit/route.ts:15:    const rl = await enforceRateLimit({
src/app/api/_handlers/reputation/widget/[token]/route.ts:57:    const rl = await enforceRateLimit({
src/app/api/_handlers/share/[token]/route.ts:110:    const limiter = await enforceRateLimit({
src/app/api/_handlers/share/[token]/route.ts:156:    const limiter = await enforceRateLimit({
src/app/api/_handlers/social/reviews/public/route.ts:125:        const limiter = await enforceRateLimit({
src/app/api/_handlers/weather/route.ts:39:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/whatsapp/connect/route.ts:34:        const rateLimit = await enforceRateLimit({
src/app/api/admin/[...path]/route.ts:74:], { rateLimit: ADMIN_RATE_LIMIT });
src/app/api/assistant/[...path]/route.ts:15:  rateLimit: {
src/app/api/reputation/[...path]/route.ts:27:  rateLimit: {
src/app/api/social/[...path]/route.ts:28:  rateLimit: {
src/app/api/superadmin/[...path]/route.ts:39:], { rateLimit: SUPERADMIN_RATE_LIMIT });
src/lib/api-dispatch.ts:72:        const result = await enforceRateLimit({
src/lib/assistant/channel-adapters/whatsapp.ts:186:  const rateLimit = await enforceRateLimit({
src/lib/auth/admin.ts:103:    const telemetryLimit = await enforceRateLimit({
src/lib/security/cost-endpoint-guard.ts:176:  const burstLimit = await enforceRateLimit({
src/lib/security/cost-endpoint-guard.ts:183:  const dailyLimit = await enforceRateLimit({
src/lib/security/public-rate-limit.ts:35:  const limiter = await enforceRateLimit({
src/lib/security/rate-limit.ts:118:export async function enforceRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
```

### JSON parsing / catch pattern hits (212)
```text
src/lib/external/amadeus.ts:64:  const data = await response.json();
src/lib/external/amadeus.ts:114:  const payload = await response.json();
src/lib/external/weather.ts:99:        const data = await response.json();
src/lib/external/weather.ts:143:        const data = await response.json();
src/lib/marketplace-options.ts:215:    const payload = await response.json();
src/lib/marketplace-emails.ts:48:        const data = await response.json().catch(() => ({}));
src/lib/payments/razorpay.ts:138:  const payload = await response.json().catch(() => null);
src/app/p/[token]/page.tsx:73:      const rawPayload = await response.json();
src/app/p/[token]/page.tsx:124:    const rawPayload = await response.json();
src/lib/payments/link-tracker.ts:11:  const payload = (await response.json().catch(() => null)) as
src/lib/proposal-notifications.ts:33:  const payload = await response.json().catch(() => ({}));
src/lib/whatsapp.server.ts:59:            const body = await response.json().catch(() => ({}));
src/lib/embeddings-v2.ts:79:    const body = (await response.json()) as GeminiEmbeddingResponse;
src/lib/external/currency.ts:95:        const data = await response.json();
src/lib/external/currency.ts:148:        const data = await response.json();
src/lib/external/currency.ts:191:        const data = await response.json();
src/lib/assistant/orchestrator.ts:249:  return (await response.json()) as OpenAIResponse;
src/lib/assistant/channel-adapters/whatsapp.ts:235:      await updateSessionHistory(ctx, session.id, updatedHistory).catch(() => {});
src/lib/assistant/channel-adapters/whatsapp.ts:274:    await updateSessionHistory(ctx, session.id, updatedHistory).catch(() => {});
src/lib/geocoding.ts:90:        const data = await response.json();
src/lib/geocoding-with-cache.ts:211:        const data = await response.json();
src/lib/queries/itineraries.ts:37:            const payload = await response.json();
src/lib/queries/itineraries.ts:60:                const errorPayload = await response.json().catch(() => ({}));
src/lib/queries/itineraries.ts:64:            return response.json();
src/lib/queries/itineraries.ts:127:                const errorPayload = await response.json().catch(() => ({}));
src/lib/queries/itineraries.ts:131:            return response.json();
src/lib/queries/dashboard.ts:89:      return (await response.json()) as DashboardStatsResponse;
src/lib/queries/trip-detail.ts:47:      return response.json();
src/lib/queries/trip-detail.ts:66:      return response.json();
src/lib/queries/trip-detail.ts:86:      return response.json();
src/lib/queries/trip-detail.ts:105:      return response.json();
src/lib/queries/trip-detail.ts:146:        const err = await response.json().catch(() => ({}));
src/lib/queries/trip-detail.ts:151:      return response.json();
src/lib/queries/clients.ts:40:            const payload = await response.json();
src/lib/queries/clients.ts:60:            const payload = await response.json();
src/app/inbox/page.tsx:82:        const payload = (await response.json().catch(() => null)) as
src/app/inbox/page.tsx:234:      const payload = (await response.json().catch(() => null)) as
src/app/inbox/page.tsx:606:    navigator.clipboard.writeText(template.body).catch(() => {});
src/app/inbox/page.tsx:732:        onSelect={(msg) => { navigator.clipboard.writeText(msg).catch(() => {}); setShowCanned(false); }}
src/components/whatsapp/CannedResponses.tsx:157:    navigator.clipboard.writeText(msg).catch(() => {});
src/lib/queries/dashboard-tasks.ts:173:      return response.json() as Promise<DashboardTasksResponse>;
src/lib/queries/dashboard-tasks.ts:202:      return response.json() as Promise<DashboardScheduleResponse>;
src/lib/queries/dashboard-tasks.ts:224:      const payload = await response.json();
src/lib/queries/dashboard-tasks.ts:262:        const errorPayload = await response.json().catch(() => ({}));
src/lib/queries/dashboard-tasks.ts:268:      return response.json() as Promise<{ success: boolean }>;
src/lib/queries/trips.ts:55:            const payload = await response.json();
src/lib/queries/trips.ts:73:            const payload = await response.json();
src/lib/queries/trips.ts:120:                const errorPayload = await response.json().catch(() => ({}));
src/lib/queries/trips.ts:124:            return response.json() as Promise<{ success: boolean; tripId: string; message: string }>;
src/components/whatsapp/UnifiedInbox.tsx:81:      const data = (await response.json().catch(() => ({}))) as {
src/components/whatsapp/UnifiedInbox.tsx:105:      const data = (await response.json().catch(() => ({}))) as {
src/components/whatsapp/UnifiedInbox.tsx:190:      const payload = (await response.json().catch(() => ({}))) as {
src/components/whatsapp/UnifiedInbox.tsx:226:      const payload = (await response.json().catch(() => ({}))) as {
src/components/whatsapp/UnifiedInbox.tsx:336:      const payload = await response.json().catch(() => ({}));
src/app/portal/[token]/page.tsx:102:        const payload = (await response.json().catch(() => null)) as
src/components/whatsapp/useSmartReplySuggestions.ts:94:      const result = await response.json().catch(() => ({}));
src/lib/email.ts:63:    const result = await response.json().catch(() => ({}));
src/app/settings/team/useTeamMembers.ts:48:        const payload = (await response.json()) as TeamResponse;
src/app/settings/team/useTeamMembers.ts:87:    const payload = (await response.json()) as { error?: string };
src/app/settings/marketplace/MarketplaceListingPlans.tsx:127:      const payload = await response.json().catch(() => null);
src/app/settings/marketplace/MarketplaceListingPlans.tsx:176:      const createPayload = await createResponse.json().catch(() => null);
src/app/settings/marketplace/MarketplaceListingPlans.tsx:213:            const verifyPayload = await verifyResponse.json().catch(() => null);
src/app/settings/marketplace/useMarketplacePresence.ts:215:      const payload = (await response.json()) as { error?: string };
src/app/marketplace/analytics/page.tsx:76:                const data = await response.json();
src/app/marketplace/page.tsx:80:            const data = await response.json();
src/app/clients/[id]/ClientEditButton.tsx:96:                const payload = await response.json();
src/app/clients/page.tsx:371:                const payload = await response.json();
src/app/clients/page.tsx:401:                const error = await response.json();
src/app/add-ons/page.tsx:102:      const data = await response.json();
src/app/add-ons/page.tsx:207:        const result = await response.json();
src/app/add-ons/page.tsx:243:      const data = await response.json();
src/app/auth/page.tsx:58:                const payload = await response.json();
src/app/pay/[token]/PaymentCheckoutClient.tsx:110:            const payload = (await verifyResponse.json().catch(() => null)) as
src/features/admin/billing/useBillingData.ts:207:          const payload = await response.json().catch(() => ({}));
src/features/admin/billing/useBillingData.ts:242:        const payload = await response.json().catch(() => ({}));
src/app/admin/notifications/page.tsx:128:            const payload = await response.json();
src/app/admin/notifications/page.tsx:158:            const payload = (await response.json()) as DeliveryResponse & { error?: string };
src/app/admin/notifications/page.tsx:198:            const payload = await response.json();
src/app/admin/notifications/page.tsx:226:            const payload = await response.json();
src/app/admin/notifications/page.tsx:252:            const payload = await response.json();
src/app/admin/notifications/page.tsx:281:            const payload = await response.json();
src/app/admin/notifications/page.tsx:314:            const payload = await response.json();
src/app/admin/notifications/page.tsx:349:            const payload = await response.json();
src/app/admin/trips/page.tsx:90:            const error = await response.json();
src/app/admin/trips/page.tsx:96:        const payload = await response.json();
src/app/admin/trips/[id]/page.tsx:88:                error = (await response.json()) as ErrorPayload;
src/app/admin/trips/[id]/page.tsx:97:        const payload = (await response.json()) as TripDetailApiPayload;
src/app/admin/trips/[id]/page.tsx:123:                const payload = await response.json();
src/app/admin/trips/[id]/page.tsx:160:            const data = await response.json();
src/app/admin/trips/[id]/page.tsx:358:            const payload = (await response.json()) as OverpassResponse;
src/app/admin/trips/[id]/page.tsx:507:            const payload = await response.json();
src/app/admin/trips/[id]/page.tsx:552:            const payload = await response.json();
src/app/admin/trips/[id]/_components/TripHeader.tsx:105:                const error = await response.json();
src/app/admin/trips/[id]/clone/page.tsx:63:        const payload = (await response.json()) as TripSnapshot;
src/app/admin/trips/[id]/clone/page.tsx:128:      const result = await response.json();
src/app/reputation/_components/useReputationDashboardData.ts:62:  const payload = (await response.json().catch(() => ({}))) as {
src/components/CreateTripModal.tsx:103:            const error = await response.json();
src/components/CreateTripModal.tsx:109:        const payload = await response.json();
src/components/CreateTripModal.tsx:135:            const payload = await response.json();
src/components/CreateTripModal.tsx:214:            const payload = await response.json();
src/components/CreateTripModal.tsx:352:                const payload = await response.json();
src/components/CreateTripModal.tsx:373:            const payloadData = await response.json();
src/app/admin/templates/page.tsx:116:                const rawPayload: unknown = await response.json();
src/app/admin/kanban/page.tsx:221:            const payload = await response.json();
src/app/admin/kanban/page.tsx:253:            const payload = await response.json();
src/app/admin/kanban/page.tsx:291:            const payload = await response.json();
src/app/admin/kanban/page.tsx:349:            const payload = await response.json();
src/app/admin/kanban/page.tsx:412:            const payload = await response.json();
src/features/admin/pricing/components/TripCostEditor.tsx:47:        .catch(() => {});
src/app/reputation/_components/ReviewInbox.tsx:357:      const body = await response.json().catch(() => ({}));
src/app/reputation/_components/ReviewInbox.tsx:387:      const body = await response.json().catch(() => ({}));
src/app/reputation/_components/ReviewInbox.tsx:414:      const body = await response.json().catch(() => ({}));
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:29:    const body = await request.json().catch(() => null);
src/app/social/_components/canvas/CanvasPublishModal.tsx:101:      const payload = await response.json().catch(() => ({}));
src/app/live/[token]/page.tsx:57:            const payload = await response.json();
src/app/social/_components/StockTab.tsx:78:                const data = await response.json();
src/features/calendar/useCalendarAvailability.ts:33:      const payload = (await response.json().catch(() => null)) as
src/app/api/_handlers/share/[token]/route.ts:169:    const body = await request.json().catch(() => ({}));
src/app/proposals/create/_hooks/useWhatsAppDraft.ts:57:        response.json().then((payload) => ({ ok: response.ok, payload })),
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:197:  const body = await request.json().catch(() => ({}));
src/app/proposals/create/_hooks/useCreateProposal.ts:130:      const payload = await response.json().catch(() => ({}));
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:89:    const body = await request.json().catch(() => ({}));
src/app/proposals/create/_hooks/useAvailabilityCheck.ts:47:        response.json().then((payload) => ({ ok: response.ok, payload })),
src/app/proposals/create/_hooks/usePricingSuggestion.ts:43:      .then((response) => response.json().then((payload) => ({ ok: response.ok, payload })))
src/components/pdf/itinerary-pdf.tsx:56:    const payload = await response.json();
src/app/proposals/page.tsx:186:      const payload = await response.json().catch(() => ({}));
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:66:    const body = await req.json().catch(() => null);
src/components/pdf/ProposalPDFButton.tsx:125:        const error = await response.json();
src/app/api/_handlers/admin/pricing/overheads/route.ts:82:    const body = await req.json().catch(() => null);
src/app/proposals/[id]/page.tsx:284:      const payload = await response.json().catch(() => ({} as Record<string, unknown>));
src/app/admin/operations/page.tsx:171:        const payload = (await response.json()) as CommandCenterPayload & { error?: string };
src/components/admin/ConvertProposalModal.tsx:49:            const data = await response.json();
src/app/admin/gst-report/page.tsx:207:        const json = (await res.json().catch(() => null)) as { error?: string } | null;
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:68:    const body = await req.json().catch(() => null);
src/app/admin/cost/page.tsx:83:        const json = (await response.json()) as CostOverviewPayload & {
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:71:    const body = await req.json().catch(() => null);
src/features/calendar/BlockDatesModal.tsx:74:      const payload = (await response.json().catch(() => null)) as
src/features/calendar/BlockDatesModal.tsx:106:      const payload = (await response.json().catch(() => null)) as
src/app/admin/cost/_components/CapEditor.tsx:63:        const json = (await response.json()) as {
src/components/layout/useNavCounts.ts:45:        const payload = (await response.json()) as Partial<NavCounts>;
src/app/admin/cost/_components/AlertsList.tsx:52:        const json = (await response.json()) as {
src/components/planner/ApprovalManager.tsx:89:      const payload = await response.json();
src/components/planner/ApprovalManager.tsx:159:      const payload = await response.json().catch(() => ({}));
src/components/payments/RazorpayModal.tsx:192:            const payload = (await verifyResponse.json().catch(() => null)) as
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:257:    const body = await request.json().catch(() => null);
src/app/admin/invoices/page.tsx:115:      const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:135:    const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:154:      const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:271:      const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:317:      const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:413:      const payload = await response.json().catch(() => ({}));
src/app/admin/security/page.tsx:54:      const payload = await response.json();
src/app/admin/settings/page.tsx:365:                    const payload = await response.json();
src/app/api/_handlers/admin/clear-cache/route.ts:22:        const body = await req.json().catch(() => null);
src/app/admin/settings/marketplace/page.tsx:211:                const err = await response.json();
src/app/admin/settings/marketplace/page.tsx:247:                const err = await response.json();
src/app/admin/insights/page.tsx:112:              const payload = await response.json().catch(() => ({}));
src/app/admin/insights/page.tsx:115:            const json = await response.json();
src/components/assistant/TourAssistantChat.tsx:122:            .catch(() => {});
src/app/api/_handlers/images/unsplash/route.ts:66:        const data = (await response.json()) as { results?: UnsplashSearchResult[] };
src/app/api/_handlers/images/pexels/route.ts:40:        const data = await response.json();
src/app/api/_handlers/admin/social/generate/route.ts:261:    const body = await request.json().catch(() => null);
src/app/api/_handlers/payments/create-order/route.ts:60:    const rawBody = await request.json().catch(() => null);
src/features/calendar/useCalendarActions.ts:130:        const payload = await response.json().catch(() => ({}));
src/features/calendar/useCalendarActions.ts:134:      return response.json();
src/features/calendar/useCalendarActions.ts:197:        const payload = await response.json().catch(() => ({}));
src/features/calendar/useCalendarActions.ts:201:      return response.json();
src/features/calendar/useCalendarActions.ts:227:        const payload = await response.json().catch(() => ({}));
src/features/calendar/useCalendarActions.ts:231:      return response.json();
src/app/api/_handlers/payments/links/route.ts:35:    const body = await request.json().catch(() => null);
src/app/api/_handlers/proposals/[id]/send/route.ts:102:  const body = await request.json().catch(() => ({}));
src/app/api/_handlers/payments/links/[token]/route.ts:82:    const body = await request.json().catch(() => null);
src/app/api/_handlers/proposals/bulk/route.ts:23:    const body = await request.json().catch(() => null);
src/app/api/_handlers/payments/verify/route.ts:22:    const body = await request.json().catch(() => null);
src/app/api/_handlers/whatsapp/broadcast/route.ts:360:    const body = await request.json().catch(() => null);
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:64:        const body = await request.json().catch(() => null);
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:151:        const payloadRaw = await request.json().catch(() => null);
src/app/onboarding/page.tsx:229:      const payload = (await response.json()) as OnboardingPayload | { error: string };
src/app/onboarding/page.tsx:273:      const payload = (await response.json()) as FirstValuePayload | { error?: string };
src/app/onboarding/page.tsx:339:      const payload = (await response.json()) as { error?: string; success?: boolean };
src/app/api/_handlers/marketplace/route.ts:513:        const body = await req.json().catch(() => null);
src/app/api/_handlers/payments/track/[token]/route.ts:63:    const body = await request.json().catch(() => null);
src/app/api/_handlers/marketplace/inquiries/route.ts:174:        const payloadRaw = await request.json().catch(() => null);
src/app/billing/BillingPageClient.tsx:145:      const payload = await response.json().catch(() => ({}));
src/app/billing/BillingPageClient.tsx:235:        const payload = await response.json().catch(() => ({}));
src/app/billing/BillingPageClient.tsx:258:        const payload = await response.json().catch(() => ({}));
src/app/api/_handlers/marketplace/listing-subscription/route.ts:186:    const body = await request.json().catch(() => null);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:264:    const body = await request.json().catch(() => null);
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:98:    const body = await request.json().catch(() => null);
src/app/api/_handlers/assistant/chat/stream/route.ts:169:  const data = (await response.json()) as {
src/app/api/_handlers/settings/team/[id]/route.ts:32:    const body = await request.json().catch(() => null);
src/app/api/_handlers/settings/team/invite/route.ts:34:    const body = await request.json().catch(() => null);
src/app/api/_handlers/images/pixabay/route.ts:36:        const data = await response.json();
src/app/api/_handlers/auth/password-login/route.ts:40:    const body = await request.json().catch(() => null);
src/app/api/_handlers/invoices/[id]/route.ts:125:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/notifications/send/route.ts:161:        const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/invoices/send-pdf/route.ts:42:    const parsed = SendInvoicePdfSchema.safeParse(await request.json().catch(() => null));
src/app/api/_handlers/invoices/route.ts:96:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/invoices/[id]/pay/route.ts:47:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/bookings/flights/search/route.ts:114:    const payload = await response.json().catch(() => ({}));
src/app/api/_handlers/trips/[id]/add-ons/route.ts:103:        const body = await req.json().catch(() => null);
src/app/api/_handlers/admin/marketplace/verify/route.ts:230:        const body = await request.json().catch(() => ({}));
src/app/api/_handlers/itinerary/import/url/route.ts:126:        const parsedBody = await req.json().catch(() => null);
src/app/api/_handlers/reputation/sync/route.ts:129:    const body = (await request.json().catch(() => ({}))) as {
src/app/api/_handlers/reputation/sync/route.ts:211:        const payload = (await placesResponse.json().catch(() => null)) as
src/app/api/_handlers/admin/cost/overview/route.ts:796:  const body = await request.json().catch(() => null);
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:18:  const body = await request.json().catch(() => null);
src/app/api/_handlers/social/reviews/public/route.ts:107:        const body = await req.json().catch(() => null);
src/app/api/_handlers/itineraries/[id]/bookings/route.ts:112:    const body = await req.json().catch(() => null);
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:33:        const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/integrations/places/route.ts:99:  const payload = (await response.json().catch(() => null)) as {
src/app/api/_handlers/integrations/places/route.ts:170:    const body = (await request.json().catch(() => ({}))) as PlacesRequestBody;
```

### `process.env` hits (342)
```text
src/env.ts:48:  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
src/env.ts:49:  INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
src/env.ts:50:  SOCIAL_TOKEN_ENCRYPTION_KEY: process.env.SOCIAL_TOKEN_ENCRYPTION_KEY,
src/env.ts:51:  SOCIAL_OAUTH_STATE_SECRET: process.env.SOCIAL_OAUTH_STATE_SECRET,
src/env.ts:52:  ADMIN_CRON_SECRET: process.env.ADMIN_CRON_SECRET,
src/env.ts:53:  CRON_SECRET: process.env.CRON_SECRET,
src/env.ts:54:  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
src/env.ts:55:  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
src/env.ts:56:  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
src/env.ts:57:  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
src/env.ts:58:  GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
src/env.ts:59:  GROQ_API_KEY: process.env.GROQ_API_KEY,
src/env.ts:60:  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
src/env.ts:61:  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
src/env.ts:62:  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
src/env.ts:63:  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
src/env.ts:64:  RESEND_API_KEY: process.env.RESEND_API_KEY,
src/env.ts:65:  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
src/env.ts:66:  RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
src/env.ts:67:  SENTRY_DSN: process.env.SENTRY_DSN,
src/env.ts:68:  WPPCONNECT_BASE_URL: process.env.WPPCONNECT_BASE_URL,
src/env.ts:69:  WPPCONNECT_TOKEN: process.env.WPPCONNECT_TOKEN,
src/env.ts:70:  WPPCONNECT_SESSION: process.env.WPPCONNECT_SESSION,
src/env.ts:71:  WPPCONNECT_URL: process.env.WPPCONNECT_URL,
src/env.ts:72:  WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY,
src/env.ts:73:  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
src/env.ts:74:  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
src/env.ts:75:  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
src/env.ts:76:  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
src/env.ts:77:  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
src/env.ts:78:  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
src/env.ts:79:  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
src/env.ts:80:  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
src/env.ts:81:  WELCOME_FROM_EMAIL: process.env.WELCOME_FROM_EMAIL,
src/env.ts:82:  FAL_KEY: process.env.FAL_KEY,
src/env.ts:83:  META_APP_ID: process.env.META_APP_ID,
src/env.ts:84:  META_APP_SECRET: process.env.META_APP_SECRET,
src/env.ts:85:  META_REDIRECT_URI: process.env.META_REDIRECT_URI,
src/env.ts:91:  process.env.SKIP_ENV_VALIDATION === 'true' ||
src/env.ts:92:  process.env.SKIP_ENV_VALIDATION === '1' ||
src/env.ts:93:  process.env.NODE_ENV === 'test';
src/env.ts:94:const isProduction = process.env.NODE_ENV === 'production';
src/components/analytics/PostHogProvider.tsx:13:    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
src/components/analytics/PostHogProvider.tsx:30:    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
src/components/analytics/PostHogProvider.tsx:34:    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
src/components/analytics/PostHogProvider.tsx:41:  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
src/lib/analytics/server.ts:5:    process.env.POSTHOG_PROJECT_API_KEY ||
src/lib/analytics/server.ts:6:    process.env.POSTHOG_API_KEY ||
src/lib/analytics/server.ts:7:    process.env.NEXT_PUBLIC_POSTHOG_KEY;
src/lib/analytics/server.ts:14:    host: process.env.POSTHOG_HOST || "https://app.posthog.com",
src/lib/import/pdf-extractor.ts:17:    process.env.GOOGLE_API_KEY ||
src/lib/import/pdf-extractor.ts:18:    process.env.GOOGLE_GEMINI_API_KEY ||
src/lib/import/pdf-extractor.ts:19:    process.env.GEMINI_API_KEY
src/lib/import/url-scraper.ts:16:    process.env.GOOGLE_API_KEY ||
src/lib/import/url-scraper.ts:17:    process.env.GOOGLE_GEMINI_API_KEY ||
src/lib/import/url-scraper.ts:18:    process.env.GEMINI_API_KEY
src/lib/semantic-cache.ts:17:  const raw = Number(process.env.SEMANTIC_CACHE_MATCH_THRESHOLD);
src/lib/external/linkedin.server.ts:25:    const clientId = process.env.LINKEDIN_CLIENT_ID;
src/lib/external/linkedin.server.ts:26:    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
src/lib/external/google.server.ts:27:    const clientId = process.env.GOOGLE_CLIENT_ID;
src/lib/external/google.server.ts:28:    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
src/lib/external/google.server.ts:61:    const clientId = process.env.GOOGLE_CLIENT_ID;
src/lib/external/google.server.ts:62:    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
src/lib/external/amadeus.ts:10:  const explicit = process.env.AMADEUS_BASE_URL?.trim();
src/lib/external/amadeus.ts:15:  const envMode = (process.env.AMADEUS_ENV || 'production').trim().toLowerCase();
src/lib/external/amadeus.ts:17:    if (process.env.NODE_ENV === 'production') {
src/lib/external/amadeus.ts:28:  const clientId = process.env.AMADEUS_CLIENT_ID;
src/lib/external/amadeus.ts:29:  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
src/lib/marketplace-emails.ts:11:const apiKey = process.env.RESEND_API_KEY;
src/lib/marketplace-emails.ts:12:const fromEmail = process.env.WELCOME_FROM_EMAIL || "marketplace@itinerary.ai";
src/lib/email.ts:17:    const apiKey = process.env.RESEND_API_KEY;
src/lib/email.ts:18:    const fromEmail = process.env.WELCOME_FROM_EMAIL;
src/components/payments/RazorpayModal.tsx:112:  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
src/lib/rag-itinerary.ts:22:    const key = process.env.OPENAI_API_KEY;
src/lib/security/service-role-auth.ts:5:    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
src/lib/security/mock-endpoint-guard.ts:4:  if (process.env.NODE_ENV === "production") {
src/lib/security/mock-endpoint-guard.ts:15:  const explicitMockEnable = process.env.ENABLE_MOCK_ENDPOINTS === "true";
src/lib/security/mock-endpoint-guard.ts:16:  if (process.env.NODE_ENV !== "development" && !explicitMockEnable) {
src/lib/security/admin-mutation-csrf.ts:51:  const configuredToken = process.env.ADMIN_MUTATION_CSRF_TOKEN?.trim();
src/lib/security/rate-limit.ts:33:    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/lib/security/rate-limit.ts:34:    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/lib/security/rate-limit.ts:100:    if (process.env.NODE_ENV === "production") {
src/lib/security/rate-limit.ts:121:        if (process.env.NODE_ENV === "production" && process.env.RATE_LIMIT_FAIL_OPEN !== "true") {
src/lib/security/social-oauth-state.ts:17:  return process.env.NODE_ENV === "production";
src/lib/security/social-oauth-state.ts:36:  return process.env.SOCIAL_OAUTH_STATE_SECRET?.trim() || "";
src/lib/security/social-oauth-state.ts:67:  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/lib/security/social-oauth-state.ts:68:  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/lib/security/cron-auth.ts:29:        process.env.CRON_SIGNING_SECRET?.trim() ||
src/lib/security/cron-auth.ts:30:        process.env.NOTIFICATION_SIGNING_SECRET?.trim() ||
src/lib/security/cron-auth.ts:37:        process.env.CRON_SECRET || "",
src/lib/security/cron-auth.ts:38:        process.env.NOTIFICATION_CRON_SECRET || "",
src/lib/security/cron-auth.ts:49:    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/lib/security/cron-auth.ts:50:    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/lib/security/cron-auth.ts:91:            if (process.env.NODE_ENV === "production") {
src/lib/security/cron-auth.ts:99:    } else if (process.env.NODE_ENV === "production") {
src/lib/payments/payment-utils.ts:23:    process.env.GST_COMPANY_STATE ||
src/lib/payments/payment-utils.ts:24:    process.env.NEXT_PUBLIC_GST_COMPANY_STATE ||
src/lib/security/social-token-crypto.ts:9:  return process.env.NODE_ENV === "production";
src/lib/security/social-token-crypto.ts:53:  const configured = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim();
src/lib/security/safe-error.ts:1:const IS_PRODUCTION = process.env.NODE_ENV === "production";
src/lib/security/diagnostics-auth.ts:20:    const configuredToken = process.env.HEALTHCHECK_TOKEN?.trim();
src/lib/security/whatsapp-webhook-config.ts:2:  if (process.env.NODE_ENV === "production") return false;
src/lib/security/whatsapp-webhook-config.ts:3:  return process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK === "true";
src/lib/proposal-notifications.ts:24:      ? `${(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')}/api/proposals/${proposalId}/send`
src/lib/proposal-notifications.ts:52:    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
src/lib/invoices/public-link.ts:5:  return process.env.INVOICE_SIGNING_SECRET || env.razorpay.keySecret || env.razorpay.webhookSecret || null;
src/lib/cache/upstash.ts:10:  return process.env.NODE_ENV !== "production";
src/lib/cache/upstash.ts:25:  const url = process.env.UPSTASH_REDIS_REST_URL;
src/lib/cache/upstash.ts:26:  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
src/lib/integrations.ts:20:    return process.env.NODE_ENV === "production";
src/lib/shared-itinerary-cache.ts:38:  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
src/lib/shared-itinerary-cache.ts:39:  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
src/lib/platform/settings.ts:44:  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/lib/platform/settings.ts:45:  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/lib/reputation/campaign-trigger.ts:145:      const npsLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reputation/nps/${npsToken}`;
src/lib/supabase/server.ts:23:                                secure: process.env.NODE_ENV === 'production',
src/lib/reputation/referral-flywheel.ts:10:const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
src/lib/reputation/referral-flywheel.ts:30:  const resendApiKey = process.env.RESEND_API_KEY;
src/lib/reputation/referral-flywheel.ts:32:    process.env.PROPOSAL_FROM_EMAIL ||
src/lib/reputation/referral-flywheel.ts:33:    process.env.WELCOME_FROM_EMAIL ||
src/lib/reputation/referral-flywheel.ts:34:    process.env.RESEND_FROM_EMAIL;
src/lib/supabase/env.ts:8:  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
src/lib/supabase/env.ts:9:  const vercelEnv = process.env.VERCEL_ENV?.toLowerCase();
src/lib/supabase/env.ts:18:  const explicit = process.env.ALLOW_SUPABASE_DEV_FALLBACK;
src/lib/supabase/env.ts:28:  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
src/lib/supabase/env.ts:29:  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
src/lib/whatsapp.server.ts:37:    const token = process.env.WHATSAPP_TOKEN;
src/lib/whatsapp.server.ts:38:    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
src/lib/whatsapp.server.ts:298:    const token = process.env.WHATSAPP_TOKEN;
src/lib/supabase/admin.ts:19:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
src/lib/supabase/admin.ts:20:    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
src/lib/supabase/middleware.ts:36:                            secure: process.env.NODE_ENV === 'production',
src/lib/cost/spend-guardrails.ts:57:  return process.env.NODE_ENV === "production";
src/lib/cost/spend-guardrails.ts:68:  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/lib/cost/spend-guardrails.ts:69:  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/lib/assistant/orchestrator.ts:430:  const openaiKey = process.env.OPENAI_API_KEY;
src/lib/geocoding.ts:67:    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
src/lib/observability/metrics.ts:7:    const apiKey = process.env.POSTHOG_PROJECT_API_KEY || process.env.POSTHOG_API_KEY || env.posthog.key;
src/lib/observability/metrics.ts:8:    const host = process.env.POSTHOG_HOST || "https://app.posthog.com";
src/lib/geocoding-with-cache.ts:23:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
src/lib/geocoding-with-cache.ts:24:    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
src/lib/geocoding-with-cache.ts:42:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
src/lib/geocoding-with-cache.ts:43:    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
src/lib/geocoding-with-cache.ts:73:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
src/lib/geocoding-with-cache.ts:74:    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
src/lib/geocoding-with-cache.ts:104:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
src/lib/geocoding-with-cache.ts:105:    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
src/lib/geocoding-with-cache.ts:144:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
src/lib/geocoding-with-cache.ts:145:    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
src/lib/geocoding-with-cache.ts:175:    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
src/lib/geocoding-with-cache.ts:323:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
src/lib/geocoding-with-cache.ts:324:    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
src/lib/demo/constants.ts:5:  process.env.NEXT_PUBLIC_DEMO_ORG_ID || "d0000000-0000-4000-8000-000000000001";
src/lib/pdf-extractor.ts:32:    const key = process.env.OPENAI_API_KEY;
src/lib/itinerary-cache.ts:12:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
src/lib/itinerary-cache.ts:13:    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
src/lib/ai/cost-guardrails.ts:18:const DEFAULT_REQUEST_CAP = Number(process.env.AI_MAX_GENERATIONS_PER_ORG_MONTH || "400");
src/lib/ai/cost-guardrails.ts:19:const DEFAULT_SPEND_CAP_USD = Number(process.env.AI_MAX_SPEND_PER_ORG_MONTH_USD || "25");
src/components/ui/map/map-core.tsx:52:const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
src/app/pay/[token]/page.tsx:13:    return process.env.NEXT_PUBLIC_APP_URL || undefined;
src/lib/api-dispatch.ts:7:  (process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || "")
src/lib/notification-templates.ts:178:                name: process.env.WHATSAPP_TEMPLATE_PICKUP_CLIENT || "pickup_reminder_60m_v1",
src/lib/notification-templates.ts:179:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:184:                name: process.env.WHATSAPP_TEMPLATE_PICKUP_DRIVER || "pickup_reminder_driver_60m_v1",
src/lib/notification-templates.ts:185:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:190:                name: process.env.WHATSAPP_TEMPLATE_TRIP_DELAY || "trip_delay_update_v1",
src/lib/notification-templates.ts:191:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:196:                name: process.env.WHATSAPP_TEMPLATE_DRIVER_REASSIGNED || "driver_reassigned_v1",
src/lib/notification-templates.ts:197:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:202:                name: process.env.WHATSAPP_TEMPLATE_PAYMENT_CONFIRMED || "payment_confirmed_v1",
src/lib/notification-templates.ts:203:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:208:                name: process.env.WHATSAPP_TEMPLATE_FOLLOWUP_REVIEW || "post_trip_review_day1_v1",
src/lib/notification-templates.ts:209:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:214:                name: process.env.WHATSAPP_TEMPLATE_FOLLOWUP_REFERRAL || "post_trip_referral_day7_v1",
src/lib/notification-templates.ts:215:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:220:                name: process.env.WHATSAPP_TEMPLATE_FOLLOWUP_REENGAGE || "post_trip_reengage_day30_v1",
src/lib/notification-templates.ts:221:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:226:                name: process.env.WHATSAPP_TEMPLATE_LIFECYCLE_LEAD || "lifecycle_lead_v1",
src/lib/notification-templates.ts:227:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:232:                name: process.env.WHATSAPP_TEMPLATE_LIFECYCLE_PROSPECT || "lifecycle_prospect_v1",
src/lib/notification-templates.ts:233:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:238:                name: process.env.WHATSAPP_TEMPLATE_LIFECYCLE_PROPOSAL || "lifecycle_proposal_v1",
src/lib/notification-templates.ts:239:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:244:                name: process.env.WHATSAPP_TEMPLATE_LIFECYCLE_PAYMENT_PENDING || "lifecycle_payment_pending_v1",
src/lib/notification-templates.ts:245:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:250:                name: process.env.WHATSAPP_TEMPLATE_PAYMENT_CONFIRMED || "payment_confirmed_v1",
src/lib/notification-templates.ts:251:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:256:                name: process.env.WHATSAPP_TEMPLATE_LIFECYCLE_ACTIVE || "lifecycle_active_v1",
src/lib/notification-templates.ts:257:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:262:                name: process.env.WHATSAPP_TEMPLATE_LIFECYCLE_REVIEW || "lifecycle_review_v1",
src/lib/notification-templates.ts:263:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/lib/notification-templates.ts:268:                name: process.env.WHATSAPP_TEMPLATE_LIFECYCLE_PAST || "lifecycle_past_v1",
src/lib/notification-templates.ts:269:                languageCode: process.env.WHATSAPP_TEMPLATE_LANG || "en",
src/app/settings/marketplace/MarketplaceListingPlans.tsx:103:  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
src/app/clients/[id]/error.tsx:30:                {process.env.NODE_ENV === "development" ? (
src/app/pay/[token]/PaymentCheckoutClient.tsx:69:    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
src/app/test-db/page.tsx:5:    if (process.env.NODE_ENV === 'production') {
src/app/api/[...path]/route.ts:30:  ...(process.env.NODE_ENV !== "production" ? [["debug", () => import("@/app/api/_handlers/debug/route")] satisfies [string, () => Promise<unknown>]] : []),
src/app/api/[...path]/route.ts:102:  ...(process.env.NODE_ENV !== "production" ? [["test-geocoding", () => import("@/app/api/_handlers/test-geocoding/route")] satisfies [string, () => Promise<unknown>]] : []),
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:215:                inquiryUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://itinerary-ai.vercel.app"}/admin/marketplace/inquiries`,
src/app/api/_handlers/marketplace/listing-subscription/route.ts:160:        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
src/app/api/_handlers/marketplace/listing-subscription/route.ts:161:          process.env.RAZORPAY_KEY_SECRET &&
src/app/api/_handlers/marketplace/listing-subscription/route.ts:162:          process.env.RAZORPAY_KEY_ID,
src/app/api/_handlers/share/[token]/route.ts:45:const SHARE_READ_RATE_LIMIT_MAX = Number(process.env.PUBLIC_SHARE_READ_RATE_LIMIT_MAX || "60");
src/app/api/_handlers/share/[token]/route.ts:47:  process.env.PUBLIC_SHARE_READ_RATE_LIMIT_WINDOW_MS || 15 * 60_000
src/app/api/_handlers/share/[token]/route.ts:49:const SHARE_WRITE_RATE_LIMIT_MAX = Number(process.env.PUBLIC_SHARE_WRITE_RATE_LIMIT_MAX || "20");
src/app/api/_handlers/share/[token]/route.ts:51:  process.env.PUBLIC_SHARE_WRITE_RATE_LIMIT_WINDOW_MS || 15 * 60_000
src/app/api/_handlers/debug/route.ts:10:  if (process.env.NODE_ENV === 'production') return false;
src/app/api/_handlers/debug/route.ts:11:  return process.env.ENABLE_DEBUG_ENDPOINT === 'true' || process.env.ENABLE_DEBUG_ENDPOINT === '1';
src/app/api/_handlers/debug/route.ts:32:    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/location/share/route.ts:8:    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
src/app/api/_handlers/location/client-share/route.ts:9:    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:164:              nps_link: `${process.env.NEXT_PUBLIC_APP_URL || ""}/reputation/nps/${npsToken}`,
src/app/api/_handlers/proposals/[id]/send/route.ts:50:  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).trim();
src/app/api/_handlers/portal/[token]/route.ts:8:  process.env.PUBLIC_PORTAL_READ_RATE_LIMIT_MAX || "30"
src/app/api/_handlers/portal/[token]/route.ts:11:  process.env.PUBLIC_PORTAL_READ_RATE_LIMIT_WINDOW_MS || 60_000
src/app/api/_handlers/portal/[token]/route.ts:355:        googleReviewLink: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || null,
src/app/api/_handlers/reputation/ai/analyze/route.ts:174:    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
src/app/api/_handlers/reputation/ai/respond/route.ts:277:    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
src/app/api/_handlers/settings/team/[id]/resend/route.ts:58:      process.env.NEXT_PUBLIC_APP_URL ||
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:118:  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
src/app/api/_handlers/location/cleanup-expired/route.ts:8:const cleanupSecret = process.env.NOTIFICATION_CRON_SECRET || "";
src/app/api/_handlers/location/cleanup-expired/route.ts:9:const signingSecret = process.env.NOTIFICATION_SIGNING_SECRET || "";
src/app/api/_handlers/settings/team/invite/route.ts:65:      process.env.NEXT_PUBLIC_APP_URL ||
src/app/api/_handlers/payments/links/[token]/route.ts:13:  process.env.PUBLIC_PAYMENT_LINK_READ_RATE_LIMIT_MAX || "30"
src/app/api/_handlers/payments/links/[token]/route.ts:16:  process.env.PUBLIC_PAYMENT_LINK_READ_RATE_LIMIT_WINDOW_MS || 60_000
src/app/api/_handlers/payments/links/[token]/route.ts:19:  process.env.PUBLIC_PAYMENT_LINK_WRITE_RATE_LIMIT_MAX || "10"
src/app/api/_handlers/payments/links/[token]/route.ts:22:  process.env.PUBLIC_PAYMENT_LINK_WRITE_RATE_LIMIT_WINDOW_MS || 60_000
src/app/api/_handlers/images/unsplash/route.ts:31:    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
src/app/api/_handlers/images/pexels/route.ts:18:    const apiKey = process.env.PEXELS_API_KEY;
src/app/api/_handlers/invoices/send-pdf/route.ts:66:    const resendApiKey = process.env.RESEND_API_KEY;
src/app/api/_handlers/invoices/send-pdf/route.ts:68:      process.env.PROPOSAL_FROM_EMAIL ||
src/app/api/_handlers/invoices/send-pdf/route.ts:69:      process.env.WELCOME_FROM_EMAIL ||
src/app/api/_handlers/invoices/send-pdf/route.ts:70:      process.env.RESEND_FROM_EMAIL;
src/app/api/_handlers/health/route.ts:81:    const sentry: CheckResult = process.env.SENTRY_DSN || env.sentry.dsn
src/app/api/_handlers/health/route.ts:85:    const posthog: CheckResult = (process.env.POSTHOG_PROJECT_API_KEY || process.env.POSTHOG_API_KEY || env.posthog.key)
src/app/api/_handlers/health/route.ts:88:            detail: `POSTHOG_HOST=${process.env.POSTHOG_HOST || "https://app.posthog.com"}`,
src/app/api/_handlers/health/route.ts:93:        process.env.HEALTHCHECK_PING_URL || process.env.UPTIMEROBOT_HEARTBEAT_URL
src/app/api/_handlers/health/route.ts:137:        process.env.HEALTH_EDGE_FUNCTIONS
src/app/api/_handlers/health/route.ts:189:        process.env.FIREBASE_PROJECT_ID ||
src/app/api/_handlers/health/route.ts:190:        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
src/app/api/_handlers/health/route.ts:191:        process.env.FCM_PROJECT_ID;
src/app/api/_handlers/health/route.ts:224:    const token = process.env.WHATSAPP_TOKEN;
src/app/api/_handlers/health/route.ts:225:    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
src/app/api/_handlers/health/route.ts:341:    const pendingThreshold = Number(process.env.HEALTH_PENDING_QUEUE_THRESHOLD || "100");
src/app/api/_handlers/health/route.ts:342:    const deadLetterThreshold = Number(process.env.HEALTH_DEAD_LETTER_THRESHOLD || "20");
src/app/api/_handlers/health/route.ts:343:    const oldestPendingThresholdMinutes = Number(process.env.HEALTH_OLDEST_PENDING_THRESHOLD_MINUTES || "30");
src/app/api/_handlers/images/pixabay/route.ts:18:    const apiKey = process.env.PIXABAY_API_KEY;
src/app/api/_handlers/notifications/process-queue/route.ts:46:const DEFAULT_MAX_ATTEMPTS = Number(process.env.NOTIFICATION_QUEUE_MAX_ATTEMPTS || "5");
src/app/api/_handlers/notifications/process-queue/route.ts:47:const BASE_BACKOFF_MINUTES = Number(process.env.NOTIFICATION_QUEUE_BACKOFF_BASE_MINUTES || "5");
src/app/api/_handlers/notifications/process-queue/route.ts:48:const MAX_BACKOFF_MINUTES = Number(process.env.NOTIFICATION_QUEUE_BACKOFF_MAX_MINUTES || "60");
src/app/api/_handlers/notifications/process-queue/route.ts:281:            const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
src/app/api/_handlers/notifications/process-queue/route.ts:474:            replayWindowMs: parseMsEnv(process.env.NOTIFICATION_CRON_REPLAY_WINDOW_MS, 10 * 60_000),
src/app/api/_handlers/notifications/process-queue/route.ts:475:            maxClockSkewMs: parseMsEnv(process.env.NOTIFICATION_CRON_MAX_CLOCK_SKEW_MS, 5 * 60_000),
src/app/api/_handlers/whatsapp/connect/route.ts:20:        const webhookSecret = process.env.WPPCONNECT_WEBHOOK_SECRET?.trim();
src/app/api/_handlers/whatsapp/connect/route.ts:21:        const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
src/app/api/_handlers/subscriptions/limits/route.ts:31:      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
src/app/api/_handlers/assistant/chat/stream/route.ts:374:    const openaiKey = process.env.OPENAI_API_KEY;
src/app/api/_handlers/leads/convert/route.ts:14:const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET ?? "";
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:202:  process.env.PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_MAX || "20"
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:205:  process.env.PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_WINDOW_MS || 15 * 60_000
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:208:  process.env.PUBLIC_PROPOSAL_READ_RATE_LIMIT_MAX || "30"
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:211:  process.env.PUBLIC_PROPOSAL_READ_RATE_LIMIT_WINDOW_MS || 60_000
src/app/api/_handlers/webhooks/whatsapp/route.ts:87:  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
src/app/api/_handlers/webhooks/whatsapp/route.ts:115:  const appSecret = process.env.WHATSAPP_APP_SECRET;
src/app/api/_handlers/proposals/send-pdf/route.ts:89:    const resendApiKey = process.env.RESEND_API_KEY;
src/app/api/_handlers/proposals/send-pdf/route.ts:90:    const senderEmail = process.env.WELCOME_FROM_EMAIL;
src/app/api/_handlers/webhooks/waha/route.ts:62:    const webhookSecret = process.env.WPPCONNECT_WEBHOOK_SECRET?.trim();
src/app/api/_handlers/itinerary/import/url/route.ts:103:        const groqApiKey = process.env.GROQ_API_KEY;
src/app/api/_handlers/whatsapp/webhook/route.ts:26:const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || null;
src/app/api/_handlers/whatsapp/webhook/route.ts:27:const appSecret = process.env.WHATSAPP_APP_SECRET || null;
src/app/api/_handlers/itinerary/import/pdf/route.ts:48:        const groqApiKey = process.env.GROQ_API_KEY;
src/app/api/_handlers/itinerary/generate/route.ts:55:    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
src/app/api/_handlers/itinerary/generate/route.ts:66:    (process.env.AI_LOW_COST_MODE || "").toLowerCase()
src/app/api/_handlers/itinerary/generate/route.ts:68:const ESTIMATED_COST_GROQ_USD = Number(process.env.AI_ESTIMATED_COST_GROQ_USD || "0.006");
src/app/api/_handlers/itinerary/generate/route.ts:69:const ESTIMATED_COST_GEMINI_FLASH_USD = Number(process.env.AI_ESTIMATED_COST_GEMINI_FLASH_USD || "0.012");
src/app/api/_handlers/itinerary/generate/route.ts:330:            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
src/app/api/_handlers/itinerary/generate/route.ts:458:            process.env.GOOGLE_API_KEY ||
src/app/api/_handlers/itinerary/generate/route.ts:459:            process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/itinerary/generate/route.ts:460:        const groqApiKey = process.env.GROQ_API_KEY;
src/app/api/_handlers/billing/contact-sales/route.ts:21:  const apiKey = process.env.RESEND_API_KEY;
src/app/api/_handlers/billing/contact-sales/route.ts:23:    process.env.RESEND_FROM_EMAIL ||
src/app/api/_handlers/billing/contact-sales/route.ts:24:    process.env.WELCOME_FROM_EMAIL ||
src/app/api/_handlers/billing/contact-sales/route.ts:25:    process.env.PROPOSAL_FROM_EMAIL;
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:81:  const resendApiKey = process.env.RESEND_API_KEY;
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:83:    process.env.PROPOSAL_FROM_EMAIL ||
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:84:    process.env.WELCOME_FROM_EMAIL ||
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:85:    process.env.RESEND_FROM_EMAIL;
src/app/api/_handlers/onboarding/first-value/route.ts:16:  const envOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
src/app/api/_handlers/billing/subscription/route.ts:75:      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER ||
src/app/api/_handlers/billing/subscription/route.ts:76:      process.env.SUPPORT_WHATSAPP_NUMBER ||
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:11:    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:12:    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/app/api/_handlers/social/reviews/public/route.ts:18:const REVIEW_RATE_LIMIT_MAX = parsePositiveInt(process.env.PUBLIC_REVIEW_RATE_LIMIT_MAX, 8);
src/app/api/_handlers/social/reviews/public/route.ts:20:    process.env.PUBLIC_REVIEW_RATE_LIMIT_WINDOW_MS,
src/app/api/_handlers/superadmin/monitoring/health/route.ts:12:    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:13:    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:71:        const fcmConfigured = Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY);
src/app/api/_handlers/superadmin/monitoring/health/route.ts:73:        const waConfigured = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_API_TOKEN);
src/app/api/_handlers/superadmin/monitoring/health/route.ts:75:        const sentryConfigured = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
src/app/api/_handlers/social/refresh-tokens/route.ts:17:            replayWindowMs: parseMsEnv(process.env.SOCIAL_CRON_REPLAY_WINDOW_MS, 10 * 60_000),
src/app/api/_handlers/social/refresh-tokens/route.ts:18:            maxClockSkewMs: parseMsEnv(process.env.SOCIAL_CRON_MAX_CLOCK_SKEW_MS, 5 * 60_000),
src/app/api/_handlers/social/refresh-tokens/route.ts:25:        const metaAppId = process.env.META_APP_ID?.trim();
src/app/api/_handlers/social/refresh-tokens/route.ts:26:        const metaAppSecret = process.env.META_APP_SECRET?.trim();
src/app/api/_handlers/social/oauth/linkedin/route.ts:6:const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
src/app/api/_handlers/social/oauth/linkedin/route.ts:7:const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://travelsuite-rust.vercel.app';
src/app/api/_handlers/social/oauth/callback/route.ts:8:const META_APP_ID = process.env.META_APP_ID;
src/app/api/_handlers/social/oauth/callback/route.ts:9:const META_APP_SECRET = process.env.META_APP_SECRET;
src/app/api/_handlers/social/oauth/callback/route.ts:10:const META_REDIRECT_URI = process.env.META_REDIRECT_URI ?? '';
src/app/api/_handlers/social/oauth/callback/route.ts:12:const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://travelsuite-rust.vercel.app';
src/app/api/_handlers/admin/security/diagnostics/route.ts:97:        legacy_secret_configured: Boolean(process.env.NOTIFICATION_CRON_SECRET),
src/app/api/_handlers/admin/security/diagnostics/route.ts:98:        signing_secret_configured: Boolean(process.env.NOTIFICATION_SIGNING_SECRET),
src/app/api/_handlers/admin/security/diagnostics/route.ts:110:        service_account_secret_configured: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
src/app/api/_handlers/admin/security/diagnostics/route.ts:111:        project_id_configured: Boolean(process.env.FIREBASE_PROJECT_ID),
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:162:  const apiKey = process.env.GROQ_API_KEY || "";
src/app/api/_handlers/admin/social/generate/route.ts:166:  const apiKey = process.env.GROQ_API_KEY || "";
src/app/api/_handlers/admin/seed-demo/route.ts:32:      process.env.NODE_ENV,
src/app/api/_handlers/admin/seed-demo/route.ts:33:      process.env.ALLOW_SEED_IN_PROD
src/app/api/_handlers/admin/seed-demo/route.ts:61:  const expectedCronSecret = process.env.ADMIN_CRON_SECRET?.trim();
src/app/api/_handlers/admin/cost/overview/route.ts:77:      process.env.NODE_ENV === "test" &&
src/app/api/_handlers/admin/insights/roi/route.ts:99:  const hourlyValueUsd = Number(process.env.ROI_HOURLY_VALUE_USD || "30");
src/app/api/_handlers/admin/marketplace/verify/route.ts:314:                settingsUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://itinerary-ai.vercel.app"}/admin/settings/marketplace`,
src/app/api/_handlers/social/ai-image/route.ts:22:fal.config({ credentials: process.env.FAL_KEY });
src/app/api/_handlers/social/captions/route.ts:66:    const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/social/process-queue/route.ts:27:    const explicit = process.env.SOCIAL_PUBLISH_MOCK_ENABLED?.trim().toLowerCase();
src/app/api/_handlers/social/process-queue/route.ts:30:    return process.env.NODE_ENV !== "production";
src/app/api/_handlers/social/process-queue/route.ts:48:    const base = parsePositiveInt(process.env.SOCIAL_QUEUE_RETRY_BASE_MINUTES, 5);
src/app/api/_handlers/social/process-queue/route.ts:49:    const maxBackoff = parsePositiveInt(process.env.SOCIAL_QUEUE_RETRY_MAX_MINUTES, 180);
src/app/api/_handlers/social/process-queue/route.ts:59:            replayWindowMs: parseMsEnv(process.env.SOCIAL_CRON_REPLAY_WINDOW_MS, 10 * 60_000),
src/app/api/_handlers/social/process-queue/route.ts:60:            maxClockSkewMs: parseMsEnv(process.env.SOCIAL_CRON_MAX_CLOCK_SKEW_MS, 5 * 60_000),
src/app/api/_handlers/social/process-queue/route.ts:68:        const maxAttempts = parsePositiveInt(process.env.SOCIAL_QUEUE_MAX_ATTEMPTS, 3);
src/app/api/_handlers/social/smart-poster/route.ts:44:        process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/social/smart-poster/route.ts:81:      const falKey = process.env.FAL_KEY;
src/app/api/_handlers/social/ai-poster/route.ts:41:        const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/integrations/tripadvisor/route.ts:8:const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY;
src/app/api/_handlers/social/oauth/google/route.ts:6:const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
src/app/api/_handlers/social/oauth/google/route.ts:7:const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://travelsuite-rust.vercel.app';
src/app/api/_handlers/social/extract/route.ts:9:  const explicit = process.env.SOCIAL_EXTRACT_MOCK_ENABLED?.trim().toLowerCase();
src/app/api/_handlers/social/extract/route.ts:12:  return process.env.NODE_ENV !== "production";
src/app/api/_handlers/social/extract/route.ts:47:    const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/social/oauth/facebook/route.ts:6:const META_APP_ID = process.env.META_APP_ID;
src/app/api/_handlers/social/oauth/facebook/route.ts:7:const META_REDIRECT_URI = process.env.META_REDIRECT_URI ?? '';
```

### `"use client"` files with `fetch(...)` (219)
```text
src/app/add-ons/page.tsx:101:const response = await fetch("/api/add-ons", { headers });
src/app/add-ons/page.tsx:119:const statsResponse = await fetch("/api/add-ons/stats", { headers });
src/app/add-ons/page.tsx:201:const response = await fetch(url, {
src/app/add-ons/page.tsx:238:const response = await fetch(`/api/add-ons/${addOnToDelete.id}`, {
src/app/add-ons/page.tsx:267:const response = await fetch(`/api/add-ons/${addon.id}`, {
src/app/admin/cost/_components/AlertsList.tsx:40:const response = await fetch("/api/admin/cost/alerts/ack", {
src/app/admin/cost/_components/CapEditor.tsx:51:const response = await fetch("/api/admin/cost/overview", {
src/app/admin/cost/page.tsx:75:const response = await fetch(`/api/admin/cost/overview?days=${days}`, {
src/app/admin/gst-report/page.tsx:205:const res = await fetch(`/api/admin/reports/gst?month=${month}`);
src/app/admin/insights/page.tsx:69:run: () => fetch("/api/admin/insights/action-queue?limit=8", { headers }),
src/app/admin/insights/page.tsx:74:run: () => fetch("/api/admin/insights/margin-leak?daysBack=90&limit=6", { headers }),
src/app/admin/insights/page.tsx:79:run: () => fetch("/api/admin/insights/smart-upsell-timing?daysForward=30&limit=6", { headers }),
src/app/admin/insights/page.tsx:84:run: () => fetch("/api/admin/insights/auto-requote?daysBack=120&limit=6", { headers }),
src/app/admin/insights/page.tsx:89:run: () => fetch("/api/admin/insights/daily-brief?limit=5", { headers }),
src/app/admin/insights/page.tsx:94:run: () => fetch("/api/admin/insights/win-loss?daysBack=120", { headers }),
src/app/admin/insights/page.tsx:99:run: () => fetch("/api/admin/insights/ai-usage", { headers }),
src/app/admin/insights/page.tsx:104:run: () => fetch("/api/admin/insights/batch-jobs", { headers }),
src/app/admin/internal/marketplace/page.tsx:36:const res = await fetch("/api/admin/marketplace/verify");
src/app/admin/internal/marketplace/page.tsx:52:await fetch("/api/admin/marketplace/verify", {
src/app/admin/invoices/page.tsx:114:const response = await fetch("/api/invoices?limit=50", { headers, cache: "no-store" });
src/app/admin/invoices/page.tsx:134:const response = await fetch("/api/admin/clients", { headers, cache: "no-store" });
src/app/admin/invoices/page.tsx:153:const response = await fetch(`/api/invoices/${invoiceId}`, { headers, cache: "no-store" });
src/app/admin/invoices/page.tsx:254:const response = await fetch("/api/invoices", {
src/app/admin/invoices/page.tsx:305:const response = await fetch(`/api/invoices/${selectedInvoice.id}/pay`, {
src/app/admin/invoices/page.tsx:401:const response = await fetch("/api/invoices/send-pdf", {
src/app/admin/notifications/page.tsx:123:const response = await fetch("/api/admin/whatsapp/health", {
src/app/admin/notifications/page.tsx:153:const response = await fetch(`/api/admin/notifications/delivery?${params.toString()}`, {
src/app/admin/notifications/page.tsx:191:const response = await fetch("/api/notifications/process-queue", {
src/app/admin/notifications/page.tsx:220:const response = await fetch("/api/notifications/retry-failed", {
src/app/admin/notifications/page.tsx:246:const response = await fetch("/api/notifications/schedule-followups?limit=300", {
src/app/admin/notifications/page.tsx:275:const response = await fetch("/api/location/cleanup-expired", {
src/app/admin/notifications/page.tsx:305:const response = await fetch("/api/admin/whatsapp/normalize-driver-phones", {
src/app/admin/notifications/page.tsx:340:const response = await fetch("/api/admin/notifications/delivery/retry", {
src/app/admin/referrals/page.tsx:38:<Button variant="outline" onClick={() => refetch()}>
src/app/admin/security/page.tsx:53:const response = await fetch("/api/admin/security/diagnostics", { cache: "no-store" });
src/app/admin/settings/marketplace/page.tsx:193:const response = await fetch("/api/marketplace", {
src/app/admin/settings/marketplace/page.tsx:233:const response = await fetch("/api/marketplace", {
src/app/admin/settings/page.tsx:74:const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
src/app/admin/settings/page.tsx:107:fetch('/api/settings/upi'),
src/app/admin/settings/page.tsx:108:fetch('/api/integrations/places'),
src/app/admin/settings/page.tsx:146:const res = await fetch('/api/integrations/tripadvisor', {
src/app/admin/settings/page.tsx:170:const res = await fetch('/api/integrations/places', { method: 'POST' });
src/app/admin/settings/page.tsx:189:const res = await fetch('/api/settings/upi', {
src/app/admin/settings/page.tsx:240:const rulesResponse = await fetch("/api/admin/workflow/rules", {
src/app/admin/settings/page.tsx:356:const response = await fetch("/api/admin/workflow/rules", {
src/app/admin/templates/page.tsx:109:const response = await fetch("/api/admin/notifications/delivery?limit=300", {
src/app/admin/tour-templates/import/page.tsx:63:const res = await fetch('/api/admin/tour-templates/extract', {
src/app/admin/tour-templates/import/page.tsx:109:const res = await fetch('/api/admin/tour-templates/extract', {
src/app/admin/tour-templates/import/page.tsx:134:const res = await fetch('/api/admin/tour-templates/extract', {
src/app/admin/trips/[id]/_components/TripHeader.tsx:85:const response = await fetch("/api/notifications/send", {
src/app/admin/trips/[id]/clone/page.tsx:57:const response = await fetch(`/api/admin/trips/${tripId}`, {
src/app/admin/trips/[id]/clone/page.tsx:123:const response = await fetch(`/api/admin/trips/${tripId}/clone`, {
src/app/admin/trips/[id]/page.tsx:83:const response = await fetch(`/api/admin/trips/${tripId}`, { headers });
src/app/admin/trips/[id]/page.tsx:119:const response = await fetch(`/api/location/share?tripId=${tripId}&dayNumber=${activeDay}`, {
src/app/admin/trips/[id]/page.tsx:156:const response = await fetch(url.toString(), {
src/app/admin/trips/[id]/page.tsx:351:const response = await fetch("https://overpass-api.de/api/interpreter", {
src/app/admin/trips/[id]/page.tsx:494:const response = await fetch("/api/location/share", {
src/app/admin/trips/[id]/page.tsx:544:const response = await fetch(
src/app/auth/page.tsx:51:const response = await fetch("/api/auth/password-login", {
src/app/billing/BillingPageClient.tsx:142:const response = await fetch("/api/billing/subscription", {
src/app/billing/BillingPageClient.tsx:227:const response = await fetch("/api/subscriptions", {
src/app/billing/BillingPageClient.tsx:247:const response = await fetch("/api/billing/contact-sales", {
src/app/bookings/page.tsx:70:const res = await fetch("/api/itineraries");
src/app/bookings/page.tsx:109:const res = await fetch(`/api/itineraries/${selectedItineraryId}/bookings`, {
src/app/clients/[id]/ClientEditButton.tsx:83:const response = await fetch("/api/admin/clients", {
src/app/inbox/page.tsx:79:const response = await fetch('/api/whatsapp/broadcast', {
src/app/inbox/page.tsx:222:const response = await fetch('/api/whatsapp/broadcast', {
src/app/live/[token]/page.tsx:56:const response = await fetch(`/api/location/live/${token}`, { cache: "no-store" });
src/app/marketplace/[id]/page.tsx:136:const profRes = await fetch(`/api/marketplace?q=`, { headers });
src/app/marketplace/[id]/page.tsx:143:const revRes = await fetch(`/api/marketplace/${targetOrgId}/reviews`, { headers });
src/app/marketplace/[id]/page.tsx:161:await fetch(`/api/marketplace/${targetOrgId}/view`, {
src/app/marketplace/[id]/page.tsx:181:const response = await fetch(`/api/marketplace/${targetOrgId}/reviews`, {
src/app/marketplace/[id]/page.tsx:210:const response = await fetch(`/api/marketplace/${targetOrgId}/inquiry`, {
src/app/marketplace/analytics/page.tsx:69:const response = await fetch("/api/marketplace/stats", {
src/app/marketplace/inquiries/page.tsx:43:const res = await fetch("/api/marketplace/inquiries", {
src/app/marketplace/inquiries/page.tsx:62:await fetch("/api/marketplace/inquiries", {
src/app/marketplace/page.tsx:77:const response = await fetch(url.toString(), { headers });
src/app/onboarding/page.tsx:223:const response = await fetch('/api/onboarding/setup', { cache: 'no-store' });
src/app/onboarding/page.tsx:272:const response = await fetch('/api/onboarding/first-value', { cache: 'no-store' });
src/app/onboarding/page.tsx:319:const response = await fetch('/api/onboarding/setup', {
src/app/p/[token]/page.tsx:70:const response = await fetch(`/api/proposals/public/${shareToken}`, {
src/app/p/[token]/page.tsx:116:const response = await fetch(`/api/proposals/public/${shareToken}`, {
src/app/pay/[token]/PaymentCheckoutClient.tsx:97:const verifyResponse = await fetch("/api/payments/verify", {
src/app/planner/ShareItinerary.tsx:24:const res = await fetch("/api/itinerary/share", {
src/app/planner/page.tsx:166:const resp = await fetch(`${source.endpoint}?query=${encodeURIComponent(q)}`);
src/app/planner/page.tsx:201:const res = await fetch("/api/itinerary/generate", {
src/app/portal/[token]/page.tsx:99:const response = await fetch(`/api/portal/${token}`, {
src/app/portal/[token]/page.tsx:142:await fetch('/api/social/reviews/public', {
src/app/proposals/[id]/page.tsx:274:const response = await fetch(`/api/proposals/${proposal.id}/send`, {
src/app/proposals/create/_hooks/useAvailabilityCheck.ts:41:return fetch(`/api/availability?${params.toString()}`, {
src/app/proposals/create/_hooks/useCreateProposal.ts:117:const response = await fetch('/api/proposals/create', {
src/app/proposals/create/_hooks/useCreateProposal.ts:184:const sendResponse = await fetch(`/api/proposals/${proposalId}/send`, {
src/app/proposals/create/_hooks/usePricingSuggestion.ts:38:return fetch(`/api/ai/pricing-suggestion?${params.toString()}`, {
src/app/proposals/create/_hooks/useProposalData.ts:48:const limitsResp = await fetch('/api/subscriptions/limits', {
src/app/proposals/create/_hooks/useProposalData.ts:115:const clientsResp = await fetch('/api/admin/clients', { headers });
src/app/proposals/create/_hooks/useProposalData.ts:151:const addOnsResp = await fetch('/api/add-ons');
src/app/proposals/create/_hooks/useProposalData.ts:194:const resp = await fetch('/api/admin/clients', {
src/app/proposals/create/_hooks/useWhatsAppDraft.ts:51:return fetch(`/api/whatsapp/proposal-drafts/${encodeURIComponent(whatsappDraftId)}`, {
src/app/proposals/page.tsx:181:const response = await fetch('/api/proposals/bulk', {
src/app/reputation/_components/CampaignList.tsx:92:const res = await fetch(url, {
src/app/reputation/_components/PlatformConnectionCards.tsx:95:const res = await fetch("/api/reputation/connections", {
src/app/reputation/_components/PlatformConnectionCards.tsx:128:const res = await fetch(
src/app/reputation/_components/PlatformConnectionCards.tsx:153:const res = await fetch("/api/reputation/sync", {
src/app/reputation/_components/ReviewInbox.tsx:285:const res = await fetch(`/api/reputation/reviews?${params.toString()}`, { signal });
src/app/reputation/_components/ReviewInbox.tsx:311:await fetch(`/api/reputation/reviews/${id}`, {
src/app/reputation/_components/ReviewInbox.tsx:328:const res = await fetch("/api/reputation/reviews", {
src/app/reputation/_components/ReviewInbox.tsx:347:const response = await fetch(`/api/reputation/reviews/${id}`, {
src/app/reputation/_components/ReviewInbox.tsx:381:const response = await fetch(`/api/reputation/reviews/${reviewId}/marketing-asset`, {
src/app/reputation/_components/ReviewInbox.tsx:405:const response = await fetch(`/api/reputation/reviews/${reviewId}/marketing-asset`, {
src/app/reputation/_components/ReviewResponsePanel.tsx:87:const res = await fetch("/api/ai/draft-review-response", {
src/app/reputation/_components/useReputationDashboardData.ts:54:const response = await fetch(url, {
src/app/reputation/nps/[token]/page.tsx:123:const res = await fetch(`/api/reputation/nps/${token}`);
src/app/reputation/nps/[token]/page.tsx:158:const res = await fetch("/api/reputation/nps/submit", {
src/app/settings/_components/IntegrationsTab.tsx:53:fetch('/api/settings/upi'),
src/app/settings/_components/IntegrationsTab.tsx:54:fetch('/api/integrations/places'),
src/app/settings/_components/IntegrationsTab.tsx:97:const res = await fetch('/api/integrations/tripadvisor', {
src/app/settings/_components/IntegrationsTab.tsx:122:const res = await fetch('/api/settings/upi', {
src/app/settings/_components/MapsDataSection.tsx:25:const res = await fetch('/api/integrations/places', { method: 'POST' });
src/app/settings/_components/MapsDataSection.tsx:49:const res = await fetch('/api/integrations/places', {
src/app/settings/marketplace/MarketplaceListingPlans.tsx:122:const response = await fetch("/api/marketplace/listing-subscription", {
src/app/settings/marketplace/MarketplaceListingPlans.tsx:170:const createResponse = await fetch("/api/marketplace/listing-subscription", {
src/app/settings/marketplace/MarketplaceListingPlans.tsx:199:const verifyResponse = await fetch(
src/app/settings/marketplace/useMarketplacePresence.ts:133:fetch("/api/settings/marketplace", { cache: "no-store" }),
src/app/settings/marketplace/useMarketplacePresence.ts:134:fetch("/api/marketplace/stats", { cache: "no-store" }),
src/app/settings/marketplace/useMarketplacePresence.ts:135:fetch("/api/marketplace/options", { cache: "no-store" }),
src/app/settings/marketplace/useMarketplacePresence.ts:136:fetch("/api/marketplace/listing-subscription", { cache: "no-store" }),
src/app/settings/marketplace/useMarketplacePresence.ts:200:const response = await fetch("/api/marketplace", {
src/app/settings/page.tsx:69:const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
src/app/settings/team/useTeamMembers.ts:45:const response = await fetch("/api/settings/team", {
src/app/settings/team/useTeamMembers.ts:113:fetch("/api/settings/team/invite", {
src/app/settings/team/useTeamMembers.ts:124:fetch(`/api/settings/team/${memberId}`, {
src/app/settings/team/useTeamMembers.ts:134:fetch(`/api/settings/team/${memberId}`, {
src/app/settings/team/useTeamMembers.ts:143:fetch(`/api/settings/team/${memberId}/resend`, {
src/app/share/[token]/ShareTemplateRenderer.tsx:46:await fetch(`/api/share/${token}`, {
src/app/social/_components/AiTab.tsx:108:const res = await fetch("/api/social/ai-image", {
src/app/social/_components/AiTab.tsx:174:const res = await fetch("/api/social/ai-image", {
src/app/social/_components/BulkExporter.tsx:81:const resp = await fetch("/api/social/render-poster", {
src/app/social/_components/MagicPrompter.tsx:22:const res = await fetch("/api/social/ai-poster", {
src/app/social/_components/PlatformStatusBar.tsx:25:fetch("/api/social/connections")
src/app/social/_components/PlatformStatusBar.tsx:140:onClick={() => fetch("/api/social/refresh-tokens", { method: "POST" }).then(() => window.location.reload())}
src/app/social/_components/PostHistory.tsx:49:const res = await fetch("/api/social/posts");
src/app/social/_components/PostHistory.tsx:64:const res = await fetch(`/api/social/posts/${id}`, { method: "DELETE" });
src/app/social/_components/PosterExtractor.tsx:28:const resp = await fetch("/api/social/extract", {
src/app/social/_components/PublishKitDrawer.tsx:61:const res = await fetch(endpoint, {
src/app/social/_components/PublishKitDrawer.tsx:314:const res = await fetch("/api/social/render-poster", {
src/app/social/_components/ReviewsToInsta.tsx:146:fetch("/api/social/reviews"),
src/app/social/_components/ReviewsToInsta.tsx:147:fetch("/api/reputation/reviews?limit=100&sortBy=rating&sortOrder=desc"),
src/app/social/_components/ReviewsToInsta.tsx:223:const res = await fetch("/api/social/reviews/import", { method: "POST" });
src/app/social/_components/SocialStudioClient.tsx:122:const resp = await fetch("/api/social/captions", {
src/app/social/_components/StockTab.tsx:73:const response = await fetch(
src/app/social/_components/TemplateEditor.tsx:80:const res = await fetch("/api/social/ai-image", {
src/app/social/_components/TemplateEditor.tsx:131:const res = await fetch("/api/social/smart-poster", {
src/app/social/_components/TemplateGallery.tsx:148:const res = await fetch("/api/social/posts", {
src/app/social/_components/TemplateGallery.tsx:166:const res = await fetch("/api/social/render-poster", {
src/app/social/_components/TripImporter.tsx:102:const resp = await fetch("/api/trips", {
src/app/social/_components/canvas/CanvasMode.tsx:118:const response = await fetch("/api/social/render-poster", {
src/app/social/_components/canvas/CanvasMode.tsx:153:await fetch("/api/social/posts", {
src/app/social/_components/canvas/CanvasPublishModal.tsx:88:const response = await fetch(endpoint, {
src/app/trips/TripCardGrid.tsx:69:const response = await fetch(`/api/trips/${tripId}`, {
src/app/trips/[id]/page.tsx:97:const response = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
src/components/CreateTripModal.tsx:96:const response = await fetch("/api/admin/clients", {
src/components/CreateTripModal.tsx:124:const response = await fetch("/api/itineraries", {
src/components/CreateTripModal.tsx:210:const response = await fetch("/api/subscriptions/limits", {
src/components/CreateTripModal.tsx:238:const res = await fetch("/api/itinerary/generate", {
src/components/CreateTripModal.tsx:268:const res = await fetch("/api/itinerary/import/url", {
src/components/CreateTripModal.tsx:297:const res = await fetch("/api/itinerary/import/pdf", {
src/components/CreateTripModal.tsx:331:const response = await fetch("/api/admin/trips", {
src/components/CurrencyConverter.tsx:92:const res = await fetch(
src/components/WeatherWidget.tsx:56:const res = await fetch(
src/components/admin/ConvertProposalModal.tsx:41:const response = await fetch(`/api/proposals/${proposalId}/convert`, {
src/components/assistant/ConversationHistory.tsx:61:const res = await fetch(`/api/assistant/conversations?${params.toString()}`);
src/components/assistant/ConversationHistory.tsx:91:const res = await fetch(`/api/assistant/conversations/${sessionId}`);
src/components/assistant/ConversationHistory.tsx:108:await fetch(`/api/assistant/conversations?sessionId=${sessionId}`, { method: "DELETE" });
src/components/assistant/TourAssistantChat.tsx:115:void fetch("/api/assistant/quick-prompts")
src/components/assistant/TourAssistantChat.tsx:165:const res = await fetch("/api/assistant/chat/stream", {
src/components/assistant/TourAssistantChat.tsx:173:const fallbackRes = await fetch("/api/assistant/chat", {
src/components/assistant/TourAssistantChat.tsx:320:const res = await fetch("/api/assistant/export", {
src/components/assistant/TourAssistantChat.tsx:345:const res = await fetch("/api/assistant/confirm", {
src/components/assistant/UsageDashboard.tsx:42:const res = await fetch("/api/assistant/usage");
src/components/bookings/FlightSearch.tsx:129:const res = await fetch(`/api/bookings/flights/search?${params.toString()}`);
src/components/bookings/HotelSearch.tsx:76:const res = await fetch(`/api/bookings/hotels/search?${params.toString()}`);
src/components/bookings/LocationAutocomplete.tsx:75:const res = await fetch(
src/components/layout/useNavCounts.ts:37:const response = await fetch("/api/nav/counts", {
src/components/leads/LeadToBookingFlow.tsx:441:const res = await fetch('/api/leads/convert', {
src/components/payments/RazorpayModal.tsx:179:const verifyResponse = await fetch('/api/payments/verify', {
src/components/pdf/itinerary-pdf.tsx:54:const response = await fetch(`/api/images?query=${encodeURIComponent(location)}`);
src/components/planner/ApprovalManager.tsx:88:const response = await fetch(`/api/share/${token}`);
src/components/planner/ApprovalManager.tsx:154:const response = await fetch(endpoint, {
src/components/planner/PricingManager.tsx:28:const res = await fetch('/api/add-ons');
src/components/whatsapp/ContextActionModal.tsx:460:const res = await fetch('/api/whatsapp/extract-trip-intent', {
src/components/whatsapp/UnifiedInbox.tsx:80:const response = await fetch('/api/whatsapp/conversations', { cache: 'no-store' });
src/components/whatsapp/UnifiedInbox.tsx:104:const response = await fetch('/api/whatsapp/health', { cache: 'no-store' });
src/components/whatsapp/UnifiedInbox.tsx:185:const response = await fetch(`/api/whatsapp/chatbot-sessions/${session.id}`, {
src/components/whatsapp/UnifiedInbox.tsx:223:const response = await fetch(`/api/whatsapp/proposal-drafts/${draftId}`, {
src/components/whatsapp/UnifiedInbox.tsx:327:const response = await fetch('/api/whatsapp/send', {
src/components/whatsapp/WhatsAppConnectModal.tsx:62:const res = await fetch("/api/whatsapp/connect", { method: "POST" });
src/components/whatsapp/WhatsAppConnectModal.tsx:127:const res = await fetch(
src/components/whatsapp/WhatsAppConnectModal.tsx:153:const res = await fetch(
src/components/whatsapp/WhatsAppConnectModal.tsx:198:const res = await fetch("/api/whatsapp/test-message", {
src/components/whatsapp/useSmartReplySuggestions.ts:87:const response = await fetch("/api/ai/suggest-reply", {
src/features/admin/billing/useBillingData.ts:87:fetch("/api/subscriptions"),
src/features/admin/billing/useBillingData.ts:88:fetch("/api/invoices?limit=10"),
src/features/admin/billing/useBillingData.ts:89:fetch("/api/subscriptions/limits"),
src/features/admin/billing/useBillingData.ts:142:const usageRes = await fetch("/api/admin/insights/ai-usage", {
src/features/admin/billing/useBillingData.ts:197:const response = await fetch("/api/subscriptions", {
src/features/admin/billing/useBillingData.ts:235:const response = await fetch("/api/subscriptions/cancel", {
src/features/admin/pricing/components/TransactionDetailPanel.tsx:59:const res = await fetch(`/api/admin/pricing/trip-costs/${t.id}`, { method: "DELETE" });
src/features/admin/pricing/components/TripCostEditor.tsx:36:fetch(`/api/admin/pricing/trip-costs/${costId}`)
src/features/admin/pricing/components/TripCostEditor.tsx:92:const res = await fetch(url, {
src/features/calendar/BlockDatesModal.tsx:65:const response = await fetch("/api/availability", {
src/features/calendar/BlockDatesModal.tsx:103:const response = await fetch(`/api/availability?id=${id}`, {
src/features/calendar/useCalendarActions.ts:125:const response = await fetch(`/api/invoices/${id}/send`, {
src/features/calendar/useCalendarActions.ts:192:const response = await fetch(`/api/proposals/${id}/send`, {
src/features/calendar/useCalendarActions.ts:222:const response = await fetch(`/api/proposals/${id}/convert`, {
src/features/calendar/useCalendarAvailability.ts:30:const response = await fetch(`/api/availability?${params.toString()}`, {
src/lib/queries/dashboard-tasks.ts:167:const response = await fetch("/api/dashboard/tasks", { headers });
src/lib/queries/dashboard-tasks.ts:196:const response = await fetch("/api/dashboard/schedule", { headers });
src/lib/queries/dashboard-tasks.ts:218:const response = await fetch(url, { headers });
src/lib/queries/dashboard-tasks.ts:248:const response = await fetch("/api/dashboard/tasks/dismiss", {
```

### `"use client"` files with `process.env` (9)
```text
src/app/clients/[id]/error.tsx:30:{process.env.NODE_ENV === "development" ? (
src/app/pay/[token]/PaymentCheckoutClient.tsx:69:const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
src/app/settings/marketplace/MarketplaceListingPlans.tsx:103:const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
src/components/analytics/PostHogProvider.tsx:13:if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
src/components/analytics/PostHogProvider.tsx:30:if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
src/components/analytics/PostHogProvider.tsx:34:posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
src/components/analytics/PostHogProvider.tsx:41:if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
src/components/payments/RazorpayModal.tsx:112:const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
src/components/ui/map/map-core.tsx:52:const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
```

### Non-public env references in `"use client"` files (0)
```text
_No hits._
```

### Timing-safe compare hits (35)
```text
src/lib/security/service-role-auth.ts:1:import { safeEqual } from "./safe-equal";
src/lib/security/service-role-auth.ts:7:    return safeEqual(authHeader.substring(7), serviceRole);
src/lib/invoices/public-link.ts:36:  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
src/lib/security/admin-mutation-csrf.ts:1:import { safeEqual } from "./safe-equal";
src/lib/security/admin-mutation-csrf.ts:57:    return safeEqual(providedToken, configuredToken);
src/lib/security/social-oauth-state.ts:3:import { safeEqual } from "./safe-equal";
src/lib/security/social-oauth-state.ts:157:  if (!safeEqual(receivedSignature, expectedSignature)) {
src/lib/security/cron-auth.ts:4:import { safeEqual } from "./safe-equal";
src/lib/security/cron-auth.ts:65:        if (safeEqual(candidate, secret)) {
src/lib/security/cron-auth.ts:148:    return safeEqual(signature, expected);
src/lib/security/safe-equal.ts:1:import { timingSafeEqual } from "node:crypto";
src/lib/security/safe-equal.ts:3:export function safeEqual(left: string, right: string): boolean {
src/lib/security/safe-equal.ts:11:    const valuesEqual = timingSafeEqual(paddedLeft, paddedRight);
src/lib/security/diagnostics-auth.ts:2:import { safeEqual } from "./safe-equal";
src/lib/security/diagnostics-auth.ts:30:    return safeEqual(providedToken, configuredToken);
src/lib/payments/payment-links.server.ts:432:  return crypto.timingSafeEqual(expected, received);
src/lib/payments/razorpay.ts:162:  return crypto.timingSafeEqual(expected, received);
src/app/api/_handlers/whatsapp/webhook/route.ts:17:import { createHmac, timingSafeEqual } from "node:crypto";
src/app/api/_handlers/whatsapp/webhook/route.ts:18:import { safeEqual } from "@/lib/security/safe-equal";
src/app/api/_handlers/whatsapp/webhook/route.ts:74:    return timingSafeEqual(providedBuffer, expectedBuffer);
src/app/api/_handlers/whatsapp/webhook/route.ts:83:    if (mode === "subscribe" && token && verifyToken && safeEqual(token, verifyToken)) {
src/app/api/_handlers/admin/seed-demo/guards.ts:1:import { safeEqual } from "@/lib/security/safe-equal";
src/app/api/_handlers/admin/seed-demo/guards.ts:18:  return safeEqual(providedSecret?.trim() ?? "", expectedSecret.trim());
src/app/api/_handlers/leads/convert/route.ts:5:import { safeEqual } from "@/lib/security/safe-equal";
src/app/api/_handlers/leads/convert/route.ts:22:  return safeEqual(provided, INTERNAL_API_SECRET);
src/app/api/_handlers/webhooks/whatsapp/route.ts:10:import { createHmac, timingSafeEqual } from "crypto";
src/app/api/_handlers/webhooks/whatsapp/route.ts:13:import { safeEqual } from "@/lib/security/safe-equal";
src/app/api/_handlers/webhooks/whatsapp/route.ts:74:  return timingSafeEqual(providedBuffer, expectedBuffer);
src/app/api/_handlers/webhooks/whatsapp/route.ts:92:    safeEqual(token, verifyToken)
src/app/api/_handlers/webhooks/waha/secret.ts:1:import { safeEqual } from "@/lib/security/safe-equal";
src/app/api/_handlers/webhooks/waha/secret.ts:25:  if (!safeEqual(providedSecret, configuredSecret)) {
src/app/api/_handlers/location/cleanup-expired/route.ts:4:import { createHmac, timingSafeEqual } from "node:crypto";
src/app/api/_handlers/location/cleanup-expired/route.ts:5:import { safeEqual } from "@/lib/security/safe-equal";
src/app/api/_handlers/location/cleanup-expired/route.ts:42:    return timingSafeEqual(sigBuf, expectedBuf);
src/app/api/_handlers/location/cleanup-expired/route.ts:50:        const hasSecret = Boolean(cleanupSecret && secret && safeEqual(secret, cleanupSecret));
```

### Console logging hits (646)
```text
src/env.ts:97:  console.error('❌ Invalid or missing environment variables:\n', parsed.error.flatten().fieldErrors);
src/env.ts:104:  console.warn('⚠️ SKIP_ENV_VALIDATION is enabled for non-production environment.');
src/hooks/useRealtimeUpdates.ts:149:      console.error('[useRealtimeUpdates] metrics refresh failed:', err)
src/hooks/useRealtimeUpdates.ts:234:        console.error('[useRealtimeUpdates] channel cleanup failed:', err)
src/lib/observability/logger.ts:35:        console.error(serialized);
src/lib/observability/logger.ts:40:        console.warn(serialized);
src/lib/observability/logger.ts:44:    console.log(serialized);
src/components/whatsapp/WhatsAppConnectModal.tsx:136:                console.error("Error refreshing WhatsApp QR:", err);
src/components/whatsapp/WhatsAppConnectModal.tsx:171:                console.error("Error polling WhatsApp status:", error);
src/components/admin/ProposalAddOnsManager.tsx:129:      console.error('Error loading add-ons:', error);
src/components/admin/ProposalAddOnsManager.tsx:175:        console.error('Error adding add-on:', error);
src/components/admin/ProposalAddOnsManager.tsx:189:      console.error('Error:', error);
src/components/admin/ProposalAddOnsManager.tsx:206:        console.error('Error removing add-on:', error);
src/components/admin/ProposalAddOnsManager.tsx:218:      console.error('Error:', error);
src/components/admin/ProposalAddOnsManager.tsx:243:        console.error('Error updating add-on:', error);
src/components/admin/ProposalAddOnsManager.tsx:255:      console.error('Error:', error);
src/components/admin/ConvertProposalModal.tsx:63:            console.error("Error converting proposal:", error);
src/components/ShareTripModal.tsx:95:                        console.warn("Trip record creation failed during share");
src/components/payments/RazorpayModal.tsx:213:            console.error('[RazorpayModal] verification failed:', verificationError)
src/components/payments/RazorpayModal.tsx:226:      console.error('[RazorpayModal] checkout launch failed:', checkoutError)
src/components/layout/useNavCounts.ts:61:        console.error("[useNavCounts] Failed to refresh navigation counts", error);
src/components/payments/PaymentLinkButton.tsx:95:      console.error('[PaymentLinkButton] create failed:', error)
src/components/payments/PaymentTracker.tsx:224:                console.error('[PaymentTracker] regenerate failed:', error)
src/components/planner/ApprovalManager.tsx:100:      console.error("Failed to load share status", error);
src/components/planner/PricingManager.tsx:34:                console.error(e);
src/components/CreateTripModal.tsx:104:            console.error("Error fetching clients:", error);
src/components/CreateTripModal.tsx:131:                console.error("Error fetching saved itineraries");
src/components/CreateTripModal.tsx:138:            console.error("Error fetching saved itineraries:", error);
src/components/CreateTripModal.tsx:177:            console.error("Error loading itinerary raw data:", error);
src/components/CreateTripModal.tsx:253:            console.error("AI Generation Error:", error);
src/components/CreateTripModal.tsx:279:            console.error("URL Import Error:", error);
src/components/CreateTripModal.tsx:307:            console.error("PDF Import Error:", error);
src/components/CreateTripModal.tsx:412:            console.error("Error creating trip:", error);
src/components/client/ProposalAddOnsSelector.tsx:87:      console.error('Error loading add-ons:', error);
src/components/client/ProposalAddOnsSelector.tsx:133:        console.error('Error updating add-on:', error);
src/components/client/ProposalAddOnsSelector.tsx:145:      console.error('Error:', error);
src/features/admin/billing/useBillingData.ts:164:      console.error("Error loading billing data:", error);
src/components/pdf/PDFDownloadButton.tsx:61:      console.error('Error generating PDF:', error);
src/components/pdf/ProposalPDFButton.tsx:63:      console.error('Error generating PDF:', error);
src/components/pdf/ProposalPDFButton.tsx:129:      console.error('Error emailing PDF:', error);
src/components/pdf/DownloadPDFButton.tsx:99:      console.error("Failed to generate PDF", error);
src/app/p/[token]/page.tsx:83:        console.error('Invalid proposal payload:', parsed.error.flatten());
src/app/p/[token]/page.tsx:104:      console.error('Error loading proposal:', error);
src/app/p/[token]/page.tsx:173:      console.error('Error toggling activity:', error);
src/app/p/[token]/page.tsx:189:      console.error('Error toggling add-on:', error);
src/app/p/[token]/page.tsx:201:      console.error('Error selecting vehicle:', error);
src/app/p/[token]/page.tsx:236:      console.error('Error submitting comment:', error);
src/app/p/[token]/page.tsx:280:      console.error('Error approving proposal:', error);
src/app/p/[token]/error.tsx:18:        console.error("Public Proposal error:", error);
src/components/ui/map/map-controls.tsx:120:          console.error("Error getting location:", error);
src/components/ui/map/map-core.tsx:192:      console.error("MapLibre map initialization failed:", error);
src/app/share/[token]/error.tsx:18:        console.error("Shared View error:", error);
src/app/marketing/error.tsx:18:        console.error("Marketing error:", error);
src/app/support/error.tsx:18:        console.error("Support error:", error);
src/app/dashboard/error.tsx:18:        console.error("Dashboard segment error:", error);
src/app/settings/error.tsx:18:        console.error("Settings segment error:", error);
src/app/test-db/error.tsx:18:        console.error("Test DB error:", error);
src/app/dashboard/tasks/error.tsx:18:        console.error("Dashboard Tasks error:", error);
src/app/dashboard/schedule/error.tsx:18:        console.error("Dashboard Schedule error:", error);
src/app/error.tsx:18:        console.error("App segment error:", error);
src/app/add-ons/page.tsx:132:      console.error("Error loading data:", error);
src/app/add-ons/page.tsx:216:        console.error("Error saving add-on:", error);
src/app/add-ons/page.tsx:253:      console.error("Error deleting add-on:", error);
src/app/add-ons/page.tsx:282:        console.error("Error toggling active status:", error);
src/app/add-ons/error.tsx:18:        console.error("Add-ons segment error:", error);
src/app/live/[token]/error.tsx:18:        console.error("Live View error:", error);
src/app/social/_components/MediaLibrary.tsx:61:            console.error("Error fetching media:", error);
src/app/social/_components/MediaLibrary.tsx:114:            console.error("Upload error:", error);
src/app/welcome/error.tsx:18:        console.error("Welcome error:", error);
src/app/social/_components/PosterExtractor.tsx:38:            console.error(e);
src/app/design-demo/error.tsx:18:        console.error("Design Demo error:", error);
src/app/settings/team/error.tsx:18:        console.error("Settings Team error:", error);
src/app/pay/[token]/PaymentCheckoutClient.tsx:121:            console.error("[pay] verification failed:", verifyError);
src/app/pay/[token]/PaymentCheckoutClient.tsx:147:      console.error("[pay] checkout failed:", checkoutError);
src/app/pay/[token]/error.tsx:18:        console.error("Payment error:", error);
src/app/api/_handlers/cron/reputation-campaigns/route.ts:81:      console.error("[cron/reputation-campaigns] Partial errors:", allErrors);
src/app/api/_handlers/cron/reputation-campaigns/route.ts:91:    console.error("[cron/reputation-campaigns] Fatal error:", error);
src/app/admin/billing/error.tsx:18:        console.error("Admin Billing error:", error);
src/app/admin/notifications/page.tsx:109:            console.error("Error fetching logs:", error);
src/app/admin/notifications/page.tsx:134:            console.error("Error fetching WhatsApp health:", error);
src/app/admin/notifications/page.tsx:166:            console.error("Error fetching delivery tracking:", error);
src/app/admin/notifications/page.tsx:209:            console.error("Run queue error:", error);
src/app/admin/notifications/page.tsx:235:            console.error("Retry failed queue error:", error);
src/app/admin/notifications/page.tsx:264:            console.error("Schedule followups error:", error);
src/app/admin/notifications/page.tsx:288:            console.error("Cleanup expired shares error:", error);
src/app/admin/notifications/page.tsx:325:            console.error("Normalize driver mapping error:", error);
src/app/admin/notifications/page.tsx:359:            console.error("Retry delivery error:", error);
src/app/api/_handlers/cron/operator-scorecards/route.ts:36:    console.error("[/api/cron/operator-scorecards:POST] failed:", error);
src/app/admin/notifications/error.tsx:18:        console.error("Admin Notifications error:", error);
src/app/admin/pricing/error.tsx:18:        console.error("Admin Pricing error:", error);
src/app/api/_handlers/proposals/create/route.ts:229:    console.error("Error in POST /api/admin/proposals/create:", error);
src/app/admin/page.tsx:210:                    console.error("Marketplace stats fetch failed", marketRes.reason);
src/app/admin/page.tsx:299:                console.error("Critical Dashboard Failure:", error);
src/app/admin/trips/page.tsx:91:            console.error("Critical Deployment Error:", error);
src/app/api/_handlers/proposals/[id]/convert/route.ts:274:            console.error("Auto-create invoice failed (non-fatal):", invoiceErr);
src/app/api/_handlers/proposals/[id]/convert/route.ts:337:        console.error("Convert proposal error:", error);
src/app/bookings/error.tsx:18:        console.error("Bookings segment error:", error);
src/app/admin/trips/[id]/page.tsx:92:            console.error("Error fetching trip:", error);
src/app/admin/trips/[id]/page.tsx:171:            console.error("Geocode error:", error);
src/app/admin/trips/[id]/page.tsx:403:            console.error("Hotel lookup error:", error);
src/app/admin/trips/[id]/page.tsx:475:            console.error("Error saving:", error);
src/app/admin/trips/[id]/page.tsx:528:            console.error("Live location share error:", error);
src/app/admin/trips/[id]/page.tsx:568:            console.error("Revoke live link error:", error);
src/app/admin/trips/[id]/error.tsx:18:        console.error("Admin Trip Detail error:", error);
src/app/api/_handlers/proposals/[id]/pdf/route.ts:240:    console.error('Error in GET /api/proposals/[id]/pdf:', error);
src/app/inbox/page.tsx:114:        console.error('[inbox/broadcast] Failed to load audiences', error);
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:261:    console.error("[proposals] loadOperatorContact error:", err);
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:392:    console.error("[proposals] recalculate price rpc error:", error);
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:404:      console.error("[proposals] update price error:", updateError);
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:433:      console.error("[proposals] buildPublicPayload mark-viewed error:", viewedUpdateError);
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:583:    console.error("[proposals] buildPublicPayload unexpected error:", err);
src/app/inbox/error.tsx:18:        console.error("Inbox segment error:", error);
src/app/api/_handlers/proposals/public/[token]/route.ts:68:    console.error("Error loading public proposal:", error);
src/app/api/_handlers/proposals/public/[token]/route.ts:154:        console.error("[proposals] toggle activity error:", activityError);
src/app/api/_handlers/proposals/public/[token]/route.ts:198:        console.error("[proposals] toggle add-on error:", addOnError);
src/app/api/_handlers/proposals/public/[token]/route.ts:239:        console.error("[proposals] select vehicle error:", vehicleError);
src/app/api/_handlers/proposals/public/[token]/route.ts:283:        console.error("[proposals] insert comment error:", commentError);
src/app/api/_handlers/proposals/public/[token]/route.ts:315:        console.error("[proposals] approve error:", approveError);
src/app/api/_handlers/proposals/public/[token]/route.ts:433:            console.error("[proposals] payment link error:", paymentError);
src/app/api/_handlers/proposals/public/[token]/route.ts:485:        console.error("[proposals] reject error:", rejectError);
src/app/api/_handlers/proposals/public/[token]/route.ts:539:        console.error("[proposals] select tier error:", tierError);
src/app/api/_handlers/proposals/public/[token]/route.ts:552:    console.error("Error processing public proposal action:", error);
src/app/api/_handlers/proposals/bulk/route.ts:100:    console.error("[proposals/bulk] failed:", error);
src/app/drivers/page.tsx:173:                console.error("Error fetching drivers:", error);
src/app/api/_handlers/proposals/send-pdf/route.ts:143:    console.error('Error in POST /api/proposals/send-pdf:', error);
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:49:    console.error("[whatsapp/chatbot-sessions/:id] unexpected error:", error);
src/app/drivers/[id]/error.tsx:18:        console.error("Driver Detail error:", error);
src/app/analytics/templates/error.tsx:18:        console.error("Analytics Templates error:", error);
src/app/drivers/error.tsx:18:        console.error("Drivers segment error:", error);
src/app/analytics/error.tsx:18:        console.error("Analytics segment error:", error);
src/app/api/_handlers/whatsapp/broadcast/route.ts:111:    console.error("[whatsapp/broadcast] failed to load connection:", connectionError);
src/app/api/_handlers/whatsapp/broadcast/route.ts:337:    console.error("[whatsapp/broadcast] failed to load broadcast metadata:", error);
src/app/api/_handlers/whatsapp/broadcast/route.ts:460:    console.error("[whatsapp/broadcast] send failed:", error);
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:156:            console.error("[extract-trip-intent] draft insert failed:", insertError);
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:162:        console.error("[/api/whatsapp/extract-trip-intent:POST] Unhandled error:", error);
src/app/api/whatsapp/proposal-drafts/[id]/route.ts:59:    console.error("[whatsapp/proposal-drafts/:id] unexpected GET error:", error);
src/app/api/whatsapp/proposal-drafts/[id]/route.ts:86:    console.error("[whatsapp/proposal-drafts/:id] unexpected POST error:", error);
src/app/api/_handlers/whatsapp/send/route.ts:38:      console.error("[whatsapp/send] failed to load connection:", connectionError);
src/app/api/_handlers/whatsapp/send/route.ts:112:    console.error("[whatsapp/send] unexpected error:", error);
src/app/admin/internal/marketplace/page.tsx:40:            console.error(error);
src/app/admin/internal/marketplace/page.tsx:64:            console.error(error);
src/app/api/_handlers/whatsapp/connect/route.ts:68:        console.error("[whatsapp/connect] error:", error);
src/app/admin/internal/marketplace/error.tsx:18:        console.error("Admin Marketplace error:", error);
src/app/api/_handlers/whatsapp/disconnect/route.ts:42:            console.error("[whatsapp/disconnect] failed to update connection:", updateError);
src/app/api/_handlers/whatsapp/disconnect/route.ts:48:        console.error("[whatsapp/disconnect] error:", error);
src/app/api/availability/route.ts:47:      console.error("[availability] failed to load blocked dates:", error);
src/app/api/availability/route.ts:62:    console.error("[availability] unexpected GET error:", error);
src/app/api/availability/route.ts:100:      console.error("[availability] failed to create blocked dates:", error);
src/app/api/availability/route.ts:112:    console.error("[availability] unexpected POST error:", error);
src/app/api/availability/route.ts:139:      console.error("[availability] failed to delete blocked dates:", error);
src/app/api/availability/route.ts:145:    console.error("[availability] unexpected DELETE error:", error);
src/app/api/_handlers/whatsapp/conversations/route.ts:164:    console.error("[/api/whatsapp/conversations:GET] Unhandled error:", error);
src/app/api/_handlers/whatsapp/qr/route.ts:35:        console.error("[whatsapp/qr] error:", error);
src/app/admin/cost/error.tsx:18:        console.error("Admin Cost error:", error);
src/app/api/_handlers/whatsapp/status/route.ts:57:        console.error("[whatsapp/status] error:", error);
src/app/trips/[id]/error.tsx:18:        console.error("Trip Detail error:", error);
src/app/admin/referrals/error.tsx:18:        console.error("Admin Referrals error:", error);
src/app/trips/templates/error.tsx:18:        console.error("Trip Templates error:", error);
src/app/admin/planner/error.tsx:18:        console.error("Admin Planner error:", error);
src/app/portal/[token]/page.tsx:118:        console.error('[portal] Failed to load portal data', loadError);
src/app/portal/[token]/page.tsx:157:      console.error('[portal] Failed to submit review', reviewError);
src/app/settings/marketplace/error.tsx:18:        console.error("Settings Marketplace error:", error);
src/app/clients/[id]/page.tsx:57:        console.warn("Admin client unavailable, falling back to server client for client profile");
src/app/clients/[id]/page.tsx:75:            console.warn("Direct profile fetch failed:", profileError.message);
src/app/clients/[id]/page.tsx:85:                console.error("Client lookup also failed:", clientError?.message);
src/app/clients/[id]/page.tsx:113:        console.error("Profile fetch exception:", err);
src/app/clients/[id]/page.tsx:130:        else if (error) console.warn("Trips fetch:", error.message);
src/app/clients/[id]/page.tsx:132:        console.warn("Trips fetch failed:", err);
src/app/clients/[id]/page.tsx:154:        console.warn("Itineraries fetch failed:", err);
src/app/clients/[id]/page.tsx:167:        else if (error) console.warn("Proposals fetch:", error.message);
src/app/clients/[id]/page.tsx:169:        console.warn("Proposals fetch failed:", err);
src/app/clients/[id]/error.tsx:15:        console.error("Client profile error:", error);
src/app/clients/error.tsx:18:        console.error("Clients error:", error);
src/app/map-test/error.tsx:18:        console.error("Map Test error:", error);
src/app/marketplace/analytics/page.tsx:80:            console.error("Error fetching stats:", error);
src/app/admin/trips/[id]/_components/TripHeader.tsx:113:            console.error("Error sending notification:", error);
src/app/marketplace/analytics/error.tsx:18:        console.error("Marketplace Analytics error:", error);
src/app/marketplace/page.tsx:83:            console.error("Error fetching marketplace:", error);
src/app/admin/trips/[id]/clone/error.tsx:18:        console.error("Admin Trip Clone error:", error);
src/app/marketplace/[id]/page.tsx:148:            console.error("Error fetching detail:", error);
src/app/marketplace/[id]/page.tsx:165:                console.error("Failed to record view", err);
src/app/admin/trips/error.tsx:18:        console.error("Admin Trips error:", error);
src/app/social/_components/SocialAnalytics.tsx:82:      console.error("Error fetching stats:", error);
src/app/marketplace/[id]/error.tsx:18:        console.error("Marketplace Detail error:", error);
src/app/marketplace/inquiries/page.tsx:49:            console.error("Error fetching inquiries:", error);
src/app/marketplace/inquiries/page.tsx:72:            console.error("Error marking read:", error);
src/app/marketplace/inquiries/error.tsx:18:        console.error("Marketplace Inquiries error:", error);
src/app/reputation/reviews/error.tsx:18:        console.error("Reviews error:", error);
src/app/reputation/analytics/error.tsx:18:        console.error("Reputation Analytics error:", error);
src/app/api/_handlers/whatsapp/health/route.ts:22:      console.error("[whatsapp/health] failed to load connection:", error);
src/app/api/_handlers/whatsapp/health/route.ts:36:    console.error("[whatsapp/health] unexpected error:", error);
src/app/reputation/campaigns/error.tsx:18:        console.error("Reputation Campaigns error:", error);
src/app/api/_handlers/whatsapp/test-message/route.ts:50:        console.error("[whatsapp/test-message] error:", error);
src/app/reputation/_components/CampaignList.tsx:99:        console.error("Failed to update campaign status:", data.error);
src/app/reputation/_components/CampaignList.tsx:109:      console.error("Error updating campaign status:", error);
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts:38:            console.error("[proposal-drafts/:id] DB error:", error);
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts:65:        console.error("[/api/whatsapp/proposal-drafts/:id:GET] Unhandled error:", error);
src/app/api/_handlers/add-ons/stats/route.ts:68:      console.error('Error fetching sales:', salesError);
src/app/api/_handlers/add-ons/stats/route.ts:133:    console.error('Error in GET /api/add-ons/stats:', error);
src/app/api/_handlers/add-ons/[id]/route.ts:56:    console.error('Error in GET /api/add-ons/[id]:', error);
src/app/api/_handlers/add-ons/[id]/route.ts:120:      console.error('Error updating add-on:', error);
src/app/api/_handlers/add-ons/[id]/route.ts:130:    console.error('Error in PUT /api/add-ons/[id]:', error);
src/app/api/_handlers/add-ons/[id]/route.ts:192:      console.error('Error deleting add-on:', error);
src/app/api/_handlers/add-ons/[id]/route.ts:198:    console.error('Error in DELETE /api/add-ons/[id]:', error);
src/app/api/_handlers/add-ons/route.ts:59:      console.error('Error fetching add-ons:', error);
src/app/api/_handlers/add-ons/route.ts:65:    console.error('Error in GET /api/add-ons:', error);
src/app/api/_handlers/add-ons/route.ts:125:      console.error('Error creating add-on:', error);
src/app/api/_handlers/add-ons/route.ts:131:    console.error('Error in POST /api/add-ons:', error);
src/app/api/_handlers/billing/contact-sales/route.ts:91:      console.error("[billing/contact-sales] failed to load profile:", profileError);
src/app/api/_handlers/billing/contact-sales/route.ts:108:      console.error("[billing/contact-sales] failed to load organization:", orgError);
src/app/api/_handlers/billing/contact-sales/route.ts:136:      console.error("[billing/contact-sales] failed to create lead:", leadError);
src/app/api/_handlers/billing/contact-sales/route.ts:167:    console.error("[billing/contact-sales] unexpected error:", error);
src/app/api/_handlers/admin/reports/operators/route.ts:43:        console.error("[/api/admin/reports/operators:GET] Unhandled error:", error);
src/app/api/_handlers/admin/reports/gst/route.ts:71:      console.error("[reports/gst] DB error:", error);
src/app/api/_handlers/admin/reports/gst/route.ts:98:    console.error("[/api/admin/reports/gst:GET] Unhandled error:", error);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:68:    console.error("[/api/admin/proposals/[id]/tiers:GET] Unhandled error:", error);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:132:      console.error("[/api/admin/proposals/[id]/tiers:PATCH] DB error:", error);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:146:    console.error("[/api/admin/proposals/[id]/tiers:PATCH] Unhandled error:", error);
src/app/api/_handlers/admin/funnel/route.ts:104:    console.error("[/api/admin/funnel:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/trips/route.ts:123:    console.error("[/api/admin/pricing/trips:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/vendor-history/route.ts:45:      console.error("[/api/admin/pricing/vendor-history:GET] DB error:", error);
src/app/api/_handlers/admin/pricing/vendor-history/route.ts:72:    console.error("[/api/admin/pricing/vendor-history:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/transactions/route.ts:168:    console.error("[/api/admin/pricing/transactions:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/dashboard/route.ts:180:    console.error("[/api/admin/pricing/dashboard:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:40:      console.error("[/api/admin/pricing/overheads/[id]:GET] DB error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:49:    console.error("[/api/admin/pricing/overheads/[id]:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:90:      console.error("[/api/admin/pricing/overheads/[id]:PATCH] DB error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:98:    console.error("[/api/admin/pricing/overheads/[id]:PATCH] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:123:      console.error("[/api/admin/pricing/overheads/[id]:DELETE] DB error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:128:    console.error("[/api/admin/pricing/overheads/[id]:DELETE] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/overheads/route.ts:57:      console.error("[/api/admin/pricing/overheads:GET] DB error:", error);
src/app/api/_handlers/admin/pricing/overheads/route.ts:63:    console.error("[/api/admin/pricing/overheads:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/overheads/route.ts:111:      console.error("[/api/admin/pricing/overheads:POST] DB error:", error);
src/app/api/_handlers/admin/pricing/overheads/route.ts:117:    console.error("[/api/admin/pricing/overheads:POST] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:51:    console.error("[/api/admin/pricing/trip-costs/[id]:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:92:      console.error("[/api/admin/pricing/trip-costs/[id]:PATCH] DB error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:100:    console.error("[/api/admin/pricing/trip-costs/[id]:PATCH] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:125:      console.error("[/api/admin/pricing/trip-costs/[id]:DELETE] DB error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:130:    console.error("[/api/admin/pricing/trip-costs/[id]:DELETE] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:49:      console.error("[/api/admin/pricing/trip-costs:GET] DB error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:55:    console.error("[/api/admin/pricing/trip-costs:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:97:      console.error("[/api/admin/pricing/trip-costs:POST] DB error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:103:    console.error("[/api/admin/pricing/trip-costs:POST] Unhandled error:", error);
src/app/api/_handlers/admin/trips/[id]/route.ts:314:        console.error("Error fetching trip details:", error);
src/app/api/_handlers/admin/revenue/route.ts:161:    console.error("[/api/admin/revenue:GET] Unhandled error:", error);
src/app/api/_handlers/admin/generate-embeddings/route.ts:57:      console.error(`Embedding generation completed with ${result.errors.length} errors:`, result.errors);
src/app/api/_handlers/admin/generate-embeddings/route.ts:76:    console.error("Batch embedding generation failed:", error);
src/app/api/_handlers/admin/generate-embeddings/route.ts:124:    console.error("Failed to get embedding stats:", error);
src/app/api/_handlers/admin/social/generate/route.ts:340:    console.error("Error generating social posts:", error);
src/app/api/_handlers/admin/dashboard/stats/route.ts:200:    console.error("[/api/admin/dashboard/stats:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:196:    console.error("Error uploading PDF import:", error);
src/app/api/_handlers/admin/operations/command-center/route.ts:530:    console.error("[/api/admin/operations/command-center:GET] Unhandled error:", error);
src/app/api/_handlers/admin/geocoding/usage/route.ts:90:        console.error("Geocoding usage stats error:", error);
src/app/api/_handlers/admin/seed-demo/route.ts:95:    console.error("[admin/seed-demo] Failed to seed demo organization", error);
src/app/analytics/drill-through/error.tsx:18:        console.error("Analytics Drill-through error:", error);
src/app/admin/revenue/error.tsx:18:        console.error("Admin Revenue error:", error);
src/app/offline/error.tsx:18:        console.error("Offline error:", error);
src/app/portal/[token]/error.tsx:18:        console.error("Client Portal error:", error);
src/app/admin/settings/notifications/error.tsx:18:        console.error("Admin Notification Settings error:", error);
src/app/admin/settings/page.tsx:250:            console.error("Error fetching settings:", error);
src/app/admin/settings/page.tsx:313:            console.error("Error saving settings:", error);
src/app/admin/settings/page.tsx:378:            console.error("Error saving workflow rules:", error);
src/app/admin/settings/error.tsx:18:        console.error("Admin Settings error:", error);
src/app/admin/settings/marketplace/page.tsx:161:            console.error("Error fetching settings:", error);
src/app/admin/settings/marketplace/error.tsx:18:        console.error("Admin Marketplace Settings error:", error);
src/app/admin/insights/error.tsx:18:        console.error("Admin Insights error:", error);
src/app/admin/invoices/error.tsx:18:        console.error("Admin Invoices error:", error);
src/app/admin/security/error.tsx:18:        console.error("Admin Security error:", error);
src/app/admin/support/error.tsx:18:        console.error("Admin Support error:", error);
src/app/admin/tour-templates/create/page.tsx:253:        console.error('Error creating template:', templateError);
src/app/admin/tour-templates/create/page.tsx:276:          console.error('Error creating day:', dayError);
src/app/admin/tour-templates/create/page.tsx:300:            console.error('Error creating activities:', activitiesError);
src/app/admin/tour-templates/create/page.tsx:319:            console.error('Error creating accommodation:', accommodationError);
src/app/admin/tour-templates/create/page.tsx:331:      console.error('Error saving template:', error);
src/app/admin/tour-templates/create/error.tsx:18:        console.error("Admin Tour Template Create error:", error);
src/app/api/_handlers/billing/subscription/route.ts:30:      console.error("[billing/subscription] failed to load profile:", profileError);
src/app/api/_handlers/billing/subscription/route.ts:64:      console.error("[billing/subscription] failed to load organization:", orgError);
src/app/api/_handlers/billing/subscription/route.ts:112:    console.error("[billing/subscription] unexpected error:", error);
src/app/reputation/_components/ReviewInbox.tsx:292:      console.error("Error fetching reviews:", err);
src/app/reputation/_components/ReviewInbox.tsx:321:      console.error("Error flagging review:", err);
src/app/reputation/_components/ReviewInbox.tsx:340:      console.error("Error adding review:", err);
src/app/reputation/_components/ReviewInbox.tsx:395:      console.error("Error generating marketing asset:", error);
src/app/reputation/_components/ReviewInbox.tsx:422:      console.error("Error scheduling marketing asset:", error);
src/app/reputation/nps/[token]/error.tsx:18:        console.error("NPS Survey error:", error);
src/app/api/_handlers/notifications/retry-failed/route.ts:51:            console.error("Error retrying failed notifications:", error);
src/app/api/_handlers/notifications/retry-failed/route.ts:72:        console.error("Error in POST /api/notifications/retry-failed:", error);
src/app/reputation/widget/error.tsx:18:        console.error("Review Widget error:", error);
src/app/reputation/settings/error.tsx:18:        console.error("Reputation Settings error:", error);
src/app/planner/page.tsx:111:            console.error("Error opening itinerary:", err);
src/app/planner/error.tsx:18:        console.error("Planner error:", error);
src/app/planner/ShareItinerary.tsx:53:            console.error(e);
src/app/api/_handlers/notifications/client-landed/route.ts:176:        console.error("Client landed error:", error);
src/app/api/_handlers/currency/route.ts:143:        console.error("Currency API error:", error);
src/app/api/_handlers/trips/[id]/notifications/route.ts:91:    console.error("Trip notifications error:", error);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:69:            console.error("Failed to fetch trip add-ons:", error);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:78:        console.error("Trip add-ons error:", error);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:135:            console.error("Failed to update add-on:", error);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:144:        console.error("Trip add-on update error:", error);
src/app/admin/activity/error.tsx:18:        console.error("Admin Activity error:", error);
src/app/admin/templates/error.tsx:18:        console.error("Admin Templates error:", error);
src/app/planner/SaveItineraryButton.tsx:111:                console.warn("Trip record creation failed (itinerary saved):", tripError.message);
src/app/planner/SaveItineraryButton.tsx:132:            console.error("Save error:", message);
src/app/auth/error.tsx:18:        console.error("Authentication error:", error);
src/app/admin/tour-templates/page.tsx:97:        console.error('Error loading templates:', error);
src/app/admin/tour-templates/page.tsx:132:      console.error('Error loading templates:', error);
src/app/admin/tour-templates/page.tsx:150:        console.error('Error deleting template:', error);
src/app/admin/tour-templates/page.tsx:160:      console.error('Error deleting template:', error);
src/app/admin/tour-templates/page.tsx:182:        console.error('Error cloning template:', error);
src/app/admin/tour-templates/page.tsx:198:      console.error('Error cloning template:', error);
src/app/proposals/create/_hooks/useProposalData.ts:118:        console.error('Error loading clients:', payload);
src/app/proposals/create/_hooks/useProposalData.ts:145:        console.error('Error loading templates:', templatesError);
src/app/proposals/create/_hooks/useProposalData.ts:160:          console.warn('Add-ons failed to load:', await addOnsResp.text().catch(() => ''));
src/app/proposals/create/_hooks/useProposalData.ts:164:        console.warn('Add-ons failed to load:', e);
src/app/proposals/create/_hooks/useProposalData.ts:168:      console.error('Error loading data:', loadError);
src/app/proposals/create/_hooks/useProposalData.ts:202:      console.error('Create client failed:', payload);
src/app/proposals/create/_hooks/useCreateProposal.ts:190:          console.warn('Proposal created but notification failed:', sendPayload?.error || sendPayload);
src/app/proposals/create/_hooks/useCreateProposal.ts:197:      console.error('Error creating proposal:', error);
src/app/admin/tour-templates/import/error.tsx:18:        console.error("Admin Tour Template Import error:", error);
src/app/proposals/create/_hooks/useAvailabilityCheck.ts:64:        console.error('Availability check failed:', fetchError);
src/app/proposals/create/error.tsx:18:        console.error("Proposal Create error:", error);
src/app/admin/tour-templates/[id]/page.tsx:104:        console.error('Error loading template:', templateError);
src/app/admin/tour-templates/[id]/page.tsx:126:        console.error('Error loading days:', daysError);
src/app/admin/tour-templates/[id]/page.tsx:176:      console.error('Error loading template:', error);
src/app/admin/tour-templates/[id]/page.tsx:196:        console.error('Error deleting template:', error);
src/app/admin/tour-templates/[id]/page.tsx:206:      console.error('Error deleting template:', error);
src/app/proposals/[id]/page.tsx:119:      console.error('Error loading comments:', error);
src/app/proposals/[id]/page.tsx:164:      console.error('Error loading stats:', error);
src/app/proposals/[id]/page.tsx:189:        console.error('Error loading proposal:', proposalError);
src/app/proposals/[id]/page.tsx:211:      console.error('Error loading proposal:', error);
src/app/proposals/[id]/page.tsx:225:      console.log('[Admin] Proposal updated via realtime:', payload);
src/app/proposals/[id]/page.tsx:229:      console.log('[Admin] Activity updated via realtime:', payload);
src/app/proposals/[id]/page.tsx:233:      console.log('[Admin] New comment via realtime:', payload);
src/app/proposals/[id]/page.tsx:355:      console.error('Error loading version history:', error);
src/app/(superadmin)/god/analytics/error.tsx:18:        console.error("Superadmin Analytics error:", error);
src/app/admin/kanban/page.tsx:151:            console.error("Kanban data fetch failed:", error);
src/app/admin/kanban/page.tsx:230:            console.error("Stage move failed:", error);
src/app/admin/kanban/page.tsx:262:            console.error("Toggle phase notifications failed:", error);
src/app/admin/kanban/error.tsx:18:        console.error("Admin Kanban error:", error);
src/app/(superadmin)/god/monitoring/error.tsx:18:        console.error("Superadmin Monitoring error:", error);
src/app/api/_handlers/reputation/reviews/[id]/route.ts:53:    console.error("Error fetching reputation review:", error);
src/app/api/_handlers/reputation/reviews/[id]/route.ts:131:    console.error("Error updating reputation review:", error);
src/app/(superadmin)/god/error.tsx:18:        console.error("Superadmin error:", error);
src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route.ts:88:    console.error("Error processing review marketing asset:", error);
src/app/(superadmin)/god/signups/error.tsx:18:        console.error("Superadmin Signups error:", error);
src/app/(superadmin)/god/support/error.tsx:18:        console.error("Superadmin Support error:", error);
src/app/(superadmin)/god/directory/error.tsx:18:        console.error("Superadmin Directory error:", error);
src/app/(superadmin)/god/audit-log/error.tsx:18:        console.error("Superadmin Audit Log error:", error);
src/app/api/_handlers/reputation/reviews/route.ts:143:    console.error("Error fetching reputation reviews:", error);
src/app/api/_handlers/reputation/reviews/route.ts:214:    console.error("Error creating reputation review:", error);
src/app/(superadmin)/god/announcements/error.tsx:18:        console.error("Superadmin Announcements error:", error);
src/app/api/_handlers/reputation/analytics/topics/route.ts:84:    console.error("Error fetching reputation topics:", error);
src/app/(superadmin)/god/referrals/error.tsx:18:        console.error("Superadmin Referrals error:", error);
src/app/api/_handlers/reputation/analytics/trends/route.ts:155:    console.error("Error fetching reputation trends:", error);
src/app/(superadmin)/god/costs/error.tsx:18:        console.error("Superadmin Costs error:", error);
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:82:    console.error("Error fetching reputation snapshot:", error);
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:253:    console.error("Error generating reputation snapshot:", error);
src/app/api/_handlers/reputation/sync/route.ts:343:    console.error("[reputation/sync] sync failed:", error);
src/app/(superadmin)/god/costs/org/[orgId]/error.tsx:18:        console.error("Superadmin Org Costs error:", error);
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:54:    console.error("Error fetching reputation campaign:", error);
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:135:    console.error("Error updating reputation campaign:", error);
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:185:    console.error("Error archiving reputation campaign:", error);
src/app/(superadmin)/god/kill-switch/error.tsx:18:        console.error("Superadmin Kill Switch error:", error);
src/app/global-error.tsx:14:        console.error("Global app error:", error);
src/app/api/_handlers/reputation/campaigns/route.ts:53:    console.error("Error fetching reputation campaigns:", error);
src/app/api/_handlers/reputation/campaigns/route.ts:137:    console.error("Error creating reputation campaign:", error);
src/app/onboarding/error.tsx:18:        console.error("Onboarding error:", error);
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:74:        console.error(
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:147:          console.error(
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:177:            console.error(
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:197:    console.error("Error triggering campaign sends:", error);
src/app/api/_handlers/location/share/route.ts:72:        console.error("Error in GET /api/location/share:", error);
src/app/api/_handlers/location/share/route.ts:136:            console.error("Error creating location share:", error);
src/app/api/_handlers/location/share/route.ts:148:        console.error("Error in POST /api/location/share:", error);
src/app/api/_handlers/location/share/route.ts:202:            console.error("Error revoking location share:", error);
src/app/api/_handlers/location/share/route.ts:222:        console.error("Error in DELETE /api/location/share:", error);
src/app/admin/gst-report/error.tsx:18:        console.error("Admin GST Report error:", error);
src/app/api/_handlers/reputation/ai/analyze/route.ts:208:    console.error("Error analyzing review:", error);
src/app/admin/tour-templates/error.tsx:18:        console.error("Admin Tour Templates error:", error);
src/app/api/_handlers/trips/[id]/invoices/route.ts:91:            console.error("Failed to fetch trip invoices:", error);
src/app/api/_handlers/trips/[id]/invoices/route.ts:162:        console.error("Trip invoices error:", error);
src/app/admin/tour-templates/[id]/edit/page.tsx:100:        console.error('Error loading template:', templateError);
src/app/admin/tour-templates/[id]/edit/page.tsx:134:        console.error('Error loading days:', daysError);
src/app/admin/tour-templates/[id]/edit/page.tsx:190:      console.error('Error loading template:', error);
src/app/admin/tour-templates/[id]/edit/page.tsx:235:        console.error('Error updating template:', templateError);
src/app/admin/tour-templates/[id]/edit/page.tsx:251:        console.error('Error deleting old days:', deleteError);
src/app/admin/tour-templates/[id]/edit/page.tsx:268:          console.error('Error creating day:', dayError);
src/app/admin/tour-templates/[id]/edit/page.tsx:292:            console.error('Error creating activities:', activitiesError);
src/app/admin/tour-templates/[id]/edit/page.tsx:311:            console.error('Error creating accommodation:', accommodationError);
src/app/admin/tour-templates/[id]/edit/page.tsx:323:      console.error('Error saving template:', error);
src/app/api/_handlers/trips/route.ts:375:        console.error("Error fetching trips:", error);
src/app/api/_handlers/itinerary/import/url/route.ts:198:        console.error("URL Import Error:", error);
src/app/admin/tour-templates/[id]/edit/error.tsx:18:        console.error("Admin Tour Template Edit error:", error);
src/app/api/_handlers/calendar/events/route.ts:75:        console.error("[/api/calendar/events:GET] Unhandled error:", error);
src/app/api/_handlers/portal/[token]/route.ts:81:      console.error("[portal/:token] failed to load proposal:", proposalError);
src/app/api/_handlers/portal/[token]/route.ts:139:      console.error("[portal/:token] failed to load client profile:", clientProfileResult.error);
src/app/api/_handlers/portal/[token]/route.ts:144:      console.error("[portal/:token] failed to load organization:", organizationResult.error);
src/app/api/_handlers/portal/[token]/route.ts:149:      console.error("[portal/:token] failed to load trip:", tripResult.error);
src/app/api/_handlers/portal/[token]/route.ts:154:      console.error("[portal/:token] failed to load itinerary days:", daysResult.error);
src/app/api/_handlers/portal/[token]/route.ts:159:      console.error("[portal/:token] failed to load payment links:", paymentLinksResult.error);
src/app/api/_handlers/portal/[token]/route.ts:185:      console.error("[portal/:token] failed to load activities:", activities.error);
src/app/api/_handlers/portal/[token]/route.ts:190:      console.error("[portal/:token] failed to load accommodations:", accommodations.error);
src/app/api/_handlers/portal/[token]/route.ts:359:    console.error("[portal/:token] unexpected error:", error);
src/app/api/_handlers/payments/razorpay/route.ts:35:    console.error("[/api/payments/razorpay:POST] Unhandled error:", error);
src/app/api/_handlers/payments/razorpay/route.ts:63:    console.error("[/api/payments/razorpay:GET] Unhandled error:", error);
src/app/admin/tour-templates/[id]/error.tsx:18:        console.error("Admin Tour Template error:", error);
src/app/api/_handlers/location/ping/route.ts:120:            console.error("Location ping insert error:", insertError);
src/app/api/_handlers/location/cleanup-expired/route.ts:67:            console.error("Error cleaning up expired locations:", error);
src/app/api/_handlers/location/cleanup-expired/route.ts:88:        console.error("Error in POST /api/location/cleanup-expired:", error);
src/app/api/_handlers/auth/password-login/route.ts:99:    console.error("[/api/auth/password-login:POST] Unhandled error:", error);
src/app/api/_handlers/images/unsplash/route.ts:56:            console.error("Unsplash API error:", response.status);
src/app/api/_handlers/images/unsplash/route.ts:86:        console.error("Unsplash fetch error:", error);
src/app/proposals/[id]/error.tsx:18:        console.error("Proposal Detail error:", error);
src/app/api/_handlers/images/route.ts:25:    console.error("[/api/images:GET] Unhandled error:", error);
src/app/api/_handlers/images/pexels/route.ts:36:            console.error("Pexels API error:", response.status);
src/app/api/_handlers/images/pexels/route.ts:50:        console.error("Pexels fetch error:", error);
src/app/api/_handlers/invoices/send-pdf/route.ts:114:    console.error("Error in POST /api/invoices/send-pdf:", error);
src/app/api/_handlers/reputation/ai/respond/route.ts:303:    console.error("Error generating AI response:", error);
src/app/admin/operations/error.tsx:18:        console.error("Admin Operations error:", error);
src/app/api/_handlers/payments/create-order/route.ts:124:    console.error('Error in POST /api/payments/create-order:', error);
src/app/api/_handlers/itinerary/import/pdf/route.ts:126:        console.error("PDF Import Error:", error);
src/app/api/_handlers/images/pixabay/route.ts:32:            console.error("Pixabay API error:", response.status);
src/app/api/_handlers/images/pixabay/route.ts:46:        console.error("Pixabay fetch error:", error);
src/app/api/_handlers/bookings/[id]/invoice/route.ts:115:    console.error("[/api/bookings/[id]/invoice:GET] Unhandled error:", error);
src/app/api/_handlers/invoices/route.ts:54:      console.error("Failed to list invoices:", error);
src/app/api/_handlers/invoices/route.ts:80:    console.error("[/api/invoices:GET] Unhandled error:", error);
src/app/api/_handlers/invoices/route.ts:199:      console.error("Failed to create invoice:", insertError);
src/app/api/_handlers/invoices/route.ts:222:    console.error("[/api/invoices:POST] Unhandled error:", error);
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:225:        console.error(`Error analyzing review ${review.id}:`, reviewError);
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:233:    console.error("Error in batch analyze:", error);
src/app/api/_handlers/invoices/[id]/route.ts:69:      console.error("Failed to fetch invoice:", error);
src/app/api/_handlers/invoices/[id]/route.ts:82:      console.error("Failed to fetch invoice payments:", paymentsError);
src/app/api/_handlers/invoices/[id]/route.ts:100:    console.error("[/api/invoices/[id]:GET] Unhandled error:", error);
src/app/api/_handlers/invoices/[id]/route.ts:120:      console.error("Failed to fetch invoice for update:", error);
src/app/api/_handlers/invoices/[id]/route.ts:208:      console.error("Failed to update invoice:", updateError);
src/app/api/_handlers/invoices/[id]/route.ts:224:    console.error("[/api/invoices/[id]:PUT] Unhandled error:", error);
src/app/api/_handlers/invoices/[id]/route.ts:245:      console.error("Failed to fetch invoice for delete:", error);
src/app/api/_handlers/invoices/[id]/route.ts:261:      console.error("Failed to delete invoice:", deleteError);
src/app/api/_handlers/invoices/[id]/route.ts:267:    console.error("[/api/invoices/[id]:DELETE] Unhandled error:", error);
src/app/api/_handlers/itinerary/generate/route.ts:62:    console.warn("Ratelimit initialization failed (likely build step)");
src/app/api/_handlers/itinerary/generate/route.ts:118:        console.error('Geocoding failed for fallback, using default coords:', err);
src/app/api/_handlers/itinerary/generate/route.ts:214:        console.error('Geocoding error (non-blocking):', error);
src/app/api/_handlers/itinerary/generate/route.ts:351:            console.warn("Redis fallback missed / connection issue");
src/app/api/_handlers/itinerary/generate/route.ts:365:            console.error('[TIER 0.75: SHARED CACHE ERROR]', e);
src/app/api/_handlers/itinerary/generate/route.ts:385:            console.error('[TIER 0.5: SEMANTIC CACHE ERROR]', e);
src/app/api/_handlers/itinerary/generate/route.ts:426:                                console.error('Attribution tracking failed (non-blocking):', err);
src/app/api/_handlers/itinerary/generate/route.ts:453:            console.error('[TIER 2: RAG ERROR] RAG system error (non-blocking):', ragError);
src/app/api/_handlers/itinerary/generate/route.ts:463:            console.warn('⚠️ No AI keys configured (GOOGLE_API_KEY / GROQ_API_KEY). Returning fallback itinerary.');
src/app/api/_handlers/itinerary/generate/route.ts:592:                    console.error(`❌ [GROQ] Failed:`, groqError);
src/app/api/_handlers/itinerary/generate/route.ts:616:                console.warn('⚠️ All AI providers failed or unavailable — using fallback itinerary.');
src/app/api/_handlers/itinerary/generate/route.ts:620:            console.error("AI Generation Error (outer catch):", innerError);
src/app/api/_handlers/itinerary/generate/route.ts:697:                    console.error("Failed to memorize to Redis");
src/app/api/_handlers/itinerary/generate/route.ts:710:                console.error('Cache save failed (non-blocking):', err);
src/app/api/_handlers/itinerary/generate/route.ts:730:                .catch(e => console.error(e));
src/app/api/_handlers/itinerary/generate/route.ts:747:        console.error("AI Generation Error:", error);
src/app/api/_handlers/invoices/[id]/pay/route.ts:41:      console.error("Failed to fetch invoice for payment:", invoiceError);
src/app/api/_handlers/invoices/[id]/pay/route.ts:88:      console.error("Failed to record invoice payment:", paymentError);
src/app/api/_handlers/invoices/[id]/pay/route.ts:126:      console.error("Failed to update invoice after payment:", invoiceUpdateError);
src/app/api/_handlers/invoices/[id]/pay/route.ts:138:      console.error("Failed to fetch invoice payments:", paymentsError);
src/app/api/_handlers/invoices/[id]/pay/route.ts:152:    console.error("[/api/invoices/[id]/pay:POST] Unhandled error:", error);
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:91:    console.error("[/api/admin/reputation/client-referrals:GET] Unhandled error:", error);
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:156:    console.error("[/api/admin/reputation/client-referrals:POST] Unhandled error:", error);
src/app/api/_handlers/reputation/connections/route.ts:46:    console.error("Error fetching platform connections:", error);
src/app/api/_handlers/reputation/connections/route.ts:129:    console.error("Error creating platform connection:", error);
src/app/api/_handlers/reputation/connections/route.ts:175:    console.error("Error deleting platform connection:", error);
src/app/api/_handlers/reputation/widget/[token]/route.ts:163:    console.error("Error fetching widget data:", error);
src/app/api/_handlers/reputation/dashboard/route.ts:147:    console.error("Error fetching reputation dashboard:", error);
src/app/api/_handlers/reputation/brand-voice/route.ts:98:    console.error("Error fetching brand voice:", error);
src/app/api/_handlers/reputation/brand-voice/route.ts:259:    console.error("Error updating brand voice:", error);
src/app/api/_handlers/reputation/widget/config/route.ts:56:    console.error("Error fetching widgets:", error);
src/app/api/_handlers/reputation/widget/config/route.ts:143:    console.error("Error creating widget:", error);
src/app/api/_handlers/reputation/widget/config/route.ts:264:    console.error("Error updating widget:", error);
src/app/api/_handlers/reputation/nps/submit/route.ts:122:      }).catch((err) => console.error("[nps/submit] promoter followup failed:", err));
src/app/api/_handlers/reputation/nps/submit/route.ts:131:    console.error("Error submitting NPS score:", error);
src/app/api/_handlers/reputation/nps/[token]/route.ts:103:    console.error("Error loading NPS form data:", error);
src/app/api/_handlers/admin/insights/ai-usage/route.ts:103:    console.error("[/api/admin/insights/ai-usage:GET] Unhandled error:", error);
src/app/api/_handlers/admin/ltv/route.ts:70:    console.error("[/api/admin/ltv:GET] Unhandled error:", error);
src/app/api/_handlers/admin/insights/win-loss/route.ts:113:    console.error("[/api/admin/insights/win-loss:GET] Unhandled error:", error);
src/app/api/_handlers/admin/cache-metrics/route.ts:33:    console.error("[/api/admin/cache-metrics:GET] Unhandled error:", error);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:46:    console.error("[/api/admin/insights/batch-jobs:GET] Unhandled error:", error);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:111:    console.error("[/api/admin/insights/batch-jobs:POST] Unhandled error:", error);
src/app/api/_handlers/admin/destinations/route.ts:66:    console.error("[/api/admin/destinations:GET] Unhandled error:", error);
src/app/api/_handlers/admin/insights/auto-requote/route.ts:101:    console.error("[/api/admin/insights/auto-requote:GET] Unhandled error:", error);
src/app/api/_handlers/admin/insights/best-quote/route.ts:188:    console.error("[/api/admin/insights/best-quote:POST] Unhandled error:", error);
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:215:    console.error("[/api/admin/insights/ops-copilot:GET] Unhandled error:", error);
src/app/api/_handlers/admin/leads/[id]/route.ts:132:    console.error("[admin/leads/:id] PATCH error:", updateError);
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts:82:        console.error("[superadmin/analytics/feature-usage]", err);
src/app/api/_handlers/admin/leads/route.ts:73:    console.error("[admin/leads] GET error:", error);
src/app/api/_handlers/admin/leads/route.ts:155:    console.error("[admin/leads] POST error:", error);
src/app/api/_handlers/admin/insights/proposal-risk/route.ts:120:    console.error("[/api/admin/insights/proposal-risk:GET] Unhandled error:", error);
src/app/api/_handlers/webhooks/whatsapp/route.ts:110:    console.error("[WhatsApp webhook] failed to read request body:", err);
src/app/api/_handlers/webhooks/whatsapp/route.ts:119:    console.error("[WhatsApp webhook] WHATSAPP_APP_SECRET not configured");
src/app/api/_handlers/webhooks/whatsapp/route.ts:123:    console.error("[WhatsApp webhook] Missing X-Hub-Signature-256 header");
src/app/api/_handlers/webhooks/whatsapp/route.ts:127:    console.error("[WhatsApp webhook] HMAC signature mismatch");
src/app/api/_handlers/webhooks/whatsapp/route.ts:136:    console.error("[WhatsApp webhook] failed to parse JSON body:", err);
src/app/api/_handlers/webhooks/whatsapp/route.ts:164:              console.error(
src/app/api/_handlers/support/route.ts:66:            console.error("Error creating ticket:", error);
src/app/api/_handlers/support/route.ts:72:        console.error("Support ticket creation error:", error);
src/app/api/_handlers/support/route.ts:104:            console.error("Error fetching tickets:", error);
src/app/api/_handlers/support/route.ts:110:        console.error("Support ticket fetch error:", error);
src/app/api/_handlers/admin/insights/daily-brief/route.ts:100:    console.error("[/api/admin/insights/daily-brief:GET] Unhandled error:", error);
src/app/api/_handlers/superadmin/audit-log/route.ts:51:        console.error("[superadmin/audit-log]", err);
src/app/api/_handlers/admin/insights/margin-leak/route.ts:117:    console.error("[/api/admin/insights/margin-leak:GET] Unhandled error:", error);
src/app/api/_handlers/payments/links/route.ts:104:    console.error("[payments/links] create failed:", error);
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:206:    console.error("[/api/admin/insights/upsell-recommendations:GET] Unhandled error:", error);
src/app/api/_handlers/payments/links/[token]/route.ts:55:    console.error("[payments/links/:token] load failed:", error);
src/app/api/_handlers/payments/links/[token]/route.ts:111:    console.error("[payments/links/:token] event failed:", error);
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:131:    console.error("[/api/admin/insights/smart-upsell-timing:GET] Unhandled error:", error);
src/app/api/_handlers/payments/verify/route.ts:95:    console.error("[payments/verify] verification failed:", error);
src/app/api/_handlers/admin/insights/action-queue/route.ts:98:    console.error("[/api/admin/insights/action-queue:GET] Unhandled error:", error);
src/app/api/_handlers/social/refresh-tokens/route.ts:98:                console.error(`Error refreshing token for connection ${conn.id}:`, err);
src/app/api/_handlers/social/refresh-tokens/route.ts:110:        console.error("Error refreshing social tokens:", error);
src/app/api/_handlers/social/oauth/linkedin/route.ts:38:        console.error('Error initiating LinkedIn OAuth:', error);
src/app/api/_handlers/leads/convert/route.ts:42:    console.error("[leads/convert] INTERNAL_API_SECRET is not configured; endpoint is disabled");
src/app/api/_handlers/leads/convert/route.ts:157:    console.error("[leads/convert] insert error:", error);
src/app/api/_handlers/social/oauth/callback/route.ts:63:        console.error('FB token error:', await tokenRes.text());
src/app/api/_handlers/social/oauth/callback/route.ts:90:        console.error('Failed to fetch Facebook pages:', await pagesRes.text());
src/app/api/_handlers/social/oauth/callback/route.ts:160:        console.error('Google code exchange error:', err);
src/app/api/_handlers/social/oauth/callback/route.ts:172:        console.error('Google user info error:', err);
src/app/api/_handlers/social/oauth/callback/route.ts:214:        console.error('LinkedIn code exchange error:', err);
src/app/api/_handlers/social/oauth/callback/route.ts:226:        console.error('LinkedIn profile fetch error:', err);
src/app/api/_handlers/social/oauth/callback/route.ts:283:        console.error('Callback error:', error);
src/app/api/_handlers/superadmin/users/[id]/route.ts:69:        console.error("[superadmin/users/:id]", err);
src/app/api/_handlers/social/oauth/facebook/route.ts:31:        console.error('Error initiating Facebook OAuth:', error);
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:115:        console.error(`[superadmin/announcements/${id}/send]`, err);
src/app/api/_handlers/social/oauth/google/route.ts:46:        console.error('Error initiating Google OAuth:', error);
src/app/api/_handlers/settings/team/[id]/resend/route.ts:36:      console.error("[settings/team/:id/resend] failed to load member:", targetError);
src/app/api/_handlers/settings/team/[id]/resend/route.ts:71:      console.error("[settings/team/:id/resend] inviteUserByEmail failed:", inviteResponse.error);
src/app/api/_handlers/settings/team/[id]/resend/route.ts:85:    console.error("[settings/team/:id/resend] unexpected error:", error);
src/app/api/_handlers/superadmin/announcements/[id]/route.ts:69:        console.error(`[superadmin/announcements/${id} PATCH]`, err);
src/app/api/_handlers/social/posts/[id]/render/route.ts:68:        console.error("Render upload error:", error);
src/app/api/_handlers/superadmin/announcements/route.ts:53:        console.error("[superadmin/announcements GET]", err);
src/app/api/_handlers/superadmin/announcements/route.ts:105:        console.error("[superadmin/announcements POST]", err);
src/app/api/_handlers/social/posts/route.ts:52:        console.error("Error fetching social posts:", error);
src/app/api/_handlers/social/posts/route.ts:111:        console.error("Error creating social post:", error);
src/app/api/_handlers/superadmin/cost/trends/route.ts:93:        console.error("[superadmin/cost/trends]", err);
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:134:        console.error("[superadmin/cost/aggregate]", err);
src/app/api/_handlers/social/schedule/route.ts:77:    console.error("Error scheduling social post for review:", error);
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:125:        console.error(`[superadmin/cost/org/${orgId}]`, err);
src/app/api/_handlers/superadmin/referrals/overview/route.ts:137:        console.error("[superadmin/referrals/overview]", err);
src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts:140:        console.error(`[superadmin/referrals/detail/${type}]`, err);
src/app/api/_handlers/superadmin/settings/route.ts:29:        console.error("[superadmin/settings]", err);
src/app/api/_handlers/superadmin/settings/org-suspend/route.ts:56:        console.error("[superadmin/settings/org-suspend]", err);
src/app/api/_handlers/social/captions/route.ts:112:    console.error("Caption Error:", error);
src/app/api/_handlers/superadmin/users/signups/route.ts:100:        console.error("[superadmin/users/signups]", err);
src/app/api/_handlers/nav/counts/route.ts:66:      console.warn("[nav/counts] inboxUnread error (non-fatal):", inboxUnreadResult.error.message);
src/app/api/_handlers/nav/counts/route.ts:117:    console.error("[/api/nav/counts:GET] Unhandled error:", error);
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts:99:        console.error(`[superadmin/analytics/feature-usage/${feature}]`, err);
src/app/api/_handlers/superadmin/settings/kill-switch/route.ts:46:        console.error("[superadmin/settings/kill-switch]", err);
src/app/api/_handlers/settings/team/[id]/route.ts:47:      console.error("[settings/team/:id] failed to load member:", targetError);
src/app/api/_handlers/settings/team/[id]/route.ts:79:      console.error("[settings/team/:id] failed to update role:", updateError);
src/app/api/_handlers/settings/team/[id]/route.ts:85:    console.error("[settings/team/:id] unexpected patch error:", error);
src/app/api/_handlers/settings/team/[id]/route.ts:114:      console.error("[settings/team/:id] failed to load removable member:", targetError);
src/app/api/_handlers/settings/team/[id]/route.ts:146:      console.error("[settings/team/:id] failed to remove member:", removeError);
src/app/api/_handlers/settings/team/[id]/route.ts:152:    console.error("[settings/team/:id] unexpected delete error:", error);
src/app/api/_handlers/superadmin/overview/route.ts:81:        console.error("[superadmin/overview]", err);
src/app/api/_handlers/webhooks/waha/route.ts:71:            console.error("[webhooks/waha] WPPCONNECT_WEBHOOK_SECRET not configured");
src/app/api/_handlers/webhooks/waha/route.ts:73:            console.warn("[webhooks/waha] Invalid or missing webhook secret");
src/app/api/_handlers/webhooks/waha/route.ts:189:            console.error("[webhooks/waha] failed to resolve whatsapp profile:", error);
src/app/api/_handlers/webhooks/waha/route.ts:199:                    console.error("[webhooks/waha] message processing error:", err);
src/app/api/_handlers/webhooks/waha/route.ts:206:            console.error("[webhooks/waha] failed to resolve chatbot flag:", error);
src/app/api/_handlers/webhooks/waha/route.ts:216:                console.error("[webhooks/waha] failed to inspect recent human reply:", error);
src/app/api/_handlers/webhooks/waha/route.ts:230:            console.error("[webhooks/waha] chatbot processing error:", error);
src/app/api/_handlers/webhooks/waha/route.ts:246:            console.error("[webhooks/waha] failed to send chatbot reply:", error);
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:61:        console.error("[superadmin/monitoring/queues]", err);
src/app/api/_handlers/superadmin/users/directory/route.ts:66:        console.error("[superadmin/users/directory]", err);
src/app/api/_handlers/superadmin/monitoring/health/route.ts:113:        console.error("[superadmin/monitoring/health]", err);
src/app/api/_handlers/social/render-poster/route.ts:101:    console.error("[render-poster] Error:", err);
src/app/api/_handlers/dashboard/tasks/route.ts:346:        console.error("Dashboard tasks error:", error);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:166:    console.error("[marketplace/listing-subscription] load failed:", error);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:244:    console.error("[marketplace/listing-subscription] create failed:", error);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:297:    console.error("[marketplace/listing-subscription] cancel failed:", error);
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:63:            console.error("Failed to dismiss task:", error);
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:69:        console.error("Task dismiss error:", error);
src/app/api/_handlers/superadmin/me/route.ts:14:    console.error("[/api/superadmin/me:GET] Unhandled error:", error);
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:206:    console.error("[marketplace/listing-subscription/verify] failed:", error);
src/app/api/_handlers/social/reviews/import/route.ts:83:        console.error('Error importing reviews:', error);
src/app/api/_handlers/dashboard/schedule/route.ts:134:            console.error("Schedule query error:", error);
src/app/api/_handlers/dashboard/schedule/route.ts:192:        console.error("Dashboard schedule error:", error);
src/app/api/_handlers/integrations/tripadvisor/route.ts:67:        console.error('TripAdvisor connect error:', error);
src/app/api/_handlers/integrations/tripadvisor/route.ts:110:        console.error('TripAdvisor reviews fetch error:', error);
src/app/api/_handlers/unsplash/route.ts:13:    console.error("[/api/unsplash:GET] Unhandled error:", error);
src/app/api/_handlers/integrations/places/route.ts:149:    console.error("Google Places status check error:", error);
src/app/api/_handlers/integrations/places/route.ts:196:    console.error("Google Places activation error:", error);
src/app/api/_handlers/test-geocoding/route.ts:33:        console.error("Geocoding test error:", error);
src/app/api/_handlers/itineraries/[id]/route.ts:35:            console.error("Error fetching itinerary:", error);
src/app/api/_handlers/itineraries/[id]/route.ts:45:        console.error("Internal Error fetching itinerary:", error);
src/app/api/_handlers/itineraries/[id]/route.ts:96:            console.error("Error updating itinerary:", error);
src/app/api/_handlers/itineraries/[id]/route.ts:102:        console.error("Internal Error updating itinerary:", error);
src/app/api/_handlers/settings/marketplace/route.ts:103:      console.error("[settings/marketplace] failed to load organization:", organizationError);
src/app/api/_handlers/settings/marketplace/route.ts:108:      console.error("[settings/marketplace] failed to load marketplace profile:", marketplaceError);
src/app/api/_handlers/settings/marketplace/route.ts:123:    console.error("[settings/marketplace] unexpected error:", error);
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:194:            console.error("Error updating feedback:", updateError);
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:200:        console.error("Internal error in feedback endpoint:", error);
src/app/api/_handlers/settings/upi/route.ts:38:            console.error('UPI upsert error:', upsertError);
src/app/api/_handlers/settings/upi/route.ts:44:        console.error('UPI save error:', error);
src/app/api/_handlers/settings/upi/route.ts:65:        console.error('UPI load error:', error);
src/app/api/_handlers/itineraries/route.ts:34:      console.error("Itinerary fetch error, retrying with core columns:", error.message);
src/app/api/_handlers/assistant/export/route.ts:53:    console.error("Export error:", error);
src/app/api/_handlers/superadmin/support/tickets/[id]/respond/route.ts:64:        console.error(`[superadmin/support/tickets/${id}/respond]`, err);
src/app/api/_handlers/social/extract/route.ts:95:    console.error("Extraction Error:", error);
src/app/api/_handlers/emails/welcome/route.ts:67:        console.error("Welcome email error:", error);
src/app/api/_handlers/superadmin/support/tickets/[id]/route.ts:93:        console.error(`[superadmin/support/tickets/${id}]`, err);
src/app/api/_handlers/social/reviews/route.ts:42:        console.error('Error fetching social reviews:', error);
src/app/api/_handlers/social/reviews/route.ts:89:        console.error('Error creating manual review:', error);
src/app/api/_handlers/social/publish/route.ts:73:    console.error("Error submitting social post for review:", error);
src/app/api/_handlers/superadmin/support/tickets/route.ts:99:        console.error("[superadmin/support/tickets]", err);
src/app/api/_handlers/subscriptions/route.ts:129:    console.error('Error in GET /api/subscriptions:', error);
src/app/api/_handlers/subscriptions/route.ts:213:    console.error('Error in POST /api/subscriptions:', error);
src/app/api/_handlers/social/smart-poster/route.ts:68:      console.warn(
src/app/api/_handlers/social/smart-poster/route.ts:105:      console.warn("[smart-poster] FAL.ai background generation failed:", err);
src/app/api/_handlers/social/smart-poster/route.ts:150:    console.error("[smart-poster] Error:", err);
src/app/api/_handlers/social/connections/route.ts:33:        console.error('Error fetching social connections:', error);
src/app/api/_handlers/social/connections/[id]/route.ts:53:        console.error('Error deleting social connection:', error);
src/app/api/_handlers/social/process-queue/route.ts:144:                console.error(`Failed to publish item ${item.id}:`, err);
src/app/api/_handlers/social/process-queue/route.ts:198:        console.error("Error processing social queue:", error);
src/app/api/_handlers/social/ai-image/route.ts:89:        console.error("[ai-image] FAL generation error:", err);
src/app/api/_handlers/social/ai-image/route.ts:158:        console.error(`[ai-${mode}] Error:`, err);
src/app/api/_handlers/subscriptions/cancel/route.ts:69:    console.error('Error in POST /api/subscriptions/cancel:', error);
src/app/api/_handlers/social/ai-poster/route.ts:44:            console.error("[ai-poster] GOOGLE_API_KEY not configured");
src/app/api/_handlers/social/ai-poster/route.ts:73:        console.error("[ai-poster] Error:", error);
src/app/api/_handlers/assistant/confirm/route.ts:134:    console.error("Assistant confirm error:", error);
src/app/api/_handlers/ai/suggest-reply/route.ts:81:    console.error("[ai/suggest-reply] unexpected error:", error);
src/app/api/_handlers/assistant/chat/route.ts:95:    console.error("Assistant chat error:", error);
src/app/api/_handlers/ai/pricing-suggestion/route.ts:187:    console.error("[ai/pricing-suggestion] unexpected error:", error);
src/app/api/_handlers/assistant/chat/stream/route.ts:687:    console.error("Assistant stream error:", error);
src/app/api/_handlers/weather/route.ts:99:        console.error("Weather API error:", error);
src/app/api/_handlers/ai/draft-review-response/route.ts:53:    console.error("[ai/draft-review-response] unexpected error:", error);
src/app/api/_handlers/settings/team/shared.ts:199:    console.error("[settings/team] failed to load actor profile:", profileError);
src/app/api/_handlers/settings/team/shared.ts:221:    console.error("[settings/team] failed to load organization:", organizationError);
src/app/api/_handlers/assistant/conversations/[sessionId]/route.ts:66:    console.error("Conversation detail error:", error);
src/app/api/_handlers/settings/team/invite/route.ts:56:      console.error("[settings/team/invite] failed to check existing profile:", existingProfileError);
src/app/api/_handlers/settings/team/invite/route.ts:81:        console.error("[settings/team/invite] inviteUserByEmail failed:", inviteResponse.error);
src/app/api/_handlers/settings/team/invite/route.ts:115:      console.error("[settings/team/invite] failed to upsert invited profile:", upsertError);
src/app/api/_handlers/settings/team/invite/route.ts:129:    console.error("[settings/team/invite] unexpected error:", error);
src/app/api/_handlers/assistant/usage/route.ts:48:    console.error("Assistant usage endpoint error:", error);
src/app/api/_handlers/settings/team/route.ts:22:    console.error("[settings/team] failed to load members:", error);
src/app/api/_handlers/assistant/quick-prompts/route.ts:88:      console.error("Quick prompts read error:", error);
src/app/api/_handlers/assistant/quick-prompts/route.ts:97:    console.error("Quick prompts GET error:", error);
src/app/api/_handlers/assistant/quick-prompts/route.ts:135:      console.error("Quick prompts write error:", error);
src/app/api/_handlers/assistant/quick-prompts/route.ts:141:    console.error("Quick prompts POST error:", error);
src/app/api/_handlers/social/reviews/public/route.ts:222:                console.error("Failed to auto-generate post for review:", postError);
src/app/api/_handlers/social/reviews/public/route.ts:229:        console.error("Error submitting public review:", error);
src/app/api/_handlers/subscriptions/limits/route.ts:47:    console.error("Error in GET /api/subscriptions/limits:", error);
src/app/api/_handlers/assistant/conversations/route.ts:80:    console.error("Conversations list error:", error);
src/app/api/_handlers/assistant/conversations/route.ts:110:    console.error("Conversation delete error:", error);
src/app/api/_handlers/settings/integrations/route.ts:52:        console.error("[/api/settings/integrations:GET] Unhandled error:", error);
```

### All `fetch(...)` hits (313)
```text
src/features/admin/billing/useBillingData.ts:87:        fetch("/api/subscriptions"),
src/features/admin/billing/useBillingData.ts:88:        fetch("/api/invoices?limit=10"),
src/features/admin/billing/useBillingData.ts:89:        fetch("/api/subscriptions/limits"),
src/features/admin/billing/useBillingData.ts:142:            const usageRes = await fetch("/api/admin/insights/ai-usage", {
src/features/admin/billing/useBillingData.ts:197:        const response = await fetch("/api/subscriptions", {
src/features/admin/billing/useBillingData.ts:235:      const response = await fetch("/api/subscriptions/cancel", {
src/lib/geocoding.ts:83:        const response = await fetch(url);
src/features/calendar/useCalendarAvailability.ts:30:      const response = await fetch(`/api/availability?${params.toString()}`, {
src/lib/pwa/offline-mutations.ts:259:      const response = await fetch(record.url, {
src/features/admin/pricing/components/TransactionDetailPanel.tsx:59:      const res = await fetch(`/api/admin/pricing/trip-costs/${t.id}`, { method: "DELETE" });
src/features/admin/pricing/components/TripCostEditor.tsx:36:      fetch(`/api/admin/pricing/trip-costs/${costId}`)
src/features/admin/pricing/components/TripCostEditor.tsx:92:      const res = await fetch(url, {
src/lib/embeddings-v2.ts:50:    const response = await fetch(
src/lib/external/wikimedia.ts:23:        const res = await fetch(searchUrl);
src/lib/external/linkedin.server.ts:39:    const res = await fetch(LINKEDIN_TOKEN_URL, {
src/lib/external/linkedin.server.ts:55:        fetch(`${LINKEDIN_API_BASE}/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`, {
src/lib/external/linkedin.server.ts:58:        fetch(`${LINKEDIN_API_BASE}/emailAddress?q=members&projection=(elements*(handle~))`, {
src/lib/queries/itineraries.ts:27:            const response = await fetch("/api/itineraries", {
src/lib/queries/itineraries.ts:50:            const response = await fetch(`/api/itineraries/${id}`, {
src/lib/queries/itineraries.ts:117:            const response = await fetch(`/api/itineraries/${itineraryId}/feedback`, {
src/lib/queries/referrals.ts:31:            const res = await fetch("/api/admin/referrals");
src/lib/queries/referrals.ts:46:            const res = await fetch("/api/admin/referrals", {
src/lib/queries/support.ts:10:            const res = await fetch("/api/support");
src/lib/queries/support.ts:32:            const res = await fetch("/api/support", {
src/lib/queries/dashboard.ts:83:      const response = await fetch("/api/admin/dashboard/stats", {
src/lib/external/tripadvisor.server.ts:32:    const res = await fetch(url, {
src/lib/external/tripadvisor.server.ts:50:    const res = await fetch(url, {
src/lib/import/url-scraper.ts:24:    const response = await fetch(url, {
src/lib/marketplace-options.ts:209:    const response = await fetch("/api/marketplace/options", {
src/app/p/[token]/page.tsx:70:      const response = await fetch(`/api/proposals/public/${shareToken}`, {
src/app/p/[token]/page.tsx:116:    const response = await fetch(`/api/proposals/public/${shareToken}`, {
src/app/share/[token]/ShareTemplateRenderer.tsx:46:            await fetch(`/api/share/${token}`, {
src/features/calendar/BlockDatesModal.tsx:65:      const response = await fetch("/api/availability", {
src/features/calendar/BlockDatesModal.tsx:103:      const response = await fetch(`/api/availability?id=${id}`, {
src/features/calendar/useCalendarActions.ts:125:      const response = await fetch(`/api/invoices/${id}/send`, {
src/features/calendar/useCalendarActions.ts:192:      const response = await fetch(`/api/proposals/${id}/send`, {
src/features/calendar/useCalendarActions.ts:222:      const response = await fetch(`/api/proposals/${id}/convert`, {
src/lib/payments/razorpay.ts:176:    async fetch(orderId: string): Promise<Order> {
src/lib/payments/razorpay.ts:182:    async fetch(paymentId: string): Promise<Payment> {
src/app/add-ons/page.tsx:101:      const response = await fetch("/api/add-ons", { headers });
src/app/add-ons/page.tsx:119:      const statsResponse = await fetch("/api/add-ons/stats", { headers });
src/app/add-ons/page.tsx:201:        const response = await fetch(url, {
src/app/add-ons/page.tsx:238:      const response = await fetch(`/api/add-ons/${addOnToDelete.id}`, {
src/app/add-ons/page.tsx:267:        const response = await fetch(`/api/add-ons/${addon.id}`, {
src/lib/payments/invoice-service.ts:211:    const payment = await razorpay.payments.fetch(options.razorpayPaymentId);
src/lib/payments/link-tracker.ts:29:  const response = await fetch("/api/payments/links", {
src/lib/payments/link-tracker.ts:45:  const response = await fetch(`/api/payments/links/${token}`, {
src/lib/payments/link-tracker.ts:61:  const response = await fetch(`/api/payments/track/${token}`, {
src/lib/proposal-notifications.ts:27:  const response = await fetch(endpoint, {
src/app/proposals/create/_hooks/useProposalData.ts:48:      const limitsResp = await fetch('/api/subscriptions/limits', {
src/app/proposals/create/_hooks/useProposalData.ts:115:      const clientsResp = await fetch('/api/admin/clients', { headers });
src/app/proposals/create/_hooks/useProposalData.ts:151:        const addOnsResp = await fetch('/api/add-ons');
src/app/proposals/create/_hooks/useProposalData.ts:194:    const resp = await fetch('/api/admin/clients', {
src/app/proposals/create/_hooks/useWhatsAppDraft.ts:51:        return fetch(`/api/whatsapp/proposal-drafts/${encodeURIComponent(whatsappDraftId)}`, {
src/app/proposals/create/_hooks/useCreateProposal.ts:117:      const response = await fetch('/api/proposals/create', {
src/app/proposals/create/_hooks/useCreateProposal.ts:184:        const sendResponse = await fetch(`/api/proposals/${proposalId}/send`, {
src/app/proposals/create/_hooks/useAvailabilityCheck.ts:41:        return fetch(`/api/availability?${params.toString()}`, {
src/app/proposals/create/_hooks/usePricingSuggestion.ts:38:        return fetch(`/api/ai/pricing-suggestion?${params.toString()}`, {
src/lib/queries/trip-detail.ts:45:      const response = await fetch(`/api/trips/${tripId}`, { headers });
src/lib/queries/trip-detail.ts:62:      const response = await fetch(`/api/trips/${tripId}/invoices`, {
src/lib/queries/trip-detail.ts:81:      const response = await fetch(`/api/trips/${tripId}/notifications`, {
src/lib/queries/trip-detail.ts:101:      const response = await fetch(`/api/trips/${tripId}/add-ons`, {
src/lib/queries/trip-detail.ts:134:      const response = await fetch("/api/invoices", {
src/lib/queries/clients.ts:30:            const response = await fetch("/api/admin/clients", {
src/lib/queries/clients.ts:53:            const response = await fetch(`/api/admin/clients/${id}`, {
src/lib/queries/dashboard-tasks.ts:167:      const response = await fetch("/api/dashboard/tasks", { headers });
src/lib/queries/dashboard-tasks.ts:196:      const response = await fetch("/api/dashboard/schedule", { headers });
src/lib/queries/dashboard-tasks.ts:218:      const response = await fetch(url, { headers });
src/lib/queries/dashboard-tasks.ts:248:      const response = await fetch("/api/dashboard/tasks/dismiss", {
src/lib/queries/trips.ts:45:            const response = await fetch(`/api/trips?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchQuery)}`, {
src/lib/queries/trips.ts:67:            const response = await fetch(`/api/trips/${id}`, {
src/lib/queries/trips.ts:112:            const response = await fetch(`/api/trips/${id}/clone`, {
src/app/proposals/page.tsx:181:      const response = await fetch('/api/proposals/bulk', {
src/app/pay/[token]/PaymentCheckoutClient.tsx:97:            const verifyResponse = await fetch("/api/payments/verify", {
src/app/proposals/[id]/page.tsx:274:      const response = await fetch(`/api/proposals/${proposal.id}/send`, {
src/app/onboarding/page.tsx:223:      const response = await fetch('/api/onboarding/setup', { cache: 'no-store' });
src/app/onboarding/page.tsx:272:      const response = await fetch('/api/onboarding/first-value', { cache: 'no-store' });
src/app/onboarding/page.tsx:319:      const response = await fetch('/api/onboarding/setup', {
src/app/admin/notifications/page.tsx:123:            const response = await fetch("/api/admin/whatsapp/health", {
src/app/admin/notifications/page.tsx:153:            const response = await fetch(`/api/admin/notifications/delivery?${params.toString()}`, {
src/app/admin/notifications/page.tsx:191:            const response = await fetch("/api/notifications/process-queue", {
src/app/admin/notifications/page.tsx:220:            const response = await fetch("/api/notifications/retry-failed", {
src/app/admin/notifications/page.tsx:246:            const response = await fetch("/api/notifications/schedule-followups?limit=300", {
src/app/admin/notifications/page.tsx:275:            const response = await fetch("/api/location/cleanup-expired", {
src/app/admin/notifications/page.tsx:305:            const response = await fetch("/api/admin/whatsapp/normalize-driver-phones", {
src/app/admin/notifications/page.tsx:340:            const response = await fetch("/api/admin/notifications/delivery/retry", {
src/app/billing/BillingPageClient.tsx:142:      const response = await fetch("/api/billing/subscription", {
src/app/billing/BillingPageClient.tsx:227:        const response = await fetch("/api/subscriptions", {
src/app/billing/BillingPageClient.tsx:247:        const response = await fetch("/api/billing/contact-sales", {
src/app/trips/[id]/page.tsx:97:      const response = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
src/app/admin/page.tsx:171:                        ? fetch("/api/marketplace/stats", {
src/app/admin/page.tsx:314:                const res = await fetch("/api/health", { cache: "no-store" });
src/app/admin/trips/[id]/page.tsx:83:        const response = await fetch(`/api/admin/trips/${tripId}`, { headers });
src/app/admin/trips/[id]/page.tsx:119:                const response = await fetch(`/api/location/share?tripId=${tripId}&dayNumber=${activeDay}`, {
src/app/admin/trips/[id]/page.tsx:156:            const response = await fetch(url.toString(), {
src/app/admin/trips/[id]/page.tsx:351:            const response = await fetch("https://overpass-api.de/api/interpreter", {
src/app/admin/trips/[id]/page.tsx:494:            const response = await fetch("/api/location/share", {
src/app/admin/trips/[id]/page.tsx:544:            const response = await fetch(
src/lib/network/retry.ts:36:            const response = await fetch(input, {
src/app/trips/TripCardGrid.tsx:69:        const response = await fetch(`/api/trips/${tripId}`, {
src/lib/image-search.ts:49:        const res = await fetch(url, { signal: controller.signal });
src/app/(superadmin)/god/analytics/page.tsx:117:            const res = await fetch(`/api/superadmin/analytics/feature-usage?range=${range}`);
src/app/(superadmin)/god/analytics/page.tsx:130:            const res = await fetch(`/api/superadmin/analytics/feature-usage/${key}?range=${range}`);
src/app/admin/trips/[id]/_components/TripHeader.tsx:85:            const response = await fetch("/api/notifications/send", {
src/app/admin/trips/[id]/clone/page.tsx:57:        const response = await fetch(`/api/admin/trips/${tripId}`, {
src/app/admin/trips/[id]/clone/page.tsx:123:      const response = await fetch(`/api/admin/trips/${tripId}/clone`, {
src/lib/whatsapp.server.ts:50:            const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
src/lib/whatsapp.server.ts:303:        const urlRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
src/lib/whatsapp.server.ts:315:        const mediaRes = await fetch(downloadUrl, {
src/lib/social/fonts.ts:49:  const cssResponse = await fetch(cssUrl, {
src/lib/social/fonts.ts:69:  const fontResponse = await fetch(fontUrlMatch[1]);
src/lib/social/poster-background.ts:18:    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
src/lib/observability/metrics.ts:13:        await fetch(`${host.replace(/\/$/, "")}/capture/`, {
src/lib/geocoding-with-cache.ts:204:        const response = await fetch(url);
src/lib/social/poster-composer.ts:72:  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
src/app/inbox/page.tsx:79:        const response = await fetch('/api/whatsapp/broadcast', {
src/app/inbox/page.tsx:222:      const response = await fetch('/api/whatsapp/broadcast', {
src/app/(superadmin)/god/page.tsx:63:            const res = await fetch("/api/superadmin/overview");
src/app/(superadmin)/god/monitoring/page.tsx:65:                fetch("/api/superadmin/monitoring/health"),
src/app/(superadmin)/god/monitoring/page.tsx:66:                fetch("/api/superadmin/monitoring/queues"),
src/app/admin/security/page.tsx:53:      const response = await fetch("/api/admin/security/diagnostics", { cache: "no-store" });
src/app/admin/invoices/page.tsx:114:      const response = await fetch("/api/invoices?limit=50", { headers, cache: "no-store" });
src/app/admin/invoices/page.tsx:134:    const response = await fetch("/api/admin/clients", { headers, cache: "no-store" });
src/app/admin/invoices/page.tsx:153:      const response = await fetch(`/api/invoices/${invoiceId}`, { headers, cache: "no-store" });
src/app/admin/invoices/page.tsx:254:      const response = await fetch("/api/invoices", {
src/app/admin/invoices/page.tsx:305:      const response = await fetch(`/api/invoices/${selectedInvoice.id}/pay`, {
src/app/admin/invoices/page.tsx:401:      const response = await fetch("/api/invoices/send-pdf", {
src/app/portal/[token]/page.tsx:99:        const response = await fetch(`/api/portal/${token}`, {
src/app/portal/[token]/page.tsx:142:      await fetch('/api/social/reviews/public', {
src/app/admin/cost/page.tsx:75:        const response = await fetch(`/api/admin/cost/overview?days=${days}`, {
src/app/settings/page.tsx:69:            const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
src/app/settings/_components/MapsDataSection.tsx:25:            const res = await fetch('/api/integrations/places', { method: 'POST' });
src/app/settings/_components/MapsDataSection.tsx:49:            const res = await fetch('/api/integrations/places', {
src/app/admin/gst-report/page.tsx:205:      const res = await fetch(`/api/admin/reports/gst?month=${month}`);
src/app/settings/_components/IntegrationsTab.tsx:53:                fetch('/api/settings/upi'),
src/app/settings/_components/IntegrationsTab.tsx:54:                fetch('/api/integrations/places'),
src/app/settings/_components/IntegrationsTab.tsx:97:            const res = await fetch('/api/integrations/tripadvisor', {
src/app/settings/_components/IntegrationsTab.tsx:122:            const res = await fetch('/api/settings/upi', {
src/app/admin/internal/marketplace/page.tsx:36:            const res = await fetch("/api/admin/marketplace/verify");
src/app/admin/internal/marketplace/page.tsx:52:            await fetch("/api/admin/marketplace/verify", {
src/app/(superadmin)/god/signups/page.tsx:99:            const res = await fetch(`/api/superadmin/users/signups?range=${range}&page=${page}&limit=50`);
src/app/admin/cost/_components/CapEditor.tsx:51:        const response = await fetch("/api/admin/cost/overview", {
src/app/admin/cost/_components/AlertsList.tsx:40:        const response = await fetch("/api/admin/cost/alerts/ack", {
src/lib/assistant/orchestrator.ts:232:  const response = await fetch(OPENAI_CHAT_URL, {
src/app/settings/team/useTeamMembers.ts:45:        const response = await fetch("/api/settings/team", {
src/app/settings/team/useTeamMembers.ts:113:          fetch("/api/settings/team/invite", {
src/app/settings/team/useTeamMembers.ts:124:          fetch(`/api/settings/team/${memberId}`, {
src/app/settings/team/useTeamMembers.ts:134:          fetch(`/api/settings/team/${memberId}`, {
src/app/settings/team/useTeamMembers.ts:143:          fetch(`/api/settings/team/${memberId}/resend`, {
src/app/settings/marketplace/MarketplaceListingPlans.tsx:122:      const response = await fetch("/api/marketplace/listing-subscription", {
src/app/settings/marketplace/MarketplaceListingPlans.tsx:170:      const createResponse = await fetch("/api/marketplace/listing-subscription", {
src/app/settings/marketplace/MarketplaceListingPlans.tsx:199:            const verifyResponse = await fetch(
src/app/settings/marketplace/useMarketplacePresence.ts:133:          fetch("/api/settings/marketplace", { cache: "no-store" }),
src/app/settings/marketplace/useMarketplacePresence.ts:134:          fetch("/api/marketplace/stats", { cache: "no-store" }),
src/app/settings/marketplace/useMarketplacePresence.ts:135:          fetch("/api/marketplace/options", { cache: "no-store" }),
src/app/settings/marketplace/useMarketplacePresence.ts:136:          fetch("/api/marketplace/listing-subscription", { cache: "no-store" }),
src/app/settings/marketplace/useMarketplacePresence.ts:200:      const response = await fetch("/api/marketplace", {
src/app/admin/tour-templates/import/page.tsx:63:      const res = await fetch('/api/admin/tour-templates/extract', {
src/app/admin/tour-templates/import/page.tsx:109:      const res = await fetch('/api/admin/tour-templates/extract', {
src/app/admin/tour-templates/import/page.tsx:134:      const res = await fetch('/api/admin/tour-templates/extract', {
src/app/clients/page.tsx:257:                const limitsResponse = await fetch("/api/subscriptions/limits", { headers, cache: "no-store" });
src/app/clients/page.tsx:362:            const response = await fetch("/api/admin/clients", {
src/app/clients/page.tsx:392:            const response = await fetch("/api/admin/clients", {
src/app/clients/[id]/ClientEditButton.tsx:83:            const response = await fetch("/api/admin/clients", {
src/app/marketplace/analytics/page.tsx:69:            const response = await fetch("/api/marketplace/stats", {
src/app/marketplace/page.tsx:77:            const response = await fetch(url.toString(), { headers });
src/app/marketplace/[id]/page.tsx:136:            const profRes = await fetch(`/api/marketplace?q=`, { headers });
src/app/marketplace/[id]/page.tsx:143:            const revRes = await fetch(`/api/marketplace/${targetOrgId}/reviews`, { headers });
src/app/marketplace/[id]/page.tsx:161:                await fetch(`/api/marketplace/${targetOrgId}/view`, {
src/app/marketplace/[id]/page.tsx:181:            const response = await fetch(`/api/marketplace/${targetOrgId}/reviews`, {
src/app/marketplace/[id]/page.tsx:210:            const response = await fetch(`/api/marketplace/${targetOrgId}/inquiry`, {
src/app/marketplace/inquiries/page.tsx:43:            const res = await fetch("/api/marketplace/inquiries", {
src/app/marketplace/inquiries/page.tsx:62:            await fetch("/api/marketplace/inquiries", {
src/app/social/_components/MagicPrompter.tsx:22:            const res = await fetch("/api/social/ai-poster", {
src/app/social/_components/PostHistory.tsx:49:            const res = await fetch("/api/social/posts");
src/app/social/_components/PostHistory.tsx:64:            const res = await fetch(`/api/social/posts/${id}`, { method: "DELETE" });
src/app/social/_components/TripImporter.tsx:102:            const resp = await fetch("/api/trips", {
src/app/social/_components/PosterExtractor.tsx:28:            const resp = await fetch("/api/social/extract", {
src/app/reputation/_components/CampaignList.tsx:92:      const res = await fetch(url, {
src/app/social/_components/BulkExporter.tsx:81:    const resp = await fetch("/api/social/render-poster", {
src/app/social/_components/TemplateGallery.tsx:148:        const res = await fetch("/api/social/posts", {
src/app/social/_components/TemplateGallery.tsx:166:            const res = await fetch("/api/social/render-poster", {
src/app/reputation/_components/useReputationDashboardData.ts:54:  const response = await fetch(url, {
src/app/social/_components/canvas/CanvasPublishModal.tsx:88:      const response = await fetch(endpoint, {
src/app/social/_components/canvas/CanvasMode.tsx:118:      const response = await fetch("/api/social/render-poster", {
src/app/social/_components/canvas/CanvasMode.tsx:153:      await fetch("/api/social/posts", {
src/app/reputation/_components/ReviewResponsePanel.tsx:87:        const res = await fetch("/api/ai/draft-review-response", {
src/app/reputation/_components/PlatformConnectionCards.tsx:95:      const res = await fetch("/api/reputation/connections", {
src/app/reputation/_components/PlatformConnectionCards.tsx:128:      const res = await fetch(
src/app/reputation/_components/PlatformConnectionCards.tsx:153:      const res = await fetch("/api/reputation/sync", {
src/app/reputation/_components/ReviewInbox.tsx:285:      const res = await fetch(`/api/reputation/reviews?${params.toString()}`, { signal });
src/app/reputation/_components/ReviewInbox.tsx:311:      await fetch(`/api/reputation/reviews/${id}`, {
src/app/reputation/_components/ReviewInbox.tsx:328:      const res = await fetch("/api/reputation/reviews", {
src/app/reputation/_components/ReviewInbox.tsx:347:    const response = await fetch(`/api/reputation/reviews/${id}`, {
src/app/reputation/_components/ReviewInbox.tsx:381:      const response = await fetch(`/api/reputation/reviews/${reviewId}/marketing-asset`, {
src/app/reputation/_components/ReviewInbox.tsx:405:      const response = await fetch(`/api/reputation/reviews/${reviewId}/marketing-asset`, {
src/app/social/_components/TemplateEditor.tsx:80:            const res = await fetch("/api/social/ai-image", {
src/app/social/_components/TemplateEditor.tsx:131:            const res = await fetch("/api/social/smart-poster", {
src/app/social/_components/PublishKitDrawer.tsx:61:            const res = await fetch(endpoint, {
src/app/social/_components/PublishKitDrawer.tsx:314:                                                    const res = await fetch("/api/social/render-poster", {
src/app/reputation/nps/[token]/page.tsx:123:        const res = await fetch(`/api/reputation/nps/${token}`);
src/app/reputation/nps/[token]/page.tsx:158:      const res = await fetch("/api/reputation/nps/submit", {
src/app/social/_components/PlatformStatusBar.tsx:25:        fetch("/api/social/connections")
src/app/social/_components/PlatformStatusBar.tsx:140:                        onClick={() => fetch("/api/social/refresh-tokens", { method: "POST" }).then(() => window.location.reload())}
src/app/social/_components/ReviewsToInsta.tsx:146:                fetch("/api/social/reviews"),
src/app/social/_components/ReviewsToInsta.tsx:147:                fetch("/api/reputation/reviews?limit=100&sortBy=rating&sortOrder=desc"),
src/app/social/_components/ReviewsToInsta.tsx:223:            const res = await fetch("/api/social/reviews/import", { method: "POST" });
src/app/social/_components/SocialStudioClient.tsx:122:            const resp = await fetch("/api/social/captions", {
src/app/social/_components/StockTab.tsx:73:                const response = await fetch(
src/app/planner/page.tsx:166:                                const resp = await fetch(`${source.endpoint}?query=${encodeURIComponent(q)}`);
src/app/planner/page.tsx:201:            const res = await fetch("/api/itinerary/generate", {
src/app/planner/ShareItinerary.tsx:24:            const res = await fetch("/api/itinerary/share", {
src/app/auth/page.tsx:51:                const response = await fetch("/api/auth/password-login", {
src/app/(superadmin)/god/layout.tsx:20:                const res = await fetch("/api/superadmin/me", { credentials: "include" });
src/app/(superadmin)/god/support/page.tsx:83:            const res = await fetch(`/api/superadmin/support/tickets?${params}`);
src/app/(superadmin)/god/support/page.tsx:96:        const res = await fetch(`/api/superadmin/support/tickets/${id}`);
src/app/(superadmin)/god/support/page.tsx:108:            const res = await fetch(`/api/superadmin/support/tickets/${selectedTicket.ticket.id}/respond`, {
src/app/social/_components/AiTab.tsx:108:            const res = await fetch("/api/social/ai-image", {
src/app/social/_components/AiTab.tsx:174:            const res = await fetch("/api/social/ai-image", {
src/app/admin/templates/page.tsx:109:                const response = await fetch("/api/admin/notifications/delivery?limit=300", {
src/app/bookings/page.tsx:70:                const res = await fetch("/api/itineraries");
src/app/bookings/page.tsx:109:            const res = await fetch(`/api/itineraries/${selectedItineraryId}/bookings`, {
src/app/(superadmin)/god/costs/page.tsx:93:                fetch("/api/superadmin/cost/aggregate"),
src/app/(superadmin)/god/costs/page.tsx:94:                fetch(`/api/superadmin/cost/trends?range=${range}`),
src/lib/demo/use-demo-fetch.ts:1:// useDemoFetch — wraps fetch() to inject X-Demo-Org-Id header.
src/lib/demo/use-demo-fetch.ts:17:        return fetch(url, { ...init, headers });
src/lib/demo/use-demo-fetch.ts:19:      return fetch(url, init);
src/app/(superadmin)/god/announcements/page.tsx:66:            const res = await fetch("/api/superadmin/announcements?limit=20");
src/app/(superadmin)/god/announcements/page.tsx:86:            const res = await fetch("/api/superadmin/announcements", {
src/app/(superadmin)/god/announcements/page.tsx:105:            const res = await fetch(`/api/superadmin/announcements/${id}/send`, { method: "POST" });
src/app/(superadmin)/god/directory/page.tsx:128:            const res = await fetch(`/api/superadmin/users/directory?${params}`);
src/app/(superadmin)/god/directory/page.tsx:142:            const res = await fetch(`/api/superadmin/users/${user.id}`);
src/app/(superadmin)/god/referrals/page.tsx:84:            const res = await fetch("/api/superadmin/referrals/overview");
src/app/admin/settings/marketplace/page.tsx:193:            const response = await fetch("/api/marketplace", {
src/app/admin/settings/marketplace/page.tsx:233:            const response = await fetch("/api/marketplace", {
src/app/admin/insights/page.tsx:69:            run: () => fetch("/api/admin/insights/action-queue?limit=8", { headers }),
src/app/admin/insights/page.tsx:74:            run: () => fetch("/api/admin/insights/margin-leak?daysBack=90&limit=6", { headers }),
src/app/admin/insights/page.tsx:79:            run: () => fetch("/api/admin/insights/smart-upsell-timing?daysForward=30&limit=6", { headers }),
src/app/admin/insights/page.tsx:84:            run: () => fetch("/api/admin/insights/auto-requote?daysBack=120&limit=6", { headers }),
src/app/admin/insights/page.tsx:89:            run: () => fetch("/api/admin/insights/daily-brief?limit=5", { headers }),
src/app/admin/insights/page.tsx:94:            run: () => fetch("/api/admin/insights/win-loss?daysBack=120", { headers }),
src/app/admin/insights/page.tsx:99:            run: () => fetch("/api/admin/insights/ai-usage", { headers }),
src/app/admin/insights/page.tsx:104:            run: () => fetch("/api/admin/insights/batch-jobs", { headers }),
src/app/admin/settings/page.tsx:74:            const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
src/app/admin/settings/page.tsx:107:                fetch('/api/settings/upi'),
src/app/admin/settings/page.tsx:108:                fetch('/api/integrations/places'),
src/app/admin/settings/page.tsx:146:            const res = await fetch('/api/integrations/tripadvisor', {
src/app/admin/settings/page.tsx:170:            const res = await fetch('/api/integrations/places', { method: 'POST' });
src/app/admin/settings/page.tsx:189:            const res = await fetch('/api/settings/upi', {
src/app/admin/settings/page.tsx:240:            const rulesResponse = await fetch("/api/admin/workflow/rules", {
src/app/admin/settings/page.tsx:356:                const response = await fetch("/api/admin/workflow/rules", {
src/app/(superadmin)/god/costs/org/[orgId]/page.tsx:43:                const res = await fetch(`/api/superadmin/cost/org/${params.orgId}?range=30d`);
src/components/whatsapp/ContextActionModal.tsx:460:        const res = await fetch('/api/whatsapp/extract-trip-intent', {
src/components/whatsapp/WhatsAppConnectModal.tsx:62:            const res = await fetch("/api/whatsapp/connect", { method: "POST" });
src/components/whatsapp/WhatsAppConnectModal.tsx:127:                const res = await fetch(
src/components/whatsapp/WhatsAppConnectModal.tsx:153:                const res = await fetch(
src/components/whatsapp/WhatsAppConnectModal.tsx:198:            const res = await fetch("/api/whatsapp/test-message", {
src/components/whatsapp/UnifiedInbox.tsx:80:      const response = await fetch('/api/whatsapp/conversations', { cache: 'no-store' });
src/components/whatsapp/UnifiedInbox.tsx:104:      const response = await fetch('/api/whatsapp/health', { cache: 'no-store' });
src/components/whatsapp/UnifiedInbox.tsx:185:      const response = await fetch(`/api/whatsapp/chatbot-sessions/${session.id}`, {
src/components/whatsapp/UnifiedInbox.tsx:223:      const response = await fetch(`/api/whatsapp/proposal-drafts/${draftId}`, {
src/components/whatsapp/UnifiedInbox.tsx:327:      const response = await fetch('/api/whatsapp/send', {
src/app/api/_handlers/proposals/send-pdf/route.ts:96:    const emailResponse = await fetch('https://api.resend.com/emails', {
src/app/(superadmin)/god/kill-switch/page.tsx:33:            const res = await fetch("/api/superadmin/settings");
src/app/(superadmin)/god/kill-switch/page.tsx:60:            const res = await fetch("/api/superadmin/settings/kill-switch", {
src/components/whatsapp/useSmartReplySuggestions.ts:87:      const response = await fetch("/api/ai/suggest-reply", {
src/app/(superadmin)/god/audit-log/page.tsx:71:            const res = await fetch(`/api/superadmin/audit-log?${params}`);
src/components/WeatherWidget.tsx:56:                const res = await fetch(
src/components/assistant/TourAssistantChat.tsx:115:        void fetch("/api/assistant/quick-prompts")
src/components/assistant/TourAssistantChat.tsx:165:            const res = await fetch("/api/assistant/chat/stream", {
src/components/assistant/TourAssistantChat.tsx:173:                const fallbackRes = await fetch("/api/assistant/chat", {
src/components/assistant/TourAssistantChat.tsx:320:            const res = await fetch("/api/assistant/export", {
src/components/assistant/TourAssistantChat.tsx:345:            const res = await fetch("/api/assistant/confirm", {
src/components/assistant/ConversationHistory.tsx:61:      const res = await fetch(`/api/assistant/conversations?${params.toString()}`);
src/components/assistant/ConversationHistory.tsx:91:      const res = await fetch(`/api/assistant/conversations/${sessionId}`);
src/components/assistant/ConversationHistory.tsx:108:      await fetch(`/api/assistant/conversations?sessionId=${sessionId}`, { method: "DELETE" });
src/components/CurrencyConverter.tsx:92:            const res = await fetch(
src/components/assistant/UsageDashboard.tsx:42:        const res = await fetch("/api/assistant/usage");
src/components/demo/WelcomeModal.tsx:38:          const res = await fetch("/api/admin/dashboard/stats");
src/components/leads/LeadToBookingFlow.tsx:441:      const res = await fetch('/api/leads/convert', {
src/components/CreateTripModal.tsx:96:        const response = await fetch("/api/admin/clients", {
src/components/CreateTripModal.tsx:124:            const response = await fetch("/api/itineraries", {
src/components/CreateTripModal.tsx:210:            const response = await fetch("/api/subscriptions/limits", {
src/components/CreateTripModal.tsx:238:            const res = await fetch("/api/itinerary/generate", {
src/components/CreateTripModal.tsx:268:            const res = await fetch("/api/itinerary/import/url", {
src/components/CreateTripModal.tsx:297:            const res = await fetch("/api/itinerary/import/pdf", {
src/components/CreateTripModal.tsx:331:            const response = await fetch("/api/admin/trips", {
src/components/payments/RazorpayModal.tsx:179:            const verifyResponse = await fetch('/api/payments/verify', {
src/components/layout/useNavCounts.ts:37:        const response = await fetch("/api/nav/counts", {
src/components/planner/ApprovalManager.tsx:88:      const response = await fetch(`/api/share/${token}`);
src/components/planner/ApprovalManager.tsx:154:      const response = await fetch(endpoint, {
src/app/live/[token]/page.tsx:56:            const response = await fetch(`/api/location/live/${token}`, { cache: "no-store" });
src/components/planner/PricingManager.tsx:28:                const res = await fetch('/api/add-ons');
src/app/api/_handlers/assistant/chat/stream/route.ts:156:  const response = await fetch(OPENAI_CHAT_URL, {
src/app/api/_handlers/assistant/chat/stream/route.ts:199:  const response = await fetch(OPENAI_CHAT_URL, {
src/components/bookings/LocationAutocomplete.tsx:75:                const res = await fetch(
src/components/bookings/FlightSearch.tsx:129:            const res = await fetch(`/api/bookings/flights/search?${params.toString()}`);
src/components/bookings/HotelSearch.tsx:76:            const res = await fetch(`/api/bookings/hotels/search?${params.toString()}`);
src/components/pdf/itinerary-pdf.tsx:54:    const response = await fetch(`/api/images?query=${encodeURIComponent(location)}`);
src/app/api/_handlers/reputation/sync/route.ts:204:        const placesResponse = await fetch(url.toString(), {
src/components/pdf/ProposalPDFButton.tsx:107:      const response = await fetch('/api/proposals/send-pdf', {
src/components/admin/ConvertProposalModal.tsx:41:            const response = await fetch(`/api/proposals/${proposalId}/convert`, {
src/app/api/_handlers/health/route.ts:52:        const response = await fetch(url, { ...init, signal: controller.signal });
src/app/api/_handlers/images/unsplash/route.ts:44:        const response = await fetch(
src/app/api/_handlers/images/pexels/route.ts:25:        const response = await fetch(
src/app/api/_handlers/images/pixabay/route.ts:24:        const response = await fetch(
src/app/api/_handlers/itinerary/import/url/route.ts:149:        const response = await fetch(url, {
src/app/api/_handlers/invoices/send-pdf/route.ts:79:    const emailResponse = await fetch("https://api.resend.com/emails", {
src/app/api/_handlers/social/oauth/callback/route.ts:30:    return fetch('https://graph.facebook.com/v20.0/oauth/access_token', {
src/app/api/_handlers/social/oauth/callback/route.ts:86:    const pagesRes = await fetch('https://graph.facebook.com/v20.0/me/accounts', {
src/app/api/_handlers/social/oauth/callback/route.ts:114:        const fbPageIgRes = await fetch(
src/app/api/_handlers/integrations/places/route.ts:93:  const response = await fetch(url.toString(), {
src/app/api/_handlers/social/refresh-tokens/route.ts:60:                const res = await fetch(
```
