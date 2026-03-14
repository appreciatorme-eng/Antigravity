import { test, expect, type Page } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

const REFACTORED_ROUTES = [
  { label: 'admin dashboard', path: '/admin' },
  { label: 'planner PDF surface', path: '/planner' },
  { label: 'onboarding flow', path: '/onboarding' },
  { label: 'admin insights', path: '/admin/insights' },
  { label: 'admin settings', path: '/admin/settings' },
] as const;

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

test.describe('Remediation S30 — H-01 marketing blog sanitization', () => {
  authTest('POST /api/blog sanitizes stored HTML payload if the route is available', async ({ adminPage, page }) => {
    const slug = `remediation-s30-${Date.now()}`;
    const createResponse = await adminPage.request.post('/api/blog', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        title: 'Remediation S30 XSS probe',
        slug,
        excerpt: 'Regression test payload',
        author_name: 'Codex',
        category: 'Security',
        tags: ['security', 'remediation'],
        published: true,
        content: '## Safe heading\n\n<script>window.__blogXssExecuted = true;</script>\n\nThis payload should be sanitized.',
      },
    });

    test.skip(
      [401, 403, 404, 405].includes(createResponse.status()),
      '/api/blog is not available to Playwright in this build, so the stored-payload write path cannot be exercised here.'
    );

    expect([200, 201]).toContain(createResponse.status());

    const created = await createResponse.json().catch(() => null) as
      | { slug?: string; data?: { slug?: string } }
      | null;
    const createdSlug = created?.slug ?? created?.data?.slug ?? slug;

    await page.addInitScript(() => {
      (window as typeof window & { __blogXssExecuted?: boolean }).__blogXssExecuted = false;
    });

    const response = await page.goto(`/blog/${createdSlug}`);
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    const article = page.locator('article.prose-custom');
    await expect(article).toBeVisible();
    await expect(article.locator('script')).toHaveCount(0);
    await expect(article).not.toContainText('window.__blogXssExecuted = true');

    const executed = await page.evaluate(
      () => (window as typeof window & { __blogXssExecuted?: boolean }).__blogXssExecuted ?? false
    );
    expect(executed).toBe(false);
  });

  test('published blog posts render without script tags or client-side execution', async ({ page }) => {
    await page.addInitScript(() => {
      (window as typeof window & { __blogXssExecuted?: boolean }).__blogXssExecuted = false;
    });

    const listingResponse = await page.goto('/blog');
    expect(listingResponse?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    const postLinks = page.locator('a[href^="/blog/"]');
    const publishedPostCount = await postLinks.count();
    test.skip(publishedPostCount === 0, 'No published blog posts are available in this environment; /blog is serving fallback cards only.');

    const href = await postLinks.first().getAttribute('href');
    expect(href).toBeTruthy();

    const response = await page.goto(href!);
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    const article = page.locator('article.prose-custom');
    await expect(article).toBeVisible();
    await expect(article.locator('script')).toHaveCount(0);

    const renderedHtml = await article.innerHTML();
    expect(renderedHtml).not.toContain('<script');

    const executed = await page.evaluate(
      () => (window as typeof window & { __blogXssExecuted?: boolean }).__blogXssExecuted ?? false
    );
    expect(executed).toBe(false);
  });
});

test.describe('Remediation S30 — H-02 through H-06 refactor smoke tests', () => {
  for (const route of REFACTORED_ROUTES) {
    authTest(`${route.label} loads without a 500`, async ({ adminPage }) => {
      const response = await adminPage.request.get(route.path);
      expect([200, 401]).toContain(response.status());

      const clientErrors = attachClientErrorCapture(adminPage);
      const pageResponse = await adminPage.goto(route.path);
      expect(pageResponse?.status()).toBeLessThan(500);
      await adminPage.waitForLoadState('networkidle');

      const unexpectedErrors = clientErrors.filter(
        (message) =>
          !message.includes('Invalid or missing environment variables') &&
          !message.includes('SKIP_ENV_VALIDATION') &&
          !message.includes('Failed to fetch')
      );
      expect(unexpectedErrors).toHaveLength(0);
    });
  }
});

test.describe('Remediation S30 — M-01 ForceField background dependency', () => {
  test('marketing blog page responds without module-resolution errors', async ({ request }) => {
    const response = await request.get('/blog');
    expect(response.status()).toBe(200);

    const html = await response.text();
    expect(html).toContain('TravelBuilt');
    expect(html).not.toContain('Module not found');
    expect(html).not.toContain('@tsparticles/slim');
  });
});
