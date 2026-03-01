import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { passesMutationCsrfGuard } from "../../../src/lib/security/admin-mutation-csrf";

const originalCsrfToken = process.env.ADMIN_MUTATION_CSRF_TOKEN;

function makeRequest(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/admin/clear-cache", {
    method: "POST",
    headers: {
      host: "localhost",
      ...headers,
    },
  });
}

afterEach(() => {
  if (originalCsrfToken === undefined) {
    delete process.env.ADMIN_MUTATION_CSRF_TOKEN;
  } else {
    process.env.ADMIN_MUTATION_CSRF_TOKEN = originalCsrfToken;
  }
});

test("passesMutationCsrfGuard allows bearer requests", () => {
  const request = makeRequest({
    authorization: "Bearer token",
  });
  assert.equal(passesMutationCsrfGuard(request), true);
});

test("passesMutationCsrfGuard enforces configured csrf token", () => {
  process.env.ADMIN_MUTATION_CSRF_TOKEN = "expected-token";

  const validRequest = makeRequest({
    "x-admin-csrf": "expected-token",
  });
  assert.equal(passesMutationCsrfGuard(validRequest), true);

  const invalidRequest = makeRequest({
    "x-admin-csrf": "wrong-token",
  });
  assert.equal(passesMutationCsrfGuard(invalidRequest), false);
});

test("passesMutationCsrfGuard falls back to same-origin check when no csrf token configured", () => {
  delete process.env.ADMIN_MUTATION_CSRF_TOKEN;

  const trustedRequest = makeRequest({
    origin: "http://localhost",
    referer: "http://localhost/admin",
  });
  assert.equal(passesMutationCsrfGuard(trustedRequest), true);

  const untrustedRequest = makeRequest({
    origin: "https://evil.example",
  });
  assert.equal(passesMutationCsrfGuard(untrustedRequest), false);
});
