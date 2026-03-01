# Travel Suite Web Remediation Tracker

This tracker converts the deep review into executable work. It is designed for sequential delivery: complete one item, validate, mark done, then move to the next.

## Rules of Execution

- Status legend: `[ ]` Not started, `[~]` In progress, `[x]` Done, `[!]` Blocked.
- Only one `P0` item should be in progress at a time.
- Every item must pass its Definition of Done before marking `[x]`.
- Keep commits small and linked to one or more item IDs.
- Update this tracker in every remediation PR.

## Baseline Scores (From Review)

- Architecture & Codebase Structure: `6.5/10`
- Security & Data Protection: `3.0/10`
- Reliability & Fault Tolerance: `4.5/10`
- Performance & Scalability: `5.5/10`
- Testability & QA Readiness: `4.5/10`
- Maintainability & Type Safety: `5.0/10`
- UX/UI for Tour-Operator Workflows: `6.0/10`
- Monetization Readiness: `4.5/10`
- Cost Efficiency (COGS Control): `4.0/10`
- Observability & Operability: `4.5/10`
- Weighted overall SaaS readiness: `4.7/10`

## Target Scores

- 30-day target weighted score: `6.2/10`
- 60-day target weighted score: `7.2/10`
- 90-day target weighted score: `8.0/10`

## Workstreams and Action Items

## WS1: Security and Access Control (P0)

### AGW-SEC-001: Harden cron endpoint authentication
- Status: `[x]`
- Priority: `P0`
- Owner: `Unassigned`
- Primary files:
  - `src/app/api/social/process-queue/route.ts`
  - `src/app/api/social/refresh-tokens/route.ts`
- Actions:
  - Remove trust on weak header-only checks.
  - Enforce secret/HMAC validation and fail-closed behavior.
  - Add replay window/idempotency protection for cron calls.
- Definition of Done:
  - Requests without valid secret/signature get `401`.
  - Missing env secrets fail route startup or fail every request.
  - Tests cover valid and invalid auth paths.
- Score impact target:
  - Security `+0.8`, Reliability `+0.2`

### AGW-SEC-002: Fix tenant validation on public review ingestion
- Status: `[x]`
- Priority: `P0`
- Owner: `Unassigned`
- Primary files:
  - `src/app/api/social/reviews/public/route.ts`
- Actions:
  - Remove fallback to first organization.
  - Require valid signed token for org binding.
  - Add strict input validation and abuse limits.
- Definition of Done:
  - Invalid/missing token cannot write any review row.
  - Every write is traceable to a verified tenant.
  - Security tests cover tampered tokens and missing token paths.
- Score impact target:
  - Security `+1.1`, Cost `+0.2`

### AGW-SEC-003: Lock down exposed admin endpoints
- Status: `[x]`
- Priority: `P0`
- Owner: `Unassigned`
- Primary files:
  - `src/app/api/admin/generate-embeddings/route.ts`
  - `src/app/api/admin/geocoding/usage/route.ts`
- Actions:
  - Add admin auth guard and tenant scoping where applicable.
  - Add audit logging for admin actions.
- Definition of Done:
  - Non-admin users always receive `403`.
  - Admin actions are logged with actor, timestamp, and payload summary.
- Score impact target:
  - Security `+0.8`, Observability `+0.2`

### AGW-SEC-004: Remove or protect public diagnostics and test surfaces
- Status: `[ ]`
- Priority: `P0`
- Owner: `Unassigned`
- Primary files:
  - `src/app/api/test-geocoding/route.ts`
  - `src/app/api/health/route.ts`
  - `src/app/test-db/page.tsx`
- Actions:
  - Gate diagnostics by token/admin auth.
  - Strip sensitive internals from public responses.
  - Remove test pages from production build or behind admin-only routes.
- Definition of Done:
  - Public unauthenticated callers cannot access diagnostics internals.
  - Healthcheck output is minimal and safe by default.
- Score impact target:
  - Security `+0.7`, Operability `+0.3`

## WS2: Cost Controls and Abuse Prevention (P0)

### AGW-COST-001: Enforce auth + rate limiting for provider-cost endpoints
- Status: `[ ]`
- Priority: `P0`
- Owner: `Unassigned`
- Primary files:
  - `src/app/api/bookings/flights/search/route.ts`
  - `src/app/api/bookings/hotels/search/route.ts`
  - `src/app/api/bookings/locations/search/route.ts`
  - `src/app/api/images/*/route.ts`
  - `src/app/api/social/ai-image/route.ts`
- Actions:
  - Require authenticated user and tenant context.
  - Add route-level rate limiting by org/user/IP.
  - Add daily/monthly quota checks by plan.
- Definition of Done:
  - Unauthenticated callers get `401`.
  - Over-limit requests get deterministic `429` with reason code.
  - Quota metering events are persisted.
- Score impact target:
  - Cost `+1.3`, Security `+0.4`, Performance `+0.2`

### AGW-COST-002: Remove embedded key fallback and unsafe env defaults
- Status: `[ ]`
- Priority: `P1`
- Owner: `Unassigned`
- Primary files:
  - `src/app/api/images/pixabay/route.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/middleware.ts`
  - `src/lib/itinerary-cache.ts`
- Actions:
  - Remove hardcoded API key fallback.
  - Fail fast on missing critical env vars in non-local environments.
- Definition of Done:
  - No production path uses default dev keys.
  - Startup/runtime reports missing required envs clearly.
- Score impact target:
  - Security `+0.5`, Reliability `+0.4`

### AGW-COST-003: Add spend observability and hard usage caps
- Status: `[ ]`
- Priority: `P1`
- Owner: `Unassigned`
- Actions:
  - Track per-tenant usage and cost by provider category.
  - Add hard-stop guardrails at plan threshold and emergency threshold.
  - Add admin dashboard for margin monitoring.
- Definition of Done:
  - Daily cost report available per tenant and per feature.
  - Hard cap can be enabled without redeploy.
- Score impact target:
  - Cost `+1.0`, Monetization `+0.4`, Operability `+0.4`

## WS3: Billing and Monetization Integrity (P0/P1)

### AGW-MON-001: Consolidate plan definitions and enforcement limits
- Status: `[ ]`
- Priority: `P0`
- Owner: `Unassigned`
- Primary files:
  - `src/lib/billing/tiers.ts`
  - `src/lib/subscriptions/limits.ts`
  - `src/features/admin/billing/plans.ts`
- Actions:
  - Define a single source of truth for plan features and limits.
  - Replace duplicated constants with shared definitions.
- Definition of Done:
  - No plan mismatch exists between UI, billing, and enforcement logic.
  - Contract tests validate all plan matrices.
- Score impact target:
  - Monetization `+1.3`, Architecture `+0.4`

### AGW-MON-002: Build plan-limit enforcement consistency tests
- Status: `[ ]`
- Priority: `P1`
- Owner: `Unassigned`
- Actions:
  - Add tests for free->paid upgrade, trial expiry, cancellation, and downgrade.
  - Validate feature gating consistency across API and UI.
- Definition of Done:
  - All monetization scenarios in review plan have automated test coverage.
- Score impact target:
  - Testability `+0.8`, Monetization `+0.6`

### AGW-MON-003: Remove public mock payment/business endpoints or gate by env
- Status: `[ ]`
- Priority: `P0`
- Owner: `Unassigned`
- Primary files:
  - `src/app/api/payments/razorpay/route.ts`
  - `src/app/api/payments/track/[token]/route.ts`
  - `src/app/api/leads/convert/route.ts`
  - `src/app/api/whatsapp/*/route.ts`
- Actions:
  - Replace mocks with production-safe behavior or gate to dev-only.
  - Add explicit 501/feature-flag behavior where integration is incomplete.
- Definition of Done:
  - No production environment exposes fake success responses.
- Score impact target:
  - Security `+0.6`, Monetization `+0.8`, UX trust `+0.4`

## WS4: Reliability and Performance (P1)

### AGW-REL-001: Normalize idempotency and retry semantics for async jobs
- Status: `[ ]`
- Priority: `P1`
- Owner: `Unassigned`
- Actions:
  - Add idempotency keys for expensive side effects.
  - Define retry policy with dead-letter behavior.
- Definition of Done:
  - Duplicate requests do not duplicate side effects.
  - Retry paths are test-covered and observable.
- Score impact target:
  - Reliability `+1.0`, Cost `+0.3`

### AGW-REL-002: Strengthen payment service auth context and error handling
- Status: `[ ]`
- Priority: `P1`
- Owner: `Unassigned`
- Primary file:
  - `src/lib/payments/payment-service.ts`
- Actions:
  - Use correct privilege client for server/webhook contexts.
  - Add explicit error taxonomy and monitoring tags.
- Definition of Done:
  - Webhook/server flows work without user session coupling.
  - Error classes map to actionable alerts.
- Score impact target:
  - Reliability `+0.9`, Operability `+0.5`

### AGW-PERF-001: Restrict image remote patterns and optimize loading paths
- Status: `[ ]`
- Priority: `P1`
- Owner: `Unassigned`
- Primary file:
  - `next.config.mjs`
- Actions:
  - Replace wildcard host allowlist with explicit trusted domains.
  - Add image optimization safeguards and caching policy.
- Definition of Done:
  - Only approved domains are allowed.
  - Core image-heavy pages show improved LCP in local profiling.
- Score impact target:
  - Performance `+0.7`, Security `+0.3`

## WS5: Quality and Maintainability (P1/P2)

### AGW-QUAL-001: Reduce lint debt to release threshold
- Status: `[ ]`
- Priority: `P1`
- Owner: `Unassigned`
- Actions:
  - Eliminate `no-unused-vars` and `no-explicit-any` in high-risk modules first.
  - Fix hooks dependency and state-in-effect warnings.
- Definition of Done:
  - Error count `0`; warnings under agreed threshold.
- Score impact target:
  - Maintainability `+1.2`, Testability `+0.4`

### AGW-QUAL-002: Make E2E pipeline runnable in CI and local dev
- Status: `[ ]`
- Priority: `P1`
- Owner: `Unassigned`
- Primary files:
  - `e2e/tests/auth.setup.ts`
  - `e2e/fixtures/auth.ts`
  - `e2e/playwright.config.ts`
- Actions:
  - Provide secure test credential strategy and env contract.
  - Remove machine-specific node path assumptions.
- Definition of Done:
  - `npm run test:e2e -- --list` and smoke suite run on CI.
- Score impact target:
  - Testability `+1.1`, Reliability `+0.3`

## WS6: Tour-Operator UX and Conversion (P1/P2)

### AGW-UX-001: Build 10-minute “first value” onboarding flow
- Status: `[ ]`
- Priority: `P1`
- Owner: `Unassigned`
- Actions:
  - Wizard from account setup -> first itinerary -> first share.
  - Add progress indicators and success milestones.
- Definition of Done:
  - New tenant reaches first shared itinerary in <=10 minutes median.
- Score impact target:
  - UX `+1.2`, Monetization `+0.4`

### AGW-UX-002: Operator daily command center
- Status: `[ ]`
- Priority: `P1`
- Owner: `Unassigned`
- Actions:
  - Consolidate departures, pending payments, expiring quotes, and follow-ups.
  - Mobile-first interactions for field operators.
- Definition of Done:
  - Daily operational tasks complete with <=3 primary screens.
- Score impact target:
  - UX `+1.0`, Retention proxy `+0.6`

### AGW-UX-003: Outcome-based upgrade prompts and add-on packaging
- Status: `[ ]`
- Priority: `P2`
- Owner: `Unassigned`
- Actions:
  - Trigger upgrades by usage/value moments, not generic paywalls.
  - Package add-ons (AI credits, WhatsApp volume, premium templates).
- Definition of Done:
  - Upgrade prompts mapped to measurable usage triggers.
- Score impact target:
  - Monetization `+1.0`, Cost `+0.4`

## Execution Order (Strict)

1. `AGW-SEC-001`
2. `AGW-SEC-002`
3. `AGW-SEC-003`
4. `AGW-SEC-004`
5. `AGW-COST-001`
6. `AGW-MON-001`
7. `AGW-MON-003`
8. `AGW-COST-002`
9. `AGW-REL-001`
10. `AGW-REL-002`
11. `AGW-PERF-001`
12. `AGW-QUAL-002`
13. `AGW-MON-002`
14. `AGW-QUAL-001`
15. `AGW-COST-003`
16. `AGW-UX-001`
17. `AGW-UX-002`
18. `AGW-UX-003`

## Progress Log

- 2026-03-01: Tracker created from deep review findings. No remediation code changes in this commit.
- 2026-03-01: AGW-SEC-001 completed. Hardened cron auth for social queue/token refresh with shared verification, signature support, replay protection, and public contract tests.
- 2026-03-01: AGW-SEC-002 completed. Public review ingestion now requires validated token binding, removes organization fallback writes, adds strict schema validation, and applies abuse throttling.
- 2026-03-01: AGW-SEC-003 completed. Protected admin embeddings/geocoding endpoints with requireAdmin and added admin audit log entries for endpoint activity.

## Current Sprint Board (Suggested)

### Sprint A (Security Lockdown)
- `[x]` AGW-SEC-001
- `[x]` AGW-SEC-002
- `[x]` AGW-SEC-003
- `[ ]` AGW-SEC-004
- `[ ]` AGW-COST-001

### Sprint B (Monetization + Reliability Core)
- `[ ]` AGW-MON-001
- `[ ]` AGW-MON-003
- `[ ]` AGW-COST-002
- `[ ]` AGW-REL-001
- `[ ]` AGW-REL-002

### Sprint C (Scale, QA, Conversion)
- `[ ]` AGW-PERF-001
- `[ ]` AGW-QUAL-002
- `[ ]` AGW-MON-002
- `[ ]` AGW-QUAL-001
- `[ ]` AGW-COST-003
- `[ ]` AGW-UX-001
- `[ ]` AGW-UX-002
- `[ ]` AGW-UX-003
