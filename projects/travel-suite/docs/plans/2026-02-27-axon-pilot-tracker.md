# Axon Pilot Tracker (2026-02-27)

## Goal
- Validate Axon as a developer-only code intelligence assistant for `projects/travel-suite` before any broader rollout.

## Guardrails
- Do not add Axon as a production/runtime dependency.
- Do not make Axon checks CI-blocking during pilot.
- Keep index and local tool artifacts out of git.

## Phase 1: Setup (Completed)
- [x] Added helper command wrapper: `scripts/axon.sh`
- [x] Added local artifact ignore rules:
  - `.venv-axon/`
  - `.axon/`
- [x] Indexed current codebase once (fast mode): `./scripts/axon.sh analyze`

## Baseline Snapshot
- Date: 2026-02-27
- Indexed files: `494`
- Symbols: `2279`
- Relationships: `6888`
- Clusters: `95`
- Flows: `180`
- Dead-code candidates: `528`
- Runtime: `~49s` (`--no-embeddings`)

## Embedding Run Snapshot
- Date: 2026-02-27
- Command: `./scripts/axon.sh analyze --full --with-embeddings`
- Indexed files: `494`
- Symbols: `2279`
- Relationships: `6888`
- Clusters: `95`
- Flows: `180`
- Dead-code candidates: `528`
- Embeddings: `2773`
- Runtime: `148.39s`

## Findings (Current)
- Impact analysis is immediately useful for targeted refactors:
  - `impact(getNextInvoiceNumber)` shows a small blast radius (single direct caller: invoices `POST` route).
- Semantic queries with embeddings improve discovery quality:
  - Natural-language query for invoice branding/billing surfaced organization snapshot and billing-address paths.
- Dead-code output has high volume (`528`) and includes likely false positives in UI handlers:
  - Use as a triage queue, not automatic deletion input.
- Recommendation remains unchanged:
  - Keep Axon non-blocking and developer-local during the pilot window.

## Phase 2: Team Trial (Next 1-2 sprints)
- [ ] Use `./scripts/axon.sh impact <symbol>` before risky API refactors.
- [ ] Use `./scripts/axon.sh context <symbol>` during code reviews.
- [ ] Track at least 5 examples where Axon changed review/test scope.
- [ ] Record false positives or low-value outputs for reassessment.

## Success Criteria
- At least 3 concrete regressions avoided or review gaps caught.
- Time-to-locate-impact reduced for non-trivial changes.
- Team reports net positive signal vs noise.

## Reassessment Checkpoint
- Target reassessment date: 2026-03-13
- Decision options:
  - Keep as optional local tooling
  - Standardize for dev workflow (still non-blocking)
  - Drop if signal/noise is poor
