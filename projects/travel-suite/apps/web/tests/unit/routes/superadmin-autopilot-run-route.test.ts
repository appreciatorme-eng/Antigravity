import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const requireSuperAdminMock = vi.fn();
const buildAutopilotSnapshotMock = vi.fn();
const runBusinessDailyAutopilotMock = vi.fn();
const generateDailyOpsBriefMock = vi.fn();
const sendOpsAlertMock = vi.fn();
const resolveSlackWebhookConfigMock = vi.fn();
const logPlatformActionMock = vi.fn();
const logErrorMock = vi.fn();

vi.mock("@/lib/auth/require-super-admin", () => ({
  requireSuperAdmin: (...args: unknown[]) => requireSuperAdminMock(...args),
}));

vi.mock("@/lib/platform/business-os", () => ({
  buildAutopilotAuditDetails: vi.fn(() => ({ summary: "ok", run_key: "manual:user-1:2026-04-17T00:00", trigger: "manual" })),
  buildAutopilotSnapshot: (...args: unknown[]) => buildAutopilotSnapshotMock(...args),
  generateDailyOpsBrief: (...args: unknown[]) => generateDailyOpsBriefMock(...args),
  runBusinessDailyAutopilot: (...args: unknown[]) => runBusinessDailyAutopilotMock(...args),
}));

vi.mock("@/lib/god-slack", () => ({
  resolveSlackWebhookConfig: (...args: unknown[]) => resolveSlackWebhookConfigMock(...args),
  sendOpsAlert: (...args: unknown[]) => sendOpsAlertMock(...args),
}));

vi.mock("@/lib/platform/audit", () => ({
  getClientIpFromRequest: vi.fn(() => "127.0.0.1"),
  logPlatformAction: (...args: unknown[]) => logPlatformActionMock(...args),
}));

vi.mock("@/lib/observability/logger", () => ({
  logError: (...args: unknown[]) => logErrorMock(...args),
}));

function makeAuth(existingRunId?: string) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: existingRunId ? { id: existingRunId } : null,
  });
  const limit = vi.fn(() => ({ maybeSingle }));
  const order = vi.fn(() => ({ limit }));
  const filter = vi.fn(() => ({ order }));
  const eq = vi.fn(() => ({ filter }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    ok: true,
    userId: "user-1",
    adminClient: { from },
  };
}

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/superadmin/autopilot/run/route");
}

beforeEach(() => {
  vi.clearAllMocks();
  buildAutopilotSnapshotMock.mockResolvedValue({ generated_at: "2026-04-17T00:00:00.000Z" });
  runBusinessDailyAutopilotMock.mockResolvedValue({ ops_loop: { created_count: 1, candidate_count: 2 } });
  generateDailyOpsBriefMock.mockResolvedValue({ headline: "Brief", summary: "Summary", queue_focus: "Focus", priorities: [], gaps: [] });
  sendOpsAlertMock.mockResolvedValue(true);
  resolveSlackWebhookConfigMock.mockReturnValue({ configured: true, source: "SLACK_OPS_WEBHOOK_URL" });
  logPlatformActionMock.mockResolvedValue(undefined);
});

it("returns the existing snapshot when the run key already exists", async () => {
  requireSuperAdminMock.mockResolvedValue(makeAuth("existing-run"));

  const { POST } = await loadRoute();
  const response = await POST(new NextRequest("http://localhost/api/superadmin/autopilot/run", { method: "POST" }));
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(payload.skipped).toBe(true);
  expect(buildAutopilotSnapshotMock).toHaveBeenCalled();
  expect(runBusinessDailyAutopilotMock).not.toHaveBeenCalled();
});
