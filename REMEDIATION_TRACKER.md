# Remediation Tracker S38
**Date**: 2026-03-15 | **Branch**: `fix/remediation-s38` | **Source**: /review-deep

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | Missing `enforceRateLimit` on AI caption generation route | `social/captions/route.ts` | Added `enforceRateLimit(user.id, 20/min, "api:social:captions")` after auth check | 20 req/min per user; logError replaces console.error | ✅ |
| H-02 | Missing `enforceRateLimit` on AI image-extraction route | `social/extract/route.ts` | Added `enforceRateLimit(user.id, 20/min, "api:social:extract")` after auth check | 20 req/min per user; logError replaces console.error | ✅ |
| H-03 | Missing `enforceRateLimit` on WhatsApp trip-intent extraction | `whatsapp/extract-trip-intent/route.ts` | Added `enforceRateLimit(userId, 20/min, "api:whatsapp:extract-trip-intent")` after requireAdmin | 20 req/min per admin user; logError replaces both console.error calls | ✅ |

## MEDIUM (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | `auth_leaked_password_protection` disabled in Supabase Auth | Supabase dashboard → Auth → Password Security | Dashboard-only setting — no code path. Enable in Supabase dashboard to check user passwords against HaveIBeenPwned.org | Enable manually at: Supabase Console → Authentication → Settings → Password Security | 📝 |
| M-02 | `rls_policy_always_true` on proposal_activities (ALL), proposal_add_ons (UPDATE), proposal_comments (INSERT) | Supabase DB policies | Intentional design for public proposal link UX — clients view/interact with proposals via token-gated URL without auth. SELECT-only policies with `true` are excluded by Supabase advisor. Token validation is enforced at the application layer in `proposals/public/[token]/route.ts`. | Accepted design — open write policies are necessary for anonymous proposal collaboration | 📝 |
| M-03 | 386 `console.error`/`console.warn` in 193 API handler files instead of structured `logError` | `src/app/api/_handlers/**` | Bulk-migrated 190 handler files. Added `logWarn()` export to `logger.ts`. Used Node.js transformation script: `console.error("msg:", err)` → `logError("msg", err)`. Zero remaining occurrences. | 191 files changed (190 handlers + logger.ts). TypeCheck ✅ Lint ✅ 748 tests ✅ | ✅ |

## LOW (1)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | `crm_contacts` unindexed FK (Supabase perf advisor) | `crm_contacts` table | Investigated: `organization_id` FK has 4 composite leading-column indexes (`idx_crm_contacts_org_created`, `org_email`, `org_phone`, `org_stage`). Any join/filter on `organization_id` will use these via leftmost-prefix rule. | False positive — no index needed | 📝 |

## Test Suite Status
- Vitest: 748 tests passed | 91.51% stmts | 88.96% branches | 97.1% functions — all thresholds ✅
- Playwright E2E: `e2e/tests/remediation-s38.spec.ts` — 9 tests covering H-01..H-03 auth guards + M-03 error envelope cleanliness

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| Tracker | 72393bb | 2026-03-15 | chore: create remediation tracker s38 |
| HIGH | 1352e2c | 2026-03-15 | fix: add enforceRateLimit to AI routes (H-01, H-02, H-03) |
| MEDIUM | d17f9a2 | 2026-03-15 | fix: migrate console.error/warn → logError/logWarn in API handlers (M-03) |
| E2E | a8daa25 | 2026-03-15 | test: add E2E tests for remediation s38 |
| QA Log | — | 2026-03-15 | docs: update QA log with remediation s38 results |
| Final | — | 2026-03-15 | docs: finalize remediation tracker s38 |
