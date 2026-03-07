import { afterEach, expect, it } from "vitest";
import { isUnsignedWebhookAllowed } from "../../../src/lib/security/whatsapp-webhook-config";

const originalNodeEnv = process.env.NODE_ENV;
const originalUnsignedWebhookFlag = process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK;

afterEach(() => {
  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }

  if (originalUnsignedWebhookFlag === undefined) {
    delete process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK;
  } else {
    process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = originalUnsignedWebhookFlag;
  }
});

it("isUnsignedWebhookAllowed is always false in production", () => {
  process.env.NODE_ENV = "production";
  process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = "true";
  expect(isUnsignedWebhookAllowed()).toBe(false);
});

it("isUnsignedWebhookAllowed allows unsigned payloads only in non-production when enabled", () => {
  process.env.NODE_ENV = "development";
  process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = "true";
  expect(isUnsignedWebhookAllowed()).toBe(true);
});

it("isUnsignedWebhookAllowed defaults to strict mode in non-production", () => {
  process.env.NODE_ENV = "development";
  delete process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK;
  expect(isUnsignedWebhookAllowed()).toBe(false);
});
