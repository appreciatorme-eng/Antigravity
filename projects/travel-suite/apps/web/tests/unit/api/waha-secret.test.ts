import { expect, it } from "vitest";

import { validateWahaWebhookSecret } from "../../../src/app/api/_handlers/webhooks/waha/secret";

it("fails closed when the webhook secret is missing", () => {
  expect(
    validateWahaWebhookSecret({
      requestUrl: "https://app.example.com/api/webhooks/waha",
      configuredSecret: undefined,
      allowUnsigned: false,
      providedHeaderSecret: null,
    })
  ).toEqual({
    ok: false,
    status: 503,
    error: "Webhook not configured",
  });
});

it("allows unsigned requests only when explicitly enabled outside production", () => {
  expect(
    validateWahaWebhookSecret({
      requestUrl: "https://app.example.com/api/webhooks/waha",
      configuredSecret: undefined,
      allowUnsigned: true,
      providedHeaderSecret: null,
    })
  ).toEqual({ ok: true });
});

it("rejects invalid shared secrets", () => {
  expect(
    validateWahaWebhookSecret({
      requestUrl: "https://app.example.com/api/webhooks/waha",
      configuredSecret: "secret-123",
      allowUnsigned: false,
      providedHeaderSecret: "wrong",
    })
  ).toEqual({
    ok: false,
    status: 401,
    error: "Invalid or missing webhook secret",
  });
});

it("accepts valid secrets from the header", () => {
  expect(
    validateWahaWebhookSecret({
      requestUrl: "https://app.example.com/api/webhooks/waha",
      configuredSecret: "secret-123",
      allowUnsigned: false,
      providedHeaderSecret: "secret-123",
    })
  ).toEqual({ ok: true });
});

it("accepts valid secrets passed via query string (WPPConnect fallback)", () => {
  expect(
    validateWahaWebhookSecret({
      requestUrl: "https://app.example.com/api/webhooks/waha?secret=secret-123",
      configuredSecret: "secret-123",
      allowUnsigned: false,
      providedHeaderSecret: null,
    })
  ).toEqual({ ok: true });
});

it("rejects invalid secrets passed via query string", () => {
  expect(
    validateWahaWebhookSecret({
      requestUrl: "https://app.example.com/api/webhooks/waha?secret=wrong",
      configuredSecret: "secret-123",
      allowUnsigned: false,
      providedHeaderSecret: null,
    })
  ).toEqual({
    ok: false,
    status: 401,
    error: "Invalid or missing webhook secret",
  });
});
