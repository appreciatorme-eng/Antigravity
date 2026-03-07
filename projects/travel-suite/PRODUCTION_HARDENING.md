# Production Hardening Log
**Started**: 2026-03-07 01:40:40 CST
**Baseline Score**: 35/100
**Target**: All dimensions >= 8/10 | Production Ready: YES

## Live Scorecard
| Dimension | Baseline | Current | Target |
|---|---|---|---|
| Code Quality | 4/10 | - | 8+/10 |
| Security | 1/10 | - | 9+/10 |
| Architecture | 5/10 | - | 8+/10 |
| Performance | 4/10 | - | 8+/10 |
| Error Handling | 4/10 | - | 8+/10 |
| Test Coverage | 3/10 | - | 8+/10 |
| Type Safety | 5/10 | - | 8+/10 |
| API Design | 4/10 | - | 8+/10 |
| Maintainability | 4/10 | - | 8+/10 |
| Production Readiness | 1/10 | - | 9+/10 |

## Issue Registry
| ID | Severity | File:Line | Issue | Status | Fix Commit |
|---|---|---|---|---|---|
| S-01 | CRITICAL | `supabase/run-migration.sh:6-7` + `DEPLOYMENT_GUIDE.md:37-39` | Live service-role credential committed | RESOLVED | `6f25f5d` |
| S-02 | CRITICAL | `apps/web/src/app/api/_handlers/admin/seed-demo/route.ts:60` | Admin seed route has no auth guard | RESOLVED | `6604e37` |
| S-03 | HIGH | `supabase/migrations/20260214130000_upsell_engine_rpc.sql:9-136+142-332` | `SECURITY DEFINER` trusts caller tenant ID | RESOLVED | `364ae9f` |
| S-04 | HIGH | `supabase/migrations/20260214150000_proposal_system.sql:352-406` | Proposal RPC bypasses ownership checks | RESOLVED | `364ae9f` |
| S-05 | HIGH | `supabase/migrations/20260214160000_clone_template_deep.sql:2-63` | Template clone RPC bypasses ownership | RESOLVED | `364ae9f` |
| S-06 | HIGH | `apps/web/src/app/api/_handlers/webhooks/waha/route.ts:52-65` | Webhook fails open when secret unset | RESOLVED | `702b7be` |
| S-07 | HIGH | `apps/web/src/app/share/[token]/page.tsx:13-29+115-123` | Public token page exposes client PII | RESOLVED | `2066743` |
| S-08 | MEDIUM | `apps/web/src/app/api/_handlers/social/oauth/callback/route.ts:45` | OAuth secret in query string | RESOLVED | `a0c7f18` |
| S-09 | MEDIUM | `apps/web/src/app/api/_handlers/whatsapp/connect/route.ts:41` | WAHA webhook secret in query string | RESOLVED | `a0c7f18` |
| S-10 | MEDIUM | `apps/web/src/app/api/_handlers/itinerary/import/url/route.ts:8` | SSRF check does not resolve DNS | RESOLVED | pending |
| S-11 | LOW | `apps/web/src/app/clients/[id]/error.tsx:30` | Error page leaks internal `error.message` | RESOLVED | pending |
| P-01 | HIGH | `apps/web/src/app/api/_handlers/notifications/process-queue/route.ts:287-494` | Serialized N+1 queue processing | OPEN | - |
| P-02 | MEDIUM | `apps/web/src/app/api/_handlers/reputation/ai/batch-analyze/route.ts:157` | Missing index on `sentiment_score IS NULL` | OPEN | - |
| P-03 | MEDIUM | `ActionPickerModal.tsx` + `CanvasMode.tsx` | Oversized client islands | OPEN | - |
| E-01 | HIGH | `22 route files` | No try/catch error handling | OPEN | - |
| E-02 | MEDIUM | `proposals/create:214`, `whatsapp/connect:60`, `notifications/process-queue:531` | Raw error messages exposed to client | RESOLVED | pending |
| E-03 | MEDIUM | `google.server.ts:41`, `whatsapp-waha.server.ts:73` | External calls missing timeout/retry | RESOLVED | pending |
| T-01 | HIGH | `Multiple critical paths` | 10-15% coverage - needs 80% | OPEN | - |
| T-02 | HIGH | `SQL migrations/RPCs` | Zero test coverage | OPEN | - |
| C-01 | MEDIUM | `TemplateGallery.tsx:22-23+595` | Hardcoded `USER_TIER=\"Enterprise\"` | OPEN | - |
| C-02 | MEDIUM | `ItineraryFilterBar.tsx:9`, `NeedsAttentionQueue.tsx:10`, etc. | Circular dependencies in planner/WhatsApp UI | OPEN | - |
| C-03 | MEDIUM | `payments/create-order`, `whatsapp/connect`, `proposals/create` | 88 authed mutation routes without rate limiting | OPEN | - |
| C-04 | MEDIUM | `payments:144`, `share/[token]:238`, `notifications:525` | Inconsistent API response envelopes | OPEN | - |
| D-01 | HIGH | `apps/agents/requirements.txt` | FastAPI/Starlette CVE-2025-54121 + CVE-2025-62727 | OPEN | - |
| D-02 | MEDIUM | `apps/mobile/pubspec.yaml` | Major drift: `firebase_core`, `firebase_messaging`, `flutter_local_notifications` | OPEN | - |
| D-03 | LOW | `apps/web/package.json:34-36` | Type-only packages in runtime dependencies | OPEN | - |
| M-01 | LOW | `apps/mobile/lib/core/config/supabase_config.dart:3-5` | Mobile ships hardcoded Supabase values + localhost fallback | OPEN | - |
| M-02 | LOW | `apps/agents/api/dependencies.py:30-32` | Unused dev-auth bypass code in tree | OPEN | - |
| M-03 | LOW | `apps/mobile/lib/features/trips/.../traveler_dashboard.dart:385-387+1948-1950` | Placeholder localhost fallback in mobile | OPEN | - |

## Fix Log
- 2026-03-07 01:40:40 CST - Initialized tracker from audit baseline.
- 2026-03-07 01:40:40 CST - Phase 1 secret purge in progress; removed committed Supabase credentials and replaced live project references with placeholders or env reads.
- 2026-03-07 01:40:40 CST - Phase 2 hardened the admin demo seeding endpoint with admin auth, rate limiting, production gating, CSRF validation, and user-safe error handling.
- 2026-03-07 01:40:40 CST - Phase 3 added tenant ownership assertions for `SECURITY DEFINER` add-on, proposal, and template cloning RPCs in a new Supabase migration.
- 2026-03-07 01:40:40 CST - Phase 4 made the WAHA webhook fail closed when its shared secret is unset and validated inbound secrets with timing-safe comparison.
- 2026-03-07 01:40:40 CST - Phase 5 removed client email and phone from the public share page query and render path.
- 2026-03-07 01:40:40 CST - Phase 6 moved Facebook OAuth secrets into POST bodies and shifted WPPConnect webhook authentication from URL query parameters to an outbound header patch in the sidecar build.
- 2026-03-07 01:40:40 CST - Phase 7 upgraded URL import SSRF protection to resolve DNS and reject private or loopback destinations after resolution.
- 2026-03-07 01:40:40 CST - Phase 8 sanitized client-facing error output on the client profile page and the flagged proposal, WhatsApp, and notification queue APIs.
- 2026-03-07 01:40:40 CST - Phase 9 added retry and timeout controls to Google OAuth/userinfo calls and WPPConnect API requests.
- 2026-03-07 01:40:40 CST - Phase 10 added per-user rate limiting to the highest-risk payment, proposal creation, and WhatsApp connect mutations; broader mutation throttling remains open under C-03.
