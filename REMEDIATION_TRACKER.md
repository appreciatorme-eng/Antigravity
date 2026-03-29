# Remediation Tracker s45
**Date**: 2026-03-28 | **Branch**: `fix/remediation-s45` | **Source**: /full-audit R10

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH (2)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| QA-035 | `/social`: 11 buttons without aria-label | ContentBar.tsx | Add aria-labels to icon-only buttons | 3 icon-only buttons fixed; other files already had text labels | ✅ |
| QA-036 | `/api/admin/operations/stats` returns 404 | Audit config error | Correct endpoint is `/api/admin/operations/command-center` | Updated audit config.md | 📝 |

## MEDIUM (4)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| QA-037 | Settings form: white bg in dark mode | 7 settings tab files | Add dark: variants to input fields | Added dark:bg-slate-800 dark:text-white across ProfileTab, EInvoicingTab, MapsDataSection, PaymentsTab, ReviewsTab, SecurityTab, settings page | ✅ |
| QA-038 | `/proposals`: 6 links without text/aria-label | proposals/page.tsx | Add aria-labels to card links | Added aria-labels to Copy Link, Delete, and ChevronRight per proposal row | ✅ |
| QA-039 | `/reputation` slowest page at 1369ms | Reputation page | Needs profiling — defer to dedicated perf sprint | | 📝 |
| QA-040 | Marketing pages missing og:image, canonical, robots | layout.tsx, marketing layout | Add meta tags | Added metadataBase, openGraph.images, canonical to root + marketing layouts | ✅ |

## LOW (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| QA-041 | Auth page missing og:image, canonical | Root layout inherits | Inherits from root layout metadataBase + og:image | Already handled by QA-040 root layout fix | ✅ |
| QA-042 | Invalid login returns 400 instead of 401 | Auth handler | Already returns 401 | Prior commit 18506878 already fixed this; 400 is for malformed requests (correct) | 📝 |
| QA-043 | `/clients`: 42 touch targets below 44px | Client pipeline cards | Large scope — needs design review | | 📝 |

## Test Suite Status
- Vitest: pending
- Lint: pending
- TypeCheck: pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| Setup | 989ee8ad | 2026-03-28 | chore: create remediation tracker s45 |
