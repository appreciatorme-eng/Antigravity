# Security Hardening Tracker — S23

| # | Severity | Item | Status | Commit |
|---|----------|------|--------|--------|
| SH-1 | CRITICAL | Payment forgery — remove paid/cancelled from public tracking | ⬜ | |
| SH-2 | HIGH | CSRF guard — admin/clients POST | ⬜ | |
| SH-3 | HIGH | CSRF guard — admin/contacts POST | ⬜ | |
| SH-4 | HIGH | CSRF guard — admin/generate-embeddings POST | ⬜ | |
| SH-5 | HIGH | CSRF guard — admin/leads POST | ⬜ | |
| SH-6 | HIGH | CSRF guard — admin/trips POST | ⬜ | |
| SH-7 | HIGH | CSRF guard — superadmin/announcements POST | ⬜ | |
| SH-8 | HIGH | Cron auth — migrate assistant-alerts to authorizeCronRequest | ⬜ | |
| SH-8b | HIGH | Cron auth — migrate assistant-briefing to authorizeCronRequest | ⬜ | |
| SH-8c | HIGH | Cron auth — migrate assistant-digest to authorizeCronRequest | ⬜ | |
| SH-8d | HIGH | Cron auth — migrate reputation-campaigns to authorizeCronRequest | ⬜ | |
| SH-9 | HIGH | Cron auth — migrate schedule-followups to authorizeCronRequest | ⬜ | |
| SH-10 | HIGH | Cron auth — migrate batch-analyze to authorizeCronRequest | ⬜ | |
| SH-11 | HIGH | Fix batch-analyze spend bucket ai_image → ai_text | ⬜ | |
| SH-12 | MEDIUM | Error leakage — 6 raw error.message in share/[token] | ⬜ | |
| SH-13 | MEDIUM | WAHA webhook — remove query string secret fallback | ⬜ | |
| SH-14 | MEDIUM | GST hardcoding — extract to config | ⬜ | |
| SH-15 | MEDIUM | Stale test fixture — share-route.test.ts expired date | ⬜ | |
| SH-16 | MEDIUM | Expand vitest coverage whitelist | ⬜ | |
| SH-17 | MEDIUM | Add tests for payment tracking abuse rejection | ⬜ | |
| SH-18 | MEDIUM | select("*") cleanup — all ~143 occurrences | ⬜ | |
| SH-19 | MEDIUM | Split oversized files (13 files > 800 lines) | ⬜ | |
| SH-20 | MEDIUM | Add rate limits to assistant/reputation/social dispatchers | ⬜ | |
| SH-21 | LOW | CLAUDE.md — fix Next version, proxy.ts ref, 6 catch-alls | ⬜ | |
