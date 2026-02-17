import type { Page } from '@playwright/test';

export async function gotoWithRetry(page: Page, url: string, attempts = 3) {
  let lastError: unknown;

  for (let i = 0; i < attempts; i += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      return;
    } catch (error) {
      lastError = error;
      const message = String(error);
      const isFirefoxAbort =
        message.includes('NS_BINDING_ABORTED') || message.includes('maybe frame was detached');

      if (!isFirefoxAbort || i === attempts - 1) {
        throw error;
      }

      await page.waitForTimeout(250);
    }
  }

  throw lastError;
}
