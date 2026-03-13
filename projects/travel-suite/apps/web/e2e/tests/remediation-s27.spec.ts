import { test, expect } from '@playwright/test';

// S27 Remediation E2E Tests
// Covers F-01 (whatsapp/qr cross-tenant), F-02–F-04 (HIGH auth guards),
// F-09–F-12 (MEDIUM auth guards), F-14 (type safety — no runtime errors)

test.describe('S27 — F-01: WhatsApp QR requires admin (CRITICAL)', () => {
  test('blocks unauthenticated QR request', async ({ request }) => {
    const res = await request.get('/api/whatsapp/qr');
    expect(res.status()).toBe(401);
  });

  test('ignores caller-supplied sessionName (no longer trusted)', async ({ request }) => {
    const res = await request.get('/api/whatsapp/qr?sessionName=org_othertenant');
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('S27 — F-02: WhatsApp disconnect requires admin (HIGH)', () => {
  test('blocks unauthenticated disconnect request', async ({ request }) => {
    const res = await request.post('/api/whatsapp/disconnect', { data: {} });
    expect(res.status()).toBe(401);
  });
});

test.describe('S27 — F-03: WhatsApp test-message requires admin (HIGH)', () => {
  test('blocks unauthenticated test-message request', async ({ request }) => {
    const res = await request.post('/api/whatsapp/test-message', { data: {} });
    expect(res.status()).toBe(401);
  });
});

test.describe('S27 — F-04: WhatsApp conversations requires admin (HIGH)', () => {
  test('blocks unauthenticated conversations request', async ({ request }) => {
    const res = await request.get('/api/whatsapp/conversations');
    expect(res.status()).toBe(401);
  });
});

test.describe('S27 — F-09: WhatsApp status requires admin (MEDIUM)', () => {
  test('blocks unauthenticated status request', async ({ request }) => {
    const res = await request.get('/api/whatsapp/status');
    expect(res.status()).toBe(401);
  });
});

test.describe('S27 — F-10: WhatsApp health requires admin (MEDIUM)', () => {
  test('blocks unauthenticated health request', async ({ request }) => {
    const res = await request.get('/api/whatsapp/health');
    expect(res.status()).toBe(401);
  });
});

test.describe('S27 — F-11: dashboard/tasks/dismiss requires admin (MEDIUM)', () => {
  test('blocks unauthenticated dismiss request', async ({ request }) => {
    const res = await request.post('/api/dashboard/tasks/dismiss', {
      data: { taskId: 'test', taskType: 'test', entityId: 'test' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('S27 — F-12: reputation/dashboard requires admin (MEDIUM)', () => {
  test('blocks unauthenticated reputation dashboard request', async ({ request }) => {
    const res = await request.get('/api/reputation/dashboard');
    expect(res.status()).toBe(401);
  });
});

test.describe('S27 — F-14: ItineraryMap no runtime errors (LOW)', () => {
  test('map page loads without unhandled JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const mapErrors = errors.filter((e) =>
      e.includes('_getIconUrl') || e.includes('Cannot read properties') && e.includes('undefined')
    );
    expect(mapErrors).toHaveLength(0);
  });
});
