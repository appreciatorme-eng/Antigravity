# Invoice Module (Org-Scoped) Tracker

Date started: 2026-02-27  
Owner: Codex  
Scope: Build invoice module from scratch (API + admin UI + E2E), with dynamic per-organization branding details.

Status legend: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`

## 1) Functional Scope

| ID | Item | Status | Notes |
|---|---|---|---|
| INV-001 | Replace legacy invoice API flow with org-scoped admin-authenticated module | DONE | `/api/invoices`, `/api/invoices/[id]`, `/api/invoices/[id]/pay` rewritten around `requireAdmin` and organization scope |
| INV-002 | Implement strict payload validation and deterministic totals/tax calculations | DONE | New `zod` schemas + calculations in `src/lib/invoices/module.ts` |
| INV-003 | Persist per-invoice snapshots of operator branding details | DONE | Metadata now stores `organization_snapshot` and `client_snapshot` at creation time |
| INV-004 | Add invoice detail + payment recording lifecycle support | DONE | Detail endpoint includes payments; payment endpoint updates paid/balance/status |
| INV-005 | Build admin invoice console for creating, reviewing, printing invoices | DONE | New route `src/app/admin/invoices/page.tsx` |

## 2) Dynamic Operator Branding

| ID | Item | Status | Notes |
|---|---|---|---|
| BRAND-001 | Wire settings page to editable GST + billing profile fields | DONE | Extended `admin/settings` with GSTIN, billing state, full billing address, billing email/phone |
| BRAND-002 | Save billing profile to organization record for multi-tenant usage | DONE | Saves to `organizations.gstin`, `organizations.billing_state`, and `organizations.billing_address` |
| BRAND-003 | Use organization settings dynamically in generated invoices per org | DONE | Invoice creation snapshots org logo/name/GST/billing details dynamically for current org |

## 3) E2E Coverage

| ID | Item | Status | Notes |
|---|---|---|---|
| E2E-001 | Unauthenticated contract tests for invoice endpoints | DONE | Added in `e2e/tests/invoices-api.spec.ts` |
| E2E-002 | Non-admin authorization guard tests for invoice endpoints | DONE | Added in `e2e/tests/invoices-api.spec.ts` using `clientPage` fixture |
| E2E-003 | Admin create + fetch + cleanup invoice flow test | DONE | Added in `e2e/tests/invoices-api.spec.ts` with org snapshot assertions |
| E2E-004 | Execute and validate E2E suite for new tests | IN_PROGRESS | Pending local run verification in this session |

## 4) Navigation and UX

| ID | Item | Status | Notes |
|---|---|---|---|
| UX-001 | Expose invoices in admin sidebar navigation | DONE | Added `Invoices` item (`/admin/invoices`) in `Sidebar.tsx` |
| UX-002 | Provide invoice print-ready output from admin UI | DONE | New print rendering path from invoice preview panel |

## 5) Progress Log

| Time (local) | Update |
|---|---|
| 2026-02-27 12:20 | Tracker created and implementation scope locked (API, settings, UI, E2E). |
| 2026-02-27 12:30 | New invoice service module added with validation, numbering, totals, tax breakdown, and metadata normalization. |
| 2026-02-27 12:40 | `/api/invoices`, `/api/invoices/[id]`, `/api/invoices/[id]/pay` rewritten with org-scoped admin auth and invoice snapshot flow. |
| 2026-02-27 12:47 | Admin settings expanded with GST and billing profile fields (saved to organization record). |
| 2026-02-27 12:55 | New `/admin/invoices` console delivered (create/list/detail/record payment/print). |
| 2026-02-27 13:00 | E2E coverage added (`e2e/tests/invoices-api.spec.ts`) for unauth/authz/admin lifecycle; test execution pending. |

