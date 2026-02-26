import { test, expect } from "@playwright/test";

const SAMPLE_ITINERARY_ID = "00000000-0000-0000-0000-000000000001";

test.describe("Public API contracts", () => {
  test("admin cache clear endpoint requires authentication", async ({ request }) => {
    const response = await request.get("/api/admin/clear-cache");
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
});
