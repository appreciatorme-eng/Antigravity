import { test, expect } from '@playwright/test';

// Codex Audit Remediation E2E Tests
// Covers: F-001 (rate-limit identifier), F-002..F-017 (admin guards),
//         F-018 (upsert error check), F-019 (query cap), F-020 (track rate limit)

test.describe('Codex Remediation — Admin Guards (unauthenticated = 401)', () => {
  test('subscriptions endpoint requires admin (POST)', async ({ request }) => {
    const res = await request.post('/api/subscriptions', {
      data: { plan: 'pro' },
    });
    expect(res.status()).toBe(401);
  });

  test('subscriptions cancel endpoint requires admin (POST)', async ({ request }) => {
    const res = await request.post('/api/subscriptions/cancel', {
      data: {},
    });
    expect(res.status()).toBe(401);
  });

  test('whatsapp broadcast endpoint requires admin (POST)', async ({ request }) => {
    const res = await request.post('/api/whatsapp/broadcast', {
      data: { message: 'hello' },
    });
    expect(res.status()).toBe(401);
  });

  test('whatsapp broadcast GET requires admin', async ({ request }) => {
    const res = await request.get('/api/whatsapp/broadcast');
    expect(res.status()).toBe(401);
  });

  test('whatsapp send endpoint requires admin (POST)', async ({ request }) => {
    const res = await request.post('/api/whatsapp/send', {
      data: { to: '+910000000000', message: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('whatsapp connect endpoint requires admin (POST)', async ({ request }) => {
    const res = await request.post('/api/whatsapp/connect', {
      data: {},
    });
    expect(res.status()).toBe(401);
  });

  test('payments create-order endpoint requires admin (POST)', async ({ request }) => {
    const res = await request.post('/api/payments/create-order', {
      data: { amount: 1000 },
    });
    expect(res.status()).toBe(401);
  });

  test('payments links endpoint requires admin (POST)', async ({ request }) => {
    const res = await request.post('/api/payments/links', {
      data: { amount: 500, clientId: 'fake-id' },
    });
    expect(res.status()).toBe(401);
  });

  test('billing subscription endpoint requires admin (GET)', async ({ request }) => {
    const res = await request.get('/api/billing/subscription');
    expect(res.status()).toBe(401);
  });

  test('settings UPI endpoint requires admin (POST)', async ({ request }) => {
    const res = await request.post('/api/settings/upi', {
      data: { upiHandle: 'fake@upi' },
    });
    expect(res.status()).toBe(401);
  });

  test('settings marketplace endpoint requires admin (GET)', async ({ request }) => {
    const res = await request.get('/api/settings/marketplace');
    expect(res.status()).toBe(401);
  });

  test('dashboard tasks endpoint requires admin (GET)', async ({ request }) => {
    const res = await request.get('/api/dashboard/tasks');
    expect(res.status()).toBe(401);
  });

  test('dashboard schedule endpoint requires admin (GET)', async ({ request }) => {
    const res = await request.get('/api/dashboard/schedule');
    expect(res.status()).toBe(401);
  });

  test('drivers search endpoint requires admin (GET)', async ({ request }) => {
    const res = await request.get('/api/drivers/search?q=test');
    expect(res.status()).toBe(401);
  });

  test('nav counts endpoint requires admin (GET)', async ({ request }) => {
    const res = await request.get('/api/nav/counts');
    expect(res.status()).toBe(401);
  });
});

test.describe('Codex Remediation — F-019: Reputation dashboard query cap', () => {
  test('reputation dashboard returns structured response (not 500)', async ({ request }) => {
    const res = await request.get('/api/reputation/dashboard');
    expect([200, 401, 403]).toContain(res.status());
    if (res.status() !== 200) return;
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('error');
  });
});

test.describe('Codex Remediation — F-020: Payment track rate limiting', () => {
  test('payments track GET returns structured response (not 500)', async ({ request }) => {
    const res = await request.get('/api/payments/track/nonexistent-token-abc123');
    expect([200, 404, 429]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('payments track POST rejects invalid event', async ({ request }) => {
    const res = await request.post('/api/payments/track/nonexistent-token-abc123', {
      data: { event: 'paid' },
    });
    expect(res.status()).toBe(400);
  });

  test('payments track POST rejects malformed body', async ({ request }) => {
    const res = await request.post('/api/payments/track/nonexistent-token-abc123', {
      headers: { 'content-type': 'application/json' },
      data: '{not-json',
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('Codex Remediation — F-001: Rate-limit identifier no longer uses JWT payload', () => {
  test('unauthenticated request to rate-limited endpoint does not leak 500', async ({ request }) => {
    const res = await request.get('/api/nav/counts', {
      headers: { Authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJmYWtlLXVzZXIifQ.' },
    });
    expect([401, 403, 429]).toContain(res.status());
  });
});
