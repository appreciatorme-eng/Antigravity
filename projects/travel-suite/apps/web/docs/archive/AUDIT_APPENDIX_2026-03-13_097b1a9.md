# Travel Suite Web Audit Appendix (2026-03-13, 097b1a9)

Audit target: current `origin/main` at commit `097b1a9f3b5b5cd4b7256969853e8b2810daca75`
Scope: `projects/travel-suite/apps/web/src/`
Purpose: coverage proof, baseline validators, and exhaustive raw inventories that back `AUDIT_REPORT_2026-03-13_097b1a9.md`.

## Baseline Validation

### `npm run typecheck`
```text

> web@0.1.0 typecheck
> tsc --noEmit

```

### `npm run lint`
```text

> web@0.1.0 lint
> eslint --max-warnings=0

```

### `npx madge --circular --extensions ts,tsx src`
```text
- Finding files
Processed 1146 files (8.3s) (614 warnings)

✔ No circular dependency found!

```

## Coverage

### Top-Level Subtree Counts
| Path | Files |
|------|------:|
| `src/app` | 605 |
| `src/components` | 199 |
| `src/emails` | 8 |
| `src/features` | 84 |
| `src/hooks` | 4 |
| `src/lib` | 240 |
| `src/stores` | 2 |
| `src/styles` | 2 |
| `src/types` | 2 |

### Coverage Totals
```text
total_files=1148
ts_tsx_files=1145
src/app=605
src/components=199
src/emails=8
src/features=84
src/hooks=4
src/lib=240
src/stores=2
src/styles=2
src/types=2
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

### Direct Route Files And TODO/FIXME/HACK
```text
DIRECT_ROUTE_FILES
src/app/api/[...path]/route.ts
src/app/api/admin/[...path]/route.ts
src/app/api/assistant/[...path]/route.ts
src/app/api/availability/route.ts
src/app/api/reputation/[...path]/route.ts
src/app/api/social/[...path]/route.ts
src/app/api/superadmin/[...path]/route.ts
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts

TODO_FIXME_HACK
src/lib/payments/payment-receipt-config.ts:3: * TODO(billing): Move to organization_settings table to support
```

### File Size / Function Length / Nesting Depth Breaches
```text
FILE_SIZE_BREACHES
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

FUNCTION_LENGTH_BREACHES
src/app/(superadmin)/god/analytics/page.tsx:106:151
src/app/(superadmin)/god/announcements/page.tsx:54:223
src/app/(superadmin)/god/audit-log/page.tsx:59:171
src/app/(superadmin)/god/costs/org/[orgId]/page.tsx:33:107
src/app/(superadmin)/god/costs/page.tsx:82:142
src/app/(superadmin)/god/directory/page.tsx:100:248
src/app/(superadmin)/god/kill-switch/page.tsx:24:186
src/app/(superadmin)/god/monitoring/page.tsx:55:140
src/app/(superadmin)/god/page.tsx:54:196
src/app/(superadmin)/god/referrals/page.tsx:76:102
src/app/(superadmin)/god/signups/page.tsx:90:107
src/app/(superadmin)/god/support/page.tsx:68:240
src/app/add-ons/_components/AddOnFormModal.tsx:51:160
src/app/add-ons/_components/AddOnsGrid.tsx:33:126
src/app/add-ons/_components/AddOnsGrid.tsx:58:98
src/app/add-ons/page.tsx:51:320
src/app/admin/activity/page.tsx:80:177
src/app/admin/cost/_components/AlertsList.tsx:17:185
src/app/admin/cost/_components/CapEditor.tsx:17:131
src/app/admin/cost/_components/MarginReport.tsx:12:92
src/app/admin/cost/page.tsx:48:266
src/app/admin/gst-report/page.tsx:193:352
src/app/admin/insights/page.tsx:29:759
src/app/admin/insights/page.tsx:48:116
src/app/admin/internal/marketplace/page.tsx:27:137
src/app/admin/invoices/page.tsx:23:631
src/app/admin/kanban/page.tsx:85:585
src/app/admin/kanban/page.tsx:552:86
src/app/admin/layout.tsx:23:82
src/app/admin/notifications/page.tsx:30:706
src/app/admin/notifications/shared.tsx:162:112
src/app/admin/operations/page.tsx:135:450
src/app/admin/page.tsx:120:684
src/app/admin/page.tsx:152:155
src/app/admin/page.tsx:153:151
src/app/admin/planner/page.tsx:77:255
src/app/admin/pricing/page.tsx:47:324
src/app/admin/referrals/page.tsx:14:196
src/app/admin/security/page.tsx:44:170
src/app/admin/settings/SettingsIntegrationsSection.tsx:69:283
src/app/admin/settings/marketplace/page.tsx:78:524
src/app/admin/settings/page.tsx:38:711
src/app/admin/support/page.tsx:71:304
src/app/admin/support/page.tsx:81:99
src/app/admin/templates/page.tsx:84:209
src/app/admin/templates/page.tsx:94:81
src/app/admin/tour-templates/[id]/edit/page.tsx:64:412
src/app/admin/tour-templates/[id]/edit/page.tsx:86:114
src/app/admin/tour-templates/[id]/edit/page.tsx:205:128
src/app/admin/tour-templates/[id]/page.tsx:76:454
src/app/admin/tour-templates/[id]/page.tsx:90:91
src/app/admin/tour-templates/[id]/page.tsx:346:135
src/app/admin/tour-templates/create/_components/AccommodationEditor.tsx:17:114
src/app/admin/tour-templates/create/_components/ActivityEditor.tsx:12:84
src/app/admin/tour-templates/create/_components/DayEditor.tsx:34:111
src/app/admin/tour-templates/create/_components/MetadataForm.tsx:22:152
src/app/admin/tour-templates/create/page.tsx:73:337
src/app/admin/tour-templates/create/page.tsx:192:149
src/app/admin/tour-templates/import/page.tsx:18:458
src/app/admin/tour-templates/import/page.tsx:163:98
src/app/admin/tour-templates/page.tsx:49:421
src/app/admin/tour-templates/page.tsx:340:113
src/app/admin/trips/[id]/_components/AccommodationCard.tsx:25:122
src/app/admin/trips/[id]/_components/DayActivities.tsx:165:97
src/app/admin/trips/[id]/_components/DriverAssignmentCard.tsx:22:102
src/app/admin/trips/[id]/_components/TripHeader.tsx:44:227
src/app/admin/trips/[id]/_components/utils.ts:84:82
src/app/admin/trips/[id]/clone/page.tsx:28:218
src/app/admin/trips/[id]/page.tsx:38:655
src/app/admin/trips/[id]/page.tsx:316:92
src/app/admin/trips/page.tsx:69:384
src/app/analytics/drill-through/page.tsx:76:171
src/app/analytics/templates/page.tsx:13:285
src/app/api/_handlers/add-ons/stats/route.ts:34:103
src/app/api/_handlers/admin/clear-cache/route.ts:38:93
src/app/api/_handlers/admin/clients/route.ts:128:217
src/app/api/_handlers/admin/clients/route.ts:418:88
src/app/api/_handlers/admin/clients/route.ts:507:231
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:44:173
src/app/api/_handlers/admin/contacts/route.ts:49:88
src/app/api/_handlers/admin/contacts/route.ts:138:146
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:14:91
src/app/api/_handlers/admin/cost/overview/route.ts:32:760
src/app/api/_handlers/admin/dashboard/stats/route.ts:22:185
src/app/api/_handlers/admin/funnel/route.ts:10:101
src/app/api/_handlers/admin/insights/action-queue/route.ts:11:94
src/app/api/_handlers/admin/insights/ai-usage/route.ts:17:93
src/app/api/_handlers/admin/insights/auto-requote/route.ts:12:96
src/app/api/_handlers/admin/insights/best-quote/route.ts:30:165
src/app/api/_handlers/admin/insights/daily-brief/route.ts:11:96
src/app/api/_handlers/admin/insights/margin-leak/route.ts:12:112
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:26:196
src/app/api/_handlers/admin/insights/proposal-risk/route.ts:16:111
src/app/api/_handlers/admin/insights/roi/route.ts:16:166
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:12:126
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:40:173
src/app/api/_handlers/admin/insights/win-loss/route.ts:11:109
src/app/api/_handlers/admin/leads/[id]/route.ts:71:91
src/app/api/_handlers/admin/leads/route.ts:80:107
src/app/api/_handlers/admin/marketplace/verify/route.ts:98:94
src/app/api/_handlers/admin/marketplace/verify/route.ts:193:182
src/app/api/_handlers/admin/notifications/delivery/route.ts:55:107
src/app/api/_handlers/admin/operations/command-center/route.ts:212:325
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:155:177
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:339:83
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:61:145
src/app/api/_handlers/admin/pricing/dashboard/route.ts:16:171
src/app/api/_handlers/admin/pricing/transactions/route.ts:39:136
src/app/api/_handlers/admin/pricing/trips/route.ts:17:113
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:302:120
src/app/api/_handlers/admin/referrals/route.ts:22:84
src/app/api/_handlers/admin/referrals/route.ts:107:123
src/app/api/_handlers/admin/revenue/route.ts:46:85
src/app/api/_handlers/admin/security/diagnostics/route.ts:21:100
src/app/api/_handlers/admin/social/generate/route.ts:232:115
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:72:84
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:224:177
src/app/api/_handlers/admin/trips/[id]/route.ts:56:262
src/app/api/_handlers/admin/trips/route.ts:120:111
src/app/api/_handlers/admin/trips/route.ts:232:118
src/app/api/_handlers/admin/whatsapp/health/route.ts:54:244
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:10:118
src/app/api/_handlers/admin/workflow/events/route.ts:13:118
src/app/api/_handlers/ai/pricing-suggestion/route.ts:109:82
src/app/api/_handlers/assistant/chat/route.ts:9:93
src/app/api/_handlers/assistant/chat/stream/route.ts:265:93
src/app/api/_handlers/assistant/chat/stream/route.ts:370:206
src/app/api/_handlers/assistant/chat/stream/route.ts:581:113
src/app/api/_handlers/assistant/confirm/route.ts:11:130
src/app/api/_handlers/billing/contact-sales/route.ts:64:107
src/app/api/_handlers/billing/subscription/route.ts:15:101
src/app/api/_handlers/bookings/flights/search/route.ts:24:121
src/app/api/_handlers/bookings/hotels/search/route.ts:44:142
src/app/api/_handlers/currency/route.ts:43:104
src/app/api/_handlers/dashboard/schedule/route.ts:92:109
src/app/api/_handlers/drivers/search/route.ts:37:106
src/app/api/_handlers/health/route.ts:362:100
src/app/api/_handlers/invoices/[id]/pay/route.ts:24:135
src/app/api/_handlers/invoices/[id]/route.ts:111:120
src/app/api/_handlers/invoices/route.ts:88:141
src/app/api/_handlers/invoices/send-pdf/route.ts:26:92
src/app/api/_handlers/itineraries/[id]/bookings/route.ts:104:91
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:62:143
src/app/api/_handlers/itineraries/route.ts:6:152
src/app/api/_handlers/itinerary/generate/route.ts:226:526
src/app/api/_handlers/itinerary/import/pdf/route.ts:46:85
src/app/api/_handlers/itinerary/import/url/route.ts:101:102
src/app/api/_handlers/leads/convert/route.ts:40:141
src/app/api/_handlers/location/client-share/route.ts:13:89
src/app/api/_handlers/location/live/[token]/route.ts:26:110
src/app/api/_handlers/location/ping/route.ts:12:117
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:99:173
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:108:92
src/app/api/_handlers/marketplace/[id]/view/route.ts:17:96
src/app/api/_handlers/marketplace/inquiries/route.ts:47:100
src/app/api/_handlers/marketplace/inquiries/route.ts:148:92
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:83:127
src/app/api/_handlers/marketplace/options/route.ts:165:100
src/app/api/_handlers/marketplace/route.ts:209:284
src/app/api/_handlers/marketplace/route.ts:494:85
src/app/api/_handlers/marketplace/stats/route.ts:13:135
src/app/api/_handlers/notifications/client-landed/route.ts:23:157
src/app/api/_handlers/notifications/process-queue/route.ts:249:214
src/app/api/_handlers/notifications/process-queue/route.ts:464:125
src/app/api/_handlers/notifications/schedule-followups/route.ts:77:128
src/app/api/_handlers/notifications/send/route.ts:122:136
src/app/api/_handlers/onboarding/first-value/route.ts:23:129
src/app/api/_handlers/onboarding/setup/route.ts:306:201
src/app/api/_handlers/payments/create-order/route.ts:33:100
src/app/api/_handlers/payments/links/route.ts:24:84
src/app/api/_handlers/payments/verify/route.ts:20:86
src/app/api/_handlers/payments/webhook/route.ts:136:126
src/app/api/_handlers/payments/webhook/route.ts:267:109
src/app/api/_handlers/portal/[token]/route.ts:40:323
src/app/api/_handlers/proposals/[id]/convert/route.ts:108:233
src/app/api/_handlers/proposals/[id]/pdf/route.ts:95:149
src/app/api/_handlers/proposals/[id]/send/route.ts:93:179
src/app/api/_handlers/proposals/bulk/route.ts:12:92
src/app/api/_handlers/proposals/create/route.ts:52:181
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:414:173
src/app/api/_handlers/proposals/public/[token]/route.ts:81:480
src/app/api/_handlers/proposals/send-pdf/route.ts:34:113
src/app/api/_handlers/reputation/ai/analyze/route.ts:95:118
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:110:130
src/app/api/_handlers/reputation/ai/respond/route.ts:168:139
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:87:170
src/app/api/_handlers/reputation/analytics/trends/route.ts:18:141
src/app/api/_handlers/reputation/brand-voice/route.ts:103:160
src/app/api/_handlers/reputation/campaigns/route.ts:58:83
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:18:183
src/app/api/_handlers/reputation/dashboard/route.ts:18:116
src/app/api/_handlers/reputation/nps/[token]/route.ts:12:95
src/app/api/_handlers/reputation/nps/submit/route.ts:12:123
src/app/api/_handlers/reputation/reviews/route.ts:11:136
src/app/api/_handlers/reputation/sync/route.ts:98:249
src/app/api/_handlers/reputation/widget/[token]/route.ts:45:125
src/app/api/_handlers/reputation/widget/config/route.ts:61:86
src/app/api/_handlers/reputation/widget/config/route.ts:148:120
src/app/api/_handlers/settings/team/invite/route.ts:21:112
src/app/api/_handlers/settings/team/shared.ts:263:102
src/app/api/_handlers/share/[token]/route.ts:147:219
src/app/api/_handlers/social/oauth/callback/route.ts:39:104
src/app/api/_handlers/social/process-queue/route.ts:54:148
src/app/api/_handlers/social/refresh-tokens/route.ts:12:102
src/app/api/_handlers/social/reviews/import/route.ts:6:82
src/app/api/_handlers/social/reviews/public/route.ts:105:129
src/app/api/_handlers/social/smart-poster/route.ts:14:143
src/app/api/_handlers/subscriptions/route.ts:140:83
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:34:85
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:19:110
src/app/api/_handlers/superadmin/cost/trends/route.ts:15:82
src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts:45:99
src/app/api/_handlers/superadmin/referrals/overview/route.ts:36:105
src/app/api/_handlers/superadmin/users/signups/route.ts:18:86
src/app/api/_handlers/trips/[id]/clone/route.ts:25:118
src/app/api/_handlers/trips/[id]/invoices/route.ts:47:124
src/app/api/_handlers/trips/[id]/route.ts:90:270
src/app/api/_handlers/trips/[id]/route.ts:361:89
src/app/api/_handlers/trips/route.ts:163:216
src/app/api/_handlers/webhooks/waha/route.ts:54:198
src/app/api/_handlers/whatsapp/broadcast/route.ts:342:122
src/app/api/_handlers/whatsapp/conversations/route.ts:45:126
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:54:112
src/app/api/_handlers/whatsapp/send/route.ts:13:103
src/app/api/_handlers/whatsapp/webhook/route.ts:90:148
src/app/api/_handlers/whatsapp/webhook/route.ts:297:86
src/app/auth/page.tsx:14:248
src/app/billing/BillingPageClient.tsx:124:455
src/app/bookings/page.tsx:39:289
src/app/clients/[id]/ClientEditButton.tsx:48:193
src/app/clients/[id]/page.tsx:40:759
src/app/clients/page.tsx:209:703
src/app/clients/page.tsx:592:161
src/app/clients/page.tsx:638:111
src/app/dashboard/schedule/page.tsx:169:168
src/app/dashboard/tasks/page.tsx:168:93
src/app/dashboard/tasks/page.tsx:522:123
src/app/dashboard/tasks/page.tsx:688:195
src/app/design-demo/page.tsx:22:257
src/app/drivers/[id]/page.tsx:31:270
src/app/drivers/page.tsx:61:738
src/app/drivers/page.tsx:538:116
src/app/inbox/page.tsx:56:528
src/app/inbox/page.tsx:587:150
src/app/inbox/page.tsx:747:152
src/app/live/[token]/page.tsx:42:185
src/app/marketing/page.tsx:9:160
src/app/marketplace/[id]/page.tsx:89:562
src/app/marketplace/analytics/page.tsx:52:261
src/app/marketplace/inquiries/page.tsx:33:229
src/app/marketplace/inquiries/page.tsx:163:89
src/app/marketplace/page.tsx:43:371
src/app/marketplace/page.tsx:304:103
src/app/onboarding/page.tsx:119:686
src/app/p/[token]/page.tsx:38:699
src/app/p/[token]/page.tsx:497:187
src/app/page.tsx:80:350
src/app/pay/[token]/PaymentCheckoutClient.tsx:48:205
src/app/pay/[token]/PaymentCheckoutClient.tsx:68:88
src/app/planner/ClientFeedbackPanel.tsx:46:306
src/app/planner/ClientFeedbackPanel.tsx:157:108
src/app/planner/ItineraryFilterBar.tsx:157:180
src/app/planner/NeedsAttentionQueue.tsx:104:180
src/app/planner/NeedsAttentionQueue.tsx:163:116
src/app/planner/PastItineraryCard.tsx:44:283
src/app/planner/PlannerHero.tsx:54:231
src/app/planner/SaveItineraryButton.tsx:28:153
src/app/planner/SaveItineraryButton.tsx:36:102
src/app/planner/ShareItinerary.tsx:12:100
src/app/planner/page.tsx:61:604
src/app/portal/[token]/page.tsx:82:379
src/app/proposals/[id]/page.tsx:74:668
src/app/proposals/create/_components/AddOnsGrid.tsx:22:135
src/app/proposals/create/_components/ClientSelector.tsx:43:255
src/app/proposals/create/_components/TemplateSelector.tsx:40:173
src/app/proposals/create/_hooks/useCreateProposal.ts:34:172
src/app/proposals/create/_hooks/useCreateProposal.ts:40:163
src/app/proposals/create/_hooks/useProposalData.ts:37:191
src/app/proposals/create/_hooks/useProposalData.ts:79:95
src/app/proposals/create/_hooks/useWhatsAppDraft.ts:31:84
src/app/proposals/create/page.tsx:25:214
src/app/proposals/page.tsx:92:440
src/app/proposals/page.tsx:321:120
src/app/reputation/_components/BrandVoiceSettings.tsx:218:308
src/app/reputation/_components/CampaignBuilder.tsx:55:482
src/app/reputation/_components/CampaignList.tsx:84:174
src/app/reputation/_components/CampaignList.tsx:142:113
src/app/reputation/_components/CompetitorBenchmark.tsx:81:222
src/app/reputation/_components/NPSSurveyPreview.tsx:17:196
src/app/reputation/_components/PlatformConnectionCards.tsx:61:339
src/app/reputation/_components/PlatformConnectionCards.tsx:209:114
src/app/reputation/_components/ReputationDashboard.tsx:108:154
src/app/reputation/_components/ReputationDashboard.tsx:489:150
src/app/reputation/_components/ReviewCard.tsx:83:208
src/app/reputation/_components/ReviewInbox.tsx:75:153
src/app/reputation/_components/ReviewInbox.tsx:229:365
src/app/reputation/_components/ReviewResponsePanel.tsx:61:296
src/app/reputation/_components/ReviewToRevenueChart.tsx:68:170
src/app/reputation/_components/SentimentChart.tsx:67:92
src/app/reputation/_components/WidgetConfigurator.tsx:53:316
src/app/reputation/_components/useReputationDashboardData.ts:73:136
src/app/reputation/nps/[token]/page.tsx:107:310
src/app/settings/_components/IntegrationsTab.tsx:25:269
src/app/settings/_components/MapsDataSection.tsx:14:117
src/app/settings/marketplace/MarketplaceListingPlans.tsx:98:281
src/app/settings/marketplace/MarketplaceListingPlans.tsx:151:107
src/app/settings/marketplace/page.tsx:16:412
src/app/settings/marketplace/useMarketplacePresence.ts:96:157
src/app/settings/page.tsx:29:181
src/app/settings/team/page.tsx:26:170
src/app/settings/team/useTeamMembers.ts:26:125
src/app/share/[token]/ShareTemplateRenderer.tsx:32:97
src/app/share/[token]/page.tsx:16:104
src/app/social/_components/AiTab.tsx:65:342
src/app/social/_components/BackgroundPicker.tsx:32:164
src/app/social/_components/BulkExporter.tsx:128:298
src/app/social/_components/CaptionEngine.tsx:189:183
src/app/social/_components/CarouselBuilder.tsx:24:166
src/app/social/_components/ContentBar.tsx:101:446
src/app/social/_components/GallerySlotPicker.tsx:35:169
src/app/social/_components/MagicPrompter.tsx:14:106
src/app/social/_components/MediaLibrary.tsx:34:239
src/app/social/_components/PlatformStatusBar.tsx:19:137
src/app/social/_components/PostHistory.tsx:40:199
src/app/social/_components/PostHistory.tsx:132:102
src/app/social/_components/PosterExtractor.tsx:23:112
src/app/social/_components/PublishKitDrawer.tsx:30:339
src/app/social/_components/ReviewsToInsta.tsx:131:360
src/app/social/_components/SocialAnalytics.tsx:48:208
src/app/social/_components/SocialStudioClient.tsx:45:492
src/app/social/_components/StockTab.tsx:41:218
src/app/social/_components/TemplateEditor.tsx:55:503
src/app/social/_components/TemplateGallery.tsx:37:286
src/app/social/_components/TripImporter.tsx:86:294
src/app/social/_components/TripImporter.tsx:146:89
src/app/social/_components/canvas/CanvasEditorPanel.tsx:55:211
src/app/social/_components/canvas/CanvasMode.tsx:31:247
src/app/social/_components/canvas/CanvasPreviewPane.tsx:44:107
src/app/social/_components/canvas/CanvasPublishModal.tsx:46:258
src/app/social/_components/template-gallery/PreviewPanel.tsx:35:90
src/app/social/_components/template-gallery/TemplateGrid.tsx:179:208
src/app/social/_components/template-gallery/TemplateGrid.tsx:211:173
src/app/social/_components/template-gallery/TemplateGrid.tsx:222:159
src/app/support/page.tsx:22:261
src/app/trips/TripCardGrid.tsx:55:144
src/app/trips/TripCardGrid.tsx:92:103
src/app/trips/TripGridCard.tsx:32:85
src/app/trips/TripListRow.tsx:34:117
src/app/trips/[id]/page.tsx:29:199
src/app/trips/page.tsx:41:274
src/app/trips/templates/page.tsx:12:90
src/app/welcome/page.tsx:6:84
src/components/CreateTripModal.tsx:64:723
src/components/CreateTripModal.tsx:318:104
src/components/CurrencyConverter.tsx:59:258
src/components/InteractivePricing.tsx:11:111
src/components/ItineraryBuilder.tsx:119:195
src/components/NotificationSettings.tsx:21:259
src/components/ShareTripModal.tsx:36:192
src/components/ShareTripModal.tsx:44:98
src/components/TemplateAnalytics.tsx:21:165
src/components/VersionDiff.tsx:93:141
src/components/WeatherWidget.tsx:43:119
src/components/admin/ConvertProposalModal.tsx:24:102
src/components/admin/ProposalAddOnsManager.tsx:66:459
src/components/admin/ProposalAddOnsManager.tsx:348:90
src/components/analytics/RevenueChart.tsx:51:118
src/components/assistant/ConversationHistory.tsx:45:225
src/components/assistant/TourAssistantChat.tsx:13:392
src/components/assistant/TourAssistantChat.tsx:145:167
src/components/assistant/TourAssistantPresentation.tsx:84:588
src/components/assistant/TourAssistantPresentation.tsx:189:259
src/components/assistant/UsageDashboard.tsx:34:152
src/components/billing/PricingCard.tsx:39:129
src/components/billing/UpgradeModal.tsx:80:167
src/components/bookings/FlightSearch.tsx:69:332
src/components/bookings/FlightSearch.tsx:309:88
src/components/bookings/HotelSearch.tsx:40:193
src/components/bookings/LocationAutocomplete.tsx:36:203
src/components/client/ProposalAddOnsSelector.tsx:52:306
src/components/dashboard/ActionQueue.tsx:119:103
src/components/dashboard/ActionQueuePanels.tsx:47:93
src/components/dashboard/InlineActionPanel.tsx:96:90
src/components/dashboard/KPICard.tsx:69:82
src/components/dashboard/NotificationBell.tsx:48:170
src/components/dashboard/RevenueKPICard.tsx:37:190
src/components/dashboard/TaskRow.tsx:42:119
src/components/dashboard/TodaysTimeline.tsx:141:116
src/components/dashboard/TodaysTimeline.tsx:283:111
src/components/dashboard/WhatsAppDashboardPreview.tsx:128:94
src/components/demo/DemoModeBanner.tsx:17:89
src/components/demo/DemoTour.tsx:86:248
src/components/demo/WelcomeModal.tsx:14:155
src/components/forms/SearchableCreatableMultiSelect.tsx:34:142
src/components/glass/GlassModal.tsx:40:171
src/components/glass/QuickQuoteModal.tsx:109:95
src/components/glass/QuickQuoteModal.tsx:224:503
src/components/god-mode/DrillDownTable.tsx:46:140
src/components/god-mode/TrendChart.tsx:52:91
src/components/import/ImportPreview.tsx:14:239
src/components/import/ImportPreview.tsx:149:82
src/components/india/GSTInvoice.tsx:68:159
src/components/india/GSTInvoice.tsx:230:145
src/components/india/UPIPaymentModal.tsx:43:83
src/components/india/UPIPaymentModal.tsx:245:259
src/components/itinerary/ProfessionalItineraryView.tsx:31:167
src/components/itinerary/ProfessionalItineraryView.tsx:283:84
src/components/itinerary-templates/BentoJourneyView.tsx:8:255
src/components/itinerary-templates/BentoJourneyView.tsx:138:100
src/components/itinerary-templates/LuxuryResortView.tsx:8:226
src/components/itinerary-templates/ProfessionalView.tsx:13:321
src/components/itinerary-templates/ProfessionalView.tsx:136:150
src/components/itinerary-templates/SafariStoryView.tsx:8:311
src/components/itinerary-templates/SafariStoryView.tsx:173:114
src/components/itinerary-templates/UrbanBriefView.tsx:6:317
src/components/itinerary-templates/UrbanBriefView.tsx:154:123
src/components/itinerary-templates/UrbanBriefView.tsx:184:89
src/components/itinerary-templates/VisualJourneyView.tsx:8:284
src/components/itinerary-templates/VisualJourneyView.tsx:151:114
src/components/layout/CommandPalette.tsx:22:160
src/components/layout/FloatingActionButton.tsx:26:184
src/components/layout/MobileNav.tsx:119:194
src/components/layout/NavHeader.tsx:15:242
src/components/layout/Sidebar.tsx:150:83
src/components/layout/Sidebar.tsx:234:262
src/components/layout/TopBar.tsx:39:95
src/components/layout/useNavCounts.ts:21:94
src/components/layout/useNavCounts.ts:26:86
src/components/leads/LeadToBookingFlow.tsx:179:119
src/components/leads/LeadToBookingFlow.tsx:309:103
src/components/leads/LeadToBookingFlow.tsx:421:170
src/components/leads/LeadToBookingFlow.tsx:600:149
src/components/leads/SmartLeadCard.tsx:54:91
src/components/map/ItineraryMap.tsx:240:159
src/components/payments/PaymentLinkButton.tsx:48:223
src/components/payments/PaymentTracker.tsx:63:251
src/components/payments/RazorpayModal.tsx:106:272
src/components/payments/RazorpayModal.tsx:133:102
src/components/pdf/DownloadPDFButton.tsx:20:117
src/components/pdf/DownloadPDFButton.tsx:24:93
src/components/pdf/InvoiceDocument.tsx:106:107
src/components/pdf/InvoiceDocument.tsx:231:216
src/components/pdf/OperatorScorecardDocument.tsx:137:102
src/components/pdf/ProposalDocument.tsx:318:239
src/components/pdf/ProposalPDFButton.tsx:29:200
src/components/pdf/templates/ItineraryTemplatePages.tsx:374:176
src/components/pdf/templates/ItineraryTemplatePages.tsx:746:152
src/components/pdf/templates/ProfessionalTemplate.tsx:37:278
src/components/pdf/templates/ProfessionalTemplate.tsx:316:213
src/components/pdf/templates/ProfessionalTemplate.tsx:384:82
src/components/planner/ApprovalManager.tsx:51:600
src/components/planner/LogisticsManager.tsx:23:216
src/components/planner/PricingManager.tsx:22:188
src/components/portal/PortalItinerary.tsx:37:141
src/components/portal/PortalItinerary.tsx:49:126
src/components/portal/PortalPayment.tsx:37:209
src/components/portal/PortalReview.tsx:18:193
src/components/proposals/ESignature.tsx:33:315
src/components/settings/InviteModal.tsx:42:248
src/components/settings/LanguageToggle.tsx:15:114
src/components/settings/TeamMemberCard.tsx:51:144
src/components/social/templates/layouts/CenterLayout.tsx:10:83
src/components/social/templates/layouts/ElegantLayout.tsx:10:85
src/components/social/templates/layouts/GalleryLayouts.tsx:306:81
src/components/social/templates/layouts/InfoSplitLayout.tsx:10:86
src/components/social/templates/layouts/ReviewLayout.tsx:41:81
src/components/social/templates/layouts/ServiceLayouts.tsx:10:95
src/components/social/templates/layouts/SplitLayout.tsx:10:83
src/components/social/templates/layouts/ThemeDecorations.tsx:36:329
src/components/templates/ItineraryTemplateClassic.tsx:6:207
src/components/templates/ItineraryTemplateModern.tsx:6:251
src/components/trips/ConflictWarning.tsx:15:171
src/components/trips/GroupManager.tsx:46:584
src/components/trips/GroupManagerModals.tsx:35:100
src/components/trips/GroupManagerModals.tsx:160:174
src/components/trips/TripTemplates.tsx:359:150
src/components/trips/TripTemplates.tsx:516:111
src/components/ui/map/map-controls.tsx:86:99
src/components/ui/map/map-controls.tsx:251:85
src/components/ui/map/map-core.tsx:130:176
src/components/ui/map/map-layers.tsx:42:106
src/components/ui/map/map-layers.tsx:188:262
src/components/ui/map/map-layers.tsx:203:86
src/components/ui/map/map-layers.tsx:348:91
src/components/ui/map/map-markers.tsx:67:110
src/components/ui/toast.tsx:60:103
src/components/whatsapp/AutomationRules.tsx:301:98
src/components/whatsapp/AutomationRules.tsx:400:137
src/components/whatsapp/AutomationRules.tsx:538:184
src/components/whatsapp/CannedResponses.tsx:113:237
src/components/whatsapp/ContextActionModal.tsx:191:128
src/components/whatsapp/ContextActionModal.tsx:330:98
src/components/whatsapp/ContextActionModal.tsx:449:121
src/components/whatsapp/MessageThread.tsx:100:96
src/components/whatsapp/MessageThread.tsx:240:305
src/components/whatsapp/UnifiedInbox.tsx:58:741
src/components/whatsapp/UnifiedInbox.tsx:281:90
src/components/whatsapp/UnifiedInboxContextPanel.tsx:40:221
src/components/whatsapp/WhatsAppConnectModal.tsx:38:459
src/components/whatsapp/action-picker/ActionPickerModal.tsx:70:96
src/components/whatsapp/action-picker/DriverPicker.tsx:29:169
src/components/whatsapp/action-picker/ItineraryPicker.tsx:22:127
src/components/whatsapp/action-picker/LocationRequestPicker.tsx:24:177
src/components/whatsapp/action-picker/PaymentPicker.tsx:28:242
src/features/admin/analytics/AdminAnalyticsView.tsx:89:546
src/features/admin/analytics/useAdminAnalytics.ts:68:221
src/features/admin/analytics/useAdminAnalytics.ts:290:186
src/features/admin/analytics/useAdminAnalytics.ts:301:111
src/features/admin/billing/BillingView.tsx:46:773
src/features/admin/billing/useBillingData.ts:67:218
src/features/admin/billing/useBillingData.ts:83:86
src/features/admin/dashboard/DateRangePicker.tsx:28:154
src/features/admin/dashboard/FunnelWidget.tsx:19:82
src/features/admin/invoices/InvoiceCreateForm.tsx:66:308
src/features/admin/invoices/InvoiceCreateForm.tsx:213:85
src/features/admin/invoices/InvoiceListPanel.tsx:70:227
src/features/admin/invoices/InvoiceLivePreview.tsx:21:267
src/features/admin/invoices/helpers.ts:66:105
src/features/admin/invoices/useInvoiceDraft.ts:6:149
src/features/admin/pricing/components/MonthlyTripTable.tsx:30:260
src/features/admin/pricing/components/MonthlyTripTable.tsx:134:93
src/features/admin/pricing/components/OverheadExpensesCard.tsx:27:184
src/features/admin/pricing/components/PricingKpiCards.tsx:78:94
src/features/admin/pricing/components/TransactionDetailPanel.tsx:35:243
src/features/admin/pricing/components/TransactionLedger.tsx:43:259
src/features/admin/pricing/components/TripCostEditor.tsx:21:250
src/features/admin/pricing/useTripCosts.ts:7:82
src/features/admin/revenue/AdminRevenueView.tsx:112:683
src/features/admin/revenue/useAdminRevenue.ts:84:204
src/features/admin/revenue/useAdminRevenue.ts:97:164
src/features/calendar/AddEventModal.tsx:82:205
src/features/calendar/BlockDatesModal.tsx:29:239
src/features/calendar/CalendarCommandCenter.tsx:33:261
src/features/calendar/CalendarHeader.tsx:69:99
src/features/calendar/DayCell.tsx:36:91
src/features/calendar/DayDrawer.tsx:21:157
src/features/calendar/DayView.tsx:46:225
src/features/calendar/EventDetailModal.tsx:23:118
src/features/calendar/TimeGridEvent.tsx:26:91
src/features/calendar/WeekTimeGrid.tsx:40:212
src/features/calendar/WeekTimeGrid.tsx:139:88
src/features/calendar/WeekView.tsx:34:108
src/features/calendar/details/PersonalEventDetail.tsx:34:92
src/features/calendar/useCalendarActions.ts:87:305
src/features/trip-detail/TripDetailHeader.tsx:92:98
src/features/trip-detail/components/TripActivityList.tsx:40:89
src/features/trip-detail/components/TripAddOnsEditor.tsx:194:85
src/features/trip-detail/components/TripDriverCard.tsx:30:99
src/features/trip-detail/components/TripInvoiceSection.tsx:111:97
src/features/trip-detail/components/TripNotificationHistory.tsx:91:112
src/features/trip-detail/components/TripStatusSidebar.tsx:98:95
src/features/trip-detail/tabs/ClientCommsTab.tsx:87:118
src/features/trip-detail/tabs/FinancialsTab.tsx:247:193
src/features/trip-detail/tabs/FinancialsTab.tsx:458:87
src/hooks/useRealtimeProposal.ts:52:112
src/hooks/useRealtimeProposal.ts:66:95
src/hooks/useRealtimeUpdates.ts:126:121
src/hooks/useRealtimeUpdates.ts:153:85
src/hooks/useUserTimezone.ts:12:90
src/lib/admin/action-queue.ts:36:126
src/lib/ai/cost-guardrails.ts:26:91
src/lib/ai/upsell-engine.ts:172:133
src/lib/assistant/actions/reads/clients.ts:119:92
src/lib/assistant/actions/reads/clients.ts:237:141
src/lib/assistant/actions/reads/clients.ts:404:132
src/lib/assistant/actions/reads/dashboard.ts:78:93
src/lib/assistant/actions/reads/dashboard.ts:187:120
src/lib/assistant/actions/reads/dashboard.ts:334:101
src/lib/assistant/actions/reads/drivers.ts:163:118
src/lib/assistant/actions/reads/invoices.ts:124:118
src/lib/assistant/actions/reads/invoices.ts:268:180
src/lib/assistant/actions/reads/invoices.ts:473:113
src/lib/assistant/actions/reads/proposals.ts:152:113
src/lib/assistant/actions/reads/proposals.ts:291:83
src/lib/assistant/actions/reads/reports.ts:134:186
src/lib/assistant/actions/reads/trips.ts:79:118
src/lib/assistant/actions/reads/trips.ts:223:137
src/lib/assistant/actions/reads/trips.ts:385:123
src/lib/assistant/actions/writes/clients.ts:55:95
src/lib/assistant/actions/writes/clients.ts:179:86
src/lib/assistant/actions/writes/invoices.ts:51:116
src/lib/assistant/actions/writes/invoices.ts:197:137
src/lib/assistant/actions/writes/notifications.ts:90:90
src/lib/assistant/actions/writes/notifications.ts:215:137
src/lib/assistant/actions/writes/proposals.ts:86:85
src/lib/assistant/actions/writes/proposals.ts:196:118
src/lib/assistant/actions/writes/trips.ts:41:81
src/lib/assistant/actions/writes/trips.ts:151:104
src/lib/assistant/alerts.ts:83:111
src/lib/assistant/alerts.ts:250:92
src/lib/assistant/anomaly-detector.ts:176:93
src/lib/assistant/channel-adapters/whatsapp.ts:174:123
src/lib/assistant/orchestrator.ts:264:120
src/lib/assistant/orchestrator.ts:422:226
src/lib/assistant/weekly-digest.ts:77:111
src/lib/auth/admin.ts:165:112
src/lib/billing/outcome-upgrade.ts:80:93
src/lib/cost/spend-guardrails.ts:275:109
src/lib/import/pdf-extractor.ts:29:119
src/lib/import/url-scraper.ts:60:108
src/lib/india/gst.ts:198:100
src/lib/india/pricing.ts:102:114
src/lib/notification-templates.ts:65:97
src/lib/notification-templates.ts:166:110
src/lib/notifications/browser-push.ts:132:84
src/lib/payments/customer-service.ts:14:93
src/lib/payments/invoice-service.ts:34:118
src/lib/payments/invoice-service.ts:159:127
src/lib/payments/subscription-service.ts:57:115
src/lib/payments/subscription-service.ts:180:87
src/lib/payments/webhook-handlers.ts:31:94
src/lib/payments/webhook-handlers.ts:136:97
src/lib/pdf/proposal-pdf.tsx:292:149
src/lib/pdf/proposal-pdf.tsx:337:87
src/lib/pdf-extractor.ts:88:176
src/lib/rag-itinerary.ts:150:112
src/lib/reputation/campaign-trigger.ts:52:192
src/lib/security/cost-endpoint-guard.ts:149:232
src/lib/shared-itinerary-cache.ts:150:107
src/lib/social/ai-prompts.ts:290:81
src/lib/social/poster-composer.ts:205:171
src/lib/social/poster-premium-layouts-a.ts:19:185
src/lib/social/poster-premium-layouts-a.ts:214:86
src/lib/social/poster-premium-layouts-a.ts:310:146
src/lib/social/poster-premium-layouts-b.ts:13:81
src/lib/social/poster-premium-layouts-b.ts:167:96
src/lib/social/poster-standard-blocks.ts:117:156
src/lib/whatsapp/chatbot-flow.ts:417:115

NESTING_DEPTH_BREACHES
src/app/(superadmin)/god/announcements/page.tsx:54:depth=5
src/app/(superadmin)/god/costs/org/[orgId]/page.tsx:33:depth=5
src/app/(superadmin)/god/costs/page.tsx:82:depth=5
src/app/(superadmin)/god/kill-switch/page.tsx:24:depth=5
src/app/(superadmin)/god/layout.tsx:12:depth=6
src/app/(superadmin)/god/layout.tsx:17:depth=5
src/app/(superadmin)/god/support/page.tsx:68:depth=5
src/app/add-ons/page.tsx:51:depth=5
src/app/admin/activity/page.tsx:80:depth=5
src/app/admin/cost/_components/AlertsList.tsx:17:depth=5
src/app/admin/cost/_components/CapEditor.tsx:17:depth=5
src/app/admin/cost/page.tsx:48:depth=6
src/app/admin/cost/page.tsx:61:depth=5
src/app/admin/gst-report/page.tsx:193:depth=5
src/app/admin/insights/page.tsx:29:depth=8
src/app/admin/insights/page.tsx:48:depth=7
src/app/admin/invoices/page.tsx:23:depth=7
src/app/admin/invoices/page.tsx:75:depth=5
src/app/admin/invoices/page.tsx:161:depth=5
src/app/admin/invoices/page.tsx:377:depth=6
src/app/admin/kanban/page.tsx:85:depth=7
src/app/admin/kanban/page.tsx:102:depth=6
src/app/admin/notifications/page.tsx:30:depth=5
src/app/admin/notifications/shared.tsx:162:depth=6
src/app/admin/operations/page.tsx:135:depth=5
src/app/admin/page.tsx:120:depth=7
src/app/admin/page.tsx:152:depth=6
src/app/admin/page.tsx:153:depth=5
src/app/admin/page.tsx:308:depth=6
src/app/admin/page.tsx:311:depth=5
src/app/admin/planner/page.tsx:77:depth=5
src/app/admin/pricing/page.tsx:47:depth=5
src/app/admin/security/page.tsx:44:depth=5
src/app/admin/settings/marketplace/page.tsx:78:depth=7
src/app/admin/settings/marketplace/page.tsx:120:depth=6
src/app/admin/settings/page.tsx:38:depth=7
src/app/admin/settings/page.tsx:100:depth=5
src/app/admin/settings/page.tsx:351:depth=6
src/app/admin/support/page.tsx:71:depth=8
src/app/admin/support/page.tsx:81:depth=6
src/app/admin/support/page.tsx:188:depth=7
src/app/admin/templates/page.tsx:84:depth=9
src/app/admin/templates/page.tsx:94:depth=8
src/app/admin/tour-templates/[id]/edit/page.tsx:64:depth=9
src/app/admin/tour-templates/[id]/edit/page.tsx:86:depth=7
src/app/admin/tour-templates/[id]/edit/page.tsx:205:depth=8
src/app/admin/tour-templates/[id]/page.tsx:76:depth=10
src/app/admin/tour-templates/[id]/page.tsx:90:depth=9
src/app/admin/tour-templates/create/page.tsx:73:depth=9
src/app/admin/tour-templates/create/page.tsx:192:depth=8
src/app/admin/tour-templates/import/page.tsx:18:depth=8
src/app/admin/tour-templates/import/page.tsx:52:depth=6
src/app/admin/tour-templates/import/page.tsx:163:depth=7
src/app/admin/tour-templates/page.tsx:49:depth=8
src/app/admin/tour-templates/page.tsx:57:depth=7
src/app/admin/trips/[id]/_components/TripHeader.tsx:44:depth=5
src/app/admin/trips/[id]/_components/utils.ts:84:depth=10
src/app/admin/trips/[id]/clone/page.tsx:28:depth=6
src/app/admin/trips/[id]/clone/page.tsx:50:depth=5
src/app/admin/trips/[id]/page.tsx:38:depth=9
src/app/admin/trips/[id]/page.tsx:70:depth=5
src/app/admin/trips/[id]/page.tsx:176:depth=6
src/app/admin/trips/[id]/page.tsx:180:depth=5
src/app/admin/trips/[id]/page.tsx:411:depth=8
src/app/analytics/drill-through/page.tsx:76:depth=6
src/app/analytics/drill-through/page.tsx:96:depth=5
src/app/analytics/templates/page.tsx:13:depth=5
src/app/api/_handlers/add-ons/[id]/route.ts:64:depth=6
src/app/api/_handlers/add-ons/stats/route.ts:34:depth=5
src/app/api/_handlers/admin/clear-cache/route.ts:38:depth=6
src/app/api/_handlers/admin/clients/route.ts:128:depth=6
src/app/api/_handlers/admin/clients/route.ts:418:depth=6
src/app/api/_handlers/admin/clients/route.ts:507:depth=6
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:44:depth=6
src/app/api/_handlers/admin/contacts/route.ts:49:depth=5
src/app/api/_handlers/admin/contacts/route.ts:138:depth=7
src/app/api/_handlers/admin/cost/overview/route.ts:32:depth=9
src/app/api/_handlers/admin/dashboard/stats/route.ts:22:depth=6
src/app/api/_handlers/admin/geocoding/usage/route.ts:34:depth=6
src/app/api/_handlers/admin/insights/ai-usage/route.ts:17:depth=6
src/app/api/_handlers/admin/insights/auto-requote/route.ts:12:depth=5
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:17:depth=6
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:54:depth=6
src/app/api/_handlers/admin/insights/best-quote/route.ts:30:depth=6
src/app/api/_handlers/admin/insights/margin-leak/route.ts:12:depth=5
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:26:depth=6
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:12:depth=7
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:40:depth=6
src/app/api/_handlers/admin/insights/win-loss/route.ts:11:depth=8
src/app/api/_handlers/admin/marketplace/verify/route.ts:193:depth=5
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:155:depth=7
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:339:depth=8
src/app/api/_handlers/admin/pricing/dashboard/route.ts:16:depth=8
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:57:depth=5
src/app/api/_handlers/admin/pricing/transactions/route.ts:39:depth=7
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:59:depth=5
src/app/api/_handlers/admin/pricing/trips/route.ts:17:depth=6
src/app/api/_handlers/admin/pricing/vendor-history/route.ts:12:depth=6
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:79:depth=8
src/app/api/_handlers/admin/referrals/route.ts:22:depth=5
src/app/api/_handlers/admin/referrals/route.ts:107:depth=6
src/app/api/_handlers/admin/social/generate/route.ts:86:depth=5
src/app/api/_handlers/admin/tour-templates/extract/route.ts:12:depth=6
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:72:depth=5
src/app/api/_handlers/admin/trips/[id]/route.ts:56:depth=13
src/app/api/_handlers/admin/trips/route.ts:232:depth=6
src/app/api/_handlers/admin/whatsapp/health/route.ts:54:depth=8
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:10:depth=6
src/app/api/_handlers/admin/workflow/events/route.ts:13:depth=5
src/app/api/_handlers/assistant/chat/stream/route.ts:190:depth=8
src/app/api/_handlers/assistant/chat/stream/route.ts:370:depth=10
src/app/api/_handlers/assistant/chat/stream/route.ts:581:depth=7
src/app/api/_handlers/assistant/confirm/route.ts:11:depth=6
src/app/api/_handlers/assistant/quick-prompts/route.ts:102:depth=5
src/app/api/_handlers/bookings/[id]/invoice/route.ts:70:depth=6
src/app/api/_handlers/bookings/hotels/search/route.ts:44:depth=10
src/app/api/_handlers/bookings/locations/search/route.ts:38:depth=5
src/app/api/_handlers/currency/route.ts:43:depth=6
src/app/api/_handlers/dashboard/schedule/route.ts:92:depth=6
src/app/api/_handlers/dashboard/tasks/route.ts:304:depth=6
src/app/api/_handlers/debug/route.ts:19:depth=5
src/app/api/_handlers/drivers/search/route.ts:37:depth=8
src/app/api/_handlers/integrations/tripadvisor/route.ts:10:depth=5
src/app/api/_handlers/invoices/[id]/pay/route.ts:24:depth=6
src/app/api/_handlers/invoices/route.ts:88:depth=6
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:62:depth=7
src/app/api/_handlers/itineraries/route.ts:6:depth=10
src/app/api/_handlers/itinerary/generate/route.ts:173:depth=10
src/app/api/_handlers/itinerary/generate/route.ts:226:depth=13
src/app/api/_handlers/itinerary/import/pdf/route.ts:46:depth=5
src/app/api/_handlers/itinerary/import/url/route.ts:101:depth=5
src/app/api/_handlers/location/ping/route.ts:12:depth=6
src/app/api/_handlers/location/share/route.ts:153:depth=6
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:99:depth=6
src/app/api/_handlers/marketplace/inquiries/route.ts:148:depth=6
src/app/api/_handlers/marketplace/options/route.ts:165:depth=6
src/app/api/_handlers/marketplace/route.ts:209:depth=8
src/app/api/_handlers/nav/counts/route.ts:89:depth=5
src/app/api/_handlers/notifications/client-landed/route.ts:23:depth=5
src/app/api/_handlers/notifications/process-queue/batch.ts:17:depth=5
src/app/api/_handlers/notifications/process-queue/route.ts:74:depth=5
src/app/api/_handlers/notifications/process-queue/route.ts:249:depth=6
src/app/api/_handlers/notifications/retry-failed/route.ts:9:depth=6
src/app/api/_handlers/notifications/schedule-followups/route.ts:77:depth=8
src/app/api/_handlers/notifications/send/route.ts:88:depth=5
src/app/api/_handlers/notifications/send/route.ts:122:depth=6
src/app/api/_handlers/onboarding/first-value/route.ts:23:depth=6
src/app/api/_handlers/onboarding/setup/route.ts:306:depth=8
src/app/api/_handlers/payments/create-order/route.ts:33:depth=6
src/app/api/_handlers/payments/links/route.ts:24:depth=6
src/app/api/_handlers/payments/verify/route.ts:20:depth=6
src/app/api/_handlers/payments/webhook/route.ts:136:depth=5
src/app/api/_handlers/payments/webhook/route.ts:267:depth=6
src/app/api/_handlers/portal/[token]/route.ts:40:depth=7
src/app/api/_handlers/proposals/[id]/convert/route.ts:108:depth=6
src/app/api/_handlers/proposals/[id]/pdf/route.ts:95:depth=6
src/app/api/_handlers/proposals/[id]/send/route.ts:93:depth=7
src/app/api/_handlers/proposals/bulk/route.ts:12:depth=6
src/app/api/_handlers/proposals/create/route.ts:52:depth=5
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:214:depth=6
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:414:depth=7
src/app/api/_handlers/proposals/public/[token]/route.ts:81:depth=14
src/app/api/_handlers/reputation/ai/analyze/route.ts:95:depth=6
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:110:depth=8
src/app/api/_handlers/reputation/ai/respond/route.ts:168:depth=6
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:87:depth=6
src/app/api/_handlers/reputation/analytics/topics/route.ts:18:depth=6
src/app/api/_handlers/reputation/analytics/trends/route.ts:18:depth=5
src/app/api/_handlers/reputation/brand-voice/route.ts:22:depth=6
src/app/api/_handlers/reputation/brand-voice/route.ts:103:depth=6
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:62:depth=6
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:18:depth=10
src/app/api/_handlers/reputation/nps/[token]/route.ts:12:depth=6
src/app/api/_handlers/reputation/nps/submit/route.ts:12:depth=5
src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route.ts:24:depth=6
src/app/api/_handlers/reputation/reviews/[id]/route.ts:61:depth=6
src/app/api/_handlers/reputation/reviews/route.ts:11:depth=6
src/app/api/_handlers/reputation/sync/route.ts:98:depth=12
src/app/api/_handlers/settings/team/invite/route.ts:21:depth=6
src/app/api/_handlers/settings/team/shared.ts:132:depth=5
src/app/api/_handlers/share/[token]/route.ts:147:depth=6
src/app/api/_handlers/social/ai-image/route.ts:94:depth=6
src/app/api/_handlers/social/extract/route.ts:28:depth=6
src/app/api/_handlers/social/process-queue/route.ts:54:depth=8
src/app/api/_handlers/social/publish/route.ts:15:depth=6
src/app/api/_handlers/social/refresh-tokens/route.ts:12:depth=8
src/app/api/_handlers/social/reviews/public/route.ts:62:depth=6
src/app/api/_handlers/social/reviews/public/route.ts:105:depth=6
src/app/api/_handlers/social/schedule/route.ts:16:depth=6
src/app/api/_handlers/social/smart-poster/route.ts:14:depth=8
src/app/api/_handlers/subscriptions/cancel/route.ts:23:depth=5
src/app/api/_handlers/subscriptions/route.ts:102:depth=5
src/app/api/_handlers/subscriptions/route.ts:140:depth=5
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts:48:depth=6
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts:15:depth=6
src/app/api/_handlers/superadmin/announcements/[id]/route.ts:27:depth=5
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:34:depth=7
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:38:depth=5
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:59:depth=6
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:19:depth=8
src/app/api/_handlers/superadmin/cost/trends/route.ts:15:depth=6
src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts:45:depth=6
src/app/api/_handlers/superadmin/referrals/overview/route.ts:36:depth=6
src/app/api/_handlers/superadmin/settings/org-suspend/route.ts:9:depth=5
src/app/api/_handlers/superadmin/users/signups/route.ts:18:depth=5
src/app/api/_handlers/trips/[id]/clone/route.ts:25:depth=8
src/app/api/_handlers/trips/[id]/invoices/route.ts:47:depth=7
src/app/api/_handlers/trips/[id]/route.ts:90:depth=13
src/app/api/_handlers/trips/[id]/route.ts:361:depth=6
src/app/api/_handlers/trips/route.ts:163:depth=6
src/app/api/_handlers/weather/route.ts:28:depth=6
src/app/api/_handlers/webhooks/waha/route.ts:54:depth=7
src/app/api/_handlers/webhooks/whatsapp/route.ts:104:depth=7
src/app/api/_handlers/whatsapp/broadcast/route.ts:342:depth=8
src/app/api/_handlers/whatsapp/conversations/route.ts:45:depth=6
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:54:depth=8
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts:82:depth=6
src/app/api/_handlers/whatsapp/webhook/route.ts:90:depth=7
src/app/api/_handlers/whatsapp/webhook/route.ts:244:depth=5
src/app/auth/page.tsx:14:depth=11
src/app/auth/page.tsx:31:depth=10
src/app/billing/BillingPageClient.tsx:124:depth=7
src/app/billing/BillingPageClient.tsx:221:depth=6
src/app/bookings/page.tsx:39:depth=6
src/app/bookings/page.tsx:65:depth=5
src/app/clients/[id]/ClientEditButton.tsx:48:depth=5
src/app/clients/[id]/page.tsx:40:depth=7
src/app/clients/page.tsx:209:depth=6
src/app/clients/page.tsx:351:depth=5
src/app/dashboard/tasks/page.tsx:688:depth=5
src/app/drivers/page.tsx:61:depth=7
src/app/drivers/page.tsx:225:depth=5
src/app/drivers/page.tsx:295:depth=6
src/app/inbox/page.tsx:56:depth=6
src/app/inbox/page.tsx:73:depth=5
src/app/live/[token]/page.tsx:42:depth=5
src/app/marketplace/[id]/page.tsx:89:depth=7
src/app/marketplace/[id]/page.tsx:108:depth=6
src/app/marketplace/analytics/page.tsx:52:depth=5
src/app/marketplace/inquiries/page.tsx:33:depth=5
src/app/marketplace/page.tsx:43:depth=5
src/app/onboarding/page.tsx:119:depth=7
src/app/onboarding/page.tsx:218:depth=5
src/app/onboarding/page.tsx:264:depth=6
src/app/p/[token]/page.tsx:38:depth=6
src/app/p/[token]/page.tsx:65:depth=5
src/app/pay/[token]/PaymentCheckoutClient.tsx:48:depth=8
src/app/pay/[token]/PaymentCheckoutClient.tsx:68:depth=7
src/app/planner/PastItineraryCard.tsx:44:depth=5
src/app/planner/SaveItineraryButton.tsx:28:depth=8
src/app/planner/SaveItineraryButton.tsx:36:depth=7
src/app/planner/ShareItinerary.tsx:12:depth=6
src/app/planner/ShareItinerary.tsx:19:depth=5
src/app/planner/page.tsx:61:depth=14
src/app/planner/page.tsx:138:depth=13
src/app/planner/page.tsx:157:depth=12
src/app/portal/[token]/page.tsx:82:depth=7
src/app/portal/[token]/page.tsx:90:depth=6
src/app/portal/[token]/page.tsx:93:depth=5
src/app/proposals/[id]/page.tsx:74:depth=5
src/app/proposals/create/_hooks/useCreateProposal.ts:34:depth=8
src/app/proposals/create/_hooks/useCreateProposal.ts:40:depth=7
src/app/proposals/create/_hooks/useProposalData.ts:37:depth=8
src/app/proposals/create/_hooks/useProposalData.ts:79:depth=7
src/app/proposals/page.tsx:92:depth=5
src/app/reputation/_components/CampaignList.tsx:84:depth=5
src/app/reputation/_components/PlatformConnectionCards.tsx:61:depth=5
src/app/reputation/_components/ReputationDashboard.tsx:271:depth=6
src/app/reputation/_components/ReputationDashboard.tsx:427:depth=5
src/app/reputation/_components/ReviewInbox.tsx:229:depth=6
src/app/reputation/_components/ReviewInbox.tsx:261:depth=5
src/app/reputation/_components/ReviewResponsePanel.tsx:61:depth=5
src/app/reputation/_components/useReputationDashboardData.ts:73:depth=5
src/app/reputation/nps/[token]/page.tsx:107:depth=7
src/app/reputation/nps/[token]/page.tsx:118:depth=6
src/app/reputation/nps/[token]/page.tsx:121:depth=5
src/app/settings/_components/IntegrationsTab.tsx:25:depth=6
src/app/settings/_components/IntegrationsTab.tsx:45:depth=5
src/app/settings/_components/MapsDataSection.tsx:14:depth=5
src/app/settings/marketplace/MarketplaceListingPlans.tsx:98:depth=8
src/app/settings/marketplace/MarketplaceListingPlans.tsx:151:depth=7
src/app/settings/marketplace/useMarketplacePresence.ts:96:depth=6
src/app/settings/marketplace/useMarketplacePresence.ts:119:depth=5
src/app/settings/team/useTeamMembers.ts:26:depth=6
src/app/settings/team/useTeamMembers.ts:37:depth=5
src/app/share/[token]/ShareTemplateRenderer.tsx:32:depth=5
src/app/social/_components/AiTab.tsx:65:depth=5
src/app/social/_components/BulkExporter.tsx:100:depth=5
src/app/social/_components/BulkExporter.tsx:128:depth=7
src/app/social/_components/BulkExporter.tsx:149:depth=5
src/app/social/_components/BulkExporter.tsx:192:depth=6
src/app/social/_components/ContentBar.tsx:101:depth=6
src/app/social/_components/ContentBar.tsx:115:depth=5
src/app/social/_components/PublishKitDrawer.tsx:30:depth=6
src/app/social/_components/PublishKitDrawer.tsx:43:depth=5
src/app/social/_components/ReviewsToInsta.tsx:131:depth=10
src/app/social/_components/ReviewsToInsta.tsx:141:depth=9
src/app/social/_components/SocialAnalytics.tsx:48:depth=5
src/app/social/_components/SocialStudioClient.tsx:45:depth=5
src/app/social/_components/StockTab.tsx:41:depth=5
src/app/social/_components/TemplateEditor.tsx:55:depth=5
src/app/social/_components/TemplateGallery.tsx:37:depth=5
src/app/social/_components/TripImporter.tsx:86:depth=13
src/app/social/_components/TripImporter.tsx:146:depth=12
src/app/social/_components/canvas/CanvasPublishModal.tsx:46:depth=6
src/app/social/_components/canvas/CanvasPublishModal.tsx:69:depth=5
src/app/trips/TripCardGrid.tsx:26:depth=7
src/app/trips/[id]/page.tsx:29:depth=5
src/app/trips/utils.ts:113:depth=7
src/app/trips/utils.ts:116:depth=6
src/components/CreateTripModal.tsx:64:depth=8
src/components/CreateTripModal.tsx:318:depth=7
src/components/CurrencyConverter.tsx:59:depth=5
src/components/ShareTripModal.tsx:36:depth=10
src/components/ShareTripModal.tsx:44:depth=9
src/components/VersionDiff.tsx:38:depth=6
src/components/VersionDiff.tsx:58:depth=5
src/components/WeatherWidget.tsx:43:depth=6
src/components/WeatherWidget.tsx:48:depth=5
src/components/admin/ConvertProposalModal.tsx:24:depth=5
src/components/admin/ProposalAddOnsManager.tsx:66:depth=5
src/components/assistant/ConversationHistory.tsx:45:depth=5
src/components/assistant/TourAssistantChat.tsx:13:depth=12
src/components/assistant/TourAssistantChat.tsx:145:depth=11
src/components/assistant/UsageDashboard.tsx:34:depth=6
src/components/assistant/UsageDashboard.tsx:39:depth=5
src/components/assistant/tour-assistant-helpers.tsx:37:depth=7
src/components/assistant/tour-assistant-helpers.tsx:83:depth=6
src/components/bookings/FlightSearch.tsx:69:depth=5
src/components/bookings/HotelSearch.tsx:40:depth=5
src/components/bookings/LocationAutocomplete.tsx:36:depth=6
src/components/bookings/LocationAutocomplete.tsx:61:depth=5
src/components/client/ProposalAddOnsSelector.tsx:52:depth=5
src/components/dashboard/KPICard.tsx:69:depth=6
src/components/dashboard/KPICard.tsx:71:depth=5
src/components/demo/DemoModeBanner.tsx:17:depth=5
src/components/demo/DemoTour.tsx:86:depth=6
src/components/demo/DemoTour.tsx:114:depth=5
src/components/demo/DemoTour.tsx:130:depth=5
src/components/demo/WelcomeModal.tsx:14:depth=10
src/components/demo/WelcomeModal.tsx:20:depth=9
src/components/demo/WelcomeModal.tsx:36:depth=6
src/components/glass/GlassModal.tsx:40:depth=6
src/components/glass/GlassModal.tsx:74:depth=5
src/components/god-mode/TrendChart.tsx:52:depth=5
src/components/india/GSTInvoice.tsx:230:depth=5
src/components/india/UPIPaymentModal.tsx:43:depth=6
src/components/india/UPIPaymentModal.tsx:47:depth=5
src/components/layout/CommandPalette.tsx:22:depth=6
src/components/layout/CommandPalette.tsx:29:depth=5
src/components/layout/useNavCounts.ts:21:depth=7
src/components/layout/useNavCounts.ts:26:depth=6
src/components/layout/useNavCounts.ts:30:depth=5
src/components/leads/LeadToBookingFlow.tsx:421:depth=8
src/components/leads/LeadToBookingFlow.tsx:438:depth=7
src/components/map/ItineraryMap.tsx:93:depth=10
src/components/payments/PaymentLinkButton.tsx:48:depth=5
src/components/payments/PaymentTracker.tsx:63:depth=5
src/components/payments/RazorpayModal.tsx:106:depth=8
src/components/payments/RazorpayModal.tsx:133:depth=7
src/components/pdf/DownloadPDFButton.tsx:20:depth=8
src/components/pdf/DownloadPDFButton.tsx:24:depth=7
src/components/pdf/ProposalPDFButton.tsx:29:depth=7
src/components/pdf/ProposalPDFButton.tsx:74:depth=6
src/components/pdf/itinerary-pdf.tsx:63:depth=8
src/components/planner/ApprovalManager.tsx:51:depth=7
src/components/planner/ApprovalManager.tsx:86:depth=5
src/components/planner/ApprovalManager.tsx:149:depth=5
src/components/planner/ApprovalManager.tsx:289:depth=6
src/components/planner/PricingManager.tsx:22:depth=6
src/components/planner/PricingManager.tsx:25:depth=5
src/components/proposals/ESignature.tsx:33:depth=5
src/components/settings/InviteModal.tsx:42:depth=5
src/components/trips/TripTemplates.tsx:516:depth=5
src/components/ui/AppImage.tsx:8:depth=5
src/components/ui/map/map-core.tsx:130:depth=5
src/components/ui/map/map-layers.tsx:42:depth=5
src/components/ui/map/map-layers.tsx:188:depth=5
src/components/ui/map/map-utils.ts:44:depth=5
src/components/whatsapp/ContextActionModal.tsx:449:depth=6
src/components/whatsapp/ContextActionModal.tsx:456:depth=5
src/components/whatsapp/UnifiedInbox.tsx:58:depth=6
src/components/whatsapp/UnifiedInbox.tsx:244:depth=5
src/components/whatsapp/WhatsAppConnectModal.tsx:38:depth=6
src/components/whatsapp/WhatsAppConnectModal.tsx:121:depth=5
src/components/whatsapp/WhatsAppConnectModal.tsx:147:depth=5
src/components/whatsapp/action-picker/LocationRequestPicker.tsx:24:depth=5
src/components/whatsapp/useSmartReplySuggestions.ts:49:depth=6
src/components/whatsapp/useSmartReplySuggestions.ts:69:depth=5
src/features/admin/analytics/useAdminAnalytics.ts:68:depth=5
src/features/admin/analytics/useAdminAnalytics.ts:290:depth=5
src/features/admin/billing/BillingView.tsx:46:depth=5
src/features/admin/billing/useBillingData.ts:67:depth=11
src/features/admin/billing/useBillingData.ts:83:depth=10
src/features/admin/invoices/useInvoiceDraft.ts:6:depth=6
src/features/admin/invoices/useInvoiceDraft.ts:16:depth=5
src/features/admin/pricing/components/TransactionDetailPanel.tsx:35:depth=5
src/features/admin/pricing/components/TransactionLedger.tsx:43:depth=6
src/features/admin/pricing/components/TripCostEditor.tsx:21:depth=5
src/features/admin/pricing/useOverheads.ts:7:depth=5
src/features/admin/pricing/usePricingDashboard.ts:7:depth=5
src/features/admin/pricing/useTransactions.ts:11:depth=5
src/features/admin/pricing/useTripCosts.ts:7:depth=5
src/features/admin/revenue/useAdminRevenue.ts:84:depth=9
src/features/admin/revenue/useAdminRevenue.ts:97:depth=8
src/features/calendar/BlockDatesModal.tsx:29:depth=5
src/features/calendar/MonthView.tsx:25:depth=5
src/features/calendar/WeekView.tsx:34:depth=7
src/features/calendar/WeekView.tsx:38:depth=6
src/features/calendar/utils.ts:194:depth=5
src/features/calendar/utils.ts:325:depth=8
src/features/trip-detail/TripDetailHeader.tsx:47:depth=5
src/features/trip-detail/tabs/FinancialsTab.tsx:247:depth=5
src/features/trip-detail/tabs/OverviewTab.tsx:35:depth=5
src/hooks/useRealtimeProposal.ts:52:depth=6
src/hooks/useRealtimeProposal.ts:66:depth=5
src/hooks/useRealtimeUpdates.ts:126:depth=5
src/hooks/useShortcuts.ts:7:depth=6
src/hooks/useShortcuts.ts:11:depth=5
src/hooks/useUserTimezone.ts:12:depth=5
src/lib/admin/operator-scorecard-delivery.ts:115:depth=7
src/lib/admin/operator-scorecard.ts:262:depth=10
src/lib/analytics/drill-through-loaders.ts:274:depth=5
src/lib/analytics/template-analytics.ts:183:depth=5
src/lib/api-dispatch.ts:38:depth=7
src/lib/api-dispatch.ts:76:depth=6
src/lib/assistant/actions/reads/clients.ts:237:depth=5
src/lib/assistant/actions/reads/clients.ts:404:depth=6
src/lib/assistant/actions/reads/dashboard.ts:187:depth=7
src/lib/assistant/actions/reads/drivers.ts:71:depth=5
src/lib/assistant/actions/reads/drivers.ts:163:depth=6
src/lib/assistant/actions/reads/invoices.ts:124:depth=6
src/lib/assistant/actions/reads/invoices.ts:268:depth=7
src/lib/assistant/actions/reads/invoices.ts:473:depth=6
src/lib/assistant/actions/reads/proposals.ts:152:depth=5
src/lib/assistant/actions/reads/reports.ts:53:depth=5
src/lib/assistant/actions/reads/trips.ts:79:depth=6
src/lib/assistant/actions/reads/trips.ts:385:depth=8
src/lib/assistant/alerts.ts:83:depth=7
src/lib/assistant/alerts.ts:250:depth=10
src/lib/assistant/briefing.ts:126:depth=5
src/lib/assistant/briefing.ts:209:depth=8
src/lib/assistant/channel-adapters/whatsapp.ts:107:depth=5
src/lib/assistant/channel-adapters/whatsapp.ts:174:depth=5
src/lib/assistant/conversation-store.ts:91:depth=7
src/lib/assistant/conversation-store.ts:204:depth=6
src/lib/assistant/date-parser.ts:54:depth=6
src/lib/assistant/export.ts:122:depth=8
src/lib/assistant/orchestrator.ts:422:depth=6
src/lib/assistant/schema-router.ts:166:depth=6
src/lib/assistant/schema-router.ts:185:depth=6
src/lib/assistant/schema-router.ts:235:depth=5
src/lib/assistant/semantic-response-cache.ts:117:depth=6
src/lib/assistant/usage-meter.ts:131:depth=6
src/lib/assistant/usage-meter.ts:191:depth=6
src/lib/assistant/usage-meter.ts:301:depth=5
src/lib/assistant/weekly-digest.ts:255:depth=5
src/lib/assistant/weekly-digest.ts:316:depth=8
src/lib/cache/upstash.ts:95:depth=6
src/lib/cost/spend-guardrails.ts:141:depth=6
src/lib/demo/demo-mode-context.tsx:35:depth=5
src/lib/embeddings.ts:102:depth=6
src/lib/image-search.ts:41:depth=10
src/lib/image-search.ts:105:depth=7
src/lib/import/pdf-extractor.ts:29:depth=5
src/lib/import/types.ts:41:depth=7
src/lib/import/url-scraper.ts:60:depth=5
src/lib/import/url-scraper.ts:172:depth=5
src/lib/india/formats.ts:10:depth=5
src/lib/leads/intent-parser.ts:40:depth=6
src/lib/network/retry.ts:23:depth=7
src/lib/notifications/browser-push.ts:73:depth=5
src/lib/payments/customer-service.ts:14:depth=6
src/lib/payments/payment-notifications.ts:19:depth=6
src/lib/payments/subscription-service.ts:335:depth=5
src/lib/payments/webhook-handlers.ts:136:depth=10
src/lib/pdf-extractor.ts:88:depth=5
src/lib/pdf-extractor.ts:320:depth=6
src/lib/platform/settings.ts:70:depth=6
src/lib/platform/settings.ts:101:depth=5
src/lib/pwa/offline-mutations.ts:62:depth=5
src/lib/pwa/offline-mutations.ts:248:depth=6
src/lib/queries/proposals.ts:83:depth=5
src/lib/queries/trips.ts:19:depth=5
src/lib/reputation/campaign-trigger.ts:52:depth=8
src/lib/security/admin-mutation-csrf.ts:17:depth=6
src/lib/security/cost-endpoint-guard.ts:149:depth=5
src/lib/security/cron-auth.ts:82:depth=7
src/lib/security/social-oauth-state.ts:78:depth=5
src/lib/social/poster-composer.ts:79:depth=5
src/lib/social/poster-renderer.ts:49:depth=5
src/lib/social/poster-standard-blocks.ts:117:depth=5
src/lib/social/template-selector.ts:58:depth=10
src/lib/trips/conflict-detection.ts:101:depth=5
src/lib/trips/conflict-detection.ts:136:depth=5
src/lib/trips/conflict-detection.ts:186:depth=5
src/lib/trips/conflict-detection.ts:222:depth=8
src/lib/whatsapp/chatbot-flow.ts:417:depth=5
src/lib/whatsapp-waha.server.ts:147:depth=5
src/lib/whatsapp.server.ts:36:depth=8
src/lib/whatsapp.server.ts:163:depth=8
src/lib/whatsapp.server.ts:221:depth=8
src/lib/whatsapp.server.ts:259:depth=8

NON_NULL_ASSERTIONS
src/app/(superadmin)/god/kill-switch/page.tsx:178
src/app/(superadmin)/god/kill-switch/page.tsx:178
src/app/(superadmin)/god/kill-switch/page.tsx:181
src/app/(superadmin)/god/kill-switch/page.tsx:181
src/app/(superadmin)/god/monitoring/page.tsx:172
src/app/admin/notifications/page.tsx:616
src/app/admin/tour-templates/[id]/page.tsx:463
src/app/admin/tour-templates/[id]/page.tsx:465
src/app/admin/trips/[id]/_components/utils.ts:169
src/app/admin/trips/[id]/_components/utils.ts:169
src/app/admin/trips/[id]/_components/utils.ts:176
src/app/admin/trips/[id]/page.tsx:387
src/app/api/_handlers/add-ons/stats/route.ts:87
src/app/api/_handlers/admin/clear-cache/route.ts:82
src/app/api/_handlers/admin/dashboard/stats/route.ts:30
src/app/api/_handlers/admin/leads/[id]/route.ts:58
src/app/api/_handlers/admin/leads/[id]/route.ts:84
src/app/api/_handlers/admin/leads/[id]/route.ts:118
src/app/api/_handlers/admin/leads/[id]/route.ts:126
src/app/api/_handlers/admin/leads/[id]/route.ts:140
src/app/api/_handlers/admin/leads/[id]/route.ts:149
src/app/api/_handlers/admin/leads/[id]/route.ts:152
src/app/api/_handlers/admin/leads/route.ts:58
src/app/api/_handlers/admin/leads/route.ts:128
src/app/api/_handlers/admin/leads/route.ts:165
src/app/api/_handlers/admin/leads/route.ts:176
src/app/api/_handlers/admin/pricing/dashboard/route.ts:40
src/app/api/_handlers/admin/pricing/overheads/route.ts:31
src/app/api/_handlers/admin/pricing/transactions/route.ts:47
src/app/api/_handlers/admin/pricing/transactions/route.ts:53
src/app/api/_handlers/ai/pricing-suggestion/route.ts:27
src/app/api/_handlers/ai/pricing-suggestion/route.ts:27
src/app/api/_handlers/ai/pricing-suggestion/route.ts:29
src/app/api/_handlers/billing/subscription/route.ts:40
src/app/api/_handlers/billing/subscription/route.ts:42
src/app/api/_handlers/billing/subscription/route.ts:43
src/app/api/_handlers/billing/subscription/route.ts:47
src/app/api/_handlers/billing/subscription/route.ts:51
src/app/api/_handlers/billing/subscription/route.ts:59
src/app/api/_handlers/dashboard/schedule/route.ts:97
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:31
src/app/api/_handlers/dashboard/tasks/route.ts:310
src/app/api/_handlers/drivers/search/route.ts:44
src/app/api/_handlers/health/route.ts:168
src/app/api/_handlers/health/route.ts:212
src/app/api/_handlers/health/route.ts:248
src/app/api/_handlers/health/route.ts:272
src/app/api/_handlers/health/route.ts:273
src/app/api/_handlers/health/route.ts:280
src/app/api/_handlers/health/route.ts:281
src/app/api/_handlers/invoices/[id]/pay/route.ts:36
src/app/api/_handlers/invoices/[id]/pay/route.ts:69
src/app/api/_handlers/invoices/[id]/pay/route.ts:120
src/app/api/_handlers/invoices/[id]/pay/route.ts:134
src/app/api/_handlers/invoices/[id]/route.ts:67
src/app/api/_handlers/invoices/[id]/route.ts:78
src/app/api/_handlers/invoices/[id]/route.ts:118
src/app/api/_handlers/invoices/[id]/route.ts:202
src/app/api/_handlers/invoices/[id]/route.ts:243
src/app/api/_handlers/invoices/[id]/route.ts:258
src/app/api/_handlers/invoices/route.ts:45
src/app/api/_handlers/invoices/route.ts:94
src/app/api/_handlers/invoices/send-pdf/route.ts:56
src/app/api/_handlers/notifications/process-queue/route.ts:75
src/app/api/_handlers/notifications/process-queue/route.ts:76
src/app/api/_handlers/notifications/process-queue/route.ts:229
src/app/api/_handlers/payments/create-order/route.ts:82
src/app/api/_handlers/payments/create-order/route.ts:102
src/app/api/_handlers/payments/create-order/route.ts:114
src/app/api/_handlers/payments/links/route.ts:52
src/app/api/_handlers/payments/links/route.ts:74
src/app/api/_handlers/payments/links/route.ts:90
src/app/api/_handlers/proposals/[id]/send/route.ts:245
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:166
src/app/api/_handlers/reputation/dashboard/route.ts:143
src/app/api/_handlers/settings/marketplace/route.ts:93
src/app/api/_handlers/settings/marketplace/route.ts:98
src/app/api/_handlers/settings/marketplace/route.ts:115
src/app/api/_handlers/settings/upi/route.ts:30
src/app/api/_handlers/settings/upi/route.ts:60
src/app/api/_handlers/subscriptions/cancel/route.ts:46
src/app/api/_handlers/subscriptions/route.ts:161
src/app/api/_handlers/subscriptions/route.ts:164
src/app/api/_handlers/subscriptions/route.ts:195
src/app/api/_handlers/whatsapp/broadcast/route.ts:105
src/app/api/_handlers/whatsapp/broadcast/route.ts:118
src/app/api/_handlers/whatsapp/connect/route.ts:47
src/app/api/_handlers/whatsapp/conversations/route.ts:51
src/app/api/_handlers/whatsapp/disconnect/route.ts:20
src/app/api/_handlers/whatsapp/disconnect/route.ts:25
src/app/api/_handlers/whatsapp/disconnect/route.ts:39
src/app/api/_handlers/whatsapp/health/route.ts:16
src/app/api/_handlers/whatsapp/qr/route.ts:17
src/app/api/_handlers/whatsapp/qr/route.ts:22
src/app/api/_handlers/whatsapp/send/route.ts:32
src/app/api/_handlers/whatsapp/status/route.ts:19
src/app/api/_handlers/whatsapp/test-message/route.ts:20
src/app/api/availability/route.ts:52
src/app/api/availability/route.ts:113
src/app/api/availability/route.ts:169
src/app/drivers/page.tsx:252
src/app/drivers/page.tsx:253
src/app/inbox/page.tsx:186
src/app/planner/page.tsx:356
src/app/planner/page.tsx:359
src/app/planner/page.tsx:360
src/app/planner/page.tsx:361
src/app/planner/page.tsx:362
src/app/planner/page.tsx:363
src/app/planner/page.tsx:364
src/app/planner/page.tsx:368
src/app/planner/page.tsx:450
src/app/planner/page.tsx:452
src/app/planner/page.tsx:469
src/app/planner/page.tsx:500
src/app/planner/page.tsx:503
src/app/planner/page.tsx:509
src/app/reputation/_components/CompetitorBenchmark.tsx:124
src/app/social/_components/SocialStudioClient.tsx:445
src/components/assistant/TourAssistantPresentation.tsx:349
src/components/assistant/TourAssistantPresentation.tsx:350
src/components/assistant/TourAssistantPresentation.tsx:366
src/components/assistant/TourAssistantPresentation.tsx:367
src/components/map/ItineraryMap.tsx:262
src/components/map/ItineraryMap.tsx:262
src/components/map/ItineraryMap.tsx:269
src/components/map/ItineraryMap.tsx:368
src/components/map/ItineraryMap.tsx:368
src/components/map/ItineraryMap.tsx:390
src/components/whatsapp/CannedResponses.tsx:151
src/components/whatsapp/CannedResponses.tsx:328
src/components/whatsapp/useSmartReplySuggestions.ts:25
src/features/admin/analytics/useAdminAnalytics.ts:144
src/features/admin/analytics/useAdminAnalytics.ts:159
src/features/admin/analytics/useAdminAnalytics.ts:168
src/features/admin/analytics/useAdminAnalytics.ts:172
src/features/admin/revenue/useAdminRevenue.ts:187
src/features/admin/revenue/useAdminRevenue.ts:188
src/features/admin/revenue/useAdminRevenue.ts:236
src/features/calendar/DayDrawer.tsx:130
src/features/calendar/EventDetailModal.tsx:131
src/features/calendar/utils.ts:218
src/features/calendar/utils.ts:219
src/features/calendar/utils.ts:229
src/features/trip-detail/tabs/ClientCommsTab.tsx:53
src/features/trip-detail/tabs/OverviewTab.tsx:201
src/features/trip-detail/tabs/OverviewTab.tsx:230
src/features/trip-detail/utils.ts:64
src/lib/admin/dashboard-metrics.ts:104
src/lib/admin/dashboard-metrics.ts:111
src/lib/admin/dashboard-metrics.ts:117
src/lib/admin/date-range.ts:116
src/lib/admin/date-range.ts:117
src/lib/assistant/actions/reads/clients.ts:181
src/lib/image-search.ts:85
src/lib/social/review-queue.server.ts:110
src/lib/social/review-queue.server.ts:195
```

### Explicit `any` Occurrences (AST)
```text
src/app/api/_handlers/social/posts/route.ts:88:any
src/app/api/_handlers/superadmin/monitoring/health/route.ts:20:any
src/app/proposals/create/_hooks/useProposalData.ts:7:any
src/components/CreateTripModal.tsx:44:any
src/components/god-mode/TrendChart.tsx:57:any
src/lib/api-dispatch.ts:17:any
src/lib/payments/subscription-service.ts:220:any
src/lib/social/poster-renderer-types.ts:6:any
```

### `@ts-ignore` / `@ts-expect-error`
```text
(none)
```

### Non-Null Assertions (AST)
```text
src/app/(superadmin)/god/kill-switch/page.tsx:178:settings!.org_suspensions
src/app/(superadmin)/god/kill-switch/page.tsx:178:settings
src/app/(superadmin)/god/kill-switch/page.tsx:181:settings!.org_suspensions
src/app/(superadmin)/god/kill-switch/page.tsx:181:settings
src/app/(superadmin)/god/monitoring/page.tsx:172:queues
src/app/admin/notifications/page.tsx:616:row.queue_id
src/app/admin/tour-templates/[id]/page.tsx:463:accommodations[day.id].amenities
src/app/admin/tour-templates/[id]/page.tsx:465:accommodations[day.id].amenities
src/app/admin/trips/[id]/_components/utils.ts:169:optimizedActivities[0]!.start_time
src/app/admin/trips/[id]/_components/utils.ts:169:optimizedActivities[0]
src/app/admin/trips/[id]/_components/utils.ts:176:activity.start_time
src/app/admin/trips/[id]/page.tsx:387:center
src/app/api/_handlers/add-ons/stats/route.ts:87:addOnCounts.get(addOnId)
src/app/api/_handlers/admin/clear-cache/route.ts:82:admin.organizationId
src/app/api/_handlers/admin/dashboard/stats/route.ts:30:resolveScopedOrgWithDemo(req, admin.organizationId)
src/app/api/_handlers/admin/leads/[id]/route.ts:58:admin.organizationId
src/app/api/_handlers/admin/leads/[id]/route.ts:84:admin.organizationId
src/app/api/_handlers/admin/leads/[id]/route.ts:118:nextStage
src/app/api/_handlers/admin/leads/[id]/route.ts:126:admin.organizationId
src/app/api/_handlers/admin/leads/[id]/route.ts:140:admin.organizationId
src/app/api/_handlers/admin/leads/[id]/route.ts:149:nextStage
src/app/api/_handlers/admin/leads/[id]/route.ts:152:admin.organizationId
src/app/api/_handlers/admin/leads/route.ts:58:admin.organizationId
src/app/api/_handlers/admin/leads/route.ts:128:admin.organizationId
src/app/api/_handlers/admin/leads/route.ts:165:admin.organizationId
src/app/api/_handlers/admin/leads/route.ts:176:admin.organizationId
src/app/api/_handlers/admin/pricing/dashboard/route.ts:40:resolveScopedOrgWithDemo(req, admin.organizationId)
src/app/api/_handlers/admin/pricing/overheads/route.ts:31:resolveScopedOrgWithDemo(req, admin.organizationId)
src/app/api/_handlers/admin/pricing/transactions/route.ts:47:resolveScopedOrgWithDemo(req, admin.organizationId)
src/app/api/_handlers/admin/pricing/transactions/route.ts:53:url.searchParams.get("sort")
src/app/api/_handlers/ai/pricing-suggestion/route.ts:27:sorted[middle - 1]
src/app/api/_handlers/ai/pricing-suggestion/route.ts:27:sorted[middle]
src/app/api/_handlers/ai/pricing-suggestion/route.ts:29:sorted[middle]
src/app/api/_handlers/billing/subscription/route.ts:40:organizationId
src/app/api/_handlers/billing/subscription/route.ts:42:organizationId
src/app/api/_handlers/billing/subscription/route.ts:43:organizationId
src/app/api/_handlers/billing/subscription/route.ts:47:organizationId
src/app/api/_handlers/billing/subscription/route.ts:51:organizationId
src/app/api/_handlers/billing/subscription/route.ts:59:organizationId
src/app/api/_handlers/dashboard/schedule/route.ts:97:auth.organizationId
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:31:organizationId
src/app/api/_handlers/dashboard/tasks/route.ts:310:organizationId
src/app/api/_handlers/drivers/search/route.ts:44:auth.organizationId
src/app/api/_handlers/health/route.ts:168:response
src/app/api/_handlers/health/route.ts:212:response
src/app/api/_handlers/health/route.ts:248:response
src/app/api/_handlers/health/route.ts:272:weatherReq.response
src/app/api/_handlers/health/route.ts:273:weatherReq.response
src/app/api/_handlers/health/route.ts:280:currencyReq.response
src/app/api/_handlers/health/route.ts:281:currencyReq.response
src/app/api/_handlers/invoices/[id]/pay/route.ts:36:auth.organizationId
src/app/api/_handlers/invoices/[id]/pay/route.ts:69:auth.organizationId
src/app/api/_handlers/invoices/[id]/pay/route.ts:120:auth.organizationId
src/app/api/_handlers/invoices/[id]/pay/route.ts:134:auth.organizationId
src/app/api/_handlers/invoices/[id]/route.ts:67:auth.organizationId
src/app/api/_handlers/invoices/[id]/route.ts:78:auth.organizationId
src/app/api/_handlers/invoices/[id]/route.ts:118:auth.organizationId
src/app/api/_handlers/invoices/[id]/route.ts:202:auth.organizationId
src/app/api/_handlers/invoices/[id]/route.ts:243:auth.organizationId
src/app/api/_handlers/invoices/[id]/route.ts:258:auth.organizationId
src/app/api/_handlers/invoices/route.ts:45:auth.organizationId
src/app/api/_handlers/invoices/route.ts:94:auth.organizationId
src/app/api/_handlers/invoices/send-pdf/route.ts:56:auth.organizationId
src/app/api/_handlers/notifications/process-queue/route.ts:75:i.trip_id
src/app/api/_handlers/notifications/process-queue/route.ts:76:i.user_id
src/app/api/_handlers/notifications/process-queue/route.ts:229:tripId
src/app/api/_handlers/payments/create-order/route.ts:82:organizationId
src/app/api/_handlers/payments/create-order/route.ts:102:organizationId
src/app/api/_handlers/payments/create-order/route.ts:114:organizationId
src/app/api/_handlers/payments/links/route.ts:52:organizationId
src/app/api/_handlers/payments/links/route.ts:74:organizationId
src/app/api/_handlers/payments/links/route.ts:90:organizationId
src/app/api/_handlers/proposals/[id]/send/route.ts:245:admin.organizationId
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:166:r.response_posted_at
src/app/api/_handlers/reputation/dashboard/route.ts:143:auth.organizationId
src/app/api/_handlers/settings/marketplace/route.ts:93:organizationId
src/app/api/_handlers/settings/marketplace/route.ts:98:organizationId
src/app/api/_handlers/settings/marketplace/route.ts:115:organizationId
src/app/api/_handlers/settings/upi/route.ts:30:organizationId
src/app/api/_handlers/settings/upi/route.ts:60:organizationId
src/app/api/_handlers/subscriptions/cancel/route.ts:46:organizationId
src/app/api/_handlers/subscriptions/route.ts:161:organizationId
src/app/api/_handlers/subscriptions/route.ts:164:organizationId
src/app/api/_handlers/subscriptions/route.ts:195:organizationId
src/app/api/_handlers/whatsapp/broadcast/route.ts:105:organizationId
src/app/api/_handlers/whatsapp/broadcast/route.ts:118:organizationId
src/app/api/_handlers/whatsapp/connect/route.ts:47:organizationId
src/app/api/_handlers/whatsapp/conversations/route.ts:51:organizationId
src/app/api/_handlers/whatsapp/disconnect/route.ts:20:organizationId
src/app/api/_handlers/whatsapp/disconnect/route.ts:25:organizationId
src/app/api/_handlers/whatsapp/disconnect/route.ts:39:organizationId
src/app/api/_handlers/whatsapp/health/route.ts:16:organizationId
src/app/api/_handlers/whatsapp/qr/route.ts:17:organizationId
src/app/api/_handlers/whatsapp/qr/route.ts:22:organizationId
src/app/api/_handlers/whatsapp/send/route.ts:32:organizationId
src/app/api/_handlers/whatsapp/status/route.ts:19:organizationId
src/app/api/_handlers/whatsapp/test-message/route.ts:20:organizationId
src/app/api/availability/route.ts:52:adminResult.organizationId
src/app/api/availability/route.ts:113:admin.organizationId
src/app/api/availability/route.ts:169:admin.organizationId
src/app/drivers/page.tsx:252:formData.full_name
src/app/drivers/page.tsx:253:formData.phone
src/app/inbox/page.tsx:186:TARGET_OPTIONS.find((t) => t.key === state.target)
src/app/planner/page.tsx:356:result
src/app/planner/page.tsx:359:result
src/app/planner/page.tsx:360:result
src/app/planner/page.tsx:361:result
src/app/planner/page.tsx:362:result
src/app/planner/page.tsx:363:result
src/app/planner/page.tsx:364:result
src/app/planner/page.tsx:368:result
src/app/planner/page.tsx:450:result
src/app/planner/page.tsx:452:result
src/app/planner/page.tsx:469:result
src/app/planner/page.tsx:500:result
src/app/planner/page.tsx:503:result
src/app/planner/page.tsx:509:result
src/app/reputation/_components/CompetitorBenchmark.tsx:124:c.latest_rating
src/app/social/_components/SocialStudioClient.tsx:445:data.heroImage
src/components/assistant/TourAssistantPresentation.tsx:349:msg.actionProposal
src/components/assistant/TourAssistantPresentation.tsx:350:msg.actionProposal
src/components/assistant/TourAssistantPresentation.tsx:366:msg.actionProposal
src/components/assistant/TourAssistantPresentation.tsx:367:msg.actionProposal
src/components/map/ItineraryMap.tsx:262:a.coordinates
src/components/map/ItineraryMap.tsx:262:a.coordinates
src/components/map/ItineraryMap.tsx:269:positions[i]
src/components/map/ItineraryMap.tsx:368:act.coordinates
src/components/map/ItineraryMap.tsx:368:act.coordinates
src/components/map/ItineraryMap.tsx:390:driverLocation
src/components/whatsapp/CannedResponses.tsx:151:groups[t.category]
src/components/whatsapp/CannedResponses.tsx:328:templates
src/components/whatsapp/useSmartReplySuggestions.ts:25:message.body
src/features/admin/analytics/useAdminAnalytics.ts:144:monthMap.get(key)
src/features/admin/analytics/useAdminAnalytics.ts:159:monthMap.get(key)
src/features/admin/analytics/useAdminAnalytics.ts:168:monthMap.get(key)
src/features/admin/analytics/useAdminAnalytics.ts:172:monthMap.get(key)
src/features/admin/revenue/useAdminRevenue.ts:187:monthMap.get(monthKey)
src/features/admin/revenue/useAdminRevenue.ts:188:monthMap.get(monthKey)
src/features/admin/revenue/useAdminRevenue.ts:236:monthMap.get(key)
src/features/calendar/DayDrawer.tsx:130:grouped.get(type)
src/features/calendar/EventDetailModal.tsx:131:event.drillHref
src/features/calendar/utils.ts:218:a.endDate
src/features/calendar/utils.ts:219:b.endDate
src/features/calendar/utils.ts:229:event.endDate
src/features/trip-detail/tabs/ClientCommsTab.tsx:53:max
src/features/trip-detail/tabs/OverviewTab.tsx:201:action.tab
src/features/trip-detail/tabs/OverviewTab.tsx:230:max
src/features/trip-detail/utils.ts:64:day.activities[0].start_time
src/lib/admin/dashboard-metrics.ts:104:buckets.get(key)
src/lib/admin/dashboard-metrics.ts:111:buckets.get(key)
src/lib/admin/dashboard-metrics.ts:117:buckets.get(key)
src/lib/admin/date-range.ts:116:safeDate(fallback.from)
src/lib/admin/date-range.ts:117:safeDate(fallback.to)
src/lib/assistant/actions/reads/clients.ts:181:row.profiles
src/lib/image-search.ts:85:queue.shift()
src/lib/social/review-queue.server.ts:110:input.templateId
src/lib/social/review-queue.server.ts:195:input.scheduleDate
```

### Loose Equality (AST)
```text
src/app/(superadmin)/god/announcements/page.tsx:254:ann.recipient_count != null
src/app/admin/notifications/page.tsx:687:item.age_minutes == null
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:57:m.amount_percent != null
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:57:m.amount_fixed != null
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:332:milestone.amount_percent != null
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:334:milestone.amount_fixed != null
src/app/api/_handlers/admin/whatsapp/health/route.ts:221:ageMin == null
src/app/api/_handlers/admin/whatsapp/health/route.ts:241:ageMinutes != null
src/app/api/_handlers/location/ping/route.ts:29:body.heading != null
src/app/api/_handlers/location/ping/route.ts:30:body.speed != null
src/app/api/_handlers/location/ping/route.ts:31:body.accuracy != null
src/app/api/_handlers/reputation/ai/analyze/route.ts:39:rating != null
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:50:rating != null
src/app/clients/[id]/page.tsx:699:proposal.total_price != null
src/app/live/[token]/page.tsx:112:row.heading == null
src/app/live/[token]/page.tsx:113:row.speed == null
src/app/live/[token]/page.tsx:114:row.accuracy == null
src/components/assistant/TourAssistantPresentation.tsx:283:msg.actionResult.data != null
src/components/assistant/tour-assistant-helpers.tsx:47:match[2] != null
src/components/assistant/tour-assistant-helpers.tsx:49:match[3] != null
src/components/assistant/tour-assistant-helpers.tsx:51:match[4] != null
src/components/assistant/tour-assistant-helpers.tsx:61:match[5] != null
src/components/assistant/tour-assistant-helpers.tsx:61:match[6] != null
src/components/ui/toast.tsx:173:message == null
src/components/whatsapp/ContextActionModal.tsx:535:extracted?.group_size != null
src/components/whatsapp/ContextActionModal.tsx:536:extracted?.budget_inr != null
src/features/admin/pricing/components/TripCostEditor.tsx:41:data.cost_amount != null
src/features/admin/pricing/components/TripCostEditor.tsx:42:data.price_amount != null
src/features/admin/pricing/components/TripCostEditor.tsx:43:data.commission_pct != null
src/features/admin/pricing/components/TripCostEditor.tsx:44:data.pax_count != null
src/features/trip-detail/tabs/ClientCommsTab.tsx:49:min == null
src/features/trip-detail/tabs/ClientCommsTab.tsx:49:max == null
src/features/trip-detail/tabs/ClientCommsTab.tsx:51:min != null
src/features/trip-detail/tabs/ClientCommsTab.tsx:51:max != null
src/features/trip-detail/tabs/ClientCommsTab.tsx:52:min != null
src/features/trip-detail/tabs/OverviewTab.tsx:226:min == null
src/features/trip-detail/tabs/OverviewTab.tsx:226:max == null
src/features/trip-detail/tabs/OverviewTab.tsx:228:min != null
src/features/trip-detail/tabs/OverviewTab.tsx:228:max != null
src/features/trip-detail/tabs/OverviewTab.tsx:229:min != null
src/lib/assistant/actions/reads/dashboard.ts:255:row.total_price != null
src/lib/assistant/actions/reads/dashboard.ts:390:p.status != null
src/lib/assistant/actions/reads/dashboard.ts:395:p.status != null
src/lib/notification-templates.ts:61:value == null
src/lib/trips/conflict-detection.ts:85:from.lat == null
src/lib/trips/conflict-detection.ts:85:from.lng == null
src/lib/trips/conflict-detection.ts:86:to.lat == null
src/lib/trips/conflict-detection.ts:86:to.lng == null
```

### Type And Quality Counts
```text
explicit_any_count=8
ts_suppressions_count=0
non_null_assertion_count=157
loose_equality_count=48
todo_fixme_hack_count=1
```

### Dependency / Supply Chain Raw Inventory
```text
REQUIRE_HITS

DYNAMIC_IMPORT_NON_LITERAL_HEURISTIC

DYNAMIC_IMPORT_ALL
src/features/trip-detail/components/TripStatusSidebar.tsx:25:  () => import("@/components/map/ItineraryMap"),
src/app/planner/page.tsx:56:const ItineraryMap = dynamic(() => import("@/components/map/ItineraryMap"), {
src/components/map/ClientItineraryMap.tsx:5:const ItineraryMap = dynamic(() => import("@/components/map/ItineraryMap"), {
src/app/social/_components/canvas/CanvasMode.tsx:95:      const { toPng } = await import("html-to-image");
src/app/social/_components/SocialStudioClient.tsx:23:const MagicPrompter = dynamic(() => import("./MagicPrompter").then((mod) => mod.MagicPrompter));
src/app/social/_components/SocialStudioClient.tsx:24:const CarouselBuilder = dynamic(() => import("./CarouselBuilder").then((mod) => mod.CarouselBuilder));
src/app/social/_components/SocialStudioClient.tsx:25:const MediaLibrary = dynamic(() => import("./MediaLibrary").then((mod) => mod.MediaLibrary));
src/app/social/_components/SocialStudioClient.tsx:26:const ReviewsToInsta = dynamic(() => import("./ReviewsToInsta").then((mod) => mod.ReviewsToInsta));
src/app/social/_components/SocialStudioClient.tsx:27:const PosterExtractor = dynamic(() => import("./PosterExtractor").then((mod) => mod.PosterExtractor));
src/app/social/_components/SocialStudioClient.tsx:28:const PostHistory = dynamic(() => import("./PostHistory").then((mod) => mod.PostHistory));
src/app/social/_components/SocialStudioClient.tsx:29:const SocialAnalytics = dynamic(() => import("./SocialAnalytics").then((mod) => mod.SocialAnalytics));
src/app/social/_components/SocialStudioClient.tsx:30:const BulkExporter = dynamic(() => import("./BulkExporter").then((mod) => mod.BulkExporter));
src/app/social/_components/SocialStudioClient.tsx:31:const TripImporter = dynamic(() => import("./TripImporter").then((mod) => mod.TripImporter));
src/app/admin/trips/[id]/_components/TripHeader.tsx:69:            const { createClient } = await import("@/lib/supabase/client");
src/components/pdf/itinerary-pdf.tsx:220:  const { pdf } = await import('@react-pdf/renderer');
src/components/pdf/itinerary-pdf.tsx:221:  const { default: ItineraryDocument } = await import('./ItineraryDocument');
src/components/pdf/DownloadPDFButton.tsx:43:        const htmlToImage = await import('html-to-image');
src/components/pdf/DownloadPDFButton.tsx:44:        const jspdfModule = await import('jspdf');
src/components/pdf/ProposalPDFButton.tsx:36:      import('@react-pdf/renderer'),
src/components/pdf/ProposalPDFButton.tsx:37:      import('./ProposalDocument'),
src/app/admin/invoices/page.tsx:345:        import("@react-pdf/renderer"),
src/app/admin/invoices/page.tsx:346:        import("@/components/pdf/InvoiceDocument"),
src/app/api/reputation/[...path]/route.ts:6:  ["ai/analyze", () => import("@/app/api/_handlers/reputation/ai/analyze/route")],
src/app/api/reputation/[...path]/route.ts:7:  ["ai/batch-analyze", () => import("@/app/api/_handlers/reputation/ai/batch-analyze/route")],
src/app/api/reputation/[...path]/route.ts:8:  ["ai/respond", () => import("@/app/api/_handlers/reputation/ai/respond/route")],
src/app/api/reputation/[...path]/route.ts:9:  ["analytics/snapshot", () => import("@/app/api/_handlers/reputation/analytics/snapshot/route")],
src/app/api/reputation/[...path]/route.ts:10:  ["analytics/topics", () => import("@/app/api/_handlers/reputation/analytics/topics/route")],
src/app/api/reputation/[...path]/route.ts:11:  ["analytics/trends", () => import("@/app/api/_handlers/reputation/analytics/trends/route")],
src/app/api/reputation/[...path]/route.ts:12:  ["brand-voice", () => import("@/app/api/_handlers/reputation/brand-voice/route")],
src/app/api/reputation/[...path]/route.ts:13:  ["campaigns/trigger", () => import("@/app/api/_handlers/reputation/campaigns/trigger/route")],
src/app/api/reputation/[...path]/route.ts:14:  ["campaigns/:id", () => import("@/app/api/_handlers/reputation/campaigns/[id]/route")],
src/app/api/reputation/[...path]/route.ts:15:  ["campaigns", () => import("@/app/api/_handlers/reputation/campaigns/route")],
src/app/api/reputation/[...path]/route.ts:16:  ["connections", () => import("@/app/api/_handlers/reputation/connections/route")],
src/app/api/reputation/[...path]/route.ts:17:  ["dashboard", () => import("@/app/api/_handlers/reputation/dashboard/route")],
src/app/api/reputation/[...path]/route.ts:18:  ["nps/submit", () => import("@/app/api/_handlers/reputation/nps/submit/route")],
src/app/api/reputation/[...path]/route.ts:19:  ["nps/:token", () => import("@/app/api/_handlers/reputation/nps/[token]/route")],
src/app/api/reputation/[...path]/route.ts:20:  ["sync", () => import("@/app/api/_handlers/reputation/sync/route")],
src/app/api/reputation/[...path]/route.ts:21:  ["reviews/:id/marketing-asset", () => import("@/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route")],
src/app/api/reputation/[...path]/route.ts:22:  ["reviews/:id", () => import("@/app/api/_handlers/reputation/reviews/[id]/route")],
src/app/api/reputation/[...path]/route.ts:23:  ["reviews", () => import("@/app/api/_handlers/reputation/reviews/route")],
src/app/api/reputation/[...path]/route.ts:24:  ["widget/config", () => import("@/app/api/_handlers/reputation/widget/config/route")],
src/app/api/reputation/[...path]/route.ts:25:  ["widget/:token", () => import("@/app/api/_handlers/reputation/widget/[token]/route")],
src/app/api/assistant/[...path]/route.ts:6:  ["chat/stream", () => import("@/app/api/_handlers/assistant/chat/stream/route")],
src/app/api/assistant/[...path]/route.ts:7:  ["chat", () => import("@/app/api/_handlers/assistant/chat/route")],
src/app/api/assistant/[...path]/route.ts:8:  ["confirm", () => import("@/app/api/_handlers/assistant/confirm/route")],
src/app/api/assistant/[...path]/route.ts:9:  ["conversations/:sessionId", () => import("@/app/api/_handlers/assistant/conversations/[sessionId]/route")],
src/app/api/assistant/[...path]/route.ts:10:  ["conversations", () => import("@/app/api/_handlers/assistant/conversations/route")],
src/app/api/assistant/[...path]/route.ts:11:  ["export", () => import("@/app/api/_handlers/assistant/export/route")],
src/app/api/assistant/[...path]/route.ts:12:  ["quick-prompts", () => import("@/app/api/_handlers/assistant/quick-prompts/route")],
src/app/api/assistant/[...path]/route.ts:13:  ["usage", () => import("@/app/api/_handlers/assistant/usage/route")],
src/app/api/social/[...path]/route.ts:6:  ["ai-image", () => import("@/app/api/_handlers/social/ai-image/route")],
src/app/api/social/[...path]/route.ts:7:  ["ai-poster", () => import("@/app/api/_handlers/social/ai-poster/route")],
src/app/api/social/[...path]/route.ts:8:  ["captions", () => import("@/app/api/_handlers/social/captions/route")],
src/app/api/social/[...path]/route.ts:9:  ["connections/:id", () => import("@/app/api/_handlers/social/connections/[id]/route")],
src/app/api/social/[...path]/route.ts:10:  ["connections", () => import("@/app/api/_handlers/social/connections/route")],
src/app/api/social/[...path]/route.ts:11:  ["extract", () => import("@/app/api/_handlers/social/extract/route")],
src/app/api/social/[...path]/route.ts:12:  ["oauth/callback", () => import("@/app/api/_handlers/social/oauth/callback/route")],
src/app/api/social/[...path]/route.ts:13:  ["oauth/facebook", () => import("@/app/api/_handlers/social/oauth/facebook/route")],
src/app/api/social/[...path]/route.ts:14:  ["oauth/google",   () => import("@/app/api/_handlers/social/oauth/google/route")],
src/app/api/social/[...path]/route.ts:15:  ["oauth/linkedin", () => import("@/app/api/_handlers/social/oauth/linkedin/route")],
src/app/api/social/[...path]/route.ts:16:  ["posts/:id/render", () => import("@/app/api/_handlers/social/posts/[id]/render/route")],
src/app/api/social/[...path]/route.ts:17:  ["posts", () => import("@/app/api/_handlers/social/posts/route")],
src/app/api/social/[...path]/route.ts:18:  ["process-queue", () => import("@/app/api/_handlers/social/process-queue/route")],
src/app/api/social/[...path]/route.ts:19:  ["publish", () => import("@/app/api/_handlers/social/publish/route")],
src/app/api/social/[...path]/route.ts:20:  ["refresh-tokens", () => import("@/app/api/_handlers/social/refresh-tokens/route")],
src/app/api/social/[...path]/route.ts:21:  ["render-poster", () => import("@/app/api/_handlers/social/render-poster/route")],
src/app/api/social/[...path]/route.ts:22:  ["reviews/import", () => import("@/app/api/_handlers/social/reviews/import/route")],
src/app/api/social/[...path]/route.ts:23:  ["reviews/public", () => import("@/app/api/_handlers/social/reviews/public/route")],
src/app/api/social/[...path]/route.ts:24:  ["reviews", () => import("@/app/api/_handlers/social/reviews/route")],
src/app/api/social/[...path]/route.ts:25:  ["schedule", () => import("@/app/api/_handlers/social/schedule/route")],
src/app/api/social/[...path]/route.ts:26:  ["smart-poster", () => import("@/app/api/_handlers/social/smart-poster/route")],
src/app/api/[...path]/route.ts:7:  ["ai/draft-review-response", () => import("@/app/api/_handlers/ai/draft-review-response/route")],
src/app/api/[...path]/route.ts:8:  ["ai/pricing-suggestion", () => import("@/app/api/_handlers/ai/pricing-suggestion/route")],
src/app/api/[...path]/route.ts:9:  ["ai/suggest-reply", () => import("@/app/api/_handlers/ai/suggest-reply/route")],
src/app/api/[...path]/route.ts:10:  ["add-ons/stats", () => import("@/app/api/_handlers/add-ons/stats/route")],
src/app/api/[...path]/route.ts:11:  ["add-ons/:id", () => import("@/app/api/_handlers/add-ons/[id]/route")],
src/app/api/[...path]/route.ts:12:  ["add-ons", () => import("@/app/api/_handlers/add-ons/route")],
src/app/api/[...path]/route.ts:13:  ["auth/password-login", () => import("@/app/api/_handlers/auth/password-login/route")],
src/app/api/[...path]/route.ts:14:  ["bookings/flights/search", () => import("@/app/api/_handlers/bookings/flights/search/route")],
src/app/api/[...path]/route.ts:15:  ["bookings/hotels/search", () => import("@/app/api/_handlers/bookings/hotels/search/route")],
src/app/api/[...path]/route.ts:16:  ["bookings/:id/invoice", () => import("@/app/api/_handlers/bookings/[id]/invoice/route")],
src/app/api/[...path]/route.ts:17:  ["bookings/locations/search", () => import("@/app/api/_handlers/bookings/locations/search/route")],
src/app/api/[...path]/route.ts:18:  ["billing/contact-sales", () => import("@/app/api/_handlers/billing/contact-sales/route")],
src/app/api/[...path]/route.ts:19:  ["billing/subscription", () => import("@/app/api/_handlers/billing/subscription/route")],
src/app/api/[...path]/route.ts:20:  ["calendar/events", () => import("@/app/api/_handlers/calendar/events/route")],
src/app/api/[...path]/route.ts:21:  ["cron/assistant-alerts", () => import("@/app/api/_handlers/cron/assistant-alerts/route")],
src/app/api/[...path]/route.ts:22:  ["cron/assistant-briefing", () => import("@/app/api/_handlers/cron/assistant-briefing/route")],
src/app/api/[...path]/route.ts:23:  ["cron/assistant-digest", () => import("@/app/api/_handlers/cron/assistant-digest/route")],
src/app/api/[...path]/route.ts:24:  ["cron/operator-scorecards", () => import("@/app/api/_handlers/cron/operator-scorecards/route")],
src/app/api/[...path]/route.ts:25:  ["cron/reputation-campaigns", () => import("@/app/api/_handlers/cron/reputation-campaigns/route")],
src/app/api/[...path]/route.ts:26:  ["currency", () => import("@/app/api/_handlers/currency/route")],
src/app/api/[...path]/route.ts:27:  ["dashboard/schedule", () => import("@/app/api/_handlers/dashboard/schedule/route")],
src/app/api/[...path]/route.ts:28:  ["dashboard/tasks/dismiss", () => import("@/app/api/_handlers/dashboard/tasks/dismiss/route")],
src/app/api/[...path]/route.ts:29:  ["dashboard/tasks", () => import("@/app/api/_handlers/dashboard/tasks/route")],
src/app/api/[...path]/route.ts:30:  ...(process.env.NODE_ENV !== "production" ? [["debug", () => import("@/app/api/_handlers/debug/route")] satisfies [string, () => Promise<unknown>]] : []),
src/app/api/[...path]/route.ts:31:  ["drivers/search", () => import("@/app/api/_handlers/drivers/search/route")],
src/app/api/[...path]/route.ts:32:  ["emails/welcome", () => import("@/app/api/_handlers/emails/welcome/route")],
src/app/api/[...path]/route.ts:33:  ["health", () => import("@/app/api/_handlers/health/route")],
src/app/api/[...path]/route.ts:34:  ["integrations/places",       () => import("@/app/api/_handlers/integrations/places/route")],
src/app/api/[...path]/route.ts:35:  ["integrations/tripadvisor",  () => import("@/app/api/_handlers/integrations/tripadvisor/route")],
src/app/api/[...path]/route.ts:36:  ["images/pexels", () => import("@/app/api/_handlers/images/pexels/route")],
src/app/api/[...path]/route.ts:37:  ["images/pixabay", () => import("@/app/api/_handlers/images/pixabay/route")],
src/app/api/[...path]/route.ts:38:  ["images/unsplash", () => import("@/app/api/_handlers/images/unsplash/route")],
src/app/api/[...path]/route.ts:39:  ["images", () => import("@/app/api/_handlers/images/route")],
src/app/api/[...path]/route.ts:40:  ["invoices/:id/pay", () => import("@/app/api/_handlers/invoices/[id]/pay/route")],
src/app/api/[...path]/route.ts:41:  ["invoices/send-pdf", () => import("@/app/api/_handlers/invoices/send-pdf/route")],
src/app/api/[...path]/route.ts:42:  ["invoices/:id", () => import("@/app/api/_handlers/invoices/[id]/route")],
src/app/api/[...path]/route.ts:43:  ["invoices", () => import("@/app/api/_handlers/invoices/route")],
src/app/api/[...path]/route.ts:44:  ["itineraries/:id/bookings", () => import("@/app/api/_handlers/itineraries/[id]/bookings/route")],
src/app/api/[...path]/route.ts:45:  ["itineraries/:id/feedback", () => import("@/app/api/_handlers/itineraries/[id]/feedback/route")],
src/app/api/[...path]/route.ts:46:  ["itineraries/:id", () => import("@/app/api/_handlers/itineraries/[id]/route")],
src/app/api/[...path]/route.ts:47:  ["itineraries", () => import("@/app/api/_handlers/itineraries/route")],
src/app/api/[...path]/route.ts:48:  ["itinerary/generate", () => import("@/app/api/_handlers/itinerary/generate/route")],
src/app/api/[...path]/route.ts:49:  ["itinerary/import/pdf", () => import("@/app/api/_handlers/itinerary/import/pdf/route")],
src/app/api/[...path]/route.ts:50:  ["itinerary/import/url", () => import("@/app/api/_handlers/itinerary/import/url/route")],
src/app/api/[...path]/route.ts:51:  ["itinerary/share", () => import("@/app/api/_handlers/itinerary/share/route")],
src/app/api/[...path]/route.ts:52:  ["leads/convert", () => import("@/app/api/_handlers/leads/convert/route")],
src/app/api/[...path]/route.ts:53:  ["location/cleanup-expired", () => import("@/app/api/_handlers/location/cleanup-expired/route")],
src/app/api/[...path]/route.ts:54:  ["location/client-share", () => import("@/app/api/_handlers/location/client-share/route")],
src/app/api/[...path]/route.ts:55:  ["location/live/:token", () => import("@/app/api/_handlers/location/live/[token]/route")],
src/app/api/[...path]/route.ts:56:  ["location/ping", () => import("@/app/api/_handlers/location/ping/route")],
src/app/api/[...path]/route.ts:57:  ["location/share", () => import("@/app/api/_handlers/location/share/route")],
src/app/api/[...path]/route.ts:58:  ["marketplace/:id/inquiry", () => import("@/app/api/_handlers/marketplace/[id]/inquiry/route")],
src/app/api/[...path]/route.ts:59:  ["marketplace/:id/reviews", () => import("@/app/api/_handlers/marketplace/[id]/reviews/route")],
src/app/api/[...path]/route.ts:60:  ["marketplace/:id/view", () => import("@/app/api/_handlers/marketplace/[id]/view/route")],
src/app/api/[...path]/route.ts:61:  ["marketplace/inquiries", () => import("@/app/api/_handlers/marketplace/inquiries/route")],
src/app/api/[...path]/route.ts:62:  ["marketplace/listing-subscription/verify", () => import("@/app/api/_handlers/marketplace/listing-subscription/verify/route")],
src/app/api/[...path]/route.ts:63:  ["marketplace/listing-subscription", () => import("@/app/api/_handlers/marketplace/listing-subscription/route")],
src/app/api/[...path]/route.ts:64:  ["marketplace/options", () => import("@/app/api/_handlers/marketplace/options/route")],
src/app/api/[...path]/route.ts:65:  ["marketplace/stats", () => import("@/app/api/_handlers/marketplace/stats/route")],
src/app/api/[...path]/route.ts:66:  ["marketplace", () => import("@/app/api/_handlers/marketplace/route")],
src/app/api/[...path]/route.ts:67:  ["nav/counts", () => import("@/app/api/_handlers/nav/counts/route")],
src/app/api/[...path]/route.ts:68:  ["notifications/client-landed", () => import("@/app/api/_handlers/notifications/client-landed/route")],
src/app/api/[...path]/route.ts:69:  ["notifications/process-queue", () => import("@/app/api/_handlers/notifications/process-queue/route")],
src/app/api/[...path]/route.ts:70:  ["notifications/retry-failed", () => import("@/app/api/_handlers/notifications/retry-failed/route")],
src/app/api/[...path]/route.ts:71:  ["notifications/schedule-followups", () => import("@/app/api/_handlers/notifications/schedule-followups/route")],
src/app/api/[...path]/route.ts:72:  ["notifications/send", () => import("@/app/api/_handlers/notifications/send/route")],
src/app/api/[...path]/route.ts:73:  ["onboarding/first-value", () => import("@/app/api/_handlers/onboarding/first-value/route")],
src/app/api/[...path]/route.ts:74:  ["onboarding/setup", () => import("@/app/api/_handlers/onboarding/setup/route")],
src/app/api/[...path]/route.ts:75:  ["payments/create-order", () => import("@/app/api/_handlers/payments/create-order/route")],
src/app/api/[...path]/route.ts:76:  ["payments/links/:token", () => import("@/app/api/_handlers/payments/links/[token]/route")],
src/app/api/[...path]/route.ts:77:  ["payments/links", () => import("@/app/api/_handlers/payments/links/route")],
src/app/api/[...path]/route.ts:78:  ["payments/razorpay", () => import("@/app/api/_handlers/payments/razorpay/route")],
src/app/api/[...path]/route.ts:79:  ["payments/track/:token", () => import("@/app/api/_handlers/payments/track/[token]/route")],
src/app/api/[...path]/route.ts:80:  ["payments/verify", () => import("@/app/api/_handlers/payments/verify/route")],
src/app/api/[...path]/route.ts:81:  ["payments/webhook", () => import("@/app/api/_handlers/payments/webhook/route")],
src/app/api/[...path]/route.ts:82:  ["portal/:token", () => import("@/app/api/_handlers/portal/[token]/route")],
src/app/api/[...path]/route.ts:83:  ["proposals/:id/convert", () => import("@/app/api/_handlers/proposals/[id]/convert/route")],
src/app/api/[...path]/route.ts:84:  ["proposals/:id/pdf", () => import("@/app/api/_handlers/proposals/[id]/pdf/route")],
src/app/api/[...path]/route.ts:85:  ["proposals/:id/send", () => import("@/app/api/_handlers/proposals/[id]/send/route")],
src/app/api/[...path]/route.ts:86:  ["proposals/bulk", () => import("@/app/api/_handlers/proposals/bulk/route")],
src/app/api/[...path]/route.ts:87:  ["proposals/create", () => import("@/app/api/_handlers/proposals/create/route")],
src/app/api/[...path]/route.ts:88:  ["proposals/public/:token", () => import("@/app/api/_handlers/proposals/public/[token]/route")],
src/app/api/[...path]/route.ts:89:  ["proposals/send-pdf", () => import("@/app/api/_handlers/proposals/send-pdf/route")],
src/app/api/[...path]/route.ts:90:  ["settings/integrations", () => import("@/app/api/_handlers/settings/integrations/route")],
src/app/api/[...path]/route.ts:91:  ["settings/marketplace", () => import("@/app/api/_handlers/settings/marketplace/route")],
src/app/api/[...path]/route.ts:92:  ["settings/team/:id/resend", () => import("@/app/api/_handlers/settings/team/[id]/resend/route")],
src/app/api/[...path]/route.ts:93:  ["settings/team/invite", () => import("@/app/api/_handlers/settings/team/invite/route")],
src/app/api/[...path]/route.ts:94:  ["settings/team/:id", () => import("@/app/api/_handlers/settings/team/[id]/route")],
src/app/api/[...path]/route.ts:95:  ["settings/team", () => import("@/app/api/_handlers/settings/team/route")],
src/app/api/[...path]/route.ts:96:  ["settings/upi",              () => import("@/app/api/_handlers/settings/upi/route")],
src/app/api/[...path]/route.ts:97:  ["share/:token", () => import("@/app/api/_handlers/share/[token]/route")],
src/app/api/[...path]/route.ts:98:  ["subscriptions/cancel", () => import("@/app/api/_handlers/subscriptions/cancel/route")],
src/app/api/[...path]/route.ts:99:  ["subscriptions/limits", () => import("@/app/api/_handlers/subscriptions/limits/route")],
src/app/api/[...path]/route.ts:100:  ["subscriptions", () => import("@/app/api/_handlers/subscriptions/route")],
src/app/api/[...path]/route.ts:101:  ["support", () => import("@/app/api/_handlers/support/route")],
src/app/api/[...path]/route.ts:102:  ...(process.env.NODE_ENV !== "production" ? [["test-geocoding", () => import("@/app/api/_handlers/test-geocoding/route")] satisfies [string, () => Promise<unknown>]] : []),
src/app/api/[...path]/route.ts:103:  ["trips/:id/add-ons", () => import("@/app/api/_handlers/trips/[id]/add-ons/route")],
src/app/api/[...path]/route.ts:104:  ["trips/:id/clone", () => import("@/app/api/_handlers/trips/[id]/clone/route")],
src/app/api/[...path]/route.ts:105:  ["trips/:id/invoices", () => import("@/app/api/_handlers/trips/[id]/invoices/route")],
src/app/api/[...path]/route.ts:106:  ["trips/:id/notifications", () => import("@/app/api/_handlers/trips/[id]/notifications/route")],
src/app/api/[...path]/route.ts:107:  ["trips/:id", () => import("@/app/api/_handlers/trips/[id]/route")],
src/app/api/[...path]/route.ts:108:  ["trips", () => import("@/app/api/_handlers/trips/route")],
src/app/api/[...path]/route.ts:109:  ["unsplash", () => import("@/app/api/_handlers/unsplash/route")],
src/app/api/[...path]/route.ts:110:  ["weather", () => import("@/app/api/_handlers/weather/route")],
src/app/api/[...path]/route.ts:111:  ["whatsapp/conversations", () => import("@/app/api/_handlers/whatsapp/conversations/route")],
src/app/api/[...path]/route.ts:112:  ["whatsapp/extract-trip-intent", () => import("@/app/api/_handlers/whatsapp/extract-trip-intent/route")],
src/app/api/[...path]/route.ts:113:  ["whatsapp/proposal-drafts/:id", () => import("@/app/api/_handlers/whatsapp/proposal-drafts/[id]/route")],
src/app/api/[...path]/route.ts:114:  ["whatsapp/connect", () => import("@/app/api/_handlers/whatsapp/connect/route")],
src/app/api/[...path]/route.ts:115:  ["whatsapp/disconnect", () => import("@/app/api/_handlers/whatsapp/disconnect/route")],
src/app/api/[...path]/route.ts:116:  ["whatsapp/broadcast", () => import("@/app/api/_handlers/whatsapp/broadcast/route")],
src/app/api/[...path]/route.ts:117:  ["whatsapp/health", () => import("@/app/api/_handlers/whatsapp/health/route")],
src/app/api/[...path]/route.ts:118:  ["whatsapp/qr", () => import("@/app/api/_handlers/whatsapp/qr/route")],
src/app/api/[...path]/route.ts:119:  ["whatsapp/send", () => import("@/app/api/_handlers/whatsapp/send/route")],
src/app/api/[...path]/route.ts:120:  ["whatsapp/status", () => import("@/app/api/_handlers/whatsapp/status/route")],
src/app/api/[...path]/route.ts:121:  ["whatsapp/test-message", () => import("@/app/api/_handlers/whatsapp/test-message/route")],
src/app/api/[...path]/route.ts:122:  ["whatsapp/webhook", () => import("@/app/api/_handlers/whatsapp/webhook/route")],
src/app/api/[...path]/route.ts:123:  ["webhooks/waha", () => import("@/app/api/_handlers/webhooks/waha/route")],
src/app/api/admin/[...path]/route.ts:12:  ["cache-metrics", () => import("@/app/api/_handlers/admin/cache-metrics/route")],
src/app/api/admin/[...path]/route.ts:13:  ["clear-cache", () => import("@/app/api/_handlers/admin/clear-cache/route")],
src/app/api/admin/[...path]/route.ts:14:  ["clients", () => import("@/app/api/_handlers/admin/clients/route")],
src/app/api/admin/[...path]/route.ts:15:  ["contacts/:id/promote", () => import("@/app/api/_handlers/admin/contacts/[id]/promote/route")],
src/app/api/admin/[...path]/route.ts:16:  ["dashboard/stats", () => import("@/app/api/_handlers/admin/dashboard/stats/route")],
src/app/api/admin/[...path]/route.ts:17:  ["contacts", () => import("@/app/api/_handlers/admin/contacts/route")],
src/app/api/admin/[...path]/route.ts:18:  ["cost/alerts/ack", () => import("@/app/api/_handlers/admin/cost/alerts/ack/route")],
src/app/api/admin/[...path]/route.ts:19:  ["cost/overview", () => import("@/app/api/_handlers/admin/cost/overview/route")],
src/app/api/admin/[...path]/route.ts:20:  ["generate-embeddings", () => import("@/app/api/_handlers/admin/generate-embeddings/route")],
src/app/api/admin/[...path]/route.ts:21:  ["geocoding/usage", () => import("@/app/api/_handlers/admin/geocoding/usage/route")],
src/app/api/admin/[...path]/route.ts:22:  ["leads/:id", () => import("@/app/api/_handlers/admin/leads/[id]/route")],
src/app/api/admin/[...path]/route.ts:23:  ["leads", () => import("@/app/api/_handlers/admin/leads/route")],
src/app/api/admin/[...path]/route.ts:24:  ["insights/action-queue", () => import("@/app/api/_handlers/admin/insights/action-queue/route")],
src/app/api/admin/[...path]/route.ts:25:  ["insights/ai-usage", () => import("@/app/api/_handlers/admin/insights/ai-usage/route")],
src/app/api/admin/[...path]/route.ts:26:  ["insights/auto-requote", () => import("@/app/api/_handlers/admin/insights/auto-requote/route")],
src/app/api/admin/[...path]/route.ts:27:  ["insights/batch-jobs", () => import("@/app/api/_handlers/admin/insights/batch-jobs/route")],
src/app/api/admin/[...path]/route.ts:28:  ["insights/best-quote", () => import("@/app/api/_handlers/admin/insights/best-quote/route")],
src/app/api/admin/[...path]/route.ts:29:  ["insights/daily-brief", () => import("@/app/api/_handlers/admin/insights/daily-brief/route")],
src/app/api/admin/[...path]/route.ts:30:  ["insights/margin-leak", () => import("@/app/api/_handlers/admin/insights/margin-leak/route")],
src/app/api/admin/[...path]/route.ts:31:  ["insights/ops-copilot", () => import("@/app/api/_handlers/admin/insights/ops-copilot/route")],
src/app/api/admin/[...path]/route.ts:32:  ["insights/proposal-risk", () => import("@/app/api/_handlers/admin/insights/proposal-risk/route")],
src/app/api/admin/[...path]/route.ts:33:  ["insights/roi", () => import("@/app/api/_handlers/admin/insights/roi/route")],
src/app/api/admin/[...path]/route.ts:34:  ["insights/smart-upsell-timing", () => import("@/app/api/_handlers/admin/insights/smart-upsell-timing/route")],
src/app/api/admin/[...path]/route.ts:35:  ["insights/upsell-recommendations", () => import("@/app/api/_handlers/admin/insights/upsell-recommendations/route")],
src/app/api/admin/[...path]/route.ts:36:  ["insights/win-loss", () => import("@/app/api/_handlers/admin/insights/win-loss/route")],
src/app/api/admin/[...path]/route.ts:37:  ["marketplace/verify", () => import("@/app/api/_handlers/admin/marketplace/verify/route")],
src/app/api/admin/[...path]/route.ts:38:  ["destinations", () => import("@/app/api/_handlers/admin/destinations/route")],
src/app/api/admin/[...path]/route.ts:39:  ["funnel", () => import("@/app/api/_handlers/admin/funnel/route")],
src/app/api/admin/[...path]/route.ts:40:  ["ltv", () => import("@/app/api/_handlers/admin/ltv/route")],
src/app/api/admin/[...path]/route.ts:41:  ["notifications/delivery/retry", () => import("@/app/api/_handlers/admin/notifications/delivery/retry/route")],
src/app/api/admin/[...path]/route.ts:42:  ["notifications/delivery", () => import("@/app/api/_handlers/admin/notifications/delivery/route")],
src/app/api/admin/[...path]/route.ts:43:  ["operations/command-center", () => import("@/app/api/_handlers/admin/operations/command-center/route")],
src/app/api/admin/[...path]/route.ts:44:  ["pdf-imports/upload", () => import("@/app/api/_handlers/admin/pdf-imports/upload/route")],
src/app/api/admin/[...path]/route.ts:45:  ["pdf-imports/:id", () => import("@/app/api/_handlers/admin/pdf-imports/[id]/route")],
src/app/api/admin/[...path]/route.ts:46:  ["pdf-imports", () => import("@/app/api/_handlers/admin/pdf-imports/route")],
src/app/api/admin/[...path]/route.ts:47:  ["proposals/:id/payment-plan", () => import("@/app/api/_handlers/admin/proposals/[id]/payment-plan/route")],
src/app/api/admin/[...path]/route.ts:48:  ["proposals/:id/tiers", () => import("@/app/api/_handlers/admin/proposals/[id]/tiers/route")],
src/app/api/admin/[...path]/route.ts:49:  ["referrals", () => import("@/app/api/_handlers/admin/referrals/route")],
src/app/api/admin/[...path]/route.ts:50:  ["reports/destinations", () => import("@/app/api/_handlers/admin/reports/destinations/route")],
src/app/api/admin/[...path]/route.ts:51:  ["reports/gst", () => import("@/app/api/_handlers/admin/reports/gst/route")],
src/app/api/admin/[...path]/route.ts:52:  ["reports/operators", () => import("@/app/api/_handlers/admin/reports/operators/route")],
src/app/api/admin/[...path]/route.ts:53:  ["reputation/client-referrals", () => import("@/app/api/_handlers/admin/reputation/client-referrals/route")],
src/app/api/admin/[...path]/route.ts:54:  ["security/diagnostics", () => import("@/app/api/_handlers/admin/security/diagnostics/route")],
src/app/api/admin/[...path]/route.ts:55:  ["social/generate", () => import("@/app/api/_handlers/admin/social/generate/route")],
src/app/api/admin/[...path]/route.ts:56:  ["tour-templates/extract", () => import("@/app/api/_handlers/admin/tour-templates/extract/route")],
src/app/api/admin/[...path]/route.ts:57:  ["trips/:id/clone", () => import("@/app/api/_handlers/admin/trips/[id]/clone/route")],
src/app/api/admin/[...path]/route.ts:58:  ["trips/:id", () => import("@/app/api/_handlers/admin/trips/[id]/route")],
src/app/api/admin/[...path]/route.ts:59:  ["trips", () => import("@/app/api/_handlers/admin/trips/route")],
src/app/api/admin/[...path]/route.ts:60:  ["whatsapp/health", () => import("@/app/api/_handlers/admin/whatsapp/health/route")],
src/app/api/admin/[...path]/route.ts:61:  ["whatsapp/normalize-driver-phones", () => import("@/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route")],
src/app/api/admin/[...path]/route.ts:62:  ["workflow/events", () => import("@/app/api/_handlers/admin/workflow/events/route")],
src/app/api/admin/[...path]/route.ts:63:  ["workflow/rules", () => import("@/app/api/_handlers/admin/workflow/rules/route")],
src/app/api/admin/[...path]/route.ts:64:  ["pricing/dashboard", () => import("@/app/api/_handlers/admin/pricing/dashboard/route")],
src/app/api/admin/[...path]/route.ts:65:  ["pricing/trips", () => import("@/app/api/_handlers/admin/pricing/trips/route")],
src/app/api/admin/[...path]/route.ts:66:  ["pricing/trip-costs/:id", () => import("@/app/api/_handlers/admin/pricing/trip-costs/[id]/route")],
src/app/api/admin/[...path]/route.ts:67:  ["pricing/trip-costs", () => import("@/app/api/_handlers/admin/pricing/trip-costs/route")],
src/app/api/admin/[...path]/route.ts:68:  ["pricing/overheads/:id", () => import("@/app/api/_handlers/admin/pricing/overheads/[id]/route")],
src/app/api/admin/[...path]/route.ts:69:  ["pricing/overheads", () => import("@/app/api/_handlers/admin/pricing/overheads/route")],
src/app/api/admin/[...path]/route.ts:70:  ["pricing/vendor-history", () => import("@/app/api/_handlers/admin/pricing/vendor-history/route")],
src/app/api/admin/[...path]/route.ts:71:  ["pricing/transactions", () => import("@/app/api/_handlers/admin/pricing/transactions/route")],
src/app/api/admin/[...path]/route.ts:72:  ["revenue", () => import("@/app/api/_handlers/admin/revenue/route")],
src/app/api/admin/[...path]/route.ts:73:  ["seed-demo", () => import("@/app/api/_handlers/admin/seed-demo/route")],
src/app/api/superadmin/[...path]/route.ts:15:  ["me", () => import("@/app/api/_handlers/superadmin/me/route")],
src/app/api/superadmin/[...path]/route.ts:16:  ["overview", () => import("@/app/api/_handlers/superadmin/overview/route")],
src/app/api/superadmin/[...path]/route.ts:17:  ["users/signups", () => import("@/app/api/_handlers/superadmin/users/signups/route")],
src/app/api/superadmin/[...path]/route.ts:18:  ["users/directory", () => import("@/app/api/_handlers/superadmin/users/directory/route")],
src/app/api/superadmin/[...path]/route.ts:19:  ["users/:id", () => import("@/app/api/_handlers/superadmin/users/[id]/route")],
src/app/api/superadmin/[...path]/route.ts:20:  ["analytics/feature-usage/:feature", () => import("@/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route")],
src/app/api/superadmin/[...path]/route.ts:21:  ["analytics/feature-usage", () => import("@/app/api/_handlers/superadmin/analytics/feature-usage/route")],
src/app/api/superadmin/[...path]/route.ts:22:  ["cost/aggregate", () => import("@/app/api/_handlers/superadmin/cost/aggregate/route")],
src/app/api/superadmin/[...path]/route.ts:23:  ["cost/trends", () => import("@/app/api/_handlers/superadmin/cost/trends/route")],
src/app/api/superadmin/[...path]/route.ts:24:  ["cost/org/:orgId", () => import("@/app/api/_handlers/superadmin/cost/org/[orgId]/route")],
src/app/api/superadmin/[...path]/route.ts:25:  ["referrals/overview", () => import("@/app/api/_handlers/superadmin/referrals/overview/route")],
src/app/api/superadmin/[...path]/route.ts:26:  ["referrals/detail/:type", () => import("@/app/api/_handlers/superadmin/referrals/detail/[type]/route")],
src/app/api/superadmin/[...path]/route.ts:27:  ["announcements/:id/send", () => import("@/app/api/_handlers/superadmin/announcements/[id]/send/route")],
src/app/api/superadmin/[...path]/route.ts:28:  ["announcements/:id", () => import("@/app/api/_handlers/superadmin/announcements/[id]/route")],
src/app/api/superadmin/[...path]/route.ts:29:  ["announcements", () => import("@/app/api/_handlers/superadmin/announcements/route")],
src/app/api/superadmin/[...path]/route.ts:30:  ["support/tickets/:id/respond", () => import("@/app/api/_handlers/superadmin/support/tickets/[id]/respond/route")],
src/app/api/superadmin/[...path]/route.ts:31:  ["support/tickets/:id", () => import("@/app/api/_handlers/superadmin/support/tickets/[id]/route")],
src/app/api/superadmin/[...path]/route.ts:32:  ["support/tickets", () => import("@/app/api/_handlers/superadmin/support/tickets/route")],
src/app/api/superadmin/[...path]/route.ts:33:  ["settings/kill-switch", () => import("@/app/api/_handlers/superadmin/settings/kill-switch/route")],
src/app/api/superadmin/[...path]/route.ts:34:  ["settings/org-suspend", () => import("@/app/api/_handlers/superadmin/settings/org-suspend/route")],
src/app/api/superadmin/[...path]/route.ts:35:  ["settings", () => import("@/app/api/_handlers/superadmin/settings/route")],
src/app/api/superadmin/[...path]/route.ts:36:  ["monitoring/health", () => import("@/app/api/_handlers/superadmin/monitoring/health/route")],
src/app/api/superadmin/[...path]/route.ts:37:  ["monitoring/queues", () => import("@/app/api/_handlers/superadmin/monitoring/queues/route")],
src/app/api/superadmin/[...path]/route.ts:38:  ["audit-log", () => import("@/app/api/_handlers/superadmin/audit-log/route")],
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:221:  supabase: ReturnType<typeof import("@/lib/supabase/admin")["createAdminClient"]>
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:301:  supabase: ReturnType<typeof import("@/lib/supabase/admin")["createAdminClient"]>
src/app/api/_handlers/invoices/[id]/route.ts:38:  adminClient: ReturnType<(typeof import("@/lib/supabase/admin"))["createAdminClient"]>,
src/app/api/_handlers/admin/marketplace/verify/route.ts:309:            const { sendVerificationNotification } = await import("@/lib/marketplace-emails");
src/app/api/_handlers/social/smart-poster/route.ts:46:        const { GoogleGenerativeAI } = await import("@google/generative-ai");
src/app/api/_handlers/social/smart-poster/route.ts:83:        const { fal } = await import("@fal-ai/client");
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:209:            const { sendInquiryNotification } = await import("@/lib/marketplace-emails");
```

### Missing Package Imports
```text
(none)
```

### Dependency Counts
```text
require_hits=0
dynamic_import_non_literal_hits=0
dynamic_import_all_hits=281
missing_package_import_hits=0
```

### Accessibility Raw Hits
```text
IMG_TAGS
src/components/proposals/ESignature.tsx:205:            <img
src/components/itinerary-templates/LuxuryResortView.tsx:171:                                                    <img
src/components/itinerary-templates/VisualJourneyView.tsx:25:                <img
src/components/itinerary-templates/VisualJourneyView.tsx:203:                                                <img
src/components/itinerary-templates/UrbanBriefView.tsx:190:                          <img
src/components/itinerary-templates/SafariStoryView.tsx:237:                                  <img
src/components/itinerary-templates/ProfessionalView.tsx:37:                                <img
src/components/itinerary-templates/ProfessionalView.tsx:212:                                                            <img
src/features/admin/invoices/InvoiceLivePreview.tsx:69:                  <img
src/app/trips/TripCardGrid.tsx:111:                                            <img
src/features/admin/invoices/helpers.ts:76:    ? `<img src="${org.logo_url}" alt="${org?.name || "Logo"}" style="width:56px;height:56px;object-fit:contain;border-radius:8px;border:1px solid #e2e8f0;margin-right:14px;" />`
src/components/templates/ItineraryTemplateClassic.tsx:153:                                                    <img
src/components/templates/ItineraryTemplateModern.tsx:13:                    <img
src/components/templates/ItineraryTemplateModern.tsx:159:                                                                <img
src/app/social/_components/BackgroundPicker.tsx:78:                                <img
src/app/social/_components/PostHistory.tsx:147:                                        <img
src/app/social/_components/MediaLibrary.tsx:210:                            <img
src/app/social/_components/canvas/CanvasEditorPanel.tsx:140:            <img
src/app/social/_components/canvas/CanvasEditorPanel.tsx:180:              <img
src/app/social/_components/StockTab.tsx:205:                                        <img
src/app/social/_components/StockTab.tsx:240:                                    <img
src/app/social/_components/GallerySlotPicker.tsx:100:                            <img
src/app/social/_components/GallerySlotPicker.tsx:149:                                    <img
src/app/social/_components/AiTab.tsx:356:                                            <img
src/components/itinerary/ProfessionalItineraryView.tsx:61:                            <img
src/components/itinerary/ProfessionalItineraryView.tsx:290:                    <img

ICON_ONLY_BUTTON_HEURISTIC

NON_INTERACTIVE_ONCLICK
src/app/planner/PastItineraryCard.tsx:150:                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
src/app/planner/PastItineraryCard.tsx:312:                <div onClick={(e) => e.stopPropagation()}>

HREF_HASH_OR_JSVOID
```

### Accessibility Counts
```text
img_tag_hits=26
non_interactive_onclick_hits=2
href_hash_jsvoid_hits=0
```

### Security Candidate Inventory
```text
SERVICE_ROLE_CLIENT_USAGE
src/app/api/availability/route.ts:48:    const admin = adminResult.adminClient;
src/app/api/availability/route.ts:110:    const { data, error } = await admin.adminClient
src/app/api/availability/route.ts:165:    const { error } = await admin.adminClient
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
src/lib/notifications.ts:5:const supabaseAdmin = createAdminClient();
src/lib/notifications.ts:43:        const { error } = await supabaseAdmin.functions.invoke("send-notification", {
src/lib/notifications.ts:63:        await supabaseAdmin.from("notification_logs").insert({
src/lib/notifications.ts:96:        const { data: trip, error: tripError } = await supabaseAdmin
src/lib/cost/alert-ack.ts:21:  adminClient: AdminClient;
src/lib/cost/alert-ack.ts:29:  adminClient: AdminClient;
src/lib/cost/alert-ack.ts:66:  adminClient: AdminClient;
src/lib/cost/alert-ack.ts:81:  await params.adminClient.from("notification_logs").insert({
src/lib/cost/alert-ack.ts:93:  adminClient: AdminClient;
src/lib/cost/alert-ack.ts:103:  let query = params.adminClient
src/lib/cost/alert-ack.ts:163:  const upsertResult = await params.adminClient
src/lib/cost/alert-ack.ts:174:    const { error: historyError } = await params.adminClient
src/lib/cost/alert-ack.ts:192:    adminClient: params.adminClient,
src/lib/cost/alert-ack.ts:220:  let query = params.adminClient
src/lib/cost/alert-ack.ts:237:      adminClient: params.adminClient,
src/lib/auth/admin.ts:37:  adminClient: ReturnType<typeof createAdminClient>;
src/lib/auth/admin.ts:79:  adminClient: ReturnType<typeof createAdminClient>;
src/lib/auth/admin.ts:121:    await params.adminClient.from("notification_logs").insert({
src/lib/auth/admin.ts:137:  adminClient: ReturnType<typeof createAdminClient>,
src/lib/auth/admin.ts:145:    } = await adminClient.auth.getUser(token);
src/lib/auth/admin.ts:167:  const adminClient = createAdminClient();
src/lib/auth/admin.ts:173:  const userId = await getUserIdFromRequest(request, adminClient);
src/lib/auth/admin.ts:176:      adminClient,
src/lib/auth/admin.ts:199:  const { data: profile, error: profileError } = await adminClient
src/lib/auth/admin.ts:207:      adminClient,
src/lib/auth/admin.ts:221:      adminClient,
src/lib/auth/admin.ts:239:      adminClient,
src/lib/auth/admin.ts:254:        adminClient,
src/lib/auth/admin.ts:274:    adminClient,
src/lib/ai/cost-guardrails.ts:27:  const admin = createAdminClient();
src/lib/ai/cost-guardrails.ts:126:  const admin = createAdminClient();
src/lib/payments/payment-utils.ts:30:  return context === 'admin' ? createAdminClient() : createClient();
src/lib/platform/audit.ts:24:    const adminClient = createAdminClient();
src/lib/platform/audit.ts:25:    await adminClient.from("platform_audit_log").insert({
src/lib/platform/audit.ts:47:    const adminClient = createAdminClient();
src/lib/platform/audit.ts:48:    await adminClient.from("platform_audit_log").insert({
src/lib/platform/settings.ts:60:  const adminClient = createAdminClient();
src/lib/platform/settings.ts:61:  const { data } = await adminClient
src/lib/platform/settings.ts:102:  const adminClient = createAdminClient();
src/lib/platform/settings.ts:104:  await adminClient.from("platform_settings").upsert({
src/lib/platform/settings.ts:198:  const adminClient = createAdminClient();
src/lib/platform/settings.ts:199:  const { data } = await adminClient
src/lib/security/admin-bearer-auth.ts:3:const supabaseAdmin = createAdminClient();
src/lib/security/admin-bearer-auth.ts:17:    await supabaseAdmin.auth.getUser(token);
src/lib/security/admin-bearer-auth.ts:20:  const { data: profile } = await supabaseAdmin
src/lib/assistant/alerts.ts:209:    const supabase = createAdminClient();
src/lib/assistant/alerts.ts:257:  const supabase = createAdminClient();
src/lib/security/cost-endpoint-guard.ts:120:    const adminClient = createAdminClient();
src/lib/security/cost-endpoint-guard.ts:122:    await adminClient.from("notification_logs").insert({
src/lib/supabase/admin.ts:18:export function createAdminClient() {
src/lib/reputation/referral-flywheel.ts:111:    const supabase = createAdminClient();
src/lib/reputation/referral-flywheel.ts:157:    const supabase = createAdminClient();
src/lib/admin/operator-scorecard.ts:501:  adminClient?: AdminClient;
src/lib/admin/operator-scorecard.ts:503:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard.ts:548:  adminClient?: AdminClient;
src/lib/admin/operator-scorecard.ts:554:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard.ts:558:    adminClient: admin,
src/lib/invoices/module.ts:372:  adminClient: ReturnType<typeof createAdminClient>,
src/lib/invoices/module.ts:378:  const { data: latest } = await adminClient
src/app/api/_handlers/invoices/[id]/route.ts:38:  adminClient: ReturnType<(typeof import("@/lib/supabase/admin"))["createAdminClient"]>,
src/app/api/_handlers/invoices/[id]/route.ts:44:  const { data: invoiceData, error } = await adminClient
src/app/api/_handlers/invoices/[id]/route.ts:65:    const adminClient = auth.adminClient;
src/app/api/_handlers/invoices/[id]/route.ts:67:    const { invoice, error } = await loadInvoiceForOrg(adminClient, id, auth.organizationId!);
src/app/api/_handlers/invoices/[id]/route.ts:74:    const { data: paymentsData, error: paymentsError } = await adminClient
src/app/api/_handlers/invoices/[id]/route.ts:117:    const adminClient = auth.adminClient;
src/app/api/_handlers/invoices/[id]/route.ts:118:    const { invoice, error } = await loadInvoiceForOrg(adminClient, id, auth.organizationId!);
src/app/api/_handlers/invoices/[id]/route.ts:198:    const { data: updatedInvoiceData, error: updateError } = await adminClient
src/app/api/_handlers/invoices/[id]/route.ts:241:    const adminClient = auth.adminClient;
src/app/api/_handlers/invoices/[id]/route.ts:243:    const { invoice, error } = await loadInvoiceForOrg(adminClient, id, auth.organizationId!);
src/app/api/_handlers/invoices/[id]/route.ts:254:    const { error: deleteError } = await adminClient
src/lib/admin/operator-scorecard-delivery.ts:48:  adminClient?: AdminClient;
src/lib/admin/operator-scorecard-delivery.ts:50:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard-delivery.ts:54:    adminClient: admin,
src/lib/admin/operator-scorecard-delivery.ts:96:    adminClient: admin,
src/lib/admin/operator-scorecard-delivery.ts:116:  const admin = createAdminClient();
src/lib/admin/operator-scorecard-delivery.ts:142:        adminClient: admin,
src/app/api/_handlers/webhooks/waha/route.ts:85:    const admin = createAdminClient();
src/app/api/_handlers/invoices/[id]/pay/route.ts:30:    const adminClient = auth.adminClient;
src/app/api/_handlers/invoices/[id]/pay/route.ts:32:    const { data: invoiceData, error: invoiceError } = await adminClient
src/app/api/_handlers/invoices/[id]/pay/route.ts:66:    const { data: paymentData, error: paymentError } = await adminClient
src/app/api/_handlers/invoices/[id]/pay/route.ts:107:    const { data: updatedInvoiceData, error: invoiceUpdateError } = await adminClient
src/app/api/_handlers/invoices/[id]/pay/route.ts:130:    const { data: paymentsData, error: paymentsError } = await adminClient
src/app/api/_handlers/payments/verify/route.ts:28:    const admin = createAdminClient();
src/app/api/_handlers/invoices/route.ts:41:    const adminClient = auth.adminClient;
src/app/api/_handlers/invoices/route.ts:42:    let query = adminClient
src/app/api/_handlers/invoices/route.ts:93:    const adminClient = auth.adminClient;
src/app/api/_handlers/invoices/route.ts:105:    const { data: organizationData, error: organizationError } = await adminClient
src/app/api/_handlers/invoices/route.ts:118:      const { data: profileData, error: profileError } = await adminClient
src/app/api/_handlers/invoices/route.ts:147:    const invoiceNumber = await getNextInvoiceNumber(adminClient, organizationId);
src/app/api/_handlers/invoices/route.ts:165:    const { data: createdInvoiceData, error: insertError } = await adminClient
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
src/app/api/_handlers/payments/track/[token]/route.ts:35:    const admin = createAdminClient();
src/app/api/_handlers/payments/track/[token]/route.ts:69:    const admin = createAdminClient();
src/app/api/_handlers/nav/counts/route.ts:28:    const admin = createAdminClient();
src/app/api/_handlers/payments/links/route.ts:33:    const { userId, organizationId, adminClient } = auth;
src/app/api/_handlers/payments/links/route.ts:43:    const admin = adminClient;
src/app/api/_handlers/payments/webhook/route.ts:281:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:394:    const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:461:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:494:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:524:  const supabase = createAdminClient();
src/app/api/_handlers/cron/reputation-campaigns/route.ts:40:    const supabase = createAdminClient();
src/app/api/_handlers/payments/links/[token]/route.ts:47:    const admin = createAdminClient();
src/app/api/_handlers/payments/links/[token]/route.ts:97:    const admin = createAdminClient();
src/app/api/_handlers/settings/team/shared.ts:190:  const admin = createAdminClient();
src/app/api/_handlers/portal/[token]/route.ts:58:    const admin = createAdminClient();
src/app/api/_handlers/admin/reports/operators/route.ts:25:        const { data, error } = await admin.adminClient
src/app/api/_handlers/drivers/search/route.ts:16:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/drivers/search/route.ts:56:        let query = supabaseAdmin
src/app/api/_handlers/drivers/search/route.ts:84:        const { data: assignments, error: assignError } = await supabaseAdmin
src/app/api/_handlers/settings/marketplace/route.ts:85:    const { organizationId, adminClient } = auth;
src/app/api/_handlers/settings/marketplace/route.ts:86:    const admin = adminClient;
src/lib/assistant/orchestrator.ts:436:  const adminClient = createAdminClient();
src/lib/assistant/orchestrator.ts:441:    supabase: adminClient,
src/app/api/_handlers/admin/reports/gst/route.ts:36:    const { organizationId, adminClient } = authResult;
src/app/api/_handlers/admin/reports/gst/route.ts:46:    let query = adminClient
src/app/api/_handlers/proposals/create/route.ts:88:    const { data: template } = await admin.adminClient
src/app/api/_handlers/proposals/create/route.ts:98:    const { data: clientProfile } = await admin.adminClient
src/app/api/_handlers/proposals/create/route.ts:109:      admin.adminClient,
src/app/api/_handlers/proposals/create/route.ts:118:    const { data: proposalId, error: cloneError } = await admin.adminClient.rpc(
src/app/api/_handlers/proposals/create/route.ts:131:    const { data: activeAddOns } = await admin.adminClient
src/app/api/_handlers/proposals/create/route.ts:178:      await admin.adminClient.from("proposal_add_ons").insert(insertPayload);
src/app/api/_handlers/proposals/create/route.ts:181:    const { data: newPrice } = await admin.adminClient.rpc("calculate_proposal_price", {
src/app/api/_handlers/proposals/create/route.ts:186:      await admin.adminClient
src/app/api/_handlers/proposals/create/route.ts:204:      await admin.adminClient.from("proposals").update(proposalUpdates).eq("id", proposalId);
src/app/api/_handlers/proposals/create/route.ts:208:      admin.adminClient,
src/app/api/_handlers/bookings/[id]/invoice/route.ts:42:async function loadInvoice(adminClient: ReturnType<typeof createAdminClient>, id: string) {
src/app/api/_handlers/bookings/[id]/invoice/route.ts:43:  const { data: byIdData, error: byIdError } = await adminClient
src/app/api/_handlers/bookings/[id]/invoice/route.ts:53:  const { data: byTripData, error: byTripError } = await adminClient
src/app/api/_handlers/bookings/[id]/invoice/route.ts:75:    const adminClient = createAdminClient();
src/app/api/_handlers/bookings/[id]/invoice/route.ts:76:    const invoice = await loadInvoice(adminClient, id);
src/lib/assistant/channel-adapters/whatsapp.ts:79:  const supabase = createAdminClient();
src/lib/assistant/channel-adapters/whatsapp.ts:206:  const adminClient = createAdminClient();
src/lib/assistant/channel-adapters/whatsapp.ts:211:    supabase: adminClient,
src/lib/assistant/briefing.ts:128:    const supabase = createAdminClient();
src/lib/assistant/briefing.ts:216:  const supabase = createAdminClient();
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
src/app/api/_handlers/settings/upi/route.ts:15:        const { organizationId, adminClient } = auth;
src/app/api/_handlers/settings/upi/route.ts:28:        const { error: upsertError } = await adminClient.from('organization_settings').upsert(
src/app/api/_handlers/settings/upi/route.ts:55:        const { organizationId, adminClient } = auth;
src/app/api/_handlers/settings/upi/route.ts:57:        const { data: settings } = await adminClient
src/app/api/_handlers/invoices/send-pdf/route.ts:52:    const { data: invoice, error: invoiceError } = await auth.adminClient
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:81:    let contactQuery = admin.adminClient
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:104:        const { data: existingByEmail } = await admin.adminClient
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:116:      const { data: existingByPhone } = await admin.adminClient
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:134:      const { data: created, error: createError } = await admin.adminClient.auth.admin.createUser({
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:151:    const { error: updateError } = await admin.adminClient
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:175:    await admin.adminClient
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:184:    await admin.adminClient.from('workflow_stage_events').insert({
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
src/app/api/_handlers/admin/contacts/route.ts:96:    let query = admin.adminClient
src/app/api/_handlers/admin/contacts/route.ts:205:        const { data: existingByEmail } = await admin.adminClient
src/app/api/_handlers/admin/contacts/route.ts:216:        const { data: existingByPhone } = await admin.adminClient
src/app/api/_handlers/admin/contacts/route.ts:227:        const { error } = await admin.adminClient
src/app/api/_handlers/admin/contacts/route.ts:244:      const { error } = await admin.adminClient
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:143:  const supabase = admin.adminClient;
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:195:  const supabase = admin.adminClient;
src/lib/assistant/weekly-digest.ts:257:    const supabase = createAdminClient();
src/lib/assistant/weekly-digest.ts:320:  const supabase = createAdminClient();
src/app/api/_handlers/social/process-queue/route.ts:67:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/process-queue/route.ts:71:        const { data: pendingItems, error: fetchError } = await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:92:            const { data: claimedRows } = await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:106:                    await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:128:                await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:152:                await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:175:            const { data: remaining } = await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:185:                await supabaseAdmin
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:44:    const { data: proposal, error } = await admin.adminClient
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:123:    const { data: updated, error } = await admin.adminClient
src/app/api/_handlers/admin/leads/[id]/route.ts:54:  const { data: lead, error } = await admin.adminClient
src/app/api/_handlers/admin/leads/[id]/route.ts:80:  const { data: existing, error: fetchError } = await admin.adminClient
src/app/api/_handlers/admin/leads/[id]/route.ts:122:  const { data: leadData, error: updateError } = await admin.adminClient
src/app/api/_handlers/admin/leads/[id]/route.ts:138:  await admin.adminClient.from("lead_events").insert({
src/app/api/_handlers/admin/leads/[id]/route.ts:151:      await admin.adminClient.from("conversion_events").insert({
src/app/api/_handlers/proposals/[id]/send/route.ts:119:  const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/proposals/[id]/send/route.ts:120:  const { data: proposalData, error: proposalError } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/send/route.ts:233:  await supabaseAdmin
src/app/api/_handlers/proposals/[id]/send/route.ts:244:      supabase: supabaseAdmin,
src/app/api/_handlers/proposals/[id]/send/route.ts:252:  await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/admin/leads/route.ts:55:  let query = admin.adminClient
src/app/api/_handlers/admin/leads/route.ts:147:  const { data: leadData, error } = await admin.adminClient
src/app/api/_handlers/admin/leads/route.ts:164:    admin.adminClient.from("conversion_events").insert({
src/app/api/_handlers/admin/leads/route.ts:174:    admin.adminClient.from("lead_events").insert({
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:68:    let query = admin.adminClient
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:94:      const { error: updateError } = await admin.adminClient
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:104:    await admin.adminClient.from("notification_logs").insert({
src/app/api/_handlers/admin/social/generate/route.ts:271:    const { data: itineraryRow, error: itineraryError } = await admin.adminClient
src/app/api/_handlers/assistant/quick-prompts/route.ts:45:  const admin = createAdminClient();
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts:19:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts:20:    const db = adminClient;
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts:49:        const topOrgsResult = await adminClient
src/app/api/_handlers/admin/referrals/route.ts:45:    const { data: profile } = await admin.adminClient
src/app/api/_handlers/admin/referrals/route.ts:61:    const { data: referrals, error: refError } = await admin.adminClient
src/app/api/_handlers/admin/referrals/route.ts:143:    const { data: referrerProfile } = await admin.adminClient
src/app/api/_handlers/admin/referrals/route.ts:167:    const { data: myOrg } = await admin.adminClient
src/app/api/_handlers/admin/referrals/route.ts:189:      const { data: circularCheck } = await admin.adminClient
src/app/api/_handlers/admin/referrals/route.ts:204:    const { error: insertError } = await admin.adminClient
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts:58:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts:64:        const rawAdminClient = adminClient as unknown as UntypedAdminClient;
src/app/api/_handlers/assistant/conversations/[sessionId]/route.ts:48:      supabase: createAdminClient(),
src/app/api/_handlers/superadmin/overview/route.ts:20:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/overview/route.ts:32:            adminClient.from("profiles").select("id", { count: "exact", head: true }),
src/app/api/_handlers/superadmin/overview/route.ts:33:            adminClient.from("organizations").select("id", { count: "exact", head: true }),
src/app/api/_handlers/superadmin/overview/route.ts:34:            adminClient.from("trips").select("id", { count: "exact", head: true })
src/app/api/_handlers/superadmin/overview/route.ts:36:            adminClient.from("proposals").select("id", { count: "exact", head: true }),
src/app/api/_handlers/superadmin/overview/route.ts:37:            adminClient.from("support_tickets").select("id", { count: "exact", head: true })
src/app/api/_handlers/superadmin/overview/route.ts:39:            adminClient.from("subscriptions").select("amount").eq("status", "active"),
src/app/api/_handlers/superadmin/overview/route.ts:40:            adminClient.from("profiles").select("created_at")
src/app/api/_handlers/admin/dashboard/stats/route.ts:31:    const db = admin.adminClient;
src/app/api/_handlers/assistant/conversations/route.ts:47:    supabase: createAdminClient(),
src/app/api/_handlers/admin/destinations/route.ts:37:    const { data, error } = await admin.adminClient
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:11:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:15:            adminClient
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:21:            adminClient
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:25:            adminClient
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:28:            adminClient
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:32:            adminClient
src/app/api/_handlers/admin/whatsapp/health/route.ts:84:    let driverProfilesQuery = admin.adminClient
src/app/api/_handlers/admin/whatsapp/health/route.ts:88:    let activeTripsQuery = admin.adminClient
src/app/api/_handlers/admin/whatsapp/health/route.ts:93:    let externalDriversQuery = admin.adminClient
src/app/api/_handlers/admin/whatsapp/health/route.ts:137:            admin.adminClient
src/app/api/_handlers/admin/whatsapp/health/route.ts:142:            admin.adminClient
src/app/api/_handlers/admin/whatsapp/health/route.ts:154:          admin.adminClient
src/app/api/_handlers/admin/whatsapp/health/route.ts:158:          admin.adminClient
src/app/api/_handlers/admin/whatsapp/health/route.ts:173:        ? await admin.adminClient
src/app/api/_handlers/admin/whatsapp/health/route.ts:196:      const { data: locationData } = await admin.adminClient
src/app/api/_handlers/assistant/usage/route.ts:40:      supabase: createAdminClient(),
src/app/api/_handlers/superadmin/monitoring/health/route.ts:47:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/monitoring/health/route.ts:51:            checkDatabase(adminClient),
src/app/api/_handlers/superadmin/monitoring/health/route.ts:53:            adminClient
src/app/api/_handlers/superadmin/monitoring/health/route.ts:58:            adminClient
src/app/api/_handlers/superadmin/monitoring/health/route.ts:61:            adminClient
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:123:    const { data: existingImport } = await admin.adminClient
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:144:    const { error: uploadError } = await admin.adminClient.storage
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:159:    const { data: publicUrlData } = admin.adminClient.storage
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:163:    const { data: pdfImport, error: insertError } = await admin.adminClient
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:178:      await admin.adminClient.storage.from("pdf-imports").remove([fileName]);
src/app/api/_handlers/admin/notifications/delivery/route.ts:94:        let query = admin.adminClient
src/app/api/_handlers/admin/notifications/delivery/route.ts:126:        const { data: groupedRows, error: groupedError } = await admin.adminClient
src/app/api/_handlers/assistant/confirm/route.ts:70:    const adminClient = createAdminClient();
src/app/api/_handlers/assistant/confirm/route.ts:75:      supabase: adminClient,
src/app/api/_handlers/superadmin/users/[id]/route.ts:15:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/users/[id]/route.ts:19:            adminClient
src/app/api/_handlers/superadmin/users/[id]/route.ts:24:            adminClient.from("trips").select("id", { count: "exact", head: true }).eq("created_by", id),
src/app/api/_handlers/superadmin/users/[id]/route.ts:25:            adminClient.from("proposals").select("id", { count: "exact", head: true }).eq("created_by", id),
src/app/api/_handlers/superadmin/users/[id]/route.ts:26:            adminClient
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:23:    adminClient: Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>["adminClient"],
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:26:    const { data: queueRow } = await adminClient
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:35:        const { data: trip } = await adminClient
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:44:        const { data: profile } = await adminClient
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:89:        const queueOrg = await resolveQueueOrg(admin.adminClient, queueId);
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:97:        const { data: updatedRows, error } = await admin.adminClient
src/app/api/_handlers/admin/security/diagnostics/route.ts:57:      admin.adminClient
src/app/api/_handlers/admin/security/diagnostics/route.ts:61:      admin.adminClient
src/app/api/_handlers/admin/security/diagnostics/route.ts:65:      admin.adminClient
src/app/api/_handlers/admin/security/diagnostics/route.ts:70:      admin.adminClient
src/app/api/_handlers/admin/security/diagnostics/route.ts:75:      admin.adminClient.rpc("get_rls_diagnostics"),
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
src/app/api/_handlers/admin/funnel/route.ts:24:    const db = admin.adminClient;
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
src/app/api/_handlers/admin/ltv/route.ts:27:    const { data } = await admin.adminClient
src/app/api/_handlers/superadmin/users/signups/route.ts:22:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/users/signups/route.ts:30:        let profilesQuery = adminClient
src/app/api/_handlers/superadmin/users/signups/route.ts:40:            adminClient.from("profiles").select("id", { count: "exact", head: true }),
src/app/api/_handlers/superadmin/users/signups/route.ts:41:            adminClient.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", monthStart()),
src/app/api/_handlers/superadmin/users/signups/route.ts:43:                ? adminClient.from("organizations").select("id", { count: "exact", head: true }).gte("created_at", since)
src/app/api/_handlers/superadmin/users/signups/route.ts:44:                : adminClient.from("organizations").select("id", { count: "exact", head: true }),
src/app/api/_handlers/superadmin/users/signups/route.ts:60:        const trendQuery = adminClient
src/app/api/_handlers/social/refresh-tokens/route.ts:31:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/refresh-tokens/route.ts:36:        const { data: expiringConnections, error } = await supabaseAdmin
src/app/api/_handlers/social/refresh-tokens/route.ts:78:                    await supabaseAdmin
src/app/api/_handlers/social/refresh-tokens/route.ts:87:                    await supabaseAdmin
src/app/api/_handlers/assistant/chat/stream/route.ts:385:    const adminClient = createAdminClient();
src/app/api/_handlers/assistant/chat/stream/route.ts:390:      supabase: adminClient,
src/app/api/_handlers/assistant/chat/stream/route.ts:457:      getOrganizationName(adminClient, organizationId),
src/app/api/_handlers/admin/pricing/trips/route.ts:42:    const db = admin.adminClient;
src/app/api/_handlers/admin/pricing/trips/route.ts:75:      const { data: clients } = await (admin.adminClient as unknown as SupabaseClient)
src/app/api/_handlers/superadmin/users/directory/route.ts:11:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/users/directory/route.ts:20:        let query = adminClient
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
src/app/api/_handlers/admin/pricing/vendor-history/route.ts:34:    const db = admin.adminClient;
src/app/api/_handlers/admin/insights/ai-usage/route.ts:28:      admin.adminClient
src/app/api/_handlers/admin/insights/ai-usage/route.ts:33:      admin.adminClient
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:51:  const { data: row, error } = await admin.adminClient
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:226:        const { error } = await admin.adminClient
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:251:        const { error } = await admin.adminClient
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:382:    const { error: deleteError } = await admin.adminClient
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:401:          await admin.adminClient.storage.from("pdf-imports").remove([fileName]);
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
src/app/api/_handlers/admin/pdf-imports/route.ts:97:    let query = admin.adminClient
src/app/api/_handlers/location/share/route.ts:13:    let query = admin.adminClient
src/app/api/_handlers/location/share/route.ts:47:        let query = admin.adminClient
src/app/api/_handlers/location/share/route.ts:96:        const existingQuery = admin.adminClient
src/app/api/_handlers/location/share/route.ts:122:        const { data, error } = await admin.adminClient
src/app/api/_handlers/location/share/route.ts:168:            const { data: share, error: shareError } = await admin.adminClient
src/app/api/_handlers/location/share/route.ts:186:        let query = admin.adminClient.from("trip_location_shares").update({
src/app/api/_handlers/location/share/route.ts:206:        await admin.adminClient.from("notification_logs").insert({
src/app/api/_handlers/admin/insights/win-loss/route.ts:27:    const { data, error } = await admin.adminClient
src/app/api/_handlers/emails/welcome/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/emails/welcome/route.ts:18:        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/emails/welcome/route.ts:34:        const { data: profile, error: profileError } = await supabaseAdmin
src/app/api/_handlers/emails/welcome/route.ts:59:            await supabaseAdmin
src/app/api/_handlers/admin/operations/command-center/route.ts:233:      admin.adminClient
src/app/api/_handlers/admin/operations/command-center/route.ts:242:      admin.adminClient
src/app/api/_handlers/admin/operations/command-center/route.ts:249:      admin.adminClient
src/app/api/_handlers/admin/operations/command-center/route.ts:257:      admin.adminClient
src/app/api/_handlers/admin/operations/command-center/route.ts:284:      client: admin.adminClient,
src/app/api/_handlers/admin/operations/command-center/route.ts:316:        ? admin.adminClient.from("itineraries").select("id,trip_title,destination").in("id", itineraryIds)
src/app/api/_handlers/admin/operations/command-center/route.ts:319:        ? admin.adminClient.from("profiles").select("id,full_name").in("id", clientIds)
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:25:    const { data, error } = await admin.adminClient
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:71:    const { data, error } = await admin.adminClient
src/app/api/_handlers/location/live/[token]/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/live/[token]/route.ts:37:        const { count: recentCount } = await supabaseAdmin
src/app/api/_handlers/location/live/[token]/route.ts:48:        void supabaseAdmin.from("trip_location_share_access_logs").insert({
src/app/api/_handlers/location/live/[token]/route.ts:53:        const { data: share, error: shareError } = await supabaseAdmin
src/app/api/_handlers/location/live/[token]/route.ts:83:        const { data: latestLocation } = await supabaseAdmin
src/app/api/_handlers/location/live/[token]/route.ts:91:        const assignmentQuery = supabaseAdmin
src/app/api/_handlers/superadmin/support/tickets/[id]/respond/route.ts:16:    const { adminClient, userId } = auth;
src/app/api/_handlers/superadmin/support/tickets/[id]/respond/route.ts:33:        const result = await adminClient
src/app/api/_handlers/location/client-share/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/client-share/route.ts:21:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/location/client-share/route.ts:32:        const { data: trip } = await supabaseAdmin
src/app/api/_handlers/location/client-share/route.ts:47:        let existingQuery = supabaseAdmin
src/app/api/_handlers/location/client-share/route.ts:74:        const { data: inserted, error: insertError } = await supabaseAdmin
src/app/api/_handlers/proposals/bulk/route.ts:29:    const admin = createAdminClient();
src/app/api/_handlers/admin/geocoding/usage/route.ts:15:        await admin.adminClient.from("notification_logs").insert({
src/app/api/_handlers/admin/pricing/transactions/route.ts:55:    const db = admin.adminClient;
src/app/api/_handlers/admin/pricing/transactions/route.ts:101:      const { data: clientsData } = await admin.adminClient
src/app/api/_handlers/location/ping/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/ping/route.ts:20:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/location/ping/route.ts:42:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:48:        const { data: trip } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:62:        const { data: assignmentRows } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:73:            const { data: driverAccount } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:90:        const { data: latestPing } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:106:        const { error: insertError } = await supabaseAdmin
src/app/api/_handlers/location/cleanup-expired/route.ts:10:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/cleanup-expired/route.ts:15:    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/location/cleanup-expired/route.ts:18:    const { data: profile } = await supabaseAdmin
src/app/api/_handlers/location/cleanup-expired/route.ts:59:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/location/cleanup-expired/route.ts:72:            await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/admin/pricing/dashboard/route.ts:41:    const db = admin.adminClient;
src/app/api/_handlers/admin/seed-demo/route.ts:68:  const supabase = admin.adminClient;
src/app/api/_handlers/whatsapp/broadcast/route.ts:100:  const { userId, organizationId, adminClient } = auth;
src/app/api/_handlers/whatsapp/broadcast/route.ts:102:  const { data: connection, error: connectionError } = await adminClient
src/app/api/_handlers/whatsapp/broadcast/route.ts:116:    admin: adminClient,
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:58:        const { userId, organizationId, adminClient } = authResult;
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:74:        const { data: events, error: eventsError } = await adminClient
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:134:        const { data: draft, error: insertError } = await adminClient
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:31:    const db = admin.adminClient;
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:79:    const db = admin.adminClient;
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:115:    const db = admin.adminClient;
src/app/api/_handlers/admin/cost/overview/route.ts:86:        await admin.adminClient
src/app/api/_handlers/admin/cost/overview/route.ts:110:      let logsQuery = admin.adminClient
src/app/api/_handlers/admin/cost/overview/route.ts:148:      let recentCostLogsQuery = admin.adminClient
src/app/api/_handlers/admin/cost/overview/route.ts:170:      let authFailureQuery = admin.adminClient
src/app/api/_handlers/admin/cost/overview/route.ts:203:      let profileQuery = admin.adminClient
src/app/api/_handlers/admin/cost/overview/route.ts:335:          admin.adminClient
src/app/api/_handlers/admin/cost/overview/route.ts:339:          admin.adminClient
src/app/api/_handlers/admin/cost/overview/route.ts:557:      adminClient: admin.adminClient,
src/app/api/_handlers/admin/cost/overview/route.ts:568:      let weeklyRevenueQuery = admin.adminClient
src/app/api/_handlers/admin/cost/overview/route.ts:614:          admin.adminClient
src/app/api/_handlers/admin/cost/overview/route.ts:618:          admin.adminClient
src/app/api/_handlers/admin/pricing/overheads/route.ts:47:    const db = admin.adminClient;
src/app/api/_handlers/admin/pricing/overheads/route.ts:95:    const db = admin.adminClient;
src/app/api/_handlers/whatsapp/send/route.ts:18:    const { userId, organizationId, adminClient } = auth;
src/app/api/_handlers/whatsapp/send/route.ts:28:    const admin = adminClient;
src/app/api/_handlers/integrations/tripadvisor/route.ts:39:        const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/integrations/tripadvisor/route.ts:40:        await supabaseAdmin.from('organization_settings').upsert(
src/app/api/_handlers/integrations/tripadvisor/route.ts:77:        const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/integrations/tripadvisor/route.ts:79:        const { data: settings } = await supabaseAdmin
src/app/api/_handlers/admin/insights/auto-requote/route.ts:31:    const { data, error } = await admin.adminClient
src/app/api/_handlers/superadmin/support/tickets/[id]/route.ts:45:    const db = auth.adminClient as unknown as UntypedClient;
src/app/api/_handlers/superadmin/support/tickets/route.ts:38:    const db = auth.adminClient as unknown as UntypedClient;
src/app/api/_handlers/integrations/places/route.ts:14:>["adminClient"];
src/app/api/_handlers/integrations/places/route.ts:17:  supabaseAdmin: AdminClient,
src/app/api/_handlers/integrations/places/route.ts:20:  const { data: connection } = await supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:33:  supabaseAdmin: AdminClient,
src/app/api/_handlers/integrations/places/route.ts:38:  const existingConnection = await getGooglePlaceConnection(supabaseAdmin, organizationId);
src/app/api/_handlers/integrations/places/route.ts:41:    await supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:53:    await supabaseAdmin.from("reputation_platform_connections").insert({
src/app/api/_handlers/integrations/places/route.ts:63:  await supabaseAdmin.from("organization_settings").upsert(
src/app/api/_handlers/integrations/places/route.ts:120:    const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/integrations/places/route.ts:123:      supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:128:      getGooglePlaceConnection(supabaseAdmin, organizationId),
src/app/api/_handlers/integrations/places/route.ts:159:    const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/integrations/places/route.ts:161:      await ensureGooglePlaceConfigured(supabaseAdmin, organizationId, googlePlaceId);
src/app/api/_handlers/integrations/places/route.ts:169:    await supabaseAdmin.from("organization_settings").upsert(
src/app/api/_handlers/whatsapp/connect/route.ts:32:        const { userId, organizationId, adminClient } = auth;
src/app/api/_handlers/whatsapp/connect/route.ts:53:        const admin = adminClient;
src/app/api/_handlers/admin/insights/best-quote/route.ts:50:    const { data: addOnData, error: addOnError } = await admin.adminClient
src/app/api/_handlers/admin/insights/best-quote/route.ts:73:      const { data: proposal } = await admin.adminClient
src/app/api/_handlers/admin/insights/best-quote/route.ts:86:      const { data: selectedAddOns } = await admin.adminClient
src/app/api/_handlers/admin/insights/best-quote/route.ts:99:      const { data: proposals } = await admin.adminClient
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:37:    const db = admin.adminClient;
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:81:    const db = admin.adminClient;
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:117:    const db = admin.adminClient;
src/app/api/_handlers/superadmin/audit-log/route.ts:11:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/audit-log/route.ts:18:        let query = adminClient
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:53:      admin.adminClient
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:62:      admin.adminClient
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:70:      admin.adminClient
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:77:      admin.adminClient
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:87:      admin.adminClient
src/app/api/_handlers/whatsapp/disconnect/route.ts:18:        const { organizationId, adminClient } = auth;
src/app/api/_handlers/whatsapp/disconnect/route.ts:22:        const { data: connection } = await adminClient
src/app/api/_handlers/whatsapp/disconnect/route.ts:30:        const { error: updateError } = await adminClient
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:36:    const db = admin.adminClient;
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:84:    const db = admin.adminClient;
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:100:        const adminClient = createAdminClient();
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:101:        const { data: share, error: shareError } = await adminClient
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:188:        const { error: updateError } = await adminClient
src/app/api/_handlers/admin/insights/proposal-risk/route.ts:38:    const { data: proposals, error } = await admin.adminClient
src/app/api/_handlers/admin/insights/proposal-risk/route.ts:58:      const { data: clients } = await admin.adminClient
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:39:    const { adminClient, userId } = auth;
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:42:        const announcementResult = await adminClient
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:57:        let profilesQuery = adminClient
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:66:            const orgsResult = await adminClient
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:96:        await adminClient
src/app/api/_handlers/admin/insights/daily-brief/route.ts:31:      admin.adminClient
src/app/api/_handlers/admin/insights/daily-brief/route.ts:39:      admin.adminClient
src/app/api/_handlers/admin/insights/daily-brief/route.ts:46:      admin.adminClient
src/app/api/_handlers/admin/insights/daily-brief/route.ts:51:      admin.adminClient
src/app/api/_handlers/admin/insights/daily-brief/route.ts:56:      admin.adminClient
src/app/api/_handlers/whatsapp/conversations/route.ts:50:      const { organizationId, adminClient } = auth;
src/app/api/_handlers/whatsapp/conversations/route.ts:63:      const { data: events, error } = await adminClient
src/app/api/_handlers/whatsapp/conversations/route.ts:99:      const { data: profiles } = await adminClient
src/app/api/_handlers/superadmin/announcements/[id]/route.ts:32:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/announcements/[id]/route.ts:41:        const current = await adminClient
src/app/api/_handlers/superadmin/announcements/[id]/route.ts:58:        const result = await adminClient
src/app/api/_handlers/health/route.ts:30:const supabaseAdmin =
src/app/api/_handlers/health/route.ts:32:        ? createAdminClient()
src/app/api/_handlers/health/route.ts:106:    if (!supabaseAdmin) {
src/app/api/_handlers/health/route.ts:111:    const { error } = await supabaseAdmin
src/app/api/_handlers/health/route.ts:300:    if (!supabaseAdmin) {
src/app/api/_handlers/health/route.ts:305:        supabaseAdmin
src/app/api/_handlers/health/route.ts:309:        supabaseAdmin
src/app/api/_handlers/health/route.ts:313:        supabaseAdmin
src/app/api/_handlers/health/route.ts:316:        supabaseAdmin
src/app/api/_handlers/superadmin/announcements/route.ts:35:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/announcements/route.ts:40:        const result = await adminClient
src/app/api/_handlers/superadmin/announcements/route.ts:68:    const { adminClient, userId } = auth;
src/app/api/_handlers/superadmin/announcements/route.ts:81:        const result = await adminClient
src/app/api/_handlers/dashboard/tasks/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/dashboard/tasks/route.ts:42:    const { data: trips, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:108:    const { data: invoices, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:165:    const { data: proposals, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:231:    const { data: trips, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:292:    const { data, error } = await supabaseAdmin
src/app/api/_handlers/admin/insights/margin-leak/route.ts:32:      admin.adminClient
src/app/api/_handlers/admin/insights/margin-leak/route.ts:39:      admin.adminClient
src/app/api/_handlers/admin/cost/overview/shared.ts:292:  await admin.adminClient.from("notification_logs").insert({
src/app/api/_handlers/whatsapp/qr/route.ts:15:        const { organizationId, adminClient } = auth;
src/app/api/_handlers/whatsapp/qr/route.ts:19:        const { data: connection } = await adminClient
src/app/api/_handlers/leads/convert/route.ts:78:  const supabase = createAdminClient();
src/app/api/_handlers/reputation/dashboard/route.ts:19:    const supabase = createAdminClient();
src/app/api/_handlers/superadmin/cost/trends/route.ts:19:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/cost/trends/route.ts:36:            adminClient
src/app/api/_handlers/superadmin/cost/trends/route.ts:65:        const logsResult = await adminClient
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:66:      admin.adminClient
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:71:      admin.adminClient
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:76:      admin.adminClient
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:95:      const { data } = await admin.adminClient
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:108:      const { data } = await admin.adminClient
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:30:        const { organizationId, userId, adminClient } = auth;
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:46:        const { error } = await adminClient
src/app/api/_handlers/superadmin/referrals/overview/route.ts:40:    const db = auth.adminClient as unknown as UntypedClient;
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:62:      await admin.adminClient
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:85:      adminClient: admin.adminClient,
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:63:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:67:            adminClient
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:71:            adminClient
src/app/api/_handlers/dashboard/schedule/route.ts:9:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/dashboard/schedule/route.ts:100:        const { data: trips, error } = await supabaseAdmin
src/app/api/_handlers/admin/insights/action-queue/route.ts:33:      admin.adminClient
src/app/api/_handlers/admin/insights/action-queue/route.ts:42:      admin.adminClient
src/app/api/_handlers/admin/insights/action-queue/route.ts:50:      admin.adminClient
src/app/api/_handlers/admin/insights/action-queue/route.ts:57:      admin.adminClient
src/app/api/_handlers/whatsapp/status/route.ts:13:        const { organizationId, adminClient } = auth;
src/app/api/_handlers/whatsapp/status/route.ts:16:        let connectionQuery = adminClient
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:24:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:31:            adminClient
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:36:            adminClient
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:42:            adminClient
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:57:        const profilesResult = await adminClient
src/app/api/_handlers/admin/trips/[id]/route.ts:91:        let tripQuery = admin.adminClient
src/app/api/_handlers/admin/trips/[id]/route.ts:148:        const { data: driversData } = await admin.adminClient
src/app/api/_handlers/admin/trips/[id]/route.ts:155:        const { data: assignmentsData } = await admin.adminClient
src/app/api/_handlers/admin/trips/[id]/route.ts:172:        const { data: accommodationsData } = await admin.adminClient
src/app/api/_handlers/admin/trips/[id]/route.ts:189:        const { data: reminderRows } = await admin.adminClient
src/app/api/_handlers/admin/trips/[id]/route.ts:225:        const { data: latestLocation } = await admin.adminClient
src/app/api/_handlers/admin/trips/[id]/route.ts:249:            const { data: overlappingTrips } = await admin.adminClient
src/app/api/_handlers/admin/trips/[id]/route.ts:260:                const { data: remoteAssignments } = await admin.adminClient
src/app/api/_handlers/subscriptions/route.ts:156:    const { userId, organizationId, adminClient } = auth;
src/app/api/_handlers/subscriptions/route.ts:158:    const { data: org } = await adminClient
src/app/api/_handlers/subscriptions/route.ts:190:    const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(userId);
src/app/api/_handlers/admin/marketplace/verify/route.ts:28:type AdminClient = AdminContext["adminClient"];
src/app/api/_handlers/admin/marketplace/verify/route.ts:47:    adminClient: AdminClient,
src/app/api/_handlers/admin/marketplace/verify/route.ts:56:        await adminClient.from("notification_logs").insert({
src/app/api/_handlers/admin/marketplace/verify/route.ts:144:        let query = admin.adminClient
src/app/api/_handlers/admin/marketplace/verify/route.ts:263:        const primaryUpdate = await admin.adminClient
src/app/api/_handlers/admin/marketplace/verify/route.ts:273:            const legacyUpdate = await admin.adminClient
src/app/api/_handlers/admin/marketplace/verify/route.ts:289:        const { data: orgInfo } = await admin.adminClient
src/app/api/_handlers/admin/marketplace/verify/route.ts:324:            admin.adminClient,
src/app/api/_handlers/admin/clear-cache/route.ts:72:        let query = admin.adminClient.from("itinerary_cache").delete();
src/app/api/_handlers/admin/clear-cache/route.ts:79:            const { data: orgUsers, error: orgUsersError } = await admin.adminClient
src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts:54:    const db = auth.adminClient as unknown as UntypedClient;
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:32:      admin.adminClient
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:41:      admin.adminClient
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:58:      const { data } = await admin.adminClient
src/app/api/_handlers/whatsapp/health/route.ts:11:    const { organizationId, adminClient } = auth;
src/app/api/_handlers/whatsapp/health/route.ts:13:    const { data: connection, error } = await adminClient
src/app/api/_handlers/superadmin/settings/route.ts:11:    const { adminClient } = auth;
src/app/api/_handlers/superadmin/settings/route.ts:14:        const result = await adminClient
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:32:    const supabase = admin.adminClient;
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:121:    const { data: profile } = await admin.adminClient
src/app/api/_handlers/subscriptions/limits/route.ts:33:    const dataClient = canUseAdminClient ? createAdminClient() : supabase;
src/app/api/_handlers/admin/insights/roi/route.ts:40:    admin.adminClient
src/app/api/_handlers/admin/insights/roi/route.ts:45:    admin.adminClient
src/app/api/_handlers/admin/insights/roi/route.ts:50:    admin.adminClient
src/app/api/_handlers/admin/insights/roi/route.ts:54:    admin.adminClient
src/app/api/_handlers/admin/insights/roi/route.ts:59:    admin.adminClient
src/app/api/_handlers/admin/insights/roi/route.ts:124:    const { data: usage } = await admin.adminClient
src/app/api/_handlers/admin/trips/route.ts:155:        let query = admin.adminClient
src/app/api/_handlers/admin/trips/route.ts:276:        const { data: clientProfile } = await admin.adminClient
src/app/api/_handlers/admin/trips/route.ts:299:            admin.adminClient,
src/app/api/_handlers/admin/trips/route.ts:316:        const { data: itineraryData, error: itineraryError } = await admin.adminClient
src/app/api/_handlers/admin/trips/route.ts:327:        const { error: tripError, data: tripData } = await admin.adminClient
src/app/api/_handlers/admin/workflow/events/route.ts:66:        const { data, error } = await admin.adminClient
src/app/api/_handlers/admin/workflow/events/route.ts:89:            const { data: profiles } = await admin.adminClient
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:268:    let tripQuery = admin.adminClient.from("trips").select(`
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:354:    const { data: newItinerary, error: itineraryInsertError } = await admin.adminClient
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:367:    const { data: newTrip, error: tripInsertError } = await admin.adminClient
src/app/api/_handlers/whatsapp/test-message/route.ts:15:        const { organizationId, userId, adminClient } = auth;
src/app/api/_handlers/whatsapp/test-message/route.ts:17:        const { data: connection } = await adminClient
src/app/api/_handlers/notifications/retry-failed/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/retry-failed/route.ts:22:            const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/notifications/retry-failed/route.ts:27:            const { data: profile } = await supabaseAdmin
src/app/api/_handlers/notifications/retry-failed/route.ts:40:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/notifications/retry-failed/route.ts:56:            await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/admin/generate-embeddings/route.ts:16:    await admin.adminClient.from("notification_logs").insert({
src/app/api/_handlers/admin/generate-embeddings/route.ts:104:    const { count: total } = await admin.adminClient.from("tour_templates").select("id", { count: "exact", head: true });
src/app/api/_handlers/admin/generate-embeddings/route.ts:106:    const { count: withEmbeddings } = await admin.adminClient
src/app/api/_handlers/admin/workflow/rules/route.ts:115:        const { data, error } = await admin.adminClient
src/app/api/_handlers/admin/workflow/rules/route.ts:173:        const { error } = await admin.adminClient
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
src/app/api/_handlers/notifications/send/route.ts:69:    let query = admin.adminClient
src/app/api/_handlers/notifications/send/route.ts:90:        let query = admin.adminClient
src/app/api/_handlers/notifications/send/route.ts:107:    let query = admin.adminClient
src/app/api/_handlers/marketplace/listing-subscription/route.ts:55:  const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:138:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:195:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:270:    const admin = createAdminClient();
src/app/api/_handlers/onboarding/first-value/route.ts:34:    const adminClient = createAdminClient();
src/app/api/_handlers/onboarding/first-value/route.ts:36:    const { data: profile, error: profileError } = await adminClient
src/app/api/_handlers/onboarding/first-value/route.ts:48:      const { data: teamMembers } = await adminClient
src/app/api/_handlers/onboarding/first-value/route.ts:62:    const { data: itineraries, error: itinerariesError } = await adminClient
src/app/api/_handlers/onboarding/first-value/route.ts:80:      const { data: shares, error: sharesError } = await adminClient
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:15:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:24:        const { data: authData } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:26:            const { data: profile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:38:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:60:        const { data: targetProfile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:72:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:134:        const { data: targetProfile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:158:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/notifications/schedule-followups/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/schedule-followups/route.ts:90:    const { data: completedTrips, error: tripsError } = await supabaseAdmin
src/app/api/_handlers/notifications/schedule-followups/route.ts:127:    const { data: existingRows, error: existingError } = await supabaseAdmin
src/app/api/_handlers/notifications/schedule-followups/route.ts:187:      const { error: insertError } = await supabaseAdmin
src/app/api/_handlers/marketplace/options/route.ts:22:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/options/route.ts:74:    const { data } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/options/route.ts:88:  const queryClient = supabaseAdmin as unknown as {
src/app/api/_handlers/marketplace/options/route.ts:139:  const { data, error } = await supabaseAdmin
src/app/api/_handlers/admin/revenue/route.ts:47:    const db = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:53:  const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:106:    const admin = createAdminClient();
src/app/api/_handlers/billing/contact-sales/route.ts:99:    const admin = createAdminClient();
src/app/api/_handlers/trips/[id]/notifications/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/notifications/route.ts:14:    const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/notifications/route.ts:37:    const { data: logs } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/notifications/route.ts:45:    const { data: queue } = await supabaseAdmin
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
src/app/api/_handlers/notifications/client-landed/route.ts:10:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/client-landed/route.ts:32:        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/notifications/client-landed/route.ts:56:        const { data: trip, error: tripError } = await supabaseAdmin
src/app/api/_handlers/notifications/client-landed/route.ts:91:        const { data: assignmentRaw } = await supabaseAdmin
src/app/api/_handlers/notifications/client-landed/route.ts:113:        const { data: accommodation } = await supabaseAdmin
src/app/api/_handlers/notifications/client-landed/route.ts:159:        await supabaseAdmin.from("notification_logs").insert({
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
src/app/api/_handlers/trips/[id]/invoices/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/invoices/route.ts:32:        const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/invoices/route.ts:66:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/invoices/route.ts:83:        const { data: invoices, error } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/invoices/route.ts:113:            const { data: payments } = await supabaseAdmin
src/app/api/_handlers/billing/subscription/route.ts:20:    const { userId, organizationId, adminClient } = auth;
src/app/api/_handlers/billing/subscription/route.ts:23:    const { data: profile, error: profileError } = await adminClient
src/app/api/_handlers/billing/subscription/route.ts:34:    const adminSupabase = adminClient;
src/app/api/_handlers/trips/[id]/clone/route.ts:40:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/clone/route.ts:43:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:56:        let tripQuery = supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:81:            const { data: originalItinerary, error: itinError } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:98:                const { data: newItinerary, error: insertItinError } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:124:        const { data: newTrip, error: insertTripError } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/add-ons/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/add-ons/route.ts:13:        const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:47:        const { data: proposals } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/add-ons/route.ts:60:        const { data: addOns, error } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/add-ons/route.ts:125:        const { data: updated, error } = await supabaseAdmin
src/app/api/_handlers/trips/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/route.ts:76:        supabaseAdmin.from("invoices")
src/app/api/_handlers/trips/route.ts:79:        supabaseAdmin.from("trip_driver_assignments")
src/app/api/_handlers/trips/route.ts:82:        supabaseAdmin.from("trip_accommodations")
src/app/api/_handlers/trips/route.ts:172:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/trips/route.ts:190:            let query = supabaseAdmin
src/app/api/_handlers/trips/route.ts:283:        let query = supabaseAdmin

AUTH_HELPERS
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:18:    const admin = await requireAdmin(request);
src/app/api/availability/route.ts:21:    const adminResult = await requireAdmin(request);
src/app/api/availability/route.ts:80:    const admin = await requireAdmin(request);
src/app/api/availability/route.ts:141:    const admin = await requireAdmin(request);
src/lib/analytics/template-analytics.ts:47:    } = await supabase.auth.getUser();
src/lib/analytics/template-analytics.ts:86:    } = await supabase.auth.getUser();
src/lib/auth/admin.ts:145:    } = await adminClient.auth.getUser(token);
src/lib/auth/admin.ts:155:    } = await serverClient.auth.getUser();
src/lib/auth/admin.ts:162:export async function requireAdmin(
src/lib/auth/require-super-admin.ts:23:  const result = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/debug/route.ts:24:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/subscriptions/route.ts:109:    } = await supabase.auth.getUser();
src/app/api/_handlers/subscriptions/route.ts:153:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/subscriptions/route.ts:190:    const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(userId);
src/app/api/_handlers/invoices/[id]/route.ts:61:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/[id]/route.ts:113:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/[id]/route.ts:237:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/cron/operator-scorecards/route.ts:13:      const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/invoices/[id]/pay/route.ts:26:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/route.ts:30:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/route.ts:90:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/send-pdf/route.ts:39:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/proposals/create/route.ts:54:    const admin = await requireAdmin(req);
src/lib/security/admin-bearer-auth.ts:17:    await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/proposals/[id]/convert/route.ts:72:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/proposals/[id]/convert/route.ts:79:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/proposals/[id]/convert/route.ts:83:async function requireAdmin(req: Request) {
src/app/api/_handlers/proposals/[id]/convert/route.ts:111:        const admin = await requireAdmin(req);
src/app/api/_handlers/bookings/[id]/invoice/route.ts:93:      const auth = await requireAdmin(request, { requireOrganization: true });
src/lib/queries/analytics.ts:17:            const { data: { user } } = await supabase.auth.getUser();
src/lib/security/cost-endpoint-guard.ts:153:  } = await supabase.auth.getUser();
src/app/api/_handlers/proposals/[id]/send/route.ts:94:  const admin = await requireAdmin(request);
src/app/api/_handlers/subscriptions/limits/route.ts:14:    } = await supabase.auth.getUser();
src/lib/supabase/middleware.ts:46:    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
src/lib/supabase/middleware.ts:49:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/proposals/[id]/pdf/route.ts:103:    } = await supabase.auth.getUser();
src/app/api/_handlers/subscriptions/cancel/route.ts:36:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/proposals/bulk/route.ts:17:    } = await supabase.auth.getUser();
src/lib/queries/proposals.ts:98:            const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/proposals/send-pdf/route.ts:53:    } = await supabase.auth.getUser();
src/app/api/_handlers/add-ons/stats/route.ts:39:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/whatsapp/broadcast/route.ts:97:  const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/add-ons/[id]/route.ts:28:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/add-ons/[id]/route.ts:70:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/add-ons/[id]/route.ts:151:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/drivers/search/route.ts:41:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:56:        const authResult = await requireAdmin(request);
src/app/api/_handlers/add-ons/route.ts:23:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/add-ons/route.ts:75:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/whatsapp/send/route.ts:15:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/settings/team/shared.ts:182:  } = await supabase.auth.getUser();
src/app/api/_handlers/calendar/events/route.ts:17:        const { data: { user }, error: authError } = await supabase.auth.getUser();
src/app/api/_handlers/whatsapp/connect/route.ts:29:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/settings/integrations/route.ts:19:        const admin = await requireAdmin(request);
src/app/api/_handlers/whatsapp/disconnect/route.ts:15:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/assistant/chat/route.ts:16:    } = await supabase.auth.getUser();
src/app/api/_handlers/settings/marketplace/route.ts:82:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/reports/operators/route.ts:12:        const admin = await requireAdmin(request);
src/app/api/_handlers/payments/create-order/route.ts:43:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/assistant/chat/stream/route.ts:588:    } = await supabase.auth.getUser();
src/app/api/_handlers/whatsapp/conversations/route.ts:47:      const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/conversations/route.ts:55:      const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:25:    const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:101:    const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/reports/gst/route.ts:34:    const authResult = await requireAdmin(request);
src/app/api/_handlers/payments/links/route.ts:30:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/qr/route.ts:12:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:51:    const admin = await requireAdmin(nextReq, { requireOrganization: false });
src/app/api/_handlers/assistant/usage/route.ts:15:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/contacts/route.ts:55:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/contacts/route.ts:144:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/whatsapp/status/route.ts:10:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:136:  const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:188:  const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/assistant/confirm/route.ts:18:    } = await supabase.auth.getUser();
src/app/api/_handlers/whatsapp/health/route.ts:8:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/leads/[id]/route.ts:46:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/leads/[id]/route.ts:72:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/whatsapp/test-message/route.ts:12:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/leads/route.ts:45:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/leads/route.ts:81:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:36:    const admin = await requireAdmin(request);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:81:    const admin = await requireAdmin(request);
src/app/api/_handlers/assistant/conversations/[sessionId]/route.ts:26:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/referrals/route.ts:24:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/referrals/route.ts:109:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/assistant/conversations/route.ts:27:  } = await supabase.auth.getUser();
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts:32:  const authResult = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/destinations/route.ts:25:    const admin = await requireAdmin(request);
src/app/api/_handlers/settings/upi/route.ts:12:        const auth = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/settings/upi/route.ts:52:        const auth = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:12:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/onboarding/setup/route.ts:142:  } = await serverClient.auth.getUser();
src/app/api/_handlers/admin/security/diagnostics/route.ts:23:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/onboarding/first-value/route.ts:28:    } = await serverClient.auth.getUser();
src/app/api/_handlers/admin/whatsapp/health/route.ts:56:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/ltv/route.ts:15:    const admin = await requireAdmin(request);
src/app/api/_handlers/assistant/export/route.ts:11:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/cache-metrics/route.ts:10:    const admin = await requireAdmin(req);
src/app/api/_handlers/assistant/quick-prompts/route.ts:25:  } = await supabase.auth.getUser();
src/app/api/_handlers/admin/notifications/delivery/route.ts:57:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/emails/welcome/route.ts:18:        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/location/share/route.ts:31:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/location/share/route.ts:79:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/location/share/route.ts:155:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/billing/contact-sales/route.ts:70:    } = await supabase.auth.getUser();
src/app/api/_handlers/marketplace/stats/route.ts:20:        const { data: { user }, error: authError } = await supabase.auth.getUser();
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:57:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:130:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:348:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:427:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:509:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/location/client-share/route.ts:21:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/reputation/reviews/[id]/route.ts:18:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/reviews/[id]/route.ts:67:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/insights/ai-usage/route.ts:19:    const admin = await requireAdmin(req);
src/app/api/_handlers/location/ping/route.ts:20:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/admin/funnel/route.ts:12:    const admin = await requireAdmin(request);
src/app/api/_handlers/admin/insights/win-loss/route.ts:13:    const admin = await requireAdmin(req);
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:24:        const { data: authData } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:36:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/location/cleanup-expired/route.ts:15:    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:19:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:56:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route.ts:30:    } = await supabase.auth.getUser();
src/app/api/_handlers/billing/subscription/route.ts:17:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/reputation/reviews/route.ts:16:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/reviews/route.ts:153:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/insights/auto-requote/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/marketplace/[id]/view/route.ts:31:        } = await supabase.auth.getUser();
src/app/api/_handlers/notifications/retry-failed/route.ts:22:            const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/inquiries/route.ts:54:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/marketplace/inquiries/route.ts:155:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/admin/insights/best-quote/route.ts:32:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/analytics/topics/route.ts:23:    } = await supabase.auth.getUser();
src/app/api/_handlers/notifications/send/route.ts:128:        const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:28:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/analytics/trends/route.ts:23:    } = await supabase.auth.getUser();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:107:        const { data: { user }, error: authError } = await supabase.auth.getUser();
src/app/api/_handlers/admin/pricing/trips/route.ts:19:    const admin = await requireAdmin(req);
src/app/api/_handlers/notifications/process-queue/route.ts:183:    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/admin/insights/proposal-risk/route.ts:18:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:50:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:92:    } = await supabase.auth.getUser();
src/app/api/_handlers/marketplace/route.ts:185:        const { data: authData } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/route.ts:197:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:49:  } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/sync/route.ts:103:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/pricing/vendor-history/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/notifications/client-landed/route.ts:32:        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:47:  } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:19:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:68:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:149:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/insights/roi/route.ts:17:  const admin = await requireAdmin(req);
src/app/api/_handlers/marketplace/options/route.ts:74:    const { data } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/options/route.ts:83:  } = await serverClient.auth.getUser();
src/app/api/_handlers/admin/pricing/transactions/route.ts:41:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/campaigns/route.ts:23:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/campaigns/route.ts:63:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/clear-cache/route.ts:42:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/reputation/dashboard/route.ts:140:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/pricing/dashboard/route.ts:18:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:42:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:23:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/action-queue/route.ts:13:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/margin-leak/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:24:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:59:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:108:    const admin = await requireAdmin(req);
src/app/api/_handlers/trips/[id]/notifications/route.ts:14:    const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/notifications/route.ts:18:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/admin/insights/daily-brief/route.ts:13:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/ai/analyze/route.ts:100:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/generate-embeddings/route.ts:38:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/generate-embeddings/route.ts:99:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/revenue/route.ts:137:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/route.ts:25:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/route.ts:73:    const admin = await requireAdmin(req);
src/app/api/_handlers/trips/[id]/route.ts:59:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/route.ts:65:        const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/reputation/ai/respond/route.ts:173:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/trips/[id]/route.ts:58:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/social/generate/route.ts:234:    const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/trips/[id]/clone/route.ts:34:        const { data: { user }, error: userError } = await supabase.auth.getUser();
src/app/api/_handlers/admin/workflow/rules/route.ts:91:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/workflow/rules/route.ts:139:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:226:    const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/reputation/connections/route.ts:16:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/connections/route.ts:63:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/connections/route.ts:139:    } = await supabase.auth.getUser();
src/app/api/_handlers/trips/[id]/add-ons/route.ts:13:        const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:19:        } = await serverClient.auth.getUser();
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:27:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:65:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:30:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:61:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:110:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/dashboard/stats/route.ts:24:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/workflow/events/route.ts:19:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/geocoding/usage/route.ts:35:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/tour-templates/extract/route.ts:13:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/ai/suggest-reply/route.ts:64:    } = await supabase.auth.getUser();
src/app/api/_handlers/trips/[id]/invoices/route.ts:32:        const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/invoices/route.ts:38:        } = await serverClient.auth.getUser();
src/app/api/_handlers/reputation/widget/config/route.ts:26:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/widget/config/route.ts:66:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/widget/config/route.ts:153:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/seed-demo/route.ts:39:  const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/nav/counts/route.ts:97:      const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/ai/pricing-suggestion/route.ts:127:    } = await supabase.auth.getUser();
src/app/api/_handlers/integrations/tripadvisor/route.ts:12:        const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/integrations/tripadvisor/route.ts:65:        const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:63:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/trips/route.ts:166:        const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/admin/trips/route.ts:122:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/trips/route.ts:234:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/ai/draft-review-response/route.ts:29:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/cost/overview/route.ts:33:  const admin = await requireAdmin(request);
src/app/api/_handlers/admin/cost/overview/route.ts:794:  const admin = await requireAdmin(request);
src/app/api/_handlers/integrations/places/route.ts:110:    const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/integrations/places/route.ts:144:    const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/itinerary/share/route.ts:37:        } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/brand-voice/route.ts:27:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/brand-voice/route.ts:108:    } = await supabase.auth.getUser();
src/app/api/_handlers/support/route.ts:26:        const { data: { user }, error: userError } = await supabase.auth.getUser();
src/app/api/_handlers/support/route.ts:80:        const { data: { user }, error: userError } = await supabase.auth.getUser();
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:15:  const admin = await requireAdmin(request);
src/app/api/_handlers/dashboard/tasks/route.ts:306:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/itinerary/generate/route.ts:229:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/itinerary/import/url/route.ts:110:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/admin/marketplace/verify/route.ts:103:        const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/marketplace/verify/route.ts:198:        const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:101:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:157:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:341:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/itinerary/import/pdf/route.ts:55:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/admin/pdf-imports/route.ts:58:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/itineraries/route.ts:16:    } = await supabase.auth.getUser();
src/app/api/_handlers/dashboard/schedule/route.ts:94:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/itineraries/[id]/bookings/route.ts:68:    } = await supabase.auth.getUser();
src/app/api/_handlers/itineraries/[id]/bookings/route.ts:125:    } = await supabase.auth.getUser();
src/app/api/_handlers/social/captions/route.ts:58:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:27:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/itineraries/[id]/route.ts:15:        } = await supabase.auth.getUser();
src/app/api/_handlers/itineraries/[id]/route.ts:58:        } = await supabase.auth.getUser();
src/app/api/_handlers/admin/operations/command-center/route.ts:214:    const admin = await requireAdmin(request);
src/app/api/_handlers/social/schedule/route.ts:21:    } = await supabase.auth.getUser();
src/app/api/_handlers/social/render-poster/route.ts:46:  const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:65:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/reviews/import/route.ts:9:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/connections/[id]/route.ts:12:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/oauth/linkedin/route.ts:15:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/reviews/route.ts:13:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/reviews/route.ts:51:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/connections/route.ts:8:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/oauth/google/route.ts:21:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/oauth/facebook/route.ts:12:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/posts/route.ts:25:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/posts/route.ts:61:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/publish/route.ts:20:    } = await supabase.auth.getUser();
src/app/api/_handlers/social/posts/[id]/render/route.ts:14:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/extract/route.ts:31:    const { data: { user } } = await serverClient.auth.getUser();

PUBLIC_TOKEN_ROUTES
src/app/api/[...path]/route.ts:55:  ["location/live/:token", () => import("@/app/api/_handlers/location/live/[token]/route")],
src/app/api/[...path]/route.ts:76:  ["payments/links/:token", () => import("@/app/api/_handlers/payments/links/[token]/route")],
src/app/api/[...path]/route.ts:79:  ["payments/track/:token", () => import("@/app/api/_handlers/payments/track/[token]/route")],
src/app/api/[...path]/route.ts:82:  ["portal/:token", () => import("@/app/api/_handlers/portal/[token]/route")],
src/app/api/[...path]/route.ts:88:  ["proposals/public/:token", () => import("@/app/api/_handlers/proposals/public/[token]/route")],
src/app/api/[...path]/route.ts:97:  ["share/:token", () => import("@/app/api/_handlers/share/[token]/route")],
src/lib/external/linkedin.server.ts:56:            headers: { Authorization: `Bearer ${accessToken}` },
src/lib/external/linkedin.server.ts:59:            headers: { Authorization: `Bearer ${accessToken}` },
src/lib/external/google.server.ts:99:        headers: { Authorization: `Bearer ${accessToken}` },
src/lib/external/amadeus.ts:100:        Authorization: `Bearer ${token}`,
src/lib/database.types.ts:3636:          share_token: string
src/lib/database.types.ts:3657:          share_token: string
src/lib/database.types.ts:3678:          share_token?: string
src/lib/database.types.ts:5714:          share_token_hash: string
src/lib/database.types.ts:5720:          share_token_hash: string
src/lib/database.types.ts:5726:          share_token_hash?: string
src/lib/database.types.ts:5738:          share_token: string
src/lib/database.types.ts:5749:          share_token: string
src/lib/database.types.ts:5760:          share_token?: string
src/lib/database.types.ts:6410:      generate_share_token: { Args: never; Returns: string }
src/lib/queries/trip-detail.ts:33:  return { Authorization: `Bearer ${session?.access_token}` };
src/lib/queries/proposals.ts:18:    'share_token',
src/lib/queries/proposals.ts:38:    'share_token',
src/lib/queries/proposals.ts:60:    share_token: string;
src/lib/marketplace-emails.ts:26:                    Authorization: `Bearer ${apiKey}`,
src/lib/queries/dashboard-tasks.ts:149:  return { Authorization: `Bearer ${session.access_token}` };
src/lib/email.ts:41:                Authorization: `Bearer ${apiKey}`,
src/app/api/_handlers/assistant/chat/stream/route.ts:159:      Authorization: `Bearer ${apiKey}`,
src/app/api/_handlers/assistant/chat/stream/route.ts:202:      Authorization: `Bearer ${apiKey}`,
src/app/api/_handlers/bookings/hotels/search/route.ts:79:          Authorization: `Bearer ${token}`,
src/app/api/_handlers/bookings/hotels/search/route.ts:110:          headers: { Authorization: `Bearer ${token}` },
src/app/api/_handlers/proposals/[id]/convert/route.ts:34:    "client_id" | "client_selected_price" | "share_token" | "title" | "total_price"
src/app/api/_handlers/proposals/[id]/convert/route.ts:42:    "share_token",
src/app/api/_handlers/proposals/[id]/convert/route.ts:295:        const tripUrl = proposalRow.share_token
src/app/api/_handlers/proposals/[id]/convert/route.ts:296:            ? `${new URL(req.url).origin}/portal/${proposalRow.share_token}`
src/app/api/reputation/[...path]/route.ts:19:  ["nps/:token", () => import("@/app/api/_handlers/reputation/nps/[token]/route")],
src/app/api/reputation/[...path]/route.ts:25:  ["widget/:token", () => import("@/app/api/_handlers/reputation/widget/[token]/route")],
src/app/api/_handlers/proposals/[id]/send/route.ts:127:      share_token,
src/app/api/_handlers/proposals/[id]/send/route.ts:154:  const shareToken = sanitizeText(proposal.share_token, { maxLength: 200 });
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:115:          Authorization: `Bearer ${resendApiKey}`,
src/app/api/_handlers/proposals/[id]/pdf/route.ts:134:      proposalQuery = proposalQuery.eq('share_token', shareToken);
src/lib/reputation/referral-flywheel.ts:73:        Authorization: `Bearer ${resendApiKey}`,
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:372:    .eq('share_token', token)
src/app/api/_handlers/portal/[token]/route.ts:73:        share_token,
src/app/api/_handlers/portal/[token]/route.ts:77:      .eq("share_token", token)
src/app/api/_handlers/portal/[token]/route.ts:81:      console.error("[portal/:token] failed to load proposal:", proposalError);
src/app/api/_handlers/portal/[token]/route.ts:139:      console.error("[portal/:token] failed to load client profile:", clientProfileResult.error);
src/app/api/_handlers/portal/[token]/route.ts:144:      console.error("[portal/:token] failed to load organization:", organizationResult.error);
src/app/api/_handlers/portal/[token]/route.ts:149:      console.error("[portal/:token] failed to load trip:", tripResult.error);
src/app/api/_handlers/portal/[token]/route.ts:154:      console.error("[portal/:token] failed to load itinerary days:", daysResult.error);
src/app/api/_handlers/portal/[token]/route.ts:159:      console.error("[portal/:token] failed to load payment links:", paymentLinksResult.error);
src/app/api/_handlers/portal/[token]/route.ts:185:      console.error("[portal/:token] failed to load activities:", activities.error);
src/app/api/_handlers/portal/[token]/route.ts:190:      console.error("[portal/:token] failed to load accommodations:", accommodations.error);
src/app/api/_handlers/portal/[token]/route.ts:359:    console.error("[portal/:token] unexpected error:", error);
src/lib/whatsapp.server.ts:53:                    Authorization: `Bearer ${token}`,
src/lib/whatsapp.server.ts:304:            headers: { Authorization: `Bearer ${token}` }
src/lib/whatsapp.server.ts:316:            headers: { Authorization: `Bearer ${token}` }
src/app/api/_handlers/payments/links/[token]/route.ts:55:    console.error("[payments/links/:token] load failed:", error);
src/app/api/_handlers/payments/links/[token]/route.ts:111:    console.error("[payments/links/:token] event failed:", error);
src/app/api/_handlers/proposals/send-pdf/route.ts:99:        Authorization: `Bearer ${resendApiKey}`,
src/app/api/_handlers/payments/track/[token]/route.ts:43:    logError("[payments/track/:token] load failed", error);
src/app/api/_handlers/payments/track/[token]/route.ts:84:    logError("[payments/track/:token] update failed", error);
src/app/api/_handlers/admin/security/diagnostics/route.ts:72:        .select("share_token_hash")
src/app/api/_handlers/admin/security/diagnostics/route.ts:86:      tokenCountMap.set(row.share_token_hash, (tokenCountMap.get(row.share_token_hash) || 0) + 1);
src/app/api/_handlers/billing/contact-sales/route.ts:36:        Authorization: `Bearer ${apiKey}`,
src/app/api/_handlers/notifications/process-queue/route.ts:205:        .select("share_token")
src/app/api/_handlers/notifications/process-queue/route.ts:217:    const existingShare = existing as { share_token?: string | null } | null;
src/app/api/_handlers/notifications/process-queue/route.ts:219:    if (existingShare?.share_token) {
src/app/api/_handlers/notifications/process-queue/route.ts:220:        return existingShare.share_token;
src/app/api/_handlers/notifications/process-queue/route.ts:231:            share_token: shareToken,
src/app/api/_handlers/notifications/process-queue/route.ts:235:        .select("share_token")
src/app/api/_handlers/notifications/process-queue/route.ts:237:    const insertedShare = inserted as { share_token?: string | null } | null;
src/app/api/_handlers/notifications/process-queue/route.ts:239:    return insertedShare?.share_token || null;
src/lib/assistant/actions/reads/proposals.ts:32:  readonly share_token: string;
src/lib/assistant/actions/reads/proposals.ts:56:  "share_token",
src/lib/assistant/actions/reads/proposals.ts:341:        hasShareToken: Boolean(data.share_token),
src/app/api/_handlers/bookings/flights/search/route.ts:103:          Authorization: `Bearer ${token}`,
src/app/api/_handlers/location/share/route.ts:49:            .select("id,trip_id,day_number,share_token,expires_at,is_active")
src/app/api/_handlers/location/share/route.ts:68:                live_url: buildLiveUrl(req, data.share_token),
src/app/api/_handlers/location/share/route.ts:98:            .select("id,trip_id,day_number,share_token,expires_at,is_active")
src/app/api/_handlers/location/share/route.ts:113:                    live_url: buildLiveUrl(req, existing.share_token),
src/app/api/_handlers/location/share/route.ts:127:                share_token: shareToken,
src/app/api/_handlers/location/share/route.ts:132:            .select("id,trip_id,day_number,share_token,expires_at,is_active")
src/app/api/_handlers/location/share/route.ts:143:                live_url: buildLiveUrl(req, data.share_token),
src/app/api/_handlers/social/reviews/public/route.ts:94:        .eq("share_token", token)
src/app/api/_handlers/location/live/[token]/route.ts:40:            .eq("share_token_hash", tokenHash)
src/app/api/_handlers/location/live/[token]/route.ts:49:            share_token_hash: tokenHash,
src/app/api/_handlers/location/live/[token]/route.ts:71:            .eq("share_token", token)
src/lib/demo/data/proposals.ts:10:  share_token: string;
src/lib/demo/data/proposals.ts:34:    share_token: "demo-share-001",
src/lib/demo/data/proposals.ts:56:    share_token: "demo-share-002",
src/lib/demo/data/proposals.ts:78:    share_token: "demo-share-003",
src/lib/demo/data/proposals.ts:100:    share_token: "demo-share-004",
src/lib/demo/data/proposals.ts:122:    share_token: "demo-share-005",
src/lib/demo/data/proposals.ts:144:    share_token: "demo-share-006",
src/app/api/_handlers/location/client-share/route.ts:49:            .select("id,share_token,expires_at,is_active,day_number")
src/app/api/_handlers/location/client-share/route.ts:61:        if (existing?.share_token) {
src/app/api/_handlers/location/client-share/route.ts:65:                    live_url: buildLiveUrl(req, existing.share_token),
src/app/api/_handlers/location/client-share/route.ts:80:                share_token: shareToken,
src/app/api/_handlers/location/client-share/route.ts:84:            .select("id,share_token,expires_at,is_active,day_number")
src/app/api/_handlers/location/client-share/route.ts:94:                live_url: buildLiveUrl(req, inserted.share_token),
src/lib/assistant/orchestrator.ts:235:      Authorization: `Bearer ${apiKey}`,
src/app/api/_handlers/social/oauth/callback/route.ts:87:        headers: { Authorization: `Bearer ${longLivedToken}` },
src/app/api/_handlers/social/oauth/callback/route.ts:116:            { headers: { Authorization: `Bearer ${page.access_token}` } }
src/app/api/_handlers/health/route.ts:153:                        Authorization: `Bearer ${supabaseServiceKey}`,
src/app/api/_handlers/health/route.ts:239:            headers: { Authorization: `Bearer ${token}` },
src/app/api/_handlers/invoices/send-pdf/route.ts:82:        Authorization: `Bearer ${resendApiKey}`,

RATE_LIMIT_USAGE
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:23:    const rateLimit = await enforceRateLimit({
src/app/api/availability/route.ts:26:    const rateLimit = await enforceRateLimit({
src/app/api/availability/route.ts:85:    const rateLimit = await enforceRateLimit({
src/app/api/availability/route.ts:146:    const rateLimit = await enforceRateLimit({
src/app/api/social/[...path]/route.ts:28:  rateLimit: {
src/app/api/[...path]/route.ts:124:], { rateLimit: { limit: 200, windowMs: 5 * 60 * 1000, prefix: "api:main" } });
src/lib/api-dispatch.ts:80:        const result = await enforceRateLimit({
src/app/api/reputation/[...path]/route.ts:27:  rateLimit: {
src/app/api/_handlers/share/[token]/route.ts:110:    const limiter = await enforceRateLimit({
src/app/api/_handlers/share/[token]/route.ts:156:    const limiter = await enforceRateLimit({
src/app/api/assistant/[...path]/route.ts:15:  rateLimit: {
src/app/api/_handlers/admin/clear-cache/route.ts:47:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:59:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/clients/route.ts:144:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:363:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:435:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:517:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/emails/welcome/route.ts:24:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/proposals/create/route.ts:57:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/weather/route.ts:39:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/payments/create-order/route.ts:48:    const rateLimit = await enforceRateLimit({
src/lib/auth/admin.ts:103:    const telemetryLimit = await enforceRateLimit({
src/app/api/_handlers/payments/track/[token]/route.ts:26:    const rl = await enforceRateLimit({ identifier: ip, limit: 60, windowMs: 60_000, prefix: "api:payments:track:get" });
src/app/api/_handlers/payments/track/[token]/route.ts:54:    const rl = await enforceRateLimit({ identifier: ip, limit: 20, windowMs: 60_000, prefix: "api:payments:track:post" });
src/lib/security/rate-limit.ts:118:export async function enforceRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
src/lib/security/public-rate-limit.ts:35:  const limiter = await enforceRateLimit({
src/lib/security/cost-endpoint-guard.ts:176:  const burstLimit = await enforceRateLimit({
src/lib/security/cost-endpoint-guard.ts:183:  const dailyLimit = await enforceRateLimit({
src/app/api/_handlers/proposals/public/[token]/route.ts:89:    const limiter = await enforceRateLimit({
src/app/api/_handlers/social/reviews/public/route.ts:125:        const limiter = await enforceRateLimit({
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:129:        const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/assistant/confirm/route.ts:39:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/assistant/chat/route.ts:37:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/assistant/chat/stream/route.ts:613:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/whatsapp/connect/route.ts:34:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/reputation/nps/[token]/route.ts:21:    const rl = await enforceRateLimit({
src/app/api/_handlers/reputation/nps/submit/route.ts:15:    const rl = await enforceRateLimit({
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:65:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/seed-demo/route.ts:44:  const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/contacts/route.ts:80:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/contacts/route.ts:172:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/reputation/widget/[token]/route.ts:57:    const rl = await enforceRateLimit({
src/app/api/_handlers/admin/workflow/events/route.ts:24:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/referrals/route.ts:32:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/referrals/route.ts:117:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/marketplace/verify/route.ts:88:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>,
src/app/api/_handlers/admin/marketplace/verify/route.ts:120:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/marketplace/verify/route.ts:215:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/leads/convert/route.ts:52:  const rl = await enforceRateLimit({
src/app/api/_handlers/admin/security/diagnostics/route.ts:11:  rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/security/diagnostics/route.ts:32:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/workflow/rules/route.ts:24:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/workflow/rules/route.ts:101:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/workflow/rules/route.ts:144:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/tour-templates/extract/route.ts:21:  const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:20:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:71:    const rateLimit = await enforceRateLimit({
src/app/api/admin/[...path]/route.ts:74:], { rateLimit: ADMIN_RATE_LIMIT });
src/lib/assistant/channel-adapters/whatsapp.ts:186:  const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:109:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:165:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:349:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/social/generate/route.ts:242:    const rateLimit = await enforceRateLimit({
src/app/api/superadmin/[...path]/route.ts:39:], { rateLimit: SUPERADMIN_RATE_LIMIT });
src/app/api/_handlers/admin/pdf-imports/route.ts:69:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/auth/password-login/route.ts:56:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/[id]/route.ts:46:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/trips/[id]/route.ts:63:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/route.ts:80:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/trips/route.ts:137:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/route.ts:248:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:234:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/notifications/delivery/route.ts:11:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/notifications/delivery/route.ts:72:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:12:    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:66:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/notifications/send/route.ts:141:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/whatsapp/health/route.ts:67:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/itinerary/import/url/route.ts:116:        const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/itinerary/import/pdf/route.ts:61:        const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/onboarding/setup/route.ts:252:    const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/onboarding/setup/route.ts:311:    const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/currency/route.ts:53:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/notifications/client-landed/route.ts:38:        const rateLimitResult = await enforceRateLimit({

CSRF_GUARDS
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:33:    if (!passesMutationCsrfGuard(request)) {
src/app/api/availability/route.ts:95:    if (!passesMutationCsrfGuard(request)) {
src/app/api/availability/route.ts:156:    if (!passesMutationCsrfGuard(request)) {
src/lib/api-dispatch.ts:112:    if (isMutation && !csrfExempt && !passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/leads/route.ts:83:  if (!passesMutationCsrfGuard(req)) {
src/lib/security/admin-mutation-csrf.ts:46:export function passesMutationCsrfGuard(req: RequestLike): boolean {
src/app/api/_handlers/admin/clients/route.ts:134:        if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/trips/route.ts:238:        if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/clear-cache/route.ts:57:    if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/generate-embeddings/route.ts:40:  if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/seed-demo/route.ts:57:  if (!passesMutationCsrfGuard(request)) {
src/app/api/_handlers/admin/contacts/route.ts:152:    if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/superadmin/announcements/route.ts:61:    if (!passesMutationCsrfGuard(request)) {

JSON_PARSE_AND_REQUEST_JSON_CATCH
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:41:    const body = await request.json().catch(() => null);
src/app/api/_handlers/share/[token]/route.ts:169:    const body = await request.json().catch(() => ({}));
src/app/api/_handlers/debug/route.ts:44:      return NextResponse.json({ success: true, model: 'gemini-2.5-flash', response: JSON.parse(text) });
src/lib/notifications/browser-push.ts:287:      return JSON.parse(stored);
src/lib/import/pdf-extractor.ts:127:    const extractedData: ExtractedTourData = JSON.parse(jsonText);
src/lib/import/url-scraper.ts:156:    const extractedData: ExtractedTourData = JSON.parse(jsonText);
src/lib/import/url-scraper.ts:212:    const preview = JSON.parse(jsonText);
src/app/api/_handlers/invoices/[id]/route.ts:125:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/invoices/[id]/pay/route.ts:47:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/invoices/route.ts:96:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/payments/create-order/route.ts:60:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/payments/links/route.ts:35:    const body = await request.json().catch(() => null);
src/app/api/_handlers/payments/links/[token]/route.ts:82:    const body = await request.json().catch(() => null);
src/lib/queries/itineraries.ts:60:                const errorPayload = await response.json().catch(() => ({}));
src/lib/queries/itineraries.ts:127:                const errorPayload = await response.json().catch(() => ({}));
src/app/api/_handlers/payments/verify/route.ts:22:    const body = await request.json().catch(() => null);
src/lib/ai/gemini.server.ts:26:  return JSON.parse(cleanGeminiJson(rawText)) as T;
src/lib/queries/trip-detail.ts:146:        const err = await response.json().catch(() => ({}));
src/app/api/_handlers/payments/track/[token]/route.ts:63:    const body = await request.json().catch(() => null);
src/lib/queries/dashboard-tasks.ts:79:    return new Set(JSON.parse(raw) as string[]);
src/lib/queries/dashboard-tasks.ts:262:        const errorPayload = await response.json().catch(() => ({}));
src/app/api/_handlers/payments/webhook/route.ts:183:    const parsed = JSON.parse(body) as unknown;
src/lib/queries/trips.ts:120:                const errorPayload = await response.json().catch(() => ({}));
src/lib/pdf-extractor.ts:222:            template = JSON.parse(jsonText);
src/app/api/_handlers/settings/team/[id]/route.ts:32:    const body = await request.json().catch(() => null);
src/lib/email.ts:63:    const result = await response.json().catch(() => ({}));
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:197:  const body = await request.json().catch(() => ({}));
src/app/api/_handlers/settings/team/invite/route.ts:34:    const body = await request.json().catch(() => null);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:89:    const body = await request.json().catch(() => ({}));
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:36:    const body = (await req.json().catch(() => ({}))) as {
src/app/api/_handlers/auth/password-login/route.ts:40:    const body = await request.json().catch(() => null);
src/app/api/_handlers/proposals/[id]/send/route.ts:102:  const body = await request.json().catch(() => ({}));
src/app/api/_handlers/admin/marketplace/verify/route.ts:230:        const body = await request.json().catch(() => ({}));
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:108:    const body = await req.json().catch(() => ({}));
src/lib/whatsapp.server.ts:59:            const body = await response.json().catch(() => ({}));
src/app/api/_handlers/assistant/chat/stream/route.ts:237:        const chunk = JSON.parse(jsonStr) as {
src/app/api/_handlers/assistant/chat/stream/route.ts:298:    params = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
src/lib/rag-itinerary.ts:245:        const assembledItinerary = JSON.parse(
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:66:    const body = await req.json().catch(() => null);
src/app/api/_handlers/admin/referrals/route.ts:137:    const body = (await req.json().catch(() => ({}))) as { referralCode?: string };
src/app/api/_handlers/admin/pricing/overheads/route.ts:82:    const body = await req.json().catch(() => null);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:68:    const body = await req.json().catch(() => null);
src/lib/marketplace-emails.ts:48:        const data = await response.json().catch(() => ({}));
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:71:    const body = await req.json().catch(() => null);
src/lib/security/social-oauth-state.ts:120:    const parsed = JSON.parse(raw) as Partial<OAuthStatePayload>;
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:195:    const parsed = JSON.parse(raw) as { summary?: unknown; dayThemes?: unknown };
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:257:    const body = await request.json().catch(() => null);
src/app/api/_handlers/proposals/bulk/route.ts:23:    const body = await request.json().catch(() => null);
src/app/api/_handlers/whatsapp/broadcast/route.ts:360:    const body = await request.json().catch(() => null);
src/lib/payments/razorpay.ts:138:  const payload = await response.json().catch(() => null);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:62:    const body = await req.json().catch(() => ({}));
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:64:        const body = await request.json().catch(() => null);
src/app/api/_handlers/admin/social/generate/route.ts:216:    const parsedJson = JSON.parse(raw);
src/app/api/_handlers/admin/social/generate/route.ts:261:    const body = await request.json().catch(() => null);
src/lib/payments/link-tracker.ts:11:  const payload = (await response.json().catch(() => null)) as
src/app/api/_handlers/admin/clear-cache/route.ts:22:        const body = await req.json().catch(() => null);
src/lib/proposal-notifications.ts:33:  const payload = await response.json().catch(() => ({}));
src/app/api/_handlers/admin/insights/best-quote/route.ts:39:    const body = await req.json().catch(() => ({}));
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts:110:      body = JSON.parse(rawBody);
src/app/api/_handlers/whatsapp/webhook/route.ts:137:        const payload = JSON.parse(rawBody) as unknown;
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:186:    const body = (await req.json().catch(() => ({}))) as {
src/lib/assistant/orchestrator.ts:84:    return lines.map((line) => JSON.parse(line) as FaqRow);
src/lib/assistant/orchestrator.ts:303:    params = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
src/app/api/_handlers/notifications/send/route.ts:161:        const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/admin/cost/overview/route.ts:796:  const body = await request.json().catch(() => null);
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:146:        const body = await req.json().catch(() => ({}));
src/app/api/_handlers/invoices/send-pdf/route.ts:42:    const parsed = SendInvoicePdfSchema.safeParse(await request.json().catch(() => null));
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:18:  const body = await request.json().catch(() => null);
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:151:        const payloadRaw = await request.json().catch(() => null);
src/app/api/_handlers/bookings/flights/search/route.ts:114:    const payload = await response.json().catch(() => ({}));
src/app/api/_handlers/ai/suggest-reply/route.ts:40:      JSON.parse(serializedInput) as z.infer<typeof SuggestReplySchema>,
src/app/api/_handlers/marketplace/route.ts:513:        const body = await req.json().catch(() => null);
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:33:        const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:103:        const body = await req.json().catch(() => null);
src/app/api/_handlers/marketplace/inquiries/route.ts:174:        const payloadRaw = await request.json().catch(() => null);
src/app/api/_handlers/webhooks/whatsapp/route.ts:134:    payload = JSON.parse(rawBody) as MetaWebhookPayload;
src/app/api/_handlers/social/reviews/public/route.ts:107:        const body = await req.json().catch(() => null);
src/app/api/_handlers/webhooks/waha/route.ts:80:        event = JSON.parse(rawBody) as WppEvent;
src/app/api/_handlers/itineraries/[id]/bookings/route.ts:112:    const body = await req.json().catch(() => null);
src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route.ts:36:    const body = requestSchema.parse(await req.json().catch(() => ({})));
src/app/api/_handlers/itinerary/generate/route.ts:343:                        typeof cachedRedis === 'string' ? JSON.parse(cachedRedis) : cachedRedis;
src/app/api/_handlers/itinerary/generate/route.ts:588:                    itinerary = JSON.parse(responseContent) as ItineraryLike;
src/app/api/_handlers/itinerary/generate/route.ts:609:                itinerary = JSON.parse(responseText.trim()) as ItineraryLike;
src/app/api/_handlers/social/ai-poster/route.ts:65:        const response = JSON.parse(result.response.text());
src/app/api/_handlers/itinerary/import/pdf/route.ts:116:        const itineraryJson = JSON.parse(itineraryText);
src/app/api/_handlers/integrations/places/route.ts:90:  const payload = (await response.json().catch(() => null)) as {
src/app/api/_handlers/integrations/places/route.ts:154:    const body = (await request.json().catch(() => ({}))) as PlacesRequestBody;
src/app/api/_handlers/social/extract/route.ts:91:    const response = JSON.parse(result.response.text());
src/app/api/_handlers/reputation/sync/route.ts:129:    const body = (await request.json().catch(() => ({}))) as {
src/app/api/_handlers/reputation/ai/analyze/route.ts:64:  const parsed = JSON.parse(cleaned);
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:98:    const body = await request.json().catch(() => null);
src/app/api/_handlers/social/smart-poster/route.ts:64:        const parsed = JSON.parse(geminiResult.response.text());
src/app/api/_handlers/reputation/ai/respond/route.ts:110:  const parsed = JSON.parse(cleaned);
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:75:  const parsed = JSON.parse(cleaned);
src/app/api/_handlers/itinerary/import/url/route.ts:126:        const parsedBody = await req.json().catch(() => null);
src/app/api/_handlers/itinerary/import/url/route.ts:188:        const itineraryJson = JSON.parse(itineraryText);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:186:    const body = await request.json().catch(() => null);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:264:    const body = await request.json().catch(() => null);
src/app/api/_handlers/social/captions/route.ts:108:    const response = JSON.parse(result.response.text());

WEAK_CRYPTO_HEURISTICS
src/lib/analytics/template-analytics.ts:193:      .gte('viewed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
src/lib/analytics/template-analytics.ts:203:      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
src/lib/analytics/template-analytics.ts:212:      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
src/app/p/[token]/page.tsx:308:      ? Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
src/app/planner/NeedsAttentionQueue.tsx:53:    const hoursAgo = (Date.now() - latestActivity.getTime()) / (1000 * 60 * 60);
src/lib/whatsapp/chatbot-flow.ts:315:  const cutoff = new Date(Date.now() - RECENT_HUMAN_REPLY_WINDOW_MS).toISOString();
src/lib/whatsapp/chatbot-flow.ts:547:    provider_message_id: crypto.randomUUID(),
src/lib/whatsapp/proposal-drafts.server.ts:73:  const suffix = digits || crypto.randomUUID().replace(/-/g, "");
src/lib/whatsapp/proposal-drafts.server.ts:280:  const profileId = existingProfile?.id ?? crypto.randomUUID();
src/components/whatsapp/WhatsAppConnectModal.tsx:54:        setSessionName("demo_" + Date.now());
src/app/social/_components/ContentBar.tsx:153:      id: Date.now().toString(36),
src/components/whatsapp/UnifiedInbox.tsx:290:            id: `m_${Date.now()}`,
src/components/whatsapp/UnifiedInbox.tsx:311:    const optimisticId = `pending_${Date.now()}`;
src/app/social/_components/CarouselBuilder.tsx:32:            id: Date.now().toString(),
src/app/social/_components/MediaLibrary.tsx:90:            const fileName = `${Date.now()}-${file.name}`;
src/app/admin/trips/[id]/_components/DayActivities.tsx:110:    const [now] = useState(() => Date.now());
src/components/trips/group-manager-shared.tsx:75:  return `t-${crypto.randomUUID()}`
src/app/social/_components/TemplateEditor.tsx:235:                                    link.download = `smart-poster-${Date.now()}.png`;
src/app/proposals/page.tsx:373:                          <span>{formatLocalDate(proposal.created_at || Date.now(), timezone)}</span>
src/app/api/_handlers/share/[token]/route.ts:83:  return parsed.getTime() < Date.now();
src/app/api/_handlers/share/[token]/route.ts:117:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/share/[token]/route.ts:163:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/lib/notifications/browser-push.ts:90:      timestamp: Date.now(),
src/app/social/_components/PlatformStatusBar.tsx:28:                const nowMs = Date.now();
src/app/social/_components/SocialStudioClient.tsx:157:                savedAt: Date.now(),
src/app/social/_components/SocialStudioClient.tsx:174:            if (Date.now() - draft.savedAt > TWENTY_FOUR_HOURS) return;
src/app/social/_components/StockTab.tsx:82:                      ? [{ id: `single-${Date.now()}`, url: data.url }]
src/app/proposals/[id]/page.tsx:641:                      {formatLocalDate(comment.created_at || Date.now(), timezone)}
src/app/proposals/[id]/page.tsx:700:                {formatLocalDateTime(comments[0].created_at || Date.now(), timezone)}
src/app/drivers/page.tsx:130:            const slug = `agency-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
src/components/ShareTripModal.tsx:48:            const token = crypto.randomUUID();
src/app/admin/tour-templates/create/page.tsx:37:    id: crypto.randomUUID(),
src/app/admin/tour-templates/create/page.tsx:48:    id: crypto.randomUUID(),
src/app/admin/tour-templates/create/page.tsx:63:    id: crypto.randomUUID(),
src/app/social/_components/template-gallery/FestivalBanner.tsx:19:        (new Date(festival.date).getTime() - Date.now()) / 86400000
src/app/social/_components/AiTab.tsx:147:                    timestamp: Date.now(),
src/app/social/_components/AiTab.tsx:212:                timestamp: Date.now(),
src/lib/external/amadeus.ts:36:  if (cachedToken && Date.now() < tokenExpiry - 30000) {
src/lib/external/amadeus.ts:66:  tokenExpiry = Date.now() + data.expires_in * 1000;
src/components/planner/ApprovalManager.tsx:200:          id: `queued-${Date.now()}`,
src/components/planner/LogisticsManager.tsx:29:        id: crypto.randomUUID(),
src/components/planner/LogisticsManager.tsx:40:        id: crypto.randomUUID(),
src/components/planner/PricingManager.tsx:68:                id: crypto.randomUUID(),
src/lib/api-dispatch.ts:87:            const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
src/components/bookings/HotelSearch.tsx:44:    const [checkOut, setCheckOut] = useState(toDateInput(new Date(Date.now() + 86400000)));
src/lib/pwa/offline-mutations.ts:36:    return crypto.randomUUID();
src/lib/pwa/offline-mutations.ts:39:  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
src/lib/pwa/offline-mutations.ts:185:    createdAt: Date.now(),
src/lib/ai/upsell-engine.ts:326:      .gte('purchased_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
src/app/(superadmin)/god/support/page.tsx:60:    const diff = Date.now() - new Date(iso).getTime();
src/components/payments/PaymentLinkButton.tsx:30:  const diff = Date.now() - new Date(isoString).getTime()
src/components/payments/PaymentTracker.tsx:38:  const diff = Date.now() - new Date(isoString).getTime()
src/app/(superadmin)/god/audit-log/page.tsx:48:    const diff = Date.now() - new Date(iso).getTime();
src/app/(superadmin)/god/announcements/page.tsx:36:    const diff = Date.now() - new Date(iso).getTime();
src/app/api/_handlers/proposals/[id]/send/route.ts:225:    proposal.expires_at && new Date(proposal.expires_at).getTime() > Date.now()
src/app/api/_handlers/proposals/[id]/send/route.ts:227:      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/share/[token]/route.ts:83:  return parsed.getTime() < Date.now();
src/app/api/_handlers/share/[token]/route.ts:117:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/share/[token]/route.ts:163:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/components/CreateTripModal.tsx:378:                const token = crypto.randomUUID();
src/app/settings/marketplace/page.tsx:314:                    id: crypto.randomUUID(),
src/app/settings/marketplace/page.tsx:382:                    id: crypto.randomUUID(),
src/lib/shared-itinerary-cache.ts:154:  const startedAt = Date.now();
src/lib/shared-itinerary-cache.ts:185:        responseTimeMs: Date.now() - startedAt,
src/lib/shared-itinerary-cache.ts:227:        responseTimeMs: Date.now() - startedAt,
src/lib/shared-itinerary-cache.ts:248:      responseTimeMs: Date.now() - startedAt,
src/lib/shared-itinerary-cache.ts:316:  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
src/lib/security/rate-limit.ts:71:    const now = Date.now();
src/lib/security/rate-limit.ts:131:                reset: Date.now() + options.windowMs,
src/lib/security/rate-limit.ts:144:            reset: typeof result.reset === "number" ? result.reset : Date.now() + options.windowMs,
src/app/api/_handlers/proposals/[id]/pdf/route.ts:148:      if (Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
src/lib/security/social-oauth-state.ts:92:  const now = Date.now();
src/lib/security/social-oauth-state.ts:108:    nonce: randomBytes(16).toString("hex"),
src/lib/security/social-oauth-state.ts:109:    ts: Date.now(),
src/lib/security/social-oauth-state.ts:166:  const now = Date.now();
src/lib/security/cron-auth.ts:107:    const now = Date.now();
src/lib/security/cron-auth.ts:139:    const now = Date.now();
src/lib/security/cron-auth.ts:173:    const minuteBucket = Math.floor(Date.now() / 60_000);
src/app/api/_handlers/proposals/[id]/send/route.ts:225:    proposal.expires_at && new Date(proposal.expires_at).getTime() > Date.now()
src/app/api/_handlers/proposals/[id]/send/route.ts:227:      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
src/lib/security/public-rate-limit.ts:46:  const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/lib/reputation/campaign-trigger.ts:83:      Date.now() - delayHours * 60 * 60 * 1000
src/lib/reputation/campaign-trigger.ts:143:        Date.now() + 7 * 24 * 60 * 60 * 1000
src/lib/security/social-token-crypto.ts:3:const DEV_EPHEMERAL_KEY = randomBytes(32).toString("hex");
src/lib/security/social-token-crypto.ts:81:  const iv = randomBytes(12);
src/app/api/_handlers/proposals/[id]/pdf/route.ts:148:      if (Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
src/lib/security/safe-equal.ts:11:    const valuesEqual = timingSafeEqual(paddedLeft, paddedRight);
src/lib/observability/logger.ts:69:        return globalThis.crypto.randomUUID();
src/lib/observability/logger.ts:72:    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
src/lib/security/cost-endpoint-guard.ts:230:      Math.ceil((Math.min(burstLimit.reset, dailyLimit.reset) - Date.now()) / 1000)
src/app/api/_handlers/proposals/public/[token]/route.ts:97:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/proposals/public/[token]/route.ts:97:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/lib/geocoding.ts:32:    if (Date.now() > entry.expiresAt) {
src/lib/geocoding.ts:45:    geocodeCache.set(key, { result, expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS });
src/components/ui/toast.tsx:75:            const id = crypto.randomUUID();
src/lib/invoices/public-link.ts:36:  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
src/app/clients/[id]/client-profile-shared.ts:51:  const ms = Date.now() - new Date(dateStr).getTime();
src/app/clients/[id]/client-profile-shared.ts:74:  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
src/lib/cache/upstash.ts:52:    if (entry.expiresAt <= Date.now()) {
src/lib/cache/upstash.ts:76:    const now = Date.now();
src/lib/payments/payment-links.server.ts:253:    ? new Date(Date.now() + args.expiresInHours * 60 * 60 * 1000).toISOString()
src/lib/payments/payment-links.server.ts:254:    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
src/lib/payments/payment-links.server.ts:432:  return crypto.timingSafeEqual(expected, received);
src/lib/payments/razorpay.ts:162:  return crypto.timingSafeEqual(expected, received);
src/lib/payments/order-service.ts:31:      receipt: `rcpt_${Date.now()}`,
src/lib/admin/action-queue.ts:33:  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000));
src/lib/admin/action-queue.ts:68:  const staleCutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
src/lib/admin/insights.ts:36:  return (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
src/lib/admin/insights.ts:43:  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
src/lib/payments/invoice-service.ts:98:        invoice_number: `INV-${Date.now()}`,
src/lib/payments/invoice-service.ts:111:        due_date: (options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
src/app/api/_handlers/whatsapp/broadcast/route.ts:274:        id: row.wa_id || crypto.randomUUID(),
src/app/api/_handlers/whatsapp/broadcast/route.ts:404:        const providerMessageId = crypto.randomUUID();
src/app/api/_handlers/whatsapp/broadcast/route.ts:274:        id: row.wa_id || crypto.randomUUID(),
src/app/api/_handlers/whatsapp/broadcast/route.ts:404:        const providerMessageId = crypto.randomUUID();
src/lib/cost/spend-guardrails.ts:115:  const now = Date.now();
src/lib/network/retry.ts:54:        const waitMs = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 100);
src/lib/assistant/alerts.ts:63:  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
src/lib/assistant/alerts.ts:67:  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
src/components/assistant/TourAssistantChat.tsx:150:            id: `u-${Date.now()}`,
src/components/assistant/TourAssistantChat.tsx:161:        const assistantId = `a-${Date.now()}`;
src/components/assistant/TourAssistantChat.tsx:356:                id: `a-${Date.now()}`,
src/components/assistant/TourAssistantChat.tsx:365:                { id: `err-${Date.now()}`, role: "assistant", content: "Connection error. Please try again." },
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:138:                chatbot_session_id: crypto.randomUUID(),
src/lib/auth/admin-helpers.ts:26:  return Math.random() < ANON_AUTH_FAILURE_SAMPLE_RATE;
src/lib/assistant/actions/reads/dashboard.ts:58:  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
src/app/api/_handlers/whatsapp/send/route.ts:65:    const providerMessageId = crypto.randomUUID();
src/app/api/_handlers/auth/password-login/route.ts:65:        Math.ceil((rateLimit.reset - Date.now()) / 1000)
src/app/reputation/_components/CompetitorBenchmark.tsx:95:      id: crypto.randomUUID(),
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:138:                chatbot_session_id: crypto.randomUUID(),
src/app/api/_handlers/whatsapp/send/route.ts:65:    const providerMessageId = crypto.randomUUID();
src/app/admin/settings/marketplace/page.tsx:279:                id: crypto.randomUUID(),
src/app/admin/settings/marketplace/page.tsx:296:                id: crypto.randomUUID(),
src/lib/assistant/context-engine.ts:22:  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
src/lib/assistant/context-engine.ts:238:  if (cached && cached.expiresAt > Date.now()) {
src/lib/assistant/context-engine.ts:246:    expiresAt: Date.now() + CACHE_TTL_MS,
src/app/api/_handlers/admin/reports/gst/route.ts:64:      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/whatsapp/test-message/route.ts:47:            messageId: "wpp_" + Date.now(),
src/app/api/_handlers/admin/insights/win-loss/route.ts:26:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:69:    const idempotencyKey = `analytics-batch:${admin.organizationId}:${parsed.data.job_type}:${Date.now()}`;
src/app/api/_handlers/whatsapp/webhook/route.ts:74:    return timingSafeEqual(providedBuffer, expectedBuffer);
src/app/api/_handlers/whatsapp/webhook/route.ts:112:                    provider_message_id: `invalid-signature-${Date.now()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
src/app/api/_handlers/whatsapp/webhook/route.ts:347:        const fileName = `wa_${image.imageId}_${Date.now()}.${fileExt}`;
src/app/api/_handlers/admin/whatsapp/health/route.ts:14:  return Math.max(0, Math.floor((Date.now() - t) / 60000));
src/app/api/_handlers/admin/insights/auto-requote/route.ts:29:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/auto-requote/route.ts:53:          ? (new Date(proposal.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
src/app/api/_handlers/payments/razorpay/route.ts:20:    const orderId = `order_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`
src/app/api/_handlers/payments/razorpay/route.ts:29:      receipt: receipt ?? `rcpt_${Date.now()}`,
src/app/api/_handlers/payments/razorpay/route.ts:32:      created_at: Math.floor(Date.now() / 1000),
src/app/api/_handlers/payments/razorpay/route.ts:60:      payment_id: `pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`,
src/app/api/_handlers/onboarding/setup/route.ts:126:    const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
src/app/api/_handlers/onboarding/setup/route.ts:127:    const timePart = Date.now().toString(36).slice(-4);
src/app/api/_handlers/admin/notifications/delivery/route.ts:13:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:49:    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:50:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:169:    const staleLeadCutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
src/lib/assistant/weekly-digest.ts:60:  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
src/lib/assistant/weekly-digest.ts:64:  return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/webhooks/whatsapp/route.ts:74:  return timingSafeEqual(providedBuffer, expectedBuffer);
src/app/api/_handlers/admin/insights/daily-brief/route.ts:26:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/daily-brief/route.ts:28:    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/whatsapp/test-message/route.ts:47:            messageId: "wpp_" + Date.now(),
src/app/api/_handlers/admin/insights/margin-leak/route.ts:29:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/margin-leak/route.ts:65:          ? Math.max(0, (Date.now() - new Date(proposal.created_at).getTime()) / (1000 * 60 * 60 * 24))
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:63:    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/whatsapp/webhook/route.ts:74:    return timingSafeEqual(providedBuffer, expectedBuffer);
src/app/api/_handlers/whatsapp/webhook/route.ts:112:                    provider_message_id: `invalid-signature-${Date.now()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
src/app/api/_handlers/whatsapp/webhook/route.ts:347:        const fileName = `wa_${image.imageId}_${Date.now()}.${fileExt}`;
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:29:    const endWindow = new Date(Date.now() + parsed.data.daysForward * 24 * 60 * 60 * 1000);
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:79:          ? Math.max(0, Math.round((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
src/app/api/_handlers/onboarding/setup/route.ts:126:    const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
src/app/api/_handlers/onboarding/setup/route.ts:127:    const timePart = Date.now().toString(36).slice(-4);
src/app/api/_handlers/admin/insights/roi/route.ts:37:  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/dashboard/tasks/route.ts:163:    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/social/reviews/public/route.ts:56:    return Number.isFinite(ts) && ts <= Date.now();
src/app/api/_handlers/social/reviews/public/route.ts:133:            const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/social/reviews/public/route.ts:160:        const duplicateCutoffIso = new Date(Date.now() - 15 * 60_000).toISOString();
src/app/api/_handlers/social/reviews/public/route.ts:203:            const template_id = reviewTemplateIds[Math.floor(Math.random() * reviewTemplateIds.length)];
src/app/api/_handlers/admin/insights/action-queue/route.ts:28:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/action-queue/route.ts:30:    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/social/process-queue/route.ts:125:                const platformPostId = `cron_${platform}_${Date.now()}`;
src/app/api/_handlers/notifications/send/route.ts:123:    const startedAt = Date.now();
src/app/api/_handlers/notifications/send/route.ts:148:            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/notifications/send/route.ts:221:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/assistant/chat/stream/route.ts:659:    const sessionId = `s-${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
src/app/api/_handlers/notifications/send/route.ts:123:    const startedAt = Date.now();
src/app/api/_handlers/notifications/send/route.ts:148:            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/notifications/send/route.ts:221:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/notifications/process-queue/route.ts:223:    const shareToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/notifications/process-queue/route.ts:224:    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/notifications/process-queue/route.ts:465:    const startedAt = Date.now();
src/app/api/_handlers/notifications/process-queue/route.ts:549:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/notifications/process-queue/route.ts:223:    const shareToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/notifications/process-queue/route.ts:224:    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/notifications/process-queue/route.ts:465:    const startedAt = Date.now();
src/app/api/_handlers/notifications/process-queue/route.ts:549:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/notifications/schedule-followups/route.ts:49:  const minimum = new Date(Date.now() + 2 * 60_000);
src/app/api/_handlers/notifications/schedule-followups/route.ts:49:  const minimum = new Date(Date.now() + 2 * 60_000);
src/app/api/_handlers/admin/reports/gst/route.ts:64:      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/dashboard/stats/route.ts:32:    const yearAgoISO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/whatsapp/health/route.ts:14:  return Math.max(0, Math.floor((Date.now() - t) / 60000));
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:14:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/tour-templates/extract/route.ts:28:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:142:    const fileName = `${scopedOrg.organizationId}/${Date.now()}-${safeFileName}`;
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts:8:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts:42:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/admin/seed-demo/fixture.ts:57:  return crypto.randomUUID();
src/app/api/_handlers/admin/cost/overview/shared.ts:246:    Math.round((Date.now() - new Date(cachedAt).getTime()) / 1000),
src/app/api/_handlers/admin/marketplace/verify/route.ts:90:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/marketplace/verify/route.ts:99:    const startedAt = Date.now();
src/app/api/_handlers/admin/marketplace/verify/route.ts:162:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/marketplace/verify/route.ts:194:    const startedAt = Date.now();
src/app/api/_handlers/admin/marketplace/verify/route.ts:332:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/settings/team/shared.ts:94:  const diffMs = Date.now() - timestamp;
src/app/api/_handlers/admin/notifications/delivery/route.ts:13:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/superadmin/overview/route.ts:13:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/overview/route.ts:54:            const d = new Date(Date.now() - (29 - i) * 86_400_000);
src/app/api/_handlers/admin/workflow/events/route.ts:14:    const startedAt = Date.now();
src/app/api/_handlers/admin/workflow/events/route.ts:31:            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/workflow/events/route.ts:108:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/workflow/rules/route.ts:26:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:14:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:42:            oldestPendingMinutes = Math.floor((Date.now() - oldest.getTime()) / 60_000);
src/app/api/_handlers/social/posts/[id]/render/route.ts:38:        const storagePath = `${profile.organization_id}/posts/${Date.now()}-${filename}`;
src/app/api/_handlers/admin/social/generate/route.ts:249:      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/superadmin/monitoring/health/route.ts:21:    const start = Date.now();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:25:        return { status: "healthy", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:27:        return { status: "down", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:34:    const start = Date.now();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:37:        return { status: "healthy", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:39:        return { status: "down", latency_ms: Date.now() - start };
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:45:    const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:192:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/contacts/route.ts:50:  const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/route.ts:114:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/contacts/route.ts:139:  const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/route.ts:260:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/trips/[id]/route.ts:48:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/superadmin/users/signups/route.ts:15:    return new Date(Date.now() - days * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/users/signups/route.ts:75:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:241:      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/trips/route.ts:82:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/webhooks/whatsapp/route.ts:74:  return timingSafeEqual(providedBuffer, expectedBuffer);
src/app/api/_handlers/admin/referrals/route.ts:175:        (Date.now() - new Date(myOrg.created_at).getTime()) /
src/app/api/_handlers/admin/trips/[id]/route.ts:48:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/security/diagnostics/route.ts:13:  const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/security/diagnostics/route.ts:46:    const now = Date.now();
src/app/api/_handlers/health/route.ts:49:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:53:        return { response, latency: Date.now() - startedAt };
src/app/api/_handlers/health/route.ts:57:            latency: Date.now() - startedAt,
src/app/api/_handlers/health/route.ts:110:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:115:    const latency = Date.now() - startedAt;
src/app/api/_handlers/health/route.ts:338:        ? Math.max(0, Math.round((Date.now() - new Date(oldestPendingIso).getTime()) / 60000))
src/app/api/_handlers/health/route.ts:363:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:371:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/health/route.ts:408:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/cost/overview/shared.ts:246:    Math.round((Date.now() - new Date(cachedAt).getTime()) / 1000),
src/app/api/_handlers/social/reviews/public/route.ts:56:    return Number.isFinite(ts) && ts <= Date.now();
src/app/api/_handlers/social/reviews/public/route.ts:133:            const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/social/reviews/public/route.ts:160:        const duplicateCutoffIso = new Date(Date.now() - 15 * 60_000).toISOString();
src/app/api/_handlers/social/reviews/public/route.ts:203:            const template_id = reviewTemplateIds[Math.floor(Math.random() * reviewTemplateIds.length)];
src/app/api/_handlers/admin/clients/route.ts:61:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/clients/route.ts:719:                idempotency_key: `lifecycle-stage:${existingProfile.id}:${existingProfile.lifecycle_stage || "lead"}:${lifecycleStage}:${Date.now()}`,
src/app/api/_handlers/location/share/route.ts:119:        const shareToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/location/share/route.ts:120:        const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/marketplace/verify/route.ts:90:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/marketplace/verify/route.ts:99:    const startedAt = Date.now();
src/app/api/_handlers/admin/marketplace/verify/route.ts:162:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/marketplace/verify/route.ts:194:    const startedAt = Date.now();
src/app/api/_handlers/admin/marketplace/verify/route.ts:332:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/dashboard/tasks/route.ts:163:    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/win-loss/route.ts:26:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/social/process-queue/route.ts:125:                const platformPostId = `cron_${platform}_${Date.now()}`;
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:69:    const idempotencyKey = `analytics-batch:${admin.organizationId}:${parsed.data.job_type}:${Date.now()}`;
src/app/api/_handlers/location/live/[token]/route.ts:35:        const windowStartIso = new Date(Date.now() - SHARE_RATE_LIMIT_WINDOW_MS).toISOString();
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:45:    const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:192:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/insights/auto-requote/route.ts:29:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/auto-requote/route.ts:53:          ? (new Date(proposal.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
src/app/api/_handlers/admin/contacts/route.ts:50:  const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/route.ts:114:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/contacts/route.ts:139:  const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/route.ts:260:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/location/client-share/route.ts:71:        const shareToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/location/client-share/route.ts:72:        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/location/ping/route.ts:100:            const sinceMs = Date.now() - new Date(latestPing.recorded_at).getTime();
src/app/api/_handlers/superadmin/cost/trends/route.ts:8:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/cost/trends/route.ts:29:            const d = new Date(Date.now() - i * 86_400_000);
src/app/api/_handlers/superadmin/cost/trends/route.ts:52:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/admin/referrals/route.ts:175:        (Date.now() - new Date(myOrg.created_at).getTime()) /
src/app/api/_handlers/location/cleanup-expired/route.ts:35:    if (Math.abs(Date.now() - tsMs) > 5 * 60_000) return false;
src/app/api/_handlers/location/cleanup-expired/route.ts:42:    return timingSafeEqual(sigBuf, expectedBuf);
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts:8:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:49:    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:50:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:169:    const staleLeadCutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts:42:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/admin/security/diagnostics/route.ts:13:  const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/security/diagnostics/route.ts:46:    const now = Date.now();
src/app/api/_handlers/superadmin/overview/route.ts:13:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/overview/route.ts:54:            const d = new Date(Date.now() - (29 - i) * 86_400_000);
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:42:            oldestPendingMinutes = Math.floor((Date.now() - oldest.getTime()) / 60_000);
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:13:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:105:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/auth/password-login/route.ts:65:        Math.ceil((rateLimit.reset - Date.now()) / 1000)
src/app/api/_handlers/admin/insights/daily-brief/route.ts:26:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/daily-brief/route.ts:28:    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:241:      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/clients/route.ts:61:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/clients/route.ts:719:                idempotency_key: `lifecycle-stage:${existingProfile.id}:${existingProfile.lifecycle_stage || "lead"}:${lifecycleStage}:${Date.now()}`,
src/app/api/_handlers/admin/trips/route.ts:82:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/insights/margin-leak/route.ts:29:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/margin-leak/route.ts:65:          ? Math.max(0, (Date.now() - new Date(proposal.created_at).getTime()) / (1000 * 60 * 60 * 24))
src/app/api/_handlers/social/posts/[id]/render/route.ts:38:        const storagePath = `${profile.organization_id}/posts/${Date.now()}-${filename}`;
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:63:    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/marketplace/stats/route.ts:14:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/stats/route.ts:113:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/workflow/events/route.ts:14:    const startedAt = Date.now();
src/app/api/_handlers/admin/workflow/events/route.ts:31:            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/workflow/events/route.ts:108:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:29:    const endWindow = new Date(Date.now() + parsed.data.daysForward * 24 * 60 * 60 * 1000);
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:79:          ? Math.max(0, Math.round((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:49:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:80:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:109:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:172:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/view/route.ts:18:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/view/route.ts:86:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/workflow/rules/route.ts:26:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/insights/roi/route.ts:37:  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:100:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:237:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/superadmin/monitoring/health/route.ts:21:    const start = Date.now();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:25:        return { status: "healthy", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:27:        return { status: "down", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:34:    const start = Date.now();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:37:        return { status: "healthy", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:39:        return { status: "down", latency_ms: Date.now() - start };
src/app/api/_handlers/admin/insights/action-queue/route.ts:28:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/action-queue/route.ts:30:    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/reputation/widget/config/route.ts:103:    const embedToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/admin/social/generate/route.ts:249:      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/superadmin/users/signups/route.ts:15:    return new Date(Date.now() - days * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/users/signups/route.ts:75:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/payments/razorpay/route.ts:20:    const orderId = `order_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`
src/app/api/_handlers/payments/razorpay/route.ts:29:      receipt: receipt ?? `rcpt_${Date.now()}`,
src/app/api/_handlers/payments/razorpay/route.ts:32:      created_at: Math.floor(Date.now() / 1000),
src/app/api/_handlers/payments/razorpay/route.ts:60:      payment_id: `pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`,
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:61:        Date.now() - delayHours * 60 * 60 * 1000
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:121:          Date.now() + 7 * 24 * 60 * 60 * 1000
src/app/api/_handlers/settings/team/shared.ts:94:  const diffMs = Date.now() - timestamp;
src/app/api/_handlers/marketplace/options/route.ts:166:  const startedAt = Date.now();
src/app/api/_handlers/marketplace/options/route.ts:187:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/options/route.ts:227:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:72:  const now = Date.now();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:93:    new Date(subscription.current_period_end).getTime() < Date.now()
src/app/api/_handlers/marketplace/inquiries/route.ts:48:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/inquiries/route.ts:108:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/inquiries/route.ts:149:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/inquiries/route.ts:212:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/seed-demo/fixture.ts:57:  return crypto.randomUUID();
src/app/api/_handlers/admin/tour-templates/extract/route.ts:28:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:142:    const fileName = `${scopedOrg.organizationId}/${Date.now()}-${safeFileName}`;
src/app/api/_handlers/marketplace/stats/route.ts:14:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/stats/route.ts:113:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/superadmin/cost/trends/route.ts:8:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/cost/trends/route.ts:29:            const d = new Date(Date.now() - i * 86_400_000);
src/app/api/_handlers/superadmin/cost/trends/route.ts:52:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:49:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:80:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:109:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:172:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/view/route.ts:18:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/view/route.ts:86:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:100:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:237:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/route.ts:210:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/route.ts:370:                isFeatured && featuredUntil !== null && Date.parse(featuredUntil) > Date.now();
src/app/api/_handlers/marketplace/route.ts:456:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/route.ts:495:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/route.ts:553:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/assistant/chat/stream/route.ts:659:    const sessionId = `s-${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
src/app/api/_handlers/marketplace/inquiries/route.ts:48:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/inquiries/route.ts:108:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/inquiries/route.ts:149:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/inquiries/route.ts:212:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:13:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:105:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:93:    new Date(subscription.current_period_end).getTime() < Date.now()
src/app/api/_handlers/marketplace/options/route.ts:166:  const startedAt = Date.now();
src/app/api/_handlers/marketplace/options/route.ts:187:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/options/route.ts:227:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:72:  const now = Date.now();
src/app/api/_handlers/reputation/widget/config/route.ts:103:    const embedToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/health/route.ts:49:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:53:        return { response, latency: Date.now() - startedAt };
src/app/api/_handlers/health/route.ts:57:            latency: Date.now() - startedAt,
src/app/api/_handlers/health/route.ts:110:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:115:    const latency = Date.now() - startedAt;
src/app/api/_handlers/health/route.ts:338:        ? Math.max(0, Math.round((Date.now() - new Date(oldestPendingIso).getTime()) / 60000))
src/app/api/_handlers/health/route.ts:363:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:371:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/health/route.ts:408:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:61:        Date.now() - delayHours * 60 * 60 * 1000
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:121:          Date.now() + 7 * 24 * 60 * 60 * 1000
src/app/api/_handlers/location/ping/route.ts:100:            const sinceMs = Date.now() - new Date(latestPing.recorded_at).getTime();
src/app/api/_handlers/location/client-share/route.ts:71:        const shareToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/location/client-share/route.ts:72:        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/location/cleanup-expired/route.ts:35:    if (Math.abs(Date.now() - tsMs) > 5 * 60_000) return false;
src/app/api/_handlers/location/cleanup-expired/route.ts:42:    return timingSafeEqual(sigBuf, expectedBuf);
src/app/api/_handlers/admin/dashboard/stats/route.ts:32:    const yearAgoISO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/location/share/route.ts:119:        const shareToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/location/share/route.ts:120:        const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/location/live/[token]/route.ts:35:        const windowStartIso = new Date(Date.now() - SHARE_RATE_LIMIT_WINDOW_MS).toISOString();
src/app/api/_handlers/marketplace/route.ts:210:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/route.ts:370:                isFeatured && featuredUntil !== null && Date.parse(featuredUntil) > Date.now();
src/app/api/_handlers/marketplace/route.ts:456:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/route.ts:495:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/route.ts:553:        const durationMs = Date.now() - startedAt;

CLIENT_ENV_USAGE
src/components/analytics/RevenueChart.tsx:1:"use client";
src/lib/rag-itinerary.ts:22:    const key = process.env.OPENAI_API_KEY;
src/components/analytics/PostHogProvider.tsx:1:"use client";
src/components/analytics/PostHogProvider.tsx:13:    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
src/components/analytics/PostHogProvider.tsx:30:    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
src/components/analytics/PostHogProvider.tsx:34:    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
src/components/analytics/PostHogProvider.tsx:41:  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
src/lib/analytics/server.ts:5:    process.env.POSTHOG_PROJECT_API_KEY ||
src/lib/analytics/server.ts:6:    process.env.POSTHOG_API_KEY ||
src/lib/analytics/server.ts:7:    process.env.NEXT_PUBLIC_POSTHOG_KEY;
src/lib/analytics/server.ts:14:    host: process.env.POSTHOG_HOST || "https://app.posthog.com",
src/lib/analytics/events.ts:1:"use client";
src/components/whatsapp/action-picker/PaymentPicker.tsx:1:"use client";
src/features/admin/analytics/AdminAnalyticsView.tsx:1:"use client";
src/components/whatsapp/action-picker/ActionPickerModal.tsx:1:"use client";
src/components/whatsapp/action-picker/LocationRequestPicker.tsx:1:"use client";
src/app/p/[token]/error.tsx:1:"use client";
src/components/whatsapp/action-picker/DriverPicker.tsx:1:"use client";
src/features/admin/analytics/useAdminAnalytics.ts:1:"use client";
src/components/whatsapp/action-picker/ItineraryPicker.tsx:1:"use client";
src/lib/security/service-role-auth.ts:5:    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
src/features/admin/billing/useBillingData.ts:1:"use client";
src/features/admin/billing/BillingView.tsx:1:"use client";
src/components/whatsapp/WhatsAppConnectModal.tsx:1:"use client";
src/lib/security/mock-endpoint-guard.ts:4:  if (process.env.NODE_ENV === "production") {
src/lib/security/mock-endpoint-guard.ts:15:  const explicitMockEnable = process.env.ENABLE_MOCK_ENDPOINTS === "true";
src/lib/security/mock-endpoint-guard.ts:16:  if (process.env.NODE_ENV !== "development" && !explicitMockEnable) {
src/lib/api-dispatch.ts:7:  (process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || "")
src/features/admin/pricing/usePricingDashboard.ts:1:"use client";
src/lib/security/admin-mutation-csrf.ts:51:  const configuredToken = process.env.ADMIN_MUTATION_CSRF_TOKEN?.trim();
src/app/share/[token]/ShareTemplateRenderer.tsx:1:"use client";
src/lib/shared-itinerary-cache.ts:38:  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
src/lib/shared-itinerary-cache.ts:39:  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
src/lib/security/rate-limit.ts:33:    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/lib/security/rate-limit.ts:34:    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/lib/security/rate-limit.ts:100:    if (process.env.NODE_ENV === "production") {
src/lib/security/rate-limit.ts:121:        if (process.env.NODE_ENV === "production" && process.env.RATE_LIMIT_FAIL_OPEN !== "true") {
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
src/lib/supabase/server.ts:23:                                secure: process.env.NODE_ENV === 'production',
src/lib/security/social-oauth-state.ts:17:  return process.env.NODE_ENV === "production";
src/lib/security/social-oauth-state.ts:36:  return process.env.SOCIAL_OAUTH_STATE_SECRET?.trim() || "";
src/lib/security/social-oauth-state.ts:67:  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/lib/security/social-oauth-state.ts:68:  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/lib/supabase/env.ts:8:  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
src/lib/supabase/env.ts:9:  const vercelEnv = process.env.VERCEL_ENV?.toLowerCase();
src/lib/supabase/env.ts:18:  const explicit = process.env.ALLOW_SUPABASE_DEV_FALLBACK;
src/lib/supabase/env.ts:28:  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
src/lib/supabase/env.ts:29:  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
src/lib/supabase/env.ts:39:    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
src/lib/supabase/env.ts:40:    !supabaseAnonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
src/lib/itinerary-cache.ts:12:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
src/lib/itinerary-cache.ts:13:    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
src/lib/itinerary-cache.ts:16:        logEvent('warn', 'Supabase cache client unavailable - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
src/lib/supabase/admin.ts:19:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
src/lib/supabase/admin.ts:20:    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
src/lib/security/cron-auth.ts:29:        process.env.CRON_SIGNING_SECRET?.trim() ||
src/lib/security/cron-auth.ts:30:        process.env.NOTIFICATION_SIGNING_SECRET?.trim() ||
src/lib/security/cron-auth.ts:37:        process.env.CRON_SECRET || "",
src/lib/security/cron-auth.ts:38:        process.env.NOTIFICATION_CRON_SECRET || "",
src/lib/security/cron-auth.ts:49:    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/lib/security/cron-auth.ts:50:    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/lib/security/cron-auth.ts:91:            if (process.env.NODE_ENV === "production") {
src/lib/security/cron-auth.ts:99:    } else if (process.env.NODE_ENV === "production") {
src/lib/supabase/middleware.ts:36:                            secure: process.env.NODE_ENV === 'production',
src/lib/ai/cost-guardrails.ts:18:const DEFAULT_REQUEST_CAP = Number(process.env.AI_MAX_GENERATIONS_PER_ORG_MONTH || "400");
src/lib/ai/cost-guardrails.ts:19:const DEFAULT_SPEND_CAP_USD = Number(process.env.AI_MAX_SPEND_PER_ORG_MONTH_USD || "25");
src/lib/import/pdf-extractor.ts:17:    process.env.GOOGLE_API_KEY ||
src/lib/import/pdf-extractor.ts:18:    process.env.GOOGLE_GEMINI_API_KEY ||
src/lib/import/pdf-extractor.ts:19:    process.env.GEMINI_API_KEY
src/lib/security/social-token-crypto.ts:9:  return process.env.NODE_ENV === "production";
src/lib/security/social-token-crypto.ts:53:  const configured = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim();
src/lib/pdf-extractor.ts:32:    const key = process.env.OPENAI_API_KEY;
src/features/admin/pricing/useTripCosts.ts:1:"use client";
src/components/whatsapp/useSmartReplySuggestions.ts:1:"use client";
src/features/admin/pricing/components/TransactionLedger.tsx:1:"use client";
src/components/billing/UpgradeModal.tsx:1:"use client";
src/lib/security/safe-error.ts:1:const IS_PRODUCTION = process.env.NODE_ENV === "production";
src/lib/external/linkedin.server.ts:25:    const clientId = process.env.LINKEDIN_CLIENT_ID;
src/lib/external/linkedin.server.ts:26:    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
src/features/admin/pricing/components/CategoryBreakdownChart.tsx:1:"use client";
src/app/share/[token]/page.tsx:108:    // Delegate rendering to a client component — all template components use "use client"
src/lib/external/google.server.ts:27:    const clientId = process.env.GOOGLE_CLIENT_ID;
src/lib/external/google.server.ts:28:    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
src/lib/external/google.server.ts:61:    const clientId = process.env.GOOGLE_CLIENT_ID;
src/lib/external/google.server.ts:62:    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
src/features/admin/pricing/components/ProfitTrendChart.tsx:1:"use client";
src/app/share/[token]/error.tsx:1:"use client";
src/lib/security/diagnostics-auth.ts:20:    const configuredToken = process.env.HEALTHCHECK_TOKEN?.trim();
src/lib/external/amadeus.ts:10:  const explicit = process.env.AMADEUS_BASE_URL?.trim();
src/lib/external/amadeus.ts:15:  const envMode = (process.env.AMADEUS_ENV || 'production').trim().toLowerCase();
src/lib/external/amadeus.ts:17:    if (process.env.NODE_ENV === 'production') {
src/lib/external/amadeus.ts:28:  const clientId = process.env.AMADEUS_CLIENT_ID;
src/lib/external/amadeus.ts:29:  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
src/features/admin/pricing/components/TransactionDetailPanel.tsx:1:"use client";
src/app/analytics/page.tsx:1:"use client";
src/features/admin/pricing/components/PricingKpiCards.tsx:1:"use client";
src/features/admin/pricing/components/OverheadExpensesCard.tsx:1:"use client";
src/app/analytics/templates/page.tsx:1:"use client";
src/features/admin/pricing/components/TripCostEditor.tsx:1:"use client";
src/lib/security/whatsapp-webhook-config.ts:2:  if (process.env.NODE_ENV === "production") return false;
src/lib/security/whatsapp-webhook-config.ts:3:  return process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK === "true";
src/app/analytics/templates/error.tsx:1:"use client";
src/features/admin/pricing/components/MonthlyTripTable.tsx:1:"use client";
src/lib/observability/metrics.ts:7:    const apiKey = process.env.POSTHOG_PROJECT_API_KEY || process.env.POSTHOG_API_KEY || env.posthog.key;
src/lib/observability/metrics.ts:8:    const host = process.env.POSTHOG_HOST || "https://app.posthog.com";
src/app/analytics/error.tsx:1:"use client";
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
src/lib/geocoding-with-cache.ts:178:        logEvent('warn', 'NEXT_PUBLIC_MAPBOX_TOKEN not configured');
src/lib/geocoding-with-cache.ts:323:    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
src/lib/geocoding-with-cache.ts:324:    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
src/features/admin/pricing/useOverheads.ts:1:"use client";
src/app/analytics/drill-through/page.tsx:1:"use client";
src/features/admin/pricing/useTransactions.ts:1:"use client";
src/app/analytics/drill-through/error.tsx:1:"use client";
src/lib/config/env.ts:11:    publicKeyId: firstDefined(rawEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID),
src/lib/config/env.ts:15:    url: firstDefined(rawEnv.NEXT_PUBLIC_SUPABASE_URL),
src/lib/config/env.ts:16:    anonKey: firstDefined(rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
src/lib/config/env.ts:30:    dsn: firstDefined(rawEnv.NEXT_PUBLIC_SENTRY_DSN, rawEnv.SENTRY_DSN),
src/lib/config/env.ts:33:    key: firstDefined(rawEnv.NEXT_PUBLIC_POSTHOG_KEY),
src/lib/config/env.ts:36:    placesApiKey: firstDefined(rawEnv.GOOGLE_PLACES_API_KEY, rawEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
src/lib/config/env.ts:40:    url: firstDefined(rawEnv.NEXT_PUBLIC_APP_URL),
src/features/admin/revenue/useAdminRevenue.ts:1:"use client";
src/app/offline/error.tsx:1:"use client";
src/lib/geocoding.ts:67:    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
src/lib/geocoding.ts:70:        logEvent('warn', 'NEXT_PUBLIC_MAPBOX_TOKEN not configured. Geocoding disabled.');
src/features/admin/revenue/AdminRevenueView.tsx:1:"use client";
src/lib/invoices/public-link.ts:5:  return process.env.INVOICE_SIGNING_SECRET || env.razorpay.keySecret || env.razorpay.webhookSecret || null;
src/features/admin/dashboard/FunnelWidget.tsx:1:"use client";
src/features/admin/dashboard/DateRangePicker.tsx:1:"use client";
src/features/admin/dashboard/TopCustomersWidget.tsx:1:"use client";
src/features/admin/dashboard/TopDestinationsWidget.tsx:1:"use client";
src/lib/semantic-cache.ts:17:  const raw = Number(process.env.SEMANTIC_CACHE_MATCH_THRESHOLD);
src/lib/cache/upstash.ts:10:  return process.env.NODE_ENV !== "production";
src/lib/cache/upstash.ts:25:  const url = process.env.UPSTASH_REDIS_REST_URL;
src/lib/cache/upstash.ts:26:  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
src/app/proposals/create/error.tsx:1:"use client";
src/features/admin/invoices/InvoiceLivePreview.tsx:1:"use client";
src/lib/integrations.ts:20:    return process.env.NODE_ENV === "production";
src/features/admin/invoices/InvoiceCreateForm.tsx:1:"use client";
src/features/calendar/useCalendarAvailability.ts:1:"use client";
src/features/admin/invoices/InvoiceListPanel.tsx:1:"use client";
src/features/calendar/CalendarLegend.tsx:1:"use client";
src/lib/import/url-scraper.ts:16:    process.env.GOOGLE_API_KEY ||
src/lib/import/url-scraper.ts:17:    process.env.GOOGLE_GEMINI_API_KEY ||
src/lib/import/url-scraper.ts:18:    process.env.GEMINI_API_KEY
src/lib/marketplace-emails.ts:11:const apiKey = process.env.RESEND_API_KEY;
src/lib/marketplace-emails.ts:12:const fromEmail = process.env.WELCOME_FROM_EMAIL || "marketplace@itinerary.ai";
src/lib/payments/payment-utils.ts:23:    process.env.GST_COMPANY_STATE ||
src/lib/payments/payment-utils.ts:24:    process.env.NEXT_PUBLIC_GST_COMPANY_STATE ||
src/features/trip-detail/tabs/ClientCommsTab.tsx:1:"use client";
src/features/trip-detail/tabs/OverviewTab.tsx:1:"use client";
src/features/trip-detail/components/TripClientCard.tsx:1:"use client";
src/components/billing/PricingCard.tsx:1:"use client";
src/lib/queries/dashboard-tasks.ts:1:"use client";
src/app/proposals/[id]/error.tsx:1:"use client";
src/components/itinerary-templates/LuxuryResortView.tsx:1:"use client";
src/features/calendar/useCalendarEvents.ts:1:"use client";
src/features/trip-detail/TripDetailHeader.tsx:1:"use client";
src/components/itinerary-templates/TemplateSwitcher.tsx:1:"use client";
src/app/proposals/error.tsx:1:"use client";
src/features/trip-detail/TripDetailTabBar.tsx:1:"use client";
src/components/itinerary-templates/VisualJourneyView.tsx:1:"use client";
src/features/calendar/WeekTimeGrid.tsx:1:"use client";
src/lib/proposal-notifications.ts:24:      ? `${(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')}/api/proposals/${proposalId}/send`
src/lib/proposal-notifications.ts:52:    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
src/features/trip-detail/tabs/FinancialsTab.tsx:1:"use client";
src/features/calendar/AddEventModal.tsx:1:"use client";
src/components/itinerary-templates/BentoJourneyView.tsx:1:"use client";
src/components/itinerary-templates/SafariStoryView.tsx:1:"use client";
src/features/calendar/DayEventRow.tsx:1:"use client";
src/components/itinerary-templates/ProfessionalView.tsx:1:"use client";
src/features/trip-detail/tabs/ItineraryTab.tsx:1:"use client";
src/lib/email.ts:17:    const apiKey = process.env.RESEND_API_KEY;
src/lib/email.ts:18:    const fromEmail = process.env.WELCOME_FROM_EMAIL;
src/components/WeatherWidget.tsx:1:"use client";
src/features/trip-detail/components/TripNotificationHistory.tsx:1:"use client";
src/lib/cost/spend-guardrails.ts:57:  return process.env.NODE_ENV === "production";
src/lib/cost/spend-guardrails.ts:68:  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/lib/cost/spend-guardrails.ts:69:  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/features/trip-detail/components/TripFlightDetails.tsx:1:"use client";
src/components/itinerary/ProfessionalItineraryView.tsx:1:"use client";
src/features/trip-detail/components/TripInvoiceSection.tsx:1:"use client";
src/components/CurrencyConverter.tsx:1:"use client";
src/components/dashboard/ActivityFeed.tsx:1:"use client";
src/lib/platform/settings.ts:44:  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/lib/platform/settings.ts:45:  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/components/god-mode/GodModeShell.tsx:4:"use client";
src/features/trip-detail/components/TripStatusSidebar.tsx:1:"use client";
src/components/dashboard/WhatsAppDashboardPreview.tsx:1:"use client";
src/components/god-mode/ToggleSwitch.tsx:3:"use client";
src/components/god-mode/GodModeSidebar.tsx:4:"use client";
src/features/trip-detail/components/TripAccommodationCard.tsx:1:"use client";
src/lib/reputation/campaign-trigger.ts:145:      const npsLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reputation/nps/${npsToken}`;
src/components/dashboard/QuickActions.tsx:1:"use client";
src/components/god-mode/ConfirmDangerModal.tsx:3:"use client";
src/components/god-mode/TimeRangePicker.tsx:3:"use client";
src/lib/reputation/referral-flywheel.ts:10:const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
src/lib/reputation/referral-flywheel.ts:30:  const resendApiKey = process.env.RESEND_API_KEY;
src/lib/reputation/referral-flywheel.ts:32:    process.env.PROPOSAL_FROM_EMAIL ||
src/lib/reputation/referral-flywheel.ts:33:    process.env.WELCOME_FROM_EMAIL ||
src/lib/reputation/referral-flywheel.ts:34:    process.env.RESEND_FROM_EMAIL;
src/lib/assistant/orchestrator.ts:430:  const openaiKey = process.env.OPENAI_API_KEY;
src/components/god-mode/StatusDot.tsx:3:"use client";
src/features/trip-detail/components/TripFinancialSummary.tsx:1:"use client";
src/components/dashboard/ActionQueuePanels.tsx:1:"use client";
src/components/god-mode/TrendChart.tsx:4:"use client";
src/lib/whatsapp.server.ts:37:    const token = process.env.WHATSAPP_TOKEN;
src/lib/whatsapp.server.ts:38:    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
src/lib/whatsapp.server.ts:298:    const token = process.env.WHATSAPP_TOKEN;
src/components/god-mode/KpiGrid.tsx:3:"use client";
src/components/god-mode/StatCard.tsx:3:"use client";
src/components/dashboard/InlineActionPanel.tsx:1:"use client";
src/features/trip-detail/components/TripAddOnsEditor.tsx:1:"use client";
src/components/god-mode/SlideOutPanel.tsx:3:"use client";
src/features/calendar/useCalendarActions.ts:1:"use client";
src/components/god-mode/StackedCostChart.tsx:3:"use client";
src/features/calendar/MonthView.tsx:1:"use client";
src/components/god-mode/KpiCard.tsx:4:"use client";
src/features/trip-detail/components/TripDriverCard.tsx:1:"use client";
src/features/calendar/CalendarHeader.tsx:1:"use client";
src/features/calendar/AllDayEventsBar.tsx:1:"use client";
src/components/god-mode/DrillDownTable.tsx:3:"use client";
src/components/dashboard/RevenueKPICard.tsx:1:"use client";
src/features/calendar/DayView.tsx:1:"use client";
src/components/ItineraryBuilder.tsx:1:"use client";
src/features/calendar/EventDetailModal.tsx:1:"use client";
src/lib/demo/demo-mode-context.tsx:4:"use client";
src/features/calendar/CalendarCommandCenter.tsx:1:"use client";
src/lib/demo/constants.ts:2:// Set NEXT_PUBLIC_DEMO_ORG_ID in .env.local after seeding.
src/lib/demo/constants.ts:5:  process.env.NEXT_PUBLIC_DEMO_ORG_ID || "d0000000-0000-4000-8000-000000000001";
src/components/dashboard/NotificationBell.tsx:1:"use client";
src/features/calendar/DayCell.tsx:1:"use client";
src/lib/demo/use-demo-fetch.ts:4:"use client";
src/components/planner/ApprovalManager.tsx:1:"use client";
src/features/calendar/CalendarFilters.tsx:1:"use client";
src/features/calendar/CalendarEmptyState.tsx:1:"use client";
src/features/calendar/details/SocialPostEventDetail.tsx:1:"use client";
src/components/dashboard/TodaysTimeline.tsx:1:"use client";
src/components/CreateTripModal.tsx:1:"use client";
src/components/planner/PlannerTabs.tsx:1:"use client";
src/features/calendar/TimeGridEvent.tsx:1:"use client";
src/features/calendar/EventChip.tsx:1:"use client";
src/features/calendar/DayDrawer.tsx:1:"use client";
src/components/dashboard/TaskRow.tsx:1:"use client";
src/components/map/MapDemo.tsx:1:"use client";
src/components/planner/PricingManager.tsx:1:"use client";
src/components/map/ClientItineraryMap.tsx:1:"use client";
src/components/dashboard/InfrastructureHealth.tsx:1:"use client";
src/components/ui/select.tsx:1:"use client"
src/features/trip-detail/components/TripActivityList.tsx:1:"use client";
src/components/InteractivePricing.tsx:1:"use client";
src/components/ui/dropdown-menu.tsx:1:"use client"
src/components/dashboard/ActionQueue.tsx:1:"use client";
src/components/ui/EmptyState.tsx:1:"use client";
src/app/global-error.tsx:1:"use client";
src/components/providers/AppProviders.tsx:1:"use client";
src/components/ui/toast.tsx:1:"use client";
src/components/ShareTripModal.tsx:1:"use client";
src/components/ui/separator.tsx:1:"use client"
src/components/dashboard/KPICard.tsx:1:"use client";
src/app/onboarding/error.tsx:1:"use client";
src/components/bookings/LocationAutocomplete.tsx:1:"use client";
src/components/ui/dialog.tsx:1:"use client"
src/app/billing/error.tsx:1:"use client";
src/features/calendar/details/ConciergeEventDetail.tsx:1:"use client";
src/components/layout/ClientHeader.tsx:1:"use client";
src/app/billing/BillingPageClient.tsx:1:"use client";
src/features/calendar/details/PaymentEventDetail.tsx:1:"use client";
src/components/layout/GlobalShortcuts.tsx:1:"use client";
src/components/bookings/FlightSearch.tsx:1:"use client";
src/features/calendar/details/PersonalEventDetail.tsx:1:"use client";
src/components/layout/Sidebar.tsx:1:"use client";
src/app/page.tsx:5:"use client";
src/components/pdf/itinerary-pdf.tsx:1:"use client";
src/components/layout/FloatingActionButton.tsx:1:"use client";
src/components/map/ItineraryMap.tsx:1:"use client";
src/components/bookings/HotelSearch.tsx:1:"use client";
src/components/layout/NavHeader.tsx:1:"use client";
src/app/trips/page.tsx:1:"use client";
src/components/layout/AdminLayout.tsx:1:"use client";
src/app/trips/[id]/page.tsx:1:"use client";
src/components/layout/MobileNav.tsx:1:"use client";
src/app/trips/[id]/error.tsx:1:"use client";
src/components/social/templates/layouts/PosterFooter.tsx:1:"use client";
src/components/layout/AppShell.tsx:1:"use client";
src/app/trips/TripGridCard.tsx:1:"use client";
src/components/layout/CommandMenu.tsx:1:"use client";
src/components/social/templates/layouts/SplitLayout.tsx:1:"use client";
src/components/layout/TopBar.tsx:1:"use client";
src/components/social/templates/layouts/PremiumLayouts.tsx:1:"use client";
src/app/trips/templates/error.tsx:1:"use client";
src/components/layout/CommandPalette.tsx:1:"use client";
src/components/social/templates/layouts/CenterLayout.tsx:1:"use client";
src/components/layout/useNavCounts.ts:1:"use client";
src/app/trips/error.tsx:1:"use client";
src/components/social/templates/layouts/StyleLayouts.tsx:1:"use client";
src/components/pdf/PDFDownloadButton.tsx:1:"use client";
src/app/trips/DepartingSoonSection.tsx:1:"use client";
src/components/social/templates/layouts/ThemeDecorations.tsx:1:"use client";
src/app/trips/TripCardGrid.tsx:1:"use client";
src/components/social/templates/layouts/InfoSplitLayout.tsx:1:"use client";
src/components/social/templates/layouts/GalleryLayouts.tsx:1:"use client";
src/components/pdf/DownloadPDFButton.tsx:1:"use client";
src/components/social/templates/layouts/BottomLayout.tsx:1:"use client";
src/components/social/templates/layouts/LayoutRenderer.tsx:1:"use client";
src/app/trips/TripListRow.tsx:1:"use client";
src/components/social/templates/layouts/ReviewLayout.tsx:1:"use client";
src/app/trips/TripKPIStats.tsx:1:"use client";
src/components/payments/RazorpayModal.tsx:112:  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
src/components/payments/RazorpayModal.tsx:297:                  Configure <code>NEXT_PUBLIC_RAZORPAY_KEY_ID</code> before using this checkout.
src/components/social/templates/layouts/ElegantLayout.tsx:1:"use client";
src/components/social/templates/layouts/ServiceLayouts.tsx:1:"use client";
src/app/bookings/page.tsx:1:"use client";
src/app/bookings/error.tsx:1:"use client";
src/app/(superadmin)/god/analytics/page.tsx:3:"use client";
src/app/design-demo/error.tsx:1:"use client";
src/app/(superadmin)/god/analytics/error.tsx:1:"use client";
src/app/(superadmin)/god/page.tsx:3:"use client";
src/app/inbox/error.tsx:1:"use client";
src/app/marketplace/analytics/page.tsx:1:"use client";
src/app/(superadmin)/god/monitoring/page.tsx:3:"use client";
src/app/drivers/page.tsx:1:"use client";
src/app/pay/[token]/page.tsx:13:    return process.env.NEXT_PUBLIC_APP_URL || undefined;
src/components/ui/ErrorSection.tsx:1:"use client";
src/app/marketplace/analytics/error.tsx:1:"use client";
src/features/calendar/details/InvoiceEventDetail.tsx:1:"use client";
src/components/ui/avatar.tsx:1:"use client"
src/features/calendar/details/ProposalEventDetail.tsx:1:"use client";
src/app/drivers/[id]/error.tsx:1:"use client";
src/app/marketplace/page.tsx:1:"use client";
src/app/drivers/error.tsx:1:"use client";
src/app/pay/[token]/PaymentCheckoutClient.tsx:1:"use client";
src/app/pay/[token]/PaymentCheckoutClient.tsx:69:    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
src/components/ui/map/map-layers.tsx:1:"use client";
src/components/admin/ConvertProposalModal.tsx:1:"use client";
src/app/portal/[token]/error.tsx:1:"use client";
src/app/calendar/page.tsx:1:"use client";
src/app/marketplace/[id]/page.tsx:1:"use client";
src/app/pay/[token]/error.tsx:1:"use client";
src/app/calendar/error.tsx:1:"use client";
src/app/marketplace/[id]/error.tsx:1:"use client";
src/app/marketplace/error.tsx:1:"use client";
src/app/reputation/reviews/error.tsx:1:"use client";
src/components/ui/map/map-utils.ts:1:"use client";
src/app/(superadmin)/god/monitoring/error.tsx:1:"use client";
src/app/(superadmin)/god/error.tsx:1:"use client";
src/components/ui/map/map-controls.tsx:1:"use client";
src/app/marketplace/inquiries/page.tsx:1:"use client";
src/app/settings/error.tsx:1:"use client";
src/components/ui/map/map-core.tsx:1:"use client";
src/components/ui/map/map-core.tsx:52:const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
src/app/reputation/nps/[token]/page.tsx:1:"use client";
src/app/(superadmin)/god/signups/page.tsx:3:"use client";
src/app/reputation/analytics/error.tsx:1:"use client";
src/components/ui/map/map-markers.tsx:1:"use client";
src/app/(superadmin)/god/signups/error.tsx:1:"use client";
src/app/marketplace/inquiries/error.tsx:1:"use client";
src/app/(superadmin)/god/layout.tsx:4:"use client";
src/components/ui/AppImage.tsx:1:"use client";
src/app/reputation/campaigns/error.tsx:1:"use client";
src/app/reputation/nps/[token]/error.tsx:1:"use client";
src/app/reputation/error.tsx:1:"use client";
src/app/(superadmin)/god/support/page.tsx:3:"use client";
src/features/calendar/details/TripEventDetail.tsx:1:"use client";
src/app/(superadmin)/god/support/error.tsx:1:"use client";
src/features/calendar/WeekView.tsx:1:"use client";
src/app/reputation/_components/ReputationDashboard.tsx:1:"use client";
src/components/ui/skeletons/InboxSkeleton.tsx:1:"use client";
src/features/calendar/BlockDatesModal.tsx:1:"use client";
src/app/(superadmin)/god/directory/page.tsx:3:"use client";
src/app/reputation/widget/error.tsx:1:"use client";
src/features/calendar/CalendarSkeleton.tsx:1:"use client";
src/app/admin/billing/page.tsx:1:"use client";
src/app/(superadmin)/god/directory/error.tsx:1:"use client";
src/components/ui/skeletons/TableSkeleton.tsx:1:"use client";
src/app/admin/billing/error.tsx:1:"use client";
src/components/ui/tabs.tsx:1:"use client"
src/app/(superadmin)/god/audit-log/page.tsx:3:"use client";
src/app/admin/notifications/page.tsx:1:"use client";
src/app/(superadmin)/god/audit-log/error.tsx:1:"use client";
src/components/ui/skeletons/SkeletonCard.tsx:1:"use client";
src/app/admin/operations/page.tsx:1:"use client";
src/app/reputation/settings/error.tsx:1:"use client";
src/app/admin/notifications/error.tsx:1:"use client";
src/app/admin/operations/error.tsx:1:"use client";
src/app/(superadmin)/god/announcements/page.tsx:3:"use client";
src/components/ui/skeletons/ReviewSkeleton.tsx:1:"use client";
src/app/(superadmin)/god/announcements/error.tsx:1:"use client";
src/app/admin/pricing/page.tsx:1:"use client";
src/app/admin/gst-report/page.tsx:1:"use client";
src/app/admin/pricing/error.tsx:1:"use client";
src/app/admin/gst-report/error.tsx:1:"use client";
src/components/ui/skeletons/DashboardSkeleton.tsx:1:"use client";
src/app/(superadmin)/god/referrals/page.tsx:3:"use client";
src/app/settings/team/useTeamMembers.ts:1:"use client";
src/app/planner/PlannerHero.tsx:1:"use client";
src/app/admin/page.tsx:8:"use client";
src/app/(superadmin)/god/referrals/error.tsx:1:"use client";
src/components/ui/label.tsx:1:"use client"
src/app/admin/internal/marketplace/page.tsx:1:"use client";
src/app/settings/team/error.tsx:1:"use client";
src/app/planner/NeedsAttentionQueue.tsx:1:"use client";
src/app/(superadmin)/god/costs/page.tsx:3:"use client";
src/app/reputation/_components/CampaignList.tsx:1:"use client";
src/components/assistant/TourAssistantPresentation.tsx:1:"use client";
src/components/assistant/TourAssistantChat.tsx:1:"use client";
src/app/(superadmin)/god/costs/error.tsx:1:"use client";
src/app/reputation/_components/NPSSurveyPreview.tsx:1:"use client";
src/components/assistant/ConversationHistory.tsx:1:"use client";
src/app/reputation/_components/SentimentChart.tsx:1:"use client";
src/app/admin/trips/page.tsx:8:"use client";
src/app/planner/page.tsx:1:"use client";
src/components/assistant/UsageDashboard.tsx:1:"use client";
src/app/settings/marketplace/MarketplaceListingCheckoutModal.tsx:1:"use client";
src/app/reputation/_components/WidgetConfigurator.tsx:1:"use client";
src/app/(superadmin)/god/costs/org/[orgId]/page.tsx:3:"use client";
src/components/assistant/tour-assistant-helpers.tsx:1:"use client";
src/app/reputation/_components/RatingDistribution.tsx:1:"use client";
src/app/(superadmin)/god/costs/org/[orgId]/error.tsx:1:"use client";
src/app/planner/ClientFeedbackPanel.tsx:1:"use client";
src/app/reputation/_components/WidgetPreview.tsx:1:"use client";
src/components/demo/DemoModeToggle.tsx:4:"use client";
src/app/admin/trips/[id]/page.tsx:1:"use client";
src/app/(superadmin)/god/kill-switch/page.tsx:3:"use client";
src/components/demo/DemoModeGuard.tsx:4:"use client";
src/app/reputation/_components/TopicCloud.tsx:1:"use client";
src/app/planner/PastItineraryCard.tsx:1:"use client";
src/components/demo/DemoTour.tsx:4:"use client";
src/app/(superadmin)/god/kill-switch/error.tsx:1:"use client";
src/app/reputation/_components/useReputationDashboardData.ts:1:"use client";
src/components/ui/Breadcrumbs.tsx:1:"use client";
src/app/admin/internal/marketplace/error.tsx:1:"use client";
src/components/demo/DemoEmptyState.tsx:4:"use client";
src/app/reputation/_components/CompetitorBenchmark.tsx:1:"use client";
src/app/admin/trips/[id]/error.tsx:1:"use client";
src/app/planner/planner.types.ts:1:"use client";
src/app/settings/marketplace/useMarketplacePresence.ts:1:"use client";
src/components/demo/DemoModeBanner.tsx:4:"use client";
src/app/reputation/_components/ReputationHealthScore.tsx:1:"use client";
src/components/demo/WelcomeModal.tsx:4:"use client";
src/app/reputation/_components/BrandVoiceSettings.tsx:1:"use client";
src/app/clients/page.tsx:7:"use client";
src/app/planner/error.tsx:1:"use client";
src/components/demo/FeatureCallout.tsx:4:"use client";
src/app/reputation/_components/ReviewCard.tsx:1:"use client";
src/app/admin/cost/page.tsx:1:"use client";
src/app/clients/error.tsx:1:"use client";
src/app/reputation/_components/ReputationKPIRow.tsx:1:"use client";
src/app/clients/[id]/error.tsx:1:"use client";
src/app/clients/[id]/error.tsx:30:                {process.env.NODE_ENV === "development" ? (
src/app/planner/ItineraryFilterBar.tsx:1:"use client";
src/app/admin/trips/[id]/_components/DriverAssignmentCard.tsx:1:"use client";
src/app/reputation/_components/ReviewToRevenueChart.tsx:1:"use client";
src/app/settings/marketplace/MarketplaceListingPlans.tsx:1:"use client";
src/app/settings/marketplace/MarketplaceListingPlans.tsx:103:  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
src/app/admin/cost/error.tsx:1:"use client";
src/app/settings/marketplace/error.tsx:1:"use client";
src/app/reputation/_components/ReviewResponsePanel.tsx:1:"use client";
src/app/planner/SaveItineraryButton.tsx:1:"use client";
src/app/auth/page.tsx:1:"use client";
src/app/auth/error.tsx:1:"use client";
src/app/reputation/_components/PlatformConnectionCards.tsx:1:"use client";
src/app/admin/trips/[id]/_components/DayTabs.tsx:1:"use client";
src/app/reputation/_components/ReviewInbox.tsx:1:"use client";
src/app/reputation/_components/CampaignBuilder.tsx:1:"use client";
src/app/admin/cost/_components/SummaryCards.tsx:1:"use client";
src/app/admin/cost/_components/CapEditor.tsx:1:"use client";
src/app/admin/planner/page.tsx:1:"use client";
src/app/admin/cost/_components/MarginReport.tsx:1:"use client";
src/app/marketing/page.tsx:1:"use client";
src/app/admin/planner/error.tsx:1:"use client";
src/app/clients/[id]/ClientEditButton.tsx:1:"use client";
src/app/admin/trips/[id]/_components/AccommodationCard.tsx:1:"use client";
src/app/admin/cost/_components/AlertsList.tsx:1:"use client";
src/app/admin/cost/_components/OrgCostCard.tsx:1:"use client";
src/app/marketing/error.tsx:1:"use client";
src/app/planner/ShareItinerary.tsx:2:"use client";
src/app/admin/layout.tsx:8:"use client";
src/app/admin/settings/notifications/error.tsx:1:"use client";
src/app/admin/support/page.tsx:1:"use client";
src/app/admin/settings/page.tsx:1:"use client";
src/app/admin/trips/[id]/_components/TripHeader.tsx:1:"use client";
src/app/admin/templates/page.tsx:1:"use client";
src/app/admin/support/error.tsx:1:"use client";
src/app/admin/settings/SettingsIntegrationsSection.tsx:1:"use client";
src/app/admin/referrals/page.tsx:1:"use client";
src/app/admin/trips/[id]/_components/DayActivities.tsx:1:"use client";
src/app/admin/templates/error.tsx:1:"use client";
src/app/admin/kanban/page.tsx:1:"use client";
src/app/admin/activity/error.tsx:1:"use client";
src/app/admin/settings/error.tsx:1:"use client";
src/app/admin/security/page.tsx:1:"use client";
src/app/admin/security/error.tsx:1:"use client";
src/app/admin/settings/marketplace/page.tsx:1:"use client";
src/app/admin/settings/marketplace/error.tsx:1:"use client";
src/app/admin/trips/[id]/clone/page.tsx:1:"use client";
src/app/admin/referrals/error.tsx:1:"use client";
src/app/admin/tour-templates/create/error.tsx:1:"use client";
src/app/admin/kanban/error.tsx:1:"use client";
src/app/admin/error.tsx:1:"use client";
src/app/admin/revenue/page.tsx:1:"use client";
src/app/admin/tour-templates/import/error.tsx:1:"use client";
src/app/admin/revenue/error.tsx:1:"use client";
src/app/admin/trips/error.tsx:1:"use client";
src/app/live/[token]/page.tsx:1:"use client";
src/app/add-ons/page.tsx:1:"use client";
src/app/live/[token]/error.tsx:1:"use client";
src/app/add-ons/error.tsx:1:"use client";
src/app/add-ons/_components/AddOnFormModal.tsx:1:"use client";
src/app/support/page.tsx:1:"use client";
src/app/admin/tour-templates/[id]/error.tsx:1:"use client";
src/app/add-ons/_components/CategoryFilter.tsx:1:"use client";
src/app/add-ons/_components/AddOnsGrid.tsx:1:"use client";
src/app/admin/invoices/page.tsx:1:"use client";
src/app/admin/invoices/error.tsx:1:"use client";
src/app/admin/tour-templates/error.tsx:1:"use client";
src/app/social/error.tsx:1:"use client";
src/app/add-ons/_components/StatsHeader.tsx:1:"use client";
src/app/admin/tour-templates/[id]/edit/error.tsx:1:"use client";
src/app/admin/trips/[id]/clone/error.tsx:1:"use client";
src/app/test-db/page.tsx:5:    if (process.env.NODE_ENV === 'production') {
src/app/support/error.tsx:1:"use client";
src/app/admin/insights/page.tsx:1:"use client";
src/app/welcome/error.tsx:1:"use client";
src/app/social/_components/ToolbarActions.tsx:1:"use client";
src/app/admin/insights/error.tsx:1:"use client";
src/app/error.tsx:1:"use client";
src/app/social/_components/canvas/CanvasPublishModal.tsx:1:"use client";
src/app/map-test/page.tsx:1:"use client";
src/app/social/_components/BackgroundPicker.tsx:1:"use client";
src/app/social/_components/canvas/CanvasMode.tsx:1:"use client";
src/app/api/[...path]/route.ts:30:  ...(process.env.NODE_ENV !== "production" ? [["debug", () => import("@/app/api/_handlers/debug/route")] satisfies [string, () => Promise<unknown>]] : []),
src/app/api/[...path]/route.ts:102:  ...(process.env.NODE_ENV !== "production" ? [["test-geocoding", () => import("@/app/api/_handlers/test-geocoding/route")] satisfies [string, () => Promise<unknown>]] : []),
src/app/map-test/error.tsx:1:"use client";
src/app/social/_components/PlatformStatusBar.tsx:1:"use client";
src/app/dashboard/error.tsx:1:"use client";
src/app/test-db/error.tsx:1:"use client";
src/app/social/_components/ReviewsToInsta.tsx:1:"use client";
src/app/social/_components/template-gallery/TemplateGrid.tsx:1:"use client";
src/app/social/_components/SocialStudioClient.tsx:1:"use client";
src/app/social/_components/canvas/CanvasEditorPanel.tsx:1:"use client";
src/app/social/_components/template-gallery/layout-helpers.tsx:1:"use client";
src/app/social/_components/MagicPrompter.tsx:1:"use client";
src/app/social/_components/template-gallery/TemplateSearchBar.tsx:1:"use client";
src/app/social/_components/canvas/layout-preview.tsx:1:"use client";
src/app/dashboard/schedule/page.tsx:1:"use client";
src/app/social/_components/CaptionEngine.tsx:1:"use client";
src/app/social/_components/template-gallery/TemplateCategoryFilter.tsx:1:"use client";
src/app/dashboard/schedule/error.tsx:1:"use client";
src/app/social/_components/TemplateEditor.tsx:1:"use client";
src/app/social/_components/template-gallery/TemplateStrip.tsx:1:"use client";
src/app/social/_components/StockTab.tsx:1:"use client";
src/app/dashboard/tasks/error.tsx:1:"use client";
src/app/social/_components/PublishKitDrawer.tsx:1:"use client";
src/app/social/_components/template-gallery/FestivalBanner.tsx:1:"use client";
src/app/social/_components/MediaLibrary.tsx:1:"use client";
src/app/social/_components/canvas/CanvasPreviewPane.tsx:1:"use client";
src/app/social/_components/canvas/CanvasFooter.tsx:1:"use client";
src/app/social/_components/template-gallery/PreviewPanel.tsx:1:"use client";
src/app/social/_components/PosterExtractor.tsx:1:"use client";
src/app/social/_components/UploadTab.tsx:1:"use client";
src/app/social/_components/CarouselBuilder.tsx:1:"use client";
src/app/social/_components/SocialAnalytics.tsx:1:"use client";
src/app/api/_handlers/share/[token]/route.ts:45:const SHARE_READ_RATE_LIMIT_MAX = Number(process.env.PUBLIC_SHARE_READ_RATE_LIMIT_MAX || "60");
src/app/api/_handlers/share/[token]/route.ts:47:  process.env.PUBLIC_SHARE_READ_RATE_LIMIT_WINDOW_MS || 15 * 60_000
src/app/api/_handlers/share/[token]/route.ts:49:const SHARE_WRITE_RATE_LIMIT_MAX = Number(process.env.PUBLIC_SHARE_WRITE_RATE_LIMIT_MAX || "20");
src/app/api/_handlers/share/[token]/route.ts:51:  process.env.PUBLIC_SHARE_WRITE_RATE_LIMIT_WINDOW_MS || 15 * 60_000
src/app/social/_components/TripImporter.tsx:1:"use client";
src/app/social/_components/GallerySlotPicker.tsx:1:"use client";
src/app/social/_components/ContentBar.tsx:1:"use client";
src/app/dashboard/tasks/page.tsx:1:"use client";
src/app/social/_components/PostHistory.tsx:1:"use client";
src/app/social/_components/AiTab.tsx:1:"use client";
src/app/api/_handlers/debug/route.ts:10:  if (process.env.NODE_ENV === 'production') return false;
src/app/api/_handlers/debug/route.ts:11:  return process.env.ENABLE_DEBUG_ENDPOINT === 'true' || process.env.ENABLE_DEBUG_ENDPOINT === '1';
src/app/api/_handlers/debug/route.ts:32:    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
src/app/social/_components/BulkExporter.tsx:1:"use client";
src/app/api/_handlers/portal/[token]/route.ts:8:  process.env.PUBLIC_PORTAL_READ_RATE_LIMIT_MAX || "30"
src/app/api/_handlers/portal/[token]/route.ts:11:  process.env.PUBLIC_PORTAL_READ_RATE_LIMIT_WINDOW_MS || 60_000
src/app/api/_handlers/portal/[token]/route.ts:355:        googleReviewLink: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || null,
src/app/api/_handlers/settings/team/[id]/resend/route.ts:58:      process.env.NEXT_PUBLIC_APP_URL ||
src/app/api/_handlers/images/unsplash/route.ts:31:    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
src/app/api/_handlers/subscriptions/limits/route.ts:31:      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
src/app/api/_handlers/settings/team/invite/route.ts:65:      process.env.NEXT_PUBLIC_APP_URL ||
src/app/api/_handlers/settings/integrations/route.ts:39:                enabled: envConfigured("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
src/app/api/_handlers/settings/integrations/route.ts:40:                configured: envConfigured("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
src/app/api/_handlers/images/pexels/route.ts:18:    const apiKey = process.env.PEXELS_API_KEY;
src/app/api/_handlers/invoices/send-pdf/route.ts:66:    const resendApiKey = process.env.RESEND_API_KEY;
src/app/api/_handlers/invoices/send-pdf/route.ts:68:      process.env.PROPOSAL_FROM_EMAIL ||
src/app/api/_handlers/invoices/send-pdf/route.ts:69:      process.env.WELCOME_FROM_EMAIL ||
src/app/api/_handlers/invoices/send-pdf/route.ts:70:      process.env.RESEND_FROM_EMAIL;
src/app/api/_handlers/proposals/[id]/send/route.ts:50:  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).trim();
src/app/api/_handlers/images/pixabay/route.ts:18:    const apiKey = process.env.PIXABAY_API_KEY;
src/app/api/_handlers/payments/links/[token]/route.ts:13:  process.env.PUBLIC_PAYMENT_LINK_READ_RATE_LIMIT_MAX || "30"
src/app/api/_handlers/payments/links/[token]/route.ts:16:  process.env.PUBLIC_PAYMENT_LINK_READ_RATE_LIMIT_WINDOW_MS || 60_000
src/app/api/_handlers/payments/links/[token]/route.ts:19:  process.env.PUBLIC_PAYMENT_LINK_WRITE_RATE_LIMIT_MAX || "10"
src/app/api/_handlers/payments/links/[token]/route.ts:22:  process.env.PUBLIC_PAYMENT_LINK_WRITE_RATE_LIMIT_WINDOW_MS || 60_000
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:202:  process.env.PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_MAX || "20"
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:205:  process.env.PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_WINDOW_MS || 15 * 60_000
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:208:  process.env.PUBLIC_PROPOSAL_READ_RATE_LIMIT_MAX || "30"
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:211:  process.env.PUBLIC_PROPOSAL_READ_RATE_LIMIT_WINDOW_MS || 60_000
src/app/api/_handlers/proposals/send-pdf/route.ts:89:    const resendApiKey = process.env.RESEND_API_KEY;
src/app/api/_handlers/proposals/send-pdf/route.ts:90:    const senderEmail = process.env.WELCOME_FROM_EMAIL;
src/app/api/_handlers/assistant/chat/stream/route.ts:374:    const openaiKey = process.env.OPENAI_API_KEY;
src/app/api/_handlers/whatsapp/connect/route.ts:20:        const webhookSecret = process.env.WPPCONNECT_WEBHOOK_SECRET?.trim();
src/app/api/_handlers/whatsapp/connect/route.ts:21:        const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
src/app/social/_components/TemplateGallery.tsx:1:"use client";
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
src/app/api/_handlers/leads/convert/route.ts:14:const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET ?? "";
src/app/api/_handlers/reputation/ai/analyze/route.ts:174:    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
src/app/api/_handlers/reputation/ai/respond/route.ts:277:    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:118:  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:81:  const resendApiKey = process.env.RESEND_API_KEY;
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:83:    process.env.PROPOSAL_FROM_EMAIL ||
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:84:    process.env.WELCOME_FROM_EMAIL ||
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:85:    process.env.RESEND_FROM_EMAIL;
src/app/api/_handlers/whatsapp/webhook/route.ts:26:const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || null;
src/app/api/_handlers/whatsapp/webhook/route.ts:27:const appSecret = process.env.WHATSAPP_APP_SECRET || null;
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:164:              nps_link: `${process.env.NEXT_PUBLIC_APP_URL || ""}/reputation/nps/${npsToken}`,
src/app/api/_handlers/admin/security/diagnostics/route.ts:97:        legacy_secret_configured: Boolean(process.env.NOTIFICATION_CRON_SECRET),
src/app/api/_handlers/admin/security/diagnostics/route.ts:98:        signing_secret_configured: Boolean(process.env.NOTIFICATION_SIGNING_SECRET),
src/app/api/_handlers/admin/security/diagnostics/route.ts:110:        service_account_secret_configured: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
src/app/api/_handlers/admin/security/diagnostics/route.ts:111:        project_id_configured: Boolean(process.env.FIREBASE_PROJECT_ID),
src/app/api/_handlers/admin/seed-demo/route.ts:32:      process.env.NODE_ENV,
src/app/api/_handlers/admin/seed-demo/route.ts:33:      process.env.ALLOW_SEED_IN_PROD
src/app/api/_handlers/admin/seed-demo/route.ts:61:  const expectedCronSecret = process.env.ADMIN_CRON_SECRET?.trim();
src/app/api/_handlers/location/share/route.ts:8:    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
src/app/api/_handlers/location/client-share/route.ts:9:    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
src/app/api/_handlers/admin/insights/roi/route.ts:99:  const hourlyValueUsd = Number(process.env.ROI_HOURLY_VALUE_USD || "30");
src/app/api/_handlers/location/cleanup-expired/route.ts:8:const cleanupSecret = process.env.NOTIFICATION_CRON_SECRET || "";
src/app/api/_handlers/location/cleanup-expired/route.ts:9:const signingSecret = process.env.NOTIFICATION_SIGNING_SECRET || "";
src/app/api/_handlers/superadmin/monitoring/health/route.ts:12:    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:13:    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:71:        const fcmConfigured = Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY);
src/app/api/_handlers/superadmin/monitoring/health/route.ts:73:        const waConfigured = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_API_TOKEN);
src/app/api/_handlers/superadmin/monitoring/health/route.ts:75:        const sentryConfigured = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
src/app/api/_handlers/onboarding/first-value/route.ts:16:  const envOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
src/app/api/_handlers/admin/cost/overview/route.ts:77:      process.env.NODE_ENV === "test" &&
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:11:    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:12:    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
src/app/api/_handlers/admin/marketplace/verify/route.ts:314:                settingsUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://itinerary-ai.vercel.app"}/admin/settings/marketplace`,
src/app/api/_handlers/billing/contact-sales/route.ts:21:  const apiKey = process.env.RESEND_API_KEY;
src/app/api/_handlers/billing/contact-sales/route.ts:23:    process.env.RESEND_FROM_EMAIL ||
src/app/api/_handlers/billing/contact-sales/route.ts:24:    process.env.WELCOME_FROM_EMAIL ||
src/app/api/_handlers/billing/contact-sales/route.ts:25:    process.env.PROPOSAL_FROM_EMAIL;
src/app/api/_handlers/admin/social/generate/route.ts:166:  const apiKey = process.env.GROQ_API_KEY || "";
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:162:  const apiKey = process.env.GROQ_API_KEY || "";
src/app/api/_handlers/billing/subscription/route.ts:75:      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER ||
src/app/api/_handlers/billing/subscription/route.ts:76:      process.env.SUPPORT_WHATSAPP_NUMBER ||
src/app/api/_handlers/webhooks/whatsapp/route.ts:87:  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
src/app/api/_handlers/webhooks/whatsapp/route.ts:115:  const appSecret = process.env.WHATSAPP_APP_SECRET;
src/app/api/_handlers/webhooks/waha/route.ts:62:    const webhookSecret = process.env.WPPCONNECT_WEBHOOK_SECRET?.trim();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:215:                inquiryUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://itinerary-ai.vercel.app"}/admin/marketplace/inquiries`,
src/app/api/_handlers/itinerary/generate/route.ts:55:    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
src/app/api/_handlers/itinerary/generate/route.ts:66:    (process.env.AI_LOW_COST_MODE || "").toLowerCase()
src/app/api/_handlers/itinerary/generate/route.ts:68:const ESTIMATED_COST_GROQ_USD = Number(process.env.AI_ESTIMATED_COST_GROQ_USD || "0.006");
src/app/api/_handlers/itinerary/generate/route.ts:69:const ESTIMATED_COST_GEMINI_FLASH_USD = Number(process.env.AI_ESTIMATED_COST_GEMINI_FLASH_USD || "0.012");
src/app/api/_handlers/itinerary/generate/route.ts:330:            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
src/app/api/_handlers/itinerary/generate/route.ts:458:            process.env.GOOGLE_API_KEY ||
src/app/api/_handlers/itinerary/generate/route.ts:459:            process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/itinerary/generate/route.ts:460:        const groqApiKey = process.env.GROQ_API_KEY;
src/app/api/_handlers/notifications/process-queue/route.ts:46:const DEFAULT_MAX_ATTEMPTS = Number(process.env.NOTIFICATION_QUEUE_MAX_ATTEMPTS || "5");
src/app/api/_handlers/notifications/process-queue/route.ts:47:const BASE_BACKOFF_MINUTES = Number(process.env.NOTIFICATION_QUEUE_BACKOFF_BASE_MINUTES || "5");
src/app/api/_handlers/notifications/process-queue/route.ts:48:const MAX_BACKOFF_MINUTES = Number(process.env.NOTIFICATION_QUEUE_BACKOFF_MAX_MINUTES || "60");
src/app/api/_handlers/notifications/process-queue/route.ts:281:            const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
src/app/api/_handlers/notifications/process-queue/route.ts:474:            replayWindowMs: parseMsEnv(process.env.NOTIFICATION_CRON_REPLAY_WINDOW_MS, 10 * 60_000),
src/app/api/_handlers/notifications/process-queue/route.ts:475:            maxClockSkewMs: parseMsEnv(process.env.NOTIFICATION_CRON_MAX_CLOCK_SKEW_MS, 5 * 60_000),
src/app/api/_handlers/itinerary/import/url/route.ts:103:        const groqApiKey = process.env.GROQ_API_KEY;
src/app/api/_handlers/marketplace/listing-subscription/route.ts:160:        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
src/app/api/_handlers/marketplace/listing-subscription/route.ts:161:          process.env.RAZORPAY_KEY_SECRET &&
src/app/api/_handlers/marketplace/listing-subscription/route.ts:162:          process.env.RAZORPAY_KEY_ID,
src/app/api/_handlers/itinerary/import/pdf/route.ts:48:        const groqApiKey = process.env.GROQ_API_KEY;
src/app/api/_handlers/social/extract/route.ts:9:  const explicit = process.env.SOCIAL_EXTRACT_MOCK_ENABLED?.trim().toLowerCase();
src/app/api/_handlers/social/extract/route.ts:12:  return process.env.NODE_ENV !== "production";
src/app/api/_handlers/social/extract/route.ts:47:    const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/social/oauth/linkedin/route.ts:6:const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
src/app/api/_handlers/social/oauth/linkedin/route.ts:7:const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://travelsuite-rust.vercel.app';
src/app/api/_handlers/social/reviews/public/route.ts:18:const REVIEW_RATE_LIMIT_MAX = parsePositiveInt(process.env.PUBLIC_REVIEW_RATE_LIMIT_MAX, 8);
src/app/api/_handlers/social/reviews/public/route.ts:20:    process.env.PUBLIC_REVIEW_RATE_LIMIT_WINDOW_MS,
src/app/api/_handlers/social/oauth/callback/route.ts:8:const META_APP_ID = process.env.META_APP_ID;
src/app/api/_handlers/social/oauth/callback/route.ts:9:const META_APP_SECRET = process.env.META_APP_SECRET;
src/app/api/_handlers/social/oauth/callback/route.ts:10:const META_REDIRECT_URI = process.env.META_REDIRECT_URI ?? '';
src/app/api/_handlers/social/oauth/callback/route.ts:12:const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://travelsuite-rust.vercel.app';
src/app/api/_handlers/integrations/tripadvisor/route.ts:7:const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY;
src/app/api/_handlers/social/process-queue/route.ts:27:    const explicit = process.env.SOCIAL_PUBLISH_MOCK_ENABLED?.trim().toLowerCase();
src/app/api/_handlers/social/process-queue/route.ts:30:    return process.env.NODE_ENV !== "production";
src/app/api/_handlers/social/process-queue/route.ts:48:    const base = parsePositiveInt(process.env.SOCIAL_QUEUE_RETRY_BASE_MINUTES, 5);
src/app/api/_handlers/social/process-queue/route.ts:49:    const maxBackoff = parsePositiveInt(process.env.SOCIAL_QUEUE_RETRY_MAX_MINUTES, 180);
src/app/api/_handlers/social/process-queue/route.ts:59:            replayWindowMs: parseMsEnv(process.env.SOCIAL_CRON_REPLAY_WINDOW_MS, 10 * 60_000),
src/app/api/_handlers/social/process-queue/route.ts:60:            maxClockSkewMs: parseMsEnv(process.env.SOCIAL_CRON_MAX_CLOCK_SKEW_MS, 5 * 60_000),
src/app/api/_handlers/social/process-queue/route.ts:68:        const maxAttempts = parsePositiveInt(process.env.SOCIAL_QUEUE_MAX_ATTEMPTS, 3);
src/app/api/_handlers/social/ai-image/route.ts:22:fal.config({ credentials: process.env.FAL_KEY });
src/app/api/_handlers/social/oauth/facebook/route.ts:6:const META_APP_ID = process.env.META_APP_ID;
src/app/api/_handlers/social/oauth/facebook/route.ts:7:const META_REDIRECT_URI = process.env.META_REDIRECT_URI ?? '';
src/app/api/_handlers/social/ai-poster/route.ts:41:        const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/social/oauth/google/route.ts:6:const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
src/app/api/_handlers/social/oauth/google/route.ts:7:const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://travelsuite-rust.vercel.app';
src/app/api/_handlers/social/smart-poster/route.ts:44:        process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/social/smart-poster/route.ts:81:      const falKey = process.env.FAL_KEY;
src/app/api/_handlers/social/captions/route.ts:66:    const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
src/app/api/_handlers/social/refresh-tokens/route.ts:17:            replayWindowMs: parseMsEnv(process.env.SOCIAL_CRON_REPLAY_WINDOW_MS, 10 * 60_000),
src/app/api/_handlers/social/refresh-tokens/route.ts:18:            maxClockSkewMs: parseMsEnv(process.env.SOCIAL_CRON_MAX_CLOCK_SKEW_MS, 5 * 60_000),
src/app/api/_handlers/social/refresh-tokens/route.ts:25:        const metaAppId = process.env.META_APP_ID?.trim();
src/app/api/_handlers/social/refresh-tokens/route.ts:26:        const metaAppSecret = process.env.META_APP_SECRET?.trim();

CONSOLE_ERROR_OBJECTS
src/app/p/[token]/page.tsx:83:        console.error('Invalid proposal payload:', parsed.error.flatten());
src/app/p/[token]/page.tsx:104:      console.error('Error loading proposal:', error);
src/app/p/[token]/page.tsx:173:      console.error('Error toggling activity:', error);
src/app/p/[token]/page.tsx:189:      console.error('Error toggling add-on:', error);
src/app/p/[token]/page.tsx:201:      console.error('Error selecting vehicle:', error);
src/app/p/[token]/page.tsx:236:      console.error('Error submitting comment:', error);
src/app/p/[token]/page.tsx:280:      console.error('Error approving proposal:', error);
src/app/p/[token]/error.tsx:18:        console.error("Public Proposal error:", error);
src/app/share/[token]/error.tsx:18:        console.error("Shared View error:", error);
src/app/analytics/templates/error.tsx:18:        console.error("Analytics Templates error:", error);
src/app/analytics/error.tsx:18:        console.error("Analytics segment error:", error);
src/app/analytics/drill-through/error.tsx:18:        console.error("Analytics Drill-through error:", error);
src/app/dashboard/error.tsx:18:        console.error("Dashboard segment error:", error);
src/app/offline/error.tsx:18:        console.error("Offline error:", error);
src/app/dashboard/tasks/error.tsx:18:        console.error("Dashboard Tasks error:", error);
src/app/dashboard/schedule/error.tsx:18:        console.error("Dashboard Schedule error:", error);
src/app/add-ons/page.tsx:132:      console.error("Error loading data:", error);
src/app/add-ons/page.tsx:216:        console.error("Error saving add-on:", error);
src/app/add-ons/page.tsx:253:      console.error("Error deleting add-on:", error);
src/app/add-ons/page.tsx:282:        console.error("Error toggling active status:", error);
src/app/portal/[token]/error.tsx:18:        console.error("Client Portal error:", error);
src/app/add-ons/error.tsx:18:        console.error("Add-ons segment error:", error);
src/app/clients/[id]/page.tsx:113:        console.error("Profile fetch exception:", err);
src/app/clients/[id]/page.tsx:130:        else if (error) console.warn("Trips fetch:", error.message);
src/app/clients/[id]/page.tsx:132:        console.warn("Trips fetch failed:", err);
src/app/clients/[id]/page.tsx:154:        console.warn("Itineraries fetch failed:", err);
src/app/clients/[id]/page.tsx:167:        else if (error) console.warn("Proposals fetch:", error.message);
src/app/clients/[id]/page.tsx:169:        console.warn("Proposals fetch failed:", err);
src/app/clients/error.tsx:18:        console.error("Clients error:", error);
src/app/inbox/page.tsx:114:        console.error('[inbox/broadcast] Failed to load audiences', error);
src/app/proposals/create/_hooks/useProposalData.ts:118:        console.error('Error loading clients:', payload);
src/app/proposals/create/_hooks/useProposalData.ts:202:      console.error('Create client failed:', payload);
src/app/inbox/error.tsx:18:        console.error("Inbox segment error:", error);
src/app/clients/[id]/error.tsx:15:        console.error("Client profile error:", error);
src/app/auth/error.tsx:18:        console.error("Authentication error:", error);
src/app/proposals/create/_hooks/useCreateProposal.ts:190:          console.warn('Proposal created but notification failed:', sendPayload?.error || sendPayload);
src/app/proposals/create/_hooks/useCreateProposal.ts:197:      console.error('Error creating proposal:', error);
src/app/settings/team/error.tsx:18:        console.error("Settings Team error:", error);
src/app/welcome/error.tsx:18:        console.error("Welcome error:", error);
src/app/drivers/page.tsx:173:                console.error("Error fetching drivers:", error);
src/app/design-demo/error.tsx:18:        console.error("Design Demo error:", error);
src/app/settings/marketplace/error.tsx:18:        console.error("Settings Marketplace error:", error);
src/app/proposals/create/error.tsx:18:        console.error("Proposal Create error:", error);
src/app/drivers/[id]/error.tsx:18:        console.error("Driver Detail error:", error);
src/app/drivers/error.tsx:18:        console.error("Drivers segment error:", error);
src/app/pay/[token]/error.tsx:18:        console.error("Payment error:", error);
src/app/bookings/error.tsx:18:        console.error("Bookings segment error:", error);
src/app/planner/page.tsx:111:            console.error("Error opening itinerary:", err);
src/app/reputation/reviews/error.tsx:18:        console.error("Reviews error:", error);
src/app/admin/billing/error.tsx:18:        console.error("Admin Billing error:", error);
src/app/planner/error.tsx:18:        console.error("Planner error:", error);
src/app/marketplace/analytics/page.tsx:80:            console.error("Error fetching stats:", error);
src/app/map-test/error.tsx:18:        console.error("Map Test error:", error);
src/app/admin/notifications/page.tsx:109:            console.error("Error fetching logs:", error);
src/app/admin/notifications/page.tsx:134:            console.error("Error fetching WhatsApp health:", error);
src/app/admin/notifications/page.tsx:166:            console.error("Error fetching delivery tracking:", error);
src/app/admin/notifications/page.tsx:209:            console.error("Run queue error:", error);
src/app/admin/notifications/page.tsx:235:            console.error("Retry failed queue error:", error);
src/app/admin/notifications/page.tsx:264:            console.error("Schedule followups error:", error);
src/app/admin/notifications/page.tsx:288:            console.error("Cleanup expired shares error:", error);
src/app/admin/notifications/page.tsx:325:            console.error("Normalize driver mapping error:", error);
src/app/admin/notifications/page.tsx:359:            console.error("Retry delivery error:", error);
src/app/settings/error.tsx:18:        console.error("Settings segment error:", error);
src/app/reputation/analytics/error.tsx:18:        console.error("Reputation Analytics error:", error);
src/app/marketplace/analytics/error.tsx:18:        console.error("Marketplace Analytics error:", error);
src/app/planner/SaveItineraryButton.tsx:132:            console.error("Save error:", message);
src/app/admin/notifications/error.tsx:18:        console.error("Admin Notifications error:", error);
src/app/admin/tour-templates/create/page.tsx:331:      console.error('Error saving template:', error);
src/app/proposals/[id]/page.tsx:119:      console.error('Error loading comments:', error);
src/app/proposals/[id]/page.tsx:164:      console.error('Error loading stats:', error);
src/app/proposals/[id]/page.tsx:211:      console.error('Error loading proposal:', error);
src/app/proposals/[id]/page.tsx:225:      console.log('[Admin] Proposal updated via realtime:', payload);
src/app/proposals/[id]/page.tsx:229:      console.log('[Admin] Activity updated via realtime:', payload);
src/app/proposals/[id]/page.tsx:233:      console.log('[Admin] New comment via realtime:', payload);
src/app/proposals/[id]/page.tsx:355:      console.error('Error loading version history:', error);
src/app/admin/tour-templates/create/error.tsx:18:        console.error("Admin Tour Template Create error:", error);
src/app/reputation/campaigns/error.tsx:18:        console.error("Reputation Campaigns error:", error);
src/app/admin/pricing/error.tsx:18:        console.error("Admin Pricing error:", error);
src/app/proposals/[id]/error.tsx:18:        console.error("Proposal Detail error:", error);
src/app/admin/page.tsx:299:                console.error("Critical Dashboard Failure:", error);
src/app/reputation/_components/CampaignList.tsx:99:        console.error("Failed to update campaign status:", data.error);
src/app/reputation/_components/CampaignList.tsx:109:      console.error("Error updating campaign status:", error);
src/app/marketplace/page.tsx:83:            console.error("Error fetching marketplace:", error);
src/app/admin/trips/page.tsx:91:            console.error("Critical Deployment Error:", error);
src/app/marketplace/inquiries/page.tsx:49:            console.error("Error fetching inquiries:", error);
src/app/marketplace/inquiries/page.tsx:72:            console.error("Error marking read:", error);
src/app/marketplace/[id]/page.tsx:148:            console.error("Error fetching detail:", error);
src/app/marketplace/[id]/page.tsx:165:                console.error("Failed to record view", err);
src/app/global-error.tsx:14:        console.error("Global app error:", error);
src/app/marketplace/[id]/error.tsx:18:        console.error("Marketplace Detail error:", error);
src/app/admin/tour-templates/page.tsx:97:        console.error('Error loading templates:', error);
src/app/admin/tour-templates/page.tsx:132:      console.error('Error loading templates:', error);
src/app/admin/tour-templates/page.tsx:150:        console.error('Error deleting template:', error);
src/app/admin/tour-templates/page.tsx:160:      console.error('Error deleting template:', error);
src/app/admin/tour-templates/page.tsx:182:        console.error('Error cloning template:', error);
src/app/admin/tour-templates/page.tsx:198:      console.error('Error cloning template:', error);
src/app/admin/referrals/error.tsx:18:        console.error("Admin Referrals error:", error);
src/app/marketplace/inquiries/error.tsx:18:        console.error("Marketplace Inquiries error:", error);
src/app/admin/tour-templates/import/error.tsx:18:        console.error("Admin Tour Template Import error:", error);
src/app/onboarding/error.tsx:18:        console.error("Onboarding error:", error);
src/app/reputation/_components/ReviewInbox.tsx:292:      console.error("Error fetching reviews:", err);
src/app/reputation/_components/ReviewInbox.tsx:321:      console.error("Error flagging review:", err);
src/app/reputation/_components/ReviewInbox.tsx:340:      console.error("Error adding review:", err);
src/app/reputation/_components/ReviewInbox.tsx:395:      console.error("Error generating marketing asset:", error);
src/app/reputation/_components/ReviewInbox.tsx:422:      console.error("Error scheduling marketing asset:", error);
src/app/admin/planner/error.tsx:18:        console.error("Admin Planner error:", error);
src/app/admin/activity/error.tsx:18:        console.error("Admin Activity error:", error);
src/app/admin/gst-report/error.tsx:18:        console.error("Admin GST Report error:", error);
src/app/admin/cost/error.tsx:18:        console.error("Admin Cost error:", error);
src/app/reputation/nps/[token]/error.tsx:18:        console.error("NPS Survey error:", error);
src/app/admin/tour-templates/[id]/page.tsx:176:      console.error('Error loading template:', error);
src/app/admin/tour-templates/[id]/page.tsx:196:        console.error('Error deleting template:', error);
src/app/admin/tour-templates/[id]/page.tsx:206:      console.error('Error deleting template:', error);
src/app/admin/internal/marketplace/page.tsx:40:            console.error(error);
src/app/admin/internal/marketplace/page.tsx:64:            console.error(error);
src/app/admin/internal/marketplace/error.tsx:18:        console.error("Admin Marketplace error:", error);
src/app/reputation/widget/error.tsx:18:        console.error("Review Widget error:", error);
src/app/admin/tour-templates/error.tsx:18:        console.error("Admin Tour Templates error:", error);
src/app/admin/tour-templates/[id]/error.tsx:18:        console.error("Admin Tour Template error:", error);
src/app/reputation/settings/error.tsx:18:        console.error("Reputation Settings error:", error);
src/app/admin/operations/error.tsx:18:        console.error("Admin Operations error:", error);
src/app/admin/tour-templates/[id]/edit/page.tsx:190:      console.error('Error loading template:', error);
src/app/admin/tour-templates/[id]/edit/page.tsx:323:      console.error('Error saving template:', error);
src/app/admin/tour-templates/[id]/edit/error.tsx:18:        console.error("Admin Tour Template Edit error:", error);
src/app/admin/support/error.tsx:18:        console.error("Admin Support error:", error);
src/app/admin/settings/notifications/error.tsx:18:        console.error("Admin Notification Settings error:", error);
src/app/admin/settings/page.tsx:250:            console.error("Error fetching settings:", error);
src/app/admin/settings/page.tsx:313:            console.error("Error saving settings:", error);
src/app/admin/settings/page.tsx:378:            console.error("Error saving workflow rules:", error);
src/app/admin/kanban/page.tsx:151:            console.error("Kanban data fetch failed:", error);
src/app/admin/kanban/page.tsx:230:            console.error("Stage move failed:", error);
src/app/admin/kanban/page.tsx:262:            console.error("Toggle phase notifications failed:", error);
src/app/admin/trips/[id]/clone/error.tsx:18:        console.error("Admin Trip Clone error:", error);
src/app/admin/kanban/error.tsx:18:        console.error("Admin Kanban error:", error);
src/app/admin/settings/error.tsx:18:        console.error("Admin Settings error:", error);
src/app/admin/trips/error.tsx:18:        console.error("Admin Trips error:", error);
src/app/trips/[id]/error.tsx:18:        console.error("Trip Detail error:", error);
src/app/admin/settings/marketplace/page.tsx:161:            console.error("Error fetching settings:", error);
src/app/admin/revenue/error.tsx:18:        console.error("Admin Revenue error:", error);
src/app/admin/settings/marketplace/error.tsx:18:        console.error("Admin Marketplace Settings error:", error);
src/app/admin/trips/[id]/_components/TripHeader.tsx:113:            console.error("Error sending notification:", error);
src/app/admin/trips/[id]/page.tsx:92:            console.error("Error fetching trip:", error);
src/app/admin/trips/[id]/page.tsx:171:            console.error("Geocode error:", error);
src/app/admin/trips/[id]/page.tsx:403:            console.error("Hotel lookup error:", error);
src/app/admin/trips/[id]/page.tsx:475:            console.error("Error saving:", error);
src/app/admin/trips/[id]/page.tsx:528:            console.error("Live location share error:", error);
src/app/admin/trips/[id]/page.tsx:568:            console.error("Revoke live link error:", error);
src/app/admin/trips/[id]/error.tsx:18:        console.error("Admin Trip Detail error:", error);
src/app/admin/insights/error.tsx:18:        console.error("Admin Insights error:", error);
src/app/admin/security/error.tsx:18:        console.error("Admin Security error:", error);
src/app/admin/invoices/error.tsx:18:        console.error("Admin Invoices error:", error);
src/app/marketing/error.tsx:18:        console.error("Marketing error:", error);
src/app/error.tsx:18:        console.error("App segment error:", error);
src/app/test-db/error.tsx:18:        console.error("Test DB error:", error);
src/app/support/error.tsx:18:        console.error("Support error:", error);
src/app/live/[token]/error.tsx:18:        console.error("Live View error:", error);
src/app/api/whatsapp/chatbot-sessions/[id]/route.ts:61:    console.error("[whatsapp/chatbot-sessions/:id] unexpected error:", error);
src/app/api/availability/route.ts:58:      console.error("[availability] failed to load blocked dates:", error);
src/app/api/availability/route.ts:73:    console.error("[availability] unexpected GET error:", error);
src/app/api/availability/route.ts:122:      console.error("[availability] failed to create blocked dates:", error);
src/app/api/availability/route.ts:134:    console.error("[availability] unexpected POST error:", error);
src/app/api/availability/route.ts:172:      console.error("[availability] failed to delete blocked dates:", error);
src/app/api/availability/route.ts:178:    console.error("[availability] unexpected DELETE error:", error);
src/app/social/_components/MediaLibrary.tsx:61:            console.error("Error fetching media:", error);
src/app/social/_components/MediaLibrary.tsx:114:            console.error("Upload error:", error);
src/app/(superadmin)/god/support/error.tsx:18:        console.error("Superadmin Support error:", error);
src/app/api/_handlers/subscriptions/route.ts:129:    console.error('Error in GET /api/subscriptions:', error);
src/app/api/_handlers/subscriptions/route.ts:213:    console.error('Error in POST /api/subscriptions:', error);
src/app/admin/templates/error.tsx:18:        console.error("Admin Templates error:", error);
src/app/(superadmin)/god/analytics/error.tsx:18:        console.error("Superadmin Analytics error:", error);
src/app/api/_handlers/subscriptions/limits/route.ts:47:    console.error("Error in GET /api/subscriptions/limits:", error);
src/app/(superadmin)/god/directory/error.tsx:18:        console.error("Superadmin Directory error:", error);
src/app/api/_handlers/subscriptions/cancel/route.ts:69:    console.error('Error in POST /api/subscriptions/cancel:', error);
src/app/(superadmin)/god/audit-log/error.tsx:18:        console.error("Superadmin Audit Log error:", error);
src/app/api/_handlers/add-ons/stats/route.ts:133:    console.error('Error in GET /api/add-ons/stats:', error);
src/app/(superadmin)/god/announcements/error.tsx:18:        console.error("Superadmin Announcements error:", error);
src/app/api/_handlers/calendar/events/route.ts:75:        console.error("[/api/calendar/events:GET] Unhandled error:", error);
src/app/api/_handlers/images/unsplash/route.ts:56:            console.error("Unsplash API error:", response.status);
src/app/api/_handlers/images/unsplash/route.ts:86:        console.error("Unsplash fetch error:", error);
src/app/(superadmin)/god/monitoring/error.tsx:18:        console.error("Superadmin Monitoring error:", error);
src/app/api/_handlers/cron/reputation-campaigns/route.ts:81:      console.error("[cron/reputation-campaigns] Partial errors:", allErrors);
src/app/api/_handlers/cron/reputation-campaigns/route.ts:91:    console.error("[cron/reputation-campaigns] Fatal error:", error);
src/app/api/_handlers/add-ons/[id]/route.ts:56:    console.error('Error in GET /api/add-ons/[id]:', error);
src/app/api/_handlers/add-ons/[id]/route.ts:120:      console.error('Error updating add-on:', error);
src/app/api/_handlers/add-ons/[id]/route.ts:130:    console.error('Error in PUT /api/add-ons/[id]:', error);
src/app/api/_handlers/add-ons/[id]/route.ts:192:      console.error('Error deleting add-on:', error);
src/app/api/_handlers/add-ons/[id]/route.ts:198:    console.error('Error in DELETE /api/add-ons/[id]:', error);
src/app/(superadmin)/god/error.tsx:18:        console.error("Superadmin error:", error);
src/app/api/_handlers/portal/[token]/route.ts:139:      console.error("[portal/:token] failed to load client profile:", clientProfileResult.error);
src/app/api/_handlers/portal/[token]/route.ts:144:      console.error("[portal/:token] failed to load organization:", organizationResult.error);
src/app/api/_handlers/portal/[token]/route.ts:149:      console.error("[portal/:token] failed to load trip:", tripResult.error);
src/app/api/_handlers/portal/[token]/route.ts:154:      console.error("[portal/:token] failed to load itinerary days:", daysResult.error);
src/app/api/_handlers/portal/[token]/route.ts:159:      console.error("[portal/:token] failed to load payment links:", paymentLinksResult.error);
src/app/api/_handlers/portal/[token]/route.ts:185:      console.error("[portal/:token] failed to load activities:", activities.error);
src/app/api/_handlers/portal/[token]/route.ts:190:      console.error("[portal/:token] failed to load accommodations:", accommodations.error);
src/app/api/_handlers/portal/[token]/route.ts:359:    console.error("[portal/:token] unexpected error:", error);
src/app/(superadmin)/god/referrals/error.tsx:18:        console.error("Superadmin Referrals error:", error);
src/app/(superadmin)/god/signups/error.tsx:18:        console.error("Superadmin Signups error:", error);
src/app/api/_handlers/images/route.ts:25:    console.error("[/api/images:GET] Unhandled error:", error);
src/app/api/_handlers/add-ons/route.ts:59:      console.error('Error fetching add-ons:', error);
src/app/api/_handlers/add-ons/route.ts:65:    console.error('Error in GET /api/add-ons:', error);
src/app/api/_handlers/add-ons/route.ts:125:      console.error('Error creating add-on:', error);
src/app/api/_handlers/add-ons/route.ts:131:    console.error('Error in POST /api/add-ons:', error);
src/app/trips/templates/error.tsx:18:        console.error("Trip Templates error:", error);
src/app/api/_handlers/payments/razorpay/route.ts:35:    console.error("[/api/payments/razorpay:POST] Unhandled error:", error);
src/app/api/_handlers/payments/razorpay/route.ts:63:    console.error("[/api/payments/razorpay:GET] Unhandled error:", error);
src/app/api/_handlers/images/pexels/route.ts:36:            console.error("Pexels API error:", response.status);
src/app/api/_handlers/images/pexels/route.ts:50:        console.error("Pexels fetch error:", error);
src/app/(superadmin)/god/costs/error.tsx:18:        console.error("Superadmin Costs error:", error);
src/app/api/_handlers/images/pixabay/route.ts:32:            console.error("Pixabay API error:", response.status);
src/app/api/_handlers/images/pixabay/route.ts:46:        console.error("Pixabay fetch error:", error);
src/app/(superadmin)/god/costs/org/[orgId]/error.tsx:18:        console.error("Superadmin Org Costs error:", error);
src/app/api/_handlers/admin/reports/operators/route.ts:43:        console.error("[/api/admin/reports/operators:GET] Unhandled error:", error);
src/app/api/_handlers/auth/password-login/route.ts:99:    console.error("[/api/auth/password-login:POST] Unhandled error:", error);
src/app/api/_handlers/payments/create-order/route.ts:124:    console.error('Error in POST /api/payments/create-order:', error);
src/app/(superadmin)/god/kill-switch/error.tsx:18:        console.error("Superadmin Kill Switch error:", error);
src/app/api/_handlers/admin/reports/gst/route.ts:71:      console.error("[reports/gst] DB error:", error);
src/app/api/_handlers/admin/reports/gst/route.ts:98:    console.error("[/api/admin/reports/gst:GET] Unhandled error:", error);
src/app/api/_handlers/invoices/[id]/route.ts:69:      console.error("Failed to fetch invoice:", error);
src/app/api/_handlers/invoices/[id]/route.ts:100:    console.error("[/api/invoices/[id]:GET] Unhandled error:", error);
src/app/api/_handlers/invoices/[id]/route.ts:120:      console.error("Failed to fetch invoice for update:", error);
src/app/api/_handlers/invoices/[id]/route.ts:224:    console.error("[/api/invoices/[id]:PUT] Unhandled error:", error);
src/app/api/_handlers/invoices/[id]/route.ts:245:      console.error("Failed to fetch invoice for delete:", error);
src/app/api/_handlers/invoices/[id]/route.ts:267:    console.error("[/api/invoices/[id]:DELETE] Unhandled error:", error);
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:91:    console.error("[/api/admin/reputation/client-referrals:GET] Unhandled error:", error);
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:156:    console.error("[/api/admin/reputation/client-referrals:POST] Unhandled error:", error);
src/app/api/_handlers/settings/integrations/route.ts:52:        console.error("[/api/settings/integrations:GET] Unhandled error:", error);
src/app/social/_components/SocialAnalytics.tsx:82:      console.error("Error fetching stats:", error);
src/app/api/_handlers/invoices/[id]/pay/route.ts:152:    console.error("[/api/invoices/[id]/pay:POST] Unhandled error:", error);
src/app/api/_handlers/cron/operator-scorecards/route.ts:36:    console.error("[/api/cron/operator-scorecards:POST] failed:", error);
src/app/api/_handlers/invoices/route.ts:54:      console.error("Failed to list invoices:", error);
src/app/api/_handlers/invoices/route.ts:80:    console.error("[/api/invoices:GET] Unhandled error:", error);
src/app/api/_handlers/invoices/route.ts:222:    console.error("[/api/invoices:POST] Unhandled error:", error);
src/app/api/_handlers/payments/links/route.ts:104:    console.error("[payments/links] create failed:", error);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:68:    console.error("[/api/admin/proposals/[id]/tiers:GET] Unhandled error:", error);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:132:      console.error("[/api/admin/proposals/[id]/tiers:PATCH] DB error:", error);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:146:    console.error("[/api/admin/proposals/[id]/tiers:PATCH] Unhandled error:", error);
src/app/api/_handlers/invoices/send-pdf/route.ts:114:    console.error("Error in POST /api/invoices/send-pdf:", error);
src/app/api/_handlers/admin/leads/[id]/route.ts:132:    console.error("[admin/leads/:id] PATCH error:", updateError);
src/app/api/_handlers/payments/verify/route.ts:102:    console.error("[payments/verify] verification failed:", error);
src/app/api/_handlers/proposals/create/route.ts:229:    console.error("Error in POST /api/admin/proposals/create:", error);
src/app/api/_handlers/admin/leads/route.ts:73:    console.error("[admin/leads] GET error:", error);
src/app/api/_handlers/admin/leads/route.ts:155:    console.error("[admin/leads] POST error:", error);
src/app/api/_handlers/payments/links/[token]/route.ts:55:    console.error("[payments/links/:token] load failed:", error);
src/app/api/_handlers/payments/links/[token]/route.ts:111:    console.error("[payments/links/:token] event failed:", error);
src/app/api/_handlers/bookings/[id]/invoice/route.ts:115:    console.error("[/api/bookings/[id]/invoice:GET] Unhandled error:", error);
src/app/api/_handlers/proposals/[id]/convert/route.ts:337:        console.error("Convert proposal error:", error);
src/app/api/_handlers/admin/destinations/route.ts:66:    console.error("[/api/admin/destinations:GET] Unhandled error:", error);
src/app/api/_handlers/admin/funnel/route.ts:104:    console.error("[/api/admin/funnel:GET] Unhandled error:", error);
src/app/api/_handlers/settings/marketplace/route.ts:123:    console.error("[settings/marketplace] unexpected error:", error);
src/app/api/_handlers/admin/ltv/route.ts:70:    console.error("[/api/admin/ltv:GET] Unhandled error:", error);
src/app/api/_handlers/settings/upi/route.ts:38:            console.error('UPI upsert error:', upsertError);
src/app/api/_handlers/settings/upi/route.ts:44:        console.error('UPI save error:', error);
src/app/api/_handlers/settings/upi/route.ts:65:        console.error('UPI load error:', error);
src/app/api/_handlers/admin/pricing/trips/route.ts:123:    console.error("[/api/admin/pricing/trips:GET] Unhandled error:", error);
src/app/api/_handlers/admin/cache-metrics/route.ts:33:    console.error("[/api/admin/cache-metrics:GET] Unhandled error:", error);
src/app/api/_handlers/assistant/export/route.ts:53:    console.error("Export error:", error);
src/app/api/_handlers/admin/pricing/vendor-history/route.ts:45:      console.error("[/api/admin/pricing/vendor-history:GET] DB error:", error);
src/app/api/_handlers/admin/pricing/vendor-history/route.ts:72:    console.error("[/api/admin/pricing/vendor-history:GET] Unhandled error:", error);
src/app/api/_handlers/assistant/quick-prompts/route.ts:88:      console.error("Quick prompts read error:", error);
src/app/api/_handlers/assistant/quick-prompts/route.ts:97:    console.error("Quick prompts GET error:", error);
src/app/api/_handlers/assistant/quick-prompts/route.ts:135:      console.error("Quick prompts write error:", error);
src/app/api/_handlers/assistant/quick-prompts/route.ts:141:    console.error("Quick prompts POST error:", error);
src/app/api/_handlers/admin/pricing/transactions/route.ts:168:    console.error("[/api/admin/pricing/transactions:GET] Unhandled error:", error);
src/app/api/_handlers/admin/insights/ai-usage/route.ts:103:    console.error("[/api/admin/insights/ai-usage:GET] Unhandled error:", error);
src/app/api/_handlers/emails/welcome/route.ts:67:        console.error("Welcome email error:", error);
src/app/api/_handlers/admin/pricing/dashboard/route.ts:180:    console.error("[/api/admin/pricing/dashboard:GET] Unhandled error:", error);
src/app/api/_handlers/assistant/conversations/[sessionId]/route.ts:66:    console.error("Conversation detail error:", error);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:166:    console.error("[marketplace/listing-subscription] load failed:", error);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:244:    console.error("[marketplace/listing-subscription] create failed:", error);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:297:    console.error("[marketplace/listing-subscription] cancel failed:", error);
src/app/api/_handlers/admin/insights/win-loss/route.ts:113:    console.error("[/api/admin/insights/win-loss:GET] Unhandled error:", error);
src/app/api/_handlers/assistant/conversations/route.ts:80:    console.error("Conversations list error:", error);
src/app/api/_handlers/assistant/conversations/route.ts:110:    console.error("Conversation delete error:", error);
src/app/api/_handlers/leads/convert/route.ts:157:    console.error("[leads/convert] insert error:", error);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:46:    console.error("[/api/admin/insights/batch-jobs:GET] Unhandled error:", error);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:111:    console.error("[/api/admin/insights/batch-jobs:POST] Unhandled error:", error);
src/app/api/_handlers/settings/team/[id]/resend/route.ts:71:      console.error("[settings/team/:id/resend] inviteUserByEmail failed:", inviteResponse.error);
src/app/api/_handlers/settings/team/[id]/resend/route.ts:85:    console.error("[settings/team/:id/resend] unexpected error:", error);
src/app/api/_handlers/assistant/usage/route.ts:48:    console.error("Assistant usage endpoint error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:40:      console.error("[/api/admin/pricing/overheads/[id]:GET] DB error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:49:    console.error("[/api/admin/pricing/overheads/[id]:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:90:      console.error("[/api/admin/pricing/overheads/[id]:PATCH] DB error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:98:    console.error("[/api/admin/pricing/overheads/[id]:PATCH] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:123:      console.error("[/api/admin/pricing/overheads/[id]:DELETE] DB error:", error);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:128:    console.error("[/api/admin/pricing/overheads/[id]:DELETE] Unhandled error:", error);
src/app/api/_handlers/proposals/[id]/pdf/route.ts:240:    console.error('Error in GET /api/proposals/[id]/pdf:', error);
src/app/api/_handlers/location/share/route.ts:72:        console.error("Error in GET /api/location/share:", error);
src/app/api/_handlers/location/share/route.ts:136:            console.error("Error creating location share:", error);
src/app/api/_handlers/location/share/route.ts:148:        console.error("Error in POST /api/location/share:", error);
src/app/api/_handlers/location/share/route.ts:202:            console.error("Error revoking location share:", error);
src/app/api/_handlers/location/share/route.ts:222:        console.error("Error in DELETE /api/location/share:", error);
src/app/api/_handlers/admin/insights/auto-requote/route.ts:101:    console.error("[/api/admin/insights/auto-requote:GET] Unhandled error:", error);
src/app/api/_handlers/settings/team/[id]/route.ts:85:    console.error("[settings/team/:id] unexpected patch error:", error);
src/app/api/_handlers/settings/team/[id]/route.ts:152:    console.error("[settings/team/:id] unexpected delete error:", error);
src/app/api/_handlers/reputation/reviews/[id]/route.ts:53:    console.error("Error fetching reputation review:", error);
src/app/api/_handlers/reputation/reviews/[id]/route.ts:131:    console.error("Error updating reputation review:", error);
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:206:    console.error("[marketplace/listing-subscription/verify] failed:", error);
src/app/api/_handlers/settings/team/route.ts:22:    console.error("[settings/team] failed to load members:", error);
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:261:    console.error("[proposals] loadOperatorContact error:", err);
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:392:    console.error("[proposals] recalculate price rpc error:", error);
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:404:      console.error("[proposals] update price error:", updateError);
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:433:      console.error("[proposals] buildPublicPayload mark-viewed error:", viewedUpdateError);
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:583:    console.error("[proposals] buildPublicPayload unexpected error:", err);
src/app/api/_handlers/admin/pricing/overheads/route.ts:57:      console.error("[/api/admin/pricing/overheads:GET] DB error:", error);
src/app/api/_handlers/admin/pricing/overheads/route.ts:63:    console.error("[/api/admin/pricing/overheads:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/overheads/route.ts:111:      console.error("[/api/admin/pricing/overheads:POST] DB error:", error);
src/app/api/_handlers/admin/pricing/overheads/route.ts:117:    console.error("[/api/admin/pricing/overheads:POST] Unhandled error:", error);
src/app/api/_handlers/settings/team/invite/route.ts:81:        console.error("[settings/team/invite] inviteUserByEmail failed:", inviteResponse.error);
src/app/api/_handlers/settings/team/invite/route.ts:129:    console.error("[settings/team/invite] unexpected error:", error);
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
src/app/api/_handlers/location/ping/route.ts:120:            console.error("Location ping insert error:", insertError);
src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route.ts:88:    console.error("Error processing review marketing asset:", error);
src/app/api/_handlers/admin/insights/best-quote/route.ts:188:    console.error("[/api/admin/insights/best-quote:POST] Unhandled error:", error);
src/app/api/_handlers/location/cleanup-expired/route.ts:67:            console.error("Error cleaning up expired locations:", error);
src/app/api/_handlers/location/cleanup-expired/route.ts:88:        console.error("Error in POST /api/location/cleanup-expired:", error);
src/app/api/_handlers/proposals/bulk/route.ts:100:    console.error("[proposals/bulk] failed:", error);
src/app/api/_handlers/reputation/connections/route.ts:46:    console.error("Error fetching platform connections:", error);
src/app/api/_handlers/reputation/connections/route.ts:129:    console.error("Error creating platform connection:", error);
src/app/api/_handlers/reputation/connections/route.ts:175:    console.error("Error deleting platform connection:", error);
src/app/api/_handlers/assistant/confirm/route.ts:134:    console.error("Assistant confirm error:", error);
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:131:    console.error("[/api/admin/insights/smart-upsell-timing:GET] Unhandled error:", error);
src/app/api/_handlers/reputation/widget/[token]/route.ts:163:    console.error("Error fetching widget data:", error);
src/app/api/_handlers/reputation/reviews/route.ts:143:    console.error("Error fetching reputation reviews:", error);
src/app/api/_handlers/reputation/reviews/route.ts:214:    console.error("Error creating reputation review:", error);
src/app/api/_handlers/proposals/send-pdf/route.ts:143:    console.error('Error in POST /api/proposals/send-pdf:', error);
src/app/api/_handlers/assistant/chat/route.ts:95:    console.error("Assistant chat error:", error);
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:215:    console.error("[/api/admin/insights/ops-copilot:GET] Unhandled error:", error);
src/app/api/_handlers/reputation/dashboard/route.ts:147:    console.error("Error fetching reputation dashboard:", error);
src/app/api/_handlers/reputation/widget/config/route.ts:56:    console.error("Error fetching widgets:", error);
src/app/api/_handlers/reputation/widget/config/route.ts:143:    console.error("Error creating widget:", error);
src/app/api/_handlers/reputation/widget/config/route.ts:264:    console.error("Error updating widget:", error);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:51:    console.error("[/api/admin/pricing/trip-costs/[id]:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:92:      console.error("[/api/admin/pricing/trip-costs/[id]:PATCH] DB error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:100:    console.error("[/api/admin/pricing/trip-costs/[id]:PATCH] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:125:      console.error("[/api/admin/pricing/trip-costs/[id]:DELETE] DB error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:130:    console.error("[/api/admin/pricing/trip-costs/[id]:DELETE] Unhandled error:", error);
src/app/api/_handlers/reputation/analytics/topics/route.ts:84:    console.error("Error fetching reputation topics:", error);
src/app/api/_handlers/admin/insights/action-queue/route.ts:98:    console.error("[/api/admin/insights/action-queue:GET] Unhandled error:", error);
src/app/api/_handlers/assistant/chat/stream/route.ts:687:    console.error("Assistant stream error:", error);
src/app/api/_handlers/whatsapp/broadcast/route.ts:337:    console.error("[whatsapp/broadcast] failed to load broadcast metadata:", error);
src/app/api/_handlers/whatsapp/broadcast/route.ts:460:    console.error("[whatsapp/broadcast] send failed:", error);
src/app/api/_handlers/reputation/brand-voice/route.ts:98:    console.error("Error fetching brand voice:", error);
src/app/api/_handlers/reputation/brand-voice/route.ts:259:    console.error("Error updating brand voice:", error);
src/app/api/_handlers/reputation/analytics/trends/route.ts:155:    console.error("Error fetching reputation trends:", error);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:49:      console.error("[/api/admin/pricing/trip-costs:GET] DB error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:55:    console.error("[/api/admin/pricing/trip-costs:GET] Unhandled error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:97:      console.error("[/api/admin/pricing/trip-costs:POST] DB error:", error);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:103:    console.error("[/api/admin/pricing/trip-costs:POST] Unhandled error:", error);
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:162:        console.error("[/api/whatsapp/extract-trip-intent:POST] Unhandled error:", error);
src/app/api/_handlers/reputation/nps/submit/route.ts:122:      }).catch((err) => console.error("[nps/submit] promoter followup failed:", err));
src/app/api/_handlers/reputation/nps/submit/route.ts:131:    console.error("Error submitting NPS score:", error);
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:82:    console.error("Error fetching reputation snapshot:", error);
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:253:    console.error("Error generating reputation snapshot:", error);
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:54:    console.error("Error fetching reputation campaign:", error);
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:135:    console.error("Error updating reputation campaign:", error);
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:185:    console.error("Error archiving reputation campaign:", error);
src/app/api/_handlers/reputation/nps/[token]/route.ts:103:    console.error("Error loading NPS form data:", error);
src/app/api/_handlers/reputation/campaigns/route.ts:53:    console.error("Error fetching reputation campaigns:", error);
src/app/api/_handlers/reputation/campaigns/route.ts:137:    console.error("Error creating reputation campaign:", error);
src/app/api/_handlers/whatsapp/send/route.ts:112:    console.error("[whatsapp/send] unexpected error:", error);
src/app/api/_handlers/admin/insights/proposal-risk/route.ts:120:    console.error("[/api/admin/insights/proposal-risk:GET] Unhandled error:", error);
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:206:    console.error("[/api/admin/insights/upsell-recommendations:GET] Unhandled error:", error);
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:197:    console.error("Error triggering campaign sends:", error);
src/app/api/_handlers/whatsapp/connect/route.ts:68:        console.error("[whatsapp/connect] error:", error);
src/app/api/_handlers/admin/insights/daily-brief/route.ts:100:    console.error("[/api/admin/insights/daily-brief:GET] Unhandled error:", error);
src/app/api/_handlers/admin/trips/[id]/route.ts:314:        console.error("Error fetching trip details:", error);
src/app/api/_handlers/admin/insights/margin-leak/route.ts:117:    console.error("[/api/admin/insights/margin-leak:GET] Unhandled error:", error);
src/app/api/_handlers/superadmin/audit-log/route.ts:51:        console.error("[superadmin/audit-log]", err);
src/app/api/_handlers/whatsapp/disconnect/route.ts:48:        console.error("[whatsapp/disconnect] error:", error);
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts:82:        console.error("[superadmin/analytics/feature-usage]", err);
src/app/api/_handlers/reputation/ai/analyze/route.ts:208:    console.error("Error analyzing review:", error);
src/app/api/_handlers/whatsapp/conversations/route.ts:164:    console.error("[/api/whatsapp/conversations:GET] Unhandled error:", error);
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts:99:        console.error(`[superadmin/analytics/feature-usage/${feature}]`, err);
src/app/api/_handlers/reputation/ai/respond/route.ts:303:    console.error("Error generating AI response:", error);
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:196:    console.error("Error uploading PDF import:", error);
src/app/api/_handlers/reputation/sync/route.ts:343:    console.error("[reputation/sync] sync failed:", error);
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:233:    console.error("Error in batch analyze:", error);
src/app/api/_handlers/superadmin/overview/route.ts:81:        console.error("[superadmin/overview]", err);
src/app/api/_handlers/admin/revenue/route.ts:161:    console.error("[/api/admin/revenue:GET] Unhandled error:", error);
src/app/api/_handlers/superadmin/users/[id]/route.ts:69:        console.error("[superadmin/users/:id]", err);
src/app/api/_handlers/superadmin/cost/trends/route.ts:93:        console.error("[superadmin/cost/trends]", err);
src/app/api/_handlers/superadmin/referrals/overview/route.ts:137:        console.error("[superadmin/referrals/overview]", err);
src/app/api/_handlers/admin/operations/command-center/route.ts:530:    console.error("[/api/admin/operations/command-center:GET] Unhandled error:", error);
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:115:        console.error(`[superadmin/announcements/${id}/send]`, err);
src/app/api/_handlers/superadmin/cost/aggregate/route.ts:134:        console.error("[superadmin/cost/aggregate]", err);
src/app/api/_handlers/admin/geocoding/usage/route.ts:90:        console.error("Geocoding usage stats error:", error);
src/app/api/_handlers/superadmin/users/signups/route.ts:100:        console.error("[superadmin/users/signups]", err);
src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts:140:        console.error(`[superadmin/referrals/detail/${type}]`, err);
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:125:        console.error(`[superadmin/cost/org/${orgId}]`, err);
src/app/api/_handlers/whatsapp/qr/route.ts:35:        console.error("[whatsapp/qr] error:", error);
src/app/api/_handlers/superadmin/announcements/route.ts:53:        console.error("[superadmin/announcements GET]", err);
src/app/api/_handlers/superadmin/announcements/route.ts:105:        console.error("[superadmin/announcements POST]", err);
src/app/api/_handlers/admin/generate-embeddings/route.ts:57:      console.error(`Embedding generation completed with ${result.errors.length} errors:`, result.errors);
src/app/api/_handlers/admin/generate-embeddings/route.ts:76:    console.error("Batch embedding generation failed:", error);
src/app/api/_handlers/admin/generate-embeddings/route.ts:124:    console.error("Failed to get embedding stats:", error);
src/app/api/_handlers/superadmin/settings/route.ts:29:        console.error("[superadmin/settings]", err);
src/app/api/_handlers/superadmin/announcements/[id]/route.ts:69:        console.error(`[superadmin/announcements/${id} PATCH]`, err);
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:61:        console.error("[superadmin/monitoring/queues]", err);
src/app/api/_handlers/superadmin/users/directory/route.ts:66:        console.error("[superadmin/users/directory]", err);
src/app/api/_handlers/superadmin/settings/org-suspend/route.ts:56:        console.error("[superadmin/settings/org-suspend]", err);
src/app/api/_handlers/superadmin/me/route.ts:14:    console.error("[/api/superadmin/me:GET] Unhandled error:", error);
src/app/api/_handlers/superadmin/monitoring/health/route.ts:113:        console.error("[superadmin/monitoring/health]", err);
src/app/api/_handlers/superadmin/support/tickets/[id]/respond/route.ts:64:        console.error(`[superadmin/support/tickets/${id}/respond]`, err);
src/app/api/_handlers/superadmin/settings/kill-switch/route.ts:46:        console.error("[superadmin/settings/kill-switch]", err);
src/app/api/_handlers/superadmin/support/tickets/[id]/route.ts:93:        console.error(`[superadmin/support/tickets/${id}]`, err);
src/app/api/_handlers/admin/seed-demo/route.ts:95:    console.error("[admin/seed-demo] Failed to seed demo organization", error);
src/app/api/_handlers/superadmin/support/tickets/route.ts:99:        console.error("[superadmin/support/tickets]", err);
src/app/api/_handlers/admin/dashboard/stats/route.ts:200:    console.error("[/api/admin/dashboard/stats:GET] Unhandled error:", error);
src/app/api/_handlers/admin/social/generate/route.ts:340:    console.error("Error generating social posts:", error);
src/app/api/_handlers/support/route.ts:66:            console.error("Error creating ticket:", error);
src/app/api/_handlers/support/route.ts:72:        console.error("Support ticket creation error:", error);
src/app/api/_handlers/support/route.ts:104:            console.error("Error fetching tickets:", error);
src/app/api/_handlers/support/route.ts:110:        console.error("Support ticket fetch error:", error);
src/app/api/_handlers/test-geocoding/route.ts:33:        console.error("Geocoding test error:", error);
src/app/api/_handlers/nav/counts/route.ts:66:      console.warn("[nav/counts] inboxUnread error (non-fatal):", inboxUnreadResult.error.message);
src/app/api/_handlers/nav/counts/route.ts:117:    console.error("[/api/nav/counts:GET] Unhandled error:", error);
src/app/api/_handlers/webhooks/waha/route.ts:189:            console.error("[webhooks/waha] failed to resolve whatsapp profile:", error);
src/app/api/_handlers/webhooks/waha/route.ts:199:                    console.error("[webhooks/waha] message processing error:", err);
src/app/api/_handlers/webhooks/waha/route.ts:206:            console.error("[webhooks/waha] failed to resolve chatbot flag:", error);
src/app/api/_handlers/webhooks/waha/route.ts:216:                console.error("[webhooks/waha] failed to inspect recent human reply:", error);
src/app/api/_handlers/webhooks/waha/route.ts:230:            console.error("[webhooks/waha] chatbot processing error:", error);
src/app/api/_handlers/webhooks/waha/route.ts:246:            console.error("[webhooks/waha] failed to send chatbot reply:", error);
src/app/api/_handlers/ai/suggest-reply/route.ts:81:    console.error("[ai/suggest-reply] unexpected error:", error);
src/app/api/_handlers/unsplash/route.ts:13:    console.error("[/api/unsplash:GET] Unhandled error:", error);
src/app/api/_handlers/weather/route.ts:99:        console.error("Weather API error:", error);
src/app/api/_handlers/webhooks/whatsapp/route.ts:110:    console.error("[WhatsApp webhook] failed to read request body:", err);
src/app/api/_handlers/webhooks/whatsapp/route.ts:136:    console.error("[WhatsApp webhook] failed to parse JSON body:", err);
src/app/api/_handlers/social/reviews/import/route.ts:83:        console.error('Error importing reviews:', error);
src/app/api/_handlers/ai/pricing-suggestion/route.ts:187:    console.error("[ai/pricing-suggestion] unexpected error:", error);
src/app/api/_handlers/currency/route.ts:143:        console.error("Currency API error:", error);
src/app/api/_handlers/billing/contact-sales/route.ts:167:    console.error("[billing/contact-sales] unexpected error:", error);
src/app/api/_handlers/ai/draft-review-response/route.ts:53:    console.error("[ai/draft-review-response] unexpected error:", error);
src/app/api/_handlers/billing/subscription/route.ts:112:    console.error("[billing/subscription] unexpected error:", error);
src/app/api/_handlers/notifications/retry-failed/route.ts:51:            console.error("Error retrying failed notifications:", error);
src/app/api/_handlers/notifications/retry-failed/route.ts:72:        console.error("Error in POST /api/notifications/retry-failed:", error);
src/app/api/_handlers/trips/route.ts:375:        console.error("Error fetching trips:", error);
src/app/api/_handlers/whatsapp/status/route.ts:57:        console.error("[whatsapp/status] error:", error);
src/app/api/_handlers/social/reviews/route.ts:42:        console.error('Error fetching social reviews:', error);
src/app/api/_handlers/social/reviews/route.ts:89:        console.error('Error creating manual review:', error);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:69:            console.error("Failed to fetch trip add-ons:", error);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:78:        console.error("Trip add-ons error:", error);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:135:            console.error("Failed to update add-on:", error);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:144:        console.error("Trip add-on update error:", error);
src/app/api/_handlers/social/reviews/public/route.ts:229:        console.error("Error submitting public review:", error);
src/app/api/_handlers/trips/[id]/notifications/route.ts:91:    console.error("Trip notifications error:", error);
src/app/api/_handlers/trips/[id]/invoices/route.ts:91:            console.error("Failed to fetch trip invoices:", error);
src/app/api/_handlers/trips/[id]/invoices/route.ts:162:        console.error("Trip invoices error:", error);
src/app/api/_handlers/social/ai-image/route.ts:89:        console.error("[ai-image] FAL generation error:", err);
src/app/api/_handlers/social/ai-image/route.ts:158:        console.error(`[ai-${mode}] Error:`, err);
src/app/api/_handlers/itinerary/import/url/route.ts:198:        console.error("URL Import Error:", error);
src/app/api/_handlers/whatsapp/health/route.ts:22:      console.error("[whatsapp/health] failed to load connection:", error);
src/app/api/_handlers/whatsapp/health/route.ts:36:    console.error("[whatsapp/health] unexpected error:", error);
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts:74:    console.error("[whatsapp/proposal-drafts/:id] unexpected GET error:", error);
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts:148:    console.error("[whatsapp/proposal-drafts/:id] unexpected POST error:", error);
src/app/api/_handlers/social/process-queue/route.ts:144:                console.error(`Failed to publish item ${item.id}:`, err);
src/app/api/_handlers/social/process-queue/route.ts:198:        console.error("Error processing social queue:", error);
src/app/api/_handlers/whatsapp/test-message/route.ts:50:        console.error("[whatsapp/test-message] error:", error);
src/app/api/_handlers/notifications/client-landed/route.ts:176:        console.error("Client landed error:", error);
src/app/api/_handlers/itinerary/generate/route.ts:118:        console.error('Geocoding failed for fallback, using default coords:', err);
src/app/api/_handlers/itinerary/generate/route.ts:214:        console.error('Geocoding error (non-blocking):', error);
src/app/api/_handlers/itinerary/generate/route.ts:426:                                console.error('Attribution tracking failed (non-blocking):', err);
src/app/api/_handlers/itinerary/generate/route.ts:453:            console.error('[TIER 2: RAG ERROR] RAG system error (non-blocking):', ragError);
src/app/api/_handlers/itinerary/generate/route.ts:710:                console.error('Cache save failed (non-blocking):', err);
src/app/api/_handlers/itinerary/generate/route.ts:747:        console.error("AI Generation Error:", error);
src/app/api/_handlers/social/smart-poster/route.ts:105:      console.warn("[smart-poster] FAL.ai background generation failed:", err);
src/app/api/_handlers/social/smart-poster/route.ts:150:    console.error("[smart-poster] Error:", err);
src/app/api/_handlers/itinerary/import/pdf/route.ts:126:        console.error("PDF Import Error:", error);
src/app/api/_handlers/dashboard/tasks/route.ts:346:        console.error("Dashboard tasks error:", error);
src/app/api/_handlers/itineraries/route.ts:34:      console.error("Itinerary fetch error, retrying with core columns:", error.message);
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:63:            console.error("Failed to dismiss task:", error);
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:69:        console.error("Task dismiss error:", error);
src/app/api/_handlers/itineraries/[id]/route.ts:35:            console.error("Error fetching itinerary:", error);
src/app/api/_handlers/itineraries/[id]/route.ts:45:        console.error("Internal Error fetching itinerary:", error);
src/app/api/_handlers/itineraries/[id]/route.ts:96:            console.error("Error updating itinerary:", error);
src/app/api/_handlers/itineraries/[id]/route.ts:102:        console.error("Internal Error updating itinerary:", error);
src/app/api/_handlers/social/refresh-tokens/route.ts:98:                console.error(`Error refreshing token for connection ${conn.id}:`, err);
src/app/api/_handlers/social/refresh-tokens/route.ts:110:        console.error("Error refreshing social tokens:", error);
src/app/api/_handlers/social/ai-poster/route.ts:73:        console.error("[ai-poster] Error:", error);
src/app/api/_handlers/social/posts/[id]/render/route.ts:68:        console.error("Render upload error:", error);
src/app/api/_handlers/integrations/tripadvisor/route.ts:57:        console.error('TripAdvisor connect error:', error);
src/app/api/_handlers/integrations/tripadvisor/route.ts:92:        console.error('TripAdvisor reviews fetch error:', error);
src/app/api/_handlers/social/schedule/route.ts:77:    console.error("Error scheduling social post for review:", error);
src/app/api/_handlers/social/posts/route.ts:52:        console.error("Error fetching social posts:", error);
src/app/api/_handlers/social/posts/route.ts:111:        console.error("Error creating social post:", error);
src/app/api/_handlers/social/extract/route.ts:95:    console.error("Extraction Error:", error);
src/app/api/_handlers/dashboard/schedule/route.ts:134:            console.error("Schedule query error:", error);
src/app/api/_handlers/dashboard/schedule/route.ts:192:        console.error("Dashboard schedule error:", error);
src/app/api/_handlers/social/captions/route.ts:112:    console.error("Caption Error:", error);
src/app/api/_handlers/social/connections/[id]/route.ts:53:        console.error('Error deleting social connection:', error);
src/app/api/_handlers/social/publish/route.ts:73:    console.error("Error submitting social post for review:", error);
src/app/api/_handlers/integrations/places/route.ts:137:    console.error("Google Places status check error:", error);
src/app/api/_handlers/integrations/places/route.ts:180:    console.error("Google Places activation error:", error);
src/app/api/_handlers/social/render-poster/route.ts:101:    console.error("[render-poster] Error:", err);
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:200:        console.error("Internal error in feedback endpoint:", error);
src/app/api/_handlers/social/connections/route.ts:33:        console.error('Error fetching social connections:', error);
src/app/api/_handlers/social/oauth/google/route.ts:46:        console.error('Error initiating Google OAuth:', error);
src/app/api/_handlers/social/oauth/facebook/route.ts:31:        console.error('Error initiating Facebook OAuth:', error);
src/app/api/_handlers/social/oauth/callback/route.ts:63:        console.error('FB token error:', await tokenRes.text());
src/app/api/_handlers/social/oauth/callback/route.ts:160:        console.error('Google code exchange error:', err);
src/app/api/_handlers/social/oauth/callback/route.ts:172:        console.error('Google user info error:', err);
src/app/api/_handlers/social/oauth/callback/route.ts:214:        console.error('LinkedIn code exchange error:', err);
src/app/api/_handlers/social/oauth/callback/route.ts:226:        console.error('LinkedIn profile fetch error:', err);
src/app/api/_handlers/social/oauth/callback/route.ts:283:        console.error('Callback error:', error);
src/app/api/_handlers/social/oauth/linkedin/route.ts:38:        console.error('Error initiating LinkedIn OAuth:', error);
```
