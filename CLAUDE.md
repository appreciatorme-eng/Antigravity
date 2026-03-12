# Antigravity — GoBuddy Travel Suite

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components)
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
    web/          ← Next.js 15 app (primary codebase)
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

All API routes use a **catch-all dispatcher** — not individual route files:

```
src/app/api/[...path]/route.ts        ← public routes
src/app/api/admin/[...path]/route.ts  ← admin routes (auth required)
```

Route handlers live in `src/app/api/_handlers/` and are registered in the catch-all via `createCatchAllHandlers()` from `src/lib/api-dispatch.ts`. To add a new endpoint, add a handler file and register it in the route array — don't create a new `route.ts`.

## Environment Variables

- Set in **Vercel dashboard** (not `.env` files in repo)
- Key vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `WHATSAPP_API_TOKEN`, `OPENAI_API_KEY`
- Cron secret: `CRON_SECRET` (verified in cron handlers)
- Rate limiting: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (fail-closed without these)

## Key Files

| Purpose | Path |
|---------|------|
| API dispatcher | `src/lib/api-dispatch.ts` |
| Catch-all route | `src/app/api/[...path]/route.ts` |
| Auth middleware | `src/middleware.ts` |
| Rate limiting | `src/lib/security/rate-limit.ts` |
| CSRF guard | `src/lib/security/admin-mutation-csrf.ts` |
| Supabase admin | `src/lib/supabase/admin.ts` |
| API responses | `src/lib/api/response.ts` (`apiSuccess`, `apiError`) |
| QA log | `.claude/qa-log.md` |
| Audit tracker | `AUDIT_REMEDIATION_TRACKER.md` |
