# Suite S19: Offline — Network Failure Resilience

**Category**: Edge Cases
**Duration**: ~3 min
**Requires Auth**: Yes

## What It Tests

Simulates network failure by intercepting all requests with 503 status. Checks if the app shows a user-friendly error boundary or offline fallback instead of crashing. Then restores network and verifies the page recovers.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# Navigate to app first (ensure it loads normally)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s19-offline/before-offline.png"

# --- Step 1: Simulate offline by intercepting all network requests ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli route "**/*" --status=503
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 500))"

# Try to navigate to a new page (should fail gracefully)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 3000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s19-offline/offline-trips.png"

# Check what the user sees
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasErrorBoundary: document.body.innerText.includes('Something went wrong') || document.body.innerText.includes('error'), hasOfflineMessage: document.body.innerText.includes('offline') || document.body.innerText.includes('Offline') || document.body.innerText.includes('network') || document.body.innerText.includes('Network'), hasRetryButton: !!Array.from(document.querySelectorAll('button')).find(b => b.textContent?.toLowerCase().includes('retry') || b.textContent?.toLowerCase().includes('try again') || b.textContent?.toLowerCase().includes('reload')), bodyText: document.body.innerText.slice(0, 200) })"

# Try another page while offline
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 3000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s19-offline/offline-clients.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasErrorBoundary: document.body.innerText.includes('Something went wrong') || document.body.innerText.includes('error'), url: window.location.href })"

# --- Step 2: Restore network ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli unroute "**/*"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 500))"

# Navigate again — should work now
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 3000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s19-offline/after-recovery.png"

# Verify recovery
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ recovered: !document.body.innerText.includes('Something went wrong'), hasNav: !!document.querySelector('nav'), url: window.location.href })"

# Check for console errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error
```

## Pass Criteria

- App shows error boundary or offline fallback when network is down (not blank page)
- Retry/reload button is present in error state
- App recovers fully after network is restored
- No uncaught exceptions that permanently break the app

## Issue Detection

- **P1 High**: Blank white page during offline — no error boundary
- **P1 High**: App does not recover after network restoration — stuck in error state
- **P2 Medium**: Error boundary shows but no retry/reload button — user must manually refresh
- **P2 Medium**: Console filled with unhandled promise rejections
- **P3 Low**: Error message is generic (not user-friendly)
- Reference: severity-rules.md
