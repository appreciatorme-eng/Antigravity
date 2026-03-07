import { beforeEach, expect, it, vi } from "vitest";

const enforceRateLimitMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/share/[token]/route");
}

beforeEach(() => {
  vi.clearAllMocks();
  enforceRateLimitMock.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60_000,
  });
});

it("returns 404 for an unknown share token", async () => {
  createAdminClientMock.mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "missing" } }),
        })),
      })),
    })),
  });

  const { GET } = await loadRoute();
  const response = await GET(new Request("http://localhost/api/share/unknown"), {
    params: Promise.resolve({ token: "unknown-token" }),
  });

  expect(response.status).toBe(404);
});

it("does not expose email or phone fields in the public response", async () => {
  createAdminClientMock.mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "share-1",
              itinerary_id: "iti-1",
              client_comments: [],
              expires_at: "2026-03-10T00:00:00.000Z",
              status: "viewed",
              approved_by: null,
              approved_at: null,
              client_preferences: {},
              wishlist_items: [],
              self_service_status: "active",
              offline_pack_ready: true,
              email: "hidden@example.com",
              phone: "+15555550123",
            },
            error: null,
          }),
        })),
      })),
    })),
  });

  const { GET } = await loadRoute();
  const response = await GET(new Request("http://localhost/api/share/valid"), {
    params: Promise.resolve({ token: "valid-token" }),
  });
  const payload = await response.json();

  expect(payload).not.toHaveProperty("email");
  expect(payload).not.toHaveProperty("phone");
  expect(JSON.stringify(payload)).not.toContain("hidden@example.com");
  expect(JSON.stringify(payload)).not.toContain("+15555550123");
});
