Incremental code review scoped to changes since main. Use after finishing a feature branch, before opening a PR.

## Phase 1: Scope

1. Run `git diff main...HEAD --name-only` to list changed files
2. Run `git diff main...HEAD` and pipe to `axon_detect_changes` to get changed symbols with file+line ranges
3. Search Engram: `mem_search("reviewed accepted")` — build suppression list of past-accepted findings
4. If no changed files, report "Nothing to review" and stop

## Phase 2: Deterministic Checks (run ALL in parallel)

Run these from `projects/travel-suite/apps/web/`:

- `npm run lint` (zero-warning policy)
- `npm run typecheck`
- `contextplus run_static_analysis` on changed files only
- `supabase get_advisors security`
- `supabase get_advisors performance`
- `npm run test:coverage` (thresholds: 80% lines, 90% functions, 75% branches)

If any CRITICAL failures (lint errors, type errors, test failures), report them and stop. Do not proceed to AI review until deterministic checks pass.

## Phase 3: Targeted AI Review

For each changed symbol from Phase 1:

1. `axon_context <symbol>` — understand the symbol's role and connections
2. `axon_impact <symbol>` — check blast radius (callers, dependents)
3. `contextplus get_file_skeleton <file>` — read API surface only (not full file)
4. Only if needed: `Read` the specific function using line ranges from Axon

Review against this project-specific checklist:

**Security:**
- New API endpoint? Must use rate limiting from `src/lib/security/rate-limit.ts`
- Admin mutation? Must use CSRF guard from `src/lib/security/admin-mutation-csrf.ts`
- Token/secret comparison? Must use `src/lib/security/safe-equal.ts`
- User input? Must have Zod schema validation
- Cron handler? Must verify `CRON_SECRET` and export only `POST`

**API patterns:**
- Handler response? Should use `apiSuccess`/`apiError` from `src/lib/api/response.ts`
- New handler file? Must be registered in catch-all via `createCatchAllHandlers()`
- Database types? Should use generated types from `src/lib/supabase/database.types.ts`

**Frontend patterns:**
- `useEffect` with fetch/polling? Must have `AbortController` cleanup
- Expensive computation in render? Should use `useMemo`/`useCallback`
- New component >400 lines? Flag for splitting

**SKIP any finding that matches the Engram suppression list from Phase 1.**

## Phase 4: Report

Output a compact findings table:

| Sev | Category | File:Line | Finding | Status |
|-----|----------|-----------|---------|--------|

- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Status: NEW (first time seen) / RECURRING (seen before, not yet fixed)
- Include deterministic check results summary at the top

## Phase 5: Persist

For each finding, save to Engram:
- `mem_save` with type "review-finding" and topic_key like `review/<category>/<short-desc>`
- For items the user marks as "accepted", save with type "decision" so future reviews skip them
- Include commit hash, file path, and verdict in the content
