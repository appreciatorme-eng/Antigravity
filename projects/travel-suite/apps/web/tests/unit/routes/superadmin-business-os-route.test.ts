import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const requireSuperAdminMock = vi.fn();
const buildBusinessOsPayloadMock = vi.fn();

vi.mock("@/lib/auth/require-super-admin", () => ({
  requireSuperAdmin: (...args: unknown[]) => requireSuperAdminMock(...args),
}));

vi.mock("@/lib/platform/business-os", () => ({
  buildBusinessOsPayload: (...args: unknown[]) => buildBusinessOsPayloadMock(...args),
}));

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/superadmin/business-os/route");
}

beforeEach(() => {
  vi.clearAllMocks();
  requireSuperAdminMock.mockResolvedValue({
    ok: true,
    userId: "user-1",
    adminClient: { from: vi.fn() },
  });
  buildBusinessOsPayloadMock.mockResolvedValue({
    generated_at: "2026-04-17T00:00:00.000Z",
    current_user_id: "user-1",
    accounts: [],
    selected_org_id: null,
    selected_account: null,
  });
});

it("returns the shared Business OS workspace payload", async () => {
  const { GET } = await loadRoute();
  const response = await GET(new NextRequest("http://localhost/api/superadmin/business-os?owner=unowned&activation_risk=true&search=avi"));
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(buildBusinessOsPayloadMock).toHaveBeenCalledWith(
    expect.anything(),
    "user-1",
    expect.objectContaining({
      owner: "unowned",
      activation_risk: true,
      search: "avi",
    }),
  );
  expect(payload.generated_at).toBe("2026-04-17T00:00:00.000Z");
});

it("returns the auth response when the requester is not a super admin", async () => {
  requireSuperAdminMock.mockResolvedValue({
    ok: false,
    response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  });

  const { GET } = await loadRoute();
  const response = await GET(new NextRequest("http://localhost/api/superadmin/business-os"));

  expect(response.status).toBe(401);
});
