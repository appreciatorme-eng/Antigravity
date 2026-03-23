# Remediation Tracker S42
**Date**: 2026-03-23 | **Branch**: `fix/remediation-s42` | **Source**: /review-deep S37

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH (2)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | N+1 DB writes in process-queue (per-item claim+status UPDATE) | process-publish-queue.server.ts | Batch UPDATE with .in() | Batch claim replaces N serial UPDATEs | ✅ |
| H-02 | N+1 DB writes in broadcast (per-recipient INSERT) | whatsapp/broadcast/route.ts | Verify batch insert | Already batch — uses .insert([...array]) | 📝 |

## MEDIUM (6)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | Health endpoint no rate limit | health/route.ts | Add enforcePublicRouteRateLimit | 30 req/min per IP | ✅ |
| M-02 | batch-analyze N+1 Redis/DB | reputation/ai/batch-analyze | Pre-reserve budget | Deferred — low traffic endpoint | 📝 |
| M-03 | Empty catch swallows Redis TTL error | itinerary/generate/route.ts:325 | Add logError | Captures error var, logs via logError | ✅ |
| M-04 | db_error leaks schema in webhook logs | payments/webhook/route.ts | Sanitize to error code | "database_write_failed" + server-side logError | ✅ |
| M-05 | console.error instead of logError | leads/convert/route.ts:156 | Replace with logError | Already fixed in current code | 📝 |
| M-06 | RLS auth_rls_initplan on 7 tables | Supabase migration | Wrap auth.uid() in subselect | Already uses subselect or service role policies | 📝 |

## LOW (1)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | 29 tables multiple_permissive_policies, 87 unused indexes, 1 unindexed FK | Supabase schema | Deferred to DB optimization sprint | | 📝 |

## Test Suite Status
- Vitest: 758/758 pass
- Typecheck: 0 errors
- Lint: 7 pre-existing warnings (no new)

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| HIGH+MEDIUM | TBD | 2026-03-23 | Batch process-queue, health rate limit, error handling fixes |
