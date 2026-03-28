# Diff Report Template

When `diff=true`, compare current run with the most recent previous audit in `playwright-qa-screenshots/audit-*/REPORT.md`.

## Template

```markdown
# Audit Comparison: {current_date} vs {previous_date}

## Health Trend

| Metric | Previous | Current | Delta | Trend |
|--------|----------|---------|-------|-------|
| Routes passing | {n}/22 | {n}/22 | {+/-n} | {arrow} |
| Console errors (total) | {n} | {n} | {+/-n} | {arrow} |
| A11y violations | {n} | {n} | {+/-n} | {arrow} |
| Touch target fails | {n} | {n} | {+/-n} | {arrow} |
| Avg load time (ms) | {n} | {n} | {+/-n}ms | {arrow} |
| Forms with validation | {n}/{total} | {n}/{total} | | |
| Dark mode issues | {n} | {n} | {+/-n} | {arrow} |
| Security (auth bypass) | {n} | {n} | {+/-n} | {arrow} |

## New Issues (not in previous run)

| ID | Severity | Suite | Description |
|----|----------|-------|-------------|

## Regressions (was passing, now failing)

| ID | Severity | Suite | What Changed |
|----|----------|-------|-------------|

## Fixed Since Last Run (was failing, now passing)

| ID | Severity | Suite | How Fixed |
|----|----------|-------|-----------|

## Unchanged Issues (still open)

| ID | Severity | Suite | Description |
|----|----------|-------|-------------|
```

## How to Generate

1. Read previous `REPORT.md` — extract suite results and issue counts
2. Run current audit — collect same metrics
3. Compare row by row:
   - Same issue ID in both → "Unchanged"
   - In current but not previous → "New"
   - In previous but not current → "Fixed"
   - Was passing in previous, failing now → "Regression" (flag with warning)
4. Calculate deltas for health metrics
5. Use arrows: `+` improvements, `-` regressions, `=` no change
