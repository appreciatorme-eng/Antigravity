# Troubleshooting Guide

Common problems, causes, and solutions for TripBuilt development and production.

---

## 1. Build Failures

### Type errors during `npm run build`

**Cause**: TypeScript strict mode catches type mismatches that editors might miss.

**Solution**:
1. Run `npm run typecheck` locally before pushing
2. Check that all imports resolve correctly (especially `@/` path aliases)
3. Verify `src/lib/supabase/database.types.ts` is up to date with your Supabase schema

### Missing dependencies

**Cause**: `package-lock.json` out of sync or peer dependency conflicts.

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Environment variable errors in build

**Cause**: Zod validation in `src/env.ts` fails because required variables are missing.

**Solution**:
- For CI builds: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as GitHub Actions secrets (or placeholder values)
- For local builds: create `.env.local` with required vars or set `SKIP_ENV_VALIDATION=true`

---

## 2. Dev Server Won't Start

### Port 3000 already in use

**Cause**: Another process occupies the port.

**Solution**:
```bash
# Find and kill the process
lsof -ti :3000 | xargs kill -9

# Or use a different port
npx next dev --port 3001
```

### Missing environment variables

**Cause**: The app throws at startup due to Zod validation.

**Solution**: Set the three required Supabase variables in `.env.local`, or set `SKIP_ENV_VALIDATION=true` for development.

---

## 3. Supabase Connection Errors

### "Missing NEXT_PUBLIC_SUPABASE_URL" in production

**Cause**: Variable not set in Vercel dashboard.

**Solution**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Project Settings > Environment Variables.

### Expired JWT / auth errors

**Cause**: The Supabase service role key or anon key has been rotated.

**Solution**: Regenerate keys in Supabase dashboard and update them in Vercel.

### RLS blocking queries

**Cause**: Row-Level Security policies reject the request. The service role key bypasses RLS, but the anon key does not.

**Solution**:
- Server-side code should use `supabaseAdmin` (service role) from `src/lib/supabase/admin.ts`
- Client-side code uses the anon key and must satisfy RLS policies
- Check the Supabase dashboard SQL editor to test queries with different roles

### Local Supabase fallback

**Cause**: In development, missing Supabase vars fall back to `http://127.0.0.1:54321`.

**Solution**: Either run `supabase start` locally or provide real Supabase credentials. Set `ALLOW_SUPABASE_DEV_FALLBACK=false` to disable the fallback and surface the actual error.

---

## 4. Rate Limiting Errors

### 429 responses in development

**Cause**: Upstash Redis is not configured, and rate limiting fails closed by default in production mode.

**Solution**:
- In development: Set `RATE_LIMIT_FAIL_OPEN=true` in `.env.local`
- In production: Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel. These are required for rate limiting to function; without them, all rate-limited endpoints reject requests

### Rate limit hit too quickly

**Cause**: Default rate limits may be aggressive for development.

**Solution**: Rate limits are configured per-dispatcher in the catch-all route registration. Check `src/lib/security/rate-limit.ts` for the fallback (in-memory) limiter behavior.

---

## 5. WhatsApp Webhook Not Working

### Webhook verification fails

**Cause**: Meta sends a GET request with a `hub.verify_token` challenge. The token must match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (or `WHATSAPP_VERIFY_TOKEN`).

**Solution**:
1. Set `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in Vercel to the same value configured in Meta's webhook settings
2. Ensure the webhook URL points to your API endpoint

### Webhook signature mismatch

**Cause**: `WHATSAPP_APP_SECRET` does not match the Meta app's secret, or the raw body is being parsed before signature verification.

**Solution**:
1. Verify `WHATSAPP_APP_SECRET` matches the value in Meta Developer Console
2. For development, set `WHATSAPP_ALLOW_UNSIGNED_WEBHOOK=true` to skip signature checks (never in production)

### Messages not sending

**Cause**: `WHATSAPP_API_TOKEN` or `WHATSAPP_PHONE_NUMBER_ID` is missing or invalid.

**Solution**: Verify both variables are set. The code also reads `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID` as aliases.

---

## 6. Payment Webhook Errors (Razorpay)

### Signature validation failure

**Cause**: `RAZORPAY_WEBHOOK_SECRET` does not match the webhook secret configured in the Razorpay dashboard.

**Solution**: Copy the exact webhook secret from Razorpay Dashboard > Settings > Webhooks and set it as `RAZORPAY_WEBHOOK_SECRET` in Vercel.

### Payment creation fails

**Cause**: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are missing or using test keys in production.

**Solution**: Verify both server-side keys and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (client-side) are set correctly. Test keys start with `rzp_test_`, live keys with `rzp_live_`.

---

## 7. Cron Jobs Not Running

### Cron endpoint returns 405 Method Not Allowed

**Cause**: Handler exports `GET` instead of `POST`. Vercel cron jobs send `POST` requests.

**Solution**: Ensure cron handlers export only `POST`.

### CRON_SECRET mismatch

**Cause**: The `Authorization: Bearer <secret>` header from Vercel does not match `CRON_SECRET` in environment variables.

**Solution**: Set `CRON_SECRET` in Vercel dashboard to match the value Vercel sends (configured in Vercel project settings).

### Only 2 cron slots available

**Cause**: Vercel Hobby plan limits cron jobs to 2 slots.

**Solution**: The current crons are `assistant-briefing` (daily 1 AM UTC) and `automation-processor` (daily 2 AM UTC). To add more, you must consolidate existing crons into a single dispatcher or upgrade the Vercel plan.

---

## 8. Auth Redirect Loops

### Infinite redirect between /auth and protected routes

**Cause**: Middleware in `src/middleware.ts` redirects unauthenticated users to `/auth`. If the auth page itself triggers a protected route check, a loop occurs.

**Solution**:
1. Check that `/auth` is not in the `PROTECTED_PREFIXES` list
2. Verify the Supabase session cookie is being set correctly (check `updateSession` in middleware)
3. Clear browser cookies and try again

### Stuck on /onboarding

**Cause**: The middleware redirects users with incomplete onboarding (`onboarding_step > 0`) away from protected routes to `/onboarding`.

**Solution**: Complete the onboarding flow, or update the user's `onboarding_step` to `0` in Supabase to mark onboarding as complete. The `e2e-admin@tripbuilt.com` test account has `onboarding_step = 0`.

---

## 9. Lint Failures

### Zero-warning policy

**Cause**: `npm run lint` runs ESLint with `--max-warnings=0`. Any warning is treated as a failure.

**Solution**:
1. Fix all warnings before committing
2. Run `npm run lint` locally to catch issues early
3. If a rule is genuinely inapplicable, use an inline `// eslint-disable-next-line` comment with a justification

---

## 10. E2E Test Failures

### Tests fail with "Navigated to /auth"

**Cause**: Auth state file (`e2e/.auth/admin.json`) is missing or expired.

**Solution**:
1. Ensure `e2e/.env` contains valid test account credentials
2. Delete `e2e/.auth/` and re-run tests -- the setup project will re-authenticate
3. Verify test accounts exist in Supabase

### Wrong base URL

**Cause**: Tests target `http://127.0.0.1:3100` by default but the dev server runs on a different port.

**Solution**: Set `PLAYWRIGHT_BASE_URL` or `BASE_URL` environment variable to match your dev server URL.

### Timeout waiting for dev server

**Cause**: The dev server takes too long to start (default timeout is 120 seconds).

**Solution**: Set `PLAYWRIGHT_WEB_SERVER_TIMEOUT` to a higher value (in milliseconds), or start the dev server manually and set `PLAYWRIGHT_BASE_URL` to skip auto-start.

### Test accounts not found

**Cause**: The four E2E test accounts (`e2e-admin@tripbuilt.com`, etc.) do not exist in the target Supabase project.

**Solution**: Create the test accounts in your Supabase project. See the test accounts table in [testing-guide.md](./testing-guide.md).
