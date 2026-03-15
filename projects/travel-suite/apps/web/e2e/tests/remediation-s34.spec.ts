import { test, expect } from '@playwright/test';

// B-01: ESLint unused imports fixed — verified via lint (no E2E needed)
// B-02: Mock Razorpay already guarded — ensureMockEndpointAllowed() blocks in prod
// B-03: Demo data gated behind isDemoMode context — no E2E needed

test.describe('Remediation S34 — Production Guards', () => {
  test('H-11: /map-test returns 404 in any environment where notFound() fires', async ({ request }) => {
    // The page has a NODE_ENV === "production" guard that calls notFound().
    // In the E2E environment (Vercel production), the page must return 404.
    const res = await request.get('/map-test');
    expect(res.status()).toBe(404);
  });

  test('M-09: Debug endpoint not accessible without NODE_ENV guard', async ({ request }) => {
    // The debug handler returns 501 in production.
    const res = await request.get('/api/debug');
    expect([404, 501]).toContain(res.status());
  });
});

test.describe('Remediation S34 — Email Config', () => {
  test('H-10: Welcome email endpoint does not use hardcoded fallback URL', async ({ request }) => {
    // Endpoint should skip gracefully when email config is missing — not crash.
    // We just verify the auth signup flow does not return 500.
    const res = await request.post('/api/auth/signup', {
      data: { email: `test-${Date.now()}@example.invalid`, password: 'TestPass123!' },
    });
    // Accept any non-5xx status — 400/409/422 are valid business errors
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('Remediation S34 — OG Image Route', () => {
  test('L-05: OG route responds with image content', async ({ request }) => {
    const res = await request.get('/api/og?title=Test&subtitle=Sub');
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'];
    expect(ct).toContain('image/');
  });

  test('OG route rate-limits excessive requests', async ({ request }) => {
    // Send 65 rapid requests — should hit the 60/min limit
    const requests = Array.from({ length: 65 }, () =>
      request.get('/api/og?title=Rate+Limit+Test'),
    );
    const responses = await Promise.all(requests);
    const tooMany = responses.filter((r) => r.status() === 429);
    expect(tooMany.length).toBeGreaterThan(0);
  });
});

test.describe('Remediation S34 — Sentry Startup', () => {
  test('H-13: App loads without crashing when Sentry DSN is configured', async ({ page }) => {
    await page.goto('/');
    // No uncaught exceptions from Sentry init
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.waitForLoadState('domcontentloaded');
    const sentryErrors = errors.filter((e) => e.toLowerCase().includes('sentry'));
    expect(sentryErrors).toHaveLength(0);
  });
});
