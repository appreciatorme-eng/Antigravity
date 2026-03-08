# Stale Code Audit
Generated: 2026-03-08 | Branch: codex/sprint-4-and-audit

## Safe removals applied during this audit

| File | Line | Category | Code Snippet | Risk to Remove | Recommendation |
|------|------|----------|-------------|----------------|----------------|
| `src/app/api/_handlers/social/process-queue/route.ts` | 107 | `console.log` | `console.log(\`[Cron] Processing social publish...\`)` | LOW | AUTO-REMOVED: stale API debug logging removed |
| `src/app/api/_handlers/social/ai-image/route.ts` | 134 | `console.log` | `console.log(\`\${logPrefix} Generating...\`)` | LOW | AUTO-REMOVED: noisy generation logging removed |
| `src/app/api/_handlers/itinerary/generate/route.ts` | multiple | `console.log` | tier/cache/model routing debug statements | LOW | AUTO-REMOVED: noisy API debug logging removed |
| `src/app/api/_handlers/itinerary/import/pdf/route.ts` | 65 | `console.log` | `console.log(\`Scraping PDF import...\`)` | LOW | AUTO-REMOVED: stale trace logging removed |
| `src/app/api/_handlers/itinerary/import/url/route.ts` | 129 | `console.log` | `console.log(\`Scraping URL import...\`)` | LOW | AUTO-REMOVED: stale trace logging removed |

## Remaining inventory

| File | Line | Category | Code Snippet | Risk to Remove | Recommendation |
|------|------|----------|-------------|----------------|----------------|
| `src/app/reputation/_components/mock-data.ts` | 12 | MOCK data | `export const MOCK_REVIEWS = ...` | MEDIUM | NEEDS APPROVAL: this still backs secondary reputation/demo surfaces; remove only after those pages are wired to live data |
| `src/app/admin/activity/page.tsx` | 31 | MOCK data | `const MOCK_ACTIVITIES: Activity[] = [` | MEDIUM | NEEDS APPROVAL: page is still mock-backed; either wire real activity feed or remove the route from navigation |
| `src/app/admin/gst-report/page.tsx` | 34 | MOCK data | `const MOCK_DATA: GSTRow[] = [` | MEDIUM | NEEDS APPROVAL: replace with real GST report query before deleting the mock page data |
| `src/components/whatsapp/inbox-mock-data.ts` | 371 | MOCK data | `export const ALL_MOCK_CONVERSATIONS = ...` | MEDIUM | KEEP FOR NOW: still used by demo mode in inbox; remove only if demo mode is retired |
| `src/components/whatsapp/action-picker/shared.ts` | 41 | MOCK data | `export const MOCK_TRIPS = [` | MEDIUM | KEEP FOR NOW: action picker still uses static samples; wire to live trip/driver lookups before deletion |
| `src/components/pdf/DownloadPDFButton.tsx` | 36 | Simulated async | `await new Promise(resolve => setTimeout(resolve, 300));` | LOW | SOON: remove artificial delay once button state uses real async status only |
| `src/components/whatsapp/WhatsAppConnectModal.tsx` | 53 | Simulated async | `await new Promise((resolve) => setTimeout(resolve, 1500));` | MEDIUM | SOON: demo pacing remains in the connect modal; replace with real session polling only |
| `src/components/whatsapp/WhatsAppConnectModal.tsx` | 172 | Simulated async | `await new Promise((resolve) => setTimeout(resolve, 1500));` | MEDIUM | SOON: same as above; remove timing simulation when demo branch is retired |
| `src/app/reputation/_components/PlatformConnectionCards.tsx` | 292 | Placeholder copy | `Automatic review sync for this platform is coming soon.` | LOW | KEEP: honest placeholder copy is acceptable until non-Google review sync exists |
| `src/app/planner/PlannerHero.tsx` | 24 | Placeholder content | `const PLACEHOLDER_DESTINATIONS = [` | LOW | KEEP: this is cosmetic placeholder rotation, not stale logic |
| `./apply-migrations-direct.sh` | 1 | One-shot migration script | shell helper for manual migration execution | MEDIUM | NEEDS APPROVAL: superseded by `scripts/post-merge.sh`, but delete only after confirming nobody still uses it |
| `src/app/api/_handlers/admin/seed-demo/route.ts` | 72 | Feature flag | `process.env.ALLOW_SEED_IN_PROD` | MEDIUM | DOCUMENT ONLY: keep gated for emergency/demo use; revisit if seed route is retired entirely |
| `src/app/api/_handlers/debug/route.ts` | 9 | Feature flag | `ENABLE_DEBUG_ENDPOINT` | HIGH | DOCUMENT ONLY: remove only if the debug endpoint is permanently retired |
| `src/lib/integrations.ts` | 53 | Feature flag | `ENABLE_RAZORPAY_INTEGRATION` / `ENABLE_PAYMENTS_INTEGRATION` / `ENABLE_EMAIL_INTEGRATION` / `ENABLE_WHATSAPP_INTEGRATION` | MEDIUM | DOCUMENT ONLY: these still control partial integration behavior in lower environments |
| `src/lib/security/whatsapp-webhook-config.ts` | 3 | Feature flag | `WHATSAPP_ALLOW_UNSIGNED_WEBHOOK` | HIGH | DOCUMENT ONLY: security-sensitive flag; keep but ensure production is locked down |
| `src/lib/security/mock-endpoint-guard.ts` | 15 | Feature flag | `ENABLE_MOCK_ENDPOINTS` | HIGH | DOCUMENT ONLY: remove only after demo/test routes are fully retired |
| `src/lib/supabase/env.ts` | 16 | Feature flag | `ALLOW_SUPABASE_DEV_FALLBACK` | HIGH | DOCUMENT ONLY: keep for local dev fallback only; do not enable in production |

## Searches with no actionable findings
- Large commented-out code blocks: no 3-line commented-out code blocks were found by the requested search.
- API-route `console.log`: cleared during this audit.

## Approval-required removals
- Entire mock-backed admin pages such as `admin/activity` and `admin/gst-report`
- Demo-mode data sources in the WhatsApp inbox/action picker
- One-shot migration helper `apply-migrations-direct.sh`
- Security/integration feature flags listed above

## Recommendation summary
1. The next safe cleanup pass should target the admin mock pages once live data sources are available.
2. Demo-mode WhatsApp mock data should stay until product explicitly retires demo mode.
3. `apply-migrations-direct.sh` is probably obsolete now that `scripts/post-merge.sh` exists, but it should be removed only with explicit approval.
