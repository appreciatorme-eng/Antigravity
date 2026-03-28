# Suite S08: Performance — Page Load Timing

**Category**: Performance
**Duration**: ~5 min
**Requires Auth**: Yes

## What It Tests

Navigates to all 22 protected routes and measures page load time using `performance.timing`. Flags any page that takes longer than 1000ms to load. Calculates average load time across all routes.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# Route 1: Home
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 2: Inbox
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/inbox', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 3: Trips
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/trips', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 4: Clients
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/clients', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 5: Proposals
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/proposals"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/proposals', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 6: Bookings
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/bookings"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/bookings', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 7: Planner
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/planner"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/planner', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 8: Calendar
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/calendar"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/calendar', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 9: Drivers
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/drivers"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/drivers', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 10: Invoices
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/invoices"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/admin/invoices', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 11: Revenue
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/revenue"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/admin/revenue', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 12: Pricing
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/pricing"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/admin/pricing', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 13: Operations
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/operations"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/admin/operations', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 14: Marketplace
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/marketplace"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/marketplace', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 15: Reputation
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/reputation"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/reputation', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 16: Social
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/social"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/social', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 17: Insights
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/insights"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/admin/insights', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 18: Referrals
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/admin/referrals"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/admin/referrals', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 19: Settings
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/settings"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/settings', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 20: Billing
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/billing"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/billing', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 21: Add-ons
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/add-ons"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/add-ons', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"

# Route 22: Support
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/support"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const t = performance.timing; return { page: '/support', loadTime: t.loadEventEnd - t.navigationStart, domReady: t.domContentLoadedEventEnd - t.navigationStart, firstByte: t.responseStart - t.navigationStart }; }"
```

## Pass Criteria

- No page loadTime > 3000ms (hard fail)
- Average loadTime across all 22 routes < 1500ms
- No page firstByte (TTFB) > 800ms
- Flag any page > 1000ms as slow (warning)

## Issue Detection

- **P1 High**: Any page loadTime > 3000ms — unusable on mobile networks
- **P2 Medium**: Page loadTime 1000-3000ms — slow but functional
- **P2 Medium**: TTFB > 800ms — server response too slow (potential cold start or heavy query)
- **P3 Low**: Average loadTime > 1500ms across all routes
- Reference: severity-rules.md
