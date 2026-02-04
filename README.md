# Antigravity

Multi-project AI agent workspace.

## Structure

```
Antigravity/
├── skills/           # Shared skills (available to all projects)
│   ├── xlsx/
│   ├── pdf/
│   ├── mcp-builder/
│   └── ...
└── projects/         # Project-specific work
    └── milesmarketplace/
        ├── agents.md
        ├── directives/
        └── execution/
```

## Branches

Each major project has its own branch:
- `main` - Core shared resources
- `milesmarketplace` - Miles Marketplace project

## Skills

Skills are imported from [anthropics/skills](https://github.com/anthropics/skills) and live at the root so all projects can use them.
