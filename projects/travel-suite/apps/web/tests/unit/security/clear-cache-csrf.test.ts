import { afterEach, expect, it } from "vitest";
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

it("passesMutationCsrfGuard allows bearer requests", () => {
  const request = makeRequest({
    authorization: "Bearer token",
  });
  expect(passesMutationCsrfGuard(request)).toBe(true);
});

it("passesMutationCsrfGuard enforces configured csrf token", () => {
  process.env.ADMIN_MUTATION_CSRF_TOKEN = "expected-token";

  const validRequest = makeRequest({
    "x-admin-csrf": "expected-token",
  });
  expect(passesMutationCsrfGuard(validRequest)).toBe(true);

  const invalidRequest = makeRequest({
    "x-admin-csrf": "wrong-token",
  });
  expect(passesMutationCsrfGuard(invalidRequest)).toBe(false);
});

it("passesMutationCsrfGuard falls back to same-origin check when no csrf token configured", () => {
  delete process.env.ADMIN_MUTATION_CSRF_TOKEN;

  const trustedRequest = makeRequest({
    origin: "http://localhost",
    referer: "http://localhost/admin",
  });
  expect(passesMutationCsrfGuard(trustedRequest)).toBe(true);

  const untrustedRequest = makeRequest({
    origin: "https://evil.example",
  });
  expect(passesMutationCsrfGuard(untrustedRequest)).toBe(false);
});
