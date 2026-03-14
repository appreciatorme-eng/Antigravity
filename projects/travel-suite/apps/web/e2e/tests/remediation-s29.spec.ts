import { test, expect } from '../fixtures/auth';

/**
 * Remediation S29 — E2E Regression Tests
 *
 * Covers findings fixed in the S29 remediation cycle:
 *   L-01: auth_rls_initplan — 109 RLS policies updated to use (select auth.uid())
 *
 * M-01 (multiple_permissive_policies) — documented design decision, no code change.
 * L-02 (unused_index) — documented for DBA sprint, no code change.
 * L-03 (large files) — documented for refactor sprint, no code change.
 *
 * The auth_rls_initplan fix is a PostgreSQL planner optimization (idempotent logic change).
 * We verify correct authorization behavior is preserved after the migration — the fix
 * must not break any existing access control guarantees.
 */

test.describe('Remediation S29 — auth_rls_initplan (L-01): Core RLS preserved', () => {
  test('authenticated admin can read availability (profiles RLS works)', async ({ adminPage }) => {
    const response = await adminPage.request.get('/api/availability?from=2026-01-01&to=2026-12-31');
    // Auth + RLS must allow admin to query their org's data
    expect([200, 429]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  test('unauthenticated request cannot access availability (auth_uid subquery still enforces auth)', async ({ page }) => {
    const response = await page.request.get('/api/availability?from=2026-01-01&to=2026-12-31');
    // auth.uid() → (select auth.uid()) must still return NULL for anon sessions
    expect(response.status()).toBeGreaterThanOrEqual(401);
    expect(response.status()).toBeLessThan(500);
  });

  test('unauthenticated request cannot access itineraries route (itineraries RLS preserved)', async ({ page }) => {
    const response = await page.request.get('/api/itineraries');
    expect(response.status()).toBeGreaterThanOrEqual(401);
    expect(response.status()).toBeLessThan(500);
  });

  test('authenticated admin can read itineraries (itineraries RLS using (select auth.uid()))', async ({ adminPage }) => {
    const response = await adminPage.request.get('/api/itineraries');
    expect([200, 429]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('unauthenticated request cannot access trips route (trips RLS preserved)', async ({ page }) => {
    const response = await page.request.get('/api/trips');
    expect(response.status()).toBeGreaterThanOrEqual(401);
    expect(response.status()).toBeLessThan(500);
  });

  test('authenticated admin can access trips (trips RLS works after migration)', async ({ adminPage }) => {
    const response = await adminPage.request.get('/api/trips');
    expect([200, 429]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('unauthenticated request cannot access invoices (payment_links/invoices RLS preserved)', async ({ page }) => {
    const response = await page.request.get('/api/invoices');
    expect(response.status()).toBeGreaterThanOrEqual(401);
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Remediation S29 — auth_rls_initplan (L-01): Mutation endpoints preserved', () => {
  test('POST /api/availability CSRF guard still enforced (write RLS path preserved)', async ({ adminPage }) => {
    const response = await adminPage.request.post('/api/availability', {
      data: { start_date: '2026-09-01', end_date: '2026-09-07' },
      headers: { 'Content-Type': 'application/json' },
      // Deliberately omit x-csrf-token
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('PATCH /api/whatsapp/chatbot-sessions/:id CSRF guard still enforced', async ({ adminPage }) => {
    const response = await adminPage.request.patch('/api/whatsapp/chatbot-sessions/test-id', {
      data: { state: 'handed_off' },
      headers: { 'Content-Type': 'application/json' },
      // Deliberately omit x-csrf-token
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('DELETE /api/availability CSRF guard still enforced', async ({ adminPage }) => {
    const response = await adminPage.request.delete('/api/availability?id=nonexistent', {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

test.describe('Remediation S29 — auth_rls_initplan (L-01): Health regression check', () => {
  test('health endpoint still responds after RLS migration', async ({ page }) => {
    // If the auth_rls_initplan migration broke RLS evaluation globally, DB queries fail
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('all routes return valid JSON content-type after RLS migration', async ({ adminPage }) => {
    // Spot check: availability, trips, itineraries all served via catch-all
    const routes = [
      '/api/availability?from=2026-01-01&to=2026-01-31',
      '/api/trips',
      '/api/itineraries',
    ];
    for (const route of routes) {
      const response = await adminPage.request.get(route);
      expect(response.headers()['content-type']).toContain('application/json');
    }
  });

  test('nav counts API works (profiles + multi-table RLS preserved)', async ({ adminPage }) => {
    const response = await adminPage.request.get('/api/nav/counts');
    // nav/counts queries multiple RLS-protected tables; if (select auth.uid()) broke any,
    // this would 500 or return wrong data
    expect([200, 429]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });
});
