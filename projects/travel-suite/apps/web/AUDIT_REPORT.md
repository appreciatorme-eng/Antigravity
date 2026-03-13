# Travel Suite Web Audit

Scope audited: `projects/travel-suite/apps/web/src/`

Method: whole-tree static audit across all `src/` files (1,022 files, ~213,869 LOC) using AST/regex scans plus manual review of all auth, routing, billing, payments, WhatsApp, dashboard, reputation, settings, and public-token handlers.

## Executive Summary
- Total findings: 26
- `CRITICAL`: 4
- `HIGH`: 13
- `MEDIUM`: 2
- `LOW`: 4
- `INFO`: 3
- Overall risk score: `88/100`

Top 5 most critical issues:
1. `src/lib/api-dispatch.ts` trusts an unverified bearer JWT payload to derive the global rate-limit key.
2. `src/app/api/_handlers/subscriptions/route.ts` lets any authenticated org member create or upgrade the organization subscription.
3. `src/app/api/_handlers/subscriptions/cancel/route.ts` lets any authenticated org member cancel the organization subscription.
4. `src/app/api/_handlers/whatsapp/broadcast/route.ts` lets any authenticated org member send org-wide WhatsApp broadcasts through the connected session.
5. `src/app/api/_handlers/payments/links/route.ts` uses a service-role client without an admin guard and resolves arbitrary `clientId` values outside the caller's org.

## Findings Table

| ID | Sev | Category | File:Line | Finding | Suggested Fix |
|---|---|---|---|---|---|
| F-001 | CRITICAL | Security / Rate limiting | `src/lib/api-dispatch.ts:23` | `extractRateLimitIdentifier()` decodes any bearer token locally and trusts `decoded.sub` before auth verification, so an attacker can forge a JWT payload to evade IP throttles or poison another user's rate-limit bucket. | Stop parsing JWTs in the dispatcher; use verified identity from `requireAdmin()` / Supabase auth, or fall back to IP-only identifiers before auth succeeds. |
| F-002 | CRITICAL | Security / Authorization | `src/app/api/_handlers/subscriptions/route.ts:139` | `POST /api/subscriptions` only checks that the caller has an `organization_id`; any org member can create a paid subscription for the org. | Gate the route with `requireAdmin(request)` and reject non-admin roles before any billing side effects. |
| F-003 | CRITICAL | Security / Authorization | `src/app/api/_handlers/subscriptions/cancel/route.ts:22` | `POST /api/subscriptions/cancel` allows any authenticated org member to cancel the org's active subscription. | Require admin auth and log the actor before calling `paymentService.cancelSubscription()`. |
| F-004 | CRITICAL | Security / Authorization | `src/app/api/_handlers/whatsapp/broadcast/route.ts:363` | `POST /api/whatsapp/broadcast` resolves org context from membership only, then sends bulk messages with the org's WhatsApp session token. Any org member can message all clients/drivers. | Require admin auth in `resolveBroadcastContext()` and scope access to admin/super-admin roles only. |
| F-005 | HIGH | Security / Information disclosure | `src/app/api/_handlers/whatsapp/broadcast/route.ts:329` | `GET /api/whatsapp/broadcast` exposes org-wide recipient counts, recent WhatsApp contacts, and connection state to any authenticated org member. | Reuse the same admin-only guard as the write path and return only admin-scoped metadata. |
| F-006 | HIGH | Security / Authorization | `src/app/api/_handlers/whatsapp/send/route.ts:14` | `POST /api/whatsapp/send` lets any org member send arbitrary outbound WhatsApp messages by pulling the org session token with a service-role client. | Require admin auth before loading `whatsapp_connections` or calling `sendWahaText()`. |
| F-007 | HIGH | Security / Authorization | `src/app/api/_handlers/whatsapp/connect/route.ts:19` | `POST /api/whatsapp/connect` lets any org member create or resume the org's WhatsApp session and store its bearer token. | Require admin auth and audit-log the actor that initiated session setup. |
| F-008 | HIGH | Security / Authorization | `src/app/api/_handlers/payments/create-order/route.ts:32` | `POST /api/payments/create-order` allows any org member to create Razorpay orders for invoices or subscriptions. | Gate the route with `requireAdmin(request, { requireOrganization: true })`. |
| F-009 | HIGH | Security / Authorization | `src/app/api/_handlers/payments/links/route.ts:25` | `POST /api/payments/links` uses `createAdminClient()` and only checks org membership, so any org member can mint payment links on behalf of the org. | Require admin auth and use the scoped org ID returned by the auth helper. |
| F-010 | HIGH | Security / Authorization | `src/app/api/_handlers/payments/links/route.ts:84` | When `clientId` is provided, the handler loads `profiles` by `id` only with the service-role client and no `organization_id` filter, enabling cross-tenant contact resolution. | Add `.eq("organization_id", profile.organization_id)` or load the client through an org-scoped table first. |
| F-011 | HIGH | Security / Information disclosure | `src/app/api/_handlers/billing/subscription/route.ts:15` | `GET /api/billing/subscription` returns org billing state, plan, subscription, usage, and support contact to any authenticated org member. | Require admin auth and avoid the service-role client for data that can be read via RLS. |
| F-012 | HIGH | Security / Authorization | `src/app/api/_handlers/settings/upi/route.ts:11` | `POST /api/settings/upi` lets any org member overwrite the org UPI receiving handle via a service-role upsert. | Require admin auth before reading the profile or upserting `organization_settings`. |
| F-013 | HIGH | Security / Information disclosure | `src/app/api/_handlers/settings/marketplace/route.ts:81` | `GET /api/settings/marketplace` exposes org marketplace profile data, rate cards, and compliance document URLs to any authenticated org member. | Require admin auth and limit service-role reads to admin-only routes. |
| F-014 | HIGH | Security / Authorization | `src/app/api/_handlers/dashboard/tasks/route.ts:305` | The handler fetches `role, organization_id` but never enforces `role`, then returns org-wide finance and operations tasks to any org member. | Replace the manual profile lookup with `requireAdmin()` or explicitly reject non-admin roles. |
| F-015 | HIGH | Security / Information disclosure | `src/app/api/_handlers/dashboard/schedule/route.ts:92` | The schedule endpoint returns org-wide trip, client, and driver schedule details to any authenticated org member because `role` is loaded and ignored. | Require admin auth before querying trips. |
| F-016 | HIGH | Security / Information disclosure | `src/app/api/_handlers/drivers/search/route.ts:37` | Driver search exposes the org's full driver directory and today's assignment counts to any org member; `role` is selected but unused. | Gate the endpoint with `requireAdmin()` and keep the org scoping from that helper. |
| F-017 | HIGH | Security / Information disclosure | `src/app/api/_handlers/nav/counts/route.ts:26` | `GET /api/nav/counts` uses a service-role cached query to return org-wide inbox, proposal, booking, and review counts to any authenticated org member. | Require admin auth or split non-admin-safe counts into a separate endpoint. |
| F-018 | MEDIUM | Correctness / Error handling | `src/app/api/_handlers/settings/upi/route.ts:42` | The `organization_settings.upsert()` result is awaited but its `error` is never checked, so the route can return success after a failed write. | Destructure `{ error }` from the upsert call and return `apiError(...)` when it is non-null. |
| F-019 | MEDIUM | Performance / Unbounded query | `src/app/api/_handlers/reputation/dashboard/route.ts:17` | The cached reputation dashboard loads all reviews for the org into memory and computes aggregates in-process, with no date window or row cap. | Push aggregation to SQL/RPC or add bounded date-range pagination before computing metrics. |
| F-020 | LOW | Security / Rate limiting | `src/app/api/_handlers/payments/track/[token]/route.ts:19` | Public payment-status tracking endpoints validate the token but do not apply the dedicated public token limiter used by `payments/links/[token]`, `portal/[token]`, and `proposals/public/[token]`. | Add `enforcePublicRouteRateLimit()` to both `GET` and `POST` using the token as the route identifier. |
| F-021 | LOW | Correctness / Input parsing | `src/components/leads/LeadToBookingFlow.tsx:460` | A corrupt `bookingDrafts` entry in `localStorage` will throw out of the draft-save flow because `JSON.parse()` is not guarded. | Wrap the parse in `try/catch` and fall back to `[]` on malformed storage. |
| F-022 | LOW | Accessibility | `src/components/god-mode/ConfirmDangerModal.tsx:33` | The modal backdrop is a clickable `<div>` with no keyboard handler or semantic role, so keyboard-only users cannot activate the same dismiss behavior. | Use a `<button aria-label="Close dialog">` backdrop or add `role="button"`, `tabIndex={0}`, and keyboard handling. |
| F-023 | LOW | Architecture / Coupling | `src/lib/social/poster-premium-blocks.ts` | `madge` reports two circular dependencies: `poster-premium-blocks.ts -> poster-premium-layouts-a.ts` and `poster-premium-blocks.ts -> poster-premium-layouts-b.ts`. | Extract shared primitives into a third module and remove layout imports from the blocks module. |
| F-024 | INFO | Type safety | `src/lib/api-dispatch.ts:13` | The dispatcher suppresses `no-explicit-any` and types handler modules as `Record<string, any>`, weakening route contract checks at the core dispatch layer. | Replace `any` with a narrow handler interface keyed by supported HTTP methods. |
| F-025 | INFO | Type safety | `src/components/map/ItineraryMap.tsx:21` | The file uses a `@ts-expect-error` to reach into Leaflet internals. This is localized and documented, but it should be kept under review during library upgrades. | Replace with a local type augmentation for `_getIconUrl` if the workaround remains necessary. |
| F-026 | INFO | Code hygiene | `src/lib/payments/payment-receipt-config.ts:1` | The only `TODO/FIXME/HACK` marker in `src/` is an open TODO for multi-rate GST receipt config. | Track the migration in a ticket and remove the comment once org-scoped GST config exists. |

## Detailed Findings

### F-001 `CRITICAL` `src/lib/api-dispatch.ts:23`
- Root cause: the dispatcher derives its rate-limit identity from a locally decoded bearer token payload instead of a verified auth principal.
- Exploit scenario: an attacker can send `Authorization: Bearer <fake-jwt-with-victim-sub>` and move requests out of the shared IP bucket, or deliberately exhaust another user's dispatch budget.
- Fix: delete the JWT parsing branch in `extractRateLimitIdentifier()` and use a verified identifier only after Supabase auth succeeds; otherwise use IP.
- Test: send repeated requests with forged JWT payloads carrying different `sub` values and verify all attempts are still bucketed together until auth is verified.

### F-002 `CRITICAL` `src/app/api/_handlers/subscriptions/route.ts:139`
- Root cause: the route checks authentication and org membership but never checks whether the caller has an admin role before creating a subscription.
- Exploit scenario: any staff member, driver, or client profile tied to the org can trigger a paid subscription creation or upgrade.
- Fix: replace the manual user/profile lookup with `const admin = await requireAdmin(request);` and use `admin.organizationId` for all downstream billing operations.
- Test: call the endpoint with an authenticated non-admin user and assert a `403`; call with an admin and assert normal subscription creation still works.

### F-003 `CRITICAL` `src/app/api/_handlers/subscriptions/cancel/route.ts:22`
- Root cause: cancellation is guarded only by `organization_id` presence, not by admin role or explicit billing privileges.
- Exploit scenario: any org member can terminate billing, causing immediate service disruption or forced downgrade.
- Fix: require admin auth before loading the current subscription and before calling `paymentService.cancelSubscription()`.
- Test: verify that non-admin roles receive `403` and that the audit trail records the cancelling admin user ID.

### F-004 `CRITICAL` `src/app/api/_handlers/whatsapp/broadcast/route.ts:363`
- Root cause: `resolveBroadcastContext()` uses membership-only org resolution and returns an admin client plus session token to any authenticated org member.
- Exploit scenario: a low-privilege user can broadcast spam or fraudulent messages to all clients, all drivers, or all active-trip contacts from the company's official WhatsApp number.
- Fix: perform `requireAdmin()` inside `resolveBroadcastContext()` and use the returned org ID instead of a raw profile lookup.
- Test: authenticate as a non-admin member and confirm both `GET` and `POST` return `403`; authenticate as admin and confirm send still succeeds.

### F-005 `HIGH` `src/app/api/_handlers/whatsapp/broadcast/route.ts:329`
- Root cause: the read-side broadcast endpoint reuses the same membership-only context and returns contacts plus connection state.
- Exploit scenario: a non-admin insider can enumerate recent WhatsApp contacts, infer customer activity, and inspect whether the org's session is connected.
- Fix: admin-gate the endpoint or split contact discovery into a more narrowly scoped admin-only API.
- Test: non-admin requests should fail with `403`; admin requests should still return counts and contacts.

### F-006 `HIGH` `src/app/api/_handlers/whatsapp/send/route.ts:14`
- Root cause: the route loads the org's connected session token with a service-role client after only checking that the caller belongs to the org.
- Exploit scenario: any org member can send arbitrary one-off messages that appear to come from the org's official WhatsApp session.
- Fix: require admin auth before loading `whatsapp_connections`; consider logging each outbound message with the actor role.
- Test: verify non-admin calls fail with `403` and that admin calls still insert the webhook event record.

### F-007 `HIGH` `src/app/api/_handlers/whatsapp/connect/route.ts:19`
- Root cause: session creation/resume is exposed to any authenticated org member.
- Exploit scenario: a low-privilege user can force QR re-pair flows or rotate the org's active WhatsApp bearer token.
- Fix: require admin auth and record the actor initiating session bootstrap.
- Test: confirm non-admin callers cannot create sessions and that existing admin flows still return the QR payload.

### F-008 `HIGH` `src/app/api/_handlers/payments/create-order/route.ts:32`
- Root cause: payment-order creation is treated as any authenticated org action instead of a privileged billing action.
- Exploit scenario: non-admin users can generate payment attempts tied to org invoices or subscriptions, creating finance noise and possible reconciliation issues.
- Fix: require admin auth and keep the org scoping on `invoices` and `subscriptions`.
- Test: non-admin requests should return `403`; admin requests should still create orders for in-org resources only.

### F-009 `HIGH` `src/app/api/_handlers/payments/links/route.ts:25`
- Root cause: the route switches to `createAdminClient()` immediately and never checks that the actor is an admin before minting external payment links.
- Exploit scenario: any org member can create charge links that appear to come from the organization.
- Fix: gate the route with `requireAdmin()` and only create the admin client after authorization passes.
- Test: verify non-admin users cannot create payment links; admin users can, with unchanged response shape.

### F-010 `HIGH` `src/app/api/_handlers/payments/links/route.ts:84`
- Root cause: the `clientId` enrichment query fetches `profiles` by primary key only, using the service-role client.
- Exploit scenario: if a caller knows another tenant's profile UUID, the API will hydrate name/email/phone from that foreign record into a new payment link payload.
- Fix: join through an org-scoped table or add `organization_id` filtering to the profile lookup.
- Test: create two orgs, use a client ID from org B while authenticated in org A, and assert the lookup is rejected.

### F-011 `HIGH` `src/app/api/_handlers/billing/subscription/route.ts:15`
- Root cause: billing read access is membership-scoped instead of admin-scoped, even though it returns org subscription and usage details and uses a service-role client.
- Failure mode: any org member can inspect plan, billing state, subscription status, and usage thresholds.
- Fix: require admin auth before resolving org and subscription data.
- Test: non-admin members should receive `403`; admins should continue to receive the same payload.

### F-012 `HIGH` `src/app/api/_handlers/settings/upi/route.ts:11`
- Root cause: the write path upserts org payment settings after only checking that the caller has an org.
- Exploit scenario: any org member can change the payment destination UPI ID and divert incoming payments.
- Fix: require admin auth before the upsert and audit-log the actor plus previous value.
- Test: non-admin update attempts should fail; admin updates should persist and be visible on follow-up reads.

### F-013 `HIGH` `src/app/api/_handlers/settings/marketplace/route.ts:81`
- Root cause: org marketplace settings are exposed without an admin-role check.
- Failure mode: low-privilege users can read rate-card margins, verification state, and compliance document URLs.
- Fix: require admin auth and keep the current org scoping.
- Test: non-admin requests should fail with `403`; admin requests should still receive normalized marketplace data.

### F-014 `HIGH` `src/app/api/_handlers/dashboard/tasks/route.ts:305`
- Root cause: the route loads `role` from `profiles` but does not enforce it before returning org-wide action queues.
- Failure mode: non-admin users can see overdue payments, quote follow-ups, and pickup operations for the whole org.
- Fix: use `requireAdmin()` or explicitly reject non-admin `profile.role` values.
- Test: non-admin users should receive `403`; admins should still receive both `tasks` and `completedTasks`.

### F-015 `HIGH` `src/app/api/_handlers/dashboard/schedule/route.ts:92`
- Root cause: the route selects `role, organization_id` but ignores `role` and returns trip/client/driver schedule data for the org.
- Failure mode: low-privilege members can inspect customer itineraries and driver phone numbers.
- Fix: require admin auth before querying `trips`.
- Test: verify non-admin requests are rejected and admin responses remain unchanged.

### F-016 `HIGH` `src/app/api/_handlers/drivers/search/route.ts:37`
- Root cause: the endpoint exposes an org-wide driver search surface after only membership checks.
- Failure mode: non-admin users can enumerate driver phones, vehicle info, photos, and same-day workload counts.
- Fix: gate the route with `requireAdmin()` and continue to scope results to `organization_id`.
- Test: ensure non-admin requests fail with `403`; admin pagination and search still work.

### F-017 `HIGH` `src/app/api/_handlers/nav/counts/route.ts:26`
- Root cause: cached org-wide dashboard counts are returned to any authenticated org member.
- Failure mode: low-privilege users can infer sales pipeline load, unread inbox volume, and review backlog for the whole org.
- Fix: require admin auth or split out per-role-safe metrics into a separate endpoint.
- Test: non-admin requests should fail or receive only sanitized counters; admins should retain the current payload.

## Patterns

### 1. Missing admin-role enforcement on org-wide endpoints
This is the dominant security pattern in the codebase. Several handlers read `role` or switch to `createAdminClient()` but never enforce admin privileges.

Validated examples:
- `src/app/api/_handlers/subscriptions/route.ts`
- `src/app/api/_handlers/subscriptions/cancel/route.ts`
- `src/app/api/_handlers/payments/create-order/route.ts`
- `src/app/api/_handlers/payments/links/route.ts`
- `src/app/api/_handlers/billing/subscription/route.ts`
- `src/app/api/_handlers/settings/upi/route.ts`
- `src/app/api/_handlers/settings/marketplace/route.ts`
- `src/app/api/_handlers/dashboard/tasks/route.ts`
- `src/app/api/_handlers/dashboard/schedule/route.ts`
- `src/app/api/_handlers/drivers/search/route.ts`
- `src/app/api/_handlers/nav/counts/route.ts`
- `src/app/api/_handlers/whatsapp/send/route.ts`
- `src/app/api/_handlers/whatsapp/connect/route.ts`
- `src/app/api/_handlers/whatsapp/broadcast/route.ts`

Additional affected routes that follow the same pattern and should be swept in the same remediation:
- `src/app/api/_handlers/whatsapp/test-message/route.ts`
- `src/app/api/_handlers/whatsapp/status/route.ts`
- `src/app/api/_handlers/whatsapp/health/route.ts`

Recommended sweep fix:
- Replace bespoke `auth.getUser() + profiles` membership checks with `requireAdmin()` anywhere the route reads org-wide operational, billing, or messaging state.
- Treat `createAdminClient()` as an admin-only primitive unless the route is explicitly public-token or webhook based.

### 2. Service-role client overuse outside admin-only flows
Routes frequently switch to `createAdminClient()` for convenience, even when the query could remain user-scoped or before authorization is established.

Risk:
- bypasses RLS guarantees
- makes missing-role bugs high impact
- increases blast radius of IDOR mistakes

### 3. Structural complexity is high enough to hide defects
Whole-tree scan results:
- `49` files exceed `600` LOC
- `17` files exceed `800` LOC
- `623` functions exceed `80` lines
- `1,130` functions exceed nesting depth `4`

Representative hotspots:
- `src/components/pdf/templates/ItineraryTemplatePages.tsx` `916` LOC
- `src/app/clients/page.tsx` `912` LOC
- `src/app/admin/tour-templates/create/page.tsx` `907` LOC
- `src/app/inbox/page.tsx` `899` LOC
- `src/app/admin/cost/page.tsx` `888` LOC
- `src/components/dashboard/ActionQueue.tsx` `884` LOC
- `src/app/dashboard/tasks/page.tsx` `883` LOC
- `src/app/add-ons/page.tsx` `877` LOC
- `src/app/social/_components/TemplateGallery.tsx` `864` LOC
- `src/app/social/_components/BackgroundPicker.tsx` `845` LOC

Representative oversized functions:
- `src/app/settings/page.tsx:26` `SettingsPage` `789` lines
- `src/features/admin/billing/BillingView.tsx:46` `BillingView` `773` lines
- `src/app/admin/cost/page.tsx:116` `AdminCostOverviewPage` `772` lines
- `src/app/clients/[id]/page.tsx:36` `ClientProfilePage` `763` lines
- `src/app/social/_components/TemplateGallery.tsx:103` `TemplateGallery` `761` lines
- `src/app/api/_handlers/admin/cost/overview/route.ts:32` `GET` `760` lines

Representative deep-nesting hotspots:
- `src/app/api/_handlers/proposals/public/[token]/route.ts:78` depth `15`
- `src/app/planner/page.tsx:61` depth `15`
- `src/app/api/_handlers/admin/trips/[id]/route.ts:56` depth `14`
- `src/app/api/_handlers/itinerary/generate/route.ts:226` depth `14`
- `src/app/api/_handlers/trips/[id]/route.ts:90` depth `14`

### 4. Type-escape pattern remains present in critical paths
Whole-tree type-safety scan results:
- `0` `as any` casts found
- `0` `any[]` declarations found
- `1` TypeScript suppression: `src/components/map/ItineraryMap.tsx:21`
- `18` explicit-`any` hits / suppressions across the tree, including `src/lib/api-dispatch.ts:13`, `src/lib/payments/subscription-service.ts:219`, `src/lib/payments/payment-logger.ts:19`, and `src/app/api/_handlers/integrations/places/route.ts:24`
- `131` non-null assertions (`!`) across the tree

The most dangerous non-null assertions are in data-heavy pages and API handlers where missing data is plausible. Full inventory is in `AUDIT_APPENDIX.md`.

### 5. Public-token hardening is mostly consistent, with one gap
Positive pattern exists on:
- `src/app/api/_handlers/payments/links/[token]/route.ts`
- `src/app/api/_handlers/portal/[token]/route.ts`
- `src/app/api/_handlers/proposals/public/[token]/route.ts`

Gap:
- `src/app/api/_handlers/payments/track/[token]/route.ts` is missing the same dedicated public route limiter.

## Positive Findings
- The central catch-all dispatcher in `src/lib/api-dispatch.ts` applies a CSRF guard for state-mutating requests via `passesMutationCsrfGuard()` and only exempts webhook/cron-style routes.
- Public token endpoints generally validate token shape before querying data.
- `npm run lint` and `npm run typecheck` both pass on the audited revision.
- No `require()` calls were found under `src/`.
- No variable-based dynamic `import(...)` calls were found under `src/`.
- Client-side environment usage scan found no non-public env vars embedded in `"use client"` modules other than `NODE_ENV`, which is a compile-time mode flag rather than a secret.
- Loose equality usage is limited to intentional nullish checks (`value == null`), not unsafe coercive comparisons.

## Appendix
Full raw scan inventories and structural outlier lists are in `AUDIT_APPENDIX.md`.
