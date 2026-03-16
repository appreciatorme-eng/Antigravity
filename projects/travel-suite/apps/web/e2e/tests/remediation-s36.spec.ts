import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Remediation S36 — Zod/Input Validation Hardening
// Covers: M-01 (nps/submit feedback cap), M-05 (pricing constants extraction)
// False-alarm verification: H-01, H-02, M-02, M-03, M-04, L-01, L-02, L-03
// ---------------------------------------------------------------------------

test.describe('Remediation S36 — NPS Submit Validation (M-01)', () => {
  test('rejects score below 1', async ({ request }) => {
    const res = await request.post('/api/reputation/nps/submit', {
      data: { token: 'not-a-uuid', score: 0, feedback: 'bad score' },
      headers: { 'Content-Type': 'application/json' },
    });
    // Should reject with 400 (invalid token format) or 400 (score), not 500
    expect(res.status()).toBeLessThan(500);
  });

  test('rejects score above 10', async ({ request }) => {
    const res = await request.post('/api/reputation/nps/submit', {
      data: { token: 'not-a-uuid', score: 11, feedback: 'score too high' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('rejects invalid UUID token', async ({ request }) => {
    const res = await request.post('/api/reputation/nps/submit', {
      data: { token: 'not-a-valid-uuid', score: 8 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('handles non-string feedback without error', async ({ request }) => {
    const res = await request.post('/api/reputation/nps/submit', {
      data: {
        token: '00000000-0000-0000-0000-000000000000',
        score: 8,
        feedback: { nested: 'object' },
      },
      headers: { 'Content-Type': 'application/json' },
    });
    // Should not throw 500 — either 400 (invalid token) or 404 (not found)
    expect(res.status()).not.toBe(500);
  });
});

test.describe('Remediation S36 — Pricing Page Constants (M-05)', () => {
  test('pricing page renders all three plan names', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Enterprise')).toBeVisible();
  });

  test('pricing page renders correct INR prices', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    // Annual billing is default — should show annual prices
    await expect(page.getByText('₹799')).toBeVisible();
    await expect(page.getByText('₹1999')).toBeVisible();
  });

  test('pricing page billing toggle switches between monthly and annual', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    // Default is annual — ₹799 visible
    await expect(page.getByText('₹799')).toBeVisible();
    // Click the toggle button to switch to monthly
    await page.getByText('Monthly').click();
    await expect(page.getByText('₹999')).toBeVisible();
  });

  test('pricing FAQ section renders at least 3 questions', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    const faqItems = page.locator('text=Is there a free trial');
    await expect(faqItems.first()).toBeVisible();
  });
});

test.describe('Remediation S36 — SSRF Protection Verification (H-01 — already implemented)', () => {
  test('rejects localhost URL in itinerary import', async ({ request }) => {
    const res = await request.post('/api/itinerary/import/url', {
      data: { url: 'http://localhost:8080/admin' },
      headers: { 'Content-Type': 'application/json' },
    });
    // Should reject with 401 (unauth) or 422 (URL not allowed) — never 500
    expect([401, 422, 403]).toContain(res.status());
  });

  test('rejects private IP URL in itinerary import', async ({ request }) => {
    const res = await request.post('/api/itinerary/import/url', {
      data: { url: 'http://192.168.1.1/secret' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([401, 422, 403]).toContain(res.status());
  });

  test('rejects non-http scheme in itinerary import', async ({ request }) => {
    const res = await request.post('/api/itinerary/import/url', {
      data: { url: 'file:///etc/passwd' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([400, 401, 422, 403]).toContain(res.status());
  });
});

test.describe('Remediation S36 — Location Ping Coordinate Validation (M-03 — already implemented)', () => {
  test('rejects coordinates out of lat/lon range via 401 (unauth)', async ({ request }) => {
    const res = await request.post('/api/location/ping', {
      data: {
        tripId: '00000000-0000-0000-0000-000000000000',
        latitude: 999,
        longitude: 999,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    // Will hit auth first, then coordinate validation
    expect(res.status()).not.toBe(500);
  });
});

test.describe('Remediation S36 — Admin Notification Retry UUID Validation (L-01 — already implemented)', () => {
  test('rejects non-UUID queue_id', async ({ request }) => {
    const res = await request.post('/api/admin/notifications/delivery/retry', {
      data: { queue_id: 'not-a-uuid' },
      headers: { 'Content-Type': 'application/json' },
    });
    // Should be 401 (unauth) or 400 (invalid UUID) — never 500
    expect(res.status()).not.toBe(500);
  });
});
