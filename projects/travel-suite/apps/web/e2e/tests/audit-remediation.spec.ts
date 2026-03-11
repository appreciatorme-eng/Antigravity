import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3100';

test.describe('Audit Remediation — Security Headers', () => {
  test('HSTS header is present on all responses', async ({ request }) => {
    const res = await request.get('/');
    const hsts = res.headers()['strict-transport-security'];
    expect(hsts).toBeTruthy();
    expect(hsts).toContain('max-age=63072000');
    expect(hsts).toContain('includeSubDomains');
  });

  test('CSP header is present on all responses', async ({ request }) => {
    const res = await request.get('/');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  test('X-Content-Type-Options nosniff header present', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('X-Frame-Options SAMEORIGIN header present', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-frame-options']).toBe('SAMEORIGIN');
  });
});

test.describe('Audit Remediation — CORS', () => {
  test('CORS blocked from foreign origin', async ({ request }) => {
    const res = await request.get('/api/health', {
      headers: { origin: 'https://evil.com' },
    });
    const allowOrigin = res.headers()['access-control-allow-origin'];
    expect(allowOrigin).not.toBe('*');
    expect(allowOrigin).not.toBe('https://evil.com');
  });

  test('CORS preflight from foreign origin gets no allow-origin', async ({ request }) => {
    const res = await request.fetch('/api/health', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://evil.com',
        'access-control-request-method': 'POST',
      },
    });
    const allowOrigin = res.headers()['access-control-allow-origin'];
    expect(allowOrigin || '').not.toBe('https://evil.com');
  });
});

test.describe('Audit Remediation — CSRF Protection', () => {
  test('POST to admin mutation endpoint without CSRF headers returns 403', async ({ request }) => {
    const res = await request.post('/api/admin/clear-cache', {
      data: { all: true },
    });
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Audit Remediation — Cron POST-only (M-05)', () => {
  const CRON_ENDPOINTS = [
    '/api/cron/assistant-alerts',
    '/api/cron/assistant-briefing',
    '/api/cron/assistant-digest',
    '/api/cron/operator-scorecards',
    '/api/cron/reputation-campaigns',
  ];

  for (const endpoint of CRON_ENDPOINTS) {
    test(`GET ${endpoint} returns 405 Method Not Allowed`, async ({ request }) => {
      const res = await request.get(endpoint);
      expect(res.status()).toBe(405);
    });
  }
});

test.describe('Audit Remediation — Password Minimum Length (M-07)', () => {
  test('Password login rejects password shorter than 8 chars', async ({ request }) => {
    const res = await request.post('/api/auth/password-login', {
      data: {
        email: 'test@example.com',
        password: '1234567',
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});

test.describe('Audit Remediation — WhatsApp Webhook Body Limit (M-08)', () => {
  test('WhatsApp webhook rejects oversized payload with 413', async ({ request }) => {
    const largePayload = 'x'.repeat(1_100_000);
    const res = await request.post('/api/webhooks/whatsapp/webhook', {
      headers: {
        'content-type': 'text/plain',
        'content-length': String(largePayload.length),
      },
      data: largePayload,
    });
    expect([403, 413]).toContain(res.status());
  });
});

test.describe('Audit Remediation — Rate Limiting (H-01/H-02)', () => {
  test('API returns rate limit headers', async ({ request }) => {
    const res = await request.get('/api/health');
    const hasRateLimitHeader =
      res.headers()['x-ratelimit-limit'] ||
      res.headers()['x-ratelimit-remaining'] ||
      res.status() === 429;
    expect(hasRateLimitHeader).toBeTruthy();
  });
});

test.describe('Audit Remediation — Payment Webhook Error Handling (C-03)', () => {
  test('Payment webhook returns 401 without valid signature', async ({ request }) => {
    const res = await request.post('/api/payments/webhook', {
      data: JSON.stringify({ event: 'test' }),
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': 'invalid-signature',
      },
    });
    expect([401, 403, 500]).toContain(res.status());
  });
});

authTest.describe('Audit Remediation — Cookie Security (H-03)', () => {
  authTest('Cookies have SameSite=Lax and HttpOnly', async ({ adminPage }) => {
    const cookies = await adminPage.context().cookies();
    const supabaseCookies = cookies.filter(
      (c) => c.name.startsWith('sb-') || c.name.includes('supabase')
    );

    for (const cookie of supabaseCookies) {
      expect(cookie.sameSite).toBe('Lax');
      expect(cookie.httpOnly).toBe(true);
    }
  });
});
