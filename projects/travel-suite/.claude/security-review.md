# Security Review — travel-suite (P3)
**Date**: 2026-03-11 | **Reviewer**: Claude (automated) | **Scope**: web app API handlers, auth, payments, middleware

---

## ✅ PASS — No Action Required

| # | Area | Finding |
|---|------|---------|
| 1 | Secrets | Zero hardcoded secrets. All API keys/tokens via `process.env` through `src/lib/config/env.ts` |
| 2 | npm audit | 0 critical · 0 high · 0 moderate · 0 low |
| 3 | CSP | Strict CSP in `next.config.ts`: `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'self'`, explicit Razorpay/PostHog allowlist |
| 4 | Security headers | X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff, Referrer-Policy strict-origin, Permissions-Policy (camera/mic/geo blocked) |
| 5 | Payment signature | Razorpay HMAC via `crypto.createHmac('sha256')` + `timingSafeEqual` — timing-safe ✅ |
| 6 | Rate limiting | Upstash Redis sliding window on: `auth/password-login` (8/10min), `payments/create-order`, `assistant/chat`, `leads/convert`, `reputation/widget`, `reputation/nps/submit` |
| 7 | Mock endpoints | `ensureMockEndpointAllowed()` returns 501 in production — dev routes cannot be reached in prod |
| 8 | Waha webhook | `validateWahaWebhookSecret()` uses `safeEqual()` timing-safe comparison |
| 9 | God mode | Server-side auth via `/api/superadmin/me` → role check `=== 'super_admin'`; shows "Access Denied" UI otherwise |
| 10 | RLS | Row-level security enabled + `FORCE ROW LEVEL SECURITY` on all new tables (confirmed in migrations) |
| 11 | Logging | No passwords, tokens, or secrets in `console.log/info/debug` calls |
| 12 | SQL injection | All DB access via Supabase ORM parameterized queries or named RPC params — no string-interpolated SQL |
| 13 | Error exposure | Generic 500 messages returned to clients; detailed errors logged server-side only |

---

## ⚠️ WARN — Low/Medium Risk (Non-blocking)

### W1 — MEDIUM: `unsafe-inline` in script-src CSP
**File**: `apps/web/next.config.ts`
**Detail**: `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://app.posthog.com`  
`unsafe-inline` allows inline `<script>` execution which weakens XSS protection.  
**Justification**: Required for Next.js hydration, PostHog analytics, and Razorpay checkout widget.  
**Recommendation**: Migrate to nonce-based CSP using Next.js 15's `generateBuildId`/CSP nonce. Track as tech-debt.

### W2 — MEDIUM: Rate limit in-memory fallback resets on cold start
**File**: `apps/web/src/lib/security/rate-limit.ts`  
**Detail**: When `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are absent, falls back to an in-memory `Map` that is wiped on every serverless cold start — trivially bypassable in production.  
**Code already warns**: `console.error("[rate-limit] CRITICAL: Redis unavailable...")`  
**Action**: Verify these two env vars are set in Vercel production dashboard. Add a startup health-check assertion.

### W3 — LOW: `reputation/sync` uses TypeScript cast instead of Zod
**File**: `apps/web/src/app/api/_handlers/reputation/sync/route.ts:126`  
**Detail**: `const body = (await request.json().catch(() => ({}))) as { connectionId?: string }`  
TypeScript casting provides no runtime validation. However, risk is low because:
- Route requires Supabase `auth.getUser()` + org membership check
- `connectionId` is used only in a Supabase parameterized `.eq("id", body.connectionId)` query
- Invalid values return empty results, no injection vector  
**Recommendation**: Replace cast with `z.object({ connectionId: z.string().uuid().optional() }).safeParse(body)` in the next routine maintenance pass.

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 0 | — |
| 🟠 High | 0 | — |
| 🟡 Medium | 2 | Non-blocking, documented |
| 🟢 Low | 1 | Non-blocking |

**No blocking issues. Codebase follows security best practices for a Next.js + Supabase SaaS.**

---

## Recommended Follow-up (Next Sprint)
1. Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel production (W2 fix)
2. Add a startup check that throws if both env vars are missing in production
3. Replace TypeScript cast in `reputation/sync` with Zod schema (W3 fix)
4. Track nonce-based CSP migration as a future hardening task
