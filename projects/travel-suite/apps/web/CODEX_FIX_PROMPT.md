# Security Hardening & Gold-Standard Remediation — Antigravity Web App

## Repository: https://github.com/appreciatorme-eng/Antigravity
## Scope: `projects/travel-suite/apps/web/`
## Branch: Create `fix/security-hardening-s23` from current HEAD

---

## INSTRUCTIONS

You are a senior security engineer and TypeScript specialist implementing fixes against a production readiness audit that scored **56/110**.

**Rules:**
1. Create branch `fix/security-hardening-s23` from the current HEAD
2. Make atomic commits per fix category (one commit per tracker item)
3. After each fix, run `npm run lint` and `npm run typecheck` from `projects/travel-suite/apps/web/` — both MUST pass with zero warnings before committing
4. After ALL fixes, run `npm run test:coverage` — MUST pass with 80% lines / 90% functions / 75% branches
5. DO NOT touch files outside `projects/travel-suite/apps/web/` except the root `CLAUDE.md`
6. Use `git add <specific-files>` — NEVER `git add .` or `git add -A`
7. Commit messages use conventional format: `fix:`, `refactor:`, `test:`, `docs:`, `chore:`

**IMPORTANT CONTEXT — What was ALREADY fixed (do NOT redo):**
- CQ-1 (commit `7851ffc`): 153 `as any` casts replaced with proper Supabase types — only 9 justified ones remain
- CQ-2 (commit `62cebe6`): 3 largest files split (LayoutRenderer, template-registry, trips/[id]/page)
- CQ-3 (commit `56a370a`): 165 server-side console calls migrated to structured logger
- CQ-4 (commit `730be76`): API response envelopes standardized
- Raw `<img>` tags: None exist — all images use `next/image`
- INR/paise: Already consistent — all payment flows correctly divide by 100

**ACCEPTED DECISIONS — do NOT change these:**
- CSP `unsafe-inline` (Next.js requirement)
- No circuit breaker / dead letter queue (Vercel Hobby — stateless)
- Both `leaflet` AND `maplibre-gl` (different use cases)
- Polling intervals as literal numbers (contextual)
- Upstash rate limiter fail-closed in production (security choice)

---

## GOLD STANDARD PATTERNS — Copy These Exactly

### Pattern A: Admin Mutation Handler (from `admin/clear-cache/route.ts`)
```typescript
import { requireAdmin } from "@/lib/auth/admin";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const admin = await requireAdmin(req, { requireOrganization: true });
  if (admin instanceof NextResponse) return admin;

  if (!passesMutationCsrfGuard(req)) {
    return NextResponse.json(
      { error: "CSRF validation failed for admin mutation" },
      { status: 403 }
    );
  }

  // ... handler logic
}
```

### Pattern B: Cron Handler (from `cron-auth.ts`)
```typescript
import { authorizeCronRequest } from "@/lib/security/cron-auth";

export async function POST(req: Request) {
  const cronAuth = await authorizeCronRequest(req, {
    headerName: "x-cron-secret",
    replayWindowMs: 10 * 60 * 1000,
  });
  if (!cronAuth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... handler logic
}
```

### Pattern C: Error Sanitization (from `safe-error.ts`)
```typescript
import { safeErrorMessage } from "@/lib/security/safe-error";

// WRONG:  return apiError(error.message, 400);
// RIGHT:  return apiError(safeErrorMessage(error, "Failed to update share"), 400);
```

---

## TRACKER — Create This File First

Create `projects/travel-suite/apps/web/SECURITY_HARDENING_TRACKER.md` with the content below. Update each item's status as you complete it.

```markdown
# Security Hardening Tracker — S23

| # | Severity | Item | Status | Commit |
|---|----------|------|--------|--------|
| SH-1 | CRITICAL | Payment forgery — remove paid/cancelled from public tracking | ⬜ | |
| SH-2 | HIGH | CSRF guard — admin/clients POST | ⬜ | |
| SH-3 | HIGH | CSRF guard — admin/contacts POST | ⬜ | |
| SH-4 | HIGH | CSRF guard — admin/generate-embeddings POST | ⬜ | |
| SH-5 | HIGH | CSRF guard — admin/leads POST | ⬜ | |
| SH-6 | HIGH | CSRF guard — admin/trips POST | ⬜ | |
| SH-7 | HIGH | CSRF guard — superadmin/announcements POST | ⬜ | |
| SH-8 | HIGH | Cron auth — migrate assistant-alerts to authorizeCronRequest | ⬜ | |
| SH-8b | HIGH | Cron auth — migrate assistant-briefing to authorizeCronRequest | ⬜ | |
| SH-8c | HIGH | Cron auth — migrate assistant-digest to authorizeCronRequest | ⬜ | |
| SH-8d | HIGH | Cron auth — migrate reputation-campaigns to authorizeCronRequest | ⬜ | |
| SH-9 | HIGH | Cron auth — migrate schedule-followups to authorizeCronRequest | ⬜ | |
| SH-10 | HIGH | Cron auth — migrate batch-analyze to authorizeCronRequest | ⬜ | |
| SH-11 | HIGH | Fix batch-analyze spend bucket ai_image → ai_text | ⬜ | |
| SH-12 | MEDIUM | Error leakage — 6 raw error.message in share/[token] | ⬜ | |
| SH-13 | MEDIUM | WAHA webhook — remove query string secret fallback | ⬜ | |
| SH-14 | MEDIUM | GST hardcoding — extract to config | ⬜ | |
| SH-15 | MEDIUM | Stale test fixture — share-route.test.ts expired date | ⬜ | |
| SH-16 | MEDIUM | Expand vitest coverage whitelist | ⬜ | |
| SH-17 | MEDIUM | Add tests for payment tracking abuse rejection | ⬜ | |
| SH-18 | MEDIUM | select("*") cleanup — all ~143 occurrences | ⬜ | |
| SH-19 | MEDIUM | Split oversized files (13 files > 800 lines) | ⬜ | |
| SH-20 | MEDIUM | Add rate limits to assistant/reputation/social dispatchers | ⬜ | |
| SH-21 | LOW | CLAUDE.md — fix Next version, proxy.ts ref, 6 catch-alls | ⬜ | |
```

---

## FIX SPECIFICATIONS

### SH-1: Payment Forgery (CRITICAL — do this FIRST)

**File 1:** `src/app/api/_handlers/payments/track/[token]/route.ts`

**Problem:** Line 12 accepts `"paid"` and `"cancelled"` as public events. The POST handler at line 40 persists these without Razorpay signature verification. Anyone with a valid payment link token (which customers receive in the payment URL) can forge payment completion.

**BEFORE (line 12):**
```typescript
const eventSchema = z.object({
  event: z.enum(["created", "sent", "viewed", "reminder_sent", "paid", "expired", "cancelled"]),
  metadata: z.record(z.string(), z.string()).optional(),
});
```

**AFTER:**
```typescript
const TRACKING_EVENTS = ["created", "sent", "viewed", "reminder_sent", "expired"] as const;

const eventSchema = z.object({
  event: z.enum(TRACKING_EVENTS),
  metadata: z.record(z.string(), z.string()).optional(),
});
```

Also replace the `console.error` on line 35 and 72 with the structured logger:
```typescript
import { logger } from "@/lib/observability/logger";

// line 35 — replace console.error:
logger.error("[payments/track/:token] load failed", { error });

// line 72 — replace console.error:
logger.error("[payments/track/:token] update failed", { error });
```

**File 2:** `src/lib/payments/payment-links.server.ts`

Defense-in-depth: add a guard at the TOP of `recordPaymentLinkEvent()` (line 321) so even internal callers can't accidentally set `paid`/`cancelled` through this function. The ONLY path to `paid` is the Razorpay webhook at `payments/webhook/route.ts` which calls `recordPaymentLinkEvent` with proper signature verification.

**BEFORE (lines 321-330):**
```typescript
export async function recordPaymentLinkEvent(
  admin: AdminDbClient,
  args: {
    token: string;
    event: PaymentEventType;
    metadata?: Record<string, string>;
    razorpayPaymentId?: string | null;
    baseUrl?: string;
  },
) {
  const { data, error } = await admin
```

**AFTER (add guard after function signature, before the query):**
```typescript
export async function recordPaymentLinkEvent(
  admin: AdminDbClient,
  args: {
    token: string;
    event: PaymentEventType;
    metadata?: Record<string, string>;
    razorpayPaymentId?: string | null;
    baseUrl?: string;
    _callerVerified?: boolean;
  },
) {
  if ((args.event === "paid" || args.event === "cancelled") && !args._callerVerified) {
    throw new Error(
      `Payment state "${args.event}" must come through verified webhook — use _callerVerified: true from signature-checked callers only`
    );
  }

  const { data, error } = await admin
```

Then in `src/app/api/_handlers/payments/verify/route.ts` (the Razorpay-verified path), add `_callerVerified: true` to the `recordPaymentLinkEvent` call:
```typescript
const updatedLink = await recordPaymentLinkEvent(admin, {
  token: parsed.data.token,
  event: "paid",
  razorpayPaymentId: parsed.data.razorpay_payment_id,
  baseUrl: new URL(request.url).origin,
  _callerVerified: true,
});
```

And in `src/app/api/_handlers/payments/webhook/route.ts` — search for any `recordPaymentLinkEvent` calls with `event: "paid"` and add `_callerVerified: true` there too.

**Verification:** POST `{"event": "paid"}` to `/api/payments/track/[token]` → must return 400 (Zod validation rejects it). Calling `recordPaymentLinkEvent({ event: "paid" })` without `_callerVerified: true` → must throw.

---

### SH-2 through SH-7: CSRF Guards on Admin Mutations

For each of these files, add the CSRF guard immediately after `requireAdmin()` or `requireSuperAdmin()`, following Pattern A above:

| # | File | Method |
|---|------|--------|
| SH-2 | `src/app/api/_handlers/admin/clients/route.ts` | POST (around line 117) |
| SH-3 | `src/app/api/_handlers/admin/contacts/route.ts` | POST (around line 137) |
| SH-4 | `src/app/api/_handlers/admin/generate-embeddings/route.ts` | POST (around line 36) |
| SH-5 | `src/app/api/_handlers/admin/leads/route.ts` | POST (around line 74) |
| SH-6 | `src/app/api/_handlers/admin/trips/route.ts` | POST |
| SH-7 | `src/app/api/_handlers/superadmin/announcements/route.ts` | POST (around line 35) |

**For each file:**
1. Import `passesMutationCsrfGuard` from `@/lib/security/admin-mutation-csrf`
2. After the `requireAdmin`/`requireSuperAdmin` call, add:
```typescript
if (!passesMutationCsrfGuard(req)) {
  return NextResponse.json(
    { error: "CSRF validation failed for admin mutation" },
    { status: 403 }
  );
}
```
3. Only add to POST/PUT/DELETE/PATCH methods — GET methods do not need CSRF

**Also audit:** Any OTHER admin/superadmin routes with POST/PUT/DELETE that are missing the CSRF guard. The 6 listed above are the confirmed gaps, but there may be more. Search for `requireAdmin` and `requireSuperAdmin` imports, check if POST/PUT/DELETE handlers have the CSRF check.

---

### SH-8 through SH-10: Migrate Cron Endpoints to Hardened Auth

**Reference implementation:** `src/lib/security/cron-auth.ts` — provides `authorizeCronRequest()` with:
- Timing-safe comparison
- Replay detection via Redis + in-memory fallback
- HMAC signature support
- Clock skew tolerance

**SH-8:** `src/app/api/_handlers/cron/assistant-alerts/route.ts`
- Remove the ad-hoc 3-check auth block (lines 25-39)
- Replace with `authorizeCronRequest()` per Pattern B
- Remove `isAdminBearerToken` and `isCronSecretHeader`/`isCronSecretBearer` imports if no longer needed

**SH-9:** `src/app/api/_handlers/notifications/schedule-followups/route.ts`
- Remove the 4-check auth block (lines 79-91)
- Replace with `authorizeCronRequest()` per Pattern B
- Remove `isServiceRoleBearer` acceptance — cron jobs should NOT accept service role tokens from external callers

**SH-10:** `src/app/api/_handlers/reputation/ai/batch-analyze/route.ts`
- Remove the custom `validateCronAuth()` function (lines 107-129) — it uses plain `===` comparison (timing attack vulnerable) and has a dev bypass
- Replace with `authorizeCronRequest()` per Pattern B

**ALSO MIGRATE — these 3 additional cron handlers use the same old pattern:**

**SH-8b:** `src/app/api/_handlers/cron/assistant-briefing/route.ts` (60 lines)
- Same old pattern as assistant-alerts: `isCronSecretHeader`/`isCronSecretBearer`/`isAdminBearerToken`
- Replace with `authorizeCronRequest()` per Pattern B

**SH-8c:** `src/app/api/_handlers/cron/assistant-digest/route.ts` (65 lines)
- Same old pattern
- Replace with `authorizeCronRequest()` per Pattern B

**SH-8d:** `src/app/api/_handlers/cron/reputation-campaigns/route.ts` (110 lines)
- Same old pattern at lines 43-46
- Replace with `authorizeCronRequest()` per Pattern B

**Already correct (do NOT change):**
- `cron/operator-scorecards/route.ts` — already uses `authorizeCronRequest()` at line 9 ✅

---

### SH-11: Fix Spend Bucket

**File:** `src/app/api/_handlers/reputation/ai/batch-analyze/route.ts`

Lines 202-214 record text AI spend under `"ai_image"`:
```typescript
const costPerRequest = getEstimatedRequestCostUsd("ai_image");
await reserveDailySpendUsd(review.organization_id, "ai_image", costPerRequest, ...)
```

**Fix:** Change both occurrences of `"ai_image"` to `"ai_text"` (or the appropriate text-analysis bucket name — check what other text-AI endpoints use by searching for `getEstimatedRequestCostUsd`).

---

### SH-12: Error Leakage in Share Route

**File:** `src/app/api/_handlers/share/[token]/route.ts`

Six locations return raw Supabase error messages to public clients:
- Line 232: `return apiError(updateError.message, 400);`
- Line 255: `return apiError(updateError.message, 400);`
- Line 275: `return apiError(updateError.message, 400);`
- Line 307: `return apiError(updateError.message, 400);`
- Line 337: `return apiError(updateError.message, 400);`
- Line 353: `return apiError(updateError.message, 400);`

**Fix:** Import `safeErrorMessage` from `@/lib/security/safe-error` and replace each:
```typescript
// Before:
return apiError(updateError.message, 400);
// After:
return apiError(safeErrorMessage(updateError, "Failed to update share"), 400);
```

**Also search:** the entire `src/` tree for other instances of `error.message` or `error?.message` being passed directly to `apiError()`, `NextResponse.json()`, or `Response.json()`. Fix ALL of them the same way.

---

### SH-13: WAHA Webhook Secret

**File:** `src/app/api/_handlers/webhooks/waha/secret.ts`

Lines 24-26:
```typescript
const providedSecret =
  providedHeaderSecret?.trim() ?? url.searchParams.get("secret")?.trim() ?? "";
```

**Fix:** Remove the query string fallback:
```typescript
const providedSecret = providedHeaderSecret?.trim() ?? "";
```

Secrets in URLs leak through access logs, browser history, proxy logs, and analytics.

---

### SH-14: GST Hardcoding

**File:** `src/app/api/_handlers/payments/verify/route.ts`

Line 83: `gstLabel: "5% GST (HSN 998551)"`

**Fix:**
1. Check if there's an org settings table or payment config that stores GST details
2. If yes: fetch from there, with `"5% GST (HSN 998551)"` as default fallback
3. If no config table exists: extract to a constant at the top of the file with a clear `// TODO: Move to org settings when multi-rate GST is needed` comment
4. Either way, the hardcoded string should not be inline in the business logic

---

### SH-15: Stale Test Fixture

**File:** `tests/unit/routes/share-route.test.ts`

Line 58: `expires_at: "2026-03-10T00:00:00.000Z"` — this date has already passed, causing `npm run test:coverage` to fail.

**Fix:** Replace with a dynamic date that's always in the future:
```typescript
expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
```

**Search for other stale dates:** Check ALL test files for hardcoded dates before March 12, 2026 that could cause similar failures. Fix them all.

---

### SH-16: Expand Vitest Coverage Whitelist

**File:** `vitest.config.ts`

Lines 19-37 only include ~10 specific files. This gives false confidence.

**Fix:** Expand the `include` list to cover at minimum:
- All files in `src/lib/security/` (rate-limit, cron-auth, csrf, safe-error, sanitize, etc.)
- All payment handlers (`src/app/api/_handlers/payments/**`)
- All cron handlers (`src/app/api/_handlers/cron/**`)
- The catch-all dispatchers (`src/lib/api-dispatch.ts`)
- Auth modules (`src/lib/auth/**`)

Keep the thresholds: 80% lines, 90% functions, 75% branches.

---

### SH-17: Payment Tracking Abuse Tests

**Create:** `tests/unit/payments/track-abuse.test.ts`

Write tests that prove:
1. POST with `event: "paid"` returns 400 (not 200)
2. POST with `event: "cancelled"` returns 400 (not 200)
3. POST with `event: "viewed"` returns 200 (still works)
4. POST with `event: "sent"` returns 200 (still works)
5. The `recordPaymentLinkEvent()` function in `payment-links.server.ts` throws if called with `event: "paid"` directly (defense-in-depth)

Mock Supabase client appropriately. Test the Zod validation boundary.

---

### SH-18: `select("*")` Cleanup (ALL ~143 Occurrences)

Search the entire `src/` directory for `.select("*")` and `.select('*')`.

**Total: ~143 occurrences across handlers, libs, and client components.**

For EACH occurrence:
1. Read the Supabase query to understand which table is being queried
2. Trace how the result is used — what fields are actually accessed
3. Replace `select("*")` with an explicit column list: `.select("id, name, email, created_at")`
4. If the query joins related tables, use Supabase's join syntax: `.select("id, name, organization:organizations(id, name)")`

#### Priority 1: PUBLIC endpoints (no auth — highest data exposure risk)

| File | Line(s) | Table | Recommended Columns |
|------|---------|-------|---------------------|
| `proposals/public/[token]/route.ts` | 379 | `proposal_days` | `id, proposal_id, day_number, title, description, is_approved` |
| `proposals/public/[token]/route.ts` | 400 | `proposal_activities` | `id, proposal_day_id, time, title, description, location, image_url, price, is_optional, is_premium, is_selected, display_order` |
| `proposals/public/[token]/route.ts` | 425 | `proposal_accommodations` | `id, proposal_day_id, hotel_name, star_rating, room_type, price_per_night, amenities, image_url` |
| `proposals/public/[token]/route.ts` | 458 | `proposal_add_ons` | `id, proposal_id, add_on_id, name, description, category, image_url, unit_price, quantity, is_selected` |
| `share/[token]/route.ts` | 123 | (check table) | Trace actual usage |
| `bookings/[id]/invoice/route.ts` | 45, 54 | `invoices` | `id, invoice_number, currency, status, created_at, issued_at, due_date, subtotal_amount, tax_amount, total_amount, paid_amount, balance_amount, cgst, sgst, igst, place_of_supply, sac_code, metadata` |

#### Priority 2: ADMIN endpoints

| File | Line(s) | Table | Notes |
|------|---------|-------|-------|
| `invoices/[id]/route.ts` | 42, 71, 197 | `invoices`, `invoice_payments` | Trace admin usage |
| `invoices/[id]/pay/route.ts` | 26, 71, 111, 121 | `invoices`, `invoice_payments`, `payment_links` | Trace payment processing needs |
| `invoices/route.ts` | 101, 113, 183 | `invoices` | Line 113 is count-only → use `.select('id', { count: 'exact', head: true })` |
| `admin/clients/route.ts` | 451, 456 | (check table) | Trace usage |
| All other admin handlers | Various | Various | Trace each |

#### Priority 3: LIB/UTILITY files

| File | Line(s) | Table | Recommended |
|------|---------|-------|-------------|
| `lib/payments/subscription-service.ts` | 149 | `subscriptions` | `id, razorpay_subscription_id, organization_id, status, cancel_at_period_end, cancelled_at, updated_at` |
| `lib/payments/subscription-service.ts` | 256 | `subscriptions` | `id, status, organization_id, plan_id, created_at, razorpay_subscription_id` |
| `lib/admin/operator-scorecard.ts` | 383 | `shared_itinerary_cache_events` | `event_type, cache_source, created_at` (only 3 of ~15 columns used) |
| `lib/admin/operator-scorecard.ts` | 562 | `whatsapp_webhook_events` | `wa_id, received_at, metadata` (only 3 fields used) |

#### Priority 4: CLIENT-SIDE components (move queries to API if possible, or narrow columns)

These are `"use client"` components making direct Supabase queries:
- `app/social/_components/MediaLibrary.tsx:37`
- `app/proposals/[id]/page.tsx:339`
- `app/drivers/page.tsx:166`
- `app/drivers/[id]/page.tsx:35`
- `app/clients/[id]/page.tsx:223,248`
- `app/admin/settings/page.tsx:294`
- `app/admin/tour-templates/page.tsx` and related
- `components/layout/Sidebar.tsx:260`
- `components/client/ProposalAddOnsSelector.tsx:64`
- `components/admin/ProposalAddOnsManager.tsx:81,105`
- `features/calendar/useCalendarEvents.ts:356,462`

For client-side queries: at minimum replace with explicit column lists. Ideally, move to API routes for caching and rate limiting, but explicit columns is the minimum fix for this sprint.

**Do NOT change auto-generated types (`database.types.ts`) or test mocks — only the `.select()` calls in source code.**

---

### SH-19: Split Oversized Files

These files exceed 800 lines and should be split into focused modules:

| File | Lines | Split Strategy |
|------|-------|----------------|
| `src/components/ui/map.tsx` | 1530 | Extract map controls, markers, layers into separate files |
| `src/app/proposals/create/page.tsx` | 1436 | Extract form sections, validation, preview into hooks/components |
| `src/components/whatsapp/UnifiedInbox.tsx` | 1165 | Extract message list, compose, filters into separate components |
| `src/app/admin/settings/page.tsx` | 1089 | Extract settings sections into tab components |
| `src/app/api/_handlers/admin/cost/overview/route.ts` | 1072 | Extract query builders, formatters into `cost-utils.ts` |
| `src/components/trips/GroupManager.tsx` | 1044 | Extract group operations, member management |
| `src/app/p/[token]/page.tsx` | 1033 | Extract sections into sub-components |
| `src/app/api/_handlers/proposals/public/[token]/route.ts` | 1007 | Extract shared utilities, validators |
| `src/components/assistant/TourAssistantChat.tsx` | 989 | Extract message components, input, suggestions |
| `src/app/clients/[id]/page.tsx` | 971 | Extract client sections into tab components |
| `src/app/admin/insights/page.tsx` | 944 | Extract chart components, filters |
| `src/app/admin/notifications/page.tsx` | 938 | Extract notification templates, delivery log |

**Rules for splitting:**
- Each new file must have a clear single responsibility
- Each new file should be under 400 lines (target), max 800
- Maintain the same export interface — don't break imports
- Use barrel exports (`index.ts`) if creating a folder
- Run `npm run typecheck` after each split to verify no breakage

---

### SH-20: Rate Limits on Missing Dispatchers

Three catch-all route families have no `rateLimit` configuration in their `createCatchAllHandlers()` call:

| File | Family |
|------|--------|
| `src/app/api/assistant/[...path]/route.ts` | AI assistant endpoints |
| `src/app/api/reputation/[...path]/route.ts` | Reputation/review endpoints |
| `src/app/api/social/[...path]/route.ts` | Social media OAuth/posting |

**Fix:** Add `rateLimit` config to each, matching the pattern in `admin/[...path]/route.ts`:
```typescript
createCatchAllHandlers([...], {
  rateLimit: {
    limit: 200,      // adjust per family
    windowMs: 5 * 60 * 1000,
    prefix: "api:assistant",  // unique prefix per family
  },
});
```

Use appropriate limits:
- `assistant`: 100 req/5min (AI calls are expensive)
- `reputation`: 200 req/5min
- `social`: 150 req/5min (OAuth callbacks need headroom)

---

### SH-21: Documentation Drift

**File:** Root `CLAUDE.md` at `projects/travel-suite/apps/web/` level (the one that says "Antigravity — GoBuddy Travel Suite")

Update these inaccuracies:
1. Tech stack says "Next.js 15" → change to "Next.js 16"
2. Key files table says `src/middleware.ts` → change to `src/proxy.ts`
3. Architecture section says 2 catch-all families → update to 6: public, admin, assistant, reputation, social, superadmin
4. Add the 3 new catch-all route files to the Key Files table

---

## COMMIT SEQUENCE

Make commits in this order (group related items):

```
1. fix: block payment state forgery in public tracking endpoint (SH-1)
2. fix: add CSRF guards to 6 admin mutation routes (SH-2 through SH-7)
3. fix: migrate 6 cron endpoints to hardened authorizeCronRequest (SH-8, SH-8b, SH-8c, SH-8d, SH-9, SH-10, SH-11)
4. fix: sanitize error messages in public share endpoint (SH-12)
5. fix: remove query string secret fallback from WAHA webhook (SH-13)
6. fix: extract GST label to configuration constant (SH-14)
7. test: fix stale date fixture and expand coverage whitelist (SH-15, SH-16)
8. test: add payment tracking abuse rejection tests (SH-17)
9. refactor: replace all select("*") with explicit column lists (SH-18)
10. refactor: split 12 oversized files into focused modules (SH-19)
11. fix: add rate limits to assistant/reputation/social dispatchers (SH-20)
12. docs: fix documentation drift in CLAUDE.md (SH-21)
13. chore: mark all SH items complete in tracker
```

---

## VERIFICATION CHECKLIST

After ALL fixes are committed, run these checks. ALL must pass:

```bash
cd projects/travel-suite/apps/web

# 1. Lint — zero warnings
npm run lint

# 2. Type check — clean
npm run typecheck

# 3. Tests — coverage meets thresholds
npm run test:coverage

# 4. Build — no errors
npm run build
```

If any check fails, fix the issue before proceeding. Do not skip or weaken thresholds.

---

## FINAL STEP

Once all items in the tracker are marked ✅ and all verification checks pass:
1. Update `SECURITY_HARDENING_TRACKER.md` — mark all items complete with commit hashes
2. Push the branch: `git push -u origin fix/security-hardening-s23`
3. Do NOT merge to main — the branch will be reviewed manually before merge
