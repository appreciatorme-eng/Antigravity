# Travel Suite Web Audit Report (2026-03-13)

Audit target: current `origin/main` at commit `6504b809a76108de8ca3b713efd854cabf324c64`
Scope: `projects/travel-suite/apps/web/src/`
Method: full-tree static inventories across every `src/` file, followed by manual validation of security-sensitive and scan-hit files on current HEAD.

## Executive Summary
- Total findings by severity: **1 CRITICAL**, **7 HIGH**, **4 MEDIUM**, **2 LOW**, **3 INFO**
- Baseline validation:
  - `npm run lint`: passed
  - `npm run typecheck`: passed
  - `npx madge --circular --extensions ts,tsx src`: no circular dependencies detected
- Top 5 most critical issues:
  1. `GET /api/whatsapp/qr` trusts caller-supplied `sessionName` and performs a service-role lookup filtered only by `session_name`, enabling cross-tenant QR retrieval.
  2. `POST /api/whatsapp/disconnect` still lacks `requireAdmin(...)`, so any authenticated org member can terminate the shared WhatsApp session and clear the stored token.
  3. `POST /api/whatsapp/test-message` still lacks `requireAdmin(...)`, so any authenticated org member can trigger a real outbound WhatsApp send from the org number.
  4. `GET /api/whatsapp/conversations` exposes full org conversation history and linked profile metadata to any org member via service-role reads.
  5. Four core admin/client surfaces still exceed the >800-line / >80-line structural thresholds, making remediation and regression review materially harder.
- Overall risk score: **81 / 100**

## Findings Table
| ID | Sev | Category | File:Line | Finding | Suggested Fix |
|----|-----|----------|-----------|---------|---------------|
| F-01 | CRITICAL | Authorization | `src/app/api/_handlers/whatsapp/qr/route.ts:30` | `GET /api/whatsapp/qr` uses `createAdminClient()` to fetch by caller-controlled `sessionName` only, with no org check. Any authenticated user who can guess another org's derived session name can retrieve that org's pairing QR. | Require admin auth, derive `sessionName` server-side from `organizationId`, and query `whatsapp_connections` by `organization_id` instead of trusting a query param. |
| F-02 | HIGH | Authorization | `src/app/api/_handlers/whatsapp/disconnect/route.ts:25` | Org-wide WhatsApp disconnect is still membership-only. Any org member can reset the shared session and null the stored bearer token. | Change the handler to `POST(request: Request)`, gate it with `requireAdmin(request, { requireOrganization: true })`, and check the Supabase update result before returning success. |
| F-03 | HIGH | Authorization | `src/app/api/_handlers/whatsapp/test-message/route.ts:22` | The test-message endpoint is still membership-only and sends a real outbound WhatsApp message after a service-role lookup. | Mirror the `whatsapp/connect` auth pattern: require admin, use the returned `adminClient`, and audit-log the sender. |
| F-04 | HIGH | Authorization | `src/app/api/_handlers/whatsapp/conversations/route.ts:57` | The unified inbox route reads org-wide webhook events and linked profile data with a service-role client after only checking org membership. | Require admin for the route or move it to an RLS-scoped read path that returns only fields explicitly allowed to non-admin roles. |
| F-05 | HIGH | Architecture | `src/app/admin/cost/page.tsx:116` | `AdminCostOverviewPage` is a 772-line function inside an 888-line file. It exceeds the reviewability threshold and concentrates data loading, UI state, and mutation flows in one unit. | Split the page into a thin shell plus extracted hooks/panels (overview data hook, alerts panel, charts, mutation actions) and keep the page component under ~200 lines. |
| F-06 | HIGH | Architecture | `src/app/settings/page.tsx:26` | `SettingsPage` is a 789-line function inside an 815-line file. Settings domains, modal orchestration, and mutation logic are all fused together. | Break the page into domain sections (profile, billing, WhatsApp, team, integrations) with isolated hooks and action handlers. |
| F-07 | HIGH | Architecture | `src/features/admin/billing/BillingView.tsx:46` | `BillingView` is a 773-line function inside an 819-line file. Billing state transitions, API calls, and presentation logic are tightly coupled. | Extract billing data/hooks and section components so subscription state, plan cards, and mutations are independently testable. |
| F-08 | HIGH | Architecture | `src/app/social/_components/TemplateGallery.tsx:103` | `TemplateGallery` is a 756-line component inside an 864-line file. Gallery state, filters, uploads, previews, and modal logic all live in one render path. | Split gallery querying/filter state from card rendering and modal workflows; keep the top-level component as orchestration only. |
| F-09 | MEDIUM | Authorization | `src/app/api/_handlers/whatsapp/status/route.ts:21` | Any org member can inspect shared WhatsApp status, phone number, and display name because the route checks membership but not admin role. | Use `requireAdmin(request, { requireOrganization: true })` or return only a coarse boolean state to non-admins. |
| F-10 | MEDIUM | Authorization | `src/app/api/_handlers/whatsapp/health/route.ts:18` | The health endpoint exposes org session health and `session_name` after only a membership check, using a service-role client for the lookup. | Require admin and reuse the returned `adminClient`; keep detailed health data off member-level endpoints. |
| F-11 | MEDIUM | Authorization | `src/app/api/_handlers/dashboard/tasks/dismiss/route.ts:39` | The dismiss mutation loads `role` but never enforces it, so admin-only dashboard task state is not actually admin-only. | Replace the custom auth block with `requireAdmin(request, { requireOrganization: true })` so the dismiss mutation matches `GET /api/dashboard/tasks`. |
| F-12 | MEDIUM | Least Privilege | `src/app/api/_handlers/reputation/dashboard/route.ts:17` | The reputation dashboard loader reads `reputation_reviews` with `createAdminClient()` on an authenticated request path, bypassing RLS even though the route already has a request-scoped client and org context. | Fetch review rows with the request-scoped Supabase client, then cache only the pure aggregation step or an org-validated RPC result. |
| F-13 | LOW | Accessibility | `src/components/god-mode/ConfirmDangerModal.tsx:41` | The backdrop is a clickable `div` with no keyboard semantics. This creates an interaction that is not reachable or described to keyboard and assistive-tech users. | Render the backdrop as a real button with an accessible label, or keep click-away logic on the dialog container and validate with axe. |
| F-14 | LOW | Type Safety | `src/components/map/ItineraryMap.tsx:21` | The map component still relies on `@ts-expect-error` plus multiple non-null assertions in route optimization/indexing code. | Add a local Leaflet type augmentation for `_getIconUrl` and replace array-index non-null assertions with guards/helpers. |
| F-15 | INFO | Type Safety | `src/lib/api-dispatch.ts:13` | The catch-all dispatcher still types handler modules as `Record<string, any>`, which weakens route method contracts. | Replace `any` with a typed method map, for example `Partial<Record<"GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "OPTIONS", HandlerFn>>`. |
| F-16 | INFO | Code Quality | `src/lib/payments/payment-receipt-config.ts:1` | Payment receipt GST labeling is still guarded by a runtime TODO and a hardcoded default. | Move the label into typed billing/organization settings before multi-rate GST support is introduced. |
| F-17 | INFO | Type Safety | `src/app/api/_handlers/integrations/places/route.ts:24` | The Places integration helper still accepts `supabaseAdmin: any`; it is one of nine remaining explicit-`any` occurrences. | Extend `Database`/helper types for the reputation tables and replace `any` with a narrow client interface. |

## Detailed Findings

### F-01 — `src/app/api/_handlers/whatsapp/qr/route.ts:30`
- **Root cause**: the route authenticates the caller but does not authorize the requested session. It accepts `sessionName` from the query string, then performs a service-role lookup filtered only by `session_name`.
- **Exploit scenario**: session names are deterministic (for example `org_<derived-org-fragment>`). Any authenticated user who can guess or observe another org's session name can fetch that org's live QR code and race the operator to pair the WhatsApp account.
- **Fix**: remove the caller-controlled `sessionName` trust boundary. Use `requireAdmin(request, { requireOrganization: true })`, derive the expected session name from `organizationId`, query `whatsapp_connections` by `organization_id`, and ignore or reject mismatched query parameters.
- **Test**: add an integration test where user A requests org B's derived session name and assert a 403/404; add a happy-path admin test for the caller's own org.

### F-02 — `src/app/api/_handlers/whatsapp/disconnect/route.ts:25`
- **Root cause**: the route performs an org-wide destructive mutation after only checking that the caller belongs to the org.
- **Exploit scenario**: any staff member with a normal authenticated session can disconnect the shared WhatsApp account, clear the token, and interrupt inbound/outbound messaging for the entire organization.
- **Fix**: change the signature to `POST(request: Request)`, call `requireAdmin(request, { requireOrganization: true })`, reuse `auth.adminClient`, and fail closed if either the WAHA disconnect or the Supabase update returns an error.
- **Test**: assert that a non-admin org member gets 403, an admin gets 200, and the row update must succeed before the route reports success.

### F-03 — `src/app/api/_handlers/whatsapp/test-message/route.ts:22`
- **Root cause**: the route sends a real outbound message from the org's WhatsApp session after only a membership check.
- **Exploit scenario**: any authenticated org member can trigger outbound messages from the business number, creating audit/compliance problems and confusing operators who assume messaging controls are admin-only.
- **Fix**: gate the route with `requireAdmin(request, { requireOrganization: true })`, use the returned `adminClient`, and add structured logging of the triggering admin/user ID.
- **Test**: verify 403 for non-admins, 200 for admins, and assert the send function is not called when auth fails.

### F-04 — `src/app/api/_handlers/whatsapp/conversations/route.ts:57`
- **Root cause**: the route reads `whatsapp_webhook_events` and `profiles` with a service-role client after only checking org membership.
- **Exploit scenario**: any org member can load the entire shared WhatsApp inbox, including message previews, linked contact identities, and chatbot session state, even if the UI role model intends messaging to stay with operators/admins.
- **Fix**: apply `requireAdmin(request, { requireOrganization: true })` for the current admin-only inbox model, or redesign the route around RLS-scoped reads with an explicit allowlist of fields for non-admin roles.
- **Test**: add role-based integration tests for admin vs member access and snapshot-test that only approved fields are returned for any downgraded role path.

### F-05 — `src/app/admin/cost/page.tsx:116`
- **Root cause**: one component owns the entire admin cost overview, including fetch orchestration, derived state, filters, charts, and mutation flows.
- **Failure mode**: unrelated edits have a wide regression surface, unit testing stays coarse, and defect isolation gets slower because every change passes through one large render function.
- **Fix**: extract a data hook (for example `useAdminCostOverview`) plus focused presentation units such as metrics cards, alerts, charts, and action controls; keep the page shell focused on composition.
- **Test**: add hook tests for fetch/state transitions and component tests for the extracted panels so regressions can be isolated without rendering the whole page.

### F-06 — `src/app/settings/page.tsx:26`
- **Root cause**: settings domains, modal state, mutation handlers, and section rendering all sit in a single page-level function.
- **Failure mode**: role-specific settings regressions and stale-state bugs become harder to isolate, and incremental fixes keep increasing page complexity.
- **Fix**: split into domain sections (profile, team, billing, WhatsApp, integrations), each with its own hook/controller, and leave the page component as a composition layer.
- **Test**: add focused tests per section and one smoke test for the composed page.

### F-07 — `src/features/admin/billing/BillingView.tsx:46`
- **Root cause**: subscription loading, plan switching, receipts, and mutation UI are tightly coupled in one oversized component.
- **Failure mode**: billing changes are harder to review safely, and small plan-flow edits risk breaking unrelated presentation branches.
- **Fix**: extract billing data hooks, plan-card components, invoice/payment-history panels, and mutation handlers into smaller units with explicit props/contracts.
- **Test**: add Vitest coverage for billing state transitions and component tests for each extracted section.

### F-08 — `src/app/social/_components/TemplateGallery.tsx:103`
- **Root cause**: filtering, uploads, preview state, dialog handling, and gallery rendering are combined in one component.
- **Failure mode**: state management becomes brittle, re-render debugging is costly, and future social-template features will continue to accumulate in the same hotspot.
- **Fix**: separate query/filter state, grid rendering, and modal/upload workflows into distinct components/hooks; keep the top-level gallery as orchestration only.
- **Test**: add targeted tests for filter state, modal transitions, and upload flows without mounting the entire gallery tree.

## Patterns (Cross-Cutting Issues Found in 3+ Files)
- **WhatsApp route auth drift**: `whatsapp/connect`, `whatsapp/send`, and `whatsapp/broadcast` use `requireAdmin(...)`, but the read/control routes (`qr`, `disconnect`, `test-message`, `conversations`, `status`, `health`) drifted back to membership-only auth.
- **Service-role reads on authenticated paths**: multiple handlers still reach for `createAdminClient()` on request paths where a scoped user client or org-validated RPC would preserve least privilege.
- **Oversized UI surfaces**: the structural inventory found **48 files >600 lines**, **613 functions >80 lines**, and **98 blocks nested deeper than 4**, concentrated in admin dashboards, settings, inbox, and template tooling.
- **Type-safety debt in integration glue**: the current tree still contains **9 explicit `any` occurrences**, **1 TS suppression**, and **159 non-null assertions**. Most are concentrated in integration, chart, and complex UI utility code.

## Positive Findings
- The prior high-risk dispatcher issue is fixed on current HEAD: `src/lib/api-dispatch.ts` now rate-limits by client IP only and no longer trusts unverified JWT payloads for rate-limit identity.
- The catch-all dispatcher enforces a generic rate limit and applies the mutation CSRF guard to non-exempt POST/PUT/PATCH/DELETE routes.
- The earlier cross-tenant payment-link issue is fixed: `src/app/api/_handlers/payments/links/route.ts` now scopes both proposal and client lookups by `organization_id`.
- `whatsapp/connect`, `whatsapp/send`, `whatsapp/broadcast`, `subscriptions`, and `subscriptions/cancel` are now aligned on `requireAdmin(...)`.
- Static dependency checks found **0 CommonJS `require()` calls**, **0 user-controlled dynamic imports**, and **0 imports from packages missing in `package.json`**.
- Client-side env usage is constrained to `NEXT_PUBLIC_*` keys and `NODE_ENV`; the scan found **0 non-public env references in `"use client"` files**.
- `madge` found **no circular dependencies** in the current `src/` tree.
