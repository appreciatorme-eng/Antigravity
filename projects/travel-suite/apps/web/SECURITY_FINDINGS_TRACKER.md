# Web Security Findings Tracker
Branch: codex/web-security-findings-fixes
Scope: apps/web + required Supabase migrations

| ID | Finding | Status | Commit |
|---|---|---|---|
| F-01 | Cron endpoints accept raw service-role secret as bearer auth | ⏳ PENDING | |
| F-02 | `shared_itineraries` is publicly readable while links are active | ⏳ PENDING | |
| F-03 | Public share page overfetches sensitive data with wildcard service-role select | ⏳ PENDING | |
| F-04 | `policy_embeddings` and `itinerary_embeddings` are world-readable via RLS | ⏳ PENDING | |

## Notes
- All changes are web-scope only.
- Fixes are delivered segment-by-segment with a push after each segment.
