# Testing Strategy

TripBuilt uses **Vitest** for unit and integration tests and **Playwright** for end-to-end tests.

---

## Test Frameworks

| Layer | Framework | Config File | Directory |
|-------|-----------|-------------|-----------|
| Unit / Integration | Vitest 4.x with V8 coverage | `vitest.config.ts` | `tests/unit/`, `tests/component/` |
| E2E | Playwright 1.42+ | `e2e/playwright.config.ts` | `e2e/tests/` |

## Coverage Thresholds

Enforced in `vitest.config.ts` and CI:

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Functions | 90% |
| Branches | 75% |

Coverage uses the V8 provider and only measures specific files listed in the `coverage.include` array (core lib, security modules, and handler files with unit tests).

## Running Tests

All commands from `projects/travel-suite/apps/web/`:

```bash
# Unit and integration tests
npm run test              # Single run
npm run test:coverage     # With coverage thresholds enforced

# E2E tests
npm run test:e2e          # Full E2E suite (Chromium, Firefox, WebKit, mobile)
npm run test:e2e:public   # Public API contract tests only
npm run test:e2e:pwa      # PWA-specific tests
npm run test:e2e:ui       # Interactive Playwright UI mode
npm run test:e2e:debug    # Playwright debug mode (step through tests)
npm run qa                # Interactive browser via playwright-cli
```

## Vitest Configuration

- **Test environment**: `node` by default, `jsdom` for component tests (auto-detected via `environmentMatchGlobs`)
- **Test patterns**: `tests/unit/**/*.test.ts` and `tests/component/**/*.test.{ts,tsx}`
- **Setup file**: `vitest.setup.ts`
- **Path alias**: `@` maps to `src/`, `server-only` shimmed for test environment
- **Globals**: `true` (describe, it, expect available without import)
- **Reporters**: `text` and `json-summary` for coverage

## Playwright Configuration

- **Base URL**: `http://127.0.0.1:3100` (or `PLAYWRIGHT_BASE_URL` / `BASE_URL` env var)
- **Dev server**: Auto-starts `next dev --webpack --port 3100` before tests (override via `PLAYWRIGHT_DEV_COMMAND`)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- **Auth setup**: Runs a `setup` project first to authenticate, stores state in `e2e/.auth/admin.json`
- **CI behavior**: Sequential workers (`workers: 1`), 2 retries, `forbidOnly: true`
- **Artifacts**: Traces on first retry, screenshots on failure, video on first retry
- **Report**: HTML report in `e2e/playwright-report/`

### Multiple Playwright Configs

| Config | Purpose |
|--------|---------|
| `e2e/playwright.config.ts` | Full E2E suite with auth |
| `e2e/playwright.public.config.ts` | Public API contract tests (no auth needed) |
| `e2e/playwright.pwa.config.ts` | PWA-specific tests |
| `e2e/playwright.prod.config.ts` | Production-targeted tests |

## Test Accounts

Four test accounts exist in Supabase for E2E and manual testing:

| Role | Email | Profile `role` | Notes |
|------|-------|----------------|-------|
| Admin | `e2e-admin@tripbuilt.com` | `admin` | `onboarding_step = 0` (triggers onboarding wizard) |
| Client | `e2e-client@tripbuilt.com` | `client` | Standard client user |
| Driver | `e2e-driver@tripbuilt.com` | `driver` | Standard driver user |
| Super Admin | `e2e-superadmin@tripbuilt.com` | `super_admin` | Full platform access |

Credentials are stored in `e2e/.env` (gitignored). See `e2e/.env.example` for the template.

Login endpoint: `POST /api/auth/password-login` with `{ email, password }`.

## E2E Target

- **Local**: `http://127.0.0.1:3100` (auto-started dev server)
- **Production**: `https://tripbuilt.com` (via `playwright.prod.config.ts`)

## Writing Unit Tests

### Handler Test Pattern

Tests for API handlers follow this structure:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the handler
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    }),
  },
}));

import { POST } from '@/app/api/_handlers/example/route';

describe('POST /api/example', () => {
  it('returns success for valid input', async () => {
    const req = new Request('http://localhost/api/example', {
      method: 'POST',
      body: JSON.stringify({ field: 'value' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req, { params: Promise.resolve({}) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
```

### Mocking Supabase

The admin client (`src/lib/supabase/admin.ts`) is the primary Supabase access point in server code. Mock it at the module level:

```typescript
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));
```

For the `server-only` import guard, a shim exists at `tests/shims/server-only.ts` and is configured in `vitest.config.ts` as an alias.

## CI Integration

Tests run automatically in CI via `.github/workflows/ci.yml`:

1. **`web-lint-build` job**: Runs lint, typecheck, build, and public E2E contract tests
2. **`security-audit` job**: Runs `npm run test:coverage` to enforce coverage thresholds

Both jobs only run when files in `projects/travel-suite/apps/web/` have changed.
