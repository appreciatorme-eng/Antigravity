# Suite S03: Navigation — Bottom Tabs, FAB, and More Drawer

**Category**: Functional
**Duration**: ~3 min
**Requires Auth**: Yes

## What It Tests

Verifies mobile bottom navigation works correctly: tapping each tab navigates to the right route, the FAB opens the quick actions sheet, and the More drawer reveals all secondary navigation items.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# Start from home
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"

# Tab 1: Home — click Home tab in bottom nav
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Click "Home" link in bottom nav
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Home"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s03-navigation/tab-home.png"

# Tab 2: Inbox
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s03-navigation/tab-inbox.png"

# Tab 3: FAB (Quick Actions / + button)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
# Click the FAB / + button (look for the plus icon or "Quick actions" in snapshot)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Quick actions"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s03-navigation/fab-open.png"
# Verify FAB actions are visible: New Trip, WA Broadcast, New Proposal
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ newTrip: document.body.innerText.includes('New Trip'), broadcast: document.body.innerText.includes('Broadcast'), newProposal: document.body.innerText.includes('New Proposal') })"

# Click "New Trip" from FAB
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "New Trip"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.href"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s03-navigation/fab-new-trip.png"

# Tab 4: Trips
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s03-navigation/tab-trips.png"

# Tab 5: Clients
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s03-navigation/tab-clients.png"

# More drawer: click "More" tab
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "More"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s03-navigation/more-drawer.png"

# Verify More drawer sections visible
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ proposals: document.body.innerText.includes('Proposals'), bookings: document.body.innerText.includes('Bookings'), planner: document.body.innerText.includes('Planner'), calendar: document.body.innerText.includes('Calendar'), drivers: document.body.innerText.includes('Drivers'), invoices: document.body.innerText.includes('Invoices'), revenue: document.body.innerText.includes('Revenue'), settings: document.body.innerText.includes('Settings'), billing: document.body.innerText.includes('Billing'), support: document.body.innerText.includes('Support') })"

# Navigate via More drawer to a secondary page
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli click "Proposals"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => window.location.pathname"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s03-navigation/more-proposals.png"
```

## Pass Criteria

- Home tab navigates to `/` or `/admin`
- Inbox tab navigates to `/inbox`
- Trips tab navigates to `/trips`
- Clients tab navigates to `/clients`
- FAB opens and shows New Trip, Broadcast, New Proposal options
- More drawer opens and contains all secondary nav items
- More drawer items navigate to correct routes

## Issue Detection

- **P0 Critical**: Tab click does not navigate (broken navigation)
- **P1 High**: FAB does not open or is missing action items
- **P1 High**: More drawer does not open or is missing expected items
- **P2 Medium**: Navigation delay > 3 seconds
- Reference: severity-rules.md
