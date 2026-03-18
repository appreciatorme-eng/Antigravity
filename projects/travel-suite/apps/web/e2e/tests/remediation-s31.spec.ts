import { test, expect, type Page } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

const BASE = process.env.BASE_URL || 'https://tripbuilt.com';

function attachClientErrorCapture(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  return errors;
}

// ─── B-01: Payment webhook idempotency (pre-existing guard) ──────────────────

test.describe('Remediation S31 — B-01 payment idempotency', () => {
  test('recordPayment dedup guard exists in invoice-service source', async () => {
    // Static verification: the dedup check is in the source code
    // This test confirms the guard wasn't accidentally removed during refactoring
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(
      __dirname,
      '../../src/lib/payments/invoice-service.ts',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('.eq(\'reference\', options.razorpayPaymentId)');
    expect(content).toContain('existingPayment?.id');
    expect(content).toContain('maybeSingle()');
  });
});

// ─── B-03: Admin Activity "Coming Soon" ──────────────────────────────────────

test.describe('Remediation S31 — B-03 admin activity no mock data', () => {
  test('activity page source has no MOCK_ACTIVITIES', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(
      __dirname,
      '../../src/app/admin/activity/page.tsx',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('MOCK_ACTIVITIES');
    expect(content).toContain('Coming Soon');
  });

  authTest('admin activity page renders coming-soon placeholder', async ({ adminPage }) => {
    await adminPage.goto(`${BASE}/admin/activity`);
    await expect(adminPage.locator('text=Activity Log')).toBeVisible({ timeout: 10000 });
    await expect(adminPage.locator('text=Coming Soon')).toBeVisible();
    // No mock data text should appear
    await expect(adminPage.locator('text=Priya Nair')).not.toBeVisible();
    await expect(adminPage.locator('text=Sharma family')).not.toBeVisible();
  });
});

// ─── B-04: WhatsApp pickers use real API ─────────────────────────────────────

test.describe('Remediation S31 — B-04 WhatsApp pickers no mock data', () => {
  test('shared.ts has no MOCK_TRIPS or MOCK_DRIVERS', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(
      __dirname,
      '../../src/components/whatsapp/action-picker/shared.ts',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('MOCK_TRIPS');
    expect(content).not.toContain('MOCK_DRIVERS');
    expect(content).toContain('useOrganizationTrips');
    expect(content).toContain('useOrganizationDrivers');
  });

  test('PaymentPicker imports hook instead of mock', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(
      __dirname,
      '../../src/components/whatsapp/action-picker/PaymentPicker.tsx',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('MOCK_TRIPS');
    expect(content).toContain('useOrganizationTrips');
  });

  test('DriverPicker imports hook instead of mock', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(
      __dirname,
      '../../src/components/whatsapp/action-picker/DriverPicker.tsx',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('MOCK_DRIVERS');
    expect(content).toContain('useOrganizationDrivers');
  });
});

// ─── H-05: No console.error in assistant handlers ────────────────────────────

test.describe('Remediation S31 — H-05 structured logging in assistant handlers', () => {
  test('assistant handlers use logError instead of console.error', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const glob = await import('glob');
    const handlersDir = path.resolve(
      __dirname,
      '../../src/app/api/_handlers/assistant',
    );
    const files = glob.sync('**/*.ts', { cwd: handlersDir });
    for (const file of files) {
      const content = fs.readFileSync(path.join(handlersDir, file), 'utf-8');
      expect(content, `${file} should not contain console.error`).not.toMatch(
        /console\.error\(/,
      );
    }
  });
});

// ─── H-06: No console.log in proposals page ─────────────────────────────────

test.describe('Remediation S31 — H-06 no debug logs in production', () => {
  test('proposals/[id]/page.tsx has no console.log', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(
      __dirname,
      '../../src/app/proposals/[id]/page.tsx',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toMatch(/console\.log\(/);
  });
});

// ─── H-07: Loading.tsx exists for high-traffic routes ────────────────────────

test.describe('Remediation S31 — H-07 loading.tsx coverage', () => {
  const REQUIRED_ROUTES = [
    'trips',
    'proposals',
    'clients',
    'drivers',
    'inbox',
    'analytics',
    'calendar',
    'settings',
    'planner',
    'reputation',
    'social',
  ];

  for (const route of REQUIRED_ROUTES) {
    test(`loading.tsx exists for /${route}`, async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(
        __dirname,
        `../../src/app/${route}/loading.tsx`,
      );
      expect(fs.existsSync(filePath), `Missing loading.tsx for /${route}`).toBe(
        true,
      );
    });
  }
});

// ─── H-08: Middleware fail-open on profile error ─────────────────────────────

test.describe('Remediation S31 — H-08 middleware profile error handling', () => {
  test('middleware destructures profileError', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../../src/middleware.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('profileError');
    expect(content).toContain('return sessionResponse');
  });
});

// ─── H-09: Session refresh hook exists ───────────────────────────────────────

test.describe('Remediation S31 — H-09 session expiry handler', () => {
  test('useSessionRefresh hook exists', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(
      __dirname,
      '../../src/hooks/useSessionRefresh.ts',
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('onAuthStateChange');
    expect(content).toContain('SIGNED_OUT');
  });
});

// ─── H-10: fetchWithTimeout utility exists ───────────────────────────────────

test.describe('Remediation S31 — H-10 fetch timeout utility', () => {
  test('fetchWithTimeout utility exists and is used', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const utilPath = path.resolve(
      __dirname,
      '../../src/lib/fetch-with-timeout.ts',
    );
    expect(fs.existsSync(utilPath)).toBe(true);
    const content = fs.readFileSync(utilPath, 'utf-8');
    expect(content).toContain('AbortController');
    expect(content).toContain('timeoutMs');

    // Verify it's applied in useCreateProposal
    const hookPath = path.resolve(
      __dirname,
      '../../src/app/proposals/create/_hooks/useCreateProposal.ts',
    );
    const hookContent = fs.readFileSync(hookPath, 'utf-8');
    expect(hookContent).toContain('fetchWithTimeout');
  });
});

// ─── M-06: Unused reputation mock-data.ts deleted ────────────────────────────

test.describe('Remediation S31 — M-06 unused mock-data removed', () => {
  test('reputation mock-data.ts no longer exists', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(
      __dirname,
      '../../src/app/reputation/_components/mock-data.ts',
    );
    expect(fs.existsSync(filePath)).toBe(false);
  });
});

// ─── Route smoke tests — verify no regressions ──────────────────────────────

const SMOKE_ROUTES = [
  { label: 'landing page', path: '/' },
  { label: 'auth page', path: '/auth' },
  { label: 'pricing page', path: '/pricing' },
] as const;

test.describe('Remediation S31 — smoke tests (public routes)', () => {
  for (const route of SMOKE_ROUTES) {
    test(`${route.label} loads without errors`, async ({ page }) => {
      const errors = attachClientErrorCapture(page);
      const response = await page.goto(`${BASE}${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      expect(response?.status()).toBeLessThan(500);
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes('hydrat') &&
          !e.includes('favicon') &&
          !e.includes('sw.js'),
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }
});
