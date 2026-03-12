# Code Quality Remediation Tracker — S22

**Branch**: `fix/code-quality-s22`
**Date**: 2026-03-12
**Source**: Post-audit codebase analysis (4 systemic issues deferred from previous remediations)

---

## Summary

| Category | Scope | Priority | Status |
|----------|-------|----------|--------|
| CQ-1: Replace `as any` casts | 49 files, 153 casts | P1-High | ⏳ |
| CQ-2: Refactor oversized files | 29 files >800 lines | P2-Medium | ⏳ |
| CQ-3: Migrate console to structured logger | 47 server-side files, 165 calls | P2-Medium | ⏳ |
| CQ-4: Standardize API response envelopes | ~150 handler files | P3-Low | ⏳ |

---

## CQ-1: Replace `as any` Casts (P1-High)

**Goal**: Replace all `as any` with proper types from `src/lib/supabase/database.types.ts` (113 tables).
**Generated types**: Already exist — `Database` type with `Tables['table']['Row']` per table.

### Batch A — API Handlers (25 files, 78 casts)

| File | Count | Action | Status |
|------|-------|--------|--------|
| `src/app/api/_handlers/reputation/campaigns/trigger/route.ts` | 6 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/brand-voice/route.ts` | 6 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/admin/dashboard/stats/route.ts` | 6 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/sync/route.ts` | 5 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/analytics/snapshot/route.ts` | 5 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/connections/route.ts` | 4 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts` | 3 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/widget/config/route.ts` | 3 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/campaigns/[id]/route.ts` | 3 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/admin/pricing/trip-costs/[id]/route.ts` | 3 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/admin/pricing/overheads/[id]/route.ts` | 3 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/reviews/route.ts` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/reviews/[id]/route.ts` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/campaigns/route.ts` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/analytics/trends/route.ts` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/ai/batch-analyze/route.ts` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/ai/analyze/route.ts` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/admin/pricing/trips/route.ts` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/admin/pricing/trip-costs/route.ts` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/admin/pricing/overheads/route.ts` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/admin/pricing/dashboard/route.ts` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/admin/pricing/vendor-history/route.ts` | 1 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/admin/pricing/transactions/route.ts` | 1 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/admin/seed-demo/route.ts` | 1 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/nav/counts/route.ts` | 1 | Type Supabase queries | ⏳ |

### Batch B — Lib Files (16 files, 44 casts)

| File | Count | Action | Status |
|------|-------|--------|--------|
| `src/lib/assistant/usage-meter.ts` | 4 | Type Supabase queries | ⏳ |
| `src/lib/platform/settings.ts` | 3 | Type Supabase queries | ⏳ |
| `src/lib/subscriptions/limits.ts` | 2 | Type Supabase queries | ⏳ |
| `src/lib/platform/audit.ts` | 2 | Type Supabase queries | ⏳ |
| `src/lib/assistant/session.ts` | 2 | Type Supabase queries | ⏳ |
| `src/lib/assistant/preferences.ts` | 2 | Type Supabase queries | ⏳ |
| `src/lib/assistant/audit.ts` | 2 | Type Supabase queries | ⏳ |
| `src/lib/reputation/review-marketing.server.ts` | 1 | Type Supabase queries | ⏳ |
| `src/lib/reputation/db.ts` | 1 | Type Supabase queries | ⏳ |
| `src/lib/assistant/weekly-digest.ts` | 1 | Type Supabase queries | ⏳ |
| `src/lib/assistant/conversation-store.ts` | 1 | Type Supabase queries | ⏳ |
| `src/lib/assistant/conversation-memory.ts` | 1 | Type Supabase queries | ⏳ |
| `src/lib/assistant/briefing.ts` | 1 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/assistant/quick-prompts/route.ts` | 1 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/superadmin/support/tickets/route.ts` | 1 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/superadmin/support/tickets/[id]/route.ts` | 1 | Type Supabase queries | ⏳ |

### Batch C — Components + Other (8 files, 31 casts)

| File | Count | Action | Status |
|------|-------|--------|--------|
| `src/components/admin/ProposalAddOnsManager.tsx` | 5 | Type Supabase queries | ⏳ |
| `src/components/client/ProposalAddOnsSelector.tsx` | 3 | Type Supabase queries | ⏳ |
| `src/app/drivers/[id]/page.tsx` | 2 | Type Supabase queries | ⏳ |
| `src/app/api/availability/route.ts` | 1 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/superadmin/referrals/overview/route.ts` | 1 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts` | 1 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/dashboard/route.ts` | 1 | Type Supabase queries | ⏳ |
| `src/app/api/_handlers/reputation/analytics/topics/route.ts` | 1 | Type Supabase queries | ⏳ |

---

## CQ-2: Refactor Oversized Files (P2-Medium)

**Goal**: Split all files >800 lines into focused sub-modules (<400 lines each). Use re-exports for backward compatibility.

### Tier 1 — Over 1,000 lines (10 files)

| File | Lines | Split Strategy | Status |
|------|-------|----------------|--------|
| `src/lib/social/template-registry.ts` | 1,680 | Split by template category (travel, review, service, gallery, premium) | ⏳ |
| `src/app/admin/trips/[id]/page.tsx` | 1,628 | Extract TripHeader, TripItinerary, TripBookings, TripPayments | ⏳ |
| `src/lib/social/poster-renderer.ts` | 1,624 | Split by layout type (center, elegant, split, bottom, review) | ⏳ |
| `src/components/ui/map.tsx` | 1,530 | Extract MapControls, MapMarkers, MapRoutes, MapPopup | ⏳ |
| `src/app/proposals/create/page.tsx` | 1,436 | Extract ProposalForm, ProposalPreview, ProposalPricing | ⏳ |
| `src/components/whatsapp/UnifiedInbox.tsx` | 1,165 | Extract ConversationList, MessageThread, QuickReplyBar | ⏳ |
| `src/app/admin/settings/page.tsx` | 1,089 | Extract SettingsSections (general, billing, team, integrations) | ⏳ |
| `src/app/api/_handlers/admin/cost/overview/route.ts` | 1,072 | Extract cost calculation helpers, response builders | ⏳ |
| `src/components/trips/GroupManager.tsx` | 1,044 | Extract GroupForm, GroupMemberList, GroupActions | ⏳ |
| `src/app/p/[token]/page.tsx` | 1,033 | Extract PublicProposalView, ProposalAcceptFlow | ⏳ |

### Tier 2 — 800-1,000 lines (19 files)

| File | Lines | Split Strategy | Status |
|------|-------|----------------|--------|
| `src/app/api/_handlers/proposals/public/[token]/route.ts` | 1,007 | Extract validation, response builders | ⏳ |
| `src/components/assistant/TourAssistantChat.tsx` | 989 | Extract ChatMessages, ChatInput, ChatSuggestions | ⏳ |
| `src/app/clients/[id]/page.tsx` | 971 | Extract ClientProfile, ClientTrips, ClientInvoices | ⏳ |
| `src/app/admin/insights/page.tsx` | 944 | Extract InsightCards, InsightFilters, InsightCharts | ⏳ |
| `src/app/admin/notifications/page.tsx` | 938 | Extract NotificationList, NotificationFilters | ⏳ |
| `src/components/pdf/templates/ItineraryTemplatePages.tsx` | 915 | Extract PageHeader, DaySection, CostBreakdown | ⏳ |
| `src/app/clients/page.tsx` | 911 | Extract ClientTable, ClientFilters, ClientActions | ⏳ |
| `src/app/admin/tour-templates/create/page.tsx` | 902 | Extract TemplateForm, TemplatePreview, DayEditor | ⏳ |
| `src/app/inbox/page.tsx` | 898 | Extract InboxList, InboxMessage, InboxFilters | ⏳ |
| `src/app/admin/cost/page.tsx` | 887 | Extract CostTable, CostFilters, CostSummary | ⏳ |
| `src/components/dashboard/ActionQueue.tsx` | 883 | Extract ActionCard, ActionFilters | ⏳ |
| `src/app/dashboard/tasks/page.tsx` | 882 | Extract TaskList, TaskFilters, TaskActions | ⏳ |
| `src/app/add-ons/page.tsx` | 876 | Extract AddOnGrid, AddOnEditor | ⏳ |
| `src/app/social/_components/TemplateGallery.tsx` | 863 | Extract TemplateCard, GalleryFilters | ⏳ |
| `src/app/social/_components/BackgroundPicker.tsx` | 844 | Extract BackgroundGrid, BackgroundUploader | ⏳ |
| `src/app/onboarding/page.tsx` | 823 | Extract OnboardingSteps, OnboardingForm | ⏳ |
| `src/features/admin/billing/BillingView.tsx` | 818 | Extract PlanSelector, InvoiceHistory, UsageMeter | ⏳ |
| `src/app/settings/page.tsx` | 814 | Extract SettingsTabs, ProfileForm, SecuritySettings | ⏳ |
| `src/app/admin/page.tsx` | 803 | Extract DashboardStats, DashboardCharts, RecentActivity | ⏳ |

---

## CQ-3: Migrate Console to Structured Logger (P2-Medium)

**Goal**: Replace `console.log/error/warn` with `logEvent`/`logError` from `src/lib/observability/logger.ts` in server-side files.
**Scope**: Only `src/lib/` files (47 files, 165 calls). Client-side files excluded — browser console logging is standard practice.

| File | Count | Action | Status |
|------|-------|--------|--------|
| `src/lib/geocoding-with-cache.ts` | 15 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/pdf-extractor.ts` | 11 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/external/currency.ts` | 10 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/analytics/template-analytics.ts` | 9 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/rag-itinerary.ts` | 8 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/itinerary-cache.ts` | 7 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/external/weather.ts` | 7 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/notifications/browser-push.ts` | 6 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/embeddings.ts` | 6 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/assistant/usage-meter.ts` | 6 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/ai/upsell-engine.ts` | 5 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/semantic-cache.ts` | 4 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/geocoding.ts` | 4 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/assistant/session.ts` | 4 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/assistant/preferences.ts` | 4 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/shared-itinerary-cache.ts` | 3 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/security/rate-limit.ts` | 3 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/platform/settings.ts` | 3 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/image-search.ts` | 3 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/embeddings-v2.ts` | 3 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/cache/upstash.ts` | 3 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/assistant/semantic-response-cache.ts` | 3 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/assistant/response-cache.ts` | 3 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/supabase/env.ts` | 2 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/security/cron-auth.ts` | 2 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/security/cost-endpoint-guard.ts` | 2 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/platform/audit.ts` | 2 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/notifications.ts` | 2 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/funnel/track.ts` | 2 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/email/send.ts` | 2 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/assistant/audit.ts` | 2 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/activities/reorder.ts` | 2 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/whatsapp/chatbot-flow.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/whatsapp.server.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/reputation/referral-flywheel.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/marketplace-emails.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/import/url-scraper.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/import/pdf-extractor.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/external/wikimedia.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/external/whatsapp.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/external/amadeus.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/cost/spend-guardrails.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/assistant/workflows/engine.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/assistant/conversation-store.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/api-dispatch.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |
| `src/lib/admin/operator-scorecard-delivery.ts` | 1 | Replace with `logEvent`/`logError` | ⏳ |

**Note**: `src/lib/observability/logger.ts` itself uses 3 `console.*` calls — these are the logger's implementation and should NOT be replaced.

---

## CQ-4: Standardize API Response Envelopes (P3-Low)

**Goal**: Migrate all API handlers from raw `NextResponse.json()` to typed helpers from `src/lib/api-response.ts`.
**Helpers**: `apiSuccess<T>(data)`, `apiError(message, status)`, `apiPaginated<T>(data, meta)`
**Scope**: ~150 handler files in `src/app/api/_handlers/`

### Pattern

```typescript
// Before
return NextResponse.json({ data: result });
return NextResponse.json({ error: "Not found" }, { status: 404 });

// After
return apiSuccess(result);
return apiError("Not found", 404);
```

**Note**: This is a mechanical transformation. Each handler's response shape changes from arbitrary to `{ success: true, data: T }` or `{ success: false, error: string }`. Frontend callers may need minor updates if they destructure responses differently.

**Deferred to separate tracking**: Due to ~150 files, this will be tracked by batch rather than individual file to keep the tracker manageable.

| Batch | Files | Status |
|-------|-------|--------|
| Admin handlers (`_handlers/admin/`) | ~40 | ⏳ |
| Reputation handlers (`_handlers/reputation/`) | ~20 | ⏳ |
| Social handlers (`_handlers/social/`) | ~15 | ⏳ |
| Superadmin handlers (`_handlers/superadmin/`) | ~20 | ⏳ |
| Assistant handlers (`_handlers/assistant/`) | ~6 | ⏳ |
| Payment/Invoice handlers | ~8 | ⏳ |
| Trip/Proposal handlers | ~12 | ⏳ |
| WhatsApp/Webhook handlers | ~8 | ⏳ |
| Remaining handlers | ~20 | ⏳ |

---

## E2E Tests

**File**: `e2e/tests/code-quality-s22.spec.ts`
**Auth fixtures**: `adminPage`, `clientPage`, `superAdminPage` from `e2e/fixtures/auth.ts`

| Test | Validates | Status |
|------|-----------|--------|
| Admin dashboard loads with typed queries | CQ-1 (as any removal) | ⏳ |
| Calendar page renders | CQ-1 (typed hooks) | ⏳ |
| Leads page loads | CQ-1 (typed queries) | ⏳ |
| Admin trips detail page | CQ-2 (file split) | ⏳ |
| Proposals create page | CQ-2 (file split) | ⏳ |
| Social studio loads | CQ-2 (file split) | ⏳ |
| WhatsApp inbox renders | CQ-2 (file split) | ⏳ |
| Admin settings page | CQ-2 (file split) | ⏳ |
| API response envelope shape | CQ-4 (standardized responses) | ⏳ |
| No console errors on key pages | CQ-3 (logger migration) | ⏳ |

---

## QA Suite

| Check | Threshold | Status |
|-------|-----------|--------|
| Vitest | 581+ pass, 0 fail | ⏳ |
| Coverage — Lines | ≥80% | ⏳ |
| Coverage — Functions | ≥90% | ⏳ |
| Coverage — Branches | ≥75% | ⏳ |
| Lint | 0 warnings | ⏳ |
| Typecheck | 0 errors | ⏳ |
| E2E (code-quality-s22) | All pass | ⏳ |

---

## Commit Log

| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| 0 | — | 2026-03-12 | Tracker + branch created |
| 1 | — | — | CQ-1 Batch A: API handler `as any` removal |
| 2 | — | — | CQ-1 Batch B+C: Lib + component `as any` removal |
| 3 | — | — | CQ-2 Tier 1: Split 10 files >1,000 lines |
| 4 | — | — | CQ-2 Tier 2: Split 19 files 800-1,000 lines |
| 5 | — | — | CQ-3: Console → structured logger (47 files) |
| 6 | — | — | CQ-4: API response standardization |
| 7 | — | — | E2E tests + QA suite |
| 8 | — | — | Merge to main |

---

## Constraints

- **No breaking changes**: All re-exports must be backward-compatible
- **No new dependencies**: Use existing `database.types.ts` and `logger.ts`
- **Periodic commits**: Commit after each phase
- **Tests before merge**: Full E2E + unit suite must pass
- **Client-side console.* excluded**: Browser logging is standard practice
