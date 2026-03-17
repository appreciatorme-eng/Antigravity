# E2E Test Setup Guide

This guide explains how to set up and run E2E tests for the onboarding wizard and other features.

## Prerequisites

1. **Running development server**: `npm run dev` in the web app directory
2. **Database access**: Local or remote PostgreSQL database with Supabase schema
3. **Test user accounts**: Admin user with incomplete onboarding

## Quick Setup

### Step 1: Create Test Users

You need at least one test admin user for onboarding wizard tests. You have two options:

**Option A: Create via the app (recommended for local development)**

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/auth`
3. Register a new account with email: `admin@test.local` (or any email you prefer)
4. Set a password: `password` (or any password you prefer)
5. **Important**: After registration, verify the user's `onboarding_step` is < 2 in the database:

```sql
-- Check onboarding step
SELECT id, email, onboarding_step FROM auth.users
JOIN public.profiles ON auth.users.id = profiles.id
WHERE email = 'admin@test.local';

-- If needed, reset onboarding step to 0
UPDATE public.profiles
SET onboarding_step = 0
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@test.local');
```

**Option B: Use existing admin account**

If you already have an admin account, you can use it for tests. Just update the `.env` file with its credentials.

### Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp e2e/.env.example e2e/.env
   ```

2. Edit `e2e/.env` and update with your test user credentials:
   ```bash
   # Required for onboarding wizard tests
   TEST_ADMIN_EMAIL=admin@test.local
   TEST_ADMIN_PASSWORD=password

   # Optional for other tests
   # TEST_CLIENT_EMAIL=client@test.local
   # TEST_CLIENT_PASSWORD=password
   ```

### Step 3: Run E2E Tests

```bash
# Run all E2E tests (all browsers)
npm run test:e2e

# Run specific test file
npm run test:e2e -- e2e/tests/onboarding-wizard.spec.ts

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific browser only
npm run test:e2e -- --project=chromium
```

## How Authentication Works

1. **Setup Phase**: The `auth.setup.ts` file runs before all tests
   - Reads `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` from environment
   - Logs in via API and saves session cookies to `e2e/.auth/admin.json`
   - Other browser projects load this auth state automatically

2. **Test Phase**: Tests run with authenticated session
   - Browser projects (chromium, firefox, etc.) load `admin.json` storage state
   - Tests can navigate to protected routes like `/onboarding` without redirects
   - Tests simulate an authenticated admin user with incomplete onboarding

3. **Graceful Degradation**: If auth state doesn't exist
   - Tests that require protected routes will fail (expected behavior)
   - Error message will indicate missing auth configuration
   - Fix by creating test users and updating `.env` file

## Troubleshooting

### Tests fail with "element not found"

**Symptom**: Tests navigate to `/onboarding` but can't find wizard content

**Cause**: Tests are running without authentication, so middleware redirects to `/auth`

**Solution**:
1. Verify test user exists: Check database for `admin@test.local`
2. Verify credentials in `e2e/.env`: Ensure `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` match the user
3. Verify onboarding incomplete: User's `onboarding_step` should be 0 or 1
4. Delete old auth state: `rm -rf e2e/.auth/*.json` and re-run tests
5. Check setup logs: Look for "Failed to create auth state" errors

### Auth setup fails with "invalid credentials"

**Cause**: Test user doesn't exist or password is wrong

**Solution**:
1. Create the test user via the app
2. Update `e2e/.env` with correct credentials
3. Re-run: `npm run test:e2e`

### Tests timeout waiting for server

**Cause**: Dev server not starting or wrong port

**Solution**:
1. Check if port 3100 is available: `lsof -i :3100`
2. Override with existing server: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e`
3. Or start dev server manually before running tests

## Test User Requirements

For onboarding wizard tests to pass, the test admin user must have:

- **Role**: `admin` (not client, driver, or super_admin)
- **Organization**: Either NULL or an organization_id
- **Onboarding Step**: 0 or 1 (incomplete onboarding)

You can verify this with:

```sql
SELECT
  u.email,
  p.role,
  p.organization_id,
  p.onboarding_step,
  CASE
    WHEN p.onboarding_step < 2 THEN 'Will see wizard ✅'
    ELSE 'Onboarding complete, will redirect ❌'
  END as test_status
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@test.local';
```

## CI/CD Configuration

For CI environments, set test credentials as secrets:

```bash
# GitHub Actions secrets
TEST_ADMIN_EMAIL=ci-admin@example.com
TEST_ADMIN_PASSWORD=${{ secrets.TEST_ADMIN_PASSWORD }}

# Or use pre-built auth state
# Commit e2e/.auth/admin.json to the repository (if safe)
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Project README](../README.md#e2e-playwright)
