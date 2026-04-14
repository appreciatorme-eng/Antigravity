# Travel Suite Web Audit Report

- Audit target: `a7b302bcf37e2a70debdf8e73826a5dd4fa8e3fa`
- Audit date: `2026-03-14`
- Scope: `projects/travel-suite/apps/web/src/`
- Files reviewed: `1253`
- Baseline: `npm run lint` passed, `npm run typecheck` passed, `npx madge --circular --extensions ts,tsx src` passed
- Constraint handling: accepted decisions from the audit brief were treated as suppressions; generated canonical schema artifact `src/lib/database.types.ts` is retained in appendix inventories but excluded from primary severity scoring.

## Executive Summary
- Total findings by severity: `0 CRITICAL`, `7 HIGH`, `2 MEDIUM`, `1 LOW`, `1 INFO`
- Top 5 most critical issues:
  1. Stored XSS in admin invoice print preview via raw HTML template interpolation.
  2. Stored XSS in GST report PDF export via raw HTML template interpolation.
  3. `/api/marketplace/listing-subscription` exposes Razorpay subscription metadata to any authenticated org member.
  4. Reputation campaign management endpoints allow non-admin org members to create, edit, archive, and trigger org-wide review campaigns.
  5. Reputation widget, brand-voice, and platform-connection settings endpoints still mutate org-wide configuration without an app-layer admin guard.
- Overall risk score: `82/100`

## Findings Table
| ID | Sev | Category | File:Line | Finding | Suggested Fix |
|---|---|---|---|---|---|
| H-01 | HIGH | Security | `src/features/admin/invoices/helpers.ts:66` | `buildInvoiceMarkup()` injects unescaped org/client/invoice fields into HTML that is written to a popup at `src/app/admin/invoices/page.tsx:448`, allowing stored script or markup execution from invoice data. | Escape every interpolated text/URL value before templating, or replace the raw string template with a React/DOM print surface that never uses `document.write()`. |
| H-02 | HIGH | Security | `src/app/admin/gst-report/page.tsx:124` | `generatePDF()` interpolates invoice/client/trip strings into raw HTML and writes the result to a popup at line `187`, so report data can inject executable markup into the admin session. | HTML-escape all dynamic cell values before string assembly, or render the export from sanitized DOM/PDF components instead of `document.write()`. |
| H-03 | HIGH | Authorization | `src/app/api/_handlers/marketplace/listing-subscription/route.ts:127` | `GET /api/marketplace/listing-subscription` only checks authenticated membership but returns org-wide billing state selected at lines `25-42`, including `created_by`, `razorpay_order_id`, and `razorpay_payment_id`. | Require `requireAdmin(..., { requireOrganization: true })` for the read path, or strip billing/payment identifiers from any member-visible response. |
| H-04 | HIGH | Authorization | `src/app/api/_handlers/reputation/campaigns/route.ts:58` | Reputation campaign management uses member auth only: create at `campaigns/route.ts:58`, update/archive at `campaigns/[id]/route.ts:59` and `:140`, and manual trigger at `campaigns/trigger/route.ts:18`. Any org member can change or fire org-wide review campaigns. | Gate collection, detail, and trigger handlers with `requireAdmin(..., { requireOrganization: true })`; keep RLS as defense in depth only. |
| H-05 | HIGH | Authorization | `src/app/api/_handlers/reputation/widget/config/route.ts:61` | Widget creation and update paths (`POST` at line `61`, `PUT` at line `148`) never require admin, so any org member can change public review-widget configuration for the organization. | Require admin on mutating widget-config methods and expose only intentionally safe read fields to non-admin users. |
| H-06 | HIGH | Authorization | `src/app/api/_handlers/reputation/connections/route.ts:58` | Platform connection create/delete paths (`POST` at line `58`, `DELETE` at line `134`) rely on membership only, allowing any org member to bind or remove shared Google/TripAdvisor/Facebook reputation connections. | Require admin for create/delete connection operations and retain organization scoping on the write queries. |
| H-07 | HIGH | Authorization | `src/app/api/_handlers/reputation/brand-voice/route.ts:103` | `PUT /api/reputation/brand-voice` lets any authenticated org member rewrite org-wide auto-response tone, sign-off, escalation thresholds, and sample replies. | Require admin for brand-voice mutations; keep GET read-only for members only if that access is intentional. |
| M-01 | MEDIUM | Security | `src/app/api/_handlers/location/live/[token]/route.ts:37` | Public live-location rate limiting fails open when the access-log count query ignores errors and the access-log insert at line `48` is fire-and-forget. If the log table is unavailable, the endpoint keeps serving responses without enforcing the cap. | Check and handle the count-query error, fail closed or fallback to a secondary limiter on failure, and await the log insert or record the failure explicitly before continuing. |
| M-02 | MEDIUM | Correctness | `src/app/api/_handlers/reputation/brand-voice/route.ts:57` | `GET /api/reputation/brand-voice` inserts a default row on first read, so a supposedly safe fetch path mutates server state and bypasses mutation semantics. | Move default initialization to onboarding or an explicit POST/PUT path, or return an in-memory default object without writing during GET. |
| L-01 | LOW | Architecture | `src/lib/api-response.ts:1` | Legacy `@/lib/api-response` remains imported by `155` source files while project conventions define `src/lib/api/response.ts` as canonical, so API envelopes still drift across handlers. | Consolidate on `src/lib/api/response.ts` and migrate legacy imports behind a compatibility shim or codemod. |
| I-01 | INFO | Type Safety | `src/lib/api-dispatch.ts:17` | The catch-all dispatcher still types handler context as `any`, weakening compile-time validation exactly at the central routing boundary. | Replace `ctx: any` with a shared context type such as `{ params: Promise<Record<string, string>> }`, or make `HandlerFn` generic over params. |

## Detailed Findings

### H-01 — Stored XSS In Admin Invoice Print Preview
- Root cause: `buildInvoiceMarkup()` concatenates raw database-backed strings directly into an HTML document and `handlePrintInvoice()` writes that string into a privileged popup window.
- Exploit scenario: A malicious client name, invoice note, address field, or logo URL imported into invoice data can inject markup such as event handlers or crafted attributes. When an admin opens print preview, the payload executes in the application's origin and can act with the admin's session context.
- Fix: Introduce a dedicated HTML escaping helper for text nodes and a strict URL sanitizer for `logo_url`, then apply it to every interpolated field before string assembly. Preferably replace the string template with a React-rendered printable component and print a cloned DOM subtree instead of `document.write()`.
- Test: Create an invoice whose `notes` contain `"><img src=x onerror=window.__invoice_xss=1>` and verify print preview renders escaped text with no `window.__invoice_xss` side effect.

### H-02 — Stored XSS In GST Report Export
- Root cause: `generatePDF()` builds a full HTML document with unescaped report fields and writes it to a new window.
- Exploit scenario: If a client name, trip name, or invoice number contains markup payloads, an admin exporting the GST report executes attacker-controlled HTML/JS inside the popup window.
- Fix: Escape every dynamic string placed into the template, including `month`, `invoiceNo`, `client`, and `trip`. A stronger fix is to render the export through a React/PDF component rather than manual string concatenation.
- Test: Seed a GST row with `client = '<img src=x onerror=window.__gst_xss=1>'`, run the export, and confirm the popup shows literal escaped text and never sets `window.__gst_xss`.

### H-03 — Marketplace Subscription Metadata Exposure To Non-Admins
- Root cause: The handler authenticates the user but never checks `profile.role` or uses `requireAdmin`, while selecting sensitive subscription and payment identifiers for the whole organization.
- Exploit scenario: Any non-admin org member can call the endpoint and enumerate active billing status, order IDs, payment IDs, and creator metadata that should remain limited to billing administrators.
- Fix: Move `GET` onto `requireAdmin(request, { requireOrganization: true })`. If non-admins need limited visibility, return a reduced projection that excludes payment identifiers and creator metadata.
- Test: Call `GET /api/marketplace/listing-subscription` as a non-admin member and verify it returns `403`; repeat as an admin and verify the expected billing payload remains available.

### H-04 — Non-Admins Can Manage And Trigger Reputation Campaigns
- Root cause: Campaign collection, detail, and trigger routes all authenticate membership only and then perform org-wide writes or side effects.
- Exploit scenario: Any org member can create a new campaign, edit thresholds and templates, archive an existing campaign, or trigger outbound sends that enqueue WhatsApp review requests on behalf of the organization.
- Fix: Replace manual membership auth in `campaigns/route.ts`, `campaigns/[id]/route.ts`, and `campaigns/trigger/route.ts` with `requireAdmin(..., { requireOrganization: true })` before any read/write logic.
- Test: As a non-admin member, attempt `POST /api/reputation/campaigns`, `PATCH /api/reputation/campaigns/:id`, `DELETE /api/reputation/campaigns/:id`, and `POST /api/reputation/campaigns/trigger`; each should return `403` and create no sends. Confirm the same calls still succeed for an admin.

### H-05 — Non-Admins Can Rewrite Reputation Widget Configuration
- Root cause: Widget config mutations use only authenticated membership plus organization scoping; there is no app-layer admin authorization on create or update.
- Exploit scenario: Any org member can change widget appearance, visibility, rating filters, or branding for the organization's public review widgets.
- Fix: Require admin authorization for `POST` and `PUT` in `reputation/widget/config/route.ts`. If non-admin reads are needed, split read/write access explicitly instead of sharing the same auth path.
- Test: Attempt widget creation and update as a non-admin member and verify `403`; repeat as admin and verify the widget persists normally.

### H-06 — Non-Admins Can Modify Shared Reputation Platform Connections
- Root cause: Connection management relies on user membership only and performs shared organization-scoped writes without an admin-role check.
- Exploit scenario: Any org member can attach a new Google Business / TripAdvisor / Facebook connection or remove an existing one, disrupting sync and review ingestion for the whole organization.
- Fix: Require admin authorization for `POST` and `DELETE` in `reputation/connections/route.ts` before reading request data or issuing writes.
- Test: Verify non-admin users receive `403` for create/delete operations and that existing connections remain unchanged; verify admins can still add and remove connections successfully.

### H-07 — Non-Admins Can Rewrite Brand Voice Settings
- Root cause: `PUT /api/reputation/brand-voice` treats any authenticated org member as authorized to update org-wide automated reply settings.
- Exploit scenario: A non-admin teammate can silently change tone, sign-off, escalation thresholds, or sample responses, affecting downstream AI-generated review replies for the organization.
- Fix: Gate the `PUT` handler with `requireAdmin(..., { requireOrganization: true })` and keep GET separate if broader read access is intentional.
- Test: Submit a `PUT /api/reputation/brand-voice` request as a non-admin member and verify it returns `403` with no database update; confirm admin users can still update the record.

## Patterns
- Org-wide reputation configuration still relies on membership auth in multiple endpoints: campaigns, campaign detail, campaign trigger, widget config, platform connections, and brand voice all mutate shared org settings without `requireAdmin`.
- Admin finance print/export utilities still use raw HTML string templates with unescaped database content in at least two places: invoice preview and GST report export.
- API response contract drift remains systemic: `155` imports still point to legacy `@/lib/api-response` even though project conventions define `src/lib/api/response.ts` as canonical.
- Architecture pressure remains high in the current tree: appendix inventories show `34` files over `600` lines, `674` functions over `80` lines, and `15,485` unique file:line nesting entries over depth `4`, concentrated in admin and superadmin surfaces.

## Positive Findings
- Current baseline is clean: `npm run lint`, `npm run typecheck`, and `npx madge --circular --extensions ts,tsx src` all pass on `a7b302b`.
- No legacy direct API route files remain outside the catch-all dispatchers under `src/app/api`; the route surface is centralized.
- The previously audited blog HTML sink is now sanitized with DOMPurify, and the current `BlogPost` renderer is no longer a live XSS finding.
- Public token routes inspected in this pass use explicit token-format validation and rate limiting patterns in most cases, especially `payments/links/[token]` and portal/share surfaces.
