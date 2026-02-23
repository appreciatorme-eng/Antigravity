import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, request, test as setup } from '@playwright/test';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required E2E credential env var: ${name}`);
  }
  return value;
}

const TEST_USERS = {
  client: {
    email: requiredEnv('TEST_CLIENT_EMAIL'),
    password: requiredEnv('TEST_CLIENT_PASSWORD'),
  },
  admin: {
    email: requiredEnv('TEST_ADMIN_EMAIL'),
    password: requiredEnv('TEST_ADMIN_PASSWORD'),
  },
  driver: {
    email: requiredEnv('TEST_DRIVER_EMAIL'),
    password: requiredEnv('TEST_DRIVER_PASSWORD'),
  },
} as const;

const AUTH_STATE_DIR = path.resolve(__dirname, '..', '.auth');

setup('create authenticated storage states', async ({ baseURL }) => {
  expect(baseURL, 'baseURL is required in Playwright config').toBeTruthy();
  await fs.mkdir(AUTH_STATE_DIR, { recursive: true });

  for (const [role, user] of Object.entries(TEST_USERS)) {
    const api = await request.newContext({ baseURL });
    let lastError = 'unknown error';
    let success = false;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const response = await api.post('/api/auth/password-login', { data: user });

        if (response.ok()) {
          success = true;
          break;
        }

        const payload = await response.json().catch(() => ({}));
        lastError = `${response.status()} ${String(payload.error || '')}`.trim();
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 + attempt * 500));
    }

    expect(success, `Failed to create auth state for ${role}: ${lastError}`).toBeTruthy();
    await api.storageState({ path: path.join(AUTH_STATE_DIR, `${role}.json`) });
    await api.dispose();
  }
});
