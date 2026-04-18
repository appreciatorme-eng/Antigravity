import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const requireSuperAdminMock = vi.fn();
const buildAutopilotSnapshotMock = vi.fn();

vi.mock("@/lib/auth/require-super-admin", () => ({
  requireSuperAdmin: (...args: unknown[]) => requireSuperAdminMock(...args),
}));

vi.mock("@/lib/platform/business-os", () => ({
  buildAutopilotSnapshot: (...args: unknown[]) => buildAutopilotSnapshotMock(...args),
}));

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/superadmin/autopilot/route");
}

beforeEach(() => {
  vi.clearAllMocks();
  requireSuperAdminMock.mockResolvedValue({
    ok: true,
    userId: "user-1",
    adminClient: { from: vi.fn() },
  });
  buildAutopilotSnapshotMock.mockResolvedValue({
    generated_at: "2026-04-17T00:00:00.000Z",
    summary: { pending_approvals: 0 },
    roi_scorecard: {
      estimated_hours_saved: 0,
      estimated_hours_saved_provenance: "estimated",
      cash_recovered_inr: null,
      cash_recovered_provenance: "unknown",
    },
  });
});

it("returns the shared Autopilot snapshot payload", async () => {
  const { GET } = await loadRoute();
  const response = await GET(new NextRequest("http://localhost/api/superadmin/autopilot"));
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(buildAutopilotSnapshotMock).toHaveBeenCalledWith(expect.anything(), "user-1");
  expect(payload.generated_at).toBe("2026-04-17T00:00:00.000Z");
});
