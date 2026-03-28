# Suite S18: Realtime — WebSocket & Supabase Channel Status

**Category**: Functional
**Duration**: ~3 min
**Requires Auth**: Yes

## What It Tests

Checks for active WebSocket connections (Supabase Realtime) by examining performance resource entries. Verifies that realtime-dependent pages (inbox, dashboard) establish WebSocket connections for live data updates.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# --- Page 1: Home (Dashboard) — check for realtime connections ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 3000))"

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const resources = performance.getEntriesByType('resource'); const wsResources = resources.filter(r => r.name.includes('realtime') || r.name.includes('ws') || r.name.includes('supabase') || r.initiatorType === 'websocket'); return { page: '/', totalResources: resources.length, realtimeConnections: wsResources.length, realtimeUrls: wsResources.map(r => r.name.slice(-80)).slice(0, 5) }; }"

# Check for Supabase client in window/global scope
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasSupabaseReferences: document.documentElement.innerHTML.includes('supabase') || document.documentElement.innerHTML.includes('realtime-js') })"

# --- Page 2: Inbox — primary realtime page ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 3000))"

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const resources = performance.getEntriesByType('resource'); const wsResources = resources.filter(r => r.name.includes('realtime') || r.name.includes('ws') || r.name.includes('supabase') || r.initiatorType === 'websocket'); return { page: '/inbox', totalResources: resources.length, realtimeConnections: wsResources.length, realtimeUrls: wsResources.map(r => r.name.slice(-80)).slice(0, 5) }; }"

# --- Page 3: Calendar — check for live updates ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/calendar"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 3000))"

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const resources = performance.getEntriesByType('resource'); const wsResources = resources.filter(r => r.name.includes('realtime') || r.name.includes('ws') || r.name.includes('supabase') || r.initiatorType === 'websocket'); return { page: '/calendar', totalResources: resources.length, realtimeConnections: wsResources.length, realtimeUrls: wsResources.map(r => r.name.slice(-80)).slice(0, 5) }; }"

# --- Page 4: Trips — check for live updates ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 3000))"

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const resources = performance.getEntriesByType('resource'); const wsResources = resources.filter(r => r.name.includes('realtime') || r.name.includes('ws') || r.name.includes('supabase') || r.initiatorType === 'websocket'); return { page: '/trips', totalResources: resources.length, realtimeConnections: wsResources.length, realtimeUrls: wsResources.map(r => r.name.slice(-80)).slice(0, 5) }; }"

# Check for console errors related to WebSocket
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error
```

## Pass Criteria

- At least one realtime/WebSocket resource detected on inbox page
- No WebSocket connection errors in console
- Supabase realtime references found in page resources

## Issue Detection

- **P1 High**: Zero WebSocket connections on inbox — realtime messaging broken
- **P2 Medium**: WebSocket connection errors in console — intermittent realtime failures
- **P2 Medium**: No realtime connections on dashboard — live data not updating
- **P3 Low**: Realtime connections present but high latency
- Reference: severity-rules.md
