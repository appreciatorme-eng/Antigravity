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

## Workflow

All projects live on `main` in the `projects/` folder. Use feature branches for work-in-progress:

```bash
# Start a new project
mkdir -p projects/my-new-idea

# Work on a feature
git checkout -b feature/marketplace-auth
# ... make changes ...
git commit -m "Add auth flow"
git push origin feature/marketplace-auth
# Create PR → merge to main
```
