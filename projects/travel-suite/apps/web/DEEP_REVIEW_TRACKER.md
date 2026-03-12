# Deep Code Review — Remediation Tracker

**Branch**: `fix/deep-review-remediation`
**Date**: 2026-03-11
**Source**: Deep Code Review (12-section audit, score 6.4/10)

---

## Revised Findings After Agent Verification

Several items from the initial review were **already implemented** and scored incorrectly:

| Original Finding | Actual Status | Action |
|-----------------|---------------|--------|
| Payment webhook not idempotent | **Already idempotent** — 3-layer dedupe (invoice_payments.reference, payment_events.external_id, payment link tracking) | No fix needed |
| Bearer token timing attack | **Already safe** — `crypto.timingSafeEqual()` in `safe-equal.ts` | No fix needed |
| Debug endpoint exposes config | **Already guarded** — disabled in prod, requires admin auth | No fix needed |
| Share token enumeration | **Already mitigated** — `crypto.randomUUID()` + rate limiting (60/15min read, 20/15min write) + expiration | No fix needed |
| Missing global error boundary | **Already exists** — `error.tsx` + `global-error.tsx` with Sentry | No fix needed |
| @tanstack/react-query unused | **Actively used** — 16 files, QueryClientProvider configured | No fix needed |
| No circuit breaker | Vercel hobby plan — serverless functions are stateless, circuit breaker pattern N/A | Won't fix |
| Dead letter queue | Vercel hobby plan — no persistent worker process | Won't fix |

---

## Actionable Fixes

### FIX-001: Split LayoutRenderer.tsx (P1-High, Effort: High)
- **File**: `src/components/social/templates/layouts/LayoutRenderer.tsx` (1,895 lines)
- **Plan**: Extract into 7-9 files:
  - `utils/layout-helpers.ts` — SERVICE_ICONS, getServiceIcon, getPalette, resolveGalleryImages
  - `PosterFooter.tsx` — shared footer component
  - `CenterLayout.tsx` + `ElegantLayout.tsx`
  - `SplitLayout.tsx` + `BottomLayout.tsx`
  - `ReviewLayout.tsx` + `CarouselSlideLayout.tsx`
  - `ServiceShowcaseLayout.tsx` + `HeroServicesLayout.tsx`
  - `InfoSplitLayout.tsx` + `GradientHeroLayout.tsx`
  - `DiagonalSplitLayout.tsx` + `MagazineCoverLayout.tsx`
  - `DuotoneLayout.tsx` + `BoldTypographyLayout.tsx`
  - `LayoutRenderer.tsx` — slim router that imports all layouts
- **Outcome**: Each file 150-300 lines, easier to test/review
- **Status**: [ ]

### FIX-002: Add AbortController to 4 polling components (P1-High, Effort: Low)
- `src/components/whatsapp/WhatsAppConnectModal.tsx` (lines 124, 144) — QR + status polling
- `src/components/payments/PaymentLinkButton.tsx` (line 64) — payment status polling
- `src/components/payments/PaymentTracker.tsx` (line 95) — payment link polling
- **Outcome**: No memory leaks on unmount, no race conditions
- **Status**: [ ]

### FIX-003: Generate Supabase TypeScript types (P2-Medium, Effort: Low)
- **Current**: `src/types/supabase.ts` is empty (0 lines)
- **Real types**: Already exist in `src/lib/supabase/types.ts`
- **Plan**: Delete empty file, verify `src/lib/supabase/types.ts` is used everywhere
- **Outcome**: No confusion about where types live
- **Status**: [ ]

### FIX-004: Remove top `as any` casts (P2-Medium, Effort: Medium)
- **Total**: 112 casts across 49 files
- **Root cause**: Supabase types not regenerated for new tables
- **Plan**: After FIX-003, regenerate types and fix top offenders:
  - `lib/reputation/` (20 casts)
  - `lib/assistant/` (17 casts)
  - `app/api/_handlers/admin/` (28 casts)
- **Outcome**: Compile-time catches instead of runtime errors
- **Status**: [ ]

### FIX-005: Audit map library redundancy (P2-Medium, Effort: Low)
- **Finding**: Only `leaflet` + `react-leaflet` used (in ItineraryMap.tsx)
- **maplibre-gl**: NOT found in codebase
- **Plan**: Verify maplibre-gl is not in package.json; if it is, remove it
- **Outcome**: Smaller bundle, no redundant dependency
- **Status**: [ ]

### FIX-006: Replace console.log in API handlers (P2-Medium, Effort: Medium)
- **Plan**: Create `src/lib/logger.ts` structured logger, replace console.log in handlers
- **Outcome**: Consistent logging with log levels, easier debugging in Vercel logs
- **Status**: [ ]

### FIX-007: Extract hardcoded magic numbers (P2-Medium, Effort: Low)
- Rate limit values, retry delays, polling intervals
- **Plan**: Create `src/lib/constants.ts` for shared values
- **Outcome**: Single source of truth for config values
- **Status**: [ ]

### FIX-008: Add memoization to heavy components (P1-High, Effort: Medium)
- ProposalBuilder, Calendar, Dashboard components
- **Plan**: Add useMemo for expensive computations, useCallback for event handlers
- **Outcome**: Fewer unnecessary re-renders
- **Status**: [ ]

### FIX-009: Standardize API response envelope (P2-Medium, Effort: Medium)
- Some handlers return `{ data }`, others `{ success, data }`, others `{ items, total }`
- **Plan**: Define standard `ApiResponse<T>` type, update handlers
- **Outcome**: Consistent client-side error handling
- **Status**: [ ]

### FIX-010: Playwright E2E tests for changes (P0, Effort: Medium)
- Test LayoutRenderer still renders all 15 layouts correctly after split
- Test payment components still function after AbortController changes
- Test WhatsApp QR flow still works
- **Status**: [ ]

### FIX-011: Run QA suite + update qa-log (P0, Effort: Low)
- `npm run lint && npm run typecheck && npm run test:coverage`
- Update `qa-log.md` with results
- **Status**: [ ]

---

## Execution Order

1. FIX-003 — Delete empty types file (quick win, unblocks FIX-004)
2. FIX-005 — Audit map packages (quick win)
3. FIX-007 — Extract constants (quick win)
4. FIX-002 — AbortController cleanup (low effort, high impact)
5. FIX-006 — Structured logger (foundation for other fixes)
6. FIX-001 — Split LayoutRenderer (largest change)
7. FIX-008 — Memoization pass
8. FIX-009 — API envelope standardization
9. FIX-004 — Remove `as any` casts (after types are clean)
10. FIX-010 — Playwright tests
11. FIX-011 — QA suite + qa-log update

---

## Constraints

- **Vercel Hobby Plan**: 2 cron slots max, 60s function timeout
- **No breaking changes**: All fixes must be backward-compatible
- **Periodic commits**: Commit after each FIX group
- **Tests before merge**: Full E2E + unit suite must pass before merging to main
