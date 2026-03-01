import { test, expect } from "@playwright/test";

const SAMPLE_ITINERARY_ID = "00000000-0000-0000-0000-000000000001";
const PLAYWRIGHT_CRON_SECRET = process.env.PLAYWRIGHT_TEST_CRON_SECRET || "playwright-cron-secret";

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

  test("social process queue rejects unauthenticated cron requests", async ({ request }) => {
    const response = await request.post("/api/social/process-queue");
    expect(response.status()).toBe(401);
  });

  test("social refresh tokens rejects unauthenticated cron requests", async ({ request }) => {
    const response = await request.post("/api/social/refresh-tokens");
    expect(response.status()).toBe(401);
  });

  test("social process queue accepts configured cron bearer secret", async ({ request }) => {
    const response = await request.post("/api/social/process-queue", {
      headers: {
        authorization: `Bearer ${PLAYWRIGHT_CRON_SECRET}`,
        "x-cron-idempotency-key": `playwright-process-${Date.now()}`,
      },
    });

    expect(response.status()).not.toBe(401);
  });

  test("social refresh tokens accepts configured cron bearer secret", async ({ request }) => {
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

  test("admin generate embeddings endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/admin/generate-embeddings");
    expect(response.status()).toBe(401);
  });

  test("admin geocoding usage endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/admin/geocoding/usage");
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
