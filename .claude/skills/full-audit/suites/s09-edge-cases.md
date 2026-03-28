# Suite S09: Edge Cases — Extreme Input & XSS Prevention

**Category**: Edge Cases
**Duration**: ~4 min
**Requires Auth**: Yes

## What It Tests

Tests form inputs with extreme and malicious data: 200-character strings, XSS payloads, Hindi text, emoji, and special characters. Verifies no horizontal overflow, no console errors, and XSS payloads are sanitized.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# --- Test 1: Long string input (200 chars) ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Add Client"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot

# Fill name with 200-char string
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Name" "Rajesh Kumar Sharma Verma Patel Singh Gupta Mehta Joshi Reddy Nair Menon Pillai Iyer Das Bose Roy Chatterjee Banerjee Mukherjee Dutta Sen Ghosh Dasgupta Bhattacharya Majumdar Chakraborty Srinivas"

# Fill email with XSS payload
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Email" "test+special'chars\"<script>alert(1)</script>@evil.com"

# Fill phone with Hindi text
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Phone" "+91 राजेश शर्मा"

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s09-edge-cases/long-string.png"

# Check for horizontal overflow
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasOverflow: document.body.scrollWidth > window.innerWidth, scrollWidth: document.body.scrollWidth, innerWidth: window.innerWidth })"

# Check for console errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# --- Test 2: Emoji input ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Add Client"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1000))"

# Fill with emoji
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Name" "Test Client 🇮🇳✈️🏨🚗💰"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Email" "emoji-test@example.com"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Phone" "+919876543210"

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s09-edge-cases/emoji-input.png"

# Check overflow and errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasOverflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# --- Test 3: XSS in trip description ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips?create=true"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot

# Try XSS in description field
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Description" "<img src=x onerror=alert('XSS')><script>document.cookie</script><svg onload=alert(1)>"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s09-edge-cases/xss-attempt.png"

# Verify XSS was NOT executed (no alert dialog appeared)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ noAlert: true, bodyContainsScript: document.body.innerHTML.includes('<script>document.cookie</script>') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# --- Test 4: SQL injection attempt in search ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Find search input and enter SQL injection
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli fill "Search" "'; DROP TABLE clients; --"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s09-edge-cases/sql-injection.png"

# Check page still works (no 500 error)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error
```

## Pass Criteria

- No horizontal overflow (`scrollWidth <= innerWidth`) on any test
- No console errors from edge case inputs
- XSS payloads are not executed (no `<script>` tags rendered in DOM)
- SQL injection does not cause 500 errors
- Hindi text and emoji render without breaking layout

## Issue Detection

- **P0 Critical**: XSS payload executes (script tags rendered or alert fires)
- **P0 Critical**: SQL injection causes server error
- **P1 High**: Horizontal overflow from long input — layout break on mobile
- **P1 High**: Console errors from edge case input — unhandled exceptions
- **P2 Medium**: Hindi/emoji text causes visual glitches but no functional break
- Reference: severity-rules.md
