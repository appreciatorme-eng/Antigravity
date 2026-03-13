# Antigravity — GoBuddy Travel Suite

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript (strict)
- **Database**: Supabase (PostgreSQL, 113 tables, RLS enabled)
- **Payments**: Razorpay (INR currency, Indian market)
- **Auth**: Supabase Auth (email/password + magic link)
- **Hosting**: Vercel (Hobby plan)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: React hooks + Supabase realtime subscriptions

## Project Structure

```
projects/travel-suite/
  apps/
    web/          ← Next.js 16 app (primary codebase)
    agents/       ← Python AI agents
    mobile/       ← React Native
    rag-assistant/
  packages/       ← shared libs
  supabase/       ← migrations & edge functions
```

**All dev work is in `projects/travel-suite/apps/web/`**

## Key Commands

```bash
# From repo root
cd projects/travel-suite/apps/web

npm run dev           # portless → http://antigravity.localhost:PORT
npm run lint          # ESLint (max-warnings=0, zero tolerance)
npm run typecheck     # tsc --noEmit
npm run test          # Vitest unit tests
npm run test:coverage # Vitest with coverage thresholds
npm run test:e2e      # Playwright E2E against Vercel
npm run qa            # playwright-cli (interactive browser)
```

## Git Rules

- Always `git add <specific-files>` from **repo root** — never `git add -u` or `git add .`
- Never commit: `depot-*`, `*.png` (root), `.playwright-cli/`, `.axon/`

## Test Thresholds

- Lines: 80% | Functions: 90% | Branches: 75%
- Lint: zero warnings
- E2E target: `https://travelsuite-rust.vercel.app`

## Vercel Constraints

- Hobby plan: 2 cron slots, 60s max function timeout
- Cron handlers must export `POST` only (no `GET`)

## Dev Verification Workflow

1. `preview_start("web-dev")` → server starts
2. `preview_logs` → parse `http://antigravity.localhost:PORT`
3. `npx playwright-cli goto <url>` → `npx playwright-cli snapshot`
4. `Read` the YAML from `.playwright-cli/page-*.yml`

## API Routing Pattern

All API routes use **catch-all dispatchers** — not individual route files:

```
src/app/api/[...path]/route.ts              ← public routes
src/app/api/admin/[...path]/route.ts        ← admin routes (auth required)
src/app/api/assistant/[...path]/route.ts    ← assistant routes
src/app/api/reputation/[...path]/route.ts   ← reputation routes
src/app/api/social/[...path]/route.ts       ← social routes
src/app/api/superadmin/[...path]/route.ts   ← superadmin routes
```

Route handlers live in `src/app/api/_handlers/` and are registered in the catch-all via `createCatchAllHandlers()` from `src/lib/api-dispatch.ts`. To add a new endpoint, add a handler file and register it in the route array — don't create a new `route.ts`.

## Environment Variables

- Set in **Vercel dashboard** (not `.env` files in repo)
- Key vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `WHATSAPP_API_TOKEN`, `OPENAI_API_KEY`
- Cron secret: `CRON_SECRET` (verified in cron handlers)
- Rate limiting: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (fail-closed without these)

## Code Review Commands

Use these instead of monolithic review prompts. They leverage Axon (code graph), Engram (persistent memory), and Supabase MCP (DB advisors) for targeted, incremental reviews.

| Command | When to Use | Scope |
|---------|-------------|-------|
| `/review` | After every feature branch, before PR | Changed files only (git diff + Axon) |
| `/review-security` | New API endpoints, auth changes | Security-focused, changed files |
| `/review-perf` | New queries, heavy components | Performance-focused, changed files |
| `/review-deep` | Before major releases | Full codebase, Engram-filtered |
| `/remediate` | After any `/review` command | Reads findings from Engram, creates tracker + branch, fixes by severity, writes E2E tests, merges to main |

**How it works:**
1. Scopes to changed files via `git diff` + `axon_detect_changes`
2. Runs deterministic checks first (lint, typecheck, static analysis, Supabase advisors)
3. AI reviews only changed symbols against project-specific checklists
4. Filters out previously reviewed/accepted findings via Engram memory
5. Persists each finding to Engram for future session awareness

**Accepted decisions** (seeded in Engram — will not be re-flagged):
- CSP unsafe-inline (Next.js requirement)
- No circuit breaker / dead letter queue (Vercel Hobby — stateless)
- Both leaflet + maplibre-gl needed (different use cases)
- Polling intervals are contextual (not magic numbers)

## Automation

Reviews and code intelligence run automatically — no manual invocation needed.

| Layer | Trigger | What Runs |
|-------|---------|-----------|
| **Stop Hook** | Session ends with uncommitted changes | `/review` prompt, Axon reindex suggestion, Engram summary reminder |
| **PostToolUse Hook** | Every Write/Edit tool call | Tracks changed files for Axon reindex threshold (≥5 files) |
| **Scheduled Task** | Monday 9 AM (`weekly-code-review`) | `/review-deep` with full Axon sweep, scorecard saved to Engram |
| **CI: security-audit** | PR to main (web changes) | `npm audit --audit-level=high` + `npm run test:coverage` |
| **CI: dep-review** | PR to main | `dependency-review-action` — blocks known-vulnerable deps |
| **Dependabot** | Weekly (Monday) | Auto-creates PRs for patch/minor npm updates |

**Hook files:** `~/.claude/hooks/auto-review.sh` (Stop), `~/.claude/hooks/axon-tracker.sh` (PostToolUse)
**Config:** `~/.claude/settings.json` → `hooks.Stop` + `hooks.PostToolUse`
**Dev server:** `preview_start("web-dev")` via `.claude/launch.json`

## Key Files

| Purpose | Path |
|---------|------|
| API dispatcher | `src/lib/api-dispatch.ts` |
| Public catch-all route | `src/app/api/[...path]/route.ts` |
| Admin catch-all route | `src/app/api/admin/[...path]/route.ts` |
| Assistant catch-all route | `src/app/api/assistant/[...path]/route.ts` |
| Reputation catch-all route | `src/app/api/reputation/[...path]/route.ts` |
| Social catch-all route | `src/app/api/social/[...path]/route.ts` |
| Superadmin catch-all route | `src/app/api/superadmin/[...path]/route.ts` |
| Auth middleware | `src/middleware.ts` |
| Rate limiting | `src/lib/security/rate-limit.ts` |
| CSRF guard | `src/lib/security/admin-mutation-csrf.ts` |
| Timing-safe compare | `src/lib/security/safe-equal.ts` |
| Structured logger | `src/lib/observability/logger.ts` |
| Supabase admin | `src/lib/supabase/admin.ts` |
| Generated DB types | `src/lib/supabase/database.types.ts` |
| API responses | `src/lib/api/response.ts` (`apiSuccess`, `apiError`) |
| API response helpers | `src/lib/api-response.ts` (typed envelope) |
| QA log | `.claude/qa-log.md` |
| Audit tracker | `AUDIT_REMEDIATION_TRACKER.md` |
| Deep review tracker | `DEEP_REVIEW_TRACKER.md` |
