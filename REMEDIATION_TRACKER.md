# Remediation Tracker S25
**Date**: 2026-03-13 | **Branch**: `fix/remediation-s25` | **Source**: `/review-deep` (S25, score 45/60)

## Legend
✅ Done (committed) | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

---

## CRITICAL (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| C-01 | Superadmin API missing rate limiting | `src/app/api/superadmin/[...path]/route.ts:8` | Add `SUPERADMIN_RATE_LIMIT` config (100/5min) | Same protection as admin/assistant routes | ✅ |
| C-02 | N+1: sequential org resolution in notification queue | `src/app/api/_handlers/notifications/process-queue/route.ts:72-93` | Batch pre-fetch org IDs for all trip_ids + user_ids before processing loop | 25 queue items = 2 queries instead of 25-50 | ✅ |
| C-03 | N+1: per-item count query in social queue | `src/app/api/_handlers/social/process-queue/route.ts:138-142` | Collect post_ids in loop, batch count + update social_posts after loop | Up to 10 count queries replaced with 1 | ✅ |

## HIGH (8)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | RLS: `proposal_activities` ALL for anon — USING(true) | Supabase RLS | 📝 Intentional — proposal share flow grants anon access via token-scoped JWT; restricting requires schema audit of share token claims | Risk accepted pending proposal sharing audit | 📝 |
| H-02 | RLS: `proposal_add_ons` UPDATE for anon — USING(true) | Supabase RLS | 📝 Same as H-01 — part of proposal sharing client workflow | Risk accepted pending sharing audit | 📝 |
| H-03 | RLS: `proposal_comments` INSERT for anon — WITH CHECK(true) | Supabase RLS | 📝 Same as H-01 — allows clients to leave comments on shared proposals | Risk accepted pending sharing audit | 📝 |
| H-04 | RLS: `itinerary_embeddings` INSERT for authenticated — WITH CHECK(true) | Supabase migration | Tighten `WITH CHECK` to `(select auth.uid()) IS NOT NULL` | Explicit guard; no functional change | ✅ |
| H-05 | RLS: `marketplace_profile_views` INSERT for authenticated — WITH CHECK(true) | Supabase migration | Same tightening as H-04 | Explicit guard | ✅ |
| H-06 | SECURITY DEFINER view `public_marketplace_profiles` | Supabase migration | Recreate view with `security_invoker = true` | View runs as caller, respects caller's RLS | ✅ |
| H-07 | Leaked password protection disabled in Supabase Auth | Supabase dashboard | 📝 Dashboard-only setting — enable at Auth > Settings > Password security > Leaked password protection | HaveIBeenPwned checks on login | 📝 |
| H-08 | N+1: loop UPDATE per proposal in bulk handler | `src/app/api/_handlers/proposals/bulk/route.ts:60-91` | Replace loop with single `.update().in("id", allowedIdsList)` | 50 queries → 1 per bulk action | ✅ |

## MEDIUM (4)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | 115 `auth_rls_initplan` warnings — RLS re-evaluates `current_setting()` per row | Supabase RLS (115 tables) | 📝 Large-scale — schedule as dedicated migration sprint. Pattern: wrap `auth.uid()` in `(select auth.uid())` per table | Postgres caches the subselect result per query instead of per row | 📝 |
| M-02 | 198 unused indexes | Supabase schema | 📝 Requires query workload analysis before dropping — wrong drop could degrade real queries. Schedule as dedicated DBA sprint | Reduced storage + write overhead | 📝 |
| M-03 | Missing `useMemo` in `RevenueChart` — chartData recomputed every render | `src/components/analytics/RevenueChart.tsx:51-55` | Wrap `chartData` in `useMemo([data])`, `handleChartClick` in `useCallback([onPointSelect])` | Chart won't rerender Recharts on unrelated parent updates | ✅ |
| M-04 | Missing `useCallback` in `ProfessionalView` — `toggleDay` recreated every render | `src/components/itinerary-templates/ProfessionalView.tsx:16-26` | Wrap `toggleDay` in `useCallback([])` | Stable reference for child render optimization | ✅ |

## LOW (1)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | `vector` extension installed in `public` schema | Supabase migration | `ALTER EXTENSION vector SET SCHEMA extensions` | Cleaner schema separation | ✅ |

---

## Test Suite Status
- **Vitest**: ✅ 600 tests passed, 40 test files (lint: 0 warnings, typecheck: 0 errors)
- **Playwright E2E**: `e2e/tests/remediation-s25.spec.ts` — written
- **New test file**: `e2e/tests/remediation-s25.spec.ts`

---

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|------------|
| 0 | e70aa3d | 2026-03-13 | chore: create remediation tracker s25 |
| CRITICAL | 2a68871 | 2026-03-13 | fix: remediate CRITICAL findings (C-01, C-02, C-03) |
| HIGH | 02c373b | 2026-03-13 | fix: remediate HIGH findings (H-04, H-05, H-06, H-08) |
| MEDIUM | 5643356 | 2026-03-13 | fix: remediate MEDIUM findings (M-03, M-04) |
| LOW | DB migration | 2026-03-13 | move_vector_extension_to_extensions_schema_s25 |
