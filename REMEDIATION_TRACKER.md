# Remediation Tracker s28
**Date**: 2026-03-14 | **Branch**: `fix/remediation-s28` | **Source**: /review-deep (baseline, score 40/60)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

---

## CRITICAL (2)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| C-01 | `jsdom` not installed — test suite crashes (ERR_MODULE_NOT_FOUND) | `package.json` | Installed `jsdom`, `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event` | 52 tests pass, 690 assertions, 85%+ coverage | ✅ |
| C-02 | `undici` 6 CVEs: WebSocket overflow, HTTP smuggling, CRLF injection, DoS | `node_modules/undici` | `npm audit fix` — 0 vulnerabilities now | All CVEs patched | ✅ |

---

## HIGH (4)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | `proposal_activities` RLS — ALL policy with USING(true)/WITH CHECK(true) | Supabase DB | Intentional — public proposal portal; clients access shared proposal links without auth. Accepted design decision, seeded in Engram suppression list. | No code change | 📝 |
| H-02 | `proposal_add_ons` RLS — UPDATE policy always true | Supabase DB | Intentional — public proposal portal; clients interact without auth. Accepted design decision. | No code change | 📝 |
| H-03 | `proposal_comments` RLS — INSERT policy always true | Supabase DB | Intentional — clients comment on proposals without creating an account. Accepted design decision. | No code change | 📝 |
| H-04 | Leaked password protection disabled in Supabase Auth | Supabase Auth dashboard | Must be enabled manually: Supabase dashboard → Authentication → Password Protection → enable HaveIBeenPwned integration | Requires manual dashboard action | 📝 |

---

## MEDIUM (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | Direct API route bypasses catch-all (no rate limit/CSRF) | `src/app/api/availability/route.ts` | Migrated handler to `_handlers/availability/route.ts`, registered in catch-all, deleted direct route | Global rate limit + CSRF now covered | ✅ |
| M-02 | Direct API route bypasses catch-all (no rate limit/CSRF) | `src/app/api/whatsapp/chatbot-sessions/[id]/route.ts` | Migrated handler to `_handlers/whatsapp/chatbot-sessions/[id]/route.ts`, registered in catch-all as `whatsapp/chatbot-sessions/:id`, deleted direct route | Global rate limit + CSRF now covered | ✅ |
| M-03 | 18 files >600 lines (max 800, goal 400) | Multiple — top: `ItineraryTemplatePages.tsx` (915) | Documented — requires dedicated refactor sprint | Tracked for next sprint | 📝 |

---

## LOW (5)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | 198 unused DB indexes wasting storage, slowing writes | Supabase DB | Documented — requires manual review per index before dropping | Tracked for DBA sprint | 📝 |
| L-02 | 5 unindexed foreign keys (slow JOINs) | Supabase DB | Applied migration `add_unindexed_fk_covering_indexes` — indexes on assistant_conversations(user_id), assistant_preferences(user_id), crm_contacts(assigned_to), dashboard_task_dismissals(user_id), trip_service_costs(trip_id) | All 5 indexes created | ✅ |
| L-03 | 116 RLS policies re-evaluate `auth.uid()` per row | Supabase DB | Use `(select auth.uid())` pattern — tracked for migration | Performance improvement | 📝 |
| L-04 | ~200+ dead symbols in web app (Axon) | Various | Documented — requires symbol-by-symbol review | Tracked for cleanup sprint | 📝 |
| L-05 | 94 `eslint-disable` comments across 70 files | Various | Documented — mostly legitimate (Spline types, dynamic imports) | Periodic audit scheduled | 📝 |

---

## Test Suite Status
- Vitest: ✅ 52 tests pass, 690 assertions, 85.39% lines coverage (post C-01 fix)
- Playwright E2E: ⏳ pending

---

## Commit Log

| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| P1 | efa017f | 2026-03-14 | Create remediation tracker s28 |
| P2-CRIT | 9387ff3 | 2026-03-14 | Fix C-01 jsdom + C-02 undici CVEs |
| P2-HIGH/MED/LOW | 211fe0a | 2026-03-14 | H-01..04 documented, M-01/M-02 catch-all migration, L-02 FK indexes |
| P3 | — | 2026-03-14 | E2E tests: remediation-s28.spec.ts |
