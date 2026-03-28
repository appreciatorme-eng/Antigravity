# Suite S02: Route Health — All Pages Load Without Errors

**Category**: Functional
**Duration**: ~5 min
**Requires Auth**: Yes

## What It Tests

Navigates to all 22 protected routes while authenticated. Checks each page for: error boundary rendering ("Something went wrong"), horizontal overflow (broken layout), and presence of navigation element. Screenshots every page.

## Commands

```bash
# Prerequisite: authenticated session already saved via Phase 1 login
# Load auth state
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# Route 1: Home /
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/home.png"

# Route 2: Inbox
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/inbox.png"

# Route 3: Trips
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/trips.png"

# Route 4: Clients
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/clients.png"

# Route 5: Proposals
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/proposals"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/proposals.png"

# Route 6: Bookings
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/bookings"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/bookings.png"

# Route 7: Planner
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/planner"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/planner.png"

# Route 8: Calendar
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/calendar"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/calendar.png"

# Route 9: Drivers
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/drivers"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/drivers.png"

# Route 10: Invoices
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/invoices"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/invoices.png"

# Route 11: Revenue
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/revenue"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/revenue.png"

# Route 12: Pricing
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/pricing"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/pricing.png"

# Route 13: Operations
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/operations"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/operations.png"

# Route 14: Marketplace
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/marketplace"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/marketplace.png"

# Route 15: Reputation
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/reputation"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/reputation.png"

# Route 16: Social
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/social"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/social.png"

# Route 17: Insights
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/insights"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/insights.png"

# Route 18: Referrals
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/referrals"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/referrals.png"

# Route 19: Settings
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/settings"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/settings.png"

# Route 20: Billing
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/billing"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/billing.png"

# Route 21: Add-ons
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/add-ons"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/add-ons.png"

# Route 22: Support
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/support"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ url: window.location.href, hasError: document.body.innerText.includes('Something went wrong'), hasOverflow: document.body.scrollWidth > window.innerWidth, hasNav: !!document.querySelector('nav') })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s02-routes/support.png"
```

## Pass Criteria

- All 22 routes return `hasError: false`
- All 22 routes return `hasOverflow: false`
- All 22 routes return `hasNav: true`
- No page shows error boundary content

## Issue Detection

- **P0 Critical**: `hasError: true` — page is completely broken (error boundary)
- **P1 High**: `hasOverflow: true` — layout broken on mobile, horizontal scroll
- **P2 Medium**: `hasNav: false` — navigation missing, user cannot navigate away
- Reference: severity-rules.md
