# Remediation Tracker S26
**Date**: 2026-03-13 | **Branch**: `fix/remediation-s26` | **Source**: `/review-deep` (S26, score 41/60)

## Legend
✅ Done (committed) | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

---

## HIGH (2)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | Missing `error.tsx` on many App Router routes — only 10/~40 routes had error boundaries | Multiple route dirs | Added `error.tsx` to 7 high-traffic routes (settings, inbox, add-ons, dashboard, drivers, analytics, bookings). Now 17/~40 routes covered. | Graceful degradation with Sentry capture on unhandled errors in key user flows | ✅ |
| H-02 | 209 tables with `multiple_permissive_policies` (ALL+SELECT overlap per role) | Supabase RLS | 📝 Intentional Supabase pattern — ALL policy covers CRUD, SELECT is additive for read-heavy grants. Pre-flight confirmed this is by design. | Accepted design | 📝 |

## MEDIUM (4)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | 5 unindexed FK columns (Supabase performance advisor) | Supabase schema | 📝 Pre-flight DB query confirmed all 5 FKs are covered by composite indexes (trailing column). Supabase advisor false positive. | No action needed | 📝 |
| M-02 | Duplicate `database.types.ts` — canonical at `src/lib/database.types.ts` (60 imports) vs stale copy at `src/lib/supabase/database.types.ts` (24 imports) | `src/lib/supabase/database.types.ts` | Deleted stale duplicate (6820 lines); updated all 24 imports from `@/lib/supabase/database.types` → `@/lib/database.types` | Single source of truth for DB types; -6882 lines deleted | ✅ |
| M-03 | 25 files >800 lines — architecture fragmentation risk | Multiple large files | 📝 Large-scale refactor — requires dedicated sprint per file. Too risky for single remediation sprint. Schedule as technical debt sprint. | Logged, not fixed | 📝 |
| M-04 | `public-proposal-utils.ts` — bare Supabase calls without try/catch in `loadOperatorContact` and `buildPublicPayload` | `src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts` | Wrapped `loadOperatorContact` body in try/catch (returns null on error); added try/catch to `buildPublicPayload` outer body (returns 500 envelope on error); captured error from bare `.update()` in mark-viewed flow | Prevents silent crashes on DB connection errors in public proposal flow | ✅ |

## LOW (1)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | 808 dead symbols across 302 web files — top offenders: `map.tsx` (16), `trips/[id]/page.tsx` (15), `TourAssistantChat.tsx` (11) | Multiple files | 📝 Bulk cleanup requires per-symbol verification to avoid removing intentionally exported symbols. Schedule as dedicated cleanup sprint. | Logged, not fixed | 📝 |

---

## M-03 Large File Log (>800 lines — for future sprint)

Top files flagged by Axon dead code analysis and file-size sweep:
- map.tsx (16 dead symbols)
- trips/[id]/page.tsx (15 dead symbols)
- TourAssistantChat.tsx (11 dead symbols)
- 22 additional files flagged >800 lines in S26 architecture sweep

---

## Test Suite Status
- **Vitest**: ✅ 600 tests passed, 40 test files (lint: 0 warnings, typecheck: 0 errors)
- **Playwright E2E**: `e2e/tests/remediation-s26.spec.ts` — written
- **New test file**: `e2e/tests/remediation-s26.spec.ts`

---

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| 0 | e6b23ff | 2026-03-13 | chore: create remediation tracker s26 |
| HIGH | 2a3a4bf | 2026-03-13 | fix: remediate HIGH findings (H-01 — add error.tsx to 7 routes) |
| MEDIUM | 5216b89 | 2026-03-13 | fix: remediate MEDIUM findings (M-02 — consolidate database.types, M-04 — add try/catch) |
| E2E | ae624c0 | 2026-03-13 | test: add E2E tests for remediation s26 |
