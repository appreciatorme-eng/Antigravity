# Suite S11: E2E Journeys — Full Customer Flow with Recording

**Category**: E2E
**Duration**: ~10 min
**Requires Auth**: Yes

## What It Tests

Complete end-to-end customer journey: login, add a client, create a trip, visit invoice studio, and compose a message in inbox. Uses video recording and tracing for debugging failures.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# Start video recording and tracing
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli video-start "$OUTDIR/videos/s11-e2e-journey.webm"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli tracing-start "$OUTDIR/traces/s11-e2e-journey.zip"

# === Step 1: Navigate to Clients and Add Client ===
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s11-e2e/step1-clients-list.png"

# Click Add Client
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Add Client"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot

# Fill client form
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Name" "E2E Audit Client"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Email" "e2e-audit-client@example.com"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Phone" "+919999888877"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s11-e2e/step1-client-form-filled.png"

# Submit client form
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Save"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s11-e2e/step1-client-saved.png"

# Verify success (no error boundary, check for success toast or redirect)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasError: document.body.innerText.includes('Something went wrong'), url: window.location.href })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# === Step 2: Create Trip ===
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips?create=true"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s11-e2e/step2-create-trip.png"

# Fill trip form (field names from snapshot)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Trip name" "E2E Audit Trip - Goa"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Description" "3-day beach getaway covering North Goa and South Goa"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s11-e2e/step2-trip-form-filled.png"

# Verify no errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasError: document.body.innerText.includes('Something went wrong') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# === Step 3: Visit Invoice Studio ===
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/invoices"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s11-e2e/step3-invoices.png"

# Look for invoice creation form elements
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasInvoiceForm: document.querySelectorAll('form, [role=\"form\"]').length > 0, hasClientField: !!document.querySelector('[name*=\"client\"], [placeholder*=\"client\" i], [aria-label*=\"client\" i]'), url: window.location.href })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# === Step 4: Navigate to Inbox and Compose Message ===
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s11-e2e/step4-inbox-list.png"

# Click first conversation (if any exist)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const firstConvo = document.querySelector('[data-testid=\"conversation-item\"], [role=\"listitem\"], .conversation-item'); if (firstConvo) { firstConvo.click(); return 'clicked'; } return 'no conversations found'; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s11-e2e/step4-conversation-open.png"

# Check for compose area
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasCompose: !!document.querySelector('textarea, [contenteditable], input[type=\"text\"][placeholder*=\"message\" i], [placeholder*=\"Type\" i]'), url: window.location.href })"

# Type a test message (but don't send)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Type a message" "E2E audit test message - please ignore"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s11-e2e/step4-message-typed.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# === Step 5: Verify journey completion ===
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ journeyComplete: true, finalUrl: window.location.href, hasError: document.body.innerText.includes('Something went wrong') })"

# Stop video and tracing
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli video-stop
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli tracing-stop
```

## Pass Criteria

- All 4 steps complete without error boundary
- Client form submits (or shows proper validation)
- Trip creation form accepts input
- Invoice studio loads with form elements
- Inbox shows conversation list and compose area works
- No TypeError or ReferenceError in console throughout journey
- Video recording captures full journey

## Issue Detection

- **P0 Critical**: Any step triggers error boundary — workflow is broken
- **P0 Critical**: Form submission causes 500 error
- **P1 High**: Cannot navigate between workflow steps (broken routing)
- **P1 High**: Compose area not found in inbox — messaging broken
- **P2 Medium**: Slow transitions between steps (> 3s each)
- **P3 Low**: Minor UI glitches during transitions
- Reference: severity-rules.md
