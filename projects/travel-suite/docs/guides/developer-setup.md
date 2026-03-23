# Local Development Setup

Step-by-step guide to get TripBuilt running locally.

---

## Prerequisites

- **Node.js** >= 20 (22 recommended, matches CI)
- **npm** (ships with Node.js)
- **Git**

## 1. Clone the Repository

```bash
git clone <repo-url> Antigravity
cd Antigravity
```

## 2. Install Dependencies

```bash
cd projects/travel-suite/apps/web
npm install
```

If you encounter peer dependency conflicts, use:

```bash
npm install --legacy-peer-deps
```

This matches the `vercel.json` install command (`npm ci --legacy-peer-deps`).

## 3. Set Up Environment Variables

Create a local `.env.local` file (gitignored) or set `SKIP_ENV_VALIDATION=true` for a minimal start.

At minimum, you need the three Supabase variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

For local Supabase (running via `supabase start`), the app auto-falls back to `http://127.0.0.1:54321` in development mode. Set `SKIP_ENV_VALIDATION=true` to bypass validation.

See [env-vars.md](./env-vars.md) for the complete list of environment variables grouped by service.

## 4. Start the Dev Server

```bash
npm run dev
```

The app starts at `http://localhost:3000`.

## 5. Available Scripts

All commands run from `projects/travel-suite/apps/web/`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | ESLint with zero-warning policy (`--max-warnings=0`) |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run test` | Run Vitest unit/integration tests |
| `npm run test:coverage` | Run tests with V8 coverage thresholds |
| `npm run test:ci` | CI-specific test run with coverage and default reporter |
| `npm run test:unit` | Run unit tests via tsx test runner |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:public` | Run public API contract E2E tests |
| `npm run test:e2e:pwa` | Run PWA-specific E2E tests |
| `npm run test:e2e:ui` | Playwright E2E with interactive UI mode |
| `npm run test:e2e:debug` | Playwright E2E with debug mode |
| `npm run qa` | Launch playwright-cli for interactive browser testing |

## 6. Project Structure

```
projects/travel-suite/apps/web/
  src/
    app/                    # Next.js App Router pages and layouts
      api/
        [...path]/          # Public API catch-all dispatcher
        admin/[...path]/    # Admin API catch-all dispatcher
        assistant/[...path]/ # Assistant API catch-all
        reputation/[...path]/ # Reputation API catch-all
        social/[...path]/   # Social API catch-all
        superadmin/[...path]/ # Superadmin API catch-all
        _handlers/          # API handler implementations
    components/             # React components
    lib/                    # Shared utilities and business logic
      api/                  # API response helpers
      auth/                 # Authentication utilities
      config/               # Environment config wrappers
      observability/        # Logger, Sentry
      payments/             # Razorpay integration
      security/             # Rate limiting, CSRF, auth guards
      supabase/             # Supabase client and types
    i18n/                   # Internationalization (next-intl)
  e2e/                      # Playwright E2E tests and config
  tests/                    # Vitest unit and component tests
  public/                   # Static assets
```

## 7. Key Architectural Patterns

- **Catch-all API routing**: All API endpoints go through dispatchers in `src/app/api/[...path]/route.ts`. Handlers live in `src/app/api/_handlers/`. Never create direct route files.
- **Environment validation**: Zod schemas in `src/env.ts` validate all env vars at startup.
- **Rate limiting**: Uses Upstash Redis. Fails closed in production without Redis configured.
- **Auth middleware**: `src/middleware.ts` handles session refresh, locale routing, and protected route guards.

## 8. Common Issues and Solutions

### `Invalid environment variables` on startup

Set `SKIP_ENV_VALIDATION=true` in your `.env.local` or provide the three required Supabase variables.

### Port 3000 already in use

Kill the existing process or use a different port:

```bash
npx next dev --port 3001
```

### `npm install` peer dependency conflicts

Use `--legacy-peer-deps` flag. Some packages (Radix UI, Tailwind v4) have overlapping peer requirements.

### TypeScript errors in editor but not in build

Run `npm run typecheck` to verify. Ensure your editor uses the workspace TypeScript version, not a global one.

### Supabase connection errors in dev

If using a remote Supabase project, verify your `NEXT_PUBLIC_SUPABASE_URL` and keys are correct. For local Supabase, run `supabase start` from `projects/travel-suite/supabase/`.
