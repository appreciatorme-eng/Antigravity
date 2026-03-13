# Audit Remediation — Codex Prompt

> Paste this entire file as a single prompt to Codex. It contains all context needed to fix 10 security, error-handling, type-safety, and accessibility findings from audit report `AUDIT_REPORT_2026-03-13_b7920d8.md`.

---

## Project Context

- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL, RLS enabled)
- **Working directory**: `projects/travel-suite/apps/web/`
- **API pattern**: All API routes use catch-all dispatchers via `createCatchAllHandlers()` from `src/lib/api-dispatch.ts`. Individual route handlers live in `src/app/api/_handlers/` and are registered in the catch-all. Direct `route.ts` files outside `_handlers/` are legacy and should be migrated.

---

## Codebase Patterns (MUST follow these exactly)

### Auth Pattern — `requireAdmin`

Location: `src/lib/auth/admin.ts` (line 162)

```typescript
import { requireAdmin } from "@/lib/auth/admin";

// In a handler:
const admin = await requireAdmin(request, { requireOrganization: true });
// Returns: { userId, organizationId, adminClient (service-role Supabase client) }
// Throws/returns error response if auth fails

// For admin-only org-scoped routes:
const admin = await requireAdmin(request, { requireOrganization: true });

// For admin routes without org requirement:
const admin = await requireAdmin(request, { requireOrganization: false });
```

### Rate Limiting Pattern — `enforceRateLimit`

Location: `src/lib/security/rate-limit.ts` (line 118)

```typescript
import { enforceRateLimit } from "@/lib/security/rate-limit";

const rateLimit = await enforceRateLimit({
  identifier: admin.userId,       // or IP for unauthenticated
  limit: 30,                      // max requests
  windowMs: 60_000,               // window in ms
  prefix: "api:endpoint-name",    // unique prefix per endpoint
});
if (rateLimit.limited) {
  return apiError("Rate limit exceeded", 429);
}
```

### CSRF Guard Pattern

Location: `src/lib/security/admin-mutation-csrf.ts`

```typescript
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";

// For mutating endpoints (POST/PUT/PATCH/DELETE) on direct routes:
if (!passesMutationCsrfGuard(request)) {
  return apiError("CSRF validation failed for admin mutation", 403);
}
```

Note: Catch-all dispatchers handle CSRF automatically. Only add this to direct routes.

### API Response Pattern

Location: `src/lib/api/response.ts`

```typescript
import { apiSuccess, apiError } from "@/lib/api/response";

return apiSuccess({ data: result });      // 200 with envelope
return apiError("Message here", 400);     // error with status
```

### Supabase Admin Client

```typescript
// CORRECT — use admin's pre-authenticated client:
const { data, error } = await admin.adminClient
  .from("table")
  .update({ field: value })
  .eq("id", id);

// WRONG — do NOT create a new admin client:
// const adminClient = createAdminClient();  ← avoid this
```

---

## Findings to Fix (10 of 14 — architecture items F-04 through F-07 excluded)

### F-01 — HIGH — Shadowed Direct Route (proposal-drafts)

**File to DELETE**: `src/app/api/whatsapp/proposal-drafts/[id]/route.ts`

**File to MODIFY**: `src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts`

**Root cause**: Two implementations exist for `/api/whatsapp/proposal-drafts/[id]`. Next.js resolves the direct route file, bypassing the catch-all dispatcher and its auth/rate-limit/CSRF protections.

**Fix steps**:

1. **Delete** `src/app/api/whatsapp/proposal-drafts/[id]/route.ts` entirely.

2. **Update** the catch-all handler at `src/app/api/_handlers/whatsapp/proposal-drafts/[id]/route.ts`:
   - It currently only has a GET handler. Add a POST handler for the `refreshWhatsAppProposalDraft` functionality that was in the deleted direct route.
   - The GET handler must NOT perform state mutation. Currently the deleted route called `getWhatsAppProposalDraftForOrg({ markOpened: true })` on GET — this violates HTTP semantics. The catch-all GET must be read-only: `getWhatsAppProposalDraftForOrg({ markOpened: false })`.
   - Add a new POST handler that accepts `{ markOpened: true }` in the body and calls `getWhatsAppProposalDraftForOrg({ markOpened: true })`.
   - Add another POST action (or separate PATCH) for `refreshWhatsAppProposalDraft` — import from `src/lib/whatsapp/proposal-drafts.ts`.
   - Both POST actions must use `requireAdmin(request)`.

3. **Register** the handler in the catch-all route array if not already registered. Check `src/app/api/[...path]/route.ts` for the route registration.

**This also fixes F-08** (GET mutating state).

---

### F-02 — HIGH — Org-Member Mutation of Google Places Config

**File**: `src/app/api/_handlers/integrations/places/route.ts`

**Root cause**: Route authenticates with `createClient()` (user client) + manual `getOrganizationId()` lookup, then uses `createAdminClient()` for writes. Any org member can mutate org-wide Google Places settings.

**Fix steps**:

1. Replace the old auth pattern in both GET and POST handlers:

```typescript
// REMOVE these lines:
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return apiError("Unauthorized", 401);
const organizationId = await getOrganizationId(user.id);

// REPLACE with:
const admin = await requireAdmin(request, { requireOrganization: true });
const organizationId = admin.organizationId;
```

2. Replace all `createAdminClient()` calls with `admin.adminClient`.

3. Remove unused imports: `createClient`, `getOrganizationId`, `createAdminClient`.

4. Add import: `import { requireAdmin } from "@/lib/auth/admin";`

---

### F-03 — HIGH — Org-Member Mutation of TripAdvisor Config

**File**: `src/app/api/_handlers/integrations/tripadvisor/route.ts`

**Root cause**: Same pattern as F-02. Uses `createClient()` for auth, allows any org member to overwrite TripAdvisor location binding.

**Fix steps**: Identical to F-02:

1. Replace old auth with `requireAdmin(request, { requireOrganization: true })`.
2. Replace `createAdminClient()` with `admin.adminClient`.
3. Use `admin.organizationId` instead of manual profile lookup.
4. Clean up unused imports.

---

### F-08 — MEDIUM — GET Mutates State (proposal-drafts)

**Resolved by F-01 fix above.** The GET handler in the catch-all must call `getWhatsAppProposalDraftForOrg({ markOpened: false })`. The `markOpened: true` mutation moves to a POST handler.

---

### F-09 — MEDIUM — Direct Routes Without Rate Limiting

**Files**:
- `src/app/api/availability/route.ts`
- `src/app/api/whatsapp/chatbot-sessions/[id]/route.ts`

**Root cause**: These direct routes bypass the catch-all dispatcher and define no `enforceRateLimit()`.

**Fix steps** (for each file):

1. Add rate limiting to every exported handler (GET, POST, PATCH, DELETE):

```typescript
import { enforceRateLimit } from "@/lib/security/rate-limit";

// At the top of each handler, after auth:
const rateLimit = await enforceRateLimit({
  identifier: admin.userId,
  limit: 30,
  windowMs: 60_000,
  prefix: "api:availability:get",  // unique per method+route
});
if (rateLimit.limited) {
  return apiError("Rate limit exceeded", 429);
}
```

2. Use distinct `prefix` values for each HTTP method in each route:
   - `api:availability:get`, `api:availability:post`, `api:availability:delete`
   - `api:whatsapp:chatbot-sessions:get`, `api:whatsapp:chatbot-sessions:patch`

---

### F-10 — MEDIUM — Unchecked Supabase Update in Payment Verification

**File**: `src/app/api/_handlers/payments/verify/route.ts`

**Root cause**: Around line 63, the handler updates a proposal's status to `"converted"` but never checks the Supabase `error` return.

**Fix steps**:

Find this pattern:
```typescript
if (updatedLink.proposalId) {
  await admin
    .from("proposals")
    .update({ status: "converted" })
    .eq("id", updatedLink.proposalId);
}
```

Replace with:
```typescript
if (updatedLink.proposalId) {
  const { error: proposalUpdateError } = await admin
    .from("proposals")
    .update({ status: "converted" })
    .eq("id", updatedLink.proposalId);

  if (proposalUpdateError) {
    console.error(
      "[payments/verify] Failed to update proposal status",
      { proposalId: updatedLink.proposalId, error: proposalUpdateError.message }
    );
    // Log but don't fail the payment verification — the payment itself succeeded.
    // The proposal status can be reconciled later.
  }
}
```

---

### F-11 — LOW — Backdrop Accessibility in ConfirmDangerModal

**File**: `src/components/god-mode/ConfirmDangerModal.tsx`

**Root cause**: Modal backdrop is a clickable `div` with `aria-hidden="true"` and no keyboard semantics.

**Fix steps**:

Find:
```tsx
<div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
```

Replace with:
```tsx
<button
  type="button"
  className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm cursor-default"
  onClick={onCancel}
  aria-label="Close dialog"
  tabIndex={-1}
/>
```

Using a `<button>` gives keyboard semantics for free. `tabIndex={-1}` keeps it out of normal tab order (the dialog's own close button handles keyboard dismiss). Remove `aria-hidden` since it's now a proper interactive element.

---

### F-12 — INFO — Type Safety in API Dispatcher

**File**: `src/lib/api-dispatch.ts`

**Root cause**: `type HandlerModule = Record<string, any>` weakens type checking across all dispatched handlers.

**Fix steps**:

Find:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandlerModule = Record<string, any>;
```

Replace with:
```typescript
type HandlerFn = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;
type HandlerModule = Partial<Record<string, HandlerFn>>;
```

Then verify that all handler registrations still type-check. If some handlers have slightly different signatures, use a union type or make `ctx` optional.

---

### F-13 — INFO — Type Safety in Payment Logger

**File**: `src/lib/payments/payment-logger.ts`

**Root cause**: `metadata: any` loses type safety on payment event audit data.

**Fix steps**:

Find:
```typescript
metadata: any; // eslint-disable-line @typescript-eslint/no-explicit-any
```

Replace with:
```typescript
metadata: Record<string, unknown>;
```

Then fix any downstream callers that pass typed objects — they should work since `Record<string, unknown>` accepts any object shape. If specific callers fail, use `as Record<string, unknown>` at the call site.

---

### F-14 — INFO — Hardcoded GST Label

**File**: `src/lib/payments/payment-receipt-config.ts`

**Root cause**: GST label is hardcoded as `"5% GST (HSN 998551)"` with a TODO to move it to organization settings.

**Fix steps**:

This is a documentation/tracking issue, not a code fix. Add a clear comment:

```typescript
/**
 * Default GST label used on payment receipts.
 * TODO(billing): Move to organization_settings table to support
 * multi-rate GST when billing-v2 ships. Track in AUDIT_REMEDIATION_TRACKER.md.
 */
export const DEFAULT_PAYMENT_RECEIPT_GST_LABEL = "5% GST (HSN 998551)";
```

---

## Findings EXCLUDED from This Prompt

The following 4 findings are large architectural refactors (splitting 700-900 line files into sub-components). They are better handled by parallel extraction agents, not a single Codex run:

| Finding | File | Lines | Reason excluded |
|---------|------|-------|-----------------|
| F-04 | `src/app/api/_handlers/admin/cost/overview/route.ts` | 760 | Backend handler — needs domain-specific decomposition |
| F-05 | `src/features/admin/billing/BillingView.tsx` | 773 | Large React component — needs hook+component extraction |
| F-06 | `src/app/clients/page.tsx` | 703 | Large React page — needs filter/modal/table extraction |
| F-07 | `src/components/whatsapp/UnifiedInbox.tsx` | 741 | Large React component — needs pane/controller extraction |

---

## Verification Commands

After all changes, run these from `projects/travel-suite/apps/web/`:

```bash
# 1. TypeScript must compile with zero errors
npm run typecheck

# 2. ESLint must pass with zero warnings
npm run lint

# 3. All tests must pass
npm run test

# 4. Verify the shadowed route is actually deleted
ls src/app/api/whatsapp/proposal-drafts/
# Expected: directory should NOT exist (or be empty)

# 5. Verify no remaining `createClient()` in integration handlers
grep -r "createClient()" src/app/api/_handlers/integrations/
# Expected: no matches

# 6. Verify rate limiting added to direct routes
grep -n "enforceRateLimit" src/app/api/availability/route.ts src/app/api/whatsapp/chatbot-sessions/[id]/route.ts
# Expected: matches in both files
```

---

## Constraints

1. **No new dependencies** — use only existing packages
2. **Immutable patterns** — never mutate objects, always create new copies
3. **Preserve existing tests** — do not modify test files unless fixing imports broken by file deletion
4. **Conventional commits** — use format: `fix: <description>` for security fixes, `refactor:` for type safety improvements
5. **Do not touch** files outside the scope listed above
6. **Do not create** documentation files (no README, no .md files)
7. **Git add specific files only** — never `git add .` or `git add -A`
