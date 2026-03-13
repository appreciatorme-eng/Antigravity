# Remediation Tracker S26
**Date**: 2026-03-13 | **Branch**: `fix/remediation-s26` | **Source**: `/review-deep` (S26, score 41/60)

## Legend
✅ Done (committed) | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

---

## HIGH (2)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | Missing `error.tsx` on many App Router routes — only 10/~40 routes have error boundaries | Multiple route dirs | Add `error.tsx` to 6 high-traffic routes missing them (settings, inbox, add-ons, dashboard, drivers, notifications) | Graceful degradation on unhandled errors in key user flows | ⏳ |
| H-02 | 209 tables with `multiple_permissive_policies` (ALL+SELECT overlap per role) | Supabase RLS | 📝 Intentional Supabase pattern — ALL policy covers CRUD, SELECT is additive for read-heavy grants. No action needed. | Accepted design | 📝 |

## MEDIUM (4)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | 5 unindexed FK columns (Supabase performance advisor) | Supabase schema | 📝 Pre-flight query confirmed all 5 FKs are covered by composite indexes (trailing column). Supabase advisor flags trailing-column coverage as "unindexed" — false positive. | No action needed | 📝 |
| M-02 | Duplicate `database.types.ts` — canonical at `src/lib/database.types.ts` (60 imports) vs stale copy at `src/lib/supabase/database.types.ts` (24 imports) | `src/lib/supabase/database.types.ts` | Delete stale duplicate; update 24 imports from `@/lib/supabase/database.types` → `@/lib/database.types` | Single source of truth for DB types | ⏳ |
| M-03 | 25 files >800 lines — architecture fragmentation risk | Multiple large files | 📝 Large-scale refactor — requires dedicated sprint per file. File list logged below. Schedule as technical debt sprint. | Logged, not fixed | 📝 |
| M-04 | `public-proposal-utils.ts` — bare Supabase calls without try/catch in `loadOperatorContact`, `loadProposalByToken`, `buildPublicPayload` | `src/app/api/_handlers/proposals/public/[token]/public-proposal-utils.ts` | Wrap bare Supabase calls in try/catch with structured logging + typed error returns | Prevents silent failures on DB errors in public proposal flow | ⏳ |

## LOW (1)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | 808 dead symbols across 302 web files — top offenders: `map.tsx` (16), `trips/[id]/page.tsx` (15), `TourAssistantChat.tsx` (11) | Multiple files | 📝 Bulk cleanup requires per-symbol verification to avoid removing intentionally exported-but-not-locally-used symbols. Schedule as dedicated cleanup sprint. | Logged, not fixed | 📝 |

---

## M-03 Large File Log (>800 lines — for future sprint)

Top files flagged by Axon dead code analysis and file-size sweep:
- map.tsx (16 dead symbols)
- trips/[id]/page.tsx (15 dead symbols)
- TourAssistantChat.tsx (11 dead symbols)
- 22 additional files flagged >800 lines in S26 architecture sweep

---

## Test Suite Status
- **Vitest**: ⏳ pending
- **Playwright E2E**: `e2e/tests/remediation-s26.spec.ts` — pending

---

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| 0 | pending | 2026-03-13 | chore: create remediation tracker s26 |
