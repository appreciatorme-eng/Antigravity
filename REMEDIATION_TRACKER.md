# Remediation Tracker S37
**Date**: 2026-03-16 | **Branch**: `fix/remediation-s37` | **Source**: /review-deep

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH (6)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | `billing/contact-sales` missing `enforceRateLimit` — floods CRM + Resend | `_handlers/billing/contact-sales/route.ts` | Add `enforceRateLimit(user.id, 3, 600_000, "api:billing:contact-sales")` | | ⏳ |
| H-02 | `ai/pricing-suggestion` missing `enforceRateLimit` — live Gemini cost exhaustion | `_handlers/ai/pricing-suggestion/route.ts` | Add `enforceRateLimit(user.id, 30, 60_000, "api:ai:pricing-suggestion")` | | ⏳ |
| H-03 | `ai/suggest-reply` missing `enforceRateLimit` — live Gemini cost exhaustion | `_handlers/ai/suggest-reply/route.ts` | Add `enforceRateLimit(user.id, 30, 60_000, "api:ai:suggest-reply")` | | ⏳ |
| H-04 | `ai/draft-review-response` missing `enforceRateLimit` — live Gemini cost exhaustion | `_handlers/ai/draft-review-response/route.ts` | Add `enforceRateLimit(user.id, 20, 60_000, "api:ai:draft-review-response")` | | ⏳ |
| H-05 | `social/process-queue` N+1 DB writes — per-item claim + status update | `_handlers/social/process-queue/route.ts:90-138` | Intentional CAS pattern — per-item claim UPDATE required for race-free claiming. Batch size max=10. | Cron-protected endpoint; per-item claim is correctness requirement, not a bug | 📝 |
| H-06 | `whatsapp/broadcast` N+1 DB inserts — up to 200 serial `whatsapp_webhook_events` inserts | `_handlers/whatsapp/broadcast/route.ts:418` | Collect insert payloads in array during loop; batch-insert after loop with single `.insert(batchPayloads)` | | ⏳ |

## MEDIUM (6)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | `health/route.ts` missing rate limit on unauthenticated path | `_handlers/health/route.ts:362` | Unauthenticated path returns immediately without outbound calls; amplified path requires HEALTHCHECK_TOKEN. Already protected. | False alarm on closer reading — no outbound calls without token | 📝 |
| M-02 | `itinerary/generate` empty `catch {}` swallows Redis error silently | `_handlers/itinerary/generate/route.ts:325` | Replace `catch { }` with `catch (redisErr) { logError(..., redisErr) }` | | ⏳ |
| M-03 | `reputation/ai/batch-analyze` N+1 spend reservation calls | `_handlers/reputation/ai/batch-analyze/route.ts` | Assess and fix if applicable | | ⏳ |
| M-04 | `payments/webhook` `db_error: error.message` in structured logs | `_handlers/payments/webhook/route.ts:479,509,542` | Server-side internal monitoring logs only — not returned to client. logWebhookHandlerEvent goes to server logs. | Acceptable for internal structured logs | 📝 |
| M-05 | `leads/convert:156` `console.error` instead of `logError` | `_handlers/leads/convert/route.ts:156` | Replace `console.error` with `logError` from `@/lib/observability/logger` | | ⏳ |
| M-06 | `auth_rls_initplan` — 7 tables with per-row `auth.uid()` evaluation | Supabase RLS policies | Create migration wrapping `auth.uid()` → `(select auth.uid())` in 7 tables | | ⏳ |

## LOW (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | 202 unused indexes across 87 tables | Supabase DB | Deferred — dedicated DB optimization sprint | No production impact | 📝 |
| L-02 | `crm_contacts.crm_contacts_assigned_to_fkey` unindexed | Supabase DB | Deferred with L-01 | | 📝 |
| L-03 | 29 tables with multiple permissive policies | Supabase DB | Deferred consolidation sprint | | 📝 |

## Test Suite Status
- Vitest: pending
- Playwright E2E: pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| P1 | — | 2026-03-16 | chore: create remediation tracker s37 |
