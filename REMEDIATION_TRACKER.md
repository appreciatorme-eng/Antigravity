# Remediation Tracker S44
**Date**: 2026-03-28 | **Branch**: `fix/remediation-s44` | **Source**: QA_ISSUE_TRACKER.md (R1-R8 mobile audit)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## CRITICAL (2)

| ID | Finding | Action | Status |
|----|---------|--------|--------|
| QA-025 | `/bookings` accessible without auth | Add to middleware protected prefixes | ✅ |
| QA-026 | `/billing` accessible without auth | Add to middleware protected prefixes | ✅ |

## HIGH (6)

| ID | Finding | Action | Status |
|----|---------|--------|--------|
| QA-002 | FAB Quick Quote — dead button | Remove from FAB_ACTIONS | ✅ |
| QA-003 | `/trips/new` → "Trip not found" | Redirect to /trips?create=true | ✅ |
| QA-004 | Dark mode Settings labels invisible | Add dark:text-slate-300, dark:bg-slate-800 | ✅ |
| QA-005 | AI FAB overlaps modals | Hide when [role=dialog] exists | ✅ |
| QA-006 | Proposal client dropdown empty in demo | Load DEMO_CLIENTS in useProposalData | ✅ |
| QA-027 | Clients: 32 unlabeled buttons | Add aria-labels | ⏳ |

## MEDIUM (8 fixable + 3 documented)

| ID | Finding | Action | Status |
|----|---------|--------|--------|
| QA-007 | Touch targets below 44px | Increase min-h on small buttons | ⏳ |
| QA-008 | Demo banner viewport | 📝 Intentional — dismissible | 📝 |
| QA-009 | Inbox dark mode contrast | Improve conversation item contrast | ⏳ |
| QA-010 | Template list empty | 📝 Linked to QA-006 | 📝 |
| QA-011 | AI FAB overlaps More drawer | Fixed by QA-005 | ✅ |
| QA-012 | Settings tabs tight | Increase gap | ⏳ |
| QA-013 | Client modal no scroll | max-h 70vh on mobile | ✅ |
| QA-028 | Inbox: 10 unlabeled buttons | Add aria-labels | ⏳ |
| QA-029 | Clients: 10 empty links | Add aria-labels | ⏳ |
| QA-030 | Social Studio slow | 📝 Defer to perf sprint | 📝 |
| QA-031 | Heading skip h1→h3 | Changed KPICard h3→div | ✅ |

## LOW (3 fixable + 11 documented)

| ID | Finding | Action | Status |
|----|---------|--------|--------|
| QA-032 | Settings: 4 inputs without labels | Added aria-labels to all 5 inputs | ✅ |
| QA-033 | Inbox: 1 unlabeled toggle | Add aria-label | ⏳ |
| QA-015–024, QA-034 | 11 minor/design items | 📝 Documented — defer | 📝 |

## Test Suite Status
- Lint: PASS (0 new errors — 17 pre-existing)
- Typecheck: PASS (0 errors)
- Vitest: skipped (no test changes)

## Commit Log
| Phase | Commit | Summary |
|-------|--------|---------|
| Setup | ed9e6ad3 | Create remediation tracker s44 |
| CRITICAL+HIGH | 9933c871 | Fix QA-025/026/002/003/004/005 (security + functional) |
| Finalize | e9255dba | Update tracker statuses |
| MEDIUM+LOW | 8e69fd5f | Fix QA-006/013/031/032 (demo clients, modal scroll, a11y) |
