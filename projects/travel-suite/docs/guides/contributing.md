# Contributing Guide

Guidelines for contributing to TripBuilt.

---

## Code Style

### Immutability

Always create new objects instead of mutating existing ones:

```typescript
// Wrong: mutating in place
user.name = 'New Name';

// Correct: creating a new object
const updatedUser = { ...user, name: 'New Name' };
```

### File Size

- Target: 200-400 lines per file
- Maximum: 800 lines
- If a file exceeds 800 lines, extract utilities or sub-components

### Functions

- Keep functions under 50 lines
- Avoid nesting deeper than 4 levels
- Use descriptive names that convey intent

### Error Handling

- Handle errors explicitly at every level
- Provide user-friendly messages in UI code
- Log detailed context on the server side via `src/lib/observability/logger.ts`
- Never silently swallow errors

### Input Validation

- Validate all user input at system boundaries
- Use Zod schemas for request body validation
- Fail fast with clear error messages

### Constants

- No hardcoded values -- use constants or environment variables
- No magic numbers without explanation

---

## Git Workflow

### Commit Messages

Use conventional commit format:

```
<type>: <description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

Examples:
```
feat: add driver assignment notification via WhatsApp
fix: prevent duplicate payment webhook processing
refactor: extract rate limit config to shared module
```

### Staging Files

Always stage specific files from the **repository root**:

```bash
git add projects/travel-suite/apps/web/src/lib/new-feature.ts
```

Never use `git add .` or `git add -u` -- these risk including unintended files.

---

## Pull Request Process

1. Create a feature branch from `main`
2. Implement the feature following the patterns below
3. Run verification locally:
   ```bash
   cd projects/travel-suite/apps/web
   npm run lint        # Zero warnings required
   npm run typecheck   # No type errors
   npm run test:coverage  # 80%+ lines, 90%+ functions, 75%+ branches
   ```
4. Push and create a PR targeting `main`
5. CI runs automatically (lint, typecheck, build, security audit, dependency review)
6. Address review feedback
7. Merge to `main` triggers automatic Vercel deployment

---

## Review Commands

The project supports automated review commands:

| Command | When to Use | Scope |
|---------|-------------|-------|
| `/review` | After every feature branch, before PR | Changed files only |
| `/review-security` | New API endpoints, auth changes | Security-focused |
| `/review-perf` | New queries, heavy components | Performance-focused |
| `/review-deep` | Before major releases | Full codebase |
| `/remediate` | After any `/review` command | Auto-fix findings by severity |

---

## Testing Requirements

- Minimum 80% code coverage before PR
- Write tests first (TDD approach preferred)
- Unit tests for all new utilities and handler logic
- See [testing-guide.md](./testing-guide.md) for framework details and patterns

---

## API Conventions

### Use Catch-All Dispatchers

All new API endpoints must go through the catch-all dispatchers. Never create direct route files like `src/app/api/my-endpoint/route.ts`.

To add a new endpoint:

1. Create a handler file in `src/app/api/_handlers/<domain>/<endpoint>/route.ts`
2. Export the HTTP method functions (`GET`, `POST`, etc.)
3. Register the handler in the appropriate catch-all route array

The catch-all dispatchers provide built-in:
- Rate limiting
- CSRF protection for mutations
- CORS headers
- Consistent error handling

### Migrate on Touch

When modifying an existing direct route (legacy pattern) for any feature work, migrate it into the catch-all as part of the same PR.

### API Response Format

Use the standard response helpers:

```typescript
import { apiSuccess, apiError } from '@/lib/api/response';

// Success
return apiSuccess({ data: result });

// Error
return apiError('Resource not found', 404);
```

---

## Component Rules

### Minimum Size for Extraction

Do not extract a component into its own file if it is under 60 lines and used only once. Keep it co-located in the parent file.

### Maximum Fragmentation

Aim for 4-6 sub-components per parent component. Each file should justify its existence. Do not split into 8-10 tiny files.

### Test Before Extracting

1. Write (or verify) a test for the parent component's behavior
2. Extract the sub-component
3. Verify the test still passes

---

## Error Boundaries

All route groups use a shared re-export pattern for error boundaries:

```tsx
// src/app/(admin)/error.tsx
export { RouteError as default } from '@/components/shared/RouteError';
```

When adding a new route group, create `error.tsx` as a one-line re-export. Never copy-paste the full error component.

---

## Environment Variables

- Never hardcode secrets in source code
- Add new variables to the Zod schema in `src/env.ts`
- Document new variables in [env-vars.md](./env-vars.md)
- Set values in the Vercel dashboard, not in `.env` files

---

## Checklist Before Submitting

- [ ] Code follows immutability patterns
- [ ] Functions are under 50 lines
- [ ] Files are under 800 lines
- [ ] No deep nesting (> 4 levels)
- [ ] Errors handled at every level
- [ ] No hardcoded secrets or magic numbers
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run typecheck` passes
- [ ] `npm run test:coverage` meets thresholds
- [ ] New API endpoints use catch-all dispatchers
- [ ] New env vars added to Zod schema and documented
