# Travel Suite Web Audit Appendix

Audit target: `projects/travel-suite/apps/web/src/`

Commit audited: `8a6e7835727560a2c49d6a27b2839ff48e57b47e`

Audit date: `2026-03-14`

## Coverage

| Metric | Value |
|--------|-------|
| Total `src/` files reviewed | 1231 |
| TypeScript / TSX files | 1227 |
| `src/app` files | 632 |
| `src/components` files | 249 |
| `src/features` files | 89 |
| `src/lib` files | 241 |
| `src/emails` files | 8 |
| `src/hooks` files | 4 |
| `src/stores` files | 2 |
| `src/styles` files | 2 |
| `src/types` files | 2 |

## Validator Baseline

### `npm run typecheck`

```text

> web@0.1.0 typecheck
> tsc --noEmit

src/components/marketing/CardSwap.tsx(20,18): error TS2307: Cannot find module 'gsap' or its corresponding type declarations.
src/components/marketing/effects/TextReveal.tsx(4,18): error TS2307: Cannot find module 'gsap' or its corresponding type declarations.
src/components/marketing/effects/TextReveal.tsx(5,31): error TS2307: Cannot find module 'gsap/ScrollTrigger' or its corresponding type declarations.
src/components/marketing/ForceFieldBackground.tsx(3,48): error TS2307: Cannot find module '@tsparticles/react' or its corresponding type declarations.
src/components/marketing/ForceFieldBackground.tsx(4,26): error TS2307: Cannot find module '@tsparticles/slim' or its corresponding type declarations.
src/components/marketing/ForceFieldBackground.tsx(5,29): error TS2307: Cannot find module '@tsparticles/engine' or its corresponding type declarations.
src/components/marketing/IndiaMap.tsx(3,22): error TS2307: Cannot find module '@svg-maps/india' or its corresponding type declarations.
src/components/marketing/sections/HeroSection.tsx(10,18): error TS2307: Cannot find module 'gsap' or its corresponding type declarations.
src/components/marketing/sections/HeroSection.tsx(11,31): error TS2307: Cannot find module 'gsap/ScrollTrigger' or its corresponding type declarations.
src/components/marketing/sections/HeroSection.tsx(32,49): error TS7006: Parameter 'text' implicitly has an 'any' type.
src/components/marketing/SplineScene.tsx(5,37): error TS2307: Cannot find module '@splinetool/react-spline' or its corresponding type declarations.
src/components/marketing/SplineScene.tsx(24,15): error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: {}, context?: any): string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<...> | Component<...> | null | undefined', gave the following error.
    Type '{ scene: string; onLoad: ((splineApp: any) => void) | undefined; }' is not assignable to type 'IntrinsicAttributes'.
      Property 'scene' does not exist on type 'IntrinsicAttributes'.
  Overload 2 of 2, '(props: {}): string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<...> | Component<...> | null | undefined', gave the following error.
    Type '{ scene: string; onLoad: ((splineApp: any) => void) | undefined; }' is not assignable to type 'IntrinsicAttributes'.
      Property 'scene' does not exist on type 'IntrinsicAttributes'.
```

### `npm run lint`

```text

> web@0.1.0 lint
> eslint --max-warnings=0

```

### `npx madge --circular --extensions ts,tsx src`

```text
- Finding files
Processed 1228 files (6.1s) (646 warnings)

✔ No circular dependency found!

```

## Full `src/` Manifest

```text
src/app/(marketing)/about/page.tsx
src/app/(marketing)/blog/BlogHero.tsx
src/app/(marketing)/blog/[slug]/page.tsx
src/app/(marketing)/blog/page.tsx
src/app/(marketing)/demo/page.tsx
src/app/(marketing)/layout.tsx
src/app/(marketing)/page.tsx
src/app/(marketing)/pricing/page.tsx
src/app/(marketing)/solutions/[type]/page.tsx
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
src/app/api/_handlers/admin/cost/overview/aggregators.ts
src/app/api/_handlers/admin/cost/overview/alert-builders.ts
src/app/api/_handlers/admin/cost/overview/loaders.ts
src/app/api/_handlers/admin/cost/overview/route.ts
src/app/api/_handlers/admin/cost/overview/shared.ts
src/app/api/_handlers/admin/cost/overview/types.ts
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
src/app/api/_handlers/availability/route.ts
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
src/app/api/_handlers/whatsapp/chatbot-sessions/[id]/route.ts
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
src/app/api/og/route.tsx
src/app/api/reputation/[...path]/route.ts
src/app/api/social/[...path]/route.ts
src/app/api/superadmin/[...path]/route.ts
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
src/app/clients/components/ClientFormModal.tsx
src/app/clients/components/ClientKanbanBoard.tsx
src/app/clients/error.tsx
src/app/clients/hooks/useClientForm.ts
src/app/clients/hooks/useClientPipeline.ts
src/app/clients/page.tsx
src/app/clients/types.ts
src/app/dashboard/error.tsx
src/app/dashboard/schedule/error.tsx
src/app/dashboard/schedule/page.tsx
src/app/dashboard/tasks/TaskActionPanels.tsx
src/app/dashboard/tasks/TaskCards.tsx
src/app/dashboard/tasks/error.tsx
src/app/dashboard/tasks/page.tsx
src/app/dashboard/tasks/task-board-types.ts
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
src/app/inbox/BroadcastTab.tsx
src/app/inbox/TemplatesListView.tsx
src/app/inbox/error.tsx
src/app/inbox/page.tsx
src/app/inbox/useBroadcastAudience.ts
src/app/layout.tsx
src/app/live/[token]/error.tsx
src/app/live/[token]/page.tsx
src/app/loading.tsx
src/app/manifest.ts
src/app/map-test/error.tsx
src/app/map-test/page.tsx
src/app/marketing-globals.css
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
src/app/robots.ts
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
src/app/sitemap.ts
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
src/components/marketing/CardSwap.tsx
src/components/marketing/ComparisonTable.tsx
src/components/marketing/CountUp.tsx
src/components/marketing/CustomerLogos.tsx
src/components/marketing/ExitIntentPopup.tsx
src/components/marketing/FAQ.tsx
src/components/marketing/Footer.tsx
src/components/marketing/ForceFieldBackground.tsx
src/components/marketing/HeroScreens.tsx
src/components/marketing/HowItWorks.tsx
src/components/marketing/IndiaMap.tsx
src/components/marketing/InteractiveDemo.tsx
src/components/marketing/LeadMagnet.tsx
src/components/marketing/LeadMagnetSection.tsx
src/components/marketing/LiveChat.tsx
src/components/marketing/MarketingChrome.tsx
src/components/marketing/Navbar.tsx
src/components/marketing/ROICalculator.tsx
src/components/marketing/ScrollProgress.tsx
src/components/marketing/ShinyText.tsx
src/components/marketing/SplineScene.tsx
src/components/marketing/StickyMobileCTA.tsx
src/components/marketing/Testimonials.tsx
src/components/marketing/ThemeToggle.tsx
src/components/marketing/TravelBuiltLogo.tsx
src/components/marketing/blog/BlogCard.tsx
src/components/marketing/blog/BlogPost.tsx
src/components/marketing/brand.ts
src/components/marketing/effects/CounterAnimation.tsx
src/components/marketing/effects/FadeInOnScroll.tsx
src/components/marketing/effects/GradientMesh.tsx
src/components/marketing/effects/MagneticButton.tsx
src/components/marketing/effects/ParallaxLayer.tsx
src/components/marketing/effects/SectionDivider.tsx
src/components/marketing/effects/TextReveal.tsx
src/components/marketing/effects/TiltCard.tsx
src/components/marketing/effects/index.ts
src/components/marketing/sections/BeforeAfterSection.tsx
src/components/marketing/sections/FeaturesProposals.tsx
src/components/marketing/sections/FeaturesShowcase.tsx
src/components/marketing/sections/FinalCTASection.tsx
src/components/marketing/sections/HeroSection.tsx
src/components/marketing/sections/LivePulseSection.tsx
src/components/marketing/sections/ProposalPreviewSection.tsx
src/components/marketing/sections/index.ts
src/components/marketing/seo/JsonLd.tsx
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
src/components/whatsapp/ConversationListPanel.tsx
src/components/whatsapp/InboxModals.tsx
src/components/whatsapp/MessageThread.tsx
src/components/whatsapp/ThreadPane.tsx
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
src/components/whatsapp/useInboxData.ts
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
src/features/admin/billing/BillingHistorySection.tsx
src/features/admin/billing/BillingModals.tsx
src/features/admin/billing/BillingPlanComparison.tsx
src/features/admin/billing/BillingPlanSection.tsx
src/features/admin/billing/BillingUpgradeSection.tsx
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
src/lib/blog/queries.ts
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

## Route Inventory and TODO / FIXME / HACK Scan

```text
DIRECT_ROUTE_FILES
src/app/api/[...path]/route.ts
src/app/api/admin/[...path]/route.ts
src/app/api/assistant/[...path]/route.ts
src/app/api/reputation/[...path]/route.ts
src/app/api/social/[...path]/route.ts
src/app/api/superadmin/[...path]/route.ts

TODO_FIXME_HACK
src/lib/payments/payment-receipt-config.ts:3: * TODO(billing): Move to organization_settings table to support
src/lib/blog/queries.ts:26:// TODO: Remove these casts after regenerating database.types.ts
src/components/marketing/blog/BlogPost.tsx:24:// TODO: Replace with next-mdx-remote MDX rendering when package is installed
```

## Architecture Metrics Raw Output

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
src/app/api/_handlers/assistant/chat/stream/route.ts:694
src/app/api/_handlers/itinerary/generate/route.ts:752
src/app/clients/[id]/page.tsx:799
src/app/drivers/page.tsx:799
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
src/features/admin/analytics/AdminAnalyticsView.tsx:635
src/features/admin/revenue/AdminRevenueView.tsx:795
src/lib/assistant/orchestrator.ts:683
src/lib/database.types.ts:6821
src/lib/whatsapp/india-templates.ts:787

FUNCTION_LENGTH_BREACHES
src/app/(marketing)/about/page.tsx:47:276
src/app/(marketing)/blog/page.tsx:56:103
src/app/(marketing)/demo/page.tsx:4:83
src/app/(marketing)/pricing/page.tsx:199:106
src/app/(marketing)/solutions/[type]/page.tsx:58:81
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
src/app/add-ons/_components/AddOnFormModal.tsx:44:167
src/app/add-ons/_components/AddOnsGrid.tsx:26:133
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
src/app/admin/kanban/page.tsx:552:86
src/app/admin/kanban/page.tsx:85:585
src/app/admin/layout.tsx:19:86
src/app/admin/notifications/page.tsx:30:706
src/app/admin/notifications/shared.tsx:158:116
src/app/admin/operations/page.tsx:135:450
src/app/admin/page.tsx:120:684
src/app/admin/page.tsx:152:155
src/app/admin/page.tsx:153:151
src/app/admin/planner/page.tsx:77:255
src/app/admin/pricing/page.tsx:47:324
src/app/admin/referrals/page.tsx:14:196
src/app/admin/security/page.tsx:44:170
src/app/admin/settings/SettingsIntegrationsSection.tsx:45:307
src/app/admin/settings/marketplace/page.tsx:78:524
src/app/admin/settings/page.tsx:38:711
src/app/admin/support/page.tsx:71:304
src/app/admin/support/page.tsx:81:99
src/app/admin/templates/page.tsx:84:209
src/app/admin/templates/page.tsx:94:81
src/app/admin/tour-templates/[id]/edit/page.tsx:205:128
src/app/admin/tour-templates/[id]/edit/page.tsx:64:412
src/app/admin/tour-templates/[id]/edit/page.tsx:86:114
src/app/admin/tour-templates/[id]/page.tsx:346:135
src/app/admin/tour-templates/[id]/page.tsx:76:454
src/app/admin/tour-templates/[id]/page.tsx:90:91
src/app/admin/tour-templates/create/_components/AccommodationEditor.tsx:13:118
src/app/admin/tour-templates/create/_components/ActivityEditor.tsx:12:84
src/app/admin/tour-templates/create/_components/DayEditor.tsx:22:123
src/app/admin/tour-templates/create/_components/MetadataForm.tsx:22:152
src/app/admin/tour-templates/create/page.tsx:192:149
src/app/admin/tour-templates/create/page.tsx:73:337
src/app/admin/tour-templates/import/page.tsx:163:98
src/app/admin/tour-templates/import/page.tsx:18:458
src/app/admin/tour-templates/page.tsx:340:113
src/app/admin/tour-templates/page.tsx:49:421
src/app/admin/trips/[id]/_components/AccommodationCard.tsx:17:130
src/app/admin/trips/[id]/_components/DayActivities.tsx:156:106
src/app/admin/trips/[id]/_components/DriverAssignmentCard.tsx:15:109
src/app/admin/trips/[id]/_components/TripHeader.tsx:35:236
src/app/admin/trips/[id]/_components/utils.ts:84:82
src/app/admin/trips/[id]/clone/page.tsx:28:218
src/app/admin/trips/[id]/page.tsx:316:92
src/app/admin/trips/[id]/page.tsx:38:655
src/app/admin/trips/page.tsx:69:384
src/app/analytics/drill-through/page.tsx:76:171
src/app/analytics/templates/page.tsx:13:285
src/app/api/_handlers/add-ons/stats/route.ts:34:103
src/app/api/_handlers/admin/clear-cache/route.ts:38:93
src/app/api/_handlers/admin/clients/route.ts:128:217
src/app/api/_handlers/admin/clients/route.ts:418:88
src/app/api/_handlers/admin/clients/route.ts:507:231
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:44:173
src/app/api/_handlers/admin/contacts/route.ts:138:146
src/app/api/_handlers/admin/contacts/route.ts:49:88
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:14:91
src/app/api/_handlers/admin/cost/overview/route.ts:47:201
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
src/app/api/_handlers/admin/leads/[id]/route.ts:68:94
src/app/api/_handlers/admin/leads/route.ts:80:107
src/app/api/_handlers/admin/marketplace/verify/route.ts:193:182
src/app/api/_handlers/admin/marketplace/verify/route.ts:98:94
src/app/api/_handlers/admin/notifications/delivery/route.ts:55:107
src/app/api/_handlers/admin/operations/command-center/route.ts:212:325
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:152:180
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:336:86
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:61:145
src/app/api/_handlers/admin/pricing/dashboard/route.ts:16:171
src/app/api/_handlers/admin/pricing/transactions/route.ts:39:136
src/app/api/_handlers/admin/pricing/trips/route.ts:17:113
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:297:125
src/app/api/_handlers/admin/referrals/route.ts:107:123
src/app/api/_handlers/admin/referrals/route.ts:22:84
src/app/api/_handlers/admin/revenue/route.ts:38:93
src/app/api/_handlers/admin/security/diagnostics/route.ts:21:100
src/app/api/_handlers/admin/social/generate/route.ts:232:115
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:221:180
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:72:84
src/app/api/_handlers/admin/trips/[id]/route.ts:56:262
src/app/api/_handlers/admin/trips/route.ts:120:111
src/app/api/_handlers/admin/trips/route.ts:232:118
src/app/api/_handlers/admin/whatsapp/health/route.ts:54:244
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:10:118
src/app/api/_handlers/admin/workflow/events/route.ts:13:118
src/app/api/_handlers/ai/pricing-suggestion/route.ts:109:82
src/app/api/_handlers/assistant/chat/route.ts:9:93
src/app/api/_handlers/assistant/chat/stream/route.ts:258:100
src/app/api/_handlers/assistant/chat/stream/route.ts:363:213
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
src/app/api/_handlers/invoices/[id]/pay/route.ts:21:138
src/app/api/_handlers/invoices/[id]/route.ts:108:123
src/app/api/_handlers/invoices/route.ts:88:141
src/app/api/_handlers/invoices/send-pdf/route.ts:26:96
src/app/api/_handlers/itineraries/[id]/bookings/route.ts:101:94
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:59:146
src/app/api/_handlers/itineraries/route.ts:6:152
src/app/api/_handlers/itinerary/generate/route.ts:226:526
src/app/api/_handlers/itinerary/import/pdf/route.ts:46:85
src/app/api/_handlers/itinerary/import/url/route.ts:101:102
src/app/api/_handlers/leads/convert/route.ts:40:141
src/app/api/_handlers/location/client-share/route.ts:13:89
src/app/api/_handlers/location/live/[token]/route.ts:23:113
src/app/api/_handlers/location/ping/route.ts:12:117
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:96:176
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:108:92
src/app/api/_handlers/marketplace/[id]/view/route.ts:14:99
src/app/api/_handlers/marketplace/inquiries/route.ts:148:92
src/app/api/_handlers/marketplace/inquiries/route.ts:47:100
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:83:127
src/app/api/_handlers/marketplace/options/route.ts:165:100
src/app/api/_handlers/marketplace/route.ts:209:284
src/app/api/_handlers/marketplace/route.ts:494:85
src/app/api/_handlers/marketplace/stats/route.ts:13:135
src/app/api/_handlers/notifications/client-landed/route.ts:23:157
src/app/api/_handlers/notifications/process-queue/route.ts:244:219
src/app/api/_handlers/notifications/process-queue/route.ts:464:125
src/app/api/_handlers/notifications/schedule-followups/route.ts:77:128
src/app/api/_handlers/notifications/send/route.ts:122:136
src/app/api/_handlers/onboarding/first-value/route.ts:23:129
src/app/api/_handlers/onboarding/setup/route.ts:306:201
src/app/api/_handlers/payments/create-order/route.ts:33:100
src/app/api/_handlers/payments/links/route.ts:24:84
src/app/api/_handlers/payments/verify/route.ts:20:86
src/app/api/_handlers/payments/webhook/route.ts:136:126
src/app/api/_handlers/payments/webhook/route.ts:263:113
src/app/api/_handlers/portal/[token]/route.ts:37:326
src/app/api/_handlers/proposals/[id]/convert/route.ts:105:236
src/app/api/_handlers/proposals/[id]/pdf/route.ts:92:152
src/app/api/_handlers/proposals/[id]/send/route.ts:90:182
src/app/api/_handlers/proposals/create/route.ts:52:181
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:414:173
src/app/api/_handlers/proposals/public/[token]/route.ts:78:483
src/app/api/_handlers/proposals/send-pdf/route.ts:34:99
src/app/api/_handlers/reputation/ai/analyze/route.ts:95:118
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:110:130
src/app/api/_handlers/reputation/ai/respond/route.ts:168:139
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:87:170
src/app/api/_handlers/reputation/analytics/trends/route.ts:18:141
src/app/api/_handlers/reputation/brand-voice/route.ts:103:160
src/app/api/_handlers/reputation/campaigns/route.ts:58:83
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:18:183
src/app/api/_handlers/reputation/dashboard/route.ts:18:116
src/app/api/_handlers/reputation/nps/[token]/route.ts:9:98
src/app/api/_handlers/reputation/nps/submit/route.ts:12:123
src/app/api/_handlers/reputation/reviews/route.ts:11:136
src/app/api/_handlers/reputation/sync/route.ts:98:249
src/app/api/_handlers/reputation/widget/[token]/route.ts:42:128
src/app/api/_handlers/reputation/widget/config/route.ts:148:120
src/app/api/_handlers/reputation/widget/config/route.ts:61:86
src/app/api/_handlers/settings/team/invite/route.ts:21:112
src/app/api/_handlers/settings/team/shared.ts:255:110
src/app/api/_handlers/share/[token]/route.ts:144:222
src/app/api/_handlers/social/oauth/callback/route.ts:39:104
src/app/api/_handlers/social/process-queue/route.ts:54:148
src/app/api/_handlers/social/refresh-tokens/route.ts:12:102
src/app/api/_handlers/social/reviews/import/route.ts:6:82
src/app/api/_handlers/social/reviews/public/route.ts:105:129
src/app/api/_handlers/social/smart-poster/route.ts:14:143
src/app/api/_handlers/subscriptions/route.ts:156:83
src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts:31:88
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:16:113
src/app/api/_handlers/superadmin/cost/trends/route.ts:15:82
src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts:42:102
src/app/api/_handlers/superadmin/referrals/overview/route.ts:36:105
src/app/api/_handlers/superadmin/users/signups/route.ts:18:86
src/app/api/_handlers/trips/[id]/clone/route.ts:25:118
src/app/api/_handlers/trips/[id]/invoices/route.ts:44:127
src/app/api/_handlers/trips/[id]/route.ts:361:89
src/app/api/_handlers/trips/[id]/route.ts:90:270
src/app/api/_handlers/trips/route.ts:163:216
src/app/api/_handlers/webhooks/waha/route.ts:54:198
src/app/api/_handlers/whatsapp/broadcast/route.ts:342:122
src/app/api/_handlers/whatsapp/conversations/route.ts:45:126
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:54:112
src/app/api/_handlers/whatsapp/send/route.ts:13:103
src/app/api/_handlers/whatsapp/webhook/route.ts:292:91
src/app/api/_handlers/whatsapp/webhook/route.ts:90:148
src/app/api/og/route.tsx:6:130
src/app/auth/page.tsx:14:248
src/app/billing/BillingPageClient.tsx:124:455
src/app/bookings/page.tsx:39:289
src/app/clients/[id]/ClientEditButton.tsx:48:193
src/app/clients/[id]/page.tsx:36:763
src/app/clients/components/ClientFormModal.tsx:29:165
src/app/clients/components/ClientKanbanBoard.tsx:184:104
src/app/clients/components/ClientKanbanBoard.tsx:46:127
src/app/clients/hooks/useClientForm.ts:34:92
src/app/clients/hooks/useClientPipeline.ts:44:92
src/app/clients/page.tsx:28:153
src/app/dashboard/schedule/page.tsx:161:176
src/app/dashboard/tasks/TaskActionPanels.tsx:61:98
src/app/dashboard/tasks/TaskCards.tsx:73:124
src/app/dashboard/tasks/page.tsx:26:161
src/app/design-demo/page.tsx:22:257
src/app/drivers/[id]/page.tsx:27:274
src/app/drivers/page.tsx:538:116
src/app/drivers/page.tsx:61:738
src/app/inbox/BroadcastTab.tsx:157:406
src/app/inbox/BroadcastTab.tsx:64:90
src/app/inbox/TemplatesListView.tsx:22:174
src/app/inbox/page.tsx:33:152
src/app/live/[token]/page.tsx:42:185
src/app/marketing/page.tsx:9:160
src/app/marketplace/[id]/page.tsx:89:562
src/app/marketplace/analytics/page.tsx:52:261
src/app/marketplace/inquiries/page.tsx:163:89
src/app/marketplace/inquiries/page.tsx:33:229
src/app/marketplace/page.tsx:304:103
src/app/marketplace/page.tsx:43:371
src/app/onboarding/page.tsx:119:686
src/app/p/[token]/page.tsx:38:699
src/app/p/[token]/page.tsx:497:187
src/app/p/[token]/sections.tsx:52:90
src/app/pay/[token]/PaymentCheckoutClient.tsx:48:205
src/app/pay/[token]/PaymentCheckoutClient.tsx:68:88
src/app/planner/ClientFeedbackPanel.tsx:157:108
src/app/planner/ClientFeedbackPanel.tsx:41:311
src/app/planner/ItineraryFilterBar.tsx:150:187
src/app/planner/NeedsAttentionQueue.tsx:104:180
src/app/planner/NeedsAttentionQueue.tsx:163:116
src/app/planner/PastItineraryCard.tsx:44:283
src/app/planner/PlannerHero.tsx:48:237
src/app/planner/SaveItineraryButton.tsx:21:160
src/app/planner/SaveItineraryButton.tsx:36:102
src/app/planner/ShareItinerary.tsx:12:100
src/app/planner/page.tsx:61:604
src/app/portal/[token]/page.tsx:82:379
src/app/proposals/[id]/page.tsx:74:668
src/app/proposals/create/_components/AddOnsGrid.tsx:15:142
src/app/proposals/create/_components/ClientSelector.tsx:34:264
src/app/proposals/create/_components/TemplateSelector.tsx:26:187
src/app/proposals/create/_hooks/useCreateProposal.ts:34:172
src/app/proposals/create/_hooks/useCreateProposal.ts:40:163
src/app/proposals/create/_hooks/useProposalData.ts:37:191
src/app/proposals/create/_hooks/useProposalData.ts:79:95
src/app/proposals/create/_hooks/useWhatsAppDraft.ts:27:88
src/app/proposals/create/page.tsx:25:214
src/app/proposals/page.tsx:321:120
src/app/proposals/page.tsx:92:440
src/app/reputation/_components/BrandVoiceSettings.tsx:215:311
src/app/reputation/_components/CampaignBuilder.tsx:51:486
src/app/reputation/_components/CampaignList.tsx:142:113
src/app/reputation/_components/CampaignList.tsx:84:174
src/app/reputation/_components/CompetitorBenchmark.tsx:77:226
src/app/reputation/_components/NPSSurveyPreview.tsx:13:200
src/app/reputation/_components/PlatformConnectionCards.tsx:209:114
src/app/reputation/_components/PlatformConnectionCards.tsx:58:342
src/app/reputation/_components/ReputationDashboard.tsx:108:154
src/app/reputation/_components/ReputationDashboard.tsx:325:87
src/app/reputation/_components/ReputationDashboard.tsx:489:150
src/app/reputation/_components/ReviewCard.tsx:75:216
src/app/reputation/_components/ReviewInbox.tsx:229:365
src/app/reputation/_components/ReviewInbox.tsx:65:163
src/app/reputation/_components/ReviewResponsePanel.tsx:56:301
src/app/reputation/_components/ReviewToRevenueChart.tsx:66:172
src/app/reputation/_components/SentimentChart.tsx:67:92
src/app/reputation/_components/WidgetConfigurator.tsx:50:319
src/app/reputation/_components/useReputationDashboardData.ts:73:136
src/app/reputation/nps/[token]/page.tsx:107:310
src/app/settings/_components/IntegrationsTab.tsx:20:274
src/app/settings/_components/MapsDataSection.tsx:14:117
src/app/settings/_components/ProfileTab.tsx:18:81
src/app/settings/marketplace/MarketplaceListingPlans.tsx:151:107
src/app/settings/marketplace/MarketplaceListingPlans.tsx:94:285
src/app/settings/marketplace/page.tsx:16:412
src/app/settings/marketplace/useMarketplacePresence.ts:96:157
src/app/settings/page.tsx:29:181
src/app/settings/team/page.tsx:26:170
src/app/settings/team/useTeamMembers.ts:26:125
src/app/share/[token]/ShareTemplateRenderer.tsx:26:103
src/app/share/[token]/page.tsx:12:108
src/app/social/_components/AiTab.tsx:55:352
src/app/social/_components/BackgroundPicker.tsx:24:172
src/app/social/_components/BulkExporter.tsx:124:302
src/app/social/_components/CaptionEngine.tsx:177:195
src/app/social/_components/CarouselBuilder.tsx:24:166
src/app/social/_components/ContentBar.tsx:96:451
src/app/social/_components/GallerySlotPicker.tsx:29:175
src/app/social/_components/MagicPrompter.tsx:14:106
src/app/social/_components/MediaLibrary.tsx:34:239
src/app/social/_components/PlatformStatusBar.tsx:19:137
src/app/social/_components/PostHistory.tsx:132:102
src/app/social/_components/PostHistory.tsx:40:199
src/app/social/_components/PosterExtractor.tsx:23:112
src/app/social/_components/PublishKitDrawer.tsx:22:347
src/app/social/_components/ReviewsToInsta.tsx:131:360
src/app/social/_components/SocialAnalytics.tsx:48:208
src/app/social/_components/SocialStudioClient.tsx:45:492
src/app/social/_components/StockTab.tsx:36:223
src/app/social/_components/TemplateEditor.tsx:45:513
src/app/social/_components/TemplateGallery.tsx:32:291
src/app/social/_components/TripImporter.tsx:146:89
src/app/social/_components/TripImporter.tsx:86:294
src/app/social/_components/canvas/CanvasEditorPanel.tsx:39:227
src/app/social/_components/canvas/CanvasMode.tsx:20:258
src/app/social/_components/canvas/CanvasPreviewPane.tsx:32:119
src/app/social/_components/canvas/CanvasPublishModal.tsx:40:264
src/app/social/_components/template-gallery/PreviewPanel.tsx:23:102
src/app/social/_components/template-gallery/TemplateGrid.tsx:162:225
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
src/components/CreateTripModal.tsx:318:104
src/components/CreateTripModal.tsx:64:723
src/components/CurrencyConverter.tsx:54:263
src/components/InteractivePricing.tsx:11:111
src/components/ItineraryBuilder.tsx:119:195
src/components/NotificationSettings.tsx:21:259
src/components/ShareTripModal.tsx:29:199
src/components/ShareTripModal.tsx:44:98
src/components/TemplateAnalytics.tsx:18:168
src/components/VersionDiff.tsx:93:141
src/components/WeatherWidget.tsx:43:119
src/components/admin/ConvertProposalModal.tsx:18:108
src/components/admin/ProposalAddOnsManager.tsx:348:90
src/components/admin/ProposalAddOnsManager.tsx:63:462
src/components/analytics/RevenueChart.tsx:51:118
src/components/assistant/ConversationHistory.tsx:45:225
src/components/assistant/TourAssistantChat.tsx:13:392
src/components/assistant/TourAssistantChat.tsx:145:167
src/components/assistant/TourAssistantPresentation.tsx:188:260
src/components/assistant/TourAssistantPresentation.tsx:60:612
src/components/assistant/UsageDashboard.tsx:34:152
src/components/billing/PricingCard.tsx:39:129
src/components/billing/UpgradeModal.tsx:80:167
src/components/bookings/FlightSearch.tsx:309:88
src/components/bookings/FlightSearch.tsx:63:338
src/components/bookings/HotelSearch.tsx:40:193
src/components/bookings/LocationAutocomplete.tsx:28:211
src/components/client/ProposalAddOnsSelector.tsx:49:309
src/components/dashboard/ActionQueue.tsx:119:103
src/components/dashboard/ActionQueuePanels.tsx:39:101
src/components/dashboard/InlineActionPanel.tsx:96:90
src/components/dashboard/KPICard.tsx:57:94
src/components/dashboard/NotificationBell.tsx:48:170
src/components/dashboard/RevenueKPICard.tsx:32:195
src/components/dashboard/TaskRow.tsx:35:126
src/components/dashboard/TodaysTimeline.tsx:135:122
src/components/dashboard/TodaysTimeline.tsx:283:111
src/components/dashboard/WhatsAppDashboardPreview.tsx:128:94
src/components/demo/DemoModeBanner.tsx:17:89
src/components/demo/DemoTour.tsx:86:248
src/components/demo/WelcomeModal.tsx:14:155
src/components/forms/SearchableCreatableMultiSelect.tsx:24:152
src/components/glass/GlassModal.tsx:30:181
src/components/glass/QuickQuoteModal.tsx:109:95
src/components/glass/QuickQuoteModal.tsx:224:503
src/components/god-mode/DrillDownTable.tsx:37:149
src/components/god-mode/TrendChart.tsx:42:101
src/components/import/ImportPreview.tsx:149:82
src/components/import/ImportPreview.tsx:14:239
src/components/india/GSTInvoice.tsx:230:145
src/components/india/GSTInvoice.tsx:68:159
src/components/india/UPIPaymentModal.tsx:234:270
src/components/india/UPIPaymentModal.tsx:43:83
src/components/itinerary-templates/BentoJourneyView.tsx:138:100
src/components/itinerary-templates/BentoJourneyView.tsx:8:255
src/components/itinerary-templates/LuxuryResortView.tsx:8:226
src/components/itinerary-templates/ProfessionalView.tsx:136:150
src/components/itinerary-templates/ProfessionalView.tsx:7:327
src/components/itinerary-templates/SafariStoryView.tsx:173:114
src/components/itinerary-templates/SafariStoryView.tsx:8:311
src/components/itinerary-templates/UrbanBriefView.tsx:154:123
src/components/itinerary-templates/UrbanBriefView.tsx:184:89
src/components/itinerary-templates/UrbanBriefView.tsx:6:317
src/components/itinerary-templates/VisualJourneyView.tsx:151:114
src/components/itinerary-templates/VisualJourneyView.tsx:8:284
src/components/itinerary/ProfessionalItineraryView.tsx:283:84
src/components/itinerary/ProfessionalItineraryView.tsx:31:167
src/components/layout/CommandPalette.tsx:22:160
src/components/layout/FloatingActionButton.tsx:23:187
src/components/layout/MobileNav.tsx:119:194
src/components/layout/NavHeader.tsx:15:242
src/components/layout/Sidebar.tsx:142:91
src/components/layout/Sidebar.tsx:234:262
src/components/layout/TopBar.tsx:39:95
src/components/layout/useNavCounts.ts:21:94
src/components/layout/useNavCounts.ts:26:86
src/components/leads/LeadToBookingFlow.tsx:169:129
src/components/leads/LeadToBookingFlow.tsx:299:113
src/components/leads/LeadToBookingFlow.tsx:413:178
src/components/leads/LeadToBookingFlow.tsx:594:155
src/components/leads/SmartLeadCard.tsx:49:96
src/components/map/ItineraryMap.tsx:233:166
src/components/marketing/CardSwap.tsx:116:101
src/components/marketing/CardSwap.tsx:78:166
src/components/marketing/ExitIntentPopup.tsx:8:82
src/components/marketing/Footer.tsx:8:107
src/components/marketing/ForceFieldBackground.tsx:7:95
src/components/marketing/HeroScreens.tsx:29:141
src/components/marketing/IndiaMap.tsx:19:126
src/components/marketing/InteractiveDemo.tsx:7:256
src/components/marketing/LeadMagnet.tsx:8:160
src/components/marketing/LeadMagnetSection.tsx:8:131
src/components/marketing/LiveChat.tsx:8:90
src/components/marketing/Navbar.tsx:19:209
src/components/marketing/ROICalculator.tsx:7:92
src/components/marketing/ShinyText.tsx:20:111
src/components/marketing/sections/BeforeAfterSection.tsx:23:87
src/components/marketing/sections/FeaturesProposals.tsx:13:149
src/components/marketing/sections/FeaturesShowcase.tsx:19:153
src/components/marketing/sections/FeaturesShowcase.tsx:306:91
src/components/marketing/sections/FeaturesShowcase.tsx:399:98
src/components/marketing/sections/HeroSection.tsx:25:144
src/components/marketing/sections/LivePulseSection.tsx:9:117
src/components/marketing/sections/ProposalPreviewSection.tsx:42:151
src/components/payments/PaymentLinkButton.tsx:38:233
src/components/payments/PaymentTracker.tsx:58:256
src/components/payments/RazorpayModal.tsx:133:102
src/components/payments/RazorpayModal.tsx:93:285
src/components/pdf/DownloadPDFButton.tsx:20:117
src/components/pdf/DownloadPDFButton.tsx:24:93
src/components/pdf/InvoiceDocument.tsx:106:107
src/components/pdf/InvoiceDocument.tsx:231:216
src/components/pdf/OperatorScorecardDocument.tsx:133:106
src/components/pdf/PDFDownloadButton.tsx:25:81
src/components/pdf/ProposalDocument.tsx:312:245
src/components/pdf/ProposalPDFButton.tsx:23:206
src/components/pdf/templates/ItineraryTemplatePages.tsx:368:182
src/components/pdf/templates/ItineraryTemplatePages.tsx:740:158
src/components/pdf/templates/ProfessionalTemplate.tsx:316:213
src/components/pdf/templates/ProfessionalTemplate.tsx:37:278
src/components/pdf/templates/ProfessionalTemplate.tsx:384:82
src/components/planner/ApprovalManager.tsx:51:600
src/components/planner/LogisticsManager.tsx:23:216
src/components/planner/PricingManager.tsx:22:188
src/components/portal/PortalItinerary.tsx:37:141
src/components/portal/PortalItinerary.tsx:49:126
src/components/portal/PortalPayment.tsx:29:217
src/components/portal/PortalReview.tsx:13:198
src/components/proposals/ESignature.tsx:33:315
src/components/settings/InviteModal.tsx:42:248
src/components/settings/LanguageToggle.tsx:15:114
src/components/settings/TeamMemberCard.tsx:44:151
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
src/components/trips/GroupManagerModals.tsx:149:185
src/components/trips/GroupManagerModals.tsx:28:107
src/components/trips/TripTemplates.tsx:359:150
src/components/trips/TripTemplates.tsx:516:111
src/components/ui/AppImage.tsx:51:91
src/components/ui/map/map-controls.tsx:243:93
src/components/ui/map/map-controls.tsx:78:107
src/components/ui/map/map-core.tsx:118:188
src/components/ui/map/map-layers.tsx:177:273
src/components/ui/map/map-layers.tsx:203:86
src/components/ui/map/map-layers.tsx:31:117
src/components/ui/map/map-layers.tsx:348:91
src/components/ui/map/map-markers.tsx:55:122
src/components/ui/toast.tsx:60:103
src/components/whatsapp/AutomationRules.tsx:293:106
src/components/whatsapp/AutomationRules.tsx:400:137
src/components/whatsapp/AutomationRules.tsx:538:184
src/components/whatsapp/CannedResponses.tsx:113:237
src/components/whatsapp/ContextActionModal.tsx:185:134
src/components/whatsapp/ContextActionModal.tsx:322:106
src/components/whatsapp/ContextActionModal.tsx:441:129
src/components/whatsapp/ContextActionModal.tsx:607:85
src/components/whatsapp/ConversationListPanel.tsx:28:208
src/components/whatsapp/MessageThread.tsx:100:96
src/components/whatsapp/MessageThread.tsx:230:315
src/components/whatsapp/ThreadPane.tsx:42:153
src/components/whatsapp/UnifiedInbox.tsx:23:103
src/components/whatsapp/UnifiedInboxContextPanel.tsx:37:224
src/components/whatsapp/WhatsAppConnectModal.tsx:34:463
src/components/whatsapp/action-picker/ActionPickerModal.tsx:63:103
src/components/whatsapp/action-picker/DriverPicker.tsx:25:173
src/components/whatsapp/action-picker/ItineraryPicker.tsx:18:131
src/components/whatsapp/action-picker/LocationRequestPicker.tsx:20:181
src/components/whatsapp/action-picker/PaymentPicker.tsx:24:246
src/components/whatsapp/useInboxData.ts:271:90
src/components/whatsapp/useInboxData.ts:75:358
src/features/admin/analytics/AdminAnalyticsView.tsx:89:546
src/features/admin/analytics/useAdminAnalytics.ts:290:186
src/features/admin/analytics/useAdminAnalytics.ts:301:111
src/features/admin/analytics/useAdminAnalytics.ts:68:221
src/features/admin/billing/BillingModals.tsx:43:112
src/features/admin/billing/BillingPlanComparison.tsx:28:105
src/features/admin/billing/BillingPlanSection.tsx:65:184
src/features/admin/billing/BillingUpgradeSection.tsx:32:204
src/features/admin/billing/BillingView.tsx:33:171
src/features/admin/billing/useBillingData.ts:67:218
src/features/admin/billing/useBillingData.ts:83:86
src/features/admin/dashboard/DateRangePicker.tsx:28:154
src/features/admin/dashboard/FunnelWidget.tsx:19:82
src/features/admin/invoices/InvoiceCreateForm.tsx:213:85
src/features/admin/invoices/InvoiceCreateForm.tsx:40:334
src/features/admin/invoices/InvoiceListPanel.tsx:46:251
src/features/admin/invoices/InvoiceLivePreview.tsx:16:272
src/features/admin/invoices/helpers.ts:66:105
src/features/admin/invoices/useInvoiceDraft.ts:6:149
src/features/admin/pricing/components/MonthlyTripTable.tsx:134:93
src/features/admin/pricing/components/MonthlyTripTable.tsx:30:260
src/features/admin/pricing/components/OverheadExpensesCard.tsx:24:187
src/features/admin/pricing/components/PricingKpiCards.tsx:78:94
src/features/admin/pricing/components/TransactionDetailPanel.tsx:35:243
src/features/admin/pricing/components/TransactionLedger.tsx:43:259
src/features/admin/pricing/components/TripCostEditor.tsx:19:252
src/features/admin/pricing/useTripCosts.ts:7:82
src/features/admin/revenue/AdminRevenueView.tsx:112:683
src/features/admin/revenue/useAdminRevenue.ts:84:204
src/features/admin/revenue/useAdminRevenue.ts:97:164
src/features/calendar/AddEventModal.tsx:82:205
src/features/calendar/BlockDatesModal.tsx:23:245
src/features/calendar/CalendarCommandCenter.tsx:33:261
src/features/calendar/CalendarHeader.tsx:57:111
src/features/calendar/DayCell.tsx:26:101
src/features/calendar/DayDrawer.tsx:21:157
src/features/calendar/DayView.tsx:40:231
src/features/calendar/EventDetailModal.tsx:23:118
src/features/calendar/TimeGridEvent.tsx:19:98
src/features/calendar/WeekTimeGrid.tsx:139:88
src/features/calendar/WeekTimeGrid.tsx:34:218
src/features/calendar/WeekView.tsx:27:115
src/features/calendar/details/PersonalEventDetail.tsx:29:97
src/features/calendar/useCalendarActions.ts:87:305
src/features/calendar/utils.ts:188:83
src/features/trip-detail/TripDetailHeader.tsx:85:105
src/features/trip-detail/components/TripActivityList.tsx:40:89
src/features/trip-detail/components/TripAddOnsEditor.tsx:189:90
src/features/trip-detail/components/TripDriverCard.tsx:25:104
src/features/trip-detail/components/TripInvoiceSection.tsx:103:105
src/features/trip-detail/components/TripNotificationHistory.tsx:88:115
src/features/trip-detail/components/TripStatusSidebar.tsx:90:103
src/features/trip-detail/tabs/ClientCommsTab.tsx:87:118
src/features/trip-detail/tabs/FinancialsTab.tsx:237:203
src/features/trip-detail/tabs/FinancialsTab.tsx:458:87
src/hooks/useRealtimeProposal.ts:43:121
src/hooks/useRealtimeProposal.ts:66:95
src/hooks/useRealtimeUpdates.ts:120:127
src/hooks/useRealtimeUpdates.ts:153:85
src/hooks/useUserTimezone.ts:12:90
src/lib/admin/action-queue.ts:36:126
src/lib/ai/cost-guardrails.ts:26:91
src/lib/ai/upsell-engine.ts:167:138
src/lib/assistant/actions/reads/clients.ts:116:95
src/lib/assistant/actions/reads/clients.ts:234:144
src/lib/assistant/actions/reads/clients.ts:401:135
src/lib/assistant/actions/reads/dashboard.ts:187:120
src/lib/assistant/actions/reads/dashboard.ts:331:104
src/lib/assistant/actions/reads/dashboard.ts:78:93
src/lib/assistant/actions/reads/drivers.ts:160:121
src/lib/assistant/actions/reads/invoices.ts:121:121
src/lib/assistant/actions/reads/invoices.ts:265:183
src/lib/assistant/actions/reads/invoices.ts:470:116
src/lib/assistant/actions/reads/proposals.ts:149:116
src/lib/assistant/actions/reads/proposals.ts:288:86
src/lib/assistant/actions/reads/reports.ts:131:189
src/lib/assistant/actions/reads/trips.ts:220:140
src/lib/assistant/actions/reads/trips.ts:382:126
src/lib/assistant/actions/reads/trips.ts:76:121
src/lib/assistant/actions/writes/clients.ts:176:89
src/lib/assistant/actions/writes/clients.ts:292:82
src/lib/assistant/actions/writes/clients.ts:52:98
src/lib/assistant/actions/writes/invoices.ts:194:140
src/lib/assistant/actions/writes/invoices.ts:48:119
src/lib/assistant/actions/writes/notifications.ts:212:140
src/lib/assistant/actions/writes/notifications.ts:87:93
src/lib/assistant/actions/writes/proposals.ts:193:121
src/lib/assistant/actions/writes/proposals.ts:83:88
src/lib/assistant/actions/writes/trips.ts:148:107
src/lib/assistant/actions/writes/trips.ts:38:84
src/lib/assistant/alerts.ts:250:92
src/lib/assistant/alerts.ts:80:114
src/lib/assistant/anomaly-detector.ts:174:95
src/lib/assistant/channel-adapters/whatsapp.ts:170:127
src/lib/assistant/orchestrator.ts:256:128
src/lib/assistant/orchestrator.ts:420:228
src/lib/assistant/weekly-digest.ts:75:113
src/lib/auth/admin.ts:162:115
src/lib/billing/outcome-upgrade.ts:80:93
src/lib/cost/spend-guardrails.ts:270:114
src/lib/import/pdf-extractor.ts:26:122
src/lib/import/url-scraper.ts:57:111
src/lib/india/gst.ts:168:130
src/lib/india/pricing.ts:102:114
src/lib/notification-templates.ts:163:113
src/lib/notification-templates.ts:65:97
src/lib/notifications/browser-push.ts:123:93
src/lib/payments/customer-service.ts:11:96
src/lib/payments/errors.ts:58:82
src/lib/payments/invoice-service.ts:156:130
src/lib/payments/invoice-service.ts:31:121
src/lib/payments/payment-links.server.ts:321:88
src/lib/payments/subscription-service.ts:176:86
src/lib/payments/subscription-service.ts:325:83
src/lib/payments/subscription-service.ts:54:118
src/lib/payments/webhook-handlers.ts:129:104
src/lib/payments/webhook-handlers.ts:26:99
src/lib/pdf-extractor.ts:88:176
src/lib/pdf/proposal-pdf.tsx:287:154
src/lib/pdf/proposal-pdf.tsx:337:87
src/lib/rag-itinerary.ts:147:115
src/lib/reputation/campaign-trigger.ts:49:195
src/lib/security/cost-endpoint-guard.ts:146:235
src/lib/shared-itinerary-cache.ts:150:107
src/lib/social/ai-prompts.ts:278:93
src/lib/social/poster-composer.ts:198:178
src/lib/social/poster-premium-layouts-a.ts:13:191
src/lib/social/poster-premium-layouts-a.ts:209:91
src/lib/social/poster-premium-layouts-a.ts:305:151
src/lib/social/poster-premium-layouts-b.ts:13:81
src/lib/social/poster-premium-layouts-b.ts:167:96
src/lib/social/poster-standard-blocks.ts:113:160
src/lib/whatsapp/chatbot-flow.ts:415:117

NESTING_DEPTH_BREACHES
src/app/(superadmin)/god/costs/org/[orgId]/page.tsx:44:depth=5
src/app/(superadmin)/god/layout.tsx:21:depth=5
src/app/(superadmin)/god/layout.tsx:25:depth=5
src/app/(superadmin)/god/layout.tsx:31:depth=5
src/app/admin/activity/page.tsx:91:depth=5
src/app/admin/cost/_components/AlertsList.tsx:62:depth=5
src/app/admin/cost/_components/AlertsList.tsx:66:depth=5
src/app/admin/insights/page.tsx:111:depth=5
src/app/admin/insights/page.tsx:122:depth=5
src/app/admin/insights/page.tsx:123:depth=6
src/app/admin/insights/page.tsx:128:depth=5
src/app/admin/insights/page.tsx:129:depth=5
src/app/admin/insights/page.tsx:130:depth=5
src/app/admin/insights/page.tsx:131:depth=5
src/app/admin/insights/page.tsx:132:depth=5
src/app/admin/insights/page.tsx:133:depth=5
src/app/admin/insights/page.tsx:134:depth=5
src/app/admin/insights/page.tsx:135:depth=5
src/app/admin/insights/page.tsx:149:depth=5
src/app/admin/insights/page.tsx:150:depth=5
src/app/admin/insights/page.tsx:152:depth=5
src/app/admin/invoices/page.tsx:170:depth=5
src/app/admin/invoices/page.tsx:174:depth=5
src/app/admin/invoices/page.tsx:394:depth=6
src/app/admin/invoices/page.tsx:93:depth=5
src/app/admin/kanban/page.tsx:131:depth=5
src/app/admin/kanban/page.tsx:139:depth=5
src/app/admin/kanban/page.tsx:385:depth=5
src/app/admin/kanban/page.tsx:386:depth=5
src/app/admin/kanban/page.tsx:387:depth=5
src/app/admin/page.tsx:158:depth=5
src/app/admin/page.tsx:170:depth=5
src/app/admin/page.tsx:187:depth=5
src/app/admin/page.tsx:201:depth=5
src/app/admin/page.tsx:207:depth=5
src/app/admin/page.tsx:209:depth=5
src/app/admin/page.tsx:214:depth=5
src/app/admin/page.tsx:222:depth=5
src/app/admin/page.tsx:230:depth=5
src/app/admin/page.tsx:258:depth=5
src/app/admin/page.tsx:264:depth=5
src/app/admin/page.tsx:313:depth=5
src/app/admin/page.tsx:316:depth=5
src/app/admin/page.tsx:318:depth=5
src/app/admin/page.tsx:334:depth=5
src/app/admin/settings/marketplace/page.tsx:147:depth=5
src/app/admin/settings/page.tsx:120:depth=5
src/app/admin/settings/page.tsx:364:depth=5
src/app/admin/support/page.tsx:146:depth=5
src/app/admin/support/page.tsx:147:depth=5
src/app/admin/support/page.tsx:200:depth=5
src/app/admin/support/page.tsx:206:depth=5
src/app/admin/support/page.tsx:208:depth=6
src/app/admin/support/page.tsx:209:depth=6
src/app/admin/templates/page.tsx:119:depth=5
src/app/admin/templates/page.tsx:133:depth=5
src/app/admin/templates/page.tsx:136:depth=5
src/app/admin/templates/page.tsx:138:depth=5
src/app/admin/templates/page.tsx:144:depth=5
src/app/admin/templates/page.tsx:146:depth=6
src/app/admin/tour-templates/[id]/edit/page.tsx:172:depth=6
src/app/admin/tour-templates/[id]/edit/page.tsx:267:depth=5
src/app/admin/tour-templates/[id]/edit/page.tsx:273:depth=5
src/app/admin/tour-templates/[id]/edit/page.tsx:291:depth=6
src/app/admin/tour-templates/[id]/edit/page.tsx:297:depth=5
src/app/admin/tour-templates/[id]/edit/page.tsx:310:depth=6
src/app/admin/tour-templates/[id]/page.tsx:132:depth=5
src/app/admin/tour-templates/[id]/page.tsx:143:depth=7
src/app/admin/tour-templates/create/page.tsx:275:depth=5
src/app/admin/tour-templates/create/page.tsx:281:depth=5
src/app/admin/tour-templates/create/page.tsx:299:depth=6
src/app/admin/tour-templates/create/page.tsx:305:depth=5
src/app/admin/tour-templates/create/page.tsx:318:depth=6
src/app/admin/tour-templates/import/page.tsx:213:depth=5
src/app/admin/tour-templates/import/page.tsx:216:depth=5
src/app/admin/tour-templates/import/page.tsx:231:depth=6
src/app/admin/tour-templates/import/page.tsx:235:depth=5
src/app/admin/tour-templates/import/page.tsx:245:depth=6
src/app/admin/tour-templates/import/page.tsx:75:depth=5
src/app/admin/tour-templates/page.tsx:108:depth=6
src/app/admin/trips/[id]/_components/utils.ts:149:depth=5
src/app/admin/trips/[id]/_components/utils.ts:155:depth=6
src/app/admin/trips/[id]/clone/page.tsx:62:depth=5
src/app/admin/trips/[id]/clone/page.tsx:70:depth=5
src/app/admin/trips/[id]/clone/page.tsx:78:depth=5
src/app/admin/trips/[id]/page.tsx:122:depth=5
src/app/admin/trips/[id]/page.tsx:136:depth=5
src/app/admin/trips/[id]/page.tsx:184:depth=6
src/app/admin/trips/[id]/page.tsx:365:depth=5
src/app/admin/trips/[id]/page.tsx:369:depth=5
src/app/admin/trips/[id]/page.tsx:379:depth=5
src/app/admin/trips/[id]/page.tsx:416:depth=5
src/app/admin/trips/[id]/page.tsx:426:depth=6
src/app/admin/trips/[id]/page.tsx:438:depth=5
src/app/admin/trips/[id]/page.tsx:448:depth=6
src/app/analytics/drill-through/page.tsx:107:depth=5
src/app/analytics/drill-through/page.tsx:115:depth=5
src/app/analytics/drill-through/page.tsx:138:depth=5
src/app/api/_handlers/admin/contacts/route.ts:240:depth=5
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:94:depth=5
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:96:depth=5
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:98:depth=5
src/app/api/_handlers/admin/insights/win-loss/route.ts:57:depth=5
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:237:depth=5
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:262:depth=5
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:279:depth=5
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:287:depth=5
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:291:depth=5
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:298:depth=5
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:400:depth=5
src/app/api/_handlers/admin/pricing/dashboard/route.ts:146:depth=5
src/app/api/_handlers/admin/pricing/transactions/route.ts:106:depth=5
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:106:depth=5
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:115:depth=5
src/app/api/_handlers/admin/trips/[id]/route.ts:266:depth=5
src/app/api/_handlers/admin/trips/[id]/route.ts:272:depth=6
src/app/api/_handlers/admin/trips/[id]/route.ts:280:depth=8
src/app/api/_handlers/admin/trips/[id]/route.ts:283:depth=8
src/app/api/_handlers/admin/trips/[id]/route.ts:291:depth=8
src/app/api/_handlers/admin/trips/[id]/route.ts:296:depth=7
src/app/api/_handlers/admin/whatsapp/health/route.ts:205:depth=5
src/app/api/_handlers/admin/whatsapp/health/route.ts:206:depth=5
src/app/api/_handlers/assistant/chat/stream/route.ts:244:depth=5
src/app/api/_handlers/assistant/chat/stream/route.ts:421:depth=5
src/app/api/_handlers/assistant/chat/stream/route.ts:479:depth=5
src/app/api/_handlers/assistant/chat/stream/route.ts:482:depth=6
src/app/api/_handlers/assistant/chat/stream/route.ts:489:depth=6
src/app/api/_handlers/assistant/chat/stream/route.ts:514:depth=5
src/app/api/_handlers/assistant/chat/stream/route.ts:518:depth=5
src/app/api/_handlers/assistant/chat/stream/route.ts:670:depth=5
src/app/api/_handlers/bookings/hotels/search/route.ts:122:depth=5
src/app/api/_handlers/bookings/hotels/search/route.ts:127:depth=6
src/app/api/_handlers/bookings/hotels/search/route.ts:128:depth=6
src/app/api/_handlers/drivers/search/route.ts:108:depth=5
src/app/api/_handlers/drivers/search/route.ts:109:depth=5
src/app/api/_handlers/drivers/search/route.ts:112:depth=5
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:121:depth=5
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:125:depth=5
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:134:depth=5
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:138:depth=6
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:148:depth=5
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:155:depth=5
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:159:depth=5
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:168:depth=5
src/app/api/_handlers/itineraries/route.ts:104:depth=5
src/app/api/_handlers/itineraries/route.ts:105:depth=6
src/app/api/_handlers/itineraries/route.ts:122:depth=5
src/app/api/_handlers/itineraries/route.ts:77:depth=5
src/app/api/_handlers/itineraries/route.ts:78:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:187:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:199:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:205:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:294:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:307:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:307:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:307:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:333:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:340:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:340:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:340:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:343:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:377:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:377:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:377:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:399:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:418:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:420:depth=7
src/app/api/_handlers/itinerary/generate/route.ts:437:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:437:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:437:depth=6
src/app/api/_handlers/itinerary/generate/route.ts:575:depth=5
src/app/api/_handlers/itinerary/generate/route.ts:693:depth=5
src/app/api/_handlers/marketplace/route.ts:314:depth=5
src/app/api/_handlers/marketplace/route.ts:410:depth=5
src/app/api/_handlers/marketplace/route.ts:411:depth=6
src/app/api/_handlers/marketplace/route.ts:414:depth=5
src/app/api/_handlers/marketplace/route.ts:415:depth=6
src/app/api/_handlers/marketplace/route.ts:418:depth=5
src/app/api/_handlers/marketplace/route.ts:423:depth=5
src/app/api/_handlers/marketplace/route.ts:428:depth=5
src/app/api/_handlers/marketplace/route.ts:433:depth=5
src/app/api/_handlers/marketplace/route.ts:438:depth=5
src/app/api/_handlers/marketplace/route.ts:439:depth=5
src/app/api/_handlers/marketplace/route.ts:440:depth=5
src/app/api/_handlers/marketplace/route.ts:444:depth=5
src/app/api/_handlers/notifications/schedule-followups/route.ts:156:depth=5
src/app/api/_handlers/onboarding/setup/route.ts:393:depth=5
src/app/api/_handlers/onboarding/setup/route.ts:404:depth=5
src/app/api/_handlers/onboarding/setup/route.ts:411:depth=5
src/app/api/_handlers/portal/[token]/route.ts:258:depth=5
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:503:depth=5
src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts:534:depth=5
src/app/api/_handlers/proposals/public/[token]/route.ts:269:depth=5
src/app/api/_handlers/proposals/public/[token]/route.ts:345:depth=5
src/app/api/_handlers/proposals/public/[token]/route.ts:352:depth=6
src/app/api/_handlers/proposals/public/[token]/route.ts:357:depth=5
src/app/api/_handlers/proposals/public/[token]/route.ts:364:depth=6
src/app/api/_handlers/proposals/public/[token]/route.ts:377:depth=5
src/app/api/_handlers/proposals/public/[token]/route.ts:381:depth=6
src/app/api/_handlers/proposals/public/[token]/route.ts:400:depth=7
src/app/api/_handlers/proposals/public/[token]/route.ts:407:depth=8
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:158:depth=5
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:165:depth=5
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:174:depth=5
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:194:depth=5
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:104:depth=5
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:112:depth=6
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:146:depth=5
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:155:depth=5
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:176:depth=6
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:95:depth=5
src/app/api/_handlers/reputation/sync/route.ts:215:depth=5
src/app/api/_handlers/reputation/sync/route.ts:219:depth=5
src/app/api/_handlers/reputation/sync/route.ts:227:depth=5
src/app/api/_handlers/reputation/sync/route.ts:237:depth=6
src/app/api/_handlers/reputation/sync/route.ts:248:depth=5
src/app/api/_handlers/reputation/sync/route.ts:250:depth=6
src/app/api/_handlers/reputation/sync/route.ts:254:depth=6
src/app/api/_handlers/reputation/sync/route.ts:279:depth=6
src/app/api/_handlers/reputation/sync/route.ts:285:depth=6
src/app/api/_handlers/reputation/sync/route.ts:292:depth=7
src/app/api/_handlers/reputation/sync/route.ts:307:depth=6
src/app/api/_handlers/reputation/sync/route.ts:320:depth=5
src/app/api/_handlers/social/process-queue/route.ts:105:depth=5
src/app/api/_handlers/social/process-queue/route.ts:121:depth=5
src/app/api/_handlers/social/process-queue/route.ts:143:depth=5
src/app/api/_handlers/social/process-queue/route.ts:148:depth=5
src/app/api/_handlers/social/process-queue/route.ts:155:depth=5
src/app/api/_handlers/social/process-queue/route.ts:166:depth=5
src/app/api/_handlers/social/refresh-tokens/route.ts:51:depth=5
src/app/api/_handlers/social/refresh-tokens/route.ts:66:depth=5
src/app/api/_handlers/social/refresh-tokens/route.ts:77:depth=5
src/app/api/_handlers/social/smart-poster/route.ts:91:depth=5
src/app/api/_handlers/social/smart-poster/route.ts:93:depth=5
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:92:depth=5
src/app/api/_handlers/trips/[id]/clone/route.ts:104:depth=5
src/app/api/_handlers/trips/[id]/route.ts:140:depth=5
src/app/api/_handlers/trips/[id]/route.ts:298:depth=5
src/app/api/_handlers/trips/[id]/route.ts:299:depth=6
src/app/api/_handlers/trips/[id]/route.ts:307:depth=8
src/app/api/_handlers/trips/[id]/route.ts:310:depth=8
src/app/api/_handlers/trips/[id]/route.ts:318:depth=8
src/app/api/_handlers/trips/[id]/route.ts:323:depth=7
src/app/api/_handlers/trips/route.ts:223:depth=5
src/app/api/_handlers/trips/route.ts:227:depth=5
src/app/api/_handlers/trips/route.ts:236:depth=5
src/app/api/_handlers/trips/route.ts:254:depth=5
src/app/api/_handlers/webhooks/whatsapp/route.ts:156:depth=5
src/app/api/_handlers/whatsapp/broadcast/route.ts:441:depth=5
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:117:depth=5
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:118:depth=5
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:89:depth=5
src/app/api/_handlers/whatsapp/webhook/route.ts:117:depth=5
src/app/api/_handlers/whatsapp/webhook/route.ts:122:depth=5
src/app/auth/page.tsx:48:depth=5
src/app/auth/page.tsx:59:depth=5
src/app/auth/page.tsx:63:depth=5
src/app/auth/page.tsx:65:depth=6
src/app/auth/page.tsx:71:depth=7
src/app/billing/BillingPageClient.tsx:237:depth=5
src/app/billing/BillingPageClient.tsx:252:depth=5
src/app/billing/BillingPageClient.tsx:260:depth=5
src/app/bookings/page.tsx:72:depth=5
src/app/bookings/page.tsx:77:depth=5
src/app/bookings/page.tsx:81:depth=5
src/app/clients/hooks/useClientForm.ts:97:depth=5
src/app/clients/hooks/useClientPipeline.ts:59:depth=5
src/app/clients/hooks/useClientPipeline.ts:61:depth=5
src/app/clients/hooks/useClientPipeline.ts:64:depth=5
src/app/clients/hooks/useClientPipeline.ts:68:depth=5
src/app/clients/hooks/useClientPipeline.ts:69:depth=5
src/app/drivers/page.tsx:247:depth=5
src/app/drivers/page.tsx:261:depth=5
src/app/drivers/page.tsx:339:depth=5
src/app/inbox/useBroadcastAudience.ts:68:depth=5
src/app/inbox/useBroadcastAudience.ts:72:depth=5
src/app/inbox/useBroadcastAudience.ts:83:depth=5
src/app/inbox/useBroadcastAudience.ts:89:depth=5
src/app/inbox/useBroadcastAudience.ts:91:depth=5
src/app/inbox/useBroadcastAudience.ts:94:depth=5
src/app/live/[token]/page.tsx:106:depth=5
src/app/live/[token]/page.tsx:112:depth=5
src/app/live/[token]/page.tsx:113:depth=5
src/app/live/[token]/page.tsx:114:depth=5
src/app/marketplace/[id]/page.tsx:125:depth=5
src/app/onboarding/page.tsx:231:depth=5
src/app/onboarding/page.tsx:276:depth=5
src/app/onboarding/page.tsx:285:depth=5
src/app/p/[token]/page.tsx:77:depth=5
src/app/p/[token]/page.tsx:98:depth=5
src/app/pay/[token]/PaymentCheckoutClient.tsx:114:depth=6
src/app/pay/[token]/PaymentCheckoutClient.tsx:123:depth=6
src/app/pay/[token]/PaymentCheckoutClient.tsx:96:depth=5
src/app/planner/SaveItineraryButton.tsx:127:depth=5
src/app/planner/SaveItineraryButton.tsx:78:depth=5
src/app/planner/SaveItineraryButton.tsx:86:depth=6
src/app/planner/page.tsx:151:depth=5
src/app/planner/page.tsx:160:depth=5
src/app/planner/page.tsx:162:depth=6
src/app/planner/page.tsx:163:depth=7
src/app/planner/page.tsx:164:depth=7
src/app/planner/page.tsx:165:depth=8
src/app/planner/page.tsx:168:depth=9
src/app/portal/[token]/page.tsx:106:depth=5
src/app/portal/[token]/page.tsx:107:depth=6
src/app/portal/[token]/page.tsx:114:depth=5
src/app/portal/[token]/page.tsx:119:depth=5
src/app/portal/[token]/page.tsx:125:depth=5
src/app/proposals/create/_hooks/useCreateProposal.ts:138:depth=5
src/app/proposals/create/_hooks/useCreateProposal.ts:142:depth=6
src/app/proposals/create/_hooks/useCreateProposal.ts:144:depth=6
src/app/proposals/create/_hooks/useCreateProposal.ts:149:depth=6
src/app/proposals/create/_hooks/useCreateProposal.ts:160:depth=5
src/app/proposals/create/_hooks/useCreateProposal.ts:164:depth=5
src/app/proposals/create/_hooks/useCreateProposal.ts:169:depth=5
src/app/proposals/create/_hooks/useCreateProposal.ts:188:depth=5
src/app/proposals/create/_hooks/useProposalData.ts:123:depth=5
src/app/proposals/create/_hooks/useProposalData.ts:152:depth=5
src/app/proposals/create/_hooks/useProposalData.ts:154:depth=6
src/app/reputation/nps/[token]/page.tsx:125:depth=5
src/app/reputation/nps/[token]/page.tsx:127:depth=5
src/app/reputation/nps/[token]/page.tsx:138:depth=5
src/app/settings/_components/IntegrationsTab.tsx:66:depth=5
src/app/settings/marketplace/MarketplaceListingPlans.tsx:198:depth=5
src/app/settings/marketplace/MarketplaceListingPlans.tsx:214:depth=6
src/app/settings/marketplace/MarketplaceListingPlans.tsx:232:depth=6
src/app/settings/marketplace/useMarketplacePresence.ts:145:depth=5
src/app/settings/marketplace/useMarketplacePresence.ts:149:depth=5
src/app/settings/marketplace/useMarketplacePresence.ts:159:depth=5
src/app/settings/marketplace/useMarketplacePresence.ts:166:depth=5
src/app/settings/marketplace/useMarketplacePresence.ts:178:depth=5
src/app/settings/marketplace/useMarketplacePresence.ts:180:depth=5
src/app/settings/marketplace/useMarketplacePresence.ts:183:depth=5
src/app/settings/team/useTeamMembers.ts:50:depth=5
src/app/settings/team/useTeamMembers.ts:54:depth=5
src/app/settings/team/useTeamMembers.ts:62:depth=5
src/app/settings/team/useTeamMembers.ts:64:depth=5
src/app/settings/team/useTeamMembers.ts:67:depth=5
src/app/social/_components/BulkExporter.tsx:154:depth=5
src/app/social/_components/BulkExporter.tsx:171:depth=5
src/app/social/_components/BulkExporter.tsx:218:depth=5
src/app/social/_components/ContentBar.tsx:121:depth=5
src/app/social/_components/PlatformStatusBar.tsx:30:depth=5
src/app/social/_components/PlatformStatusBar.tsx:31:depth=5
src/app/social/_components/PublishKitDrawer.tsx:69:depth=5
src/app/social/_components/ReviewsToInsta.tsx:156:depth=5
src/app/social/_components/ReviewsToInsta.tsx:157:depth=6
src/app/social/_components/ReviewsToInsta.tsx:158:depth=7
src/app/social/_components/ReviewsToInsta.tsx:167:depth=7
src/app/social/_components/ReviewsToInsta.tsx:177:depth=5
src/app/social/_components/ReviewsToInsta.tsx:178:depth=6
src/app/social/_components/ReviewsToInsta.tsx:179:depth=7
src/app/social/_components/ReviewsToInsta.tsx:181:depth=7
src/app/social/_components/ReviewsToInsta.tsx:198:depth=5
src/app/social/_components/ReviewsToInsta.tsx:206:depth=5
src/app/social/_components/SocialAnalytics.tsx:67:depth=5
src/app/social/_components/SocialAnalytics.tsx:68:depth=5
src/app/social/_components/TripImporter.tsx:175:depth=5
src/app/social/_components/TripImporter.tsx:186:depth=6
src/app/social/_components/TripImporter.tsx:188:depth=7
src/app/social/_components/TripImporter.tsx:193:depth=8
src/app/social/_components/TripImporter.tsx:200:depth=6
src/app/social/_components/TripImporter.tsx:205:depth=6
src/app/social/_components/TripImporter.tsx:212:depth=7
src/app/social/_components/TripImporter.tsx:213:depth=8
src/app/social/_components/TripImporter.tsx:216:depth=8
src/app/social/_components/TripImporter.tsx:219:depth=8
src/app/social/_components/canvas/CanvasPublishModal.tsx:104:depth=5
src/app/trips/TripCardGrid.tsx:32:depth=5
src/app/trips/utils.ts:120:depth=5
src/app/trips/utils.ts:121:depth=5
src/app/trips/utils.ts:125:depth=6
src/app/trips/utils.ts:129:depth=5
src/components/CreateTripModal.tsx:353:depth=5
src/components/CreateTripModal.tsx:357:depth=6
src/components/CreateTripModal.tsx:359:depth=6
src/components/CreateTripModal.tsx:389:depth=5
src/components/ShareTripModal.tsx:108:depth=5
src/components/ShareTripModal.tsx:115:depth=6
src/components/ShareTripModal.tsx:72:depth=5
src/components/ShareTripModal.tsx:76:depth=5
src/components/ShareTripModal.tsx:77:depth=6
src/components/WeatherWidget.tsx:61:depth=5
src/components/WeatherWidget.tsx:68:depth=5
src/components/WeatherWidget.tsx:71:depth=5
src/components/assistant/TourAssistantChat.tsx:188:depth=5
src/components/assistant/TourAssistantChat.tsx:193:depth=5
src/components/assistant/TourAssistantChat.tsx:203:depth=5
src/components/assistant/TourAssistantChat.tsx:209:depth=5
src/components/assistant/TourAssistantChat.tsx:212:depth=6
src/components/assistant/TourAssistantChat.tsx:216:depth=6
src/components/assistant/TourAssistantChat.tsx:222:depth=6
src/components/assistant/TourAssistantChat.tsx:230:depth=7
src/components/assistant/TourAssistantChat.tsx:240:depth=7
src/components/assistant/TourAssistantChat.tsx:258:depth=7
src/components/assistant/TourAssistantChat.tsx:266:depth=7
src/components/assistant/TourAssistantChat.tsx:269:depth=8
src/components/assistant/TourAssistantChat.tsx:284:depth=7
src/components/assistant/TourAssistantChat.tsx:287:depth=8
src/components/assistant/UsageDashboard.tsx:44:depth=5
src/components/bookings/LocationAutocomplete.tsx:141:depth=5
src/components/bookings/LocationAutocomplete.tsx:149:depth=5
src/components/bookings/LocationAutocomplete.tsx:80:depth=5
src/components/bookings/LocationAutocomplete.tsx:83:depth=5
src/components/bookings/LocationAutocomplete.tsx:86:depth=5
src/components/bookings/LocationAutocomplete.tsx:87:depth=5
src/components/dashboard/KPICard.tsx:82:depth=5
src/components/demo/DemoTour.tsx:146:depth=5
src/components/demo/WelcomeModal.tsx:37:depth=5
src/components/demo/WelcomeModal.tsx:39:depth=6
src/components/demo/WelcomeModal.tsx:42:depth=7
src/components/glass/GlassModal.tsx:105:depth=5
src/components/glass/GlassModal.tsx:110:depth=5
src/components/layout/CommandPalette.tsx:40:depth=5
src/components/layout/useNavCounts.ts:33:depth=5
src/components/layout/useNavCounts.ts:43:depth=5
src/components/layout/useNavCounts.ts:46:depth=5
src/components/layout/useNavCounts.ts:55:depth=5
src/components/leads/LeadToBookingFlow.tsx:461:depth=5
src/components/map/ItineraryMap.tsx:126:depth=5
src/components/map/ItineraryMap.tsx:131:depth=6
src/components/map/ItineraryMap.tsx:132:depth=6
src/components/marketing/CardSwap.tsx:142:depth=5
src/components/marketing/ExitIntentPopup.tsx:17:depth=5
src/components/marketing/HeroScreens.tsx:62:depth=6
src/components/marketing/ShinyText.tsx:66:depth=5
src/components/marketing/ShinyText.tsx:69:depth=5
src/components/marketing/ShinyText.tsx:74:depth=5
src/components/marketing/ShinyText.tsx:77:depth=5
src/components/marketing/ShinyText.tsx:86:depth=5
src/components/marketing/ShinyText.tsx:89:depth=5
src/components/payments/RazorpayModal.tsx:178:depth=5
src/components/payments/RazorpayModal.tsx:196:depth=6
src/components/payments/RazorpayModal.tsx:201:depth=6
src/components/payments/RazorpayModal.tsx:209:depth=6
src/components/payments/RazorpayModal.tsx:216:depth=6
src/components/pdf/DownloadPDFButton.tsx:55:depth=6
src/components/pdf/DownloadPDFButton.tsx:85:depth=5
src/components/pdf/DownloadPDFButton.tsx:92:depth=5
src/components/pdf/ProposalPDFButton.tsx:95:depth=6
src/components/pdf/itinerary-pdf.tsx:100:depth=5
src/components/planner/ApprovalManager.tsx:302:depth=6
src/components/planner/ApprovalManager.tsx:93:depth=5
src/components/planner/ApprovalManager.tsx:97:depth=5
src/components/planner/PricingManager.tsx:30:depth=5
src/components/trips/TripTemplates.tsx:530:depth=5
src/components/ui/map/map-core.tsx:204:depth=5
src/components/ui/map/map-layers.tsx:277:depth=5
src/components/ui/map/map-layers.tsx:279:depth=5
src/components/ui/map/map-layers.tsx:281:depth=5
src/components/ui/map/map-layers.tsx:282:depth=5
src/components/ui/map/map-layers.tsx:398:depth=5
src/components/ui/map/map-layers.tsx:77:depth=5
src/components/ui/map/map-layers.tsx:78:depth=5
src/components/ui/map/map-utils.ts:69:depth=5
src/components/whatsapp/ContextActionModal.tsx:470:depth=5
src/components/whatsapp/ContextActionModal.tsx:471:depth=5
src/components/whatsapp/ContextActionModal.tsx:476:depth=5
src/components/whatsapp/ContextActionModal.tsx:477:depth=5
src/components/whatsapp/ConversationListPanel.tsx:74:depth=5
src/components/whatsapp/ConversationListPanel.tsx:74:depth=5
src/components/whatsapp/WhatsAppConnectModal.tsx:131:depth=5
src/components/whatsapp/WhatsAppConnectModal.tsx:133:depth=5
src/components/whatsapp/WhatsAppConnectModal.tsx:135:depth=5
src/components/whatsapp/WhatsAppConnectModal.tsx:157:depth=5
src/components/whatsapp/WhatsAppConnectModal.tsx:160:depth=5
src/components/whatsapp/WhatsAppConnectModal.tsx:170:depth=5
src/components/whatsapp/useInboxData.ts:278:depth=5
src/features/admin/billing/useBillingData.ts:120:depth=5
src/features/admin/billing/useBillingData.ts:141:depth=6
src/features/admin/billing/useBillingData.ts:145:depth=7
src/features/admin/invoices/useInvoiceDraft.ts:22:depth=5
src/features/admin/pricing/components/TripCostEditor.tsx:39:depth=5
src/features/admin/pricing/components/TripCostEditor.tsx:40:depth=5
src/features/admin/pricing/components/TripCostEditor.tsx:41:depth=5
src/features/admin/pricing/components/TripCostEditor.tsx:42:depth=5
src/features/admin/pricing/components/TripCostEditor.tsx:43:depth=5
src/features/admin/pricing/components/TripCostEditor.tsx:44:depth=5
src/features/admin/pricing/components/TripCostEditor.tsx:45:depth=5
src/features/admin/revenue/useAdminRevenue.ts:158:depth=5
src/features/admin/revenue/useAdminRevenue.ts:182:depth=5
src/features/admin/revenue/useAdminRevenue.ts:186:depth=6
src/features/admin/revenue/useAdminRevenue.ts:190:depth=5
src/features/admin/revenue/useAdminRevenue.ts:201:depth=5
src/features/admin/revenue/useAdminRevenue.ts:207:depth=5
src/features/calendar/WeekView.tsx:50:depth=5
src/features/calendar/utils.ts:371:depth=5
src/features/calendar/utils.ts:375:depth=5
src/hooks/useRealtimeProposal.ts:111:depth=5
src/hooks/useRealtimeProposal.ts:135:depth=5
src/hooks/useRealtimeProposal.ts:139:depth=5
src/hooks/useRealtimeProposal.ts:141:depth=5
src/hooks/useRealtimeProposal.ts:84:depth=5
src/hooks/useRealtimeProposal.ts:85:depth=5
src/hooks/useRealtimeProposal.ts:87:depth=5
src/hooks/useRealtimeProposal.ts:91:depth=5
src/hooks/useRealtimeUpdates.ts:180:depth=5
src/hooks/useShortcuts.ts:28:depth=5
src/lib/admin/operator-scorecard.ts:285:depth=5
src/lib/admin/operator-scorecard.ts:287:depth=6
src/lib/admin/operator-scorecard.ts:289:depth=6
src/lib/assistant/actions/reads/clients.ts:493:depth=5
src/lib/assistant/actions/reads/clients.ts:508:depth=5
src/lib/assistant/actions/reads/dashboard.ts:255:depth=5
src/lib/assistant/actions/reads/invoices.ts:344:depth=5
src/lib/assistant/actions/reads/invoices.ts:346:depth=5
src/lib/assistant/actions/reads/invoices.ts:348:depth=5
src/lib/assistant/actions/reads/trips.ts:477:depth=5
src/lib/assistant/actions/reads/trips.ts:480:depth=6
src/lib/assistant/actions/reads/trips.ts:484:depth=6
src/lib/assistant/actions/reads/trips.ts:486:depth=6
src/lib/assistant/alerts.ts:105:depth=5
src/lib/assistant/alerts.ts:107:depth=5
src/lib/assistant/alerts.ts:324:depth=5
src/lib/assistant/alerts.ts:326:depth=6
src/lib/assistant/briefing.ts:264:depth=5
src/lib/assistant/conversation-store.ts:130:depth=5
src/lib/assistant/export.ts:129:depth=5
src/lib/assistant/weekly-digest.ts:358:depth=5
src/lib/image-search.ts:114:depth=5
src/lib/image-search.ts:119:depth=5
src/lib/image-search.ts:122:depth=6
src/lib/image-search.ts:57:depth=5
src/lib/image-search.ts:60:depth=6
src/lib/import/types.ts:75:depth=5
src/lib/import/types.ts:81:depth=5
src/lib/import/types.ts:85:depth=5
src/lib/payments/webhook-handlers.ts:167:depth=5
src/lib/payments/webhook-handlers.ts:177:depth=5
src/lib/payments/webhook-handlers.ts:183:depth=6
src/lib/pwa/offline-mutations.ts:206:depth=5
src/lib/queries/itineraries.ts:140:depth=5
src/lib/queries/itineraries.ts:143:depth=5
src/lib/reputation/campaign-trigger.ts:133:depth=5
src/lib/reputation/campaign-trigger.ts:199:depth=5
src/lib/reputation/campaign-trigger.ts:222:depth=5
src/lib/social/template-selector.ts:80:depth=5
src/lib/social/template-selector.ts:81:depth=6
src/lib/trips/conflict-detection.ts:250:depth=5
src/lib/whatsapp.server.ts:176:depth=5
src/lib/whatsapp.server.ts:179:depth=5
src/lib/whatsapp.server.ts:180:depth=5
src/lib/whatsapp.server.ts:181:depth=5
src/lib/whatsapp.server.ts:185:depth=5
src/lib/whatsapp.server.ts:194:depth=5
src/lib/whatsapp.server.ts:195:depth=5
src/lib/whatsapp.server.ts:233:depth=5
src/lib/whatsapp.server.ts:236:depth=5
src/lib/whatsapp.server.ts:237:depth=5
src/lib/whatsapp.server.ts:238:depth=5
src/lib/whatsapp.server.ts:240:depth=5
src/lib/whatsapp.server.ts:272:depth=5
src/lib/whatsapp.server.ts:275:depth=5
src/lib/whatsapp.server.ts:276:depth=5
src/lib/whatsapp.server.ts:277:depth=5
src/lib/whatsapp.server.ts:278:depth=5
src/lib/whatsapp.server.ts:280:depth=5
src/lib/whatsapp.server.ts:83:depth=5
```

## Explicit `any` Inventory

```text
src/app/api/_handlers/superadmin/monitoring/health/route.ts:20:any
src/app/proposals/create/_hooks/useProposalData.ts:7:any
src/app/sitemap.ts:56:any
src/components/CreateTripModal.tsx:44:any
src/components/god-mode/TrendChart.tsx:57:any
src/components/marketing/HeroScreens.tsx:42:any
src/components/marketing/SplineScene.tsx:18:any
src/lib/api-dispatch.ts:17:any
src/lib/social/poster-renderer-types.ts:6:any
```

## TypeScript Suppression Inventory

```text
```

## Non-Null Assertion Inventory

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
src/app/api/_handlers/availability/route.ts:52:adminResult.organizationId
src/app/api/_handlers/availability/route.ts:113:admin.organizationId
src/app/api/_handlers/availability/route.ts:169:admin.organizationId
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
src/app/api/_handlers/proposals/bulk/route.ts:33:organizationId
src/app/api/_handlers/proposals/bulk/route.ts:69:organizationId
src/app/api/_handlers/proposals/send-pdf/route.ts:68:auth.organizationId
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:166:r.response_posted_at
src/app/api/_handlers/reputation/dashboard/route.ts:143:auth.organizationId
src/app/api/_handlers/settings/marketplace/route.ts:93:organizationId
src/app/api/_handlers/settings/marketplace/route.ts:98:organizationId
src/app/api/_handlers/settings/marketplace/route.ts:115:organizationId
src/app/api/_handlers/settings/upi/route.ts:30:organizationId
src/app/api/_handlers/settings/upi/route.ts:60:organizationId
src/app/api/_handlers/subscriptions/cancel/route.ts:46:organizationId
src/app/api/_handlers/subscriptions/route.ts:141:auth.organizationId
src/app/api/_handlers/subscriptions/route.ts:177:organizationId
src/app/api/_handlers/subscriptions/route.ts:180:organizationId
src/app/api/_handlers/subscriptions/route.ts:211:organizationId
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
src/app/drivers/page.tsx:252:formData.full_name
src/app/drivers/page.tsx:253:formData.phone
src/app/inbox/BroadcastTab.tsx:224:TARGET_OPTIONS.find((t) => t.key === state.target)
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
src/features/admin/billing/BillingUpgradeSection.tsx:79:prompt.recommended_plan_id
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

## Loose Equality Inventory

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

## Type-Safety Counts

```text
explicit_any_count=9
ts_suppressions_count=0
non_null_assertion_count=162
loose_equality_count=48
```

## Missing Package Import Inventory

```text
src/components/marketing/ForceFieldBackground.tsx:4:@tsparticles/slim
```

## Security Candidate Scan Raw Output

```text
REQUIRE_HITS

DYNAMIC_IMPORT_NON_LITERAL_HEURISTIC

DANGEROUS_HTML
src/components/marketing/FAQ.tsx:52:                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
src/components/marketing/blog/BlogPost.tsx:107:        dangerouslySetInnerHTML={{ __html: htmlContent }}
src/components/marketing/seo/JsonLd.tsx:35:      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
src/components/marketing/seo/JsonLd.tsx:64:      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
src/components/marketing/seo/JsonLd.tsx:105:      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
src/components/marketing/seo/JsonLd.tsx:152:      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
src/components/marketing/seo/JsonLd.tsx:177:      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
src/components/marketing/seo/JsonLd.tsx:204:      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}

AUTH_AND_SERVICE_ROLE
src/lib/analytics/template-analytics.ts:47:    } = await supabase.auth.getUser();
src/lib/analytics/template-analytics.ts:86:    } = await supabase.auth.getUser();
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
src/app/api/_handlers/debug/route.ts:24:  const admin = await requireAdmin(req, { requireOrganization: false });
src/lib/whatsapp/chatbot-flow.ts:228:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:292:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:314:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:343:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:386:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:418:  const admin = createAdminClient();
src/lib/whatsapp/chatbot-flow.ts:541:  const admin = createAdminClient();
src/lib/reputation/referral-flywheel.ts:111:    const supabase = createAdminClient();
src/lib/reputation/referral-flywheel.ts:157:    const supabase = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:232:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:268:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:329:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:392:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:435:  const admin = createAdminClient();
src/lib/whatsapp/proposal-drafts.server.ts:475:  const admin = createAdminClient();
src/app/api/_handlers/cron/reputation-campaigns/route.ts:40:    const supabase = createAdminClient();
src/lib/notifications.ts:5:const supabaseAdmin = createAdminClient();
src/lib/notifications.ts:43:        const { error } = await supabaseAdmin.functions.invoke("send-notification", {
src/lib/notifications.ts:63:        await supabaseAdmin.from("notification_logs").insert({
src/lib/notifications.ts:96:        const { data: trip, error: tripError } = await supabaseAdmin
src/app/api/_handlers/cron/operator-scorecards/route.ts:13:      const admin = await requireAdmin(request, { requireOrganization: false });
src/lib/ai/cost-guardrails.ts:27:  const admin = createAdminClient();
src/lib/ai/cost-guardrails.ts:126:  const admin = createAdminClient();
src/app/api/_handlers/proposals/create/route.ts:54:    const admin = await requireAdmin(req);
src/lib/queries/analytics.ts:17:            const { data: { user } } = await supabase.auth.getUser();
src/lib/queries/proposals.ts:98:            const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/proposals/[id]/convert/route.ts:48:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/proposals/[id]/convert/route.ts:72:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/proposals/[id]/convert/route.ts:79:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/proposals/[id]/convert/route.ts:83:async function requireAdmin(req: Request) {
src/app/api/_handlers/proposals/[id]/convert/route.ts:89:    const { data: adminProfile } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/convert/route.ts:111:        const admin = await requireAdmin(req);
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
src/app/api/_handlers/proposals/[id]/send/route.ts:94:  const admin = await requireAdmin(request);
src/app/api/_handlers/proposals/[id]/send/route.ts:119:  const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/proposals/[id]/send/route.ts:120:  const { data: proposalData, error: proposalError } = await supabaseAdmin
src/app/api/_handlers/proposals/[id]/send/route.ts:233:  await supabaseAdmin
src/app/api/_handlers/proposals/[id]/send/route.ts:244:      supabase: supabaseAdmin,
src/app/api/_handlers/proposals/[id]/send/route.ts:252:  await supabaseAdmin.from("notification_logs").insert({
src/lib/admin/operator-scorecard.ts:503:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard.ts:554:  const admin = args.adminClient || createAdminClient();
src/app/api/_handlers/proposals/[id]/pdf/route.ts:103:    } = await supabase.auth.getUser();
src/app/api/_handlers/add-ons/stats/route.ts:39:    const { data: { user } } = await supabase.auth.getUser();
src/lib/admin/operator-scorecard-delivery.ts:50:  const admin = args.adminClient || createAdminClient();
src/lib/admin/operator-scorecard-delivery.ts:116:  const admin = createAdminClient();
src/lib/auth/admin.ts:145:    } = await adminClient.auth.getUser(token);
src/lib/auth/admin.ts:155:    } = await serverClient.auth.getUser();
src/lib/auth/admin.ts:162:export async function requireAdmin(
src/lib/auth/admin.ts:167:  const adminClient = createAdminClient();
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
src/app/api/_handlers/add-ons/[id]/route.ts:28:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/add-ons/[id]/route.ts:70:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/add-ons/[id]/route.ts:151:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/invoices/[id]/route.ts:61:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/[id]/route.ts:113:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/[id]/route.ts:237:    const auth = await requireAdmin(request, { requireOrganization: true });
src/lib/platform/audit.ts:24:    const adminClient = createAdminClient();
src/lib/platform/audit.ts:47:    const adminClient = createAdminClient();
src/app/api/_handlers/add-ons/route.ts:23:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/add-ons/route.ts:75:    const { data: { user } } = await supabase.auth.getUser();
src/lib/auth/require-super-admin.ts:23:  const result = await requireAdmin(request, { requireOrganization: false });
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
src/lib/payments/payment-utils.ts:30:  return context === 'admin' ? createAdminClient() : createClient();
src/app/api/_handlers/invoices/[id]/pay/route.ts:26:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/proposals/bulk/route.ts:13:    const auth = await requireAdmin(request, { requireOrganization: true });
src/lib/supabase/admin.ts:18:export function createAdminClient() {
src/app/api/_handlers/proposals/send-pdf/route.ts:47:    const auth = await requireAdmin(
src/app/api/_handlers/invoices/route.ts:30:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/invoices/route.ts:90:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/reports/operators/route.ts:12:        const admin = await requireAdmin(request);
src/lib/supabase/middleware.ts:46:    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
src/lib/supabase/middleware.ts:49:    const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/invoices/send-pdf/route.ts:39:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/broadcast/route.ts:97:  const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/settings/team/shared.ts:182:  } = await supabase.auth.getUser();
src/app/api/_handlers/settings/team/shared.ts:190:  const admin = createAdminClient();
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:56:        const authResult = await requireAdmin(request);
src/app/api/_handlers/settings/integrations/route.ts:19:        const admin = await requireAdmin(request);
src/app/api/_handlers/admin/reports/gst/route.ts:34:    const authResult = await requireAdmin(request);
src/app/api/_handlers/bookings/[id]/invoice/route.ts:75:    const adminClient = createAdminClient();
src/app/api/_handlers/bookings/[id]/invoice/route.ts:93:      const auth = await requireAdmin(request, { requireOrganization: true });
src/lib/platform/settings.ts:60:  const adminClient = createAdminClient();
src/lib/platform/settings.ts:102:  const adminClient = createAdminClient();
src/lib/platform/settings.ts:198:  const adminClient = createAdminClient();
src/lib/assistant/alerts.ts:209:    const supabase = createAdminClient();
src/lib/assistant/alerts.ts:257:  const supabase = createAdminClient();
src/lib/security/admin-bearer-auth.ts:3:const supabaseAdmin = createAdminClient();
src/lib/security/admin-bearer-auth.ts:17:    await supabaseAdmin.auth.getUser(token);
src/lib/security/admin-bearer-auth.ts:20:  const { data: profile } = await supabaseAdmin
src/app/api/_handlers/settings/marketplace/route.ts:82:    const auth = await requireAdmin(request, { requireOrganization: true });
src/lib/security/cost-endpoint-guard.ts:120:    const adminClient = createAdminClient();
src/lib/security/cost-endpoint-guard.ts:153:  } = await supabase.auth.getUser();
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:136:  const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:188:  const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:36:    const admin = await requireAdmin(request);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:81:    const admin = await requireAdmin(request);
src/app/api/_handlers/settings/upi/route.ts:12:        const auth = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/settings/upi/route.ts:52:        const auth = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/whatsapp/send/route.ts:15:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/assistant/export/route.ts:11:    } = await supabase.auth.getUser();
src/app/api/_handlers/assistant/usage/route.ts:15:    } = await supabase.auth.getUser();
src/app/api/_handlers/assistant/usage/route.ts:40:      supabase: createAdminClient(),
src/app/api/_handlers/drivers/search/route.ts:16:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/drivers/search/route.ts:41:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/drivers/search/route.ts:56:        let query = supabaseAdmin
src/app/api/_handlers/drivers/search/route.ts:84:        const { data: assignments, error: assignError } = await supabaseAdmin
src/app/api/_handlers/whatsapp/connect/route.ts:29:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/assistant/quick-prompts/route.ts:25:  } = await supabase.auth.getUser();
src/app/api/_handlers/assistant/quick-prompts/route.ts:45:  const admin = createAdminClient();
src/app/api/_handlers/assistant/confirm/route.ts:18:    } = await supabase.auth.getUser();
src/app/api/_handlers/assistant/confirm/route.ts:70:    const adminClient = createAdminClient();
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:12:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/whatsapp/disconnect/route.ts:15:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/assistant/chat/route.ts:16:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/whatsapp/health/route.ts:56:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/whatsapp/conversations/route.ts:47:      const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/whatsapp/conversations/route.ts:55:      const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/portal/[token]/route.ts:58:    const admin = createAdminClient();
src/app/api/_handlers/assistant/chat/stream/route.ts:385:    const adminClient = createAdminClient();
src/app/api/_handlers/assistant/chat/stream/route.ts:588:    } = await supabase.auth.getUser();
src/app/api/_handlers/payments/create-order/route.ts:43:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/calendar/events/route.ts:17:        const { data: { user }, error: authError } = await supabase.auth.getUser();
src/app/api/_handlers/assistant/conversations/route.ts:27:  } = await supabase.auth.getUser();
src/app/api/_handlers/assistant/conversations/route.ts:47:    supabase: createAdminClient(),
src/app/api/_handlers/payments/links/route.ts:30:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/notifications/delivery/route.ts:57:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/whatsapp/chatbot-sessions/[id]/route.ts:18:    const admin = await requireAdmin(request);
src/app/api/_handlers/admin/leads/[id]/route.ts:46:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/leads/[id]/route.ts:72:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/tour-templates/extract/route.ts:13:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/payments/links/[token]/route.ts:47:    const admin = createAdminClient();
src/app/api/_handlers/payments/links/[token]/route.ts:97:    const admin = createAdminClient();
src/app/api/_handlers/admin/leads/route.ts:45:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/leads/route.ts:81:  const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/referrals/route.ts:24:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/referrals/route.ts:109:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/payments/verify/route.ts:28:    const admin = createAdminClient();
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:63:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:57:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/whatsapp/qr/route.ts:12:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/destinations/route.ts:25:    const admin = await requireAdmin(request);
src/app/api/_handlers/payments/track/[token]/route.ts:35:    const admin = createAdminClient();
src/app/api/_handlers/payments/track/[token]/route.ts:69:    const admin = createAdminClient();
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:101:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:157:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:341:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/marketplace/stats/route.ts:20:        const { data: { user }, error: authError } = await supabase.auth.getUser();
src/app/api/_handlers/admin/pdf-imports/route.ts:58:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/security/diagnostics/route.ts:23:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/funnel/route.ts:12:    const admin = await requireAdmin(request);
src/app/api/_handlers/whatsapp/status/route.ts:10:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:15:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:24:        const { data: authData } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:26:            const { data: profile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:36:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:38:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:60:        const { data: targetProfile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:72:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:134:        const { data: targetProfile } = await supabaseAdmin
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:158:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/admin/ltv/route.ts:15:    const admin = await requireAdmin(request);
src/app/api/_handlers/assistant/conversations/[sessionId]/route.ts:26:    } = await supabase.auth.getUser();
src/app/api/_handlers/assistant/conversations/[sessionId]/route.ts:48:      supabase: createAdminClient(),
src/app/api/_handlers/marketplace/[id]/view/route.ts:31:        } = await supabase.auth.getUser();
src/lib/assistant/orchestrator.ts:436:  const adminClient = createAdminClient();
src/app/api/_handlers/whatsapp/health/route.ts:8:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/cache-metrics/route.ts:10:    const admin = await requireAdmin(req);
src/app/api/_handlers/payments/webhook/route.ts:281:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:394:    const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:461:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:494:  const supabase = createAdminClient();
src/app/api/_handlers/payments/webhook/route.ts:524:  const supabase = createAdminClient();
src/app/api/_handlers/admin/operations/command-center/route.ts:214:    const admin = await requireAdmin(request);
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:22:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:71:        await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:107:        const { data: { user }, error: authError } = await supabase.auth.getUser();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:182:            supabaseAdmin
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:187:            supabaseAdmin
src/app/api/_handlers/whatsapp/test-message/route.ts:12:        const auth = await requireAdmin(request, { requireOrganization: true });
src/lib/assistant/channel-adapters/whatsapp.ts:79:  const supabase = createAdminClient();
src/lib/assistant/channel-adapters/whatsapp.ts:206:  const adminClient = createAdminClient();
src/app/api/_handlers/marketplace/route.ts:18:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/route.ts:185:        const { data: authData } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/route.ts:187:            const { data: profile } = await supabaseAdmin
src/app/api/_handlers/marketplace/route.ts:197:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/marketplace/route.ts:199:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/marketplace/route.ts:236:        let supabaseQuery = supabaseAdmin
src/app/api/_handlers/marketplace/route.ts:308:            const { data: reviewData } = await supabaseAdmin
src/app/api/_handlers/marketplace/route.ts:545:        const { data, error } = await supabaseAdmin
src/lib/assistant/briefing.ts:128:    const supabase = createAdminClient();
src/lib/assistant/briefing.ts:216:  const supabase = createAdminClient();
src/app/api/_handlers/admin/geocoding/usage/route.ts:35:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts:32:  const authResult = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/pricing/trips/route.ts:19:    const admin = await requireAdmin(req);
src/lib/assistant/weekly-digest.ts:257:    const supabase = createAdminClient();
src/lib/assistant/weekly-digest.ts:320:  const supabase = createAdminClient();
src/app/api/_handlers/admin/clients/route.ts:12:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/admin/clients/route.ts:130:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:206:        let { data: existingProfile } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:213:            const { data: phoneProfile } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:223:                supabaseAdmin,
src/app/api/_handlers/admin/clients/route.ts:257:            const { data: existingOrgProfile } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:269:            const { error: profileError } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:279:            const { error: clientUpsertError } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:297:        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
src/app/api/_handlers/admin/clients/route.ts:311:        const { error: profileError } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:325:        const { error: clientInsertError } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:348:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:379:        let profilesQuery = supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:400:                const { count } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:427:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:449:        const { data: targetProfile } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:466:        const { data: profileSnapshotData } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:472:        const { data: clientSnapshotData } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:479:        const { error: profileDeleteError } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:488:        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(clientId);
src/app/api/_handlers/admin/clients/route.ts:493:                await supabaseAdmin.from("profiles").upsert(profileSnapshot);
src/app/api/_handlers/admin/clients/route.ts:496:                await supabaseAdmin.from("clients").upsert(clientSnapshot);
src/app/api/_handlers/admin/clients/route.ts:509:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clients/route.ts:615:        const { data: existingProfile } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:665:        const { error } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:679:            await supabaseAdmin.from("workflow_stage_events").insert({
src/app/api/_handlers/admin/clients/route.ts:693:                const { data: stageRule } = await supabaseAdmin
src/app/api/_handlers/admin/clients/route.ts:711:            await supabaseAdmin.from("notification_queue").insert({
src/app/api/_handlers/admin/pricing/vendor-history/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/reviews/[id]/route.ts:18:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/reviews/[id]/route.ts:67:    } = await supabase.auth.getUser();
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
src/app/api/_handlers/admin/seed-demo/route.ts:39:  const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route.ts:30:    } = await supabase.auth.getUser();
src/app/api/_handlers/location/share/route.ts:31:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/location/share/route.ts:79:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/location/share/route.ts:155:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/reputation/reviews/route.ts:16:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/reviews/route.ts:153:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/pricing/transactions/route.ts:41:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/ai-usage/route.ts:19:    const admin = await requireAdmin(req);
src/app/api/_handlers/marketplace/inquiries/route.ts:54:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/marketplace/inquiries/route.ts:155:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/admin/cost/overview/route.ts:48:  const admin = await requireAdmin(request);
src/app/api/_handlers/admin/cost/overview/route.ts:250:  const admin = await requireAdmin(request);
src/app/api/_handlers/location/live/[token]/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/live/[token]/route.ts:37:        const { count: recentCount } = await supabaseAdmin
src/app/api/_handlers/location/live/[token]/route.ts:48:        void supabaseAdmin.from("trip_location_share_access_logs").insert({
src/app/api/_handlers/location/live/[token]/route.ts:53:        const { data: share, error: shareError } = await supabaseAdmin
src/app/api/_handlers/location/live/[token]/route.ts:83:        const { data: latestLocation } = await supabaseAdmin
src/app/api/_handlers/location/live/[token]/route.ts:91:        const assignmentQuery = supabaseAdmin
src/app/api/_handlers/admin/insights/win-loss/route.ts:13:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/dashboard/route.ts:18:    const admin = await requireAdmin(req);
src/app/api/_handlers/location/cleanup-expired/route.ts:10:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/cleanup-expired/route.ts:15:    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/location/cleanup-expired/route.ts:18:    const { data: profile } = await supabaseAdmin
src/app/api/_handlers/location/cleanup-expired/route.ts:59:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/location/cleanup-expired/route.ts:72:            await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/marketplace/listing-subscription/route.ts:49:  } = await supabase.auth.getUser();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:55:  const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:138:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:195:    const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:270:    const admin = createAdminClient();
src/app/api/_handlers/reputation/analytics/topics/route.ts:23:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:19:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:56:    const admin = await requireAdmin(req);
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:47:  } = await supabase.auth.getUser();
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:53:  const admin = createAdminClient();
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:106:    const admin = createAdminClient();
src/app/api/_handlers/onboarding/setup/route.ts:9:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/onboarding/setup/route.ts:96:  const { data, error } = await supabaseAdmin
src/app/api/_handlers/onboarding/setup/route.ts:142:  } = await serverClient.auth.getUser();
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
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:24:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:59:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:108:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:15:  const admin = await requireAdmin(request);
src/app/api/_handlers/location/client-share/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/client-share/route.ts:21:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/location/client-share/route.ts:32:        const { data: trip } = await supabaseAdmin
src/app/api/_handlers/location/client-share/route.ts:47:        let existingQuery = supabaseAdmin
src/app/api/_handlers/location/client-share/route.ts:74:        const { data: inserted, error: insertError } = await supabaseAdmin
src/app/api/_handlers/reputation/analytics/trends/route.ts:23:    } = await supabase.auth.getUser();
src/app/api/_handlers/marketplace/options/route.ts:22:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/marketplace/options/route.ts:74:    const { data } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/marketplace/options/route.ts:83:  } = await serverClient.auth.getUser();
src/app/api/_handlers/marketplace/options/route.ts:88:  const queryClient = supabaseAdmin as unknown as {
src/app/api/_handlers/marketplace/options/route.ts:139:  const { data, error } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/location/ping/route.ts:20:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/location/ping/route.ts:42:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:48:        const { data: trip } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:62:        const { data: assignmentRows } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:73:            const { data: driverAccount } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:90:        const { data: latestPing } = await supabaseAdmin
src/app/api/_handlers/location/ping/route.ts:106:        const { error: insertError } = await supabaseAdmin
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:50:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/analytics/snapshot/route.ts:92:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/marketplace/verify/route.ts:103:        const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/marketplace/verify/route.ts:198:        const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/pricing/overheads/route.ts:25:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/overheads/route.ts:73:    const admin = await requireAdmin(req);
src/app/api/_handlers/onboarding/first-value/route.ts:28:    } = await serverClient.auth.getUser();
src/app/api/_handlers/onboarding/first-value/route.ts:34:    const adminClient = createAdminClient();
src/app/api/_handlers/reputation/sync/route.ts:103:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:25:    const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:101:    const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/emails/welcome/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/emails/welcome/route.ts:18:        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/emails/welcome/route.ts:34:        const { data: profile, error: profileError } = await supabaseAdmin
src/app/api/_handlers/emails/welcome/route.ts:59:            await supabaseAdmin
src/app/api/_handlers/admin/insights/auto-requote/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/billing/contact-sales/route.ts:70:    } = await supabase.auth.getUser();
src/app/api/_handlers/billing/contact-sales/route.ts:99:    const admin = createAdminClient();
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:30:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:61:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:110:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/widget/config/route.ts:26:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/widget/config/route.ts:66:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/widget/config/route.ts:153:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/insights/best-quote/route.ts:32:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:51:    const admin = await requireAdmin(nextReq, { requireOrganization: false });
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:27:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:65:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/brand-voice/route.ts:27:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/brand-voice/route.ts:108:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:19:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:68:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/campaigns/[id]/route.ts:149:    } = await supabase.auth.getUser();
src/app/api/_handlers/leads/convert/route.ts:78:  const supabase = createAdminClient();
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:28:    const admin = await requireAdmin(req);
src/app/api/_handlers/health/route.ts:30:const supabaseAdmin =
src/app/api/_handlers/health/route.ts:32:        ? createAdminClient()
src/app/api/_handlers/health/route.ts:106:    if (!supabaseAdmin) {
src/app/api/_handlers/health/route.ts:111:    const { error } = await supabaseAdmin
src/app/api/_handlers/health/route.ts:300:    if (!supabaseAdmin) {
src/app/api/_handlers/health/route.ts:305:        supabaseAdmin
src/app/api/_handlers/health/route.ts:309:        supabaseAdmin
src/app/api/_handlers/health/route.ts:313:        supabaseAdmin
src/app/api/_handlers/health/route.ts:316:        supabaseAdmin
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:42:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/campaigns/route.ts:23:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/campaigns/route.ts:63:    } = await supabase.auth.getUser();
src/app/api/_handlers/billing/subscription/route.ts:17:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/trips/[id]/route.ts:58:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/insights/proposal-risk/route.ts:18:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/connections/route.ts:16:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/connections/route.ts:63:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/connections/route.ts:139:    } = await supabase.auth.getUser();
src/app/api/_handlers/reputation/ai/analyze/route.ts:100:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/contacts/route.ts:55:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/contacts/route.ts:144:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:23:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:226:    const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/insights/daily-brief/route.ts:13:    const admin = await requireAdmin(req);
src/app/api/_handlers/reputation/ai/respond/route.ts:173:    } = await supabase.auth.getUser();
src/app/api/_handlers/notifications/retry-failed/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/retry-failed/route.ts:22:            const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/notifications/retry-failed/route.ts:27:            const { data: profile } = await supabaseAdmin
src/app/api/_handlers/notifications/retry-failed/route.ts:40:        const { data, error } = await supabaseAdmin
src/app/api/_handlers/notifications/retry-failed/route.ts:56:            await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/admin/generate-embeddings/route.ts:38:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/generate-embeddings/route.ts:99:  const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/clear-cache/route.ts:42:    const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/trips/route.ts:122:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/trips/route.ts:234:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/reputation/dashboard/route.ts:19:    const supabase = createAdminClient();
src/app/api/_handlers/reputation/dashboard/route.ts:140:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/admin/insights/roi/route.ts:17:  const admin = await requireAdmin(req);
src/app/api/_handlers/notifications/send/route.ts:128:        const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/insights/action-queue/route.ts:13:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/social/generate/route.ts:234:    const admin = await requireAdmin(request, { requireOrganization: false });
src/app/api/_handlers/admin/insights/margin-leak/route.ts:14:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/dashboard/stats/route.ts:24:    const admin = await requireAdmin(req);
src/app/api/_handlers/admin/revenue/route.ts:47:    const db = createAdminClient();
src/app/api/_handlers/admin/revenue/route.ts:137:    const admin = await requireAdmin(req);
src/app/api/_handlers/integrations/tripadvisor/route.ts:12:        const admin = await requireAdmin(req, { requireOrganization: true });
src/app/api/_handlers/integrations/tripadvisor/route.ts:39:        const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/integrations/tripadvisor/route.ts:40:        await supabaseAdmin.from('organization_settings').upsert(
src/app/api/_handlers/integrations/tripadvisor/route.ts:65:        const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/integrations/tripadvisor/route.ts:77:        const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/integrations/tripadvisor/route.ts:79:        const { data: settings } = await supabaseAdmin
src/app/api/_handlers/availability/route.ts:21:    const adminResult = await requireAdmin(request);
src/app/api/_handlers/availability/route.ts:80:    const admin = await requireAdmin(request);
src/app/api/_handlers/availability/route.ts:141:    const admin = await requireAdmin(request);
src/app/api/_handlers/dashboard/tasks/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/dashboard/tasks/route.ts:42:    const { data: trips, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:108:    const { data: invoices, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:165:    const { data: proposals, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:231:    const { data: trips, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:292:    const { data, error } = await supabaseAdmin
src/app/api/_handlers/dashboard/tasks/route.ts:306:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/integrations/places/route.ts:17:  supabaseAdmin: AdminClient,
src/app/api/_handlers/integrations/places/route.ts:20:  const { data: connection } = await supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:33:  supabaseAdmin: AdminClient,
src/app/api/_handlers/integrations/places/route.ts:38:  const existingConnection = await getGooglePlaceConnection(supabaseAdmin, organizationId);
src/app/api/_handlers/integrations/places/route.ts:41:    await supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:53:    await supabaseAdmin.from("reputation_platform_connections").insert({
src/app/api/_handlers/integrations/places/route.ts:63:  await supabaseAdmin.from("organization_settings").upsert(
src/app/api/_handlers/integrations/places/route.ts:110:    const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/integrations/places/route.ts:120:    const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/integrations/places/route.ts:123:      supabaseAdmin
src/app/api/_handlers/integrations/places/route.ts:128:      getGooglePlaceConnection(supabaseAdmin, organizationId),
src/app/api/_handlers/integrations/places/route.ts:144:    const admin = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/integrations/places/route.ts:159:    const supabaseAdmin = admin.adminClient;
src/app/api/_handlers/integrations/places/route.ts:161:      await ensureGooglePlaceConfigured(supabaseAdmin, organizationId, googlePlaceId);
src/app/api/_handlers/integrations/places/route.ts:169:    await supabaseAdmin.from("organization_settings").upsert(
src/app/api/_handlers/ai/suggest-reply/route.ts:64:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/workflow/events/route.ts:19:        const admin = await requireAdmin(req, { requireOrganization: false });
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
src/app/api/_handlers/ai/pricing-suggestion/route.ts:127:    } = await supabase.auth.getUser();
src/app/api/_handlers/admin/workflow/rules/route.ts:91:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/admin/workflow/rules/route.ts:139:        const admin = await requireAdmin(req, { requireOrganization: false });
src/app/api/_handlers/itinerary/share/route.ts:37:        } = await supabase.auth.getUser();
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:27:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/notifications/schedule-followups/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/schedule-followups/route.ts:90:    const { data: completedTrips, error: tripsError } = await supabaseAdmin
src/app/api/_handlers/notifications/schedule-followups/route.ts:127:    const { data: existingRows, error: existingError } = await supabaseAdmin
src/app/api/_handlers/notifications/schedule-followups/route.ts:187:      const { error: insertError } = await supabaseAdmin
src/app/api/_handlers/ai/draft-review-response/route.ts:29:    } = await supabase.auth.getUser();
src/app/api/_handlers/subscriptions/route.ts:138:    const auth = await requireAdmin(request as unknown as import("next/server").NextRequest, { requireOrganization: true });
src/app/api/_handlers/subscriptions/route.ts:169:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/notifications/client-landed/route.ts:10:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/notifications/client-landed/route.ts:32:        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/notifications/client-landed/route.ts:56:        const { data: trip, error: tripError } = await supabaseAdmin
src/app/api/_handlers/notifications/client-landed/route.ts:91:        const { data: assignmentRaw } = await supabaseAdmin
src/app/api/_handlers/notifications/client-landed/route.ts:113:        const { data: accommodation } = await supabaseAdmin
src/app/api/_handlers/notifications/client-landed/route.ts:159:        await supabaseAdmin.from("notification_logs").insert({
src/app/api/_handlers/support/route.ts:26:        const { data: { user }, error: userError } = await supabase.auth.getUser();
src/app/api/_handlers/support/route.ts:80:        const { data: { user }, error: userError } = await supabase.auth.getUser();
src/app/api/_handlers/itineraries/[id]/route.ts:15:        } = await supabase.auth.getUser();
src/app/api/_handlers/itineraries/[id]/route.ts:58:        } = await supabase.auth.getUser();
src/app/api/_handlers/subscriptions/limits/route.ts:14:    } = await supabase.auth.getUser();
src/app/api/_handlers/subscriptions/limits/route.ts:33:    const dataClient = canUseAdminClient ? createAdminClient() : supabase;
src/app/api/_handlers/dashboard/schedule/route.ts:9:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/dashboard/schedule/route.ts:94:        const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/dashboard/schedule/route.ts:100:        const { data: trips, error } = await supabaseAdmin
src/app/api/_handlers/itinerary/import/url/route.ts:110:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/subscriptions/cancel/route.ts:36:    const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/itineraries/route.ts:16:    } = await supabase.auth.getUser();
src/app/api/_handlers/social/reviews/import/route.ts:9:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:65:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/itineraries/[id]/feedback/route.ts:100:        const adminClient = createAdminClient();
src/app/api/_handlers/trips/[id]/notifications/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/notifications/route.ts:14:    const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/notifications/route.ts:18:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/trips/[id]/notifications/route.ts:37:    const { data: logs } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/notifications/route.ts:45:    const { data: queue } = await supabaseAdmin
src/app/api/_handlers/itineraries/[id]/bookings/route.ts:68:    } = await supabase.auth.getUser();
src/app/api/_handlers/itineraries/[id]/bookings/route.ts:125:    } = await supabase.auth.getUser();
src/app/api/_handlers/social/reviews/route.ts:13:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/reviews/route.ts:51:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/trips/[id]/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/route.ts:59:        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/route.ts:65:        const { data: { user } } = await serverClient.auth.getUser();
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
src/app/api/_handlers/social/posts/[id]/render/route.ts:14:        const { data: { user } } = await supabase.auth.getUser();
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
src/app/api/_handlers/social/extract/route.ts:31:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/social/connections/[id]/route.ts:12:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/connections/route.ts:8:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/trips/[id]/clone/route.ts:34:        const { data: { user }, error: userError } = await supabase.auth.getUser();
src/app/api/_handlers/trips/[id]/clone/route.ts:40:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/clone/route.ts:43:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:56:        let tripQuery = supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:81:            const { data: originalItinerary, error: itinError } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:98:                const { data: newItinerary, error: insertItinError } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/clone/route.ts:124:        const { data: newTrip, error: insertTripError } = await supabaseAdmin
src/app/api/_handlers/social/posts/route.ts:25:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/posts/route.ts:61:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/trips/[id]/add-ons/route.ts:6:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/add-ons/route.ts:13:        const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:19:        } = await serverClient.auth.getUser();
src/app/api/_handlers/trips/[id]/add-ons/route.ts:47:        const { data: proposals } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/add-ons/route.ts:60:        const { data: addOns, error } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/add-ons/route.ts:125:        const { data: updated, error } = await supabaseAdmin
src/app/api/_handlers/itinerary/import/pdf/route.ts:55:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/trips/[id]/invoices/route.ts:8:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/[id]/invoices/route.ts:32:        const { data, error } = await supabaseAdmin.auth.getUser(token);
src/app/api/_handlers/trips/[id]/invoices/route.ts:38:        } = await serverClient.auth.getUser();
src/app/api/_handlers/trips/[id]/invoices/route.ts:66:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/invoices/route.ts:83:        const { data: invoices, error } = await supabaseAdmin
src/app/api/_handlers/trips/[id]/invoices/route.ts:113:            const { data: payments } = await supabaseAdmin
src/app/api/_handlers/itinerary/generate/route.ts:229:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/trips/route.ts:7:const supabaseAdmin = createAdminClient();
src/app/api/_handlers/trips/route.ts:76:        supabaseAdmin.from("invoices")
src/app/api/_handlers/trips/route.ts:79:        supabaseAdmin.from("trip_driver_assignments")
src/app/api/_handlers/trips/route.ts:82:        supabaseAdmin.from("trip_accommodations")
src/app/api/_handlers/trips/route.ts:166:        const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/trips/route.ts:172:        const { data: profile } = await supabaseAdmin
src/app/api/_handlers/trips/route.ts:190:            let query = supabaseAdmin
src/app/api/_handlers/trips/route.ts:283:        let query = supabaseAdmin
src/app/api/_handlers/social/captions/route.ts:58:    const { data: { user } } = await serverClient.auth.getUser();
src/app/api/_handlers/social/refresh-tokens/route.ts:31:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/refresh-tokens/route.ts:36:        const { data: expiringConnections, error } = await supabaseAdmin
src/app/api/_handlers/social/refresh-tokens/route.ts:78:                    await supabaseAdmin
src/app/api/_handlers/social/refresh-tokens/route.ts:87:                    await supabaseAdmin
src/app/api/_handlers/social/publish/route.ts:20:    } = await supabase.auth.getUser();
src/app/api/_handlers/social/schedule/route.ts:21:    } = await supabase.auth.getUser();
src/app/api/_handlers/social/oauth/linkedin/route.ts:15:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/oauth/google/route.ts:21:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/social/process-queue/route.ts:67:        const supabaseAdmin = createAdminClient();
src/app/api/_handlers/social/process-queue/route.ts:71:        const { data: pendingItems, error: fetchError } = await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:92:            const { data: claimedRows } = await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:106:                    await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:128:                await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:152:                await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:175:            const { data: remaining } = await supabaseAdmin
src/app/api/_handlers/social/process-queue/route.ts:185:                await supabaseAdmin
src/app/api/_handlers/social/render-poster/route.ts:46:  const { data: { user } } = await supabase.auth.getUser();
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
src/app/api/_handlers/social/oauth/facebook/route.ts:12:        const { data: { user } } = await supabase.auth.getUser();
src/app/api/_handlers/nav/counts/route.ts:28:    const admin = createAdminClient();
src/app/api/_handlers/nav/counts/route.ts:97:      const auth = await requireAdmin(request, { requireOrganization: true });
src/app/api/_handlers/webhooks/waha/route.ts:85:    const admin = createAdminClient();

RATE_LIMIT_AND_CSRF
src/app/api/_handlers/share/[token]/route.ts:110:    const limiter = await enforceRateLimit({
src/app/api/_handlers/share/[token]/route.ts:156:    const limiter = await enforceRateLimit({
src/app/api/_handlers/proposals/create/route.ts:57:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/weather/route.ts:39:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/availability/route.ts:26:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/availability/route.ts:85:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/availability/route.ts:95:    if (!passesMutationCsrfGuard(request)) {
src/app/api/_handlers/availability/route.ts:146:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/availability/route.ts:156:    if (!passesMutationCsrfGuard(request)) {
src/app/api/_handlers/proposals/public/[token]/route.ts:89:    const limiter = await enforceRateLimit({
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:20:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/whatsapp/health/route.ts:67:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/notifications/delivery/route.ts:72:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/social/reviews/public/route.ts:125:        const limiter = await enforceRateLimit({
src/lib/api-dispatch.ts:80:        const result = await enforceRateLimit({
src/lib/api-dispatch.ts:112:    if (isMutation && !csrfExempt && !passesMutationCsrfGuard(req)) {
src/app/api/_handlers/whatsapp/connect/route.ts:34:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:66:        const rateLimit = await enforceRateLimit({
src/lib/auth/admin.ts:103:    const telemetryLimit = await enforceRateLimit({
src/app/api/_handlers/whatsapp/chatbot-sessions/[id]/route.ts:23:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/whatsapp/chatbot-sessions/[id]/route.ts:33:    if (!passesMutationCsrfGuard(request)) {
src/lib/security/admin-mutation-csrf.ts:46:export function passesMutationCsrfGuard(req: RequestLike): boolean {
src/lib/security/rate-limit.ts:118:export async function enforceRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
src/lib/security/public-rate-limit.ts:35:  const limiter = await enforceRateLimit({
src/lib/security/cost-endpoint-guard.ts:176:  const burstLimit = await enforceRateLimit({
src/lib/security/cost-endpoint-guard.ts:183:  const dailyLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/[id]/route.ts:63:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/onboarding/setup/route.ts:252:    const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/onboarding/setup/route.ts:311:    const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:234:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/route.ts:137:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/trips/route.ts:238:        if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/trips/route.ts:248:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/workflow/events/route.ts:24:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/workflow/rules/route.ts:101:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/workflow/rules/route.ts:144:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/notifications/send/route.ts:141:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/generate-embeddings/route.ts:40:  if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/social/generate/route.ts:242:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/notifications/client-landed/route.ts:38:        const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/currency/route.ts:53:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/tour-templates/extract/route.ts:21:  const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:71:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:109:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:165:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:349:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/pdf-imports/route.ts:69:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/itinerary/import/url/route.ts:116:        const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/itinerary/import/pdf/route.ts:61:        const rateLimitResult = await enforceRateLimit({
src/app/api/_handlers/admin/seed-demo/route.ts:44:  const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/seed-demo/route.ts:57:  if (!passesMutationCsrfGuard(request)) {
src/lib/assistant/channel-adapters/whatsapp.ts:186:  const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/marketplace/verify/route.ts:120:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/marketplace/verify/route.ts:215:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/payments/create-order/route.ts:48:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:65:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/payments/track/[token]/route.ts:26:    const rl = await enforceRateLimit({ identifier: ip, limit: 60, windowMs: 60_000, prefix: "api:payments:track:get" });
src/app/api/_handlers/payments/track/[token]/route.ts:54:    const rl = await enforceRateLimit({ identifier: ip, limit: 20, windowMs: 60_000, prefix: "api:payments:track:post" });
src/app/api/_handlers/admin/contacts/route.ts:80:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/contacts/route.ts:152:    if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/contacts/route.ts:172:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/emails/welcome/route.ts:24:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/leads/route.ts:83:  if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/assistant/confirm/route.ts:39:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/referrals/route.ts:32:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/referrals/route.ts:117:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/assistant/chat/route.ts:37:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/assistant/chat/stream/route.ts:613:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/security/diagnostics/route.ts:32:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/auth/password-login/route.ts:56:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:134:        if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/admin/clients/route.ts:144:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:363:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:435:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clients/route.ts:517:        const rateLimit = await enforceRateLimit({
src/app/api/_handlers/reputation/nps/[token]/route.ts:21:    const rl = await enforceRateLimit({
src/app/api/_handlers/reputation/nps/submit/route.ts:15:    const rl = await enforceRateLimit({
src/app/api/_handlers/reputation/widget/[token]/route.ts:57:    const rl = await enforceRateLimit({
src/app/api/_handlers/superadmin/announcements/route.ts:61:    if (!passesMutationCsrfGuard(request)) {
src/app/api/_handlers/admin/clear-cache/route.ts:47:    const rateLimit = await enforceRateLimit({
src/app/api/_handlers/admin/clear-cache/route.ts:57:    if (!passesMutationCsrfGuard(req)) {
src/app/api/_handlers/leads/convert/route.ts:52:  const rl = await enforceRateLimit({
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:129:        const rateLimitResult = await enforceRateLimit({

JSON_PARSE_AND_PROVIDER_DETAILS
src/lib/marketplace-emails.ts:48:        const data = await response.json().catch(() => ({}));
src/lib/queries/itineraries.ts:60:                const errorPayload = await response.json().catch(() => ({}));
src/lib/queries/itineraries.ts:127:                const errorPayload = await response.json().catch(() => ({}));
src/lib/notifications/browser-push.ts:287:      return JSON.parse(stored);
src/lib/queries/trip-detail.ts:146:        const err = await response.json().catch(() => ({}));
src/app/proposals/create/_hooks/useCreateProposal.ts:130:      const payload = await response.json().catch(() => ({}));
src/lib/queries/dashboard-tasks.ts:79:    return new Set(JSON.parse(raw) as string[]);
src/lib/queries/dashboard-tasks.ts:262:        const errorPayload = await response.json().catch(() => ({}));
src/lib/queries/trips.ts:120:                const errorPayload = await response.json().catch(() => ({}));
src/lib/import/pdf-extractor.ts:127:    const extractedData: ExtractedTourData = JSON.parse(jsonText);
src/lib/import/url-scraper.ts:156:    const extractedData: ExtractedTourData = JSON.parse(jsonText);
src/lib/import/url-scraper.ts:212:    const preview = JSON.parse(jsonText);
src/lib/ai/gemini.server.ts:26:  return JSON.parse(cleanGeminiJson(rawText)) as T;
src/lib/email.ts:63:    const result = await response.json().catch(() => ({}));
src/app/social/_components/ContentBar.tsx:119:        const parsed = JSON.parse(raw);
src/app/proposals/page.tsx:186:      const payload = await response.json().catch(() => ({}));
src/app/proposals/[id]/page.tsx:284:      const payload = await response.json().catch(() => ({} as Record<string, unknown>));
src/lib/pdf-extractor.ts:222:            template = JSON.parse(jsonText);
src/app/social/_components/SocialStudioClient.tsx:172:            const draft = JSON.parse(raw);
src/app/billing/BillingPageClient.tsx:145:      const payload = await response.json().catch(() => ({}));
src/app/billing/BillingPageClient.tsx:235:        const payload = await response.json().catch(() => ({}));
src/app/billing/BillingPageClient.tsx:258:        const payload = await response.json().catch(() => ({}));
src/app/social/_components/background-picker-types.ts:94:        return JSON.parse(localStorage.getItem(key) || "[]");
src/app/portal/[token]/page.tsx:102:        const payload = (await response.json().catch(() => null)) as
src/lib/whatsapp.server.ts:59:            const body = await response.json().catch(() => ({}));
src/app/inbox/useBroadcastAudience.ts:66:        const payload = (await response.json().catch(() => null)) as AudiencePayload | null;
src/lib/rag-itinerary.ts:245:        const assembledItinerary = JSON.parse(
src/app/inbox/BroadcastTab.tsx:265:      const payload = (await response.json().catch(() => null)) as
src/lib/security/social-oauth-state.ts:120:    const parsed = JSON.parse(raw) as Partial<OAuthStatePayload>;
src/app/social/_components/canvas/CanvasPublishModal.tsx:101:      const payload = await response.json().catch(() => ({}));
src/app/social/_components/TemplateGallery.tsx:52:            return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
src/app/social/_components/TemplateGallery.tsx:76:            return stored ? JSON.parse(stored) : [];
src/app/settings/marketplace/MarketplaceListingPlans.tsx:127:      const payload = await response.json().catch(() => null);
src/lib/payments/razorpay.ts:138:  const payload = await response.json().catch(() => null);
src/lib/payments/link-tracker.ts:11:  const payload = (await response.json().catch(() => null)) as
src/lib/proposal-notifications.ts:33:  const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:115:      const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:135:    const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:154:      const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:271:      const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:317:      const payload = await response.json().catch(() => ({}));
src/app/admin/invoices/page.tsx:413:      const payload = await response.json().catch(() => ({}));
src/app/api/_handlers/share/[token]/route.ts:169:    const body = await request.json().catch(() => ({}));
src/app/api/_handlers/debug/route.ts:44:      return NextResponse.json({ success: true, model: 'gemini-2.5-flash', response: JSON.parse(text) });
src/app/admin/insights/page.tsx:112:              const payload = await response.json().catch(() => ({}));
src/app/admin/tour-templates/import/page.tsx:71:        result = JSON.parse(text);
src/app/api/_handlers/proposals/[id]/send/route.ts:102:  const body = await request.json().catch(() => ({}));
src/lib/assistant/orchestrator.ts:84:    return lines.map((line) => JSON.parse(line) as FaqRow);
src/lib/assistant/orchestrator.ts:303:    params = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
src/app/api/_handlers/proposals/bulk/route.ts:18:    const body = await request.json().catch(() => null);
src/app/api/_handlers/whatsapp/broadcast/route.ts:360:    const body = await request.json().catch(() => null);
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:64:        const body = await request.json().catch(() => null);
src/app/api/_handlers/admin/social/generate/route.ts:216:    const parsedJson = JSON.parse(raw);
src/app/api/_handlers/admin/social/generate/route.ts:261:    const body = await request.json().catch(() => null);
src/app/reputation/_components/useReputationDashboardData.ts:62:  const payload = (await response.json().catch(() => ({}))) as {
src/app/api/_handlers/whatsapp/chatbot-sessions/[id]/route.ts:41:    const body = await request.json().catch(() => null);
src/app/api/_handlers/admin/proposals/[id]/payment-plan/route.ts:197:  const body = await request.json().catch(() => ({}));
src/app/api/_handlers/admin/pdf-imports/[id]/route.ts:186:    const body = (await req.json().catch(() => ({}))) as {
src/app/api/_handlers/ai/suggest-reply/route.ts:40:      JSON.parse(serializedInput) as z.infer<typeof SuggestReplySchema>,
src/app/reputation/_components/ReviewInbox.tsx:357:      const body = await response.json().catch(() => ({}));
src/app/reputation/_components/ReviewInbox.tsx:387:      const body = await response.json().catch(() => ({}));
src/app/reputation/_components/ReviewInbox.tsx:414:      const body = await response.json().catch(() => ({}));
src/app/api/_handlers/invoices/[id]/route.ts:125:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/admin/proposals/[id]/tiers/route.ts:89:    const body = await request.json().catch(() => ({}));
src/app/api/_handlers/invoices/[id]/pay/route.ts:47:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/invoices/route.ts:96:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts:110:      body = JSON.parse(rawBody);
src/app/api/_handlers/invoices/send-pdf/route.ts:42:    const parsed = SendInvoicePdfSchema.safeParse(await request.json().catch(() => null));
src/app/api/_handlers/admin/referrals/route.ts:137:    const body = (await req.json().catch(() => ({}))) as { referralCode?: string };
src/app/api/_handlers/settings/team/[id]/route.ts:32:    const body = await request.json().catch(() => null);
src/app/api/_handlers/admin/whatsapp/normalize-driver-phones/route.ts:36:    const body = (await req.json().catch(() => ({}))) as {
src/app/api/_handlers/admin/cost/overview/route.ts:252:  const body = await request.json().catch(() => null);
src/app/api/_handlers/settings/team/invite/route.ts:34:    const body = await request.json().catch(() => null);
src/app/api/_handlers/whatsapp/webhook/route.ts:137:        const payload = JSON.parse(rawBody) as unknown;
src/app/api/_handlers/bookings/flights/search/route.ts:114:    const payload = await response.json().catch(() => ({}));
src/app/api/_handlers/admin/cost/alerts/ack/route.ts:18:  const body = await request.json().catch(() => null);
src/app/api/_handlers/social/reviews/public/route.ts:107:        const body = await req.json().catch(() => null);
src/app/api/_handlers/admin/marketplace/verify/route.ts:230:        const body = await request.json().catch(() => ({}));
src/app/api/_handlers/admin/reputation/client-referrals/route.ts:108:    const body = await req.json().catch(() => ({}));
src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts:66:    const body = await req.json().catch(() => null);
src/app/api/_handlers/social/ai-poster/route.ts:65:        const response = JSON.parse(result.response.text());
src/app/api/_handlers/admin/pricing/overheads/route.ts:82:    const body = await req.json().catch(() => null);
src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts:68:    const body = await req.json().catch(() => null);
src/app/api/_handlers/social/extract/route.ts:91:    const response = JSON.parse(result.response.text());
src/app/api/_handlers/admin/pricing/trip-costs/route.ts:71:    const body = await req.json().catch(() => null);
src/app/api/_handlers/social/captions/route.ts:108:    const response = JSON.parse(result.response.text());
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:195:    const parsed = JSON.parse(raw) as { summary?: unknown; dayThemes?: unknown };
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:257:    const body = await request.json().catch(() => null);
src/app/api/_handlers/notifications/send/route.ts:161:        const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:62:    const body = await req.json().catch(() => ({}));
src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:33:        const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/integrations/places/route.ts:90:  const payload = (await response.json().catch(() => null)) as {
src/app/api/_handlers/integrations/places/route.ts:154:    const body = (await request.json().catch(() => ({}))) as PlacesRequestBody;
src/app/api/_handlers/admin/insights/best-quote/route.ts:39:    const body = await req.json().catch(() => ({}));
src/app/api/_handlers/social/smart-poster/route.ts:64:        const parsed = JSON.parse(geminiResult.response.text());
src/app/api/_handlers/assistant/chat/stream/route.ts:237:        const chunk = JSON.parse(jsonStr) as {
src/app/api/_handlers/assistant/chat/stream/route.ts:298:    params = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:146:        const body = await req.json().catch(() => ({}));
src/app/api/_handlers/itineraries/[id]/bookings/route.ts:112:    const body = await req.json().catch(() => null);
src/app/api/_handlers/trips/[id]/add-ons/route.ts:103:        const body = await req.json().catch(() => null);
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:151:        const payloadRaw = await request.json().catch(() => null);
src/app/api/_handlers/admin/clear-cache/route.ts:22:        const body = await req.json().catch(() => null);
src/app/api/_handlers/payments/create-order/route.ts:60:    const rawBody = await request.json().catch(() => null);
src/app/api/_handlers/marketplace/route.ts:513:        const body = await req.json().catch(() => null);
src/app/api/_handlers/payments/links/route.ts:35:    const body = await request.json().catch(() => null);
src/app/api/_handlers/webhooks/whatsapp/route.ts:134:    payload = JSON.parse(rawBody) as MetaWebhookPayload;
src/app/api/_handlers/itinerary/import/url/route.ts:126:        const parsedBody = await req.json().catch(() => null);
src/app/api/_handlers/itinerary/import/url/route.ts:188:        const itineraryJson = JSON.parse(itineraryText);
src/app/api/_handlers/marketplace/inquiries/route.ts:174:        const payloadRaw = await request.json().catch(() => null);
src/app/api/_handlers/itinerary/generate/route.ts:343:                        typeof cachedRedis === 'string' ? JSON.parse(cachedRedis) : cachedRedis;
src/app/api/_handlers/itinerary/generate/route.ts:588:                    itinerary = JSON.parse(responseContent) as ItineraryLike;
src/app/api/_handlers/itinerary/generate/route.ts:609:                itinerary = JSON.parse(responseText.trim()) as ItineraryLike;
src/app/api/_handlers/payments/webhook/route.ts:183:    const parsed = JSON.parse(body) as unknown;
src/app/api/_handlers/marketplace/listing-subscription/route.ts:186:    const body = await request.json().catch(() => null);
src/app/api/_handlers/marketplace/listing-subscription/route.ts:264:    const body = await request.json().catch(() => null);
src/app/api/_handlers/itinerary/import/pdf/route.ts:116:        const itineraryJson = JSON.parse(itineraryText);
src/app/api/_handlers/payments/track/[token]/route.ts:63:    const body = await request.json().catch(() => null);
src/app/api/_handlers/payments/verify/route.ts:22:    const body = await request.json().catch(() => null);
src/app/api/_handlers/webhooks/waha/route.ts:80:        event = JSON.parse(rawBody) as WppEvent;
src/app/api/_handlers/payments/links/[token]/route.ts:82:    const body = await request.json().catch(() => null);
src/app/api/_handlers/auth/password-login/route.ts:40:    const body = await request.json().catch(() => null);
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:98:    const body = await request.json().catch(() => null);
src/app/api/_handlers/reputation/sync/route.ts:129:    const body = (await request.json().catch(() => ({}))) as {
src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/route.ts:36:    const body = requestSchema.parse(await req.json().catch(() => ({})));
src/app/api/_handlers/reputation/ai/analyze/route.ts:64:  const parsed = JSON.parse(cleaned);
src/app/api/_handlers/reputation/ai/respond/route.ts:110:  const parsed = JSON.parse(cleaned);
src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:75:  const parsed = JSON.parse(cleaned);

CRYPTO_HEURISTICS
src/app/p/[token]/page.tsx:308:      ? Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
src/lib/analytics/template-analytics.ts:193:      .gte('viewed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
src/lib/analytics/template-analytics.ts:203:      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
src/lib/analytics/template-analytics.ts:212:      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
src/lib/api-dispatch.ts:87:            const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
src/components/whatsapp/useInboxData.ts:280:            id: `m_${Date.now()}`,
src/components/whatsapp/useInboxData.ts:301:    const optimisticId = `pending_${Date.now()}`;
src/lib/geocoding.ts:32:    if (Date.now() > entry.expiresAt) {
src/lib/geocoding.ts:45:    geocodeCache.set(key, { result, expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS });
src/lib/whatsapp/chatbot-flow.ts:315:  const cutoff = new Date(Date.now() - RECENT_HUMAN_REPLY_WINDOW_MS).toISOString();
src/lib/whatsapp/chatbot-flow.ts:547:    provider_message_id: crypto.randomUUID(),
src/lib/whatsapp/proposal-drafts.server.ts:73:  const suffix = digits || crypto.randomUUID().replace(/-/g, "");
src/lib/whatsapp/proposal-drafts.server.ts:280:  const profileId = existingProfile?.id ?? crypto.randomUUID();
src/components/whatsapp/WhatsAppConnectModal.tsx:54:        setSessionName("demo_" + Date.now());
src/lib/notifications/browser-push.ts:90:      timestamp: Date.now(),
src/lib/reputation/campaign-trigger.ts:83:      Date.now() - delayHours * 60 * 60 * 1000
src/lib/reputation/campaign-trigger.ts:143:        Date.now() + 7 * 24 * 60 * 60 * 1000
src/lib/admin/action-queue.ts:33:  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000));
src/lib/admin/action-queue.ts:68:  const staleCutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
src/lib/admin/insights.ts:36:  return (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
src/lib/admin/insights.ts:43:  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
src/lib/pwa/offline-mutations.ts:36:    return crypto.randomUUID();
src/lib/pwa/offline-mutations.ts:39:  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
src/lib/pwa/offline-mutations.ts:185:    createdAt: Date.now(),
src/app/proposals/page.tsx:373:                          <span>{formatLocalDate(proposal.created_at || Date.now(), timezone)}</span>
src/lib/cost/spend-guardrails.ts:115:  const now = Date.now();
src/app/proposals/[id]/page.tsx:641:                      {formatLocalDate(comment.created_at || Date.now(), timezone)}
src/app/proposals/[id]/page.tsx:700:                {formatLocalDateTime(comments[0].created_at || Date.now(), timezone)}
src/components/trips/group-manager-shared.tsx:75:  return `t-${crypto.randomUUID()}`
src/lib/external/amadeus.ts:36:  if (cachedToken && Date.now() < tokenExpiry - 30000) {
src/lib/external/amadeus.ts:66:  tokenExpiry = Date.now() + data.expires_in * 1000;
src/lib/ai/upsell-engine.ts:326:      .gte('purchased_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
src/lib/auth/admin-helpers.ts:26:  return Math.random() < ANON_AUTH_FAILURE_SAMPLE_RATE;
src/lib/security/rate-limit.ts:71:    const now = Date.now();
src/lib/security/rate-limit.ts:131:                reset: Date.now() + options.windowMs,
src/lib/security/rate-limit.ts:144:            reset: typeof result.reset === "number" ? result.reset : Date.now() + options.windowMs,
src/lib/security/social-oauth-state.ts:92:  const now = Date.now();
src/lib/security/social-oauth-state.ts:108:    nonce: randomBytes(16).toString("hex"),
src/lib/security/social-oauth-state.ts:109:    ts: Date.now(),
src/lib/security/social-oauth-state.ts:166:  const now = Date.now();
src/lib/shared-itinerary-cache.ts:154:  const startedAt = Date.now();
src/lib/shared-itinerary-cache.ts:185:        responseTimeMs: Date.now() - startedAt,
src/lib/shared-itinerary-cache.ts:227:        responseTimeMs: Date.now() - startedAt,
src/lib/shared-itinerary-cache.ts:248:      responseTimeMs: Date.now() - startedAt,
src/lib/shared-itinerary-cache.ts:316:  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
src/lib/network/retry.ts:54:        const waitMs = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 100);
src/lib/security/cron-auth.ts:107:    const now = Date.now();
src/lib/security/cron-auth.ts:139:    const now = Date.now();
src/lib/security/cron-auth.ts:173:    const minuteBucket = Math.floor(Date.now() / 60_000);
src/lib/security/public-rate-limit.ts:46:  const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/lib/security/social-token-crypto.ts:3:const DEV_EPHEMERAL_KEY = randomBytes(32).toString("hex");
src/lib/security/social-token-crypto.ts:81:  const iv = randomBytes(12);
src/app/drivers/page.tsx:130:            const slug = `agency-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
src/lib/security/safe-equal.ts:11:    const valuesEqual = timingSafeEqual(paddedLeft, paddedRight);
src/lib/observability/logger.ts:69:        return globalThis.crypto.randomUUID();
src/lib/observability/logger.ts:72:    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
src/lib/security/cost-endpoint-guard.ts:230:      Math.ceil((Math.min(burstLimit.reset, dailyLimit.reset) - Date.now()) / 1000)
src/app/settings/marketplace/page.tsx:314:                    id: crypto.randomUUID(),
src/app/settings/marketplace/page.tsx:382:                    id: crypto.randomUUID(),
src/app/admin/trips/[id]/_components/DayActivities.tsx:110:    const [now] = useState(() => Date.now());
src/app/(superadmin)/god/support/page.tsx:60:    const diff = Date.now() - new Date(iso).getTime();
src/components/CreateTripModal.tsx:378:                const token = crypto.randomUUID();
src/app/clients/[id]/client-profile-shared.ts:51:  const ms = Date.now() - new Date(dateStr).getTime();
src/app/clients/[id]/client-profile-shared.ts:74:  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
src/lib/invoices/public-link.ts:36:  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
src/app/(superadmin)/god/audit-log/page.tsx:48:    const diff = Date.now() - new Date(iso).getTime();
src/lib/cache/upstash.ts:52:    if (entry.expiresAt <= Date.now()) {
src/lib/cache/upstash.ts:76:    const now = Date.now();
src/app/(superadmin)/god/announcements/page.tsx:36:    const diff = Date.now() - new Date(iso).getTime();
src/app/admin/tour-templates/create/page.tsx:37:    id: crypto.randomUUID(),
src/app/admin/tour-templates/create/page.tsx:48:    id: crypto.randomUUID(),
src/app/admin/tour-templates/create/page.tsx:63:    id: crypto.randomUUID(),
src/lib/payments/payment-links.server.ts:253:    ? new Date(Date.now() + args.expiresInHours * 60 * 60 * 1000).toISOString()
src/lib/payments/payment-links.server.ts:254:    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
src/lib/payments/payment-links.server.ts:432:  return crypto.timingSafeEqual(expected, received);
src/lib/payments/razorpay.ts:162:  return crypto.timingSafeEqual(expected, received);
src/lib/payments/order-service.ts:31:      receipt: `rcpt_${Date.now()}`,
src/app/planner/NeedsAttentionQueue.tsx:53:    const hoursAgo = (Date.now() - latestActivity.getTime()) / (1000 * 60 * 60);
src/lib/payments/invoice-service.ts:98:        invoice_number: `INV-${Date.now()}`,
src/lib/payments/invoice-service.ts:111:        due_date: (options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
src/app/sitemap.ts:58:        lastModified: new Date(post.updated_at ?? post.published_at ?? Date.now()),
src/app/reputation/_components/CompetitorBenchmark.tsx:95:      id: crypto.randomUUID(),
src/app/admin/settings/marketplace/page.tsx:279:                id: crypto.randomUUID(),
src/app/admin/settings/marketplace/page.tsx:296:                id: crypto.randomUUID(),
src/app/api/_handlers/share/[token]/route.ts:83:  return parsed.getTime() < Date.now();
src/app/api/_handlers/share/[token]/route.ts:117:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/share/[token]/route.ts:163:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/social/_components/ContentBar.tsx:153:      id: Date.now().toString(36),
src/lib/assistant/alerts.ts:63:  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
src/lib/assistant/alerts.ts:67:  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/reports/gst/route.ts:64:      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
src/app/social/_components/CarouselBuilder.tsx:32:            id: Date.now().toString(),
src/app/api/_handlers/admin/clients/route.ts:61:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/clients/route.ts:719:                idempotency_key: `lifecycle-stage:${existingProfile.id}:${existingProfile.lifecycle_stage || "lead"}:${lifecycleStage}:${Date.now()}`,
src/app/social/_components/MediaLibrary.tsx:90:            const fileName = `${Date.now()}-${file.name}`;
src/app/api/_handlers/admin/whatsapp/health/route.ts:14:  return Math.max(0, Math.floor((Date.now() - t) / 60000));
src/app/api/_handlers/admin/insights/win-loss/route.ts:26:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/social/_components/SocialStudioClient.tsx:157:                savedAt: Date.now(),
src/app/social/_components/SocialStudioClient.tsx:174:            if (Date.now() - draft.savedAt > TWENTY_FOUR_HOURS) return;
src/app/api/_handlers/admin/insights/batch-jobs/route.ts:69:    const idempotencyKey = `analytics-batch:${admin.organizationId}:${parsed.data.job_type}:${Date.now()}`;
src/app/social/_components/StockTab.tsx:82:                      ? [{ id: `single-${Date.now()}`, url: data.url }]
src/lib/assistant/actions/reads/dashboard.ts:58:  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
src/app/api/_handlers/admin/notifications/delivery/route.ts:13:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/insights/auto-requote/route.ts:29:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/auto-requote/route.ts:53:          ? (new Date(proposal.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
src/app/social/_components/AiTab.tsx:147:                    timestamp: Date.now(),
src/app/social/_components/AiTab.tsx:212:                timestamp: Date.now(),
src/app/api/_handlers/proposals/[id]/send/route.ts:225:    proposal.expires_at && new Date(proposal.expires_at).getTime() > Date.now()
src/app/api/_handlers/proposals/[id]/send/route.ts:227:      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:49:    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:50:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/ops-copilot/route.ts:169:    const staleLeadCutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
src/app/api/_handlers/admin/notifications/delivery/retry/route.ts:14:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/proposals/[id]/pdf/route.ts:148:      if (Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
src/app/social/_components/template-gallery/FestivalBanner.tsx:19:        (new Date(festival.date).getTime() - Date.now()) / 86400000
src/app/api/_handlers/admin/insights/daily-brief/route.ts:26:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/daily-brief/route.ts:28:    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/proposals/public/[token]/route.ts:97:      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/social/_components/PlatformStatusBar.tsx:28:                const nowMs = Date.now();
src/app/api/_handlers/admin/insights/margin-leak/route.ts:29:    const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/margin-leak/route.ts:65:          ? Math.max(0, (Date.now() - new Date(proposal.created_at).getTime()) / (1000 * 60 * 60 * 24))
src/app/social/_components/TemplateEditor.tsx:235:                                    link.download = `smart-poster-${Date.now()}.png`;
src/app/api/_handlers/admin/insights/upsell-recommendations/route.ts:63:    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/whatsapp/broadcast/route.ts:274:        id: row.wa_id || crypto.randomUUID(),
src/app/api/_handlers/whatsapp/broadcast/route.ts:404:        const providerMessageId = crypto.randomUUID();
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:29:    const endWindow = new Date(Date.now() + parsed.data.daysForward * 24 * 60 * 60 * 1000);
src/app/api/_handlers/admin/insights/smart-upsell-timing/route.ts:79:          ? Math.max(0, Math.round((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
src/app/api/_handlers/whatsapp/extract-trip-intent/route.ts:138:                chatbot_session_id: crypto.randomUUID(),
src/app/api/_handlers/admin/insights/roi/route.ts:37:  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
src/components/ShareTripModal.tsx:48:            const token = crypto.randomUUID();
src/app/api/_handlers/whatsapp/send/route.ts:65:    const providerMessageId = crypto.randomUUID();
src/app/api/_handlers/admin/insights/action-queue/route.ts:28:    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/insights/action-queue/route.ts:30:    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/assistant/chat/stream/route.ts:659:    const sessionId = `s-${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
src/components/planner/ApprovalManager.tsx:200:          id: `queued-${Date.now()}`,
src/components/planner/LogisticsManager.tsx:29:        id: crypto.randomUUID(),
src/components/planner/LogisticsManager.tsx:40:        id: crypto.randomUUID(),
src/components/planner/PricingManager.tsx:68:                id: crypto.randomUUID(),
src/app/api/_handlers/whatsapp/test-message/route.ts:47:            messageId: "wpp_" + Date.now(),
src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts:8:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/components/bookings/HotelSearch.tsx:44:    const [checkOut, setCheckOut] = useState(toDateInput(new Date(Date.now() + 86400000)));
src/app/api/_handlers/whatsapp/webhook/route.ts:74:    return timingSafeEqual(providedBuffer, expectedBuffer);
src/app/api/_handlers/whatsapp/webhook/route.ts:112:                    provider_message_id: `invalid-signature-${Date.now()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
src/app/api/_handlers/whatsapp/webhook/route.ts:347:        const fileName = `wa_${image.imageId}_${Date.now()}.${fileExt}`;
src/app/api/_handlers/onboarding/setup/route.ts:126:    const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
src/app/api/_handlers/onboarding/setup/route.ts:127:    const timePart = Date.now().toString(36).slice(-4);
src/app/api/_handlers/settings/team/shared.ts:94:  const diffMs = Date.now() - timestamp;
src/components/payments/PaymentLinkButton.tsx:30:  const diff = Date.now() - new Date(isoString).getTime()
src/app/api/_handlers/marketplace/stats/route.ts:14:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/stats/route.ts:113:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/trips/[id]/route.ts:48:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/components/payments/PaymentTracker.tsx:38:  const diff = Date.now() - new Date(isoString).getTime()
src/app/api/_handlers/payments/razorpay/route.ts:20:    const orderId = `order_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`
src/app/api/_handlers/payments/razorpay/route.ts:29:      receipt: receipt ?? `rcpt_${Date.now()}`,
src/app/api/_handlers/payments/razorpay/route.ts:32:      created_at: Math.floor(Date.now() / 1000),
src/app/api/_handlers/payments/razorpay/route.ts:60:      payment_id: `pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`,
src/lib/assistant/context-engine.ts:22:  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
src/lib/assistant/context-engine.ts:238:  if (cached && cached.expiresAt > Date.now()) {
src/lib/assistant/context-engine.ts:246:    expiresAt: Date.now() + CACHE_TTL_MS,
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:49:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:80:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:109:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/reviews/route.ts:172:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/notifications/send/route.ts:123:    const startedAt = Date.now();
src/app/api/_handlers/notifications/send/route.ts:148:            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/notifications/send/route.ts:221:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/view/route.ts:18:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/view/route.ts:86:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/trips/[id]/clone/route.ts:241:      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/notifications/process-queue/route.ts:223:    const shareToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/notifications/process-queue/route.ts:224:    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/notifications/process-queue/route.ts:465:    const startedAt = Date.now();
src/app/api/_handlers/notifications/process-queue/route.ts:549:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:100:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/[id]/inquiry/route.ts:237:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/notifications/schedule-followups/route.ts:49:  const minimum = new Date(Date.now() + 2 * 60_000);
src/app/api/_handlers/marketplace/route.ts:210:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/route.ts:370:                isFeatured && featuredUntil !== null && Date.parse(featuredUntil) > Date.now();
src/app/api/_handlers/marketplace/route.ts:456:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/route.ts:495:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/route.ts:553:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/location/share/route.ts:119:        const shareToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/location/share/route.ts:120:        const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/trips/route.ts:82:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/marketplace/inquiries/route.ts:48:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/inquiries/route.ts:108:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/inquiries/route.ts:149:    const startedAt = Date.now();
src/app/api/_handlers/marketplace/inquiries/route.ts:212:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/location/live/[token]/route.ts:35:        const windowStartIso = new Date(Date.now() - SHARE_RATE_LIMIT_WINDOW_MS).toISOString();
src/app/api/_handlers/marketplace/listing-subscription/route.ts:93:    new Date(subscription.current_period_end).getTime() < Date.now()
src/app/api/_handlers/location/client-share/route.ts:71:        const shareToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/location/client-share/route.ts:72:        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts:72:  const now = Date.now();
src/app/api/_handlers/location/ping/route.ts:100:            const sinceMs = Date.now() - new Date(latestPing.recorded_at).getTime();
src/app/api/_handlers/marketplace/options/route.ts:166:  const startedAt = Date.now();
src/app/api/_handlers/marketplace/options/route.ts:187:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/marketplace/options/route.ts:227:    const durationMs = Date.now() - startedAt;
src/lib/assistant/weekly-digest.ts:60:  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
src/lib/assistant/weekly-digest.ts:64:  return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
src/app/api/_handlers/admin/workflow/events/route.ts:14:    const startedAt = Date.now();
src/app/api/_handlers/admin/workflow/events/route.ts:31:            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/workflow/events/route.ts:108:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts:42:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/location/cleanup-expired/route.ts:35:    if (Math.abs(Date.now() - tsMs) > 5 * 60_000) return false;
src/app/api/_handlers/location/cleanup-expired/route.ts:42:    return timingSafeEqual(sigBuf, expectedBuf);
src/app/api/_handlers/admin/workflow/rules/route.ts:26:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:61:        Date.now() - delayHours * 60 * 60 * 1000
src/app/api/_handlers/reputation/campaigns/trigger/route.ts:121:          Date.now() + 7 * 24 * 60 * 60 * 1000
src/app/api/_handlers/admin/social/generate/route.ts:249:      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/superadmin/overview/route.ts:13:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/overview/route.ts:54:            const d = new Date(Date.now() - (29 - i) * 86_400_000);
src/app/api/_handlers/admin/dashboard/stats/route.ts:32:    const yearAgoISO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
src/components/ui/toast.tsx:75:            const id = crypto.randomUUID();
src/app/api/_handlers/webhooks/whatsapp/route.ts:74:  return timingSafeEqual(providedBuffer, expectedBuffer);
src/app/api/_handlers/admin/tour-templates/extract/route.ts:28:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/superadmin/cost/trends/route.ts:8:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/cost/trends/route.ts:29:            const d = new Date(Date.now() - i * 86_400_000);
src/app/api/_handlers/superadmin/cost/trends/route.ts:52:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/auth/password-login/route.ts:65:        Math.ceil((rateLimit.reset - Date.now()) / 1000)
src/app/api/_handlers/admin/pdf-imports/upload/route.ts:142:    const fileName = `${scopedOrg.organizationId}/${Date.now()}-${safeFileName}`;
src/app/api/_handlers/health/route.ts:49:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:53:        return { response, latency: Date.now() - startedAt };
src/app/api/_handlers/health/route.ts:57:            latency: Date.now() - startedAt,
src/app/api/_handlers/health/route.ts:110:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:115:    const latency = Date.now() - startedAt;
src/app/api/_handlers/health/route.ts:338:        ? Math.max(0, Math.round((Date.now() - new Date(oldestPendingIso).getTime()) / 60000))
src/app/api/_handlers/health/route.ts:363:    const startedAt = Date.now();
src/app/api/_handlers/health/route.ts:371:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/health/route.ts:408:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/superadmin/monitoring/queues/route.ts:42:            oldestPendingMinutes = Math.floor((Date.now() - oldest.getTime()) / 60_000);
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:13:    return new Date(Date.now() - n * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts:105:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/reputation/widget/config/route.ts:103:    const embedToken = crypto.randomUUID().replace(/-/g, "");
src/app/api/_handlers/superadmin/monitoring/health/route.ts:21:    const start = Date.now();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:25:        return { status: "healthy", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:27:        return { status: "down", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:34:    const start = Date.now();
src/app/api/_handlers/superadmin/monitoring/health/route.ts:37:        return { status: "healthy", latency_ms: Date.now() - start };
src/app/api/_handlers/superadmin/monitoring/health/route.ts:39:        return { status: "down", latency_ms: Date.now() - start };
src/app/api/_handlers/admin/seed-demo/fixture.ts:57:  return crypto.randomUUID();
src/app/api/_handlers/admin/marketplace/verify/route.ts:90:    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/marketplace/verify/route.ts:99:    const startedAt = Date.now();
src/app/api/_handlers/admin/marketplace/verify/route.ts:162:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/marketplace/verify/route.ts:194:    const startedAt = Date.now();
src/app/api/_handlers/admin/marketplace/verify/route.ts:332:        const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:45:    const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/[id]/promote/route.ts:192:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/contacts/route.ts:50:  const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/route.ts:114:    const durationMs = Date.now() - startedAt;
src/app/api/_handlers/admin/contacts/route.ts:139:  const startedAt = Date.now();
src/app/api/_handlers/admin/contacts/route.ts:260:    const durationMs = Date.now() - startedAt;
src/components/assistant/TourAssistantChat.tsx:150:            id: `u-${Date.now()}`,
src/components/assistant/TourAssistantChat.tsx:161:        const assistantId = `a-${Date.now()}`;
src/components/assistant/TourAssistantChat.tsx:356:                id: `a-${Date.now()}`,
src/components/assistant/TourAssistantChat.tsx:365:                { id: `err-${Date.now()}`, role: "assistant", content: "Connection error. Please try again." },
src/app/api/_handlers/admin/cost/overview/shared.ts:246:    Math.round((Date.now() - new Date(cachedAt).getTime()) / 1000),
src/app/api/_handlers/superadmin/users/signups/route.ts:15:    return new Date(Date.now() - days * 86_400_000).toISOString();
src/app/api/_handlers/superadmin/users/signups/route.ts:75:            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
src/app/api/_handlers/social/reviews/public/route.ts:56:    return Number.isFinite(ts) && ts <= Date.now();
src/app/api/_handlers/social/reviews/public/route.ts:133:            const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
src/app/api/_handlers/social/reviews/public/route.ts:160:        const duplicateCutoffIso = new Date(Date.now() - 15 * 60_000).toISOString();
src/app/api/_handlers/social/reviews/public/route.ts:203:            const template_id = reviewTemplateIds[Math.floor(Math.random() * reviewTemplateIds.length)];
src/app/api/_handlers/admin/referrals/route.ts:175:        (Date.now() - new Date(myOrg.created_at).getTime()) /
src/app/api/_handlers/social/process-queue/route.ts:125:                const platformPostId = `cron_${platform}_${Date.now()}`;
src/app/api/_handlers/social/posts/[id]/render/route.ts:38:        const storagePath = `${profile.organization_id}/posts/${Date.now()}-${filename}`;
src/app/api/_handlers/admin/security/diagnostics/route.ts:13:  const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
src/app/api/_handlers/admin/security/diagnostics/route.ts:46:    const now = Date.now();
src/app/api/_handlers/dashboard/tasks/route.ts:163:    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
```
