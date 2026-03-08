import { afterEach, beforeEach, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const handleWhatsAppMessageMock = vi.fn();
const isUnsignedWebhookAllowedMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/assistant/channel-adapters/whatsapp", () => ({
  handleWhatsAppMessage: handleWhatsAppMessageMock,
}));

vi.mock("@/lib/security/whatsapp-webhook-config", () => ({
  isUnsignedWebhookAllowed: isUnsignedWebhookAllowedMock,
}));

const originalWebhookSecret = process.env.WPPCONNECT_WEBHOOK_SECRET;

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/webhooks/waha/route");
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.WPPCONNECT_WEBHOOK_SECRET;
  isUnsignedWebhookAllowedMock.mockReturnValue(false);
});

afterEach(() => {
  if (originalWebhookSecret === undefined) {
    delete process.env.WPPCONNECT_WEBHOOK_SECRET;
  } else {
    process.env.WPPCONNECT_WEBHOOK_SECRET = originalWebhookSecret;
  }
});

it("returns 503 when the webhook secret is not configured", async () => {
  const { POST } = await loadRoute();
  const response = await POST(
    new Request("http://localhost/api/webhooks/waha", {
      method: "POST",
      body: JSON.stringify({ event: "onMessage" }),
      headers: { "content-type": "application/json" },
    })
  );

  expect(response.status).toBe(503);
}, 10000);

it("returns 401 when the provided secret is invalid", async () => {
  process.env.WPPCONNECT_WEBHOOK_SECRET = "expected";

  const { POST } = await loadRoute();
  const response = await POST(
    new Request("http://localhost/api/webhooks/waha", {
      method: "POST",
      body: JSON.stringify({ event: "onMessage" }),
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": "wrong",
      },
    })
  );

  expect(response.status).toBe(401);
});

it("processes a valid state-change webhook", async () => {
  process.env.WPPCONNECT_WEBHOOK_SECRET = "expected";

  const eqMock = vi.fn().mockResolvedValue({});
  const updateMock = vi.fn(() => ({ eq: eqMock }));
  createAdminClientMock.mockReturnValue({
    from: vi.fn(() => ({
      update: updateMock,
    })),
  });

  const { POST } = await loadRoute();
  const response = await POST(
    new Request("http://localhost/api/webhooks/waha", {
      method: "POST",
      body: JSON.stringify({
        event: "onStateChange",
        session: "org_123",
        response: "CONNECTED",
      }),
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": "expected",
      },
    })
  );

  expect(response.status).toBe(200);
  expect(updateMock).toHaveBeenCalled();
  expect(eqMock).toHaveBeenCalledWith("session_name", "org_123");
});
