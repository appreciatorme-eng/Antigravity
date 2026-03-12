import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const recordPaymentLinkEventMock = vi.fn();
const logErrorMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logError: logErrorMock,
}));

vi.mock("@/lib/config/env", () => ({
  env: {
    razorpay: {
      keyId: undefined,
      keySecret: "test-secret",
      publicKeyId: undefined,
      webhookSecret: undefined,
    },
    supabase: {
      url: undefined,
      anonKey: undefined,
      serviceRoleKey: "test-service-role",
    },
    wppconnect: {
      baseUrl: undefined,
      token: undefined,
      session: "default",
    },
    resend: {
      apiKey: undefined,
      fromEmail: undefined,
      fromName: "Antigravity Travel",
    },
    sentry: {
      dsn: undefined,
    },
    posthog: {
      key: undefined,
    },
    google: {
      placesApiKey: undefined,
      geminiApiKey: undefined,
    },
    app: {
      url: undefined,
    },
  },
}));

vi.mock("@/lib/payments/payment-service", () => ({
  paymentService: {},
}));

async function loadTrackRoute() {
  vi.resetModules();
  vi.doMock("@/lib/payments/payment-links.server", () => ({
    getPaymentLinkByToken: vi.fn(),
    recordPaymentLinkEvent: recordPaymentLinkEventMock,
  }));

  return import("../../../src/app/api/_handlers/payments/track/[token]/route");
}

function buildTrackRequest(event: string) {
  return new NextRequest("http://localhost/api/payments/track/token-12345678", {
    method: "POST",
    body: JSON.stringify({ event }),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  createAdminClientMock.mockReturnValue({});
  recordPaymentLinkEventMock.mockResolvedValue({
    token: "token-12345678",
    status: "viewed",
  });
});

it("rejects paid tracking events from the public endpoint", async () => {
  const { POST } = await loadTrackRoute();
  const response = await POST(buildTrackRequest("paid"), {
    params: Promise.resolve({ token: "token-12345678" }),
  });

  expect(response.status).toBe(400);
  expect(recordPaymentLinkEventMock).not.toHaveBeenCalled();
});

it("rejects cancelled tracking events from the public endpoint", async () => {
  const { POST } = await loadTrackRoute();
  const response = await POST(buildTrackRequest("cancelled"), {
    params: Promise.resolve({ token: "token-12345678" }),
  });

  expect(response.status).toBe(400);
  expect(recordPaymentLinkEventMock).not.toHaveBeenCalled();
});

it("allows viewed tracking events", async () => {
  const { POST } = await loadTrackRoute();
  const response = await POST(buildTrackRequest("viewed"), {
    params: Promise.resolve({ token: "token-12345678" }),
  });
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(recordPaymentLinkEventMock).toHaveBeenCalledWith(
    {},
    expect.objectContaining({
      token: "token-12345678",
      event: "viewed",
    }),
  );
  expect(payload.error).toBeNull();
});

it("allows sent tracking events", async () => {
  const { POST } = await loadTrackRoute();
  const response = await POST(buildTrackRequest("sent"), {
    params: Promise.resolve({ token: "token-12345678" }),
  });

  expect(response.status).toBe(200);
  expect(recordPaymentLinkEventMock).toHaveBeenCalledWith(
    {},
    expect.objectContaining({
      token: "token-12345678",
      event: "sent",
    }),
  );
});

it("throws when paid is recorded without a verified caller", async () => {
  const { recordPaymentLinkEvent } = await vi.importActual<
    typeof import("../../../src/lib/payments/payment-links.server")
  >("../../../src/lib/payments/payment-links.server");

  await expect(
    recordPaymentLinkEvent({} as Parameters<typeof recordPaymentLinkEvent>[0], {
      token: "token-12345678",
      event: "paid",
    }),
  ).rejects.toThrow(/must come through verified webhook/i);
});
