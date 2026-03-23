# Remediation Tracker S42
**Date**: 2026-03-23 | **Branch**: `fix/remediation-s42` | **Source**: /review-deep S37

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH (2)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | N+1 DB writes in process-queue (per-item claim+status UPDATE) | social/process-queue/route.ts:90-138 | Batch UPDATE with IN clause | | ⏳ |
| H-02 | N+1 DB writes in broadcast (per-recipient INSERT) | whatsapp/broadcast/route.ts:418 | Batch .insert([...array]) | | ⏳ |

## MEDIUM (6)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | Health endpoint unauthenticated + no rate limit | health/route.ts | Add public rate limit | | ⏳ |
| M-02 | batch-analyze per-review Redis/DB calls in loop | reputation/ai/batch-analyze/route.ts | Pre-reserve budget in single call | | ⏳ |
| M-03 | Empty catch swallows Redis TTL error | itinerary/generate/route.ts:325 | Add logError | | ⏳ |
| M-04 | db_error leaks schema in payment webhook logs | payments/webhook/route.ts:479,509,542 | Sanitize to error code | | ⏳ |
| M-05 | console.error instead of logError | leads/convert/route.ts:156 | Replace with logError | | ⏳ |
| M-06 | RLS auth_rls_initplan on 7 tables | Supabase migration | Wrap auth.uid() in (select ...) | | ⏳ |

## LOW (1)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | 29 tables multiple_permissive_policies, 87 unused indexes, 1 unindexed FK | Supabase schema | Deferred to DB optimization sprint | | 📝 |

## Test Suite Status
- Vitest: pending
- Lint: pending
- Typecheck: pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
