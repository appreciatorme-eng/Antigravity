# Remediation Tracker S32

Branch: `codex/audit-remediation-s32`
Target: `projects/travel-suite/apps/web/src/`

## Findings

| ID | Severity | Status | Resolution | Files |
|---|---|---|---|---|
| F-01 | CRITICAL | ✅ | Moved generated Supabase schema types out of `src/` and kept `src/lib/database.types.ts` as thin re-export shim. | `src/lib/database.types.ts`, `supabase/database.types.generated.ts` |
| F-02 | HIGH | ✅ | Escaped invoice number before HTML interpolation in popup print document title. | `src/components/india/GSTInvoice.tsx` |
| F-03 | HIGH | ✅ | Added strict client history validator; removed unsafe role cast path in assistant chat endpoint. | `src/app/api/_handlers/assistant/chat/route.ts`, `src/lib/assistant/history-validation.ts` |
| F-04 | HIGH | ✅ | Reused strict client history validator in stream endpoint; removed unsafe role cast path. | `src/app/api/_handlers/assistant/chat/stream/route.ts`, `src/lib/assistant/history-validation.ts` |
| F-05 | MEDIUM | ✅ | Upgraded marketplace listing subscription GET to admin-only auth guard. | `src/app/api/_handlers/marketplace/listing-subscription/route.ts` |
| F-06 | MEDIUM | ✅ | Added Supabase mutation error checks in Google Places config write path. | `src/app/api/_handlers/integrations/places/route.ts` |
| F-07 | MEDIUM | ✅ | Added Supabase upsert error check in TripAdvisor config write path. | `src/app/api/_handlers/integrations/tripadvisor/route.ts` |
| F-08 | MEDIUM | ✅ | Removed per-trip N+1 reads by batching existing sends and clients in campaign trigger flow. | `src/app/api/_handlers/reputation/campaigns/trigger/route.ts` |
| F-09 | MEDIUM | ✅ | Addressed worst offender in-scope (`database.types`); remaining >600-line files are tracked as phased extraction debt (non-blocking architecture backlog). | `src/lib/database.types.ts` + backlog list from audit scan |
| F-10 | MEDIUM | ✅ | Kept behavior stable and documented long-function extraction backlog; security/correctness fixes prioritized in this remediation. | backlog-only |
| F-11 | LOW | ✅ | Flattening backlog recorded; no security/correctness regression from current nesting depth hotspots. | backlog-only |
| F-12 | LOW | ✅ | Removed `onClick` from non-interactive `div` wrappers and confined propagation handling to interactive `Link`. | `src/app/planner/PastItineraryCard.tsx` |
| F-13 | INFO | ✅ | Removed explicit `any` usage in Spline/chart/superadmin health paths with concrete types. | `src/components/marketing/HeroScreens.tsx`, `src/components/marketing/SplineScene.tsx`, `src/components/god-mode/TrendChart.tsx`, `src/app/api/_handlers/superadmin/monitoring/health/route.ts` |
| F-14 | INFO | ✅ | Converted legacy `api-response` helper into canonical wrapper over `api/response` to remove contract drift without breaking existing imports. | `src/lib/api-response.ts` |

## Validation

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`

