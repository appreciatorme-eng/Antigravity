# Deployment Guide

TripBuilt is deployed to **Vercel** (Hobby plan) with the production domain **tripbuilt.com**.

---

## Vercel Hobby Plan Constraints

- **2 cron job slots** maximum
- **10-second default** function timeout, **60-second maximum**
- No team features or enterprise Edge Functions
- Cron handlers must export `POST` only (no `GET`)

## Deployment Workflow

### Automatic (Primary)

Push to `main` triggers automatic deployment via two mechanisms:

1. **Vercel Git Integration**: Native auto-deploy on push to `main` (always active).
2. **GitHub Actions workflow** (`vercel-production-deploy.yml`): Runs `vercel deploy --prod` with commit metadata. Falls back to a deploy hook URL if the Vercel token is invalid.

The GitHub Actions workflow:
- Validates the `VERCEL_TOKEN` secret
- Pulls Vercel project settings
- Removes cron config from `vercel.json` for CI deploys (Hobby plan compatibility)
- Deploys to production
- Runs a health check against the production URL

### Manual

Trigger a deploy via GitHub Actions `workflow_dispatch` on the `vercel-production-deploy.yml` workflow.

## Environment Variables

All environment variables are configured in the **Vercel dashboard** under Project Settings > Environment Variables. Do not commit `.env` files to the repository.

See [env-vars.md](./env-vars.md) for the complete list.

Required secrets in GitHub Actions:

| Secret | Purpose |
|--------|---------|
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `VERCEL_TOKEN` | Vercel API token for CLI deploys |
| `VERCEL_DEPLOY_HOOK_URL` | Fallback deploy hook when token is invalid |
| `PRODUCTION_HEALTHCHECK_URL` | Post-deploy health check endpoint |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (used in CI build) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (used in CI build) |

## Cron Jobs

Configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/assistant-briefing",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/automation-processor",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Both cron jobs run daily. Cron handlers:
- Must export `POST` only (Vercel sends POST requests for crons)
- Must verify `CRON_SECRET` via the `Authorization: Bearer <secret>` header
- Must complete within the 60-second function timeout

The CI deploy workflow strips the `crons` key from `vercel.json` before deploying because Hobby plans have limited cron slots and the native Vercel Git integration handles cron registration separately.

## Supabase Edge Functions

Edge Functions live in `projects/travel-suite/supabase/functions/`. Deploy with:

```bash
supabase functions deploy <function-name>
```

Or deploy all functions:

```bash
supabase functions deploy
```

## CI/CD Pipelines

### `ci.yml` -- Lint, Build, and Test

Triggers on push and PR to `main` when `projects/travel-suite/**` files change.

**Web app checks** (when web files change):
1. Install dependencies (`npm ci`)
2. Lint (`npm run lint` -- zero warnings enforced)
3. Type check (`npm run typecheck`)
4. Build (`npm run build`)
5. Public API contract tests (`npm run test:e2e:public`)

**Security audit** (when web files change):
1. `npm audit --audit-level=high` -- warns on high-severity vulnerabilities
2. `npm run test:coverage` -- enforces coverage thresholds (80% lines, 90% functions, 75% branches)

**Dependency review** (PRs only):
- `actions/dependency-review-action` -- blocks PRs that introduce known-vulnerable dependencies at `high` severity

**Other checks** (conditional on file changes):
- Agents (Python): syntax compilation checks and pytest
- Mobile (Flutter): `flutter analyze`
- Migrations (SQL): file presence check

### `vercel-production-deploy.yml` -- Production Deploy

Triggers on push to `main` when web files change, or via manual dispatch. Deploys to Vercel production and runs a health check.

### `auto-merge-on-task-done.yml` -- Auto-Merge

Manual or repository_dispatch trigger. Merges a PR after verifying CI status and review approvals. Used by task management automation.

### Dependabot

Configured to run weekly (Mondays). Automatically creates PRs for patch and minor npm dependency updates.

## Build Configuration

From `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci --legacy-peer-deps",
  "devCommand": "npm run dev"
}
```

## Domain

- Production: `tripbuilt.com`
- Configure DNS and domain in Vercel dashboard under Project Settings > Domains.
