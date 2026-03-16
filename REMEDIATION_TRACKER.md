# Remediation Tracker S40
**Date**: 2026-03-16 | **Branch**: `fix/remediation-s40` | **Source**: Production Readiness Audit (line-level)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## CRITICAL (8 actionable — 1 already ✅)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| C-04 | Payment order creation has no idempotency key | `payments/create-order/route.ts` | Add `receipt: invoiceId` to Razorpay payload; check existing open order in `payment_events` before creating | No double-charges on retry/double-click | ✅ |
| C-05 | Payment verify has no idempotency guard | `payments/verify/route.ts:49–85` | Check `payment_events` for existing `razorpay_payment_id` before re-processing | Idempotent verify — no duplicate emails | ✅ |
| C-06 | Two tables missing RLS | `template_usage_attribution`, `pdf_extraction_queue` | Add migration: ENABLE RLS + service_role-only policy on both tables | Cross-org data no longer leakable | ✅ |
| C-07 | No env var startup validation | No `src/lib/env.ts` | Create Zod-validated env module; import everywhere instead of raw `process.env` | Fail-fast on misconfigured deployment | ✅ |
| C-08 | Rate limit in-memory fallback bypassed on cold start | `src/lib/security/rate-limit.ts:20–120` | Fail-closed when Redis unavailable in production; `RATE_LIMIT_FAIL_OPEN` dev-only | Rate limiting no longer security theater | ✅ |
| C-01 | Mock analytics hardcoded data | `src/lib/queries/analytics.ts:29` | Replace hardcoded numbers with real Supabase query to `invoices`/`payment_events` | Real revenue data shown | ✅ |
| C-02 | Social mock mode — posts not published | `social/process-queue/route.ts:28–31` | Hard guard: if production + mock enabled → throw at startup; add env var check | No silent publishing failure | ✅ |
| C-03 | Self-serve billing checkout not implemented | `src/app/billing/BillingPageClient.tsx:517` | Wire contact-sales flow to notify operator via email; document as manual-upgrade model | Operators notified on upgrade request | 📝 |
| C-09 | ✅ Rate limits on AI routes | S38 | Fixed S38 | enforceRateLimit on 3 routes | ✅ |

## HIGH (16 actionable — 2 already ✅)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-03 | Razorpay webhook no deduplication | `payments/webhook/route.ts` | Store `x-razorpay-event-id`; check before processing; return 200 if already processed | No double payment recording | ✅ |
| H-04 | Unsigned WhatsApp webhook in production | `whatsapp/webhook/route.ts:117` | Hard guard: if production + unsigned allowed → throw startup error | No injected fake messages | ✅ |
| H-05 | Admin brute-force — telemetry only | `src/lib/auth/admin.ts:120–150` | Already rate-limited in prior sprint (commit 714ce10); no change needed | Login attempts limited to 10 per 5 min | ✅ |
| H-11 | Settings team — 6 sequential auth requests | `settings/team/shared.ts:149–175` | Replace loop with single `listUsers({ perPage: 1000 })` | Team page load 600–1200ms faster | ✅ |
| H-12 | Marketplace verify button — no submit handler | `admin/internal/marketplace/page.tsx:117` | Wire button to `POST /api/admin/marketplace/verify` | Marketplace partners can be verified | ✅ |
| H-13 | Demo mode toggle accessible in production | `src/components/DemoModeToggle.tsx` | Gate with `process.env.NODE_ENV !== 'production'` | Real users never see demo data | ✅ |
| H-01 | Subscription limits not enforced on itinerary/generate | `itinerary/generate/route.ts` | Add `checkUsageAllowed(ctx)` before AI generation | Free users blocked from paid feature | ⏳ |
| H-02 | Subscription limits not enforced on reputation AI | `reputation/ai/*.ts` (3 files) | Add `checkUsageAllowed(ctx, 'reputation_ai')` in each handler | Tier limits enforced | ⏳ |
| H-06 | Cron jobs no idempotency | All `cron/` handlers | Redis key `cron:<job>:<date>` before processing | No duplicate emails on double-fire | ⏳ |
| H-07 | Fire-and-forget audit/history in assistant | `assistant/chat/stream/route.ts:316,337,347` | Wrap in try/catch with logError; preserve streaming by not awaiting | Failures logged; no silent data loss | ⏳ |
| H-08 | 77 routes missing loading.tsx | 77 route dirs | Create `loading.tsx` with skeleton in each missing route | No blank white screens | ⏳ |
| H-09 | Client components that should be server | 4 page files | Convert admin/settings/proposals pages to Server Components | 300–500ms faster TTFB | ⏳ |
| H-10 | 26 raw `<img>` tags | Multiple files | Replace with `next/image` | 200–500KB saved per page | ⏳ |
| H-14 | WPPConnect fallback file missing | CLAUDE.md references | Remove WPPConnect references; document Meta Cloud as sole path | No dead code | ⏳ |
| H-17 | Proposal RLS — 13 USING(true) write policies | Proposal tables | Intentional for public proposal link UX — already accepted in S38 | 📝 |
| H-18 | 94 CASCADE DELETE chains | Multiple migrations | Add `deleted_at` soft-delete on high-value tables | Data recoverable | ⏳ |
| H-15 | ✅ billing/contact-sales rate limit | S37 | Fixed S37 | ✅ |
| H-16 | ✅ AI pricing/suggest-reply rate limits | S37 | Fixed S37 | ✅ |

## MEDIUM (22 actionable)

| ID | Finding | File:Line | Action | Status |
|----|---------|-----------|--------|--------|
| M-01 | Invoice email sender falls back to wrong address | `invoices/send-pdf/route.ts:75–77` | Require `PROPOSAL_FROM_EMAIL` or fail with 500 | ✅ |
| M-02 | Cron auth clock skew 5 min too wide | `src/lib/security/cron-auth.ts:80–90` | Reduce to 60 seconds | ✅ |
| M-03 | CSRF token no rotation mechanism | `admin-mutation-csrf.ts:52–72` | Document 90-day rotation in ops runbook | 📝 |
| M-04 | Share token min length 8 chars | `portal/[token]/route.ts:50–70` | Add assertion comment for cryptographic source | 📝 |
| M-05 | Middleware fail-open undocumented | `src/middleware.ts:40–80` | Add comment explaining intentional fail-open design | ✅ |
| M-06 | Silent JSON parse failures in 15+ handlers | Multiple | Add logError in .catch(() => ({})) patterns | ✅ |
| M-07 | Race condition in reputation AI respond | `reputation/ai/respond/route.ts:157` | Use INSERT ON CONFLICT DO UPDATE | ⏳ |
| M-08 | itinerary/generate — no timeout on AI calls | `itinerary/generate/route.ts` | Wrap with AbortController 30s timeout | ⏳ |
| M-09 | itinerary/generate — no streaming | `itinerary/generate/route.ts` | Complex refactor — document for separate sprint | 📝 |
| M-10 | Profiles table public enumeration | Init migration | Restrict RLS to same-org profiles | ⏳ |
| M-11 | Missing FK indexes on queue tables | Multiple tables | Add 3 index migrations | ⏳ |
| M-12 | 13 placeholder migrations — no docs | `supabase/migrations/` | Add README.md documenting each placeholder | ⏳ |
| M-13 | CASCADE on auth.users loses creator | Multiple tables | Change created_by FK to ON DELETE SET NULL | ⏳ |
| M-14 | Text fields missing length constraints | Multiple tables | Add CHECK constraints | ⏳ |
| M-15 | PWA offline IDs use Math.random() | `src/lib/pwa/offline-mutations.ts:39` | Replace with `crypto.randomUUID()` | ✅ |
| M-16 | DriversPageClient 800 lines, 76 states | `DriversPageClient.tsx` | Extract sub-components + useReducer | ⏳ |
| M-17 | AdminRevenueView 794 lines | `AdminRevenueView.tsx` | Extract chart/table/filters sections | ⏳ |
| M-18 | CreateTripModal 774 lines | `CreateTripModal.tsx` | Extract importer and generator sections | ⏳ |
| M-19 | itinerary/generate/route.ts 749 lines | `itinerary/generate/route.ts` | Extract orchestrator/prompt-builder/assembler | ⏳ |
| M-20 | Missing React.memo on list components | TripCardGrid, admin rows | Wrap with React.memo | ⏳ |
| M-21 | No caching for clients/proposals data | Multiple handlers | Add unstable_cache / Redis cache | ⏳ |
| M-22 | Duplicate fetch pattern in 20+ handlers | Multiple | Create src/lib/fetch-json.ts utility | ⏳ |

## LOW (14)

| ID | Finding | Action | Status |
|----|---------|--------|--------|
| L-01 | Rate limit headers expose remaining count | Remove x-ratelimit-remaining | ✅ |
| L-02 | Cron replay window in-memory fallback | Same as C-08 | ✅ |
| L-03 | Webhook invalid sig not rate-limited before logging | Rate limit before DB log | ⏳ |
| L-04 | No org ID validation at auth layer | Optional validateOrgId param | ⏳ |
| L-05 | Admin client import at page level | Move to server utility | ⏳ |
| L-06 | Math.random in review template selection | Deterministic by reviewId | ✅ |
| L-07 | Math.random in network retry jitter | Accept seeded random function | ✅ |
| L-08 | Health check WhatsApp error not granular | Return specific missing var names | ⏳ |
| L-09 | PostGIS extension — verify still needed | Search usage; document or drop | 📝 |
| L-10 | Missing NOT NULL on business-critical fields | Add migration with DEFAULT | ⏳ |
| L-11 | Large admin files need splitting | Follow M-16 pattern | ⏳ |
| L-12 | No lazy loading for animation libraries | dynamic() import | ⏳ |
| L-13 | Inconsistent DB naming conventions | Document in SCHEMA_CONVENTIONS.md | 📝 |
| L-14 | Embedding vector dims not validated | Assert length === 1536 | ⏳ |

## Test Suite Status
- Vitest: 748 tests passed | thresholds ✅ (80% stmts / 90% funcs / 75% branches)
- Playwright E2E: `e2e/tests/remediation-s40.spec.ts` — 17 tests covering C-04/C-05 auth guards, H-03/H-04/H-11/H-12 guards, M-01, L-01

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| Tracker | 0409b65 | 2026-03-16 | chore: create remediation tracker s40 |
| CRITICAL | 786053c | 2026-03-16 | fix: remediate CRITICAL findings (C-01 through C-08) |
| HIGH | 324c7dc | 2026-03-16 | fix: remediate HIGH findings (H-03, H-05, H-11, H-12) |
| MEDIUM/LOW | 1850687 | 2026-03-16 | fix: remediate MEDIUM/LOW findings |
| E2E | 4bff3b45 | 2026-03-16 | test: add E2E tests for remediation s40 |
| Final | — | 2026-03-16 | docs: update QA log and finalize remediation tracker s40 |
