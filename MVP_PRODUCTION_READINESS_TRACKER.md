# MVP Production Readiness Tracker

**Audit Date:** 2026-03-15 | **Commit:** b74e03b | **Scope:** Web app only
**Codebase:** 1,269 files | 220,556 lines | 98 pages | 6 catch-all API routes (269 handlers)

## Current Status

| Check | Result |
|-------|--------|
| TypeScript (`tsc --noEmit`) | PASS |
| ESLint (`--max-warnings=0`) | FAIL (3 warnings) |
| Unit Tests (55 files, 748 assertions) | PASS |
| E2E Tests (30 specs) | NOT VERIFIED |
| Security Posture | STRONG (16/16 categories pass) |
| Test Coverage (mapped modules) | ~80% on 60 modules |
| Test Coverage (full codebase) | ~4.3% (55 test files / 1,269 src files) |

---

## Severity Levels

- **BLOCKER** — Must fix before any production traffic
- **HIGH** — Must fix before public launch
- **MEDIUM** — Should fix for quality MVP
- **LOW** — Nice to have, fix post-launch
- **ACCEPTED** — Known trade-off, documented decision

---

## BLOCKER (3 items)

### B-01: ESLint fails with 3 warnings (zero-tolerance policy)
- **Files:**
  - `src/components/marketing/effects/AnimatedFlightPath.tsx:3` — unused `useRef`
  - `src/components/marketing/effects/AnimatedFlightPath.tsx:4` — unused `useTransform`
  - `src/components/marketing/effects/SpotlightCard.tsx:3` — unused `useEffect`
- **Fix:** Remove unused imports
- **Effort:** 5 min
- [ ] Fixed
- [ ] Verified

### B-02: Mock Razorpay payment endpoint returns fake orders
- **File:** `src/app/api/_handlers/payments/razorpay/route.ts`
- **Risk:** Returns realistic payment objects that could be misused in production
- **Fix:** Add `process.env.NODE_ENV !== 'production'` guard or remove entirely; use Razorpay test mode keys for dev
- **Effort:** 15 min
- [ ] Fixed
- [ ] Verified

### B-03: Demo data file active without feature flag
- **File:** `src/lib/demo-data.ts` (entire file) + `src/lib/integrations.ts:71`
- **Risk:** DEMO_ORG_ID and mock data injected without env-based gate
- **Fix:** Gate all demo data behind `NEXT_PUBLIC_DEMO_MODE=true` env var
- **Effort:** 30 min
- [ ] Fixed
- [ ] Verified

---

## HIGH (19 items)

### H-01: 93 pages missing SEO metadata
- **Scope:** 98 total pages, only 5 have `metadata` or `generateMetadata` exports
- **Priority pages for MVP:**
  - `src/app/(marketing)/page.tsx` — Homepage (likely has it)
  - `src/app/(marketing)/pricing/page.tsx` — Pricing
  - `src/app/(marketing)/about/page.tsx` — About
  - `src/app/(marketing)/blog/page.tsx` — Blog index
  - `src/app/(marketing)/demo/page.tsx` — Demo
  - `src/app/(marketing)/solutions/page.tsx` — Solutions
  - `src/app/auth/page.tsx` — Login
- **Fix:** Add `export const metadata = { title, description, openGraph }` to all marketing + auth pages minimum
- **Effort:** 2 hours (marketing pages) + 4 hours (all app pages)
- [ ] Marketing pages done
- [ ] Auth pages done
- [ ] Admin/app pages done

### H-02: 85 pages missing loading.tsx
- **Scope:** 98 pages, only 13 have loading.tsx
- **Fix:** Add loading.tsx with skeleton/spinner to all route groups that fetch data
- **Priority:** All admin routes, client-facing routes
- **Effort:** 3 hours
- [ ] Fixed
- [ ] Verified

### H-03: 24 files over 600 lines (8 over 750)
- **Files requiring decomposition (>750 lines):**
  1. `src/app/drivers/DriversPageClient.tsx` — 799 lines
  2. `src/features/admin/revenue/AdminRevenueView.tsx` — 794 lines
  3. `src/lib/whatsapp/india-templates.ts` — 786 lines (data file — ACCEPTED)
  4. `src/components/CreateTripModal.tsx` — 773 lines
  5. `src/app/clients/[id]/client-profile-page-content.tsx` — 763 lines
  6. `src/app/api/_handlers/itinerary/generate/route.ts` — 755 lines
  7. `src/components/leads/LeadToBookingFlow.tsx` — 748 lines
  8. `src/app/proposals/[id]/page.tsx` — 738 lines
  9. `src/app/api/_handlers/admin/clients/route.ts` — 737 lines
  10. `src/app/p/[token]/page.tsx` — 736 lines
  11. `src/app/admin/notifications/page.tsx` — 735 lines
- **Fix:** Extract sub-components; keep parent under 400 lines, children 60+ lines each
- **Effort:** 1-2 hours per file
- [ ] DriversPageClient.tsx split
- [ ] AdminRevenueView.tsx split
- [ ] CreateTripModal.tsx split
- [ ] client-profile-page-content.tsx split
- [ ] itinerary/generate handler split
- [ ] LeadToBookingFlow.tsx split
- [ ] proposals/[id]/page.tsx split
- [ ] admin/clients handler split
- [ ] p/[token]/page.tsx split
- [ ] admin/notifications/page.tsx split

### H-04: WhatsApp inbox uses mock data instead of real API
- **Files:**
  - `src/components/whatsapp/inbox-mock-data.ts` — 374 lines of mock conversations
  - `src/components/whatsapp/useInboxData.ts` — consumes mock data
  - `src/components/whatsapp/UnifiedInboxContextPanel.tsx` — renders mock data
- **Fix:** Replace mock data with real Supabase queries; keep mock file for dev/demo only
- **Effort:** 4 hours
- [ ] Fixed
- [ ] Verified

### H-05: Console statements in production code
- **Scope:** 618 console.log/error/warn statements across codebase
- **Key files with multiple console.error:**
  - `src/app/admin/notifications/page.tsx` — 9 instances
  - `src/components/admin/ProposalAddOnsManager.tsx` — 6+ instances
  - `src/app/add-ons/page.tsx` — 4 instances
  - `src/app/admin/tour-templates/create/page.tsx` — 5 instances
  - `src/components/CreateTripModal.tsx` — 4 instances
  - `src/components/payments/RazorpayModal.tsx` — 2 instances
  - `src/components/payments/PaymentTracker.tsx` — 1 instance
  - `src/components/payments/PaymentLinkButton.tsx` — 1 instance
  - `src/components/planner/PricingManager.tsx` — 1 instance
  - `src/components/planner/ApprovalManager.tsx` — 1 instance
  - `src/components/ShareTripModal.tsx` — 1 instance
  - `src/components/marketing/HeroScreens.tsx` — 1 instance
  - `src/components/whatsapp/WhatsAppConnectModal.tsx` — 1 instance
  - `src/components/client/ProposalAddOnsSelector.tsx` — 1 instance
  - `src/components/ui/map/map-core.tsx` — 1 instance
  - `src/components/layout/useNavCounts.ts` — 1 instance
- **Fix:** Replace with `logError()` from `src/lib/observability/logger.ts`
- **Note:** `console.log/warn/error` in `src/lib/observability/logger.ts` itself is ACCEPTED
- **Effort:** 3 hours
- [ ] Fixed
- [ ] Verified

### H-06: Type safety issues — double casts and missing null checks
- **Files:**
  1. `src/lib/rag-itinerary.ts:116` — `as unknown as (...)` double cast on supabase.rpc
  2. `src/lib/rag-itinerary.ts:245-246` — JSON.parse without null check on `.content`
  3. `src/lib/pdf-extractor.ts:330` — `as unknown as PdfImportProcessRow | null` double cast
  4. `src/lib/pdf-extractor.ts:407` — `as unknown as PdfImportPublishRow | null` double cast
  5. `src/lib/geocoding-with-cache.ts:343` — unchecked `data as UsageStatsData` cast
  6. `src/app/api/_handlers/assistant/quick-prompts/route.ts:59` — unsafe `as { prompts: unknown }` cast
  7. `src/app/api/_handlers/portal/[token]/route.ts` — `unknown` params without narrowing
  8. `src/app/api/_handlers/bookings/hotels/search/route.ts:51` — `hotel.distance as { value?: unknown }` cast
- **Fix:** Add proper type guards, Zod schemas, or null checks before access
- **Effort:** 2 hours
- [ ] Fixed
- [ ] Verified

### H-07: Silent error swallowing in critical paths
- **Files:**
  1. `src/lib/geocoding.ts:109-117` — `.catch(() => null)` with no logging
  2. `src/lib/geocoding-with-cache.ts:34,56,63,94` — 4x `.catch(() => null)` with no logging
  3. `src/lib/embeddings.ts:81-84` — errors collected but not logged individually
  4. `src/hooks/useUserTimezone.ts:95` — empty catch block
  5. `src/lib/email.ts:55-61` — fetchWithRetry failure silently returns null
- **Fix:** Add `logError(context, error)` before returning null
- **Effort:** 1 hour
- [ ] Fixed
- [ ] Verified

### H-08: Client-side API calls that should be server-side queries
- **Files (pages making fetch() to own API instead of direct DB query):**
  1. `src/app/bookings/page.tsx:70,109` — fetches `/api/itineraries`
  2. `src/app/add-ons/page.tsx:101,119,195,238,267` — fetches `/api/add-ons`
  3. `src/app/admin/notifications/page.tsx` — fetches 8 different `/api/admin/*` endpoints
  4. `src/app/(superadmin)/god/page.tsx:63` — fetches `/api/superadmin/overview`
  5. `src/app/(superadmin)/god/analytics/page.tsx:117,130` — fetches `/api/superadmin/analytics/*`
- **Fix:** Use server components with direct Supabase queries, or React Query hooks
- **Effort:** 4 hours
- [ ] Fixed
- [ ] Verified

### H-09: Missing input validation in API handlers
- **Files:**
  1. `src/app/api/_handlers/bookings/flights/search/route.ts:28-36` — query params without Zod schema
  2. `src/app/api/_handlers/bookings/hotels/search/route.ts` — missing Zod schema for search params
  3. `src/app/api/_handlers/assistant/quick-prompts/route.ts:50-74` — custom validator instead of Zod
  4. `src/app/api/_handlers/reputation/brand-voice/route.ts` — custom isStringArray instead of Zod
- **Fix:** Standardize all request validation on Zod schemas
- **Effort:** 2 hours
- [ ] Fixed
- [ ] Verified

### H-10: Hardcoded fallback URL in email.ts
- **File:** `src/lib/email.ts:26` — `https://your-app.vercel.app`
- **Risk:** Default URL visible to users if NEXT_PUBLIC_APP_URL not set
- **Fix:** Replace with `process.env.NEXT_PUBLIC_APP_URL ?? ''` and validate at startup
- **Effort:** 10 min
- [ ] Fixed
- [ ] Verified

### H-11: map-test page exposed in production
- **File:** `src/app/map-test/page.tsx`
- **Risk:** Development-only page accessible to all users
- **Fix:** Add `notFound()` if `NODE_ENV === 'production'`, or remove from production build
- **Effort:** 10 min
- [ ] Fixed
- [ ] Verified

### H-12: Cron secret naming inconsistency
- **File:** `.env.example:50-56`
- **Scope:** 5 different cron secret names: `ADMIN_CRON_SECRET`, `NOTIFICATION_CRON_SECRET`, `LOCATION_CLEANUP_CRON_SECRET`, `CRON_SIGNING_SECRET`, `CRON_SECRET`
- **Risk:** Misconfiguration in production deployment
- **Fix:** Consolidate to `CRON_SECRET` (single secret) or document which handler uses which
- **Effort:** 1 hour
- [ ] Fixed
- [ ] Verified

### H-13: Sentry/PostHog DSNs optional with no startup warning
- **Files:**
  - `sentry.server.config.ts` — DSN optional, fails silently
  - `src/components/analytics/PostHogProvider.tsx` — key optional
- **Risk:** Production running without error tracking and no one notices
- **Fix:** Log warning at startup if `NODE_ENV === 'production'` and DSN/key missing
- **Effort:** 15 min
- [ ] Fixed
- [ ] Verified

### H-14: Accessibility gaps across components
- **Scope:** Multiple components missing ARIA labels, roles, keyboard handling
- **Key areas:**
  - FAQ accordion buttons missing `aria-expanded` — `src/app/(marketing)/pricing/page.tsx:111`
  - Inbox tab buttons missing proper ARIA roles — `src/app/inbox/page.tsx:96-120`
  - Status indicators missing aria labels — `src/app/(superadmin)/god/page.tsx:211-217`
  - Feature selection buttons missing `aria-selected` — `src/app/(superadmin)/god/analytics/page.tsx:170-186`
  - Form inputs missing associated labels — `src/app/support/page.tsx`
  - Buttons without `aria-label` in demo components
- **Fix:** Audit all interactive elements, add ARIA attributes
- **Effort:** 4 hours
- [ ] Fixed
- [ ] Verified

### H-15: Missing TypeScript interfaces for 30+ component props
- **Key files:**
  - `src/components/glass/GlassCard.tsx`, `GlassModal.tsx`, `GlassButton.tsx`, `GlassBadge.tsx`
  - `src/components/god-mode/DrillDownTable.tsx`, `SlideOutPanel.tsx`
  - `src/components/social/templates/layouts/ThemeDecorations.tsx`
  - `src/components/marketing/effects/MagneticButton.tsx`, `FadeInOnScroll.tsx`, `ParallaxLayer.tsx`, `TiltCard.tsx`, `SpotlightCard.tsx`
  - `src/components/settings/TeamMemberCard.tsx`
  - `src/components/dashboard/InlineActionPanel.tsx`
  - `src/components/payments/PaymentTracker.tsx`
  - `src/components/layout/CommandPalette.tsx`, `AppShell.tsx`
  - `src/components/leads/SmartLeadCard.tsx`
  - `src/components/india/UPIPaymentModal.tsx`
  - `src/components/whatsapp/ContextActionModal.tsx`
- **Fix:** Add explicit `interface Props { }` for each component
- **Effort:** 3 hours
- [ ] Fixed
- [ ] Verified

### H-16: Webhook payload validation missing
- **File:** `src/lib/whatsapp.server.ts`
- **Risk:** Multiple `as Record<string, unknown>` casts on incoming webhook data
- **Fix:** Define strict Zod schemas for webhook payloads; validate before processing
- **Effort:** 2 hours
- [ ] Fixed
- [ ] Verified

### H-17: Duplicate WhatsApp webhook registration
- **File:** `src/app/api/[...path]/route.ts` — lines 122 and 125
- **Risk:** `webhooks/whatsapp` registered twice; first wins, second is dead code
- **Fix:** Remove duplicate registration
- **Effort:** 5 min
- [ ] Fixed
- [ ] Verified

### H-18: Inline styles in components (not Tailwind)
- **Key files with inline style= attributes:**
  - `src/components/demo/DemoTour.tsx:156-158` — Direct DOM style mutations
  - `src/components/demo/DemoModeBanner.tsx` — inline styles
  - `src/components/pdf/ProposalDocument.tsx:545` — inline fontSize, color
- **Fix:** Convert to Tailwind utility classes or CSS modules
- **Note:** `@react-pdf/renderer` components (`ProposalDocument`) require inline styles (PDF renderer limitation) — ACCEPTED for PDF
- **Effort:** 1 hour (non-PDF files)
- [ ] Fixed
- [ ] Verified

### H-19: Settings page has PlaceholderTab for billing & notifications
- **File:** `src/app/settings/page.tsx:195`
- **Risk:** Users see incomplete tabs
- **Fix:** Either implement billing/notifications settings or remove tabs from nav
- **Effort:** 2-8 hours depending on approach
- [ ] Fixed
- [ ] Verified

---

## MEDIUM (12 items)

### M-01: Test coverage only 4.3% of full codebase
- **Current:** 55 unit test files, 748 assertions, covers 60 explicitly mapped modules
- **Missing coverage for:**
  - All page components (0 render tests)
  - All UI components (~850 files, only 3 type tests)
  - Feature modules (admin, calendar, trip-detail)
  - Business logic: notifications, proposals/PDF, reputation scoring
  - Data access layer: most lib/queries
- **MVP minimum:** Add tests for critical business flows:
  - [ ] Payment creation and verification
  - [ ] Proposal generation and sharing
  - [ ] Trip CRUD operations
  - [ ] Auth flows (login, session refresh, logout)
  - [ ] Booking management
- **Effort:** 20+ hours for meaningful coverage improvement
- [ ] Critical path tests added
- [ ] Coverage improved

### M-02: Missing key props in JSX list maps
- **Files:**
  - `src/components/demo/DemoTour.tsx:284` — using index as key
  - `src/components/demo/WelcomeModal.tsx:133` — missing key prop
  - `src/components/assistant/ConversationHistory.tsx` — missing key props
  - `src/components/assistant/TourAssistantChat.tsx` — multiple map operations
- **Fix:** Add stable key props (use IDs, not indices)
- **Effort:** 30 min
- [ ] Fixed
- [ ] Verified

### M-03: Hardcoded pricing data on marketing page
- **File:** `src/app/(marketing)/pricing/page.tsx:25-103`
- **Data:** Starter (INR 999), Pro (INR 2499), Enterprise (Custom) + 6 FAQ items
- **Fix:** Move to CMS, database, or at minimum a constants file
- **Effort:** 1 hour
- [ ] Fixed
- [ ] Verified

### M-04: God/Superadmin page hardcoded system health
- **File:** `src/app/(superadmin)/god/page.tsx:126-139`
- **Issue:** `systemServices` array always shows "healthy" — not checking real service status
- **Fix:** Wire to actual health check endpoints
- **Effort:** 2 hours
- [ ] Fixed
- [ ] Verified

### M-05: Inconsistent validation patterns across handlers
- **Scope:** Some handlers use Zod, others use custom parsers (`parsePositiveInt`, `parseNumber`, custom `isStringArray`)
- **Fix:** Standardize on Zod for all request validation
- **Effort:** 4 hours
- [ ] Fixed
- [ ] Verified

### M-06: CSRF token fallback behavior
- **File:** `src/lib/security/admin-mutation-csrf.ts:60`
- **Issue:** If `ADMIN_MUTATION_CSRF_TOKEN` not set AND origin header missing, request may pass
- **Fix:** Log production warning if token not configured; require token in production
- **Effort:** 30 min
- [ ] Fixed
- [ ] Verified

### M-07: Missing library input validation
- **Files:**
  1. `src/lib/image-search.ts:38` — `getWikiImage(query)` no empty check
  2. `src/lib/geocoding.ts:76` — `geocodeLocation(location)` no format validation
  3. `src/lib/itinerary-cache.ts:86` — `saveItineraryToCache(data)` no shape validation
  4. `src/lib/rag-itinerary.ts:69` — `searchTemplates({...})` no param validation
- **Fix:** Add parameter guards at function entry
- **Effort:** 1 hour
- [ ] Fixed
- [ ] Verified

### M-08: Hardcoded brand strings
- **Files:**
  - `src/app/welcome/page.tsx:25` — "GoBuddy Adventures" (should be "TravelBuilt"?)
  - `src/app/admin/page.tsx:41` — "System Status: Operational" static string
  - `src/components/pdf/ProposalDocument.tsx:545` — "Phone: +91 XXX XXX XXXX" placeholder
  - `src/components/india/UPIPaymentModal.tsx:251` — "XXXXXXXXXXXX" placeholder
- **Fix:** Move to constants/config; ensure consistent branding
- **Effort:** 30 min
- [ ] Fixed
- [ ] Verified

### M-09: Debug endpoint has configuration leak risk
- **File:** `src/app/api/_handlers/debug/route.ts:11-25`
- **Status:** Gated behind `ENABLE_DEBUG_ENDPOINT=true` + admin auth
- **Risk:** If enabled in production, exposes geocoding and AI test endpoints
- **Fix:** Add explicit `NODE_ENV !== 'production'` check in addition to env var
- **Effort:** 10 min
- [ ] Fixed
- [ ] Verified

### M-10: Hardcoded color values instead of theme tokens
- **Files:**
  - `src/app/inbox/page.tsx:47-87` — `#25D366`, `#3b82f6`
  - `src/app/(marketing)/pricing/page.tsx` — `#00F0FF`, `#A259FF`, `#FF9933`
  - `src/app/(marketing)/about/page.tsx` — `#FF9933`, `#00F0FF`, `#A259FF`, `#ff3366`
  - `src/app/support/page.tsx:55-82` — hardcoded badge colors
- **Fix:** Use Tailwind theme colors or CSS variables
- **Effort:** 2 hours
- [ ] Fixed
- [ ] Verified

### M-11: WhatsApp dual-mode (WPPConnect + Meta Cloud) undocumented
- **File:** `.env.example:36-47`
- **Risk:** Code handles both implementations; unclear which is primary for production
- **Fix:** Document primary path in CLAUDE.md; add deprecation timeline for secondary
- **Effort:** 30 min
- [ ] Fixed
- [ ] Verified

### M-12: Cold start rate limit vulnerability
- **File:** `src/lib/security/rate-limit.ts:101-109`
- **Issue:** In-memory fallback resets on Vercel cold start; attacker could burst requests between cold starts
- **Status:** Production uses FAIL-CLOSED mode (rejects if Redis unavailable)
- **Fix:** Ensure Upstash Redis is always configured in production; add startup validation
- **Effort:** 15 min
- [ ] Fixed
- [ ] Verified

---

## LOW (8 items)

### L-01: 6 TODO/FIXME comments remaining
- **Scope:** 6 comments across codebase
- **Fix:** Resolve or convert to tracked issues
- **Effort:** 1 hour
- [ ] Fixed

### L-02: 29+ files with inline styles (non-PDF)
- **Fix:** Convert to Tailwind classes for consistency
- **Effort:** 3 hours
- [ ] Fixed

### L-03: Component tests are type-checks only
- **Files:** `tests/component/addons-types.test.ts`, `cost-types.test.ts`, `tour-template-types.test.ts`
- **Fix:** Add actual render/behavior tests using React Testing Library
- **Effort:** 8 hours
- [ ] Fixed

### L-04: Zustand store middleware inconsistency
- **Files:** `src/stores/ui-store.ts` (no persist) vs `src/stores/onboarding-store.ts` (with persist)
- **Fix:** Document intentional design decision
- **Effort:** 10 min
- [ ] Fixed

### L-05: OG image route bypasses catch-all pattern
- **File:** `src/app/api/og/route.tsx`
- **Status:** Uses Edge runtime (different requirements) — ACCEPTABLE
- **Fix:** Add comment documenting why this is a direct route
- **Effort:** 5 min
- [ ] Fixed

### L-06: PDF ProposalDocument inline styles
- **File:** `src/components/pdf/ProposalDocument.tsx`
- **Status:** ACCEPTED — `@react-pdf/renderer` requires inline style objects
- **Fix:** No action needed
- [x] Accepted

### L-07: DemoTour direct DOM manipulation
- **File:** `src/components/demo/DemoTour.tsx:156-158`
- **Fix:** Use data attributes + CSS classes instead of `element.style`
- **Effort:** 30 min
- [ ] Fixed

### L-08: Large data file (india-templates.ts)
- **File:** `src/lib/whatsapp/india-templates.ts` — 786 lines
- **Status:** ACCEPTED — data/configuration file, not logic
- [x] Accepted

---

## ACCEPTED DECISIONS (no action needed)

| ID | Decision | Reason |
|----|----------|--------|
| A-01 | CSP `unsafe-inline` | Next.js requirement |
| A-02 | No circuit breaker / dead letter queue | Vercel Hobby — stateless |
| A-03 | Both leaflet + maplibre-gl | Different use cases |
| A-04 | Polling intervals are contextual | Not magic numbers |
| A-05 | india-templates.ts 786 lines | Data file, not logic |
| A-06 | PDF inline styles | @react-pdf/renderer requirement |
| A-07 | OG route as direct route | Edge runtime requirement |
| A-08 | 60-module coverage scope | Deliberately scoped to critical paths |

---

## Execution Plan

### Phase 1: BLOCKERS (30 min)
Fix B-01, B-02, B-03 — required for any deployment.

### Phase 2: QUICK HIGH WINS (2 hours)
Fix H-10, H-11, H-12, H-13, H-17 — each under 15 min, high impact.

### Phase 3: CONSOLE CLEANUP (3 hours)
Fix H-05 — replace 618 console statements with structured logger.

### Phase 4: TYPE SAFETY & VALIDATION (4 hours)
Fix H-06, H-07, H-09, H-16 — eliminate unsafe casts and missing validation.

### Phase 5: SEO & LOADING STATES (6 hours)
Fix H-01, H-02 — add metadata and loading.tsx to all routes.

### Phase 6: COMPONENT DECOMPOSITION (12 hours)
Fix H-03 — split 10 files over 735 lines into sub-components.

### Phase 7: ARCHITECTURE IMPROVEMENTS (8 hours)
Fix H-04, H-08, H-19 — replace mock data, move to server components, implement placeholder features.

### Phase 8: ACCESSIBILITY (4 hours)
Fix H-14 — add ARIA labels, keyboard navigation, roles.

### Phase 9: PROP TYPES (3 hours)
Fix H-15 — add TypeScript interfaces to 30+ components.

### Phase 10: MEDIUM PRIORITY (ongoing)
Fix M-01 through M-12 as time permits.

---

## Re-Review Checklist

When all items above are fixed, the re-review will verify:

- [ ] `npm run lint` — 0 warnings
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run test` — all pass
- [ ] `npm run test:coverage` — meets thresholds
- [ ] `npm run build` — succeeds
- [ ] No `console.log/error/warn` in production code (except logger.ts)
- [ ] No `as unknown as` double casts
- [ ] No `.catch(() => null)` without logging
- [ ] All marketing pages have metadata
- [ ] All route groups have error.tsx + loading.tsx
- [ ] No files over 800 lines (except accepted data files)
- [ ] No mock data in production paths
- [ ] All form inputs have ARIA labels
- [ ] All list maps have stable key props
- [ ] All API handlers use Zod for validation
- [ ] No hardcoded secrets, URLs, or placeholder text
- [ ] Security audit: 16/16 categories still pass

**Target:** When all BLOCKERs + HIGHs are resolved, the app is MVP-ready for production traffic.
