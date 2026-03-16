# Remediation Tracker S41
**Date**: 2026-03-16 | **Branch**: `fix/remediation-s41` | **Source**: PRODUCTION_READINESS.md (continued from S40)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH — Remaining from S40 (9 ⏳)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-07 | Fire-and-forget async calls — audit trail data loss | `assistant/chat/stream/route.ts:316,337,347` | Wrap void async calls in try/catch with logError; preserve streaming perf by not awaiting | Failures logged; no silent data loss | ⏳ |
| H-09 | 4 client pages that should be server components | `admin/page.tsx`, `settings/page.tsx`, `proposals/[id]/page.tsx`, `admin/tour-templates/page.tsx` | Convert useEffect fetches → async server fetches; pass data as props | 300–500ms faster TTFB; CDN cacheable | ⏳ |
| H-10 | 26 raw `<img>` tags — no Next.js optimization | Multiple files | Replace with `next/image` + width/height/fill | 200–500KB saved per page; WebP + lazy load | ⏳ |
| H-14 | WPPConnect fallback file missing (dead code path) | `whatsapp/connect/route.ts:21` | Remove WPPConnect env var checks; document Meta Cloud as sole path | No dead code; clear architecture | ⏳ |
| H-01 | Subscription limits not enforced on itinerary/generate | `itinerary/generate/route.ts` | Add `checkUsageAllowed(ctx)` before AI generation | Free users blocked from paid feature | ⏳ |
| H-02 | Subscription limits not enforced on reputation AI | `reputation/ai/analyze/route.ts`, `respond/route.ts`, `batch-analyze/route.ts` | Add `checkUsageAllowed(ctx, 'reputation_ai')` | Tier limits enforced | ⏳ |
| H-06 | Cron jobs have no idempotency | All `cron/` handlers | Redis `cron:<job>:<date>` key check before processing | No duplicate emails on double-fire | ⏳ |
| H-08 | 77 routes missing `loading.tsx` | 77 route dirs | Create `loading.tsx` with skeleton per route | No blank white screens on load | ⏳ |
| H-18 | 94 CASCADE DELETE chains — no soft-delete | Multiple migrations | Add `deleted_at TIMESTAMPTZ` to high-value tables; filter with `WHERE deleted_at IS NULL` | Data recoverable; no permanent wipe | ⏳ |

## MEDIUM — Remaining from S40 (14 ⏳)

| ID | Finding | File:Line | Action | Status |
|----|---------|-----------|--------|--------|
| M-07 | Race condition in reputation AI respond | `reputation/ai/respond/route.ts:157` | Use `INSERT … ON CONFLICT DO UPDATE` | ⏳ |
| M-08 | itinerary/generate — no timeout on AI calls | `itinerary/generate/route.ts` | Wrap AI calls with AbortController 30s timeout | ⏳ |
| M-10 | Profiles table allows public enumeration | Init migration | Restrict RLS: same-org profiles only | ⏳ |
| M-11 | Missing FK indexes on queue tables | `notification_queue`, `pdf_extraction_queue` | Add 3 index migrations | ⏳ |
| M-12 | 13 placeholder migrations — no docs | `supabase/migrations/` | Add README.md documenting each placeholder | ⏳ |
| M-13 | CASCADE on auth.users loses creator attribution | Multiple `created_by` FKs | Change to `ON DELETE SET NULL` | ⏳ |
| M-14 | Text fields missing length constraints | `proposal_comments`, `notification_logs`, etc. | Add `CHECK (char_length(col) <= N)` constraints | ⏳ |
| M-16 | DriversPageClient 800 lines, 76 states | `DriversPageClient.tsx` | Extract sub-components + useReducer | ⏳ |
| M-17 | AdminRevenueView 794 lines | `AdminRevenueView.tsx` | Extract chart/table/filters sections | ⏳ |
| M-18 | CreateTripModal 774 lines | `CreateTripModal.tsx` | Extract importer and generator | ⏳ |
| M-19 | itinerary/generate/route.ts 749 lines | `itinerary/generate/route.ts` | Extract orchestrator/prompt-builder/assembler | ⏳ |
| M-20 | Missing React.memo on list components | `TripCardGrid.tsx`, admin rows | Wrap with React.memo; useCallback on handlers | ⏳ |
| M-21 | No caching for clients/proposals data | Multiple handlers | `unstable_cache` / Redis 5min TTL | ⏳ |
| M-22 | Duplicate fetch pattern in 20+ handlers | Multiple | Create `src/lib/fetch-json.ts` utility | ⏳ |

## LOW — Remaining from S40 (8 ⏳)

| ID | Finding | Action | Status |
|----|---------|--------|--------|
| L-03 | Webhook invalid sig not rate-limited before logging | Check rate limit before DB insert | ⏳ |
| L-04 | No org ID validation at auth layer | Optional `validateOrgId` param in requireAdmin | ⏳ |
| L-05 | Admin client import at page level | Move to server utility | ⏳ |
| L-08 | Health check WhatsApp error not granular | Return specific missing var names | ⏳ |
| L-10 | Missing NOT NULL on business-critical fields | Migration with DEFAULT | ⏳ |
| L-11 | Large admin files need splitting | Follow M-16 pattern | ⏳ |
| L-12 | No lazy loading for animation libraries | `dynamic()` import | ⏳ |
| L-14 | Embedding vector dims not validated at runtime | Assert `embedding.length === 1536` | ⏳ |

## Test Suite Status
- Vitest: pending
- Playwright E2E: `e2e/tests/remediation-s41.spec.ts` — pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| Tracker | — | 2026-03-16 | chore: create remediation tracker s41 |
