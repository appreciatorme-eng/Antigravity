# Remediation Tracker S37
**Date**: 2026-03-16 | **Branch**: `fix/remediation-s37` | **Source**: /review-deep

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH (6)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | `billing/contact-sales` missing `enforceRateLimit` — floods CRM + Resend | `_handlers/billing/contact-sales/route.ts` | Added `enforceRateLimit(user.id, 3, 600_000, "api:billing:contact-sales")` | 3 req/10min per user; prevents CRM/Resend flood | ✅ |
| H-02 | `ai/pricing-suggestion` missing `enforceRateLimit` — live Gemini cost exhaustion | `_handlers/ai/pricing-suggestion/route.ts` | Added `enforceRateLimit(user.id, 30, 60_000, "api:ai:pricing-suggestion")` | 30 req/min per user | ✅ |
| H-03 | `ai/suggest-reply` missing `enforceRateLimit` — live Gemini cost exhaustion | `_handlers/ai/suggest-reply/route.ts` | Added `enforceRateLimit(user.id, 30, 60_000, "api:ai:suggest-reply")` | 30 req/min per user | ✅ |
| H-04 | `ai/draft-review-response` missing `enforceRateLimit` — live Gemini cost exhaustion | `_handlers/ai/draft-review-response/route.ts` | Added `enforceRateLimit(user.id, 20, 60_000, "api:ai:draft-review-response")` | 20 req/min per user | ✅ |
| H-05 | `social/process-queue` N+1 DB writes — per-item claim + status update | `_handlers/social/process-queue/route.ts:90-138` | Intentional CAS pattern — per-item claim UPDATE required for race-free claiming. Batch size max=10. | Cron-protected endpoint; per-item claim is correctness requirement, not a bug | 📝 |
| H-06 | `whatsapp/broadcast` N+1 DB inserts — up to 200 serial `whatsapp_webhook_events` inserts | `_handlers/whatsapp/broadcast/route.ts:418` | Collected insert payloads in array during loop; single batch `.insert(pendingEventInserts)` after loop | N insert calls → 1 batch insert | ✅ |

## MEDIUM (6)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | `health/route.ts` missing rate limit on unauthenticated path | `_handlers/health/route.ts:362` | Unauthenticated path returns immediately without outbound calls; amplified path requires HEALTHCHECK_TOKEN. Already protected. | False alarm on closer reading — no outbound calls without token | 📝 |
| M-02 | `itinerary/generate` empty `catch {}` (dead code block) | `_handlers/itinerary/generate/route.ts:325` | Removed dead `if (ratelimit) { try { /* comment */ } catch { } }` block entirely | Dead code — try block had only a comment, never executed | ✅ |
| M-03 | `reputation/ai/batch-analyze` N+1 spend reservation calls (50 per batch) | `_handlers/reputation/ai/batch-analyze/route.ts:188` | Hoisted `getEmergencyDailySpendCapUsd("ai_text")` before the loop | 50 async calls → 1 call; `reserveDailySpendUsd` correctly remains per-review | ✅ |
| M-04 | `payments/webhook` `db_error: error.message` in structured logs | `_handlers/payments/webhook/route.ts:479,509,542` | Server-side internal monitoring logs only — not returned to client. logWebhookHandlerEvent goes to server logs. | Acceptable for internal structured logs | 📝 |
| M-05 | `leads/convert:156` `console.error` instead of `logError` | `_handlers/leads/convert/route.ts:156` | Replaced `console.error` with `logError` from `@/lib/observability/logger` | Consistent structured logging throughout | ✅ |
| M-06 | `auth_rls_initplan` — 7 tables with per-row `auth.role()` evaluation | Supabase RLS policies | Migration `20260316180000_fix_auth_rls_initplan_s37.sql` — wraps `auth.role()` → `(select auth.role())` on all 7 tables; applied to DB | Eliminates per-row auth context re-evaluation | ✅ |

## LOW (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | 202 unused indexes across 87 tables | Supabase DB | Deferred — dedicated DB optimization sprint | No production impact | 📝 |
| L-02 | `crm_contacts.crm_contacts_assigned_to_fkey` unindexed | Supabase DB | Deferred with L-01 | | 📝 |
| L-03 | 29 tables with multiple permissive policies | Supabase DB | Deferred consolidation sprint | | 📝 |

## Test Suite Status
- Vitest: ✅ 748 tests — 91.51% lines / 89.08% functions / 97.1% branches (all thresholds met)
- Playwright E2E: ✅ remediation-s37.spec.ts (160 lines, 12 tests — H-01..H-04, H-06, M-02, M-06)

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| P1 | 852af72 | 2026-03-16 | chore: create remediation tracker s37 |
| P2 | d641591 | 2026-03-16 | fix: rate limiting, batch inserts, error handling, RLS migration |
| P3 | 8208dfa | 2026-03-16 | test: add E2E tests for remediation s37 |
| P4 | ae44ca4 | 2026-03-16 | docs: update QA log with remediation s37 results |
| P6 | — | 2026-03-16 | docs: finalize remediation tracker s37 |
