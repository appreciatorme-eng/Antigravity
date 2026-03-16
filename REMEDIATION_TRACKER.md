# Remediation Tracker S41
**Date**: 2026-03-16 | **Branch**: `main` | **Source**: PRODUCTION_READINESS.md (continued from S40)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH — Addressed in S41

| ID | Finding | Action | Outcome | Status |
|----|---------|--------|---------|--------|
| H-07 | Fire-and-forget async calls in assistant stream | 21 void async calls wrapped in try/catch IIFE | Errors now logged; no silent data loss | ✅ |
| H-10 | 26 raw `<img>` tags | 5 files: img → next/image (fill mode + sizes) | WebP + lazy load; PDF HTML intentionally excluded | ✅ |
| H-14 | WPPConnect dead references | Removed WPPCONNECT_* env vars + fallback branches | Meta Cloud API only; no dead code | ✅ |
| H-01 | Subscription limits — itinerary/generate | Requires subscription service investigation | Deferred to dedicated sprint | 📝 |
| H-02 | Subscription limits — reputation AI | Requires subscription service investigation | Deferred to dedicated sprint | 📝 |
| H-06 | Cron job idempotency | Requires Redis key strategy + testing | Deferred to dedicated sprint | 📝 |
| H-08 | 77 routes missing loading.tsx | Bulk mechanical task — 77 files | Deferred to dedicated bulk sprint | 📝 |
| H-09 | 4 client pages → server components | Careful SSR refactor needed | Deferred to dedicated sprint | 📝 |
| H-18 | 94 CASCADE DELETE chains — no soft-delete | Risky DB migration; requires product sign-off | Deferred to dedicated sprint | 📝 |

## MEDIUM — Addressed in S41

| ID | Finding | Action | Status |
|----|---------|--------|--------|
| M-07 | Race condition in reputation AI respond | Non-blocking error handler for concurrent save conflicts | ✅ |
| M-08 | itinerary/generate — no timeout on AI calls | AbortController 30s timeout on Groq + Gemini | ✅ |
| M-10 | Profiles table public enumeration | Migration: org-scoped RLS (was USING(true)) | ✅ |
| M-11 | Missing FK indexes on queue tables | 2 indexes added (notification_dead_letters, pdf_extraction_queue) | ✅ |
| M-12 | 13 placeholder migrations — no docs | supabase/migrations/README.md created | ✅ |
| M-13 | CASCADE on auth.users loses creator | pdf_imports + tour_templates created_by → ON DELETE SET NULL | ✅ |
| M-14 | Text fields missing length constraints | proposal_comments.comment CHECK (≤ 5000 chars) | ✅ |
| M-16 | DriversPageClient 800 lines | Complex refactor — deferred to refactor sprint | 📝 |
| M-17 | AdminRevenueView 794 lines | Complex refactor — deferred to refactor sprint | 📝 |
| M-18 | CreateTripModal 774 lines | Complex refactor — deferred to refactor sprint | 📝 |
| M-19 | itinerary/generate/route.ts 749 lines | Complex refactor — deferred to refactor sprint | 📝 |
| M-20 | Missing React.memo on list components | Performance optimization — deferred | 📝 |
| M-21 | No caching for clients/proposals | Requires Redis strategy — deferred | 📝 |
| M-22 | Duplicate fetch pattern in 20+ handlers | Utility extraction — deferred | 📝 |

## LOW — Addressed in S41

| ID | Finding | Action | Status |
|----|---------|--------|--------|
| L-03 | Webhook invalid sig not rate-limited before DB log | enforceRateLimit (10/min/IP) before whatsapp_webhook_events insert | ✅ |
| L-04 | No org ID validation at auth layer | Low risk — accepted as-is | 📝 |
| L-05 | Admin client import at page level | portal-lookup.ts server-only utility created for pay page | ✅ |
| L-08 | Health check WhatsApp error not granular | Already returns specific missing var names (confirmed) | ✅ |
| L-10 | Missing NOT NULL on business-critical fields | Columns don't match spec — schema verification showed different names | 📝 |
| L-11 | Large admin files need splitting | Deferred with M-16–M-19 refactor sprint | 📝 |
| L-12 | No lazy loading for animation libraries | gsap dynamic import in HeroSection; Spline/ForceField already lazy | ✅ |
| L-14 | Embedding vector dims not validated | Assert length === 1536 in embeddings.ts | ✅ |

## Test Suite Status
- Vitest: 748 tests passed | all thresholds ✅ (80/90/75)
- Playwright E2E: `e2e/tests/remediation-s41.spec.ts` — 21 tests

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| Tracker | ca35e0f4 | 2026-03-16 | chore: create remediation tracker s41 |
| HIGH | 335dc3a4 | 2026-03-16 | fix: remediate HIGH findings (H-07, H-14, M-07, M-08, L-03, L-14) |
| H-10 | 627b20b2 | 2026-03-16 | fix: replace raw img with next/image (H-10) |
| MEDIUM/LOW | 0fea989e | 2026-03-16 | fix: remediate MEDIUM/LOW findings (M-10–M-14, L-05, L-12) |
| E2E | bb2f4224 | 2026-03-16 | test: add E2E tests for remediation s41 |
| Final | — | 2026-03-16 | docs: finalize remediation tracker s41 |
