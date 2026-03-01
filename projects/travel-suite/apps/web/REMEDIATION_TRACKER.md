# Travel Suite Web Remediation Tracker (Round 5)

This tracker is based on the latest full review of `main` and is focused on closing remaining security, tenant-isolation, reliability, and cost-control gaps.

## Round 5 Completion Summary

- `[x]` AGW5-SEC-001: Enforced strict org-scoped access for marketplace verification list/mutation APIs.
- `[x]` AGW5-PERF-001: Added scoped marketplace verification cache with mutation-time invalidation and endpoint rate limiting.
- `[x]` AGW5-TEST-001: Added public/non-admin contract coverage for marketplace verification authz behavior.

## Round 4 Completion Summary

- `[x]` AGW4-OBS-001: Added cost-overview cache invalidation hooks on cap updates and alert acknowledgments.
- `[x]` AGW4-DATA-001: Added dedicated cost alert acknowledgment store + event history tables with RLS policies.
- `[x]` AGW4-TEST-001: Added contract coverage for stale-fallback behavior and alert-ack authz/isolation paths.
- `[x]` AGW4-QUAL-002: Reduced targeted lint warnings in add-ons/admin-insights API/UI modules.

## Round 3 Completion Summary

- `[x]` AGW3-OBS-002: Added cached admin cost overview reads with stale-fallback behavior.
- `[x]` AGW3-SEC-001: Added throttled and sampled admin auth-failure telemetry.
- `[x]` AGW3-OPS-001: Added alert acknowledgment API and UI workflow.
- `[x]` AGW3-OPS-002: Upgraded runbook metadata model (id/version/owner/SLA/url) in alert payloads.
- `[x]` AGW3-QUAL-001: Removed targeted lint debt in `add-ons` (hook dependencies and unsafe `any` cast).

## Operating Rules

- Status legend: `[ ]` Not started, `[~]` In progress, `[x]` Done, `[!]` Blocked.
- Only one `P0` item can be `[~]` at a time.
- Every item must satisfy Definition of Done before moving to `[x]`.
- Each merge commit should reference one or more tracker IDs.
- Update this tracker in every remediation commit.

## Current Baseline Scores (/10)

- Architecture & Codebase Structure: `7.8`
- Security & Data Protection: `6.6`
- Reliability & Fault Tolerance: `7.4`
- Performance & Scalability: `7.6`
- Testability & QA Readiness: `8.2`
- Maintainability & Type Safety: `7.3`
- UX/UI for Tour-Operator Workflows: `8.0`
- Monetization Readiness: `7.8`
- Cost Efficiency (COGS Control): `7.0`
- Observability & Operability: `7.2`
- Weighted overall SaaS readiness: `7.5`

## Target Scores

- 30-day target weighted score: `8.0`
- 60-day target weighted score: `8.4`
- 90-day target weighted score: `8.8`

## Workstreams and Action Items

## WS-A: Tenant Isolation and Admin Safety (P0)

### AGW2-SEC-001: Enforce org-scoped reads for admin cost overview

- Status: `[x]`
- Priority: `P0`
- Primary files:
  - `src/app/api/admin/cost/overview/route.ts`
- Actions:
  - Enforce organization scoping for non-super-admin reads.
  - Move global aggregates behind explicit super-admin path.
- Definition of Done:
  - Org admins can only see their org data.
  - Super-admin-only path required for global cost overview.
  - Regression tests cover cross-tenant access denial.
- Score impact target:
  - Security `+0.4`, Observability `+0.2`

### AGW2-SEC-002: Restrict emergency cap mutation to super-admin only

- Status: `[x]`
- Priority: `P0`
- Primary files:
  - `src/app/api/admin/cost/overview/route.ts`
- Actions:
  - Require explicit super-admin privilege for cap toggles and updates.
  - Add mutation audit log with actor and payload summary.
- Definition of Done:
  - Non-super-admin receives `403` for cap mutation.
  - Every cap mutation is auditable.
- Score impact target:
  - Security `+0.3`, Operability `+0.2`

### AGW2-SEC-003: Add org scoping for command center queue data

- Status: `[x]`
- Priority: `P0`
- Primary files:
  - `src/app/api/admin/operations/command-center/route.ts`
- Actions:
  - Enforce tenant filter for queue reads.
  - Add a shared tenant-scope helper and fail-closed behavior.
- Definition of Done:
  - Queue rows are always scoped to caller organization.
  - Missing org context fails request with explicit error.
- Score impact target:
  - Security `+0.3`, Reliability `+0.2`

## WS-B: OAuth Integrity and Secret Protection (P0)

### AGW2-SEC-004: Harden OAuth state with signature and replay protection

- Status: `[x]`
- Priority: `P0`
- Primary files:
  - `src/app/api/social/oauth/facebook/route.ts`
  - `src/app/api/social/oauth/callback/route.ts`
- Actions:
  - Replace unsigned state payload with signed token.
  - Add nonce + TTL replay protection and callback binding checks.
- Definition of Done:
  - Tampered/replayed state is rejected deterministically.
  - OAuth callback requires valid signed state.
- Score impact target:
  - Security `+0.6`, Reliability `+0.2`

### AGW2-SEC-005: Encrypt provider access tokens at rest

- Status: `[x]`
- Priority: `P0`
- Primary files:
  - `src/app/api/social/oauth/callback/route.ts`
  - token persistence/access helpers under `src/lib/**`
- Actions:
  - Implement envelope encryption for provider tokens.
  - Rotate old plaintext-stored tokens via migration/rehydration path.
- Definition of Done:
  - No plaintext token writes in production paths.
  - Reads/writes use encryption helper consistently.
  - Recovery procedure documented for key rotation.
- Score impact target:
  - Security `+0.7`, Compliance readiness `+0.2`

## WS-C: Cost Guard and Abuse Closure (P0)

### AGW2-COST-001: Decommission public `/api/unsplash` bypass path

- Status: `[x]`
- Priority: `P0`
- Primary files:
  - `src/app/api/unsplash/route.ts`
  - `src/app/social/_components/SocialStudioClient.tsx`
- Actions:
  - Remove or fully gate public route.
  - Route image fetches through authenticated cost-guarded endpoints.
- Definition of Done:
  - No public unauthenticated media-cost endpoint remains.
  - Social Studio uses only guarded media routes.
- Score impact target:
  - Cost `+0.5`, Security `+0.3`

### AGW2-COST-002: Make spend-cap checks atomic under concurrency

- Status: `[x]`
- Priority: `P0`
- Primary files:
  - `src/lib/security/cost-endpoint-guard.ts`
- Actions:
  - Replace check-then-increment with atomic reservation/update.
  - Add deterministic denial behavior at cap boundary.
- Definition of Done:
  - Parallel requests cannot overshoot hard caps.
  - Concurrency tests validate no race bypass.
- Score impact target:
  - Reliability `+0.4`, Cost `+0.4`

### AGW2-COST-003: Remove non-distributed in-memory spend fallback in production

- Status: `[x]`
- Priority: `P0`
- Primary files:
  - `src/lib/cost/spend-guardrails.ts`
- Actions:
  - Disable mutating in-memory fallback in production.
  - Require shared durable store for metering state.
- Definition of Done:
  - Multi-instance deployments have consistent cap enforcement.
  - Production startup fails fast on missing critical metering backend.
- Score impact target:
  - Reliability `+0.3`, Cost `+0.3`, Operability `+0.2`

## WS-D: HTTP Method and Control Plane Hardening (P1)

### AGW2-SEC-006: Convert destructive cache clear from GET to POST/DELETE

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `src/app/api/admin/clear-cache/route.ts`
- Actions:
  - Move mutation to POST/DELETE only.
  - Add CSRF and elevated role guard.
- Definition of Done:
  - GET is safe and non-mutating.
  - Cache mutation requires authenticated authorized caller.
- Score impact target:
  - Security `+0.2`, Reliability `+0.2`

## WS-E: Quality, Tests, and Operability (P1)

### AGW2-QUAL-001: Reduce high-risk lint warning hotspots

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `src/hooks/useRealtimeProposal.ts`
  - `src/app/admin/trips/page.tsx`
  - `src/components/trips/GroupManager.tsx`
- Actions:
  - Resolve render-phase ref and state-in-effect anti-patterns.
  - Burn down top warning clusters in core workflows first.
- Definition of Done:
  - Warning count reduced and hotspots eliminated in critical modules.
  - Behavior parity validated through unit/e2e checks.
- Score impact target:
  - Maintainability `+0.4`, Reliability `+0.2`

### AGW2-TEST-001: Add tenant-isolation and authz negative API tests

- Status: `[x]`
- Priority: `P1`
- Actions:
  - Add unauthorized/cross-tenant access scenarios for admin and ops APIs.
  - Add regression tests for all WS-A endpoints.
- Definition of Done:
  - CI fails on any cross-tenant data exposure regression.
- Score impact target:
  - Security `+0.3`, Testability `+0.3`

### AGW2-TEST-002: Add cap-race and quota-bypass tests

- Status: `[x]`
- Priority: `P1`
- Actions:
  - Add concurrent request tests for cap boundaries.
  - Add public endpoint abuse tests for media/AI routes.
- Definition of Done:
  - Cap race condition is test-guarded.
  - Bypass vectors are test-covered and blocked.
- Score impact target:
  - Reliability `+0.3`, Cost `+0.3`, Testability `+0.2`

### AGW2-OBS-001: Add cost and abuse anomaly alerts

- Status: `[x]`
- Priority: `P1`
- Actions:
  - Emit alerts for sudden cost spikes, repeated auth failures, and cap hit rate anomalies.
  - Build tenant-level weekly margin report.
- Definition of Done:
  - Alerting exists with clear ownership and runbook references.
  - Margin trends visible per tenant and feature category.
- Score impact target:
  - Operability `+0.5`, Cost `+0.2`

## WS-F: Monetization and Tour-Operator Conversion (P2)

### AGW2-MON-001: Add credit-pack overage and margin-safe packaging

- Status: `[x]`
- Priority: `P2`
- Actions:
  - Introduce prepaid overage packs for AI/media usage.
  - Gate premium automations behind transparent per-pack economics.
- Definition of Done:
  - Overages are predictable and margin-positive.
  - Pricing and limits are consistent across UI, API, and billing logic.
- Score impact target:
  - Monetization `+0.5`, Cost `+0.2`

### AGW2-UX-001: Strengthen daily operator workflow conversion loops

- Status: `[x]`
- Priority: `P2`
- Actions:
  - Add actionable Daily Ops board metrics (at-risk departures, pending payments, expiring quotes).
  - Tie upgrades to outcome events (time saved, recovered revenue, response SLA).
- Definition of Done:
  - Daily board usage and conversion events are measurable.
  - Upgrade prompts are event-driven and outcome-linked.
- Score impact target:
  - UX `+0.4`, Monetization `+0.3`

## WS-G: Round 3 Reliability and Operability Hardening (P1)

### AGW3-OBS-002: Cache admin cost overview with stale fallback

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `src/app/api/admin/cost/overview/route.ts`
- Actions:
  - Add scoped cache keys for cost overview responses.
  - Serve stale cache snapshot if live data providers fail.
  - Return cache metadata (`hit/miss/stale_fallback`) to UI.
- Definition of Done:
  - Repeated reads avoid redundant heavy aggregation queries.
  - Live-query outages degrade to stale snapshot instead of hard failure.
  - Cache status is visible in admin UI.
- Score impact target:
  - Performance `+0.3`, Reliability `+0.3`, Operability `+0.2`

### AGW3-SEC-001: Throttle and sample admin auth-failure telemetry

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `src/lib/auth/admin.ts`
- Actions:
  - Apply rate limiting to auth-failure telemetry inserts.
  - Sample anonymous auth-failure noise while preserving signal.
- Definition of Done:
  - Burst auth-failure events do not flood telemetry tables.
  - Security signal remains available for alerting.
- Score impact target:
  - Security `+0.2`, Operability `+0.2`

### AGW3-OPS-001: Add alert acknowledgment workflow

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `src/app/api/admin/cost/alerts/ack/route.ts`
  - `src/app/admin/cost/page.tsx`
  - `src/app/api/admin/cost/overview/route.ts`
- Actions:
  - Add authenticated alert acknowledgment endpoint.
  - Surface acknowledgment controls and status in cost UI.
  - Hydrate acknowledged state in alert payload.
- Definition of Done:
  - Admins can acknowledge active alerts with audit trail.
  - UI reflects acknowledged state and timestamp.
- Score impact target:
  - Operability `+0.4`, UX `+0.2`

### AGW3-OPS-002: Formalize runbook metadata contract

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `src/app/api/admin/cost/overview/route.ts`
  - `src/app/admin/cost/page.tsx`
- Actions:
  - Replace string runbook links with structured metadata (`id/version/owner/SLA/url`).
  - Render metadata context in alert cards.
- Definition of Done:
  - Alert payload contract carries operational metadata.
  - UI shows runbook version and response SLA.
- Score impact target:
  - Operability `+0.3`, Maintainability `+0.2`

### AGW3-QUAL-001: Targeted lint debt reduction in add-ons workflow

- Status: `[x]`
- Priority: `P2`
- Primary files:
  - `src/app/add-ons/page.tsx`
- Actions:
  - Convert filtering and data loading logic to stable callbacks.
  - Remove unsafe `any` cast for badge variants.
- Definition of Done:
  - No hook dependency warning in add-ons page.
  - No unsafe `any` cast in add-ons badge rendering.
- Score impact target:
  - Maintainability `+0.2`, Reliability `+0.1`

## WS-H: Round 4 Cache/Data/Test Continuation (P1)

### AGW4-OBS-001: Invalidate cost-overview cache on mutation paths

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `src/lib/cost/overview-cache.ts`
  - `src/app/api/admin/cost/overview/route.ts`
  - `src/app/api/admin/cost/alerts/ack/route.ts`
- Actions:
  - Add shared cost-overview cache namespace utilities.
  - Invalidate cache after emergency-cap changes and alert acknowledgments.
- Definition of Done:
  - Admin cost views reflect updates immediately without waiting for TTL expiry.
  - Invalidation is best-effort and non-blocking for mutation success.
- Score impact target:
  - Performance `+0.2`, Operability `+0.3`

### AGW4-DATA-001: Move alert acknowledgments to dedicated tables

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `supabase/migrations/20260301071000_cost_alert_ack_store.sql`
  - `src/lib/cost/alert-ack.ts`
  - `src/lib/database.types.ts`
- Actions:
  - Add `cost_alert_acknowledgments` table with unique `(alert_id, organization_id)`.
  - Add `cost_alert_ack_events` table for actor/event history.
  - Implement API read/write helpers with legacy fallback compatibility.
- Definition of Done:
  - Acknowledgment state loads from dedicated store when available.
  - Actor history is recorded for each acknowledgment.
  - Legacy log path remains compatible during migration rollout.
- Score impact target:
  - Security `+0.2`, Operability `+0.3`, Maintainability `+0.2`

### AGW4-TEST-001: Add cache-fallback and alert-ack isolation contracts

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `e2e/tests/admin-cost-overview-cache.contract.spec.ts`
  - `e2e/tests/admin-tenant-isolation.contract.spec.ts`
- Actions:
  - Add forced-failure stale-cache contract test in admin scope.
  - Add unauthenticated/non-admin/foreign-org ack endpoint authz checks.
- Definition of Done:
  - CI listing includes stale-fallback contract tests.
  - Ack authz/isolation regressions are contract-guarded.
- Score impact target:
  - Testability `+0.3`, Reliability `+0.2`

### AGW4-QUAL-002: Continue low-risk lint warning burn-down

- Status: `[x]`
- Priority: `P2`
- Primary files:
  - `src/app/api/add-ons/route.ts`
  - `src/app/api/add-ons/[id]/route.ts`
  - `src/app/admin/insights/page.tsx`
- Actions:
  - Remove unused imports and small static warning hotspots.
- Definition of Done:
  - Warning count decreases in modified modules.
  - No behavior changes in affected routes/pages.
- Score impact target:
  - Maintainability `+0.1`

## WS-I: Round 5 Marketplace Admin Hardening (P1)

### AGW5-SEC-001: Enforce org-scoped access for marketplace verification APIs

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `src/app/api/admin/marketplace/verify/route.ts`
- Actions:
  - Replace custom auth checks with shared `requireAdmin` guard.
  - Scope non-super-admin reads/mutations to caller organization.
- Definition of Done:
  - Non-super-admin cannot verify or list other organizations.
  - Super-admin retains global review capability.
- Score impact target:
  - Security `+0.4`, Reliability `+0.2`

### AGW5-PERF-001: Add scoped cache and rate limiting for marketplace verification

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `src/app/api/admin/marketplace/verify/route.ts`
  - `src/lib/marketplace-verify-cache.ts`
- Actions:
  - Cache pending-verification list responses by scope.
  - Invalidate cache on verification mutation.
  - Add list/mutation endpoint rate limiting and response headers.
- Definition of Done:
  - Repeated reads avoid redundant query load in admin review workflow.
  - Cache is invalidated immediately after status updates.
  - Abuse bursts are throttled with deterministic `429` handling.
- Score impact target:
  - Performance `+0.3`, Cost `+0.2`, Operability `+0.2`

### AGW5-TEST-001: Expand verification endpoint authz contract coverage

- Status: `[x]`
- Priority: `P1`
- Primary files:
  - `e2e/tests/public-api.contract.spec.ts`
  - `e2e/tests/admin-api-authz.spec.ts`
- Actions:
  - Add unauthenticated contracts for marketplace verification GET/POST endpoints.
  - Add non-admin forbidden contracts for marketplace verification GET/POST endpoints.
- Definition of Done:
  - Public contract suite blocks unauthenticated marketplace verification access.
  - Admin authz suite blocks non-admin marketplace verification access.
- Score impact target:
  - Security `+0.2`, Testability `+0.2`

## Strict Execution Order

1. `AGW2-SEC-001`
2. `AGW2-SEC-002`
3. `AGW2-SEC-003`
4. `AGW2-SEC-004`
5. `AGW2-SEC-005`
6. `AGW2-COST-001`
7. `AGW2-COST-002`
8. `AGW2-COST-003`
9. `AGW2-SEC-006`
10. `AGW2-TEST-001`
11. `AGW2-TEST-002`
12. `AGW2-QUAL-001`
13. `AGW2-OBS-001`
14. `AGW2-MON-001`
15. `AGW2-UX-001`
16. `AGW3-OBS-002`
17. `AGW3-SEC-001`
18. `AGW3-OPS-001`
19. `AGW3-OPS-002`
20. `AGW3-QUAL-001`
21. `AGW4-OBS-001`
22. `AGW4-DATA-001`
23. `AGW4-TEST-001`
24. `AGW4-QUAL-002`
25. `AGW5-SEC-001`
26. `AGW5-PERF-001`
27. `AGW5-TEST-001`

## Sprint Breakdown

### Sprint 1 (P0 Security and Cost Closure)

- `[x]` AGW2-SEC-001
- `[x]` AGW2-SEC-002
- `[x]` AGW2-SEC-003
- `[x]` AGW2-SEC-004
- `[x]` AGW2-SEC-005
- `[x]` AGW2-COST-001
- `[x]` AGW2-COST-002
- `[x]` AGW2-COST-003

### Sprint 2 (Control Plane and Test Hardening)

- `[x]` AGW2-SEC-006
- `[x]` AGW2-TEST-001
- `[x]` AGW2-TEST-002
- `[x]` AGW2-QUAL-001
- `[x]` AGW2-OBS-001

### Sprint 3 (Monetization and Conversion Lift)

- `[x]` AGW2-MON-001
- `[x]` AGW2-UX-001

### Sprint 4 (Round 3 Hardening)

- `[x]` AGW3-OBS-002
- `[x]` AGW3-SEC-001
- `[x]` AGW3-OPS-001
- `[x]` AGW3-OPS-002
- `[x]` AGW3-QUAL-001

### Sprint 5 (Round 4 Continuation)

- `[x]` AGW4-OBS-001
- `[x]` AGW4-DATA-001
- `[x]` AGW4-TEST-001
- `[x]` AGW4-QUAL-002

### Sprint 6 (Round 5 Marketplace Admin Hardening)

- `[x]` AGW5-SEC-001
- `[x]` AGW5-PERF-001
- `[x]` AGW5-TEST-001

## Progress Log

- 2026-03-01: Replaced the previous fully-checked tracker with this Round 2 tracker based on the latest post-remediation line-by-line review findings.
- 2026-03-01: No code changes in this commit; tracker-only planning update.
- 2026-03-01: Completed WS-A through WS-E remediation items including tenant isolation, OAuth/token hardening, cost guardrail closure, control-plane method/CSRF hardening, lint hotspot reduction, and expanded authz/cost contract tests.
- 2026-03-01: Completed WS-F monetization and UX items by introducing margin-safe prepaid credit-pack catalog, premium automation gating in subscription limits and billing UI, Daily Ops board metrics, and outcome-linked upgrade prompts.
- 2026-03-01: Added anomaly alerting and tenant weekly margin reporting in cost overview, including cost-spike/cap-hit/auth-failure signals with runbook references.
- 2026-03-01: Validation run completed (`typecheck` pass, `lint` pass with warnings only, `test:e2e:public` pass, `test:e2e -- --list` pass).
- 2026-03-01: Completed Round 3 hardening by adding cached/stale cost overview reads, auth-failure telemetry throttling + sampling, alert acknowledgment workflow, structured runbook metadata, and targeted add-ons lint cleanup.
- 2026-03-01: Completed Round 4 continuation by adding mutation-triggered cost-overview cache invalidation, dedicated acknowledgment tables + history migration, stale-fallback/authz contract tests, and additional lint hotspot cleanup.
- 2026-03-01: Completed Round 5 marketplace admin hardening with shared admin auth guard adoption, strict org-scoped verification controls, scoped verification caching + mutation invalidation + throttling, and added endpoint authz contracts.
