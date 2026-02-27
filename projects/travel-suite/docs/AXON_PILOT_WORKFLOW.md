# Axon Pilot Workflow

This project uses Axon as a **local developer assistant** for code intelligence.

## 1) Quick Start

From `projects/travel-suite`:

```bash
./scripts/axon.sh analyze
./scripts/axon.sh status
```

Default analyze mode uses `--no-embeddings` for fast iteration.

If you want semantic ranking enabled:

```bash
./scripts/axon.sh analyze --with-embeddings
```

Current baseline on this repo (2026-02-27):
- Fast mode (`--no-embeddings`): ~49s
- Full semantic mode (`--with-embeddings`): 148.39s, 2773 embeddings

## 2) Daily Usage

```bash
# Find invoice-related symbols grouped by flow
./scripts/axon.sh query "invoice"

# Inspect one symbol with callers/callees
./scripts/axon.sh context "getNextInvoiceNumber"

# Check blast radius before refactor
./scripts/axon.sh impact "getNextInvoiceNumber" 4

# Review dead-code candidates
./scripts/axon.sh dead-code
```

## 3) MCP Mode for AI Agents (Optional)

Run Axon MCP server with live watch:

```bash
./scripts/axon.sh mcp
```

Then configure your MCP client to run:

```json
{
  "mcpServers": {
    "axon": {
      "command": "./scripts/axon.sh",
      "args": ["mcp"]
    }
  }
}
```

## 4) Guardrails

- Pilot only: do not make Axon mandatory in CI.
- Use output as guidance, not as an absolute source of truth.
- Keep `.axon/` and `.venv-axon/` uncommitted.

## 5) Findings From First Pilot Pass

- Best current value:
  - `impact` before refactors.
  - `context` during review.
  - `query` for semantic exploration of unfamiliar areas.
- Dead-code results are high-volume and noisy; treat as review candidates only.
