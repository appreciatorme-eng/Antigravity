# Suite S04: Form Validation — Empty Submit Triggers Errors

**Category**: Functional
**Duration**: ~5 min
**Requires Auth**: Yes

## What It Tests

Opens each major form (Create Trip, Add Client, Add Driver, Create Proposal) and attempts to submit without filling any fields. Verifies that validation error messages appear and prevent submission.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# --- Form 1: Create Trip ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Click "Create Trip" button
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Create Trip"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s04-form-validation/trip-form-empty.png"
# Try to submit empty form — look for submit/save/create button
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Create"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
# Check for validation errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasValidationErrors: document.querySelectorAll('[role=\"alert\"], .text-red-500, .text-destructive, [data-state=\"invalid\"]').length > 0, errorTexts: Array.from(document.querySelectorAll('[role=\"alert\"], .text-red-500, .text-destructive')).map(e => e.textContent).filter(Boolean).slice(0, 10) })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s04-form-validation/trip-validation-errors.png"

# --- Form 2: Add Client ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Click "Add Client" button
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Add Client"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s04-form-validation/client-form-empty.png"
# Submit empty
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Save"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasValidationErrors: document.querySelectorAll('[role=\"alert\"], .text-red-500, .text-destructive, [data-state=\"invalid\"]').length > 0, errorTexts: Array.from(document.querySelectorAll('[role=\"alert\"], .text-red-500, .text-destructive')).map(e => e.textContent).filter(Boolean).slice(0, 10) })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s04-form-validation/client-validation-errors.png"

# --- Form 3: Add Driver ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/drivers"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Click "Add Driver" button
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Add Driver"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s04-form-validation/driver-form-empty.png"
# Submit empty
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Save"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasValidationErrors: document.querySelectorAll('[role=\"alert\"], .text-red-500, .text-destructive, [data-state=\"invalid\"]').length > 0, errorTexts: Array.from(document.querySelectorAll('[role=\"alert\"], .text-red-500, .text-destructive')).map(e => e.textContent).filter(Boolean).slice(0, 10) })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s04-form-validation/driver-validation-errors.png"

# --- Form 4: Create Proposal ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/proposals/create"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s04-form-validation/proposal-form-empty.png"
# Submit empty — look for submit/create/save button
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Create"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasValidationErrors: document.querySelectorAll('[role=\"alert\"], .text-red-500, .text-destructive, [data-state=\"invalid\"]').length > 0, errorTexts: Array.from(document.querySelectorAll('[role=\"alert\"], .text-red-500, .text-destructive')).map(e => e.textContent).filter(Boolean).slice(0, 10) })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s04-form-validation/proposal-validation-errors.png"
```

## Pass Criteria

- All 4 forms show validation error messages on empty submit
- `hasValidationErrors` is `true` for each form
- No form silently submits with empty fields
- No console errors during validation

## Issue Detection

- **P0 Critical**: Form submits successfully with empty required fields
- **P1 High**: No visible validation error messages (silent failure)
- **P2 Medium**: Validation messages are present but not visually clear (e.g., missing red styling)
- Reference: severity-rules.md
