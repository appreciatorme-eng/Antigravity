import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const authorizeCronRequestMock = vi.fn();
const requireSuperAdminMock = vi.fn();
const runBusinessOsEventAutomationMock = vi.fn();
const logPlatformActionMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock("@/lib/security/cron-auth", () => ({
  authorizeCronRequest: (...args: unknown[]) => authorizeCronRequestMock(...args),
}));

vi.mock("@/lib/auth/require-super-admin", () => ({
  requireSuperAdmin: (...args: unknown[]) => requireSuperAdminMock(...args),
}));

vi.mock("@/lib/platform/business-os", () => ({
  runBusinessOsEventAutomation: (...args: unknown[]) => runBusinessOsEventAutomationMock(...args),
}));

vi.mock("@/lib/platform/audit", () => ({
  logPlatformAction: (...args: unknown[]) => logPlatformActionMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}));

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/superadmin/autopilot/event-trigger/route");
}

beforeEach(() => {
  vi.clearAllMocks();
  authorizeCronRequestMock.mockResolvedValue({ authorized: false });
  requireSuperAdminMock.mockResolvedValue({
    ok: true,
    response: new Response(null, { status: 401 }),
  });
  createAdminClientMock.mockReturnValue({ from: vi.fn() });
  runBusinessOsEventAutomationMock.mockResolvedValue({
    state_updated: true,
    work_items_created: 2,
  });
  logPlatformActionMock.mockResolvedValue(undefined);
});

it("runs the event automation for a valid trigger", async () => {
  const { POST } = await loadRoute();
  const response = await POST(new NextRequest("http://localhost/api/superadmin/autopilot/event-trigger", {
    method: "POST",
    body: JSON.stringify({ org_id: "org-1", trigger: "collections_updated" }),
    headers: { "content-type": "application/json" },
  }));
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(payload.success).toBe(true);
  expect(runBusinessOsEventAutomationMock).toHaveBeenCalledWith(expect.anything(), {
    orgId: "org-1",
    currentUserId: null,
    trigger: "collections_updated",
  });
});

it("rejects invalid triggers", async () => {
  const { POST } = await loadRoute();
  const response = await POST(new NextRequest("http://localhost/api/superadmin/autopilot/event-trigger", {
    method: "POST",
    body: JSON.stringify({ org_id: "org-1", trigger: "bad_trigger" }),
    headers: { "content-type": "application/json" },
  }));

  expect(response.status).toBe(400);
});
