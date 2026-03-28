# Suite S13: API Health — Endpoint Response Validation

**Category**: API
**Duration**: ~3 min
**Requires Auth**: Yes

## What It Tests

Uses authenticated browser context to fetch key API endpoints. Checks that each returns a successful status code and valid JSON response. Tests both GET data endpoints and POST auth endpoint.

## Commands

```bash
# Prerequisite: authenticated session (cookies available in browser context)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# Navigate to app first to ensure cookies are set for the domain
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"

# --- API 1: GET /api/trips?status=all ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => fetch('/api/trips?status=all').then(async r => { let body; try { body = await r.json(); } catch(e) { body = 'invalid json'; } return { endpoint: '/api/trips?status=all', status: r.status, ok: r.ok, hasData: typeof body === 'object' && body !== null, dataType: Array.isArray(body?.data) ? 'array' : typeof body?.data }; })"

# --- API 2: GET /api/admin/clients ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => fetch('/api/admin/clients').then(async r => { let body; try { body = await r.json(); } catch(e) { body = 'invalid json'; } return { endpoint: '/api/admin/clients', status: r.status, ok: r.ok, hasData: typeof body === 'object' && body !== null, dataType: Array.isArray(body?.data) ? 'array' : typeof body?.data }; })"

# --- API 3: GET /api/subscriptions/limits ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => fetch('/api/subscriptions/limits').then(async r => { let body; try { body = await r.json(); } catch(e) { body = 'invalid json'; } return { endpoint: '/api/subscriptions/limits', status: r.status, ok: r.ok, hasData: typeof body === 'object' && body !== null }; })"

# --- API 4: GET /api/add-ons ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => fetch('/api/add-ons').then(async r => { let body; try { body = await r.json(); } catch(e) { body = 'invalid json'; } return { endpoint: '/api/add-ons', status: r.status, ok: r.ok, hasData: typeof body === 'object' && body !== null }; })"

# --- API 5: GET /api/admin/revenue ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => fetch('/api/admin/revenue').then(async r => { let body; try { body = await r.json(); } catch(e) { body = 'invalid json'; } return { endpoint: '/api/admin/revenue', status: r.status, ok: r.ok, hasData: typeof body === 'object' && body !== null }; })"

# --- API 6: GET /api/admin/operations/stats ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => fetch('/api/admin/operations/stats').then(async r => { let body; try { body = await r.json(); } catch(e) { body = 'invalid json'; } return { endpoint: '/api/admin/operations/stats', status: r.status, ok: r.ok, hasData: typeof body === 'object' && body !== null }; })"

# --- API 7: POST /api/auth/password-login with VALID credentials ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => fetch('/api/auth/password-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'e2e-admin@tripbuilt.com', password: 'E2eAdmin2026secure' }) }).then(async r => { let body; try { body = await r.json(); } catch(e) { body = 'invalid json'; } return { endpoint: 'POST /api/auth/password-login (valid)', status: r.status, ok: r.ok }; })"

# --- API 8: POST /api/auth/password-login with INVALID credentials (expect 401) ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => fetch('/api/auth/password-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'invalid@example.com', password: 'wrongpassword' }) }).then(async r => { let body; try { body = await r.json(); } catch(e) { body = 'invalid json'; } return { endpoint: 'POST /api/auth/password-login (invalid)', status: r.status, expected401: r.status === 401, ok: r.ok }; })"
```

## Pass Criteria

- All GET endpoints return status 200
- All GET endpoints return valid JSON with data property
- Valid login returns 200
- Invalid login returns 401 (not 500)
- No endpoint returns 500

## Issue Detection

- **P0 Critical**: Any endpoint returns 500 — server error
- **P1 High**: GET endpoint returns 401 — auth middleware misconfigured
- **P1 High**: Invalid login returns 200 — auth bypass vulnerability
- **P2 Medium**: Valid JSON but unexpected response shape (missing `data` property)
- **P2 Medium**: Response time > 2 seconds for any endpoint
- Reference: severity-rules.md
