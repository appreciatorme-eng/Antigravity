# Travel Suite Hardening + Growth Tracker (Commit 20139eb)

Date started: 2026-02-26
Owner: Codex
Scope: Security (P0-P2), reliability, monetization readiness, innovation features, cost controls, Vercel deployment health

Status legend: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`

## 1) Critical Security and Isolation

| ID | Priority | Item | Status | Verification |
|---|---|---|---|---|
| SEC-001 | P0 | Lock down `/api/admin/clear-cache` (auth + role + org-safe behavior) | DONE | Endpoint now uses `requireAdmin`, super-admin full purge gating, and org-scoped deletion for non-super-admins |
| SEC-002 | P0 | Enforce organization scope in `/api/location/share` for GET/POST/DELETE | DONE | All share operations route through scoped trip resolution with org isolation |
| SEC-003 | P0 | Enforce org-scoped notification send (trip/user/email targets) | DONE | Trip/user/email target resolution now enforces org scope and returns 404 when out-of-scope |
| SEC-004 | P1 | Remove agents auth bypass when Supabase env missing | DONE | Auth bypass now requires explicit `ALLOW_DEV_AUTH_BYPASS=true`; otherwise endpoint returns 503 |
| SEC-005 | P1 | Add ownership check in agents `/conversations/{user_id}` | DONE | Non-owner conversation access now denied with 403 (except explicit dev bypass identity) |
| SEC-006 | P1 | Add payment webhook idempotency safeguards | DONE | Payment reference dedupe in service + migration/index `idx_invoice_payments_reference_unique` |
| SEC-007 | P1 | Make client deletion safer/transactional best-effort with rollback semantics | DONE | Snapshot + rollback upsert logic added around auth/profile/client delete flow |
| SEC-008 | P2 | Sanitize search filter assembly in trip listing endpoints | DONE | Search input sanitized and unsafe filter delimiters stripped before PostgREST `.or(...)` |
| SEC-009 | P2 | Normalize admin/super_admin checks across admin routes | DONE | `notifications/process-queue` and shared auth helpers now accept `super_admin` consistently |

## 2) Reliability and Engineering Quality

| ID | Priority | Item | Status | Verification |
|---|---|---|---|---|
| REL-001 | P1 | Fix high-impact TS/lint blockers in touched modules | DONE | Resolved blocker set and validated with `npm run build` (Next.js + TypeScript pass) plus scoped `eslint` on changed files |
| REL-002 | P1 | Fix agents dependency break (`agno.team` import compatibility) | DONE | Added `TeamShim` + agno compatibility layer (`TextKnowledgeBase`, `CombinedKnowledgeBase`, AgentMemory/runtime wrapper); `pytest` passes in `apps/agents` |
| REL-003 | P2 | Add/strengthen tests around new auth/org guards | DONE | Added auth guard contract tests for `/api/admin/clear-cache` and `/api/location/share` + non-admin authz coverage for clear-cache/location-share/notification-send; `npm run test:e2e:public` now passes (9/9) |

## 3) Product Improvements (Monetization + Operator Value)

| ID | Priority | Item | Status | Verification |
|---|---|---|---|---|
| PROD-001 | High | Add operator ROI metrics endpoint (time saved/conversion proxy/throughput) | DONE | Added `/api/admin/insights/roi` with org-scoped conversion, throughput, revenue and ROI proxy metrics |
| PROD-002 | High | Add proposal risk scoring utility for prioritization | DONE | Added `/api/admin/insights/proposal-risk` with scored risk tiers, reasons, and next actions |
| PROD-003 | High | Add upsell recommendation scaffold API (org-scoped, low-cost rules) | DONE | Added `/api/admin/insights/upsell-recommendations` with ranking, attach/conversion rates, and untapped revenue |

## 4) Innovative Features (Practical Initial Release)

| ID | Priority | Item | Status | Verification |
|---|---|---|---|---|
| INNO-001 | Medium | Add "Best Quote Composer" starter API (3 package variants) | DONE | Added `/api/admin/insights/best-quote` returning value/balanced/premium packages + positioning |
| INNO-002 | Medium | Add "Ops Copilot" daily actions API | DONE | Added `/api/admin/insights/ops-copilot` with prioritized queue and operational playbook |

## 5) Cost Controls While Building

| ID | Priority | Item | Status | Verification |
|---|---|---|---|---|
| COST-001 | High | Add per-org AI monthly spend guardrails with graceful fallback | DONE | `itinerary/generate` now checks org monthly caps and skips heavy model calls when capped |
| COST-002 | High | Add hard request budgets per org for costly generation paths | DONE | Added `organization_ai_usage` table + usage tracking events (`ai_generation`, `rag_hit`, `cache_hit`, `fallback`) |
| COST-003 | Medium | Add explicit low-cost mode switch in itinerary generation pipeline | DONE | Added `AI_LOW_COST_MODE` env switch to force cache/RAG/fallback path |

## 6) Deployment and Vercel Auto-Deploy

| ID | Priority | Item | Status | Verification |
|---|---|---|---|---|
| DEP-001 | High | Diagnose why auto deployments are not triggering | DONE | Root causes identified: wrong working directory for Vercel CLI + missing hook env binding + weak token fallback behavior |
| DEP-002 | High | Fix GitHub Action deploy workflow path/cwd and token handling robustness | DONE | Workflow now runs from `projects/travel-suite/apps/web`, validates token explicitly, and supports deploy-hook fallback |
| DEP-003 | High | Verify production deploy command and health checks | DONE | Successful `npx vercel deploy --prod --yes` to `https://web-5inzwqojz-avinashs-projects-5f49190e.vercel.app`; health probe passed on alias `https://web-two-iota-97.vercel.app/api/health` (HTTP 200) |

## 7) Execution Notes

- This tracker is updated continuously as implementation progresses.
- Any blocked item will include concrete blocker details and next action.
- Deployment root-cause summary:
  - Action-based Vercel deploy was running from repo root instead of the web app directory.
  - Deploy-hook fallback step referenced `VERCEL_DEPLOY_HOOK_URL` without exporting it to runtime env.
  - Health verification was absent; added optional health check endpoint probe via secret.
- Completion summary:
  - `npm ci` lockfile mismatch was resolved by syncing `apps/web/package-lock.json`.
  - Next.js middleware/proxy conflict and multiple build/type blockers were fixed; production build now succeeds.
  - Public auth contract tests pass and production deployment health check is verified.

## 8) Progress Log

| Time (UTC) | Update |
|---|---|
| 2026-02-26T00:00:00Z | Tracker created. Implementation started from commit `20139eb`. |
| 2026-02-26T01:25:00Z | Completed P0/P1/P2 security hardening paths for cache clear, location share, notification send scope, client delete safety, and webhook idempotency. |
| 2026-02-26T02:10:00Z | Added org AI guardrails (schema + migration + runtime tracking/fallback) and implemented low-cost mode switch in itinerary generation. |
| 2026-02-26T02:45:00Z | Added innovation/product APIs: ROI, proposal risk scoring, upsell recommendations, best quote composer, ops copilot; shipped `/admin/insights` UI and dashboard/sidebar entry points. |
| 2026-02-26T03:15:00Z | Patched agents for `agno==0.1.0` compatibility (`TeamShim`, knowledge import fallback, memory wrapper, test-mode rate-limit bypass); `apps/agents` test suite now passing (48 passed). |
| 2026-02-26T03:25:00Z | Hardened Vercel workflow with app `working-directory`, deploy-hook env wiring, optional production health check, and robust token-fallback behavior. |
| 2026-02-26T05:50:00Z | Triggered GitHub Actions workflow dispatch run `22429707373` for "Vercel Production Deploy": workflow succeeded, but Action-based deploy skipped because `VERCEL_TOKEN` is invalid (fallback path used). |
| 2026-02-26T06:06:00Z | Added strengthened API auth test coverage (`public-api.contract.spec.ts`, `admin-api-authz.spec.ts`) for hardened clear-cache/location-share/notification-send guards; public contract suite passing (9/9). |
| 2026-02-26T06:10:00Z | Cleared web build blockers: unified to single `src/proxy.ts`, fixed dashboard/import/type issues, and resolved toast variant typing mismatches; `npm run build` now green. |
| 2026-02-26T06:13:00Z | Verified production deploy end-to-end via Vercel CLI (`npx vercel deploy --prod --yes`) and validated health endpoint `https://web-two-iota-97.vercel.app/api/health` returns HTTP 200. |
