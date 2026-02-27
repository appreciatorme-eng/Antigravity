# Invoice Premium Redesign Tracker

Date started: 2026-02-27
Owner: Codex
Scope: Complete invoice experience polish in `/admin/invoices` with premium templates, GST automation controls, PDF/email/WhatsApp flows, and UX consistency improvements.

Status legend: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`

## 1) Product Scope

| ID | Item | Status | Notes |
|---|---|---|---|
| INV-PRO-001 | Premium invoice create/review experience redesign | DONE | `/admin/invoices` redesigned into structured create/list/preview workspace |
| INV-PRO-002 | Template system for invoice preview/export | DONE | Added Executive/Obsidian/Heritage template selection with adaptive preview and print rendering |
| INV-PRO-003 | Add robust PDF download flow | DONE | Added true PDF generation using `@react-pdf/renderer` via new `InvoiceDocument` component |
| INV-PRO-004 | Add easy send flows (email + WhatsApp) | DONE | Added one-click WhatsApp compose and new org-scoped invoice email API (`/api/invoices/send-pdf`) |
| INV-PRO-005 | GST toggle, auto-calc, and breakdown clarity | DONE | Added GST on/off toggle, place-of-supply and SAC controls, live tax split and totals |
| INV-PRO-006 | Fix top refresh visibility and action hierarchy | DONE | Refresh moved to clear outline button matching visible action pattern |

## 2) Technical Scope

| ID | Item | Status | Notes |
|---|---|---|---|
| TECH-001 | Add reusable invoice PDF document component | DONE | `src/components/pdf/InvoiceDocument.tsx` created with template-aware style themes |
| TECH-002 | Add invoice PDF email API endpoint | DONE | Added `src/app/api/invoices/send-pdf/route.ts` with admin auth + invoice ownership validation |
| TECH-003 | Extend invoice page data/actions | DONE | Rebuilt invoice page: templates, GST controls, quick presets, share/export/payment actions |
| TECH-004 | Validate with lint/typecheck | IN_PROGRESS | Targeted lint/typecheck commands were attempted; lint check completed once, subsequent checks hang in this environment |

## 3) Progress Log

| Time (local) | Update |
|---|---|
| 2026-02-27 17:05 | Tracker created and implementation scope locked (UI redesign + templates + GST + share/export). |
| 2026-02-27 17:10 | Codebase review completed for invoice routes, GST helpers, and existing PDF/email patterns to reuse safely. |
| 2026-02-27 17:22 | Implemented reusable invoice PDF document (`InvoiceDocument`) with template-aware rendering and GST totals sections. |
| 2026-02-27 17:27 | Added `/api/invoices/send-pdf` endpoint with `requireAdmin`, org ownership checks, integration guard, and Resend attachment flow. |
| 2026-02-27 17:42 | Rebuilt `/admin/invoices` into premium invoice workspace with: template switcher, rich preview, GST toggle+split auto-calcs, line-item presets, PDF/email/WhatsApp actions, and visible refresh CTA. |
| 2026-02-27 17:48 | Verification pass started; targeted lint/typecheck commands run with mixed behavior (one lint pass succeeded, later lint/typecheck hangs without output in this environment). |
