# Remediation Tracker s31

**Date**: 2026-03-14 | **Branch**: `fix/remediation-s31` | **Source**: Production readiness audit (d899e1c)

## Legend

✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

---

## BLOCKER (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| B-01 | Payment webhook idempotency | invoice-service.ts:165-183 | Verify existing guard | Already has dedup check on `reference` field + early return | 📝 |
| B-03 | Admin Activity hardcoded mock | admin/activity/page.tsx:31-55 | Replace with "Coming Soon" | Replaced 257-line mock page with 33-line Coming Soon placeholder | ✅ |
| B-04 | WhatsApp pickers use mock data | action-picker/shared.ts:41-176 | Replace with real API hooks | Created useOrganizationTrips/useOrganizationDrivers hooks, removed all mock data | ✅ |

## HIGH (10)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-04 | `as any` in critical paths | sitemap.ts, useProposalData.ts | Add proper types | Extracted shared formatFeatureLimitError, typed BlogPost interface | ✅ |
| H-05 | console.error in assistant handlers | _handlers/assistant/*.ts | Replace with logError() | 12 replacements across 8 handler files | ✅ |
| H-06 | console.log debug in proposals | proposals/[id]/page.tsx:225,229,233 | Remove debug logs | 3 console.log statements removed | ✅ |
| H-07 | Missing loading.tsx | 2/97 routes have loading | Add to 11+ routes | 11 loading.tsx skeleton files added (trips, proposals, clients, drivers, inbox, analytics, calendar, settings, planner, reputation, social) | ✅ |
| H-08 | Middleware ignores profile error | middleware.ts:104 | Destructure error, fail-open | Added profileError destructuring + fail-open guard | ✅ |
| H-09 | No session expiry handler | Root layout | Add useSessionRefresh hook | Created hook + SessionRefreshGuard in AppProviders | ✅ |
| H-10 | Fetch without timeout | useCreateProposal.ts:117 | Create fetchWithTimeout utility | Created lib/fetch-with-timeout.ts, applied to useCreateProposal | ✅ |
| H-01 | Rate limiter 59% coverage | rate-limit.ts | Write tests | 13 tests: 100% lines/functions/branches | ✅ |
| H-02 | Cron auth 74% coverage | cron-auth.ts | Write tests | 22 tests: 100% lines/functions, 98.86% branches | ✅ |
| H-03 | Payment handler 50% fn coverage | create-order/route.ts | Write tests | 23 tests: 100% lines/functions, 95.34% branches | ✅ |

## MEDIUM (8)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-02 | Image APIs no cache directive | images/{pexels,unsplash,pixabay} | Add cache headers | Updated revalidate from 86400s to 3600s | ✅ |
| M-03 | JSON parse errors swallowed | useCreateProposal.ts:130,189 | Log before returning {} | Added console.error logging (client component) | ✅ |
| M-05 | Email format validation | useClientForm.ts:77 | Add regex check | Added EMAIL_REGEX validation | ✅ |
| M-06 | Unused mock-data.ts | reputation/_components/mock-data.ts | Delete if unused | Confirmed unused, deleted 571-line file | ✅ |
| M-08 | Demo component a11y | components/demo/*.tsx | Add keyboard support | Replaced div onClick with button in DemoTour, WelcomeModal | ✅ |
| M-01 | 6 files >750 lines | drivers/page, clients/[id], etc. | Extract sub-components | Deferred — large refactor | 📝 |
| M-04 | Form double-submit | useClientForm.ts | Audit submit buttons | Added early-return guard when saving | ✅ |
| M-07 | .single() error handling | 534 occurrences | Audit critical paths | Deferred — systematic audit | 📝 |

## LOW (5)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | Spline `any` types | SplineScene.tsx, HeroScreens.tsx | Third-party limitation | | 📝 |
| L-02 | Recharts `any` type | TrendChart.tsx | Third-party limitation | | 📝 |
| L-03 | `<img>` in marketing | solutions/[type]/page.tsx | Replace with next/image | Replaced with Image component (800x600) | ✅ |
| L-04 | 500+ `use client` directives | Multiple files | Audit for server potential | Deferred | 📝 |
| L-05 | formatFeatureLimitError duplication | 5 files | Extract shared utility | Extracted to lib/subscriptions/feature-limit-error.ts | ✅ |

---

## Summary

| Severity | Total | Fixed | Documented | Deferred |
|----------|-------|-------|------------|----------|
| BLOCKER | 3 | 2 | 1 | 0 |
| HIGH | 10 | 10 | 0 | 0 |
| MEDIUM | 8 | 6 | 0 | 2 |
| LOW | 5 | 2 | 3 | 0 |
| **Total** | **26** | **20** | **4** | **2** |

## Test Suite Status

- Vitest: **748 tests passed** (55 files) — 91.59% lines / 89.03% branches / 97.1% functions
- Playwright E2E: remediation-s31.spec.ts created (pre-deploy static checks)

## Commit Log

| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| Tracker | 8db9ec8 | 2026-03-14 | chore: create remediation tracker s31 |
| Blockers | 111013e | 2026-03-14 | fix: B-03 coming-soon, B-04 real API hooks |
| HIGH quick | b81ca33 | 2026-03-14 | fix: H-05 logError, H-06 debug logs, H-08 fail-open |
| HIGH remaining | 74f7dfc | 2026-03-14 | fix: H-04 as-any, H-07 loading.tsx x11, H-09 session, H-10 timeout |
| Tests | 29ca48f | 2026-03-14 | test: H-01 rate-limit, H-02 cron-auth, H-03 create-order |
| MEDIUM | 79b9c37 | 2026-03-14 | fix: M-02 cache, M-03 logging, M-04 double-submit, M-05 email, M-06 delete |
| LOW+A11y | 3468926 | 2026-03-14 | fix: M-08 a11y, L-03 next/image |
| E2E | 288abe4 | 2026-03-14 | test: E2E regression tests for s31 |
