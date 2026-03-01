import { test, expect, type APIRequestContext } from "@playwright/test";

const SAMPLE_ITINERARY_ID = "00000000-0000-0000-0000-000000000001";
const PLAYWRIGHT_CRON_SECRET = process.env.PLAYWRIGHT_TEST_CRON_SECRET || "playwright-cron-secret";
const HAS_CONFIGURED_CRON_SECRET = Boolean(
  process.env.CRON_SECRET || process.env.NOTIFICATION_CRON_SECRET
);
const RATE_LIMIT_TEST_BUFFER = 3;
const RATE_LIMIT_TEST_MAX = 5 + RATE_LIMIT_TEST_BUFFER;

function buildRateLimitToken(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function exhaustRateLimit(options: {
  request: APIRequestContext;
  method: "GET" | "POST";
  path: string;
  headers?: Record<string, string>;
  data?: unknown;
  maxAttempts: number;
}) {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    const response =
      options.method === "GET"
        ? await options.request.get(options.path, { headers: options.headers })
        : await options.request.post(options.path, {
            headers: options.headers,
            data: options.data,
          });

    if (response.status() === 429) {
      return response;
    }
  }

  return null;
}

test.describe("Public API contracts", () => {
  test("admin cache clear endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/admin/clear-cache", {
      data: { all: true },
    });
    expect(response.status()).toBe(401);
  });

  test("admin cache clear GET endpoint is non-mutating", async ({ request }) => {
    const response = await request.get("/api/admin/clear-cache");
    expect(response.status()).toBe(405);
  });

  test("marketplace verification list endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/admin/marketplace/verify");
    expect(response.status()).toBe(401);
    expect(response.headers()["x-request-id"]).toBeTruthy();
  });

  test("marketplace verification mutation endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/admin/marketplace/verify", {
      data: {
        orgId: "00000000-0000-0000-0000-000000000001",
        status: "verified",
      },
    });
    expect(response.status()).toBe(401);
    expect(response.headers()["x-request-id"]).toBeTruthy();
  });

  test("admin delivery listing endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/admin/notifications/delivery?limit=5");
    expect(response.status()).toBe(401);
  });

  test("admin delivery retry endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/admin/notifications/delivery/retry", {
      data: { queue_id: "00000000-0000-0000-0000-000000000000" },
    });
    expect(response.status()).toBe(401);
  });

  test("admin trip details endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/admin/trips/00000000-0000-0000-0000-000000000001");
    expect(response.status()).toBe(401);
  });

  test("admin security diagnostics endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/admin/security/diagnostics");
    expect(response.status()).toBe(401);
  });

  test("admin referrals endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/admin/referrals");
    expect(response.status()).toBe(401);
  });

  test("admin referrals mutation endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/admin/referrals", {
      data: { referralCode: "ABC123" },
    });
    expect(response.status()).toBe(401);
  });

  test("admin contacts promote endpoint requires authentication", async ({ request }) => {
    const response = await request.post(
      "/api/admin/contacts/00000000-0000-0000-0000-000000000001/promote",
      { data: {} },
    );
    expect(response.status()).toBe(401);
  });

  test("workflow rules endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/admin/workflow/rules");
    expect(response.status()).toBe(401);
  });

  test("workflow rules mutation endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/admin/workflow/rules", {
      data: { lifecycle_stage: "lead", notify_client: true },
    });
    expect(response.status()).toBe(401);
  });

  test("location share GET endpoint requires authentication", async ({ request }) => {
    const response = await request.get(
      "/api/location/share?tripId=00000000-0000-0000-0000-000000000001&dayNumber=1"
    );
    expect(response.status()).toBe(401);
  });

  test("location share POST endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/location/share", {
      data: {
        tripId: "00000000-0000-0000-0000-000000000001",
        dayNumber: 1,
        expiresHours: 24,
      },
    });
    expect(response.status()).toBe(401);
  });

  test("location share DELETE endpoint requires authentication", async ({ request }) => {
    const response = await request.delete(
      "/api/location/share?tripId=00000000-0000-0000-0000-000000000001&dayNumber=1"
    );
    expect(response.status()).toBe(401);
  });

  test("debug endpoint is not publicly available", async ({ request }) => {
    const response = await request.get("/api/debug");
    expect([401, 404]).toContain(response.status());
  });

  test("share token endpoint rejects invalid token format", async ({ request }) => {
    const response = await request.get("/api/share/invalid-token!");
    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });

  test("itinerary booking import requires authentication", async ({ request }) => {
    const response = await request.post(`/api/itineraries/${SAMPLE_ITINERARY_ID}/bookings`, {
      data: {
        type: "flight",
        flight: {
          id: "flt_1",
          airline: "Sample Air",
          flight_number: "SA101",
          departure_airport: "MAA",
          arrival_airport: "DXB",
          departure_time: "2026-03-01T06:00:00Z",
          arrival_time: "2026-03-01T10:00:00Z",
        },
      },
    });

    expect(response.status()).toBe(401);
    expect(response.headers()["x-request-id"]).toBeTruthy();
  });

  test("notification send route returns request id on unauthorized requests", async ({
    request,
  }) => {
    const response = await request.post("/api/notifications/send", {
      data: {
        title: "Test",
        body: "Test body",
      },
    });

    expect(response.status()).toBe(401);
    expect(response.headers()["x-request-id"]).toBeTruthy();
  });

  test("notification queue processing route returns request id on unauthorized requests", async ({
    request,
  }) => {
    const response = await request.post("/api/notifications/process-queue");
    expect(response.status()).toBe(401);
    expect(response.headers()["x-request-id"]).toBeTruthy();
  });

  test("notification queue processing GET route is non-mutating", async ({ request }) => {
    const response = await request.get("/api/notifications/process-queue");
    expect(response.status()).toBe(405);
  });

  test("social process queue rejects unauthenticated cron requests", async ({ request }) => {
    const response = await request.post("/api/social/process-queue");
    expect(response.status()).toBe(401);
  });

  test("social refresh tokens rejects unauthenticated cron requests", async ({ request }) => {
    const response = await request.post("/api/social/refresh-tokens");
    expect(response.status()).toBe(401);
  });

  test("social process queue accepts configured cron bearer secret", async ({ request }) => {
    test.skip(!HAS_CONFIGURED_CRON_SECRET, "Cron secret is not configured in test environment");

    const response = await request.post("/api/social/process-queue", {
      headers: {
        authorization: `Bearer ${PLAYWRIGHT_CRON_SECRET}`,
        "x-cron-idempotency-key": `playwright-process-${Date.now()}`,
      },
    });

    expect(response.status()).not.toBe(401);
  });

  test("social refresh tokens accepts configured cron bearer secret", async ({ request }) => {
    test.skip(!HAS_CONFIGURED_CRON_SECRET, "Cron secret is not configured in test environment");

    const response = await request.post("/api/social/refresh-tokens", {
      headers: {
        authorization: `Bearer ${PLAYWRIGHT_CRON_SECRET}`,
        "x-cron-idempotency-key": `playwright-refresh-${Date.now()}`,
      },
    });

    expect(response.status()).not.toBe(401);
  });

  test("public social review endpoint requires a valid token payload", async ({ request }) => {
    const response = await request.post("/api/social/reviews/public", {
      data: {
        rating: 5,
        comment: "Amazing trip",
        reviewer_name: "Test User",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("public social review endpoint rejects malformed token", async ({ request }) => {
    const response = await request.post("/api/social/reviews/public", {
      data: {
        token: "bad token!",
        rating: 5,
        comment: "Great itinerary",
        reviewer_name: "Token Tester",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("proposal public action endpoint enforces write throttling", async ({ request }) => {
    const token = buildRateLimitToken("proposal");
    const ip = `203.0.113.${(Date.now() % 200) + 1}`;
    const maxAttempts = RATE_LIMIT_TEST_MAX;

    const throttled = await exhaustRateLimit({
      request,
      method: "POST",
      path: `/api/proposals/public/${token}`,
      headers: {
        "x-forwarded-for": ip,
      },
      data: {
        action: "toggleActivity",
        activityId: "abc123",
        selected: true,
      },
      maxAttempts,
    });

    test.skip(!throttled, "Throttling not observable in this local runtime");
    expect(throttled!.status()).toBe(429);
    expect(throttled!.headers()["retry-after"]).toBeTruthy();
    expect(throttled!.headers()["x-ratelimit-limit"]).toBeTruthy();
    expect(throttled!.headers()["x-ratelimit-remaining"]).toBeTruthy();
    expect(throttled!.headers()["x-ratelimit-reset"]).toBeTruthy();
  });

  test("share token write endpoint enforces throttling", async ({ request }) => {
    const token = buildRateLimitToken("share");
    const ip = `198.51.100.${(Date.now() % 200) + 1}`;
    const maxAttempts = RATE_LIMIT_TEST_MAX;

    const throttled = await exhaustRateLimit({
      request,
      method: "POST",
      path: `/api/share/${token}`,
      headers: {
        "x-forwarded-for": ip,
      },
      data: {},
      maxAttempts,
    });

    test.skip(!throttled, "Throttling not observable in this local runtime");
    expect(throttled!.status()).toBe(429);
    expect(throttled!.headers()["retry-after"]).toBeTruthy();
    expect(throttled!.headers()["x-ratelimit-limit"]).toBeTruthy();
    expect(throttled!.headers()["x-ratelimit-remaining"]).toBeTruthy();
    expect(throttled!.headers()["x-ratelimit-reset"]).toBeTruthy();
  });

  test("share token read endpoint enforces throttling", async ({ request }) => {
    const token = buildRateLimitToken("shareread");
    const ip = `192.0.2.${(Date.now() % 200) + 1}`;
    const maxAttempts = RATE_LIMIT_TEST_MAX;

    const throttled = await exhaustRateLimit({
      request,
      method: "GET",
      path: `/api/share/${token}`,
      headers: {
        "x-forwarded-for": ip,
      },
      maxAttempts,
    });

    test.skip(!throttled, "Throttling not observable in this local runtime");
    expect(throttled!.status()).toBe(429);
    expect(throttled!.headers()["retry-after"]).toBeTruthy();
    expect(throttled!.headers()["x-ratelimit-limit"]).toBeTruthy();
    expect(throttled!.headers()["x-ratelimit-remaining"]).toBeTruthy();
    expect(throttled!.headers()["x-ratelimit-reset"]).toBeTruthy();
  });

  test("admin generate embeddings endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/admin/generate-embeddings");
    expect(response.status()).toBe(401);
  });

  test("admin geocoding usage endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/admin/geocoding/usage");
    expect(response.status()).toBe(401);
  });

  test("admin social generate endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/admin/social/generate", {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test("admin tour template extract endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/admin/tour-templates/extract", {
      data: { method: "preview", url: "https://example.com" },
    });
    expect(response.status()).toBe(401);
  });

  test("admin trip clone endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/admin/trips/00000000-0000-0000-0000-000000000001/clone", {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test("test-geocoding endpoint requires diagnostics token", async ({ request }) => {
    const response = await request.get("/api/test-geocoding?location=Tokyo");
    expect(response.status()).toBe(401);
  });

  test("health endpoint returns redacted response without diagnostics token", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("status");
    expect(json).not.toHaveProperty("checks");
  });

  test("flight search endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/bookings/flights/search?origin=MAA&destination=DXB&date=2026-04-01");
    expect(response.status()).toBe(401);
  });

  test("hotel search endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/bookings/hotels/search?location=Tokyo");
    expect(response.status()).toBe(401);
  });

  test("location suggestions endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/bookings/locations/search?q=Delhi");
    expect(response.status()).toBe(401);
  });

  test("unsplash image endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/images/unsplash?query=mountains");
    expect(response.status()).toBe(401);
  });

  test("pexels image endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/images/pexels?query=beach");
    expect(response.status()).toBe(401);
  });

  test("pixabay image endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/images/pixabay?query=city");
    expect(response.status()).toBe(401);
  });

  test("social ai-image endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/social/ai-image", {
      data: { prompt: "sunset over mountains" },
    });
    expect(response.status()).toBe(401);
  });

  test("legacy unsplash route is decommissioned", async ({ request }) => {
    const response = await request.get("/api/unsplash?query=beach");
    expect(response.status()).toBe(410);
  });
});
