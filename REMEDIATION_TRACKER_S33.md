# Remediation Tracker S33

Branch: `codex/audit-remediation-s33`
Target: `projects/travel-suite/apps/web/src/`
Base: `b7914ac33412851755c92488d5d3ecd8849b20e1`

## Findings

| ID | Severity | Status | Resolution | Files |
|---|---|---|---|---|
| A-01 | CRITICAL | ✅ | Updated CSRF exemption routing logic to correctly exempt webhook paths including `whatsapp/webhook` and `webhooks/*`. | `src/lib/api-dispatch.ts` |
| A-02 | HIGH | ✅ | Replaced local admin-auth implementation in proposal convert handler with centralized `requireAdmin` and scoped admin client usage. | `src/app/api/_handlers/proposals/[id]/convert/route.ts` |
| A-03 | HIGH | ✅ | Removed stale duplicate webhook handler and added canonical catch-all alias for `/api/webhooks/whatsapp` to the active handler. | `src/app/api/[...path]/route.ts`, `src/app/api/_handlers/webhooks/whatsapp/route.ts` |
| A-04 | MEDIUM | ✅ | Added public IP rate limiting to `/api/og` GET requests. | `src/app/api/og/route.tsx` |
| A-05 | MEDIUM | ✅ | Added OG input sanitization with control-char stripping and max-length clamps for `title` and `subtitle`. | `src/app/api/og/route.tsx` |
| A-06 | MEDIUM | ✅ | Added cursor/limit pagination with bounded page size and next-cursor metadata to add-ons listing API. | `src/app/api/_handlers/add-ons/route.ts` |
| A-07 | MEDIUM | ✅ | Extracted oversized drivers page implementation into `DriversPageClient.tsx`; kept `page.tsx` as thin route wrapper. | `src/app/drivers/page.tsx`, `src/app/drivers/DriversPageClient.tsx` |
| A-08 | MEDIUM | ✅ | Moved heavy client profile page body into `client-profile-page-content.tsx`; kept route `page.tsx` wrapper minimal. | `src/app/clients/[id]/page.tsx`, `src/app/clients/[id]/client-profile-page-content.tsx` |
| A-09 | MEDIUM | ✅ | Reduced POST handler complexity in route entrypoint by extracting body to `handleGenerateItineraryPost` and using a thin exported `POST`. | `src/app/api/_handlers/itinerary/generate/route.ts` |
| A-10 | LOW | ✅ | Replaced clickable backdrop container with semantic button backdrop in `GlassModal`. | `src/components/glass/GlassModal.tsx` |
| A-11 | LOW | ✅ | Converted slide-out backdrop to semantic button with explicit close label. | `src/components/god-mode/SlideOutPanel.tsx` |
| A-12 | LOW | ✅ | Converted command menu dismiss overlay to semantic button. | `src/components/layout/CommandMenu.tsx` |
| A-13 | LOW | ✅ | Added semantic close overlay button in template gallery phone mock preview. | `src/app/social/_components/template-gallery/TemplateGrid.tsx` |
| A-14 | LOW | ✅ | Replaced swallowed history-update catches with structured error logging. | `src/lib/assistant/channel-adapters/whatsapp.ts` |
| A-15 | INFO | ✅ | Removed non-null assertions in availability handler by enforcing org-required admin auth and explicit organization checks. | `src/app/api/_handlers/availability/route.ts` |
| A-16 | INFO | ✅ | Replaced loose equality nullability checks in referenced budget-range helpers with explicit null/undefined guards. | `src/features/trip-detail/tabs/ClientCommsTab.tsx`, `src/features/trip-detail/tabs/OverviewTab.tsx` |
| A-17 | INFO | ✅ | Updated TODO markers to explicit tracked identifiers for audit traceability. | `src/lib/payments/payment-receipt-config.ts`, `src/lib/blog/queries.ts`, `src/components/marketing/blog/BlogPost.tsx` |

## Validation Checklist

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npx madge --circular --extensions ts,tsx src`

## Commit Log

- [x] pending commit on `codex/audit-remediation-s33` (to be replaced by hash on merge)
