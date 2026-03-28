# Suite S14: Link Validation — Internal Link Health Check

**Category**: Functional
**Duration**: ~5 min
**Requires Auth**: Yes

## What It Tests

Collects all internal `<a href>` links from key pages and validates them with HEAD requests. Flags 404s (dead links) and 500s (broken endpoints). Focuses on navigation and footer links that users encounter.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# --- Page 1: Home (dashboard) — collect and validate links ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const origin = window.location.origin; const links = Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.startsWith(origin) || h.startsWith('/')).map(h => h.startsWith('/') ? origin + h : h); const unique = [...new Set(links)]; return { page: '/', linkCount: unique.length, links: unique.slice(0, 30) }; }"

# Validate all internal links from home page via HEAD requests
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const origin = window.location.origin; const links = Array.from(new Set(Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.startsWith(origin) || h.startsWith('/')))).map(h => h.startsWith('/') ? origin + h : h).slice(0, 30); return Promise.all(links.map(url => fetch(url, { method: 'HEAD', redirect: 'follow' }).then(r => ({ url: url.replace(origin, ''), status: r.status, ok: r.ok })).catch(e => ({ url: url.replace(origin, ''), status: 0, error: e.message })))).then(results => ({ total: results.length, broken: results.filter(r => !r.ok && r.status !== 0), results })); }"

# --- Page 2: Trips — collect and validate links ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const origin = window.location.origin; const links = Array.from(new Set(Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.startsWith(origin) || h.startsWith('/')))).map(h => h.startsWith('/') ? origin + h : h).slice(0, 30); return Promise.all(links.map(url => fetch(url, { method: 'HEAD', redirect: 'follow' }).then(r => ({ url: url.replace(origin, ''), status: r.status, ok: r.ok })).catch(e => ({ url: url.replace(origin, ''), status: 0, error: e.message })))).then(results => ({ page: '/trips', total: results.length, broken: results.filter(r => !r.ok && r.status !== 0) })); }"

# --- Page 3: Clients — collect and validate links ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const origin = window.location.origin; const links = Array.from(new Set(Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.startsWith(origin) || h.startsWith('/')))).map(h => h.startsWith('/') ? origin + h : h).slice(0, 30); return Promise.all(links.map(url => fetch(url, { method: 'HEAD', redirect: 'follow' }).then(r => ({ url: url.replace(origin, ''), status: r.status, ok: r.ok })).catch(e => ({ url: url.replace(origin, ''), status: 0, error: e.message })))).then(results => ({ page: '/clients', total: results.length, broken: results.filter(r => !r.ok && r.status !== 0) })); }"

# --- Page 4: Settings — collect and validate links ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/settings"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const origin = window.location.origin; const links = Array.from(new Set(Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.startsWith(origin) || h.startsWith('/')))).map(h => h.startsWith('/') ? origin + h : h).slice(0, 30); return Promise.all(links.map(url => fetch(url, { method: 'HEAD', redirect: 'follow' }).then(r => ({ url: url.replace(origin, ''), status: r.status, ok: r.ok })).catch(e => ({ url: url.replace(origin, ''), status: 0, error: e.message })))).then(results => ({ page: '/settings', total: results.length, broken: results.filter(r => !r.ok && r.status !== 0) })); }"
```

## Pass Criteria

- Zero 404 responses from internal links
- Zero 500 responses from internal links
- All links resolve (no network errors)

## Issue Detection

- **P1 High**: Link returns 404 — dead link, user hits "not found" page
- **P0 Critical**: Link returns 500 — server error from navigation
- **P2 Medium**: Link returns 403 — permission issue on navigation link
- **P3 Low**: Redirect chains (multiple 301/302 hops)
- Reference: severity-rules.md
