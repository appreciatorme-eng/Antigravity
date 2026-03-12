# Antigravity — GoBuddy Travel Suite

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
