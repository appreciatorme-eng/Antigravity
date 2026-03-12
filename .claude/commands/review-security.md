Security-focused review scoped to changed files. Use when adding new API endpoints, modifying auth, or touching payment/webhook code.

## Phase 1: Scope

1. Run `git diff main...HEAD --name-only` — filter to security-relevant files:
   - `src/app/api/` (handlers)
   - `src/lib/security/` (security infra)
   - `src/middleware.ts` (auth middleware)
   - `src/lib/supabase/` (database access)
   - Any file matching `auth|payment|webhook|token|secret|csrf|rate`
2. Search Engram: `mem_search("security reviewed accepted")` — suppression list

## Phase 2: Deterministic Security Checks (parallel)

- `supabase get_advisors security` — RLS gaps, missing policies
- `npm run typecheck` — type errors in security-critical paths
- `contextplus run_static_analysis` on security-relevant files

## Phase 3: Security Review

For each changed security-relevant file, check against the existing infrastructure:

**Authentication & Authorization:**
- Does the endpoint go through auth middleware (`src/middleware.ts`)?
- Admin endpoints: registered in `src/app/api/admin/[...path]/route.ts` catch-all?
- Cron endpoints: verify `CRON_SECRET` header and export only `POST`?

**Input Validation:**
- All user input validated with Zod schema before processing?
- No raw `req.body` used without parsing?
- Query params sanitized before use in database queries?

**Rate Limiting:**
- New endpoint uses `rateLimit()` from `src/lib/security/rate-limit.ts`?
- Rate limit configured appropriately (not copy-pasted defaults)?

**CSRF Protection:**
- Admin mutations use `passesMutationCsrfGuard()` from `src/lib/security/admin-mutation-csrf.ts`?

**Token/Secret Handling:**
- Token comparisons use `timingSafeEqual` from `src/lib/security/safe-equal.ts`?
- No hardcoded secrets in source (API keys, passwords, tokens)?
- Environment variables accessed via `process.env`, not embedded in client code?

**Payment Security (if payment code changed):**
- Razorpay signature verified with `crypto.timingSafeEqual()`?
- Payment webhook is idempotent (check `invoice_payments.reference` dedup)?
- Financial amounts validated server-side (not trusting client values)?

**Third-Party Integrations:**
- WhatsApp webhook signature verified in production?
- OAuth tokens stored in httpOnly cookies or server-side?
- External API responses validated before use?

**SKIP findings matching Engram suppression list.**

## Phase 4: Report

Output findings table with severity, file:line, issue, and whether it's NEW or RECURRING.

## Phase 5: Persist

Save each finding to Engram with topic_key `review/security/<endpoint-or-file>`.
