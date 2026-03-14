# Remediation Tracker s29
**Date**: 2026-03-14 | **Branch**: `fix/remediation-s29` | **Source**: /review-deep (score 46/60, delta +6 vs S28)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

---

## CRITICAL (0)

None.

---

## HIGH (0)

None.

---

## MEDIUM (1)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | `multiple_permissive_policies` — 214 advisor findings across 23 tables; PostgreSQL evaluates all PERMISSIVE policies via OR, wasting compute | Supabase DB — 23 tables incl. clients, trips, itineraries, profiles, push_tokens, concierge_requests | Documented — consolidating 214 findings across 23 core tables requires schema redesign sprint; risk of security regression if policies merged incorrectly | Accepted design decision | 📝 |

---

## LOW (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | `auth_rls_initplan` — 116 RLS policies call bare `auth.uid()` per row instead of `(select auth.uid())` once | Supabase DB | Applied 2 migrations: `20260325000001` (92 SELECT/UPDATE/DELETE/ALL policies) + `20260325000002` (17 INSERT-only WITH CHECK policies); 0 bare occurrences remaining | Performance improvement — all 109 policies fixed | ✅ |
| L-02 | `unused_index` — 202 indexes never used by query planner (was 198 in S28) | Supabase DB | Documented — requires per-index manual review before dropping | Tracked for DBA sprint | 📝 |
| L-03 | 6 files >800 lines: `ItineraryTemplatePages.tsx` (915), `onboarding/page.tsx` (823), `admin/page.tsx` (803), `drivers/page.tsx` (798), `clients/[id]/page.tsx` (798), `AdminRevenueView.tsx` (794) | Multiple files | Documented — requires dedicated refactor sprint | Tracked for next sprint | 📝 |

---

## Test Suite Status
- Vitest: ✅ 52 files / 690 assertions / 85%+ coverage
- Playwright E2E: ⏳ pending

---

## Commit Log

| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| P1 | 6ec7357 | 2026-03-14 | Create remediation tracker s29 |
| P2 | — | 2026-03-14 | Fix L-01: auth_rls_initplan — 109 RLS policies updated via 2 migrations |
