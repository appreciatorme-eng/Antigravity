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
    mobile/       ← Flutter (Dart) — GoBuddy companion app
    rag-assistant/
  packages/       ← shared libs
  supabase/       ← migrations & edge functions
```

**All dev work is in `projects/travel-suite/apps/web/`**

## Key Commands

```bash
# From repo root
cd projects/travel-suite/apps/web

npm run dev           # next dev → http://localhost:3000
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
- E2E target: `https://tripbuilt.com`

## Test Accounts (E2E)

Four test users exist in Supabase for E2E and manual testing:

| Role | Email | Profile `role` | Notes |
|------|-------|----------------|-------|
| Admin | `e2e-admin@tripbuilt.com` | `admin` | `onboarding_step = 0` (triggers onboarding wizard) |
| Client | `e2e-client@tripbuilt.com` | `client` | Standard client user |
| Driver | `e2e-driver@tripbuilt.com` | `driver` | Standard driver user |
| Super Admin | `e2e-superadmin@tripbuilt.com` | `super_admin` | Full platform access |

**Credentials**: stored in `e2e/.env` (gitignored). See `e2e/.env.example` for template.

**Login endpoint**: `POST /api/auth/password-login` with `{ email, password }`.

**When testing manually** (via preview or playwright-cli): use admin credentials from `e2e/.env` to log in at `/auth`.

## Vercel Constraints

- Hobby plan: 2 cron slots, 60s max function timeout
- Cron handlers must export `POST` only (no `GET`)

## Dev Verification Workflow

1. `preview_start("web-dev")` → server starts
2. `preview_logs` → confirm server running on `http://localhost:3000`
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

## Duplicate Work Prevention

Before spawning any agent to refactor/extract/slim a file, run these two checks:

```bash
# 1. Was it already refactored? (skip if last commit is a refactor/extract/integrate)
git log -1 --pretty=format:"%s" -- <relative-path-from-repo-root>

# 2. Is it already small enough? (skip if already under target line count)
wc -l <absolute-path>
```

If either check shows the work is done, **do not spawn the agent**.

For background verification (lint/typecheck/test): run **once** after all agents complete — not inside each individual agent.

### Task Notification Rules (token efficiency)

| Notification type | Action |
|-------------------|--------|
| Background command — `exit code 0` in summary | No response, **do not read output file** |
| Agent completed — work already in git | No response |
| Background command — non-zero exit code | Read output file, investigate |
| Agent completed — new work or errors | Normal response + commit |

## CSRF Protection Strategy

**Bearer auth IS the CSRF protection.** The `Authorization: Bearer` header is a custom header that cannot be set by cross-origin forms or simple CORS requests, making it an effective CSRF guard.

### How it works

The dispatcher (`api-dispatch.ts`) runs `passesMutationCsrfGuard()` on every POST/PUT/PATCH/DELETE. It passes if:
1. Request has `Authorization: Bearer <token>` (≥10 chars) — **primary path**
2. Request has `x-admin-csrf` header matching `ADMIN_MUTATION_CSRF_TOKEN` env var — server-to-server only
3. Same-origin check (dev/test fallback only — dead code in production)

### Rules for client-side mutations

- **Every `fetch()` with method POST/PUT/PATCH/DELETE MUST include the Bearer token**
- Use `authedFetch()` from `src/lib/api/authed-fetch.ts` — it auto-attaches the token
- Do NOT use `x-csrf-token` or `x-admin-csrf` from client code — Bearer is sufficient
- If a route is already sending `Authorization: Bearer` manually, that's fine too

### CSRF-exempt routes (in dispatcher)

Only these routes skip CSRF: `cron/*`, `auth/password-login`, `onboarding/setup`, `payments/webhook`, `whatsapp/webhook`, `webhooks/*`. All are pre-auth or external webhooks.

### Common mistake

Bare `fetch("/api/foo", { method: "POST" })` with no auth headers **will fail in production** with 403 "CSRF validation failed". Always use `authedFetch()` or manually attach `Authorization: Bearer`.

## Error Boundary Pattern

All route groups use a **shared re-export** pattern — not duplicated inline components:

```tsx
// src/components/shared/RouteError.tsx — single source of truth
// Each route's error.tsx is a one-line re-export:
export { RouteError as default } from '@/components/shared/RouteError';
```

When adding a new route group, create `error.tsx` as a one-line re-export. **Never** copy-paste the full error component into each route.

## Component Extraction Rules

- **Minimum size**: Don't extract a component into its own file if it's under 60 lines and used only once. Keep it co-located.
- **Maximum fragmentation**: Aim for 4-6 sub-components per parent, not 8-10. Each file should justify its existence.
- **Test before extracting**: Write (or verify) a test for the parent's behavior first. Extract the sub-component. Verify the test still passes.

## WhatsApp Integration

The codebase supports **two WhatsApp implementations**:

| Mode | Config | Files | Status |
|------|--------|-------|--------|
| **Meta Cloud API** (primary) | `WHATSAPP_API_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` | `src/lib/whatsapp.server.ts` | ✅ Production path |
| **WPPConnect** (secondary) | `WPPCONNECT_URL` + `WPPCONNECT_TOKEN` | `src/lib/whatsapp-wppconnect.ts` | 🔄 Kept for self-hosted fallback |

**Primary path for production is Meta Cloud API.** WPPConnect support is retained for operators who self-host WhatsApp Business (on-premise). The code detects which mode is active based on which env vars are set — `WHATSAPP_API_TOKEN` takes precedence.

**Deprecation plan**: WPPConnect path will be removed once 100% of active customers migrate to Meta Cloud.

## API Route Rules

- **No new direct routes**: All new endpoints go through catch-all dispatchers (`src/app/api/[...path]/route.ts` or domain-specific catch-alls). Register handlers via `createCatchAllHandlers()`.
- **Migrate on touch**: When modifying an existing direct route (`src/app/api/<path>/route.ts`) for any feature work, migrate it into the catch-all as part of that PR.
- **Direct routes = tech debt**: They bypass the catch-all's built-in rate limiting, CSRF guard, and consistent error handling.

---

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
| Generated DB types | `supabase/database.types.generated.ts` (re-exported via `src/lib/database.types.ts`) |
| API responses | `src/lib/api/response.ts` (`apiSuccess`, `apiError`) |
| API response helpers | `src/lib/api-response.ts` (typed envelope) |
| QA log | `.claude/qa-log.md` |
| Audit tracker | `AUDIT_REMEDIATION_TRACKER.md` |
| Deep review tracker | `docs/archive/DEEP_REVIEW_TRACKER.md` |

## Schema Patterns (Apr 2026)

- **Soft-delete**: New tables use `deleted_at TIMESTAMPTZ` column. Filter with `.is("deleted_at", null)` for active records.
- **Commercial payments ledger**: `commercial_payments` table tracks operator-side payment receipts (separate from Razorpay `payments`). Source: `supabase/migrations/20260412183000_commercial_payments_ledger.sql`
- **Automation rules**: `automation_rules` table stores trigger-action pairs for trip workflow automation. Source: `supabase/migrations/20260326000000_automation_rules.sql`

## Types Architecture

Two types files exist — do not confuse them:
- `supabase/database.types.generated.ts` — authoritative generated types; used by both `createClient()` and `createAdminClient()` via `src/lib/database.types.ts`
- `src/lib/supabase/database.types.ts` — extended/augmented types; has newer tables not yet in the generated file

When `inbox_read_state`, `conversation_notes`, or `user_sessions` show TS errors, it's because they're in the extended file but not the generated one. Use `as any` with an `// eslint-disable-next-line` comment explaining why.

---

## Mobile-First Development Rules

TripBuilt users are 80%+ mobile (Indian tour operators). Every UI change MUST work on mobile.

### Breakpoints

- **Mobile**: < 768px (`md:` prefix = desktop-only)
- **Tablet**: 768px–1024px
- **Desktop**: > 1024px
- Test at: 390×844 (iPhone 14), 768×1024 (iPad), 1280×800 (laptop)

### Navigation Architecture

- **Single source of truth**: `src/lib/nav/nav-config.ts` — ALL navigation items defined here
- **Desktop**: `Sidebar.tsx` consumes nav-config → left sidebar
- **Mobile**: `MobileNav.tsx` consumes nav-config → bottom tabs + "More" drawer
- **Admin pages**: `AdminShellLayout` includes both Sidebar AND MobileNav
- **When adding a new page**: Add it to `nav-config.ts` with the correct `section` — it automatically appears in both desktop sidebar and mobile "More" drawer
- **Full reference**: See `docs/MOBILE_NAV.md`

### Mobile Bottom Tabs (5 slots — DO NOT change without discussion)

| Slot | Label | Route |
|------|-------|-------|
| 1 | Home | `/` |
| 2 | Inbox | `/inbox` |
| 3 | + (FAB) | Quick actions sheet |
| 4 | Trips | `/trips` |
| 5 | Clients | `/clients` |

### Page Layout Checklist (before marking any page work complete)

- [ ] Works at 390px width without horizontal scroll
- [ ] No fixed widths > 100% (use `w-full` not `w-[600px]`)
- [ ] Tables switch to card layout on mobile (`< md:`)
- [ ] Modals are full-screen on mobile (`md:max-w-lg`)
- [ ] Touch targets are ≥ 44px (Apple HIG minimum)
- [ ] Bottom nav not obscured (content has `pb-20 md:pb-0`)

### Mobile Patterns

- **List pages**: Sticky search → filter chips (scroll-x) → card list
- **Detail pages**: ← Back header → summary → tab bar (scroll-x) → content → sticky bottom CTA
- **Full-bleed pages** (inbox, calendar, planner): Override AppShell padding with `className="!p-0"`
