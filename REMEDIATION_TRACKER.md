# Remediation Tracker s31

**Date**: 2026-03-14 | **Branch**: `fix/remediation-s31` | **Source**: Production readiness audit (d899e1c)

## Legend

✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

---

## BLOCKER (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| B-01 | Payment webhook idempotency | invoice-service.ts:165-183 | Verify existing guard | Already has dedup check on `reference` field + early return | 📝 |
| B-03 | Admin Activity hardcoded mock | admin/activity/page.tsx:31-55 | Replace with "Coming Soon" | | ⏳ |
| B-04 | WhatsApp pickers use mock data | action-picker/shared.ts:41-176 | Replace with real API hooks | | ⏳ |

## HIGH (10)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-04 | `as any` in critical paths | sitemap.ts, useProposalData.ts | Add proper types | | ⏳ |
| H-05 | console.error in assistant handlers | _handlers/assistant/*.ts | Replace with logError() | | ⏳ |
| H-06 | console.log debug in proposals | proposals/[id]/page.tsx:225,229,233 | Remove debug logs | | ⏳ |
| H-07 | Missing loading.tsx | 2/97 routes have loading | Add to 11+ routes | | ⏳ |
| H-08 | Middleware ignores profile error | middleware.ts:104 | Destructure error, fail-open | | ⏳ |
| H-09 | No session expiry handler | Root layout | Add useSessionRefresh hook | | ⏳ |
| H-10 | Fetch without timeout | useCreateProposal.ts:117 | Create fetchWithTimeout utility | | ⏳ |
| H-01 | Rate limiter 59% coverage | rate-limit.ts | Write tests | | ⏳ |
| H-02 | Cron auth 74% coverage | cron-auth.ts | Write tests | | ⏳ |
| H-03 | Payment handler 50% fn coverage | create-order/route.ts | Write tests | | ⏳ |

## MEDIUM (8)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-02 | Image APIs no cache directive | images/{pexels,unsplash,pixabay} | Add cache headers | | ⏳ |
| M-03 | JSON parse errors swallowed | useCreateProposal.ts:130,189 | Log before returning {} | | ⏳ |
| M-05 | Email format validation | useClientForm.ts:77 | Add regex check | | ⏳ |
| M-06 | Unused mock-data.ts | reputation/_components/mock-data.ts | Delete if unused | | ⏳ |
| M-08 | Demo component a11y | components/demo/*.tsx | Add keyboard support | | ⏳ |
| M-01 | 6 files >750 lines | drivers/page, clients/[id], etc. | Extract sub-components | Deferred — large refactor | 📝 |
| M-04 | Form double-submit | useClientForm.ts | Audit submit buttons | | ⏳ |
| M-07 | .single() error handling | 534 occurrences | Audit critical paths | Deferred — systematic audit | 📝 |

## LOW (5)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | Spline `any` types | SplineScene.tsx, HeroScreens.tsx | Third-party limitation | | 📝 |
| L-02 | Recharts `any` type | TrendChart.tsx | Third-party limitation | | 📝 |
| L-03 | `<img>` in marketing | solutions/[type]/page.tsx | Replace with next/image | | ⏳ |
| L-04 | 500+ `use client` directives | Multiple files | Audit for server potential | Deferred | 📝 |
| L-05 | formatFeatureLimitError duplication | 5 files | Extract shared utility | | ⏳ |

---

## Test Suite Status

- Vitest: pending
- Playwright E2E: pending

## Commit Log

| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
