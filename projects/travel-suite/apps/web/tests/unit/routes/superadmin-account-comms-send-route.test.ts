import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const requireSuperAdminMock = vi.fn();
const getAccountDetailMock = vi.fn();
const loadCommsSequencesMock = vi.fn();
const sendEmailForOrgMock = vi.fn();
const runBusinessOsEventAutomationMock = vi.fn();

vi.mock("@/lib/auth/require-super-admin", () => ({
  requireSuperAdmin: (...args: unknown[]) => requireSuperAdminMock(...args),
}));

vi.mock("@/lib/platform/god-accounts", () => ({
  getAccountDetail: (...args: unknown[]) => getAccountDetailMock(...args),
  loadGodWorkItems: vi.fn().mockResolvedValue([]),
  updateGodWorkItem: vi.fn(),
}));

vi.mock("@/lib/platform/business-comms", () => ({
  loadCommsSequences: (...args: unknown[]) => loadCommsSequencesMock(...args),
  updateCommsSequence: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmailForOrg: (...args: unknown[]) => sendEmailForOrgMock(...args),
}));

vi.mock("@/lib/platform/business-os", () => ({
  runBusinessOsEventAutomation: (...args: unknown[]) => runBusinessOsEventAutomationMock(...args),
}));

vi.mock("@/lib/platform/audit", () => ({
  getClientIpFromRequest: vi.fn(() => "127.0.0.1"),
  logPlatformActionWithTarget: vi.fn(),
}));

vi.mock("@/lib/platform/org-memory", () => ({
  recordOrgActivityEvent: vi.fn(),
}));

vi.mock("@/lib/payments/payment-links.server", () => ({
  ensureCollectionsPaymentLink: vi.fn(),
}));

vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
}));

async function loadRoute() {
  vi.resetModules();
  return import("../../../../src/app/api/_handlers/superadmin/accounts/[orgId]/comms/[id]/send/route");
}

beforeEach(() => {
  vi.clearAllMocks();
  requireSuperAdminMock.mockResolvedValue({
    ok: true,
    userId: "user-1",
    adminClient: { from: vi.fn() },
  });
  getAccountDetailMock.mockResolvedValue({
    organization: { id: "org-1", name: "Avi Travels" },
    members: [{ email: "ops@example.com", is_suspended: false, full_name: "Ops" }],
    snapshot: { overdue_balance: 0 },
  });
  loadCommsSequencesMock.mockResolvedValue([
    {
      id: "seq-1",
      channel: "mixed",
      last_sent_at: null,
      step_index: 0,
      sequence_type: "collections",
      metadata: { send_state: "draft" },
    },
  ]);
});

it("rejects customer communication sends until approval is recorded", async () => {
  const { POST } = await loadRoute();
  const response = await POST(
    new NextRequest("http://localhost/api/superadmin/accounts/org-1/comms/seq-1/send", {
      method: "POST",
    }),
    { params: Promise.resolve({ orgId: "org-1", id: "seq-1" }) },
  );
  const payload = await response.json();

  expect(response.status).toBe(409);
  expect(payload.error).toContain("not approved");
  expect(sendEmailForOrgMock).not.toHaveBeenCalled();
  expect(runBusinessOsEventAutomationMock).not.toHaveBeenCalled();
});
