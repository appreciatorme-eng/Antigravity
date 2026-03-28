# /full-audit — Complete E2E Quality Audit

Run a comprehensive quality audit on TripBuilt using playwright-cli. Tests 20 suites covering security, functionality, accessibility, performance, and more.

## Usage

```
/full-audit                     # Full 20-suite audit (~20 min)
/full-audit quick               # S01+S02+S12 only (~3 min)
/full-audit security            # S01+S14 (~3 min)
/full-audit a11y                # S07 (~5 min)
/full-audit forms               # S04+S05+S09 (~8 min)
/full-audit perf                # S08 (~3 min)
/full-audit e2e                 # S11 with video (~10 min)
/full-audit dark                # S06 (~5 min)
/full-audit devices             # S10 (~8 min)
/full-audit api                 # S13 (~5 min)
/full-audit suite=S01,S07,S12   # Custom selection
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `base` | `prod` | `prod` = tripbuilt.com, `local` = localhost:3000 |
| `viewport` | `390x844` | Override default viewport |
| `video` | `false` | Record WebM video of each suite |
| `trace` | `false` | Capture Playwright traces |
| `diff` | `false` | Compare with last run |

## CRITICAL: Tool Requirements

- Use ONLY `playwright-cli` bash commands (NOT MCP playwright tools)
- Prefix every command: `export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli ...`
- Read config from `.claude/skills/full-audit/config.md`
- Read suite definitions from `.claude/skills/full-audit/suites/`
- Read severity rules from `.claude/skills/full-audit/references/severity-rules.md`

## Execution Flow

### Phase 0: Setup

```bash
# Create timestamped output directory
DATE=$(date +%Y-%m-%d)
OUTDIR="projects/travel-suite/apps/web/playwright-qa-screenshots/audit-$DATE"
mkdir -p "$OUTDIR"/{s01-security,s02-routes,s03-navigation,s04-form-validation,s05-form-fields,s06-dark,s07-accessibility,s08-performance,s09-edge-cases,s10-devices,s11-e2e,s12-console,s13-api,s14-links,s15-images,s16-whatsapp,s17-payment,s18-realtime,s19-offline,s20-seo,videos,traces}
```

Read config: `.claude/skills/full-audit/config.md` for credentials, routes, viewports.

### Phase 1: Login & State Save

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
playwright-cli open "$BASE_URL/auth"
playwright-cli resize 390 844
# Snapshot → find refs → fill email/password → click submit
playwright-cli eval "() => new Promise(r => setTimeout(r, 4000))"
# Verify redirect to /admin
playwright-cli state-save "$OUTDIR/auth-state.json"
```

### Phase 2: Run Suites

For each suite in the selected mode:

1. Read the suite file from `suites/sXX-name.md`
2. Execute its commands sequentially
3. Collect results: `{ suite, pass, fail, issues[] }`
4. Screenshot at each checkpoint
5. If `video=true`: `playwright-cli video-start` before, `video-stop` after
6. If `trace=true`: `playwright-cli tracing-start` before, `tracing-stop` after

### Phase 3: Generate Report

Write `$OUTDIR/REPORT.md` using the template in `references/diff-report.md`:

```markdown
# TripBuilt Full Audit Report

**Date**: YYYY-MM-DD
**Target**: {base_url}
**Viewport**: {viewport}
**Suites Run**: {count}/{total}
**Duration**: {minutes}

## Summary
| Severity | New | Existing | Total |
|----------|-----|----------|-------|

## Per-Suite Results
| Suite | Pass | Fail | New Issues |
|-------|------|------|------------|

## New Issues Found
| ID | Severity | Suite | Description |

## Regression Check (if diff=true)
| Metric | Previous | Current | Delta |
```

### Phase 4: Update Tracker

1. Read `QA_ISSUE_TRACKER.md`
2. Find highest QA-XXX ID
3. For each new issue: assign next ID, classify severity per `severity-rules.md`
4. Append to appropriate section
5. Update summary counts

### Phase 5: Persist & Notify

```bash
# Save to Engram for cross-session recall
mem_save topic_key="audit/$DATE" content="Audit found N new issues..."

# Close browser
playwright-cli close
```

### Phase 6: Cleanup

- Close browser sessions
- If `base=local` and we started the server, kill it
- Print final summary to user

## Suite Mode Mapping

| Mode | Suites |
|------|--------|
| `full` (default) | S01-S20 |
| `quick` | S01, S02, S12 |
| `security` | S01, S14 |
| `a11y` | S07 |
| `forms` | S04, S05, S09 |
| `perf` | S08 |
| `e2e` | S11 |
| `dark` | S06 |
| `devices` | S10 |
| `api` | S13 |

## Error Handling

| Scenario | Action |
|----------|--------|
| Login fails | Retry once with fresh snapshot refs |
| Session expires mid-suite | `state-load` from saved state, retry |
| Page crash (error boundary) | Screenshot, log as P0, continue next route |
| playwright-cli not found | STOP — tell user to install |
| Timeout on page load | Log as P1, screenshot, continue |
