# Production Readiness Audit — Fix Tracking

**Baseline score**: 61/100 | **Target**: 86/100+
**Scope**: `projects/travel-suite/apps/web` only

---

## Status Legend
- ✅ Fixed
- 🔄 In progress
- ⏳ Pending
- ⏭️ Deferred

---

## Phase 1 — Security + Contract Stabilization

| ID | Priority | Description | Status | Commit |
|----|----------|-------------|--------|--------|
| WEB-P0-04 | P0 | Canonicalize dual WhatsApp webhook → one dispatch entry | ✅ | — |
| WEB-P0-05 | P0 | POST-only cron mutations (GET → 405) | ⏭️ | Deferred: Vercel hobby plan, no cron |
| WEB-P0-06 | P0 | Sanitized error envelope — no raw exception text in 500 responses | ✅ | — |
| WEB-P0-07 | P0 | Upgrade vulnerable prod deps (jspdf chain) | ✅ | — |
| WEB-P1-01 | P1 | Add `ai_text` cost category; fix `ai/respond` metering bucket | ✅ | — |
| WEB-P1-02 | P1 | `ai-poster`: return 503 when Gemini key missing (not synthetic 200) | ✅ | — |
| WEB-P1-06 | P1 | UUID token validation + IP rate limit on NPS/widget public endpoints | ✅ | — |

**Score lift: 61 → 72**

---

## Phase 2 — Feature Reliability

| ID | Priority | Description | Status | Commit |
|----|----------|-------------|--------|--------|
| WEB-P0-01 | P0 | Reputation dashboard: live API data (not mock) | ⏳ | — |
| WEB-P0-02 | P0 | Reputation: URL `?tab=` sync with router | ⏳ | — |
| WEB-P0-03 | P0 | Reputation: save actions wired to `/api/reputation/*` | ⏳ | — |
| WEB-P1-03 | P1 | Review inbox: debounce + AbortController (no double-fetch) | ✅ | — |
| WEB-P1-04 | P1 | CampaignList: remove `window.location.reload`, local state update | ✅ | — |
| WEB-P1-05 | P1 | Competitor benchmark: CRUD API + persisted table | ⏳ | — |

**Score lift: 72 → 79**

---

## Phase 3 — Reliability + Type Hardening

| ID | Priority | Description | Status | Commit |
|----|----------|-------------|--------|--------|
| WEB-P1-07 | P1 | `share/[token]/page.tsx`: use `createAdminClient()` fail-closed | ⏳ | — |
| WEB-P1-08 | P1 | Replace `as any` casts in reputation handlers with typed helpers | ✅ | — |
| WEB-P1-09 | P1 | Migrate hot-path `console.log` to structured logger | ⏳ | — |
| WEB-P2-01 | P2 | `supabase/env.ts`: startup diagnostics, guard fallback from prod | ✅ | — |
| WEB-P2-02 | P2 | Suppress Prisma instrumentation warnings in CI | ⏳ | — |

**Score lift: 79 → 83**

---

## Phase 4 — Testing + Release Gates

| ID | Priority | Description | Status | Commit |
|----|----------|-------------|--------|--------|
| WEB-P1-10 | P1 | CI: add unit + webhook + reputation integration suites to required checks | ⏳ | — |
| WEB-P1-11 | P1 | Build route-to-test ownership matrix; enforce minimum coverage per class | ⏳ | — |

**Score lift: 83 → 86+**

---

## API Contract Changes Required

1. Error envelope: `{ error_code, message, request_id, retry_after? }` — enforce across all handlers
2. `CostCategory` expanded with `ai_text` bucket in `spend-guardrails.ts`
3. WhatsApp webhook: single canonical route `whatsapp/webhook`; `webhooks/whatsapp` removed from dispatch
4. Public token endpoints: UUID-format validation + `X-RateLimit-*` headers on all responses
5. NPS/widget: `error` field never exposes raw DB error messages

---

## Deferred (per user instruction)

- **WEB-P0-05**: Cron GET→POST enforcement — deferred (Vercel hobby plan, crons not active)
- **WEB-P1-05**: Competitor CRUD API — deferred to backlog
- **WEB-P1-09**: Full structured logger migration — scope too large for now
- **WEB-P2-02**: Prisma warning suppression — no Prisma in active use

---

*Last updated: 2026-03-04*
