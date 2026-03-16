# Production Readiness Tracker — Antigravity Travel Suite
**Web App Only** | `projects/travel-suite/apps/web/`
**Assessment Date**: 2026-03-16 | **Method**: Line-level code audit across 6 parallel deep-dive agents
**Review Trigger**: When all ⏳ items are ✅ or 📝, run `/review-deep` — target verdict: **PROD READY**

---

## Legend
✅ Done | ⏳ Pending | 📝 Accepted/Documented | 🔄 In Progress | ❌ Blocking

## Overall Status

| Severity | Total | Done | Pending | Blocking |
|----------|------:|-----:|--------:|--------:|
| 🔴 CRITICAL | 9 | 1 | 8 | 8 |
| 🟠 HIGH | 19 | 3 | 16 | 0 |
| 🟡 MEDIUM | 22 | 0 | 22 | 0 |
| 🟢 LOW | 14 | 0 | 14 | 0 |
| **TOTAL** | **64** | **4** | **60** | **8** |

> **Minimum for prod launch**: All CRITICAL fixed + HIGH security items fixed.

---

## 🔴 CRITICAL — Must Fix Before Any Real Users

### [C-01] Mock Analytics Dashboard — Hardcoded Fake Data
- **File**: `src/lib/queries/analytics.ts:29`
- **Issue**: `useRevenueAnalytics()` returns **hardcoded numbers** (247,500 revenue, 12.5% growth) in a "placeholder structure". Admin revenue dashboard shows fabricated metrics to real users.
- **Fix**: Replace with real DB query to `invoices` or `payment_events` table grouped by month. Use the same pattern as `useOrgAiUsage()` which makes real Supabase queries.
- **Impact**: Operators make real business decisions on fake data.
- **Status**: ⏳

### [C-02] Social Publishing Mock Mode — Posts Not Actually Published
- **File**: `src/app/api/_handlers/social/process-queue/route.ts:28–31`
- **Issue**: `isMockSocialPublishingEnabled()` defaults to `true` in non-production AND can be enabled via env var `SOCIAL_PUBLISH_MOCK_ENABLED`. Posts are queued and marked "published" but not sent to Instagram/LinkedIn/etc.
- **Fix**: (a) Verify `SOCIAL_PUBLISH_MOCK_ENABLED` is NOT set in production Vercel env vars. (b) Add hard guard: if `NODE_ENV === 'production'` and mock enabled, throw at startup.
- **Impact**: Users think posts published; they never were. Reputation damage.
- **Status**: ⏳

### [C-03] Self-Serve Billing Checkout Not Implemented
- **File**: `src/app/billing/BillingPageClient.tsx:517`
- **Issue**: UI explicitly reads: *"Submit the request below and we will create a real follow-up instead of dropping you into a fake checkout."* `data.can_self_serve_checkout === false` always. Users cannot upgrade without manual operator intervention.
- **Fix**: Either (a) wire Razorpay subscription checkout for self-serve upgrade or (b) implement the contact-sales flow properly so operators are notified and can manually upgrade. Currently the CTA does neither.
- **Impact**: Zero self-serve revenue conversion possible.
- **Status**: ⏳

### [C-04] Payment Order Creation Has No Idempotency Key
- **File**: `src/app/api/_handlers/payments/create-order/route.ts`
- **Issue**: Razorpay order creation has no deduplication. If the client retries (network error, double-click), multiple orders are created for the same invoice. Razorpay supports `receipt` field for deduplication but it's not being used.
- **Fix**: Add `receipt: invoiceId` (or a deterministic hash) to Razorpay order creation payload. Before creating, check if an open order already exists for this invoice in `payment_events` table.
- **Impact**: Double-charging customers. Razorpay support nightmare.
- **Status**: ⏳

### [C-05] Payment Verification Has No Idempotency Guard
- **File**: `src/app/api/_handlers/payments/verify/route.ts:49–85`
- **Issue**: Verification endpoint updates proposal to "converted" and sends receipt email on every call. Razorpay retries webhooks and users retry verify calls. No check for already-verified payment.
- **Fix**: Before processing, check `payment_events` table for existing `razorpay_payment_id`. If exists with `captured` status, return 200 without re-processing.
- **Impact**: Customers receive multiple receipt emails; proposals duplicated-converted.
- **Status**: ⏳

### [C-06] Two Database Tables Missing Row-Level Security
- **Tables**: `template_usage_attribution`, `pdf_extraction_queue`
- **Migrations**: `20260219140000_rag_template_search.sql:23`, `20260219150000_pdf_import_pipeline.sql:98`
- **Issue**: Both tables were created without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and without any policies. Any authenticated user can query all rows across all organizations.
- **Fix**: Add migration:
  ```sql
  ALTER TABLE public.template_usage_attribution ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Service role only" ON public.template_usage_attribution
    USING ((select auth.role()) = 'service_role');
  ALTER TABLE public.pdf_extraction_queue ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Service role only" ON public.pdf_extraction_queue
    USING ((select auth.role()) = 'service_role');
  ```
- **Impact**: Cross-org data leakage. One org can see another's template usage and PDF import queue.
- **Status**: ⏳

### [C-07] Missing Environment Variable Startup Validation
- **File**: No `src/lib/env-validation.ts` exists
- **Issue**: 60+ environment variables are required. None are validated at app startup. A misconfigured deployment will crash individual routes at runtime with cryptic errors, not fail-fast on boot.
- **Critical vars with no null-check before use**: `OPENAI_API_KEY` (assistant chat crashes), `RESEND_API_KEY` (invoice emails fail silently), `RAZORPAY_KEY_SECRET` (payments crash), `SUPABASE_SERVICE_ROLE_KEY` (whole app fails).
- **Fix**: Create `src/lib/env.ts` using a pattern like:
  ```typescript
  import { z } from 'zod';
  const envSchema = z.object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
    // ... all required vars
  });
  export const env = envSchema.parse(process.env);
  ```
  Import `env` from this file everywhere instead of `process.env` directly.
- **Complete list of required vars** (60+):
  - PUBLIC: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_APP_URL`
  - PRIVATE: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `WHATSAPP_API_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `GOOGLE_API_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET`, `SENTRY_DSN`, `HEALTHCHECK_TOKEN`
- **Impact**: Silent crashes in production; impossible to diagnose without logs.
- **Status**: ⏳

### [C-08] In-Memory Rate Limit Bypassed on Serverless Cold Starts
- **File**: `src/lib/security/rate-limit.ts:20–120`
- **Issue**: When `UPSTASH_REDIS_REST_URL` is not configured, rate limiting falls back to a Node.js `Map` in memory. On Vercel serverless, each cold start creates a fresh process with an empty Map. Attackers can trigger cold starts to reset rate limit counters.
- **Fix**: (a) REQUIRE Redis in production — fail-closed if Redis unavailable (return 503 instead of falling back). (b) Document `RATE_LIMIT_FAIL_OPEN=true` as a dev-only override. (c) Verify both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in Vercel production dashboard.
- **Impact**: Rate limiting is security theater on prod if Redis isn't configured.
- **Status**: ⏳

### [C-09] ✅ Rate Limits Missing on 3 AI Routes ← FIXED IN S38
- **Fixed**: `social/captions`, `social/extract`, `whatsapp/extract-trip-intent` — all have `enforceRateLimit(20/min)` as of commit `1352e2c`.
- **Status**: ✅

---

## 🟠 HIGH — Fix Before First Real Users

### [H-01] Subscription Tier Limits Not Enforced on Itinerary Generation
- **File**: `src/app/api/_handlers/itinerary/generate/route.ts`
- **Issue**: Itinerary generation uses `getOrgAiUsageSnapshot()` for **cost** guardrails but not **subscription tier** checks. A free-tier org can call this endpoint without hitting any tier limit.
- **Fix**: Call `checkUsageAllowed(ctx)` (same pattern as `assistant/chat/stream/route.ts:396`) before the AI generation. Define tier limits in the subscription service for itinerary generation.
- **Impact**: Free users access paid features; revenue leakage.
- **Status**: ⏳

### [H-02] Subscription Tier Limits Not Enforced on Reputation AI Endpoints
- **Files**: `src/app/api/_handlers/reputation/ai/analyze/route.ts`, `reputation/ai/respond/route.ts`, `reputation/ai/batch-analyze/route.ts`
- **Issue**: These AI endpoints check cost guardrails but not whether the org's subscription tier includes AI reputation features.
- **Fix**: Add `checkUsageAllowed(ctx, 'reputation_ai')` check at the top of each handler.
- **Impact**: Free orgs use paid AI reputation analysis.
- **Status**: ⏳

### [H-03] Razorpay Webhook Has No Event Deduplication
- **File**: `src/app/api/_handlers/payments/webhook/route.ts`
- **Issue**: Razorpay retries webhook delivery on failure. No `razorpay_event_id` deduplication check before processing side effects (updating invoice, sending notifications).
- **Fix**: Store `x-razorpay-event-id` header in `payment_events` table. On receipt, check if already processed: `if (exists) return 200 idempotent`.
- **Impact**: Double payment recording; duplicate customer notifications.
- **Status**: ⏳

### [H-04] Unsigned WhatsApp Webhook Not Guarded in Production
- **File**: `src/app/api/_handlers/whatsapp/webhook/route.ts:117`
- **Issue**: `isUnsignedWebhookAllowed()` can return `true` via env var OR in non-production. If `NODE_ENV` is not set correctly in a Vercel preview deployment, unsigned webhooks are processed.
- **Fix**: Add hard guard at top of handler:
  ```typescript
  if (process.env.NODE_ENV === 'production' && isUnsignedWebhookAllowed()) {
    throw new Error('SECURITY: unsigned webhooks must not be allowed in production');
  }
  ```
- **Impact**: Attacker injects fake WhatsApp messages (fake trip intents, location updates).
- **Status**: ⏳

### [H-05] Admin Brute-Force Protection — Telemetry Only, Not Enforcement
- **File**: `src/lib/auth/admin.ts:120–150`
- **Issue**: Auth failures are counted for telemetry but the counter does NOT reject further attempts. There is no lockout or increasing backoff on failed admin logins.
- **Fix**: Add `enforceRateLimit({ identifier: email, limit: 10, windowMs: 300_000, prefix: 'auth:login:failure' })` in the password-login handler BEFORE calling Supabase auth. On failure, call rate limit to consume a slot.
- **Impact**: Unlimited brute-force on admin accounts.
- **Status**: ⏳

### [H-06] Cron Jobs Have No Idempotency — Double-Fire Risk
- **Files**: All files in `src/app/api/_handlers/cron/`
- **Issue**: Vercel can fire cron twice on pod restarts. No deduplication token in any cron handler. `assistant-alerts`, `assistant-briefing`, `assistant-digest`, `reputation-campaigns`, `operator-scorecards` can all run twice, sending duplicate emails/alerts.
- **Fix**: In each cron handler, before processing: check Redis for `cron:<job-name>:<date>` key. If exists, return 200 immediately. Set key with TTL of `(interval - 5min)` after successful run.
- **Impact**: Users receive duplicate alerts, briefings, and campaign emails.
- **Status**: ⏳

### [H-07] Fire-and-Forget Async Calls — Audit Trail and Data Loss Risk
- **File**: `src/app/api/_handlers/assistant/chat/stream/route.ts:316, 337, 347, 400, 408, 421`
- **Issue**: `void logAuditEvent(...)` and `void saveConversationMessages(...)` are fire-and-forget. If these fail, no error is reported, conversation history is lost, and the audit trail has gaps.
- **Fix**: Either (a) `await` these calls inside try/catch and log failures, or (b) push to a background queue (Supabase Edge Function or pg_cron) for reliable delivery.
- **Impact**: Silent data loss; incomplete audit logs; GDPR compliance risk.
- **Status**: ⏳

### [H-08] 77% of Routes Missing `loading.tsx` Skeleton
- **Issue**: Only 21 of 98 routes have `loading.tsx`. The remaining 77 routes show a blank white screen while data loads.
- **Missing on**: `/admin/clients`, `/admin/proposals`, `/admin/tour-templates`, `/admin/billing`, `/admin/team`, `/admin/operations`, `/admin/settings`, `/admin/reports`, `/proposals/[id]`, `/proposals`, `/settings`, `/settings/team`, `/settings/marketplace`, `/settings/security`, `/settings/integrations`, `/trips`, `/trips/[id]`, `/onboarding`, `/dashboard` + 58 more.
- **Fix**: Create `loading.tsx` in each route segment using existing skeleton components: `GlassListSkeleton`, `GlassCardSkeleton`. Takes ~15 minutes per route.
- **Impact**: First-paint shows blank white page; users think app is broken.
- **Status**: ⏳

### [H-09] Admin Dashboard, Settings, Proposals Pages Are Unnecessarily Client Components
- **Files**: `src/app/admin/page.tsx`, `src/app/settings/page.tsx`, `src/app/proposals/[id]/page.tsx`, `src/app/admin/tour-templates/page.tsx`
- **Issue**: These are marked `'use client'` and use `useEffect` to fetch data after mount. This causes a 300–500ms blank period and prevents SSR caching.
- **Fix**: Convert to Server Components. Move `useEffect` fetches to server-side `async` fetches. Pass data as props to client sub-components that need interactivity.
- **Impact**: Admin dashboard takes 500ms longer to render; not cached by CDN.
- **Status**: ⏳

### [H-10] 26 Raw `<img>` Tags — No Next.js Image Optimization
- **Key files**: `src/app/(marketing)/blog/page.tsx:78`, `src/app/trips/TripCardGrid.tsx:111`, `src/components/templates/ItineraryTemplateModern.tsx:13,159`, `src/app/social/_components/GallerySlotPicker.tsx:100,149`, `src/components/itinerary/ProfessionalItineraryView.tsx:61,290`, + 18 more
- **Issue**: Raw `<img>` bypasses Next.js automatic WebP conversion, responsive `srcset`, and lazy loading.
- **Fix**: Replace with `import Image from 'next/image'`. Add `width`, `height` or `fill` prop. For user-generated content with unknown dimensions, use `fill` with `object-fit: cover`.
- **Impact**: 200–500KB extra per page load; slow LCP on marketing pages.
- **Status**: ⏳

### [H-11] Settings Team Handler — 6 Sequential Auth Pagination Requests
- **File**: `src/app/api/_handlers/settings/team/shared.ts:149–175`
- **Issue**: Loop runs up to 6 sequential requests to `admin.auth.admin.listUsers()` to paginate through users. This adds 600–1,200ms to every team settings page load.
- **Fix**: Use `listUsers({ perPage: 1000 })` in a single call (Supabase auth supports up to 1000). Or implement cursor-based pagination with `next_page_token`.
- **Impact**: Team settings page feels broken (takes 2–3s to load).
- **Status**: ⏳

### [H-12] Marketplace Partner Verification UI — No Submit Handler
- **File**: `src/app/admin/internal/marketplace/page.tsx:117`
- **Issue**: Marketplace verification modal has a textarea and "Verify" button but no `onClick` handler wired to the API. Clicking does nothing.
- **Fix**: Wire the button to `POST /api/admin/marketplace/verify` with `{ orgId, notes }` body. Show success toast on completion.
- **Impact**: Marketplace partners can never be verified; feature is completely broken.
- **Status**: ⏳

### [H-13] Demo Mode Toggle Accessible in Production
- **Files**: `src/lib/demo/data/` (clients.ts, proposals.ts, trips.ts, notifications.ts), `src/components/DemoModeToggle.tsx`
- **Issue**: Demo mode shows GoBuddy Adventures fake data. If the toggle is visible in production (e.g., accessible via URL param or localStorage flag), real users see demo data instead of their own.
- **Fix**: (a) Gate `DemoModeToggle` with `process.env.NODE_ENV !== 'production'` check. (b) Add `NEXT_PUBLIC_DEMO_MODE_ENABLED=false` env var that disables the toggle entirely in production.
- **Impact**: Real operators see demo data; data integrity breach.
- **Status**: ⏳

### [H-14] WPPConnect Fallback Path — File Missing
- **CLAUDE.md reference**: Fallback WhatsApp path `src/lib/whatsapp-wppconnect.ts` should exist
- **Issue**: File does not exist. `src/app/api/_handlers/whatsapp/connect/route.ts:21` checks `WPPCONNECT_WEBHOOK_SECRET` but the implementation is absent. If Meta Cloud API fails, there is no fallback.
- **Fix**: Either (a) implement the WPPConnect client in `src/lib/whatsapp-wppconnect.ts` mirroring the Meta Cloud API interface, or (b) remove WPPConnect references entirely and document Meta Cloud as the only supported path.
- **Impact**: WhatsApp becomes unavailable if Meta Cloud API has downtime.
- **Status**: ⏳

### [H-15] ✅ enforceRateLimit on billing/contact-sales ← FIXED IN S37
- **Status**: ✅

### [H-16] ✅ enforceRateLimit on ai/pricing-suggestion, ai/suggest-reply, ai/draft-review-response ← FIXED IN S37
- **Status**: ✅

### [H-17] Proposal RLS — 13 `USING (true)` Policies on Write Operations
- **Tables**: `proposal_activities` (ALL), `proposal_add_ons` (UPDATE), `proposal_comments` (INSERT), `proposals` (SELECT), `proposal_days` (SELECT), `proposal_accommodations` (SELECT), `policy_embeddings` (SELECT), `geocoding_cache` (SELECT), `itinerary_embeddings` (SELECT), `assistant_conversations` (SELECT)
- **Issue**: These policies allow unauthenticated/anonymous access to read and write proposal data. While share tokens are validated at the application layer, if RLS is the only line of defense and the app has a bug, all proposal data is public.
- **Fix**: For write policies (`proposal_activities ALL`, `proposal_add_ons UPDATE`, `proposal_comments INSERT`): add a `WITH CHECK` clause that validates the proposal token exists in the request context via a Postgres function, OR accept this design and document it explicitly. For SELECT-only policies, accept as intentional for public proposal links.
- **Impact**: Application-layer bug = full proposal data exposure to unauthenticated users.
- **Status**: ⏳

### [H-18] Cascade DELETE Chains — No Soft-Delete or Audit Trail
- **Migrations**: Multiple (94 `ON DELETE CASCADE` constraints)
- **Issue**: Deleting an organization cascades through: `tour_templates` → `template_days` → `template_activities` → `template_accommodations` + proposals → days → activities → accommodations → comments → versions + notifications → delivery status. All permanently and silently deleted.
- **Fix**: Implement soft-delete pattern: add `deleted_at TIMESTAMPTZ` to high-value tables (`proposals`, `itineraries`, `tour_templates`, `clients`). Filter queries with `WHERE deleted_at IS NULL`. Retain data for 30 days before hard delete via pg_cron.
- **Impact**: Accidental org deletion wipes years of customer data permanently.
- **Status**: ⏳

### [H-19] Accessibility — Missing ARIA Labels and Focus Management
- **Issue**: Admin pages have no `aria-label` on icon buttons, no `role` attributes on custom interactive elements, no focus trap in modals.
- **Key gaps**: Icon-only buttons without `aria-label`, modals without `role="dialog"` and `aria-modal="true"`, tables without `aria-describedby`.
- **Fix**: Run `axe-core` automated a11y audit (`npx axe-core http://localhost:3000/admin`). Fix all WCAG 2.1 AA violations. Use shadcn/ui's built-in accessible primitives (Dialog, AlertDialog) which handle focus trapping.
- **Impact**: Screen reader users cannot use admin panel. Legal risk in regulated markets.
- **Status**: ⏳

---

## 🟡 MEDIUM — Fix Before Scale

### [M-01] Invoice Email Sender — Falls Back to Wrong Address
- **File**: `src/app/api/_handlers/invoices/send-pdf/route.ts:75–77`
- **Issue**: Sender email falls back: `WELCOME_FROM_EMAIL || RESEND_FROM_EMAIL || PROPOSAL_FROM_EMAIL`. If all three are missing, `senderEmail` is `undefined` and the email silently fails. No error thrown.
- **Fix**: `const senderEmail = process.env.PROPOSAL_FROM_EMAIL; if (!senderEmail) return apiError('Email not configured', 500);`
- **Status**: ⏳

### [M-02] Cron Auth Clock Skew Too Wide (5 Minutes)
- **File**: `src/lib/security/cron-auth.ts:80–90`
- **Issue**: 5-minute replay window is wide enough for an intercepted cron token to be replayed.
- **Fix**: Reduce to 60 seconds. Update Vercel cron configuration to account for the tighter window.
- **Status**: ⏳

### [M-03] CSRF Token Has No Rotation Mechanism
- **File**: `src/lib/security/admin-mutation-csrf.ts:52–72`
- **Issue**: `ADMIN_MUTATION_CSRF_TOKEN` is static in env vars. If leaked, cannot be revoked without redeployment.
- **Fix**: Document 90-day rotation in ops runbook. Consider versioned tokens (token-v1, token-v2) with grace period.
- **Status**: ⏳

### [M-04] Share Token Minimum Length Too Short (8 chars)
- **File**: `src/app/api/_handlers/portal/[token]/route.ts:50–70`
- **Issue**: Token validation accepts 8-character tokens. With [A-Za-z0-9_-] charset (64 chars), 8 chars = 64^8 ≈ 281 trillion combinations. At 30 req/min rate limit, brute force takes ~18 billion years. **Acceptable if tokens are cryptographically random.**
- **Fix**: Add assertion in token generation code that tokens are generated with `crypto.randomBytes(32).toString('base64url')` (43 chars). Document this invariant in code comment.
- **Status**: ⏳

### [M-05] Middleware Fail-Open Not Documented
- **File**: `src/middleware.ts:40–80`
- **Issue**: When Supabase profile lookup fails (outage), middleware allows unauthenticated users into protected routes. This is intentional (availability over security) but undocumented.
- **Fix**: Add comment: `// Fail-open by design: Supabase outage should not lock legitimate users out. This trades security for availability.`
- **Status**: ⏳

### [M-06] Silent JSON Parse Failures in 15+ Handlers
- **Files**: `src/app/api/_handlers/bookings/flights/search/route.ts:114`, `bookings/hotels/search/route.ts:91,121`, `invoices/send-pdf/route.ts:106`, `reputation/sync/route.ts:130`, + 10 more
- **Issue**: Pattern `response.json().catch(() => ({}))` silently returns empty object on parse failure. Bugs in external API responses are swallowed without logging.
- **Fix**: `const data = await response.json().catch((e) => { logError('Failed to parse API response', e); return {}; });`
- **Status**: ⏳

### [M-07] Race Condition in Reputation AI Respond
- **File**: `src/app/api/_handlers/reputation/ai/respond/route.ts:157`
- **Issue**: Comment in code acknowledges: `// Return a fallback object if insert fails (e.g. race condition)`. Race condition is known but unresolved. Response may fail to persist.
- **Fix**: Use `INSERT ... ON CONFLICT DO UPDATE` (upsert) to make the operation idempotent.
- **Status**: ⏳

### [M-08] itinerary/generate — No Timeout on External AI API Calls
- **File**: `src/app/api/_handlers/itinerary/generate/route.ts`
- **Issue**: OpenAI, Groq, and Gemini calls are not wrapped with timeout signals. If any external API hangs, the handler uses the full 60-second Vercel timeout without user feedback.
- **Fix**: `const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 30_000); const result = await aiClient.complete({ signal: controller.signal }); clearTimeout(timeout);`
- **Status**: ⏳

### [M-09] itinerary/generate — No Streaming Response (60-Second Silent Wait)
- **File**: `src/app/api/_handlers/itinerary/generate/route.ts`
- **Issue**: Handler generates the entire itinerary before responding. Users wait up to 60 seconds with no feedback.
- **Fix**: Convert to streaming SSE response. Send partial results as each day is generated. Client displays days as they arrive.
- **Status**: ⏳

### [M-10] Profiles Table Allows Public Enumeration
- **Migration**: `20240206000000_init_schema.sql:61–63`
- **Policy**: `"Public profiles are viewable by everyone" USING (true)`
- **Issue**: Any authenticated user can list all profiles across all organizations. Enables user enumeration and harvesting full names/avatars.
- **Fix**: Restrict to: `USING (organization_id = (select organization_id from public.profiles where id = auth.uid()))` — users can only see profiles in their own org.
- **Status**: ⏳

### [M-11] Missing FK Indexes on Queue/Notification Tables
- **Tables**: `notification_queue`, `notification_dead_letters`, `pdf_extraction_queue`
- **Issue**: Queue processing cron jobs join these tables on FK columns without indexes, causing sequential scans.
- **Fix**: Add migration:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_notification_queue_notification_id ON public.notification_queue(notification_id);
  CREATE INDEX IF NOT EXISTS idx_notification_dead_letters_queue_id ON public.notification_dead_letters(queue_id);
  CREATE INDEX IF NOT EXISTS idx_pdf_extraction_queue_import_id ON public.pdf_extraction_queue(import_id);
  ```
- **Status**: ⏳

### [M-12] 13 Placeholder Migrations — Schema History Gaps
- **Files**: 13x `*_remote_migration_placeholder.sql` in `supabase/migrations/`
- **Issue**: Cannot audit what changed during these periods. Schema history is incomplete. Rollback planning is impossible for those periods.
- **Fix**: Document in `supabase/migrations/README.md` what each placeholder represents. If the changes are in the DB but not in code, run `supabase db diff` to capture them into proper migration files.
- **Status**: ⏳

### [M-13] CASCADE DELETE on auth.users Loses Creator Attribution
- **Issue**: Tables like `pdf_imports.created_by`, `tour_templates.created_by` use `ON DELETE CASCADE` referencing `auth.users`. If a user is deleted, all their created content is permanently deleted.
- **Fix**: Change to `ON DELETE SET NULL` for `created_by` columns. This preserves content while marking the creator as deleted. Add `original_creator_name TEXT` for audit purposes.
- **Status**: ⏳

### [M-14] Text Fields Missing Length Constraints
- **Tables**: `workflow_notification_rules.lifecycle_stage`, `proposal_comments.comment`, `notification_logs.message`, `shared_itineraries.title`, `shared_itineraries.description`
- **Issue**: Unconstrained TEXT fields can store GB-sized values, causing query slowness and DB bloat.
- **Fix**: Add `CHECK (char_length(column) <= N)` constraints. Suggested limits: comments 5000, titles 255, lifecycle stages 100.
- **Status**: ⏳

### [M-15] Offline PWA Mutation IDs Using Math.random()
- **File**: `src/lib/pwa/offline-mutations.ts:39`
- **Code**: `` `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` ``
- **Issue**: `Math.random()` is not cryptographically random. If two users go offline simultaneously on the same device clock, IDs can collide.
- **Fix**: `const id = \`offline-${Date.now()}-${crypto.randomUUID()}\`;`
- **Status**: ⏳

### [M-16] DriversPageClient.tsx — 800 Lines, 76 State Variables
- **File**: `src/app/drivers/DriversPageClient.tsx` (800 lines)
- **Issue**: Single component with 76 `useState` calls. Extremely difficult to test and debug. Any change to driver state risks unintended re-renders across the entire page.
- **Fix**: Extract into: `DriverSearchBar.tsx`, `DriverTable.tsx`, `DriverFormModal.tsx`, `DriverAccountLinker.tsx`. Use `useReducer` instead of 76 `useState` calls.
- **Status**: ⏳

### [M-17] AdminRevenueView.tsx — 794 Lines, Mixed Data and Rendering
- **File**: `src/features/admin/revenue/AdminRevenueView.tsx` (794 lines)
- **Issue**: Data fetching, business logic, and rendering all in one file. Hard to test individual chart components.
- **Fix**: Extract: `RevenueChartSection.tsx`, `RevenueTableSection.tsx`, `RevenueFiltersPanel.tsx`, `useRevenueData.ts` (custom hook).
- **Status**: ⏳

### [M-18] CreateTripModal.tsx — 774 Lines
- **File**: `src/components/CreateTripModal.tsx` (774 lines)
- **Fix**: Extract: `SavedItineraryImporter.tsx`, `AIItineraryGenerator.tsx`, `ItineraryImportTabs.tsx`
- **Status**: ⏳

### [M-19] itinerary/generate/route.ts — 749 Lines
- **File**: `src/app/api/_handlers/itinerary/generate/route.ts` (749 lines)
- **Fix**: Extract: `src/lib/itinerary/orchestrator.ts` (AI orchestration), `src/lib/itinerary/prompt-builder.ts` (prompt construction), `src/lib/itinerary/result-assembler.ts` (post-processing)
- **Status**: ⏳

### [M-20] Missing React.memo on List Components
- **Files**: `src/app/trips/TripCardGrid.tsx`, admin client rows in `src/app/admin/page.tsx`
- **Issue**: List items re-render on every parent state change.
- **Fix**: Wrap per-item components with `React.memo()`. Memoize event handlers with `useCallback`.
- **Status**: ⏳

### [M-21] No Caching for Frequently-Read Data (Clients, Proposals)
- **Files**: `src/app/api/_handlers/admin/clients/route.ts`, `src/app/api/_handlers/proposals/`
- **Issue**: Client and proposal lists are fetched fresh on every request. No Redis or Next.js cache layer.
- **Fix**: Use `unstable_cache` from Next.js for server component fetches. Use Upstash Redis cache (5min TTL) for API handler responses. Invalidate on mutations.
- **Status**: ⏳

### [M-22] Duplicate HTTP Fetch Pattern in 20+ Handlers
- **Files**: `src/app/api/_handlers/bookings/flights/search/route.ts`, `bookings/hotels/search/route.ts`, + 18 more
- **Issue**: `fetch()` → check `.ok` → parse JSON with `.catch(() => ({}))` repeated everywhere with slight variations.
- **Fix**: Create `src/lib/fetch-json.ts`: `async function fetchJson<T>(url: string, options?: RequestInit): Promise<T>` with proper error handling.
- **Status**: ⏳

---

## 🟢 LOW — Polish Before GA

### [L-01] Auth Rate Limit Headers Expose Remaining Count
- **File**: `src/app/api/_handlers/auth/password-login/route.ts:32–37`
- **Issue**: `x-ratelimit-remaining` header tells attackers exactly when to retry.
- **Fix**: Remove `x-ratelimit-remaining`. Keep only `x-ratelimit-limit` and `x-ratelimit-reset`.
- **Status**: ⏳

### [L-02] Cron Replay Window — In-Memory Fallback
- **File**: `src/lib/security/cron-auth.ts:100–120`
- **Issue**: Redis-backed replay detection falls back to in-memory on cold starts (same as C-08).
- **Fix**: Same as C-08 — require Redis in production.
- **Status**: ⏳

### [L-03] Webhook Invalid Signature Not Rate-Limited Before Logging
- **File**: `src/app/api/_handlers/whatsapp/webhook/route.ts:126–152`
- **Issue**: Each invalid signature attempt inserts a row into `whatsapp_webhook_events`. 1000 requests/min = 1000 DB inserts/min.
- **Fix**: Check rate limit BEFORE logging: if same IP has failed >10 times in 1 minute, drop the log entry.
- **Status**: ⏳

### [L-04] No Org ID Validation at Auth Layer
- **File**: `src/lib/auth/admin.ts:80–120`
- **Issue**: `requireAdmin()` doesn't optionally validate that the org in the request body matches the user's org.
- **Fix**: Add optional `validateOrgId?: string` parameter. If provided: `if (user.organization_id !== validateOrgId) return 403`.
- **Status**: ⏳

### [L-05] Supabase Pay Page Import at Wrong Abstraction Level
- **File**: `src/app/pay/[token]/page.tsx:3`
- **Issue**: Page-level import of `createAdminClient` is semantically risky — even if currently safe (server component), it's easy for a future developer to accidentally use this in a client component.
- **Fix**: Move admin client usage to a dedicated server action or server-only utility function imported from `src/lib/payments/`.
- **Status**: ⏳

### [L-06] Math.random() in Review Template Selection
- **File**: `src/app/api/_handlers/social/reviews/public/route.ts:204`
- **Issue**: Random template selection means retried requests use different templates.
- **Fix**: Make selection deterministic: `const idx = reviewId.charCodeAt(0) % reviewTemplateIds.length`.
- **Status**: ⏳

### [L-07] Math.random() in Network Retry Jitter
- **File**: `src/lib/network/retry.ts:54`
- **Issue**: Non-deterministic jitter makes retry logic untestable.
- **Fix**: Accept optional seeded `random` function parameter for tests. Default to `Math.random()` in production.
- **Status**: ⏳

### [L-08] Health Check WhatsApp Error Not Granular
- **File**: `src/app/api/_handlers/health/route.ts:224–230`
- **Issue**: Health check reports WhatsApp as failed without distinguishing missing `WHATSAPP_TOKEN` vs missing `WHATSAPP_PHONE_ID`.
- **Fix**: Return `{ status: 'unconfigured', missing: ['WHATSAPP_TOKEN'] }` with specific missing var names.
- **Status**: ⏳

### [L-09] PostGIS Extension — Verify Still Needed
- **Migration**: `20240206000000_init_schema.sql`
- **Issue**: PostGIS extension enabled. Recent migrations don't use PostGIS functions. If unused, it adds DB startup overhead.
- **Fix**: Search for `ST_`, `geography`, `geometry`, `postgis` in all migrations. If only in init schema, document as required for `locations` table. If not used, add migration to `DROP EXTENSION IF EXISTS postgis`.
- **Status**: ⏳

### [L-10] Missing NOT NULL Constraints on Business-Critical Fields
- **Tables**: `notification_logs.message`, `trip_accommodations.check_out_date`, `shared_itineraries.description`
- **Fix**: Add `ALTER TABLE ... ALTER COLUMN ... SET NOT NULL` migration with `DEFAULT ''` or `DEFAULT NOW()` for existing NULLs.
- **Status**: ⏳

### [L-11] Large Admin Files Need client-profile and LeadToBookingFlow Split
- **Files**: `src/app/clients/[id]/client-profile-page-content.tsx` (764), `src/components/leads/LeadToBookingFlow.tsx` (748), `src/app/proposals/[id]/page.tsx` (738), `src/app/api/_handlers/admin/clients/route.ts` (737)
- **Fix**: Refactor following same pattern as [M-16]–[M-19].
- **Status**: ⏳

### [L-12] No Lazy Loading for Heavy Animation Libraries
- **Packages**: `@splinetool/react-spline`, `gsap`, `framer-motion`, `@tsparticles/*`
- **Issue**: Animation libraries (~800KB) loaded on all pages, not just marketing/home page.
- **Fix**: `const SplineScene = dynamic(() => import('@splinetool/react-spline'), { ssr: false });`
- **Status**: ⏳

### [L-13] Inconsistent DB Naming Conventions
- **Issue**: Mix of `provider_key_id` vs `payment_method_id`, some column names not matching table names.
- **Fix**: Document and standardize in `supabase/SCHEMA_CONVENTIONS.md`. Apply on next migration that touches affected tables.
- **Status**: ⏳

### [L-14] Embedding Vector Dimensions Not Validated at Runtime
- **Issue**: All embeddings use `vector(1536)` (OpenAI text-embedding-3-small). If model is changed to 3-large (3072 dims), inserts will fail silently.
- **Fix**: Add assertion in embedding generation code: `if (embedding.length !== 1536) throw new Error(...)`. Document in `src/lib/embeddings.ts`.
- **Status**: ⏳

---

## Production Readiness Checklist

When ALL items above are ✅ or 📝, run this checklist before going live:

### Infrastructure
- [ ] All 60+ env vars set in Vercel production dashboard
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` configured (rate limiting + caching)
- [ ] `CRON_SECRET` set and rotated from default
- [ ] `ADMIN_MUTATION_CSRF_TOKEN` set to a strong random value
- [ ] `SENTRY_DSN` configured for error tracking
- [ ] `SOCIAL_PUBLISH_MOCK_ENABLED` NOT set (or set to `false`) in production
- [ ] Custom domain configured in Vercel
- [ ] Vercel production deployment tested end-to-end

### Database
- [ ] All RLS policies enabled and tested (`supabase db lint`)
- [ ] Soft-delete implemented for high-value tables (or CASCADE risk documented)
- [ ] All FK indexes present (`supabase inspect db seq-scans`)
- [ ] Staging → production migration tested with real data volume

### Payments
- [ ] Razorpay live keys (not test keys) configured
- [ ] Webhook endpoint registered in Razorpay dashboard
- [ ] Payment flow E2E tested with real card (not just test mode)
- [ ] Idempotency tested (retry → no duplicate charge)

### Monitoring
- [ ] Sentry error tracking configured and tested
- [ ] PostHog analytics events verified firing
- [ ] Health check endpoint returning `healthy` for all services
- [ ] Uptime monitoring configured (UptimeRobot or similar)
- [ ] Log aggregation configured (Vercel Log Drains or Axiom)

### Security
- [ ] `/review-deep` returns **49+/60** with no CRITICAL/HIGH findings
- [ ] `npm audit` returns 0 high severity vulnerabilities
- [ ] Penetration test on auth and payment flows
- [ ] GDPR/data retention policy documented

---

## Fix Priority Order (Suggested Sprints)

### Sprint 1 — Payment Safety + Data Integrity (3 days)
C-04, C-05, H-03 (payment idempotency + webhook dedup)
C-06 (enable RLS on 2 missing tables)
C-07 (env validation)

### Sprint 2 — Core Product (3 days)
C-01 (real analytics data)
C-03 (billing checkout)
H-12 (marketplace verification)
H-01, H-02 (subscription enforcement)

### Sprint 3 — Security Hardening (2 days)
C-02 (social mock mode guard)
C-08 (Redis required in prod)
H-04 (unsigned webhook guard)
H-05 (brute force rate limiting)
H-17 (proposal RLS review)

### Sprint 4 — UX Performance (3 days)
H-08 (loading.tsx for 77 routes)
H-09 (convert client pages to server components)
H-10 (26 img → next/image)
H-11 (team pagination fix)

### Sprint 5 — Reliability (2 days)
H-06 (cron idempotency)
H-07 (fire-and-forget async)
M-08 (AI API timeouts)
M-06 (silent JSON failures)

### Sprint 6 — Code Quality (3 days)
M-16–M-22 (large files, missing cache, duplicate patterns)

### Sprint 7 — Polish (2 days)
All remaining MEDIUM and LOW items

---

*When all ⏳ items become ✅ or 📝, run `/review-deep` to get the official production-ready verdict.*
*Target score: **55+/60** (Security ≥9, Architecture ≥7, Performance ≥8, Error Handling ≥9, Test Coverage 10, Type Safety 10)*
