# Deep Code Review — Antigravity Travel Suite (Web App)
## Repository: https://github.com/appreciatorme-eng/Antigravity/tree/main/projects/travel-suite/apps/web

---

## PROJECT CONTEXT

**Read this before reviewing. It will save you from re-flagging known decisions.**

### Tech Stack
- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL, ~113 tables, Row Level Security enabled)
- **Payments**: Razorpay (INR currency, Indian market — not Stripe)
- **Auth**: Supabase Auth (email/password + magic link), JWT-based sessions
- **Hosting**: Vercel (Hobby plan — 2 cron slots max, 60s function timeout)
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI API (itinerary generation, AI assistant, pricing suggestions, social captions)
- **Integrations**: WhatsApp Business API, Pexels/Pixabay/Unsplash image APIs, Firebase (mobile push)

### Architecture — Critical to Understand
1. **Catch-all API Dispatcher**: All API routes funnel through TWO catch-all files:
   - `src/app/api/[...path]/route.ts` — public routes
   - `src/app/api/admin/[...path]/route.ts` — admin routes (auth required)
   - Handler modules live in `src/app/api/_handlers/` (~90+ handler files)
   - Registration via `createCatchAllHandlers()` from `src/lib/api-dispatch.ts`
   - **Review implication**: Every handler inherits (or doesn't) the dispatcher's CORS, rate limiting, and auth. Check each handler individually.

2. **Security Layer** (`src/lib/security/`):
   - `rate-limit.ts` — Upstash Redis-based, dual-layer (IP + user), fail-closed
   - `public-rate-limit.ts` — Separate rate limiter for unauthenticated endpoints
   - `admin-mutation-csrf.ts` — CSRF guard for admin mutations
   - `admin-bearer-auth.ts` — Bearer token validation for admin routes
   - `cron-auth.ts` — CRON_SECRET verification for scheduled tasks
   - `safe-equal.ts` — Timing-safe string comparison
   - `sanitize.ts` — Input sanitization
   - `social-token-crypto.ts` — Encrypted storage for social media OAuth tokens
   - `social-oauth-state.ts` — OAuth state parameter validation
   - `safe-error.ts` — Error sanitization (no stack traces to client)

3. **Supabase Access**:
   - `src/lib/supabase/admin.ts` — Service role client (server-side only)
   - `src/lib/supabase/server.ts` — Per-request client with user auth
   - `src/lib/supabase/database.types.ts` — Generated types
   - **Review implication**: Check that service role is NEVER exposed to client. Check RLS coverage on all 113 tables.

4. **Observability**:
   - `src/lib/observability/logger.ts` — Structured JSON logger
   - No APM/tracing (Vercel Hobby limitation)

### Known Accepted Decisions (DO NOT re-flag these)
These have been reviewed and accepted in prior audits. Note them as "acknowledged" if encountered, but do not score them as findings:
- **CSP `unsafe-inline`** — Required by Next.js for inline styles
- **No circuit breaker / dead letter queue** — Vercel Hobby is stateless, no persistent connections
- **Both `leaflet` AND `maplibre-gl` in dependencies** — Different use cases (static embeds vs interactive maps)
- **Polling intervals as literal numbers** — Contextual, not magic numbers
- **CORS `Access-Control-Allow-Origin`** — Uses `ALLOWED_ORIGINS` env var, evaluated per-request

### Vercel Hobby Constraints (context for architecture decisions)
- Max 2 cron jobs (currently using both slots)
- 60s max function timeout (10s default)
- No team features, no edge middleware persistence
- No background jobs — everything is request/response or cron

---

## INSTRUCTIONS

You are a senior software engineer and security architect conducting a **production readiness audit** of the web app at `projects/travel-suite/apps/web/`.

This is a **READ-ONLY review** — no code changes, no suggestions to implement, no diffs, no PRs.
Your job is to analyze, score, and report findings with surgical precision.

Navigate to `projects/travel-suite/apps/web/` and review every file under `src/`.
Cite every finding with the **exact file path and line number(s)** (e.g., `src/lib/auth.ts:42`).

**Scope**: Only the web app (`apps/web/`). Do not review `apps/mobile/`, `apps/agents/`, `packages/`, or `supabase/`.

---

## OUTPUT FORMAT

### 1. EXECUTIVE SCORECARD

Score each dimension from 0–10. Be ruthless — this is going to production serving Indian travel agencies.

| Dimension                | Score | Rationale (1 sentence) |
|--------------------------|-------|------------------------|
| Code Quality             | /10   |                        |
| Security                 | /10   |                        |
| Architecture             | /10   |                        |
| Performance              | /10   |                        |
| Error Handling           | /10   |                        |
| Test Coverage            | /10   |                        |
| Type Safety              | /10   |                        |
| API Design               | /10   |                        |
| Supabase Integration     | /10   |                        |
| Maintainability          | /10   |                        |
| Production Readiness     | /10   |                        |

**Overall Score: X/110**
**Production Ready: YES / NO / WITH CONDITIONS**

---

### 2. PRODUCTION READINESS VERDICT

State clearly:
- Is this safe to deploy to production right now?
- What are the **hard blockers** (must fix before deploy)?
- What are the **soft blockers** (should fix within first sprint)?
- What can be deferred to post-launch?

---

### 3. SECURITY AUDIT (CRITICAL — review every line)

For each finding, use this format:

**[SEV-CRITICAL | SEV-HIGH | SEV-MEDIUM | SEV-LOW | SEV-INFO]**
- **File**: `path/to/file.ts:line`
- **Issue**: What the vulnerability or risk is
- **Impact**: What an attacker could do
- **Evidence**: Paste the exact code snippet

#### 3a. Authentication & Authorization
- Is Supabase Auth session validated on every admin route?
- Does `src/middleware.ts` correctly protect all `/admin/*` and `/god/*` paths?
- Are there any routes that bypass the catch-all dispatcher's auth check?
- Is the JWT verified server-side (not just client-side)?
- Check `admin-bearer-auth.ts` — is token extraction safe against timing attacks?

#### 3b. Supabase Row Level Security (RLS)
- Are RLS policies enforced on ALL tables that store user/org data?
- Is the service role client (`supabase/admin.ts`) used ONLY in server-side code?
- Are there any `.from('table').select()` calls using the service role that should use the user client instead?
- Could a user access another org's data by manipulating their JWT `org_id`?

#### 3c. API Security
- Does every handler in `src/app/api/_handlers/` have rate limiting?
- Which handlers are missing CSRF protection for mutations (POST/PUT/DELETE)?
- Are all user inputs validated before passing to Supabase queries?
- Is there any string interpolation in `.rpc()` or `.select()` calls (SQL injection vector)?
- Check all `req.json()` parsing — are malformed bodies handled?

#### 3d. Secrets & Environment Variables
- Are any secrets hardcoded in source? (search for API keys, tokens, passwords)
- Are `NEXT_PUBLIC_*` variables safe to expose client-side?
- Is `SUPABASE_SERVICE_ROLE_KEY` ever accessible in client bundles?
- Is `CRON_SECRET` verified with timing-safe comparison?

#### 3e. Third-Party Integration Security
- **WhatsApp**: Is `WHATSAPP_API_TOKEN` stored safely? Is webhook signature verified?
- **Razorpay**: Is payment verification done server-side? Is `razorpay_signature` validated?
- **OpenAI**: Is API key server-side only? Are prompts sanitizable (prompt injection risk)?
- **Image APIs** (Pexels/Pixabay/Unsplash): Are API keys server-side only?
- **Social OAuth** (Instagram/Facebook): Is `social-token-crypto.ts` using strong encryption?

#### 3f. Next.js-Specific Security
- Any `dangerouslySetInnerHTML` usage? With what input?
- Any `eval()` or `new Function()` usage?
- Are Server Components leaking sensitive data to the client?
- Is the `middleware.ts` covering all protected routes?
- Are API route handlers exporting only the correct HTTP methods?

---

### 4. CATCH-ALL DISPATCHER DEEP DIVE

This is the most critical architectural piece. Review `src/lib/api-dispatch.ts` and both catch-all route files thoroughly:

- Is CORS policy correctly restrictive?
- Does the dispatcher apply rate limiting BEFORE handler execution?
- What happens when a route doesn't match — is there an info leak in the 404?
- Are dynamic path segments (e.g., `[id]`, `[token]`) sanitized before reaching handlers?
- Is the handler lazy-loading pattern (`() => import(...)`) safe from path traversal?
- Are admin routes actually requiring auth, or could a public request reach an admin handler?
- Is the CSRF guard applied to ALL admin mutations, or just some?

---

### 5. LINE-BY-LINE FINDINGS

Go file by file through the entire `src/` directory.
For **every file** list:
- **File**: `path/to/file`
- **Purpose**: What this file does (1 line)
- **Findings**: All issues found, each with file:line citation
  - Bugs or logic errors
  - Dead code / unreachable paths
  - Missing error handling (bare `catch {}` or swallowed errors)
  - Anti-patterns
  - Performance concerns (N+1 Supabase queries, missing memoization, unnecessary re-renders)
  - Type errors, `any` casts, or `@ts-ignore` / `@ts-expect-error` usage
  - Inconsistent patterns vs rest of codebase
  - Magic numbers / hardcoded values (except polling intervals — those are accepted)
  - TODO/FIXME/HACK comments left in
  - Commented-out code blocks
  - Functions over 50 lines
  - Files over 800 lines

Do NOT skip files. If a file is clean, write "No findings."

---

### 6. ARCHITECTURE REVIEW

- Is the catch-all dispatcher pattern scalable with ~90+ handlers?
- Is there clear separation of concerns (UI components / API handlers / business logic / data access)?
- Are there any circular dependencies? (check imports)
- Is the API layer consistent? (response shapes via `apiSuccess`/`apiError`, HTTP status codes, naming)
- Are all Supabase queries in handler files, or is there data access logic scattered in components?
- Is server-side vs client-side rendering used correctly? Are `"use client"` directives applied minimally?
- How is the codebase organized — by feature or by type? Is it consistent?
- Are there God files (>800 lines) that should be split?

---

### 7. SUPABASE INTEGRATION REVIEW

This is a Supabase-first app with ~113 tables. Review thoroughly:

- Are database types (`database.types.ts`) up to date with the actual schema?
- Are `.select()` calls using specific columns or `select('*')` everywhere?
- Are `.single()` / `.maybeSingle()` used correctly (error handling for no rows)?
- Are `.eq()` filters using the correct column types (UUID vs string)?
- Is `.order()` used on paginated queries?
- Are there any missing `.throwOnError()` chains?
- Are Supabase RPC calls type-safe?
- Is the realtime subscription pattern correct (subscribe/unsubscribe lifecycle)?
- Are there any queries that could return unbounded result sets (missing `.limit()`)?
- Is `.upsert()` used safely (conflict resolution specified)?

---

### 8. PERFORMANCE CONCERNS

- **N+1 Queries**: Any loops calling Supabase inside a `.map()` or `forEach()`?
- **Missing `.select()` columns**: Are handlers fetching all columns when they need 2-3?
- **Client bundle size**: Are server-only packages (e.g., `@supabase/supabase-js` service role, `razorpay`) imported in `"use client"` files?
- **Image optimization**: Is `next/image` used, or raw `<img>` tags?
- **Unoptimized Supabase queries**: Missing indexes for common filter patterns?
- **React re-renders**: Components with expensive computations missing `useMemo`/`useCallback`?
- **API response sizes**: Are any endpoints returning full table dumps without pagination?
- **Vercel cold starts**: Are any API handlers doing expensive initialization on every request?

---

### 9. ERROR HANDLING & RESILIENCE

- Which API handlers have no try/catch?
- Are Supabase errors surfaced to users with sanitized messages (via `safe-error.ts`) or raw?
- Is there a global error boundary in the frontend (`error.tsx`, `global-error.tsx`)?
- What happens if Supabase is down? Does the app degrade gracefully?
- What happens if Razorpay is unreachable during payment verification?
- What happens if OpenAI rate-limits the API key?
- What happens if WhatsApp API returns 429?
- Are Upstash Redis failures handled (rate limiter is fail-closed — is that correct)?
- Are there any unhandled promise rejections?

---

### 10. TEST COVERAGE ANALYSIS

Current thresholds: **80% lines, 90% functions, 75% branches**.

- What is the actual coverage (from test files found)?
- Which critical paths have zero tests? (payments, auth, cron jobs, WhatsApp)
- Are there unit tests for the catch-all dispatcher logic?
- Are there integration tests for admin API handlers?
- Are E2E tests covering: login flow, proposal creation, payment flow, itinerary generation?
- Are test mocks for Supabase realistic (matching actual schema)?
- Are there tests for error cases (not just happy paths)?
- Is the rate limiter tested?

---

### 11. DEPENDENCY AUDIT

Review `package.json`:
- Are any packages outdated by **2+ major versions**?
- Are there known CVEs in any dependency? (check npm audit output)
- Are devDependencies leaking into production bundles?
- Are there redundant packages solving the same problem?
- Are versions pinned or using ranges? Is it consistent?
- Total dependency count — is it reasonable for the project scope?

---

### 12. INDIAN MARKET & COMPLIANCE

This app serves Indian travel agencies. Check:
- **GST compliance**: Are invoices/bookings handling GST (CGST/SGST/IGST) correctly?
- **Razorpay integration**: Is payment capture → verification → reconciliation flow correct?
- **INR handling**: Are currency amounts stored as integers (paise) to avoid floating-point errors?
- **Data residency**: Is any PII stored outside India (Vercel region, Supabase region)?
- **WhatsApp Business API compliance**: Are message templates following Meta's policies?

---

### 13. TOP 15 PRIORITY FIXES

Rank the 15 most important issues to fix, in order of priority:

| # | Severity | File:Line | Issue | Why This Priority |
|---|----------|-----------|-------|-------------------|
| 1 | CRITICAL |           |       |                   |
| 2 | ...      |           |       |                   |
| ... | | | | |
| 15 | | | | |

---

### 14. WHAT'S DONE WELL

List 5–10 specific things that are implemented correctly and should NOT be changed.
Cite file:line for each. This is just as important as the problems.

Examples to look for:
- Security patterns that are solid
- Clean abstractions
- Good error handling patterns
- Proper use of TypeScript
- Well-structured components

---

### 15. REVIEWER NOTES

Any patterns, decisions, or context that a new engineer joining this project must understand before touching the code. Include:
- Non-obvious architectural decisions
- "Why is it done this way?" explanations
- Dependencies between systems
- Gotchas and foot-guns
