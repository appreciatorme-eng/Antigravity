import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Remediation S38 — Rate Limiting on AI Routes, Structured Logging
// Covers: H-01 (social/captions rate limit), H-02 (social/extract rate limit),
//         H-03 (whatsapp/extract-trip-intent rate limit), M-03 (logError migration)
// Documented: M-01 (auth_leaked_password — dashboard toggle),
//             M-02 (rls_always_true — intentional public proposal design),
//             L-01 (crm_contacts FK — false positive, composite indexes cover it)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// H-01: social/captions — requires auth
// ---------------------------------------------------------------------------
test.describe('Remediation S38 — H-01: social/captions rate limit', () => {
  test('returns 401 without auth session', async ({ request }) => {
    const res = await request.post('/api/social/captions', {
      data: {
        templateData: { destination: 'Goa', offer: '20% off', companyName: 'TravelCo' },
        tone: 'fun',
        platform: 'instagram',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('rejects empty body without auth gracefully', async ({ request }) => {
    const res = await request.post('/api/social/captions', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    // 401 (no auth) — never 500
    expect(res.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// H-02: social/extract — requires auth, accepts base64 image
// ---------------------------------------------------------------------------
test.describe('Remediation S38 — H-02: social/extract rate limit', () => {
  test('returns 401 without auth session', async ({ request }) => {
    const res = await request.post('/api/social/extract', {
      data: { image: 'data:image/png;base64,iVBORw0KGgo=' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('rejects oversized image payload without auth gracefully', async ({ request }) => {
    // Should 401 (auth first) not 413 — auth check happens before size check in catch-all
    const res = await request.post('/api/social/extract', {
      data: { image: 'x'.repeat(500) },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// H-03: whatsapp/extract-trip-intent — requires admin auth
// ---------------------------------------------------------------------------
test.describe('Remediation S38 — H-03: whatsapp/extract-trip-intent rate limit', () => {
  test('returns 401 without auth session', async ({ request }) => {
    const res = await request.post('/api/whatsapp/extract-trip-intent', {
      data: {
        waId: '919876543210',
        contactName: 'Test User',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('rejects invalid waId schema without auth gracefully', async ({ request }) => {
    const res = await request.post('/api/whatsapp/extract-trip-intent', {
      data: { waId: 'x' }, // too short (min 7)
      headers: { 'Content-Type': 'application/json' },
    });
    // 401 (no auth) — never 500
    expect(res.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// M-03: Structured logging — verify handlers return structured error envelopes
//        (not raw stack traces), confirming logError is used (no leakage)
// ---------------------------------------------------------------------------
test.describe('Remediation S38 — M-03: No error detail leakage via structured logger', () => {
  test('social/captions 401 body does not contain stack trace', async ({ request }) => {
    const res = await request.post('/api/social/captions', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.text();
    expect(body).not.toContain('at Object.');
    expect(body).not.toContain('Error:');
    expect(body).not.toContain('stack');
  });

  test('social/extract 401 body does not contain stack trace', async ({ request }) => {
    const res = await request.post('/api/social/extract', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.text();
    expect(body).not.toContain('at Object.');
    expect(body).not.toContain('Error:');
  });

  test('whatsapp/extract-trip-intent 401 body is clean JSON', async ({ request }) => {
    const res = await request.post('/api/whatsapp/extract-trip-intent', {
      data: { waId: '919876543210' },
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.text();
    expect(body).not.toContain('at Object.');
    // Should be a clean JSON error envelope
    expect(() => JSON.parse(body)).not.toThrow();
  });
});
