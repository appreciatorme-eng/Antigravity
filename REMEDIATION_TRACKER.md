# Remediation Tracker s28
**Date**: 2026-03-14 | **Branch**: `fix/remediation-s28` | **Source**: /review-deep (baseline, score 40/60)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

---

## CRITICAL (2)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| C-01 | `jsdom` not installed — test suite crashes (ERR_MODULE_NOT_FOUND) | `package.json` | `npm install -D jsdom` | Unblocks all coverage reporting | ⏳ |
| C-02 | `undici` 6 CVEs: WebSocket overflow, HTTP smuggling, CRLF injection, DoS | `node_modules/undici` | `npm audit fix` | Patches to safe version | ⏳ |

---

## HIGH (4)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | `proposal_activities` RLS — ALL policy with USING(true)/WITH CHECK(true) | Supabase DB | Documented — intentional for public proposal portal (clients access without auth) | Accepted design decision | ⏳ |
| H-02 | `proposal_add_ons` RLS — UPDATE policy always true | Supabase DB | Documented — intentional for public proposal portal | Accepted design decision | ⏳ |
| H-03 | `proposal_comments` RLS — INSERT policy always true | Supabase DB | Documented — intentional: clients comment on proposals without auth | Accepted design decision | ⏳ |
| H-04 | Leaked password protection disabled in Supabase Auth | Supabase Auth dashboard | Enable in Supabase dashboard → Auth → Password Protection | Must be done manually via dashboard | ⏳ |

---

## MEDIUM (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | Direct API route bypasses catch-all (no rate limit/CSRF) | `src/app/api/availability/route.ts` | Migrate to catch-all dispatcher | Rate limit + CSRF coverage | ⏳ |
| M-02 | Direct API route bypasses catch-all (no rate limit/CSRF) | `src/app/api/whatsapp/chatbot-sessions/[id]/route.ts` | Migrate to catch-all dispatcher | Rate limit + CSRF coverage | ⏳ |
| M-03 | 18 files >600 lines (max 800, goal 400) | Multiple — top: `ItineraryTemplatePages.tsx` (915) | Documented — requires dedicated refactor sprint | Tracked for next sprint | 📝 |

---

## LOW (5)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | 198 unused DB indexes wasting storage, slowing writes | Supabase DB | Documented — requires manual review per index before dropping | Tracked for DBA sprint | 📝 |
| L-02 | 5 unindexed foreign keys (slow JOINs) | Supabase DB | Add covering indexes via migration | Performance improvement | ⏳ |
| L-03 | 116 RLS policies re-evaluate `auth.uid()` per row | Supabase DB | Use `(select auth.uid())` pattern — tracked for migration | Performance improvement | 📝 |
| L-04 | ~200+ dead symbols in web app (Axon) | Various | Documented — requires symbol-by-symbol review | Tracked for cleanup sprint | 📝 |
| L-05 | 94 `eslint-disable` comments across 70 files | Various | Documented — mostly legitimate (Spline types, dynamic imports) | Periodic audit scheduled | 📝 |

---

## Test Suite Status
- Vitest: ⏳ pending (blocked by C-01 jsdom fix)
- Playwright E2E: ⏳ pending

---

## Commit Log

| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| P1 | — | 2026-03-14 | Create tracker s28 |
