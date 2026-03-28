# Suite S01: Security — Auth Gate Verification

**Category**: Security
**Duration**: ~3 min
**Requires Auth**: No (tests unauthenticated access)

## What It Tests

Verifies that all 22 protected routes redirect unauthenticated users to `/auth`. Uses a separate unauth session (`-s=unauth`) to ensure no saved credentials leak into the test.

## Commands

```bash
# Setup: open browser in unauth session at default mobile viewport
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli open "https://www.tripbuilt.com/auth" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844 -s=unauth

# Test each protected route — navigate and check if redirected to /auth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/home.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/inbox.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/trips.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/clients.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/proposals" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/proposals.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/bookings" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/bookings.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/planner" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/planner.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/calendar" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/calendar.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/drivers" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/drivers.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/invoices" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/invoices.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/revenue" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/revenue.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/pricing" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/pricing.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/operations" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/operations.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/marketplace" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/marketplace.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/reputation" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/reputation.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/social" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/social.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/insights" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/insights.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/referrals" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/referrals.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/settings" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/settings.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/billing" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/billing.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/add-ons" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/add-ons.png" -s=unauth

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/support" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname" -s=unauth
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s01-security/support.png" -s=unauth

# Cleanup
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli close -s=unauth
```

## Pass Criteria

- ALL 22 protected routes must redirect to `/auth` (pathname === "/auth")
- No protected page content visible without authentication

## Issue Detection

- **P0 Critical**: Any route that does NOT redirect to /auth — user can access protected data without login
- **P1 High**: Redirect happens but protected content briefly flashes before redirect
- Reference: severity-rules.md
