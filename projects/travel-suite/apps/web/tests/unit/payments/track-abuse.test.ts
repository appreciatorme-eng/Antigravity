import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const getPaymentLinkByTokenMock = vi.fn();
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
    getPaymentLinkByToken: getPaymentLinkByTokenMock,
    recordPaymentLinkEvent: recordPaymentLinkEventMock,
  }));
  vi.doMock("@/lib/security/rate-limit", () => ({
    enforceRateLimit: vi.fn().mockResolvedValue({ success: true }),
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
  getPaymentLinkByTokenMock.mockResolvedValue({
    token: "token-12345678",
    status: "viewed",
  });
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

it("returns the current link state for a known token", async () => {
  const { GET } = await loadTrackRoute();
  const response = await GET(
    new NextRequest("http://localhost/api/payments/track/token-12345678"),
    { params: Promise.resolve({ token: "token-12345678" }) },
  );
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(getPaymentLinkByTokenMock).toHaveBeenCalledWith(
    {},
    "token-12345678",
    "http://localhost",
  );
  expect(payload.error).toBeNull();
});

it("returns 404 when the tracked link does not exist", async () => {
  getPaymentLinkByTokenMock.mockResolvedValueOnce(null);

  const { GET } = await loadTrackRoute();
  const response = await GET(
    new NextRequest("http://localhost/api/payments/track/token-12345678"),
    { params: Promise.resolve({ token: "token-12345678" }) },
  );

  expect(response.status).toBe(404);
});

it("rejects cancelled tracking events from the public endpoint", async () => {
  const { POST } = await loadTrackRoute();
  const response = await POST(buildTrackRequest("cancelled"), {
    params: Promise.resolve({ token: "token-12345678" }),
  });

  expect(response.status).toBe(400);
  expect(recordPaymentLinkEventMock).not.toHaveBeenCalled();
});

it("rejects malformed JSON bodies", async () => {
  const { POST } = await loadTrackRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/payments/track/token-12345678", {
      method: "POST",
      body: "{not-json",
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ token: "token-12345678" }) },
  );

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

it("returns 404 when a valid event targets an unknown payment link", async () => {
  recordPaymentLinkEventMock.mockResolvedValueOnce(null);

  const { POST } = await loadTrackRoute();
  const response = await POST(buildTrackRequest("viewed"), {
    params: Promise.resolve({ token: "token-12345678" }),
  });

  expect(response.status).toBe(404);
});

it("returns 500 when payment link tracking storage fails", async () => {
  recordPaymentLinkEventMock.mockRejectedValueOnce(new Error("boom"));

  const { POST } = await loadTrackRoute();
  const response = await POST(buildTrackRequest("viewed"), {
    params: Promise.resolve({ token: "token-12345678" }),
  });

  expect(response.status).toBe(500);
  expect(logErrorMock).toHaveBeenCalledWith(
    "[payments/track/:token] update failed",
    expect.any(Error),
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
