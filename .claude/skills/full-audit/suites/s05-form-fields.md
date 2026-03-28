# Suite S05: Form Fields — Valid Data Entry

**Category**: Functional
**Duration**: ~8 min
**Requires Auth**: Yes

## What It Tests

Fills each major form with valid test data to verify fields accept input correctly, AI features work (e.g., AI Describe on trips), and no console errors occur during data entry. Does NOT submit forms that create real records unless idempotent.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# --- Form 1: Create Trip ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips?create=true"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Fill trip name/title field
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Trip name" "Audit Test Trip - Rajasthan"
# Look for client selector and try to select first client
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Fill description
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Description" "A 5-day tour covering Jaipur, Jodhpur, and Udaipur with heritage hotel stays."
# Screenshot filled state
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s05-form-fields/trip-filled.png"
# Check for AI Describe button and click it if present
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('AI') || b.textContent.includes('Generate')); return btn ? btn.textContent : 'not found'; }"
# Check for console errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# --- Form 2: Add Client ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Add Client"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Fill client fields
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Name" "Audit Test Client"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Email" "audit-test@example.com"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Phone" "+919876543210"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s05-form-fields/client-filled.png"
# Check for console errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# --- Form 3: Add Driver ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/drivers"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Add Driver"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Fill driver fields
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Name" "Audit Test Driver"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Phone" "+919876543211"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s05-form-fields/driver-filled.png"
# Check for console errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# --- Form 4: Create Proposal ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/proposals/create"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Fill proposal fields (look for title, client selector, etc.)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Title" "Audit Test Proposal - Kerala Backwaters"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s05-form-fields/proposal-filled.png"
# Check for console errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# --- Form 5: Settings — Organization tab ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/settings"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s05-form-fields/settings-org.png"
# Check that settings tabs are visible
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasOrg: document.body.innerText.includes('Organization'), hasProfile: document.body.innerText.includes('Profile'), hasBranding: document.body.innerText.includes('Branding') })"
# Check for console errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# --- Form 6: Planner ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/planner"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s05-form-fields/planner.png"
# Check for console errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error
```

## Pass Criteria

- All form fields accept text input without errors
- No console errors during data entry
- Field values persist after typing (not cleared)
- Settings tabs (Organization, Profile, Branding) are all visible

## Issue Detection

- **P1 High**: Form field rejects valid input or clears on blur
- **P1 High**: Console errors during data entry (broken event handlers)
- **P2 Medium**: AI Describe button missing or non-functional
- **P3 Low**: Field labels unclear or missing placeholder text
- Reference: severity-rules.md
