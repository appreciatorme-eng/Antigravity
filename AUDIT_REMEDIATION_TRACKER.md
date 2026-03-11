# Audit Remediation Tracker — Antigravity Travel Suite
**Created**: 2026-03-11 | **Branch**: `fix/audit-remediation-s18` | **Audit Score**: 62/100

## Legend
- ✅ Done (committed)
- 🔄 In Progress
- ⏳ Pending
- 📝 Documented (no code change — risk accepted/documented)

---

## CRITICAL (8 findings)

| ID | Title | File | Action | Outcome | Status |
|----|-------|------|--------|---------|--------|
| C-01 | CORS wildcard on all API routes | `src/lib/api-dispatch.ts:183` | Replace `*` with env-based `ALLOWED_ORIGINS` allowlist | Cross-origin requests blocked except from allowed domains | ✅ |
| C-02 | Fire-and-forget webhook processing | `src/app/api/_handlers/whatsapp/webhook/route.ts:200-210` | Wrap with `after()` from `next/server` (Next.js 15+) | Promises survive serverless GC | ✅ |
| C-03 | Payment webhook unchecked DB mutations | `src/app/api/_handlers/payments/webhook/route.ts:468-527` | Check `{ error }` from all 3 `.update()` calls; log; return non-200 | Billing state corruption prevented | ✅ |
| C-04 | `revalidateTag` called with 2 args | `src/app/api/_handlers/payments/webhook/route.ts:380-381,427` | Verified: 2nd arg `'max'` is correct Next.js 15+ cache profile | No change needed — false positive | 📝 |
| C-05 | `payloadHash` HMAC fallback key | `src/app/api/_handlers/whatsapp/webhook/route.ts:56-58` | Throw when `appSecret` is null | No weak HMAC keys | ✅ |
| C-06 | Client-side dashboard 10-query waterfall | `src/lib/queries/dashboard.ts:183-233` | Expanded server-side `/api/admin/dashboard/stats`; hook now fetches API | Single API call replaces 10 roundtrips | ✅ |
| C-07 | `getCurrentSubscription` returns `any` | `src/lib/payments/subscription-service.ts:229` | Define `Subscription` interface; type return properly | Type safety on billing checks | ✅ |
| C-08 | Initial RLS `using(true)` on profiles | Supabase migration | Drop "Public profiles viewable by everyone"; add org-scoped policy | Profile data no longer leaked | ✅ |

---

## HIGH (12 findings)

| ID | Title | File | Action | Outcome | Status |
|----|-------|------|--------|---------|--------|
| H-01 | No rate limit on main catch-all | `src/app/api/[...path]/route.ts` | Added rate limit config (200/5min) to `createCatchAllHandlers` | 120+ public routes rate-limited | ✅ |
| H-02 | Rate limit in-memory fallback bypasses | `src/lib/security/rate-limit.ts:98-114` | Added fail-closed mode in production | Rate limiting not bypassable | ✅ |
| H-03 | No `SameSite` on cookies | `src/lib/supabase/middleware.ts:33-38` | Added `sameSite: 'lax'` | CSRF via cookie attachment prevented | ✅ |
| H-04 | CSRF on only 2/120+ endpoints | `src/lib/api-dispatch.ts` | Added CSRF check in `dispatch()` for mutations (exempt: webhooks, cron) | All mutation endpoints protected | ✅ |
| H-05 | Invoice HMAC falls back to service role key | `src/lib/invoices/public-link.ts:4-6` | Added `INVOICE_SIGNING_SECRET` env; removed service role fallback | Service role key never as HMAC | ✅ |
| H-06 | Missing error boundaries | `src/app/` | Added `error.tsx` to 8 route segments | Errors isolated per segment | ✅ |
| H-07 | `console.log` PII leakage | `src/hooks/useRealtimeProposal.ts` | Removed all 8 console.log calls | No PII in browser console | ✅ |
| H-08 | Callback instability in realtime hook | `src/hooks/useRealtimeProposal.ts:177-186` | Used `useRef` pattern for callbacks; removed from dep array | No subscription churn | ✅ |
| H-09 | N+1 in reviews import | `src/app/api/_handlers/social/reviews/import/route.ts:44-59` | Batch query + batch insert | O(1) queries not O(N) | ✅ |
| H-10 | No Zod on `create-order` | `src/app/api/_handlers/payments/create-order/route.ts:66-90` | Added Zod schema | Consistent validation | ✅ |
| H-11 | `wrapPaymentError` typed as `void` | `src/lib/payments/subscription-service.ts` | Verified: already typed as `never` | False positive — no change needed | 📝 |
| H-12 | Missing HSTS header | `next.config.mjs:84-96` | Added `Strict-Transport-Security: max-age=63072000; includeSubDomains` | HTTPS downgrade prevented | ✅ |

---

## MEDIUM (15 findings)

| ID | Title | File | Action | Outcome | Status |
|----|-------|------|--------|---------|--------|
| M-01 | `unsafe-inline` in CSP script-src | `next.config.mjs:59` | Document as Next.js requirement | Next.js requires unsafe-inline for inline scripts | 📝 |
| M-02 | Middleware excludes `/api` from auth | `src/middleware.ts:119-123` | Document defense-in-depth gap | Handler-level auth is the pattern; middleware skip is intentional | 📝 |
| M-03 | Admin client singleton | `src/lib/supabase/admin.ts` | Document as acceptable (stateless) | Supabase client is stateless per-request — acceptable | 📝 |
| M-04 | Amadeus error message leakage | `src/lib/external/amadeus.ts:60-61` | Sanitize error message | No credential hints | ✅ |
| M-05 | Cron GET=POST delegation | All cron handlers | Remove `GET` export | Cron only via POST | ✅ |
| M-06 | Reputation widget CORS wildcard | `reputation/widget/[token]/route.ts` | Document as intentional | Embeddable widget — CORS wildcard is by design | 📝 |
| M-07 | Password minimum 6 chars | `auth/page.tsx` + `password-login/route.ts` | Increase to `min(8)` | OWASP compliant | ✅ |
| M-08 | WhatsApp webhook body size | `whatsapp/webhook/route.ts:92` | Add 1MB limit | Memory exhaustion prevented | ✅ |
| M-09 | 3 oversized files (1400-1600 lines) | `admin/trips/[id]`, `ui/map`, `proposals/create` | Extract sub-components | Deferred — large refactor, no security risk | 📝 |
| M-10 | `console.error` not structured logger | Multiple client files | Replace in key files | Client-side only — no server PII risk; deferred | 📝 |
| M-11 | Platform settings blanket ESLint disable | `src/lib/platform/settings.ts:1` | Replace with inline comments | Granular suppression | ✅ |
| M-12 | Empty catch blocks in settings | `src/lib/platform/settings.ts:79,89,115` | Add `console.warn` | Redis outages diagnosable | ✅ |
| M-13 | `WeatherWidget` no abort on unmount | `src/components/WeatherWidget.tsx:48-73` | Add `AbortController` cleanup | No unmounted state updates | ✅ |
| M-14 | Missing RLS-critical indexes | Supabase migration | Add indexes on notification FK columns | RLS performance improved | ✅ |
| M-15 | Duplicate Supabase client creation | `ProposalAddOnsManager.tsx` | `useMemo` single client | Single instance per component | ✅ |

---

## LOW (10 findings)

| ID | Title | Action | Outcome | Status |
|----|-------|--------|---------|--------|
| L-01 | Inconsistent API response envelopes | Refactor 5 worst offenders to `apiSuccess`/`apiError` | Deferred — large refactor, no functional risk | 📝 |
| L-02 | File naming inconsistency (hooks) | Rename `use-shortcuts.ts` → `useShortcuts.ts` | Consistent camelCase | ✅ |
| L-03 | Dollar sign in INR product | Fix display to `₹` | Correct currency | ✅ |
| L-04 | `useEffect` empty deps with closures | Fix 2 components (PostHistory, god/page) | Correct dependencies | ✅ |
| L-05 | Magic numbers in payment code | Extract to named constants | Self-documenting | ✅ |
| L-06 | Flat file sprawl in `src/lib/` | Move 26 root files to subdirectories | Deferred — large refactor, high regression risk | 📝 |
| L-07 | Duplicate `embeddings.ts` / `embeddings-v2.ts` | Verified: v1 is a v2 wrapper, actively imported | False positive — no dead code | 📝 |
| L-08 | REST verb naming | Rename to resource-oriented paths | Deferred — breaking change for clients | 📝 |
| L-09 | `as any` / `as unknown` 130+ casts | Regenerate Supabase types | Deferred — requires Supabase CLI type regeneration | 📝 |
| L-10 | TODO comment in env.ts | Removed — Razorpay keys handled by payment handlers | No orphaned TODOs | ✅ |

---

## Test Suite Status
- **Vitest**: TBD — run after all fixes
- **Playwright E2E**: TBD — run after all fixes
- **New tests**: `e2e/tests/audit-remediation.spec.ts` — 13 tests covering security headers, CORS, CSRF, cron POST-only, password min length, webhook body limit, rate limiting, payment webhook auth, cookie security

---

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| 0 | `d23bce0` | 2026-03-11 | Tracker created |
| 1 | `eaf66ba` | 2026-03-11 | CRITICAL fixes (C-01–C-08) |
| 2 | `a559fe9` | 2026-03-11 | HIGH fixes (H-01–H-12) |
| 3 | `714ce10` | 2026-03-11 | MEDIUM fixes (M-01–M-15) |
| 4 | `0192315` | 2026-03-11 | LOW fixes (L-01–L-10) |
| 5 | — | 2026-03-11 | E2E audit remediation tests |
