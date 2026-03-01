import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, request, test as setup } from '@playwright/test';

type UserType = 'client' | 'admin' | 'driver';

type Credential = {
  email: string;
  password: string;
};

function readCredential(prefix: string): Credential | null {
  const email = process.env[`${prefix}_EMAIL`]?.trim();
  const password = process.env[`${prefix}_PASSWORD`]?.trim();

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

const TEST_USERS: Record<UserType, Credential | null> = {
  client: readCredential('TEST_CLIENT'),
  admin: readCredential('TEST_ADMIN'),
  driver: readCredential('TEST_DRIVER'),
};

const AUTH_STATE_DIR = path.resolve(__dirname, '..', '.auth');

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

setup('create authenticated storage states', async ({ baseURL }, testInfo) => {
  expect(baseURL, 'baseURL is required in Playwright config').toBeTruthy();
  await fs.mkdir(AUTH_STATE_DIR, { recursive: true });

  const roles = Object.keys(TEST_USERS) as UserType[];
  const rolesMissingCredential: UserType[] = [];

  for (const role of roles) {
    const user = TEST_USERS[role];
    const statePath = path.join(AUTH_STATE_DIR, `${role}.json`);

    if (!user) {
      const hasState = await fileExists(statePath);
      if (!hasState) {
        rolesMissingCredential.push(role);
      }
      continue;
    }

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
    await api.storageState({ path: statePath });
    await api.dispose();
  }

  if (rolesMissingCredential.length === roles.length) {
    testInfo.skip(true, `Missing auth credentials for all E2E roles (${roles.join(', ')}). Set TEST_CLIENT_*, TEST_ADMIN_*, TEST_DRIVER_* env vars.`);
    return;
  }

  if (rolesMissingCredential.length > 0) {
    // Setup can proceed if those state files already exist from previous runs.
    console.warn(
      `[e2e] Missing credentials for roles: ${rolesMissingCredential.join(', ')}. ` +
        'Tests requiring those roles will be skipped unless prebuilt auth state is present.'
    );
  }
});
