# Remediation Tracker S43
**Date**: 2026-03-23 | **Branch**: `fix/remediation-s43` | **Source**: /remediate (post-audit)

## Legend
- ✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## CRITICAL (0)
No critical findings.

## HIGH (0)
All HIGH findings from S37 were resolved in S42.

## MEDIUM (2)
| ID | Finding | File/Location | Action | Outcome | Status |
|----|---------|---------------|--------|---------|--------|
| M-01 | `auth_rls_initplan` on `e_invoice_settings` — `auth.uid()` evaluated per-row | Supabase RLS policy | Migration: wrap in `(select auth.uid())` | Applied via Supabase MCP, verified policy updated | ✅ |
| M-02 | Leaked password protection disabled | Supabase Auth dashboard | Dashboard toggle — not code | Requires manual toggle in Supabase dashboard | 📝 |

## LOW (2)
| ID | Finding | File/Location | Action | Outcome | Status |
|----|---------|---------------|--------|---------|--------|
| L-01 | 156 unused indexes across tables | Supabase performance advisor | Deferred to DB optimization sprint | Index cleanup requires careful analysis | 📝 |
| L-02 | 1 unindexed FK: `crm_contacts.assigned_to` | Supabase performance advisor | Deferred to DB optimization sprint | Low query volume on this FK | 📝 |

## Accepted / Intentional (3)
| ID | Finding | Reason |
|----|---------|--------|
| A-01 | `proposal_activities` RLS `USING (true)` | Client portal — guests interact without auth via /p/[token] |
| A-02 | `proposal_add_ons` RLS `USING (true)` | Client portal — guests update add-on selections |
| A-03 | `proposal_comments` RLS `WITH CHECK (true)` | Client portal — guests post comments on proposals |

## Test Suite Status
- Lint: ✅ 0 warnings
- TypeCheck: ✅ 0 errors
- Vitest: ⚠️ Skipped — rolldown native binding corruption (pre-existing, unrelated)
- Playwright E2E: N/A — pure DB migration, no UI/API code changes

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| Setup | faf266c6 | 2026-03-23 | Create remediation tracker s43 |
| M-01 | (migration) | 2026-03-23 | Fix auth_rls_initplan on e_invoice_settings |
| Final | — | 2026-03-23 | Finalize tracker, merge to main |
