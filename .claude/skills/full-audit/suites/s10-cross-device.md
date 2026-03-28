# Suite S10: Cross-Device — Multi-Viewport Testing

**Category**: Cross-Device
**Duration**: ~8 min
**Requires Auth**: Yes

## What It Tests

Tests 4 key pages (/, /inbox, /trips, /clients) at 4 different viewports: iPhone SE (320x568), iPhone 14 (390x844), iPad (768x1024), and landscape (844x390). Checks for horizontal overflow and console errors at each viewport.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"

# ===== VIEWPORT 1: iPhone SE (320x568) =====
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 320 568

# SE: Home
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '320x568', page: '/', overflow: document.body.scrollWidth > window.innerWidth, scrollWidth: document.body.scrollWidth, innerWidth: window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/se-home.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# SE: Inbox
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '320x568', page: '/inbox', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/se-inbox.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# SE: Trips
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '320x568', page: '/trips', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/se-trips.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# SE: Clients
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '320x568', page: '/clients', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/se-clients.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error

# ===== VIEWPORT 2: iPhone 14 (390x844) =====
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# iPhone 14: Home
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '390x844', page: '/', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/iphone14-home.png"

# iPhone 14: Inbox
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '390x844', page: '/inbox', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/iphone14-inbox.png"

# iPhone 14: Trips
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '390x844', page: '/trips', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/iphone14-trips.png"

# iPhone 14: Clients
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '390x844', page: '/clients', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/iphone14-clients.png"

# ===== VIEWPORT 3: iPad (768x1024) =====
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 768 1024

# iPad: Home
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '768x1024', page: '/', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/ipad-home.png"

# iPad: Inbox
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '768x1024', page: '/inbox', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/ipad-inbox.png"

# iPad: Trips
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '768x1024', page: '/trips', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/ipad-trips.png"

# iPad: Clients
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '768x1024', page: '/clients', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/ipad-clients.png"

# ===== VIEWPORT 4: Landscape (844x390) =====
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 844 390

# Landscape: Home
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '844x390', page: '/', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/landscape-home.png"

# Landscape: Inbox
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '844x390', page: '/inbox', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/landscape-inbox.png"

# Landscape: Trips
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '844x390', page: '/trips', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/landscape-trips.png"

# Landscape: Clients
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ viewport: '844x390', page: '/clients', overflow: document.body.scrollWidth > window.innerWidth })"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s10-devices/landscape-clients.png"

# Reset to default viewport
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844
```

## Pass Criteria

- Zero horizontal overflow across all 16 combinations (4 viewports x 4 pages)
- No console errors at any viewport
- Content is readable at all viewports (visual check from screenshots)
- Navigation is accessible at all viewports

## Issue Detection

- **P1 High**: Overflow at 320px (iPhone SE) — smallest supported viewport broken
- **P1 High**: Overflow at 844x390 (landscape) — landscape mode broken
- **P2 Medium**: Overflow at 768px (iPad) — tablet layout broken
- **P2 Medium**: Console errors at specific viewport only — responsive breakpoint bug
- **P3 Low**: Content truncated but no overflow — minor layout issue
- Reference: severity-rules.md
