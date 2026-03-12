Milestone code review for pre-release. Covers the full codebase but filters out previously reviewed and accepted findings via Engram memory.

Use this before major releases or quarterly health checks. For everyday branch reviews, use `/review` instead.

## Phase 1: Load Memory

1. Search Engram: `mem_search("reviewed accepted decision")` — load ALL past findings and accepted decisions
2. Build a suppression list: any finding with type "decision" or verdict "PASS" or "ACCEPTED" should be SKIPPED in the review output
3. Search Engram: `mem_search("review session")` — load past review sessions to understand coverage history

## Phase 2: Deterministic Sweep (run ALL in parallel)

From `projects/travel-suite/apps/web/`:

- `npm run lint` (zero-warning policy)
- `npm run typecheck`
- `npm run test:coverage` (thresholds: 80/90/75)
- `contextplus run_static_analysis`
- `supabase get_advisors security`
- `supabase get_advisors performance`
- `axon_dead_code` — full unreachable symbol sweep
- `npm audit` — dependency vulnerability check

Report all failures. These are ground-truth, zero-false-positive checks.

## Phase 3: Architecture Review

Using Axon knowledge graph:

1. **File size audit**: `axon_cypher` to find all files >600 lines — flag for splitting
2. **Dead code**: Review `axon_dead_code` output — group by module, estimate cleanup effort
3. **Dependency graph**: Check for circular dependencies via Axon relationships
4. **Coverage trend**: Compare current coverage vs last recorded in Engram

## Phase 4: Targeted Review by Domain

For each domain below, use `axon_query` + `get_file_skeleton` to review (NOT full file reads):

**Security** (run the `/review-security` checklist against ALL endpoints, not just changed ones):
- Rate limiting coverage on all API routes
- CSRF on all admin mutations
- Auth middleware on all protected routes
- RLS policies on all tables via `supabase get_advisors`

**Performance** (run the `/review-perf` checklist against ALL components):
- N+1 queries in handlers
- Missing memoization in heavy components
- Client vs server component boundaries
- Bundle size analysis

**Error Handling:**
- API handlers with no try/catch?
- External service calls (Razorpay, WhatsApp, Supabase) without error handling?
- Missing AbortController cleanup?

**Type Safety:**
- Count of `as any` casts (compare vs last recorded in Engram)
- Usage of generated `database.types.ts` vs manual types
- Untyped API responses

**SKIP any finding that matches the Engram suppression list from Phase 1.**

## Phase 5: Scorecard

Output a compact scorecard (NOT the 12-section essay):

| Dimension | Score (0-10) | Delta vs Last Review | Key Finding |
|-----------|:---:|:---:|-------------|

Dimensions: Security, Architecture, Performance, Error Handling, Test Coverage, Type Safety

**Overall Score: X/60**

Then output the findings table:

| Sev | Category | File:Line | Finding | Status |
|-----|----------|-----------|---------|--------|

Status: NEW / RECURRING / REGRESSED (was fixed, now broken again)

## Phase 6: Persist

1. Save each finding to Engram with topic_key `review/<category>/<short-desc>`
2. Save a review session summary: `mem_session_summary` with scope, findings count, false positive count, score
3. Save the scorecard scores for future trend comparison

## Constraints

- Vercel Hobby Plan: 2 cron slots, 60s function timeout — don't flag these as issues
- CSP unsafe-inline: Required by Next.js — already accepted, skip it
- No circuit breaker: Serverless is stateless — already accepted, skip it
- No dead letter queue: No persistent worker on Hobby plan — already accepted, skip it
