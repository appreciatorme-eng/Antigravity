# Remediation Tracker S38
**Date**: 2026-03-15 | **Branch**: `fix/remediation-s38` | **Source**: /review-deep

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | Missing `enforceRateLimit` on AI caption generation route | `social/captions/route.ts` | Add `enforceRateLimit(user.id, 20/min)` after auth check | — | ⏳ |
| H-02 | Missing `enforceRateLimit` on AI image-extraction route | `social/extract/route.ts` | Add `enforceRateLimit(user.id, 20/min)` after auth check | — | ⏳ |
| H-03 | Missing `enforceRateLimit` on WhatsApp trip-intent extraction | `whatsapp/extract-trip-intent/route.ts` | Add `enforceRateLimit(userId, 20/min)` after requireAdmin | — | ⏳ |

## MEDIUM (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | `auth_leaked_password_protection` disabled in Supabase Auth | Supabase dashboard → Auth → Password Security | Enable HaveIBeenPwned check via Supabase dashboard toggle | Dashboard-only setting, no code path | 📝 |
| M-02 | `rls_policy_always_true` on proposal_activities (ALL), proposal_add_ons (UPDATE), proposal_comments (INSERT) | Supabase DB policies | Intentional for public proposal link (token-gated at app layer); SELECT-true excluded by advisor; document as accepted | Accepted design — public proposal UX requires open write policies scoped by app logic | 📝 |
| M-03 | 386 `console.error`/`console.warn` in 193 API handler files instead of structured `logError` | `src/app/api/_handlers/**` | Bulk migrate `console.error("msg:", err)` → `logError("msg", err)` + add logger import | — | ⏳ |

## LOW (1)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | `crm_contacts` unindexed FK (Supabase perf advisor) | `crm_contacts` table | Verified: `organization_id` FK covered by 4 composite leading-column indexes (`org_created`, `org_email`, `org_phone`, `org_stage`). Advisor false positive. | False positive — composite indexes cover all FK join patterns | 📝 |

## Test Suite Status
- Vitest: pending
- Playwright E2E: pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
