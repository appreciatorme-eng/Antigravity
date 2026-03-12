Performance-focused review scoped to changed files. Use when adding new database queries, heavy components, or dependencies.

## Phase 1: Scope

1. Run `git diff main...HEAD --name-only` — filter to performance-relevant files:
   - `src/app/api/` and `src/lib/` (server-side queries)
   - `src/components/` and `src/features/` (React components)
   - `package.json` (new dependencies)
2. Search Engram: `mem_search("performance reviewed accepted")` — suppression list

## Phase 2: Deterministic Performance Checks (parallel)

- `supabase get_advisors performance` — missing indexes, unoptimized queries
- `npm run test:coverage` — ensure no coverage regression
- Check bundle impact: `git diff main...HEAD -- package.json` for new dependencies

## Phase 3: Performance Review

For each changed file, check:

**Server-Side (API handlers, lib functions):**
- N+1 queries: loops containing `supabase.from()` calls? Should be single query with joins or `.in()`
- Missing `.select()` specificity: selecting `*` when only a few columns needed?
- Unbounded queries: missing `.limit()` on list endpoints?
- Blocking operations in async paths: `fs.readFileSync`, heavy computation without offloading?

**Client-Side (React components):**
- Expensive computation in render body? Should use `useMemo`
- Event handlers recreated every render? Should use `useCallback`
- `useEffect` with fetch/polling missing `AbortController` cleanup?
- Large component (>400 lines) that could benefit from code splitting via `React.lazy`?
- Importing heavy libraries at top-level that could be dynamically imported?

**Dependencies:**
- New package added? Check bundle size impact (bundlephobia)
- Duplicate functionality with existing packages?
- Is it a dev dependency accidentally in `dependencies`?

**Database (if SQL/Supabase changes):**
- New table missing indexes on frequently queried columns?
- New RPC function with sequential scans?

**SKIP findings matching Engram suppression list.**

## Phase 4: Report

Output findings table with severity, file:line, issue, estimated impact, and NEW/RECURRING status.

## Phase 5: Persist

Save each finding to Engram with topic_key `review/perf/<component-or-endpoint>`.
