import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCachedContextSnapshotMock,
  generateDailyOpsBriefMock,
  loadHandoffQueueItemsMock,
} = vi.hoisted(() => ({
  getCachedContextSnapshotMock: vi.fn(),
  generateDailyOpsBriefMock: vi.fn(),
  loadHandoffQueueItemsMock: vi.fn(),
}));

vi.mock("@/lib/assistant/context-engine", () => ({
  getCachedContextSnapshot: getCachedContextSnapshotMock,
}));

vi.mock("@/lib/platform/business-os", () => ({
  generateDailyOpsBrief: generateDailyOpsBriefMock,
}));

vi.mock("@/lib/assistant/actions/ops", () => ({
  loadHandoffQueueItems: loadHandoffQueueItemsMock,
}));

import { buildOwnerAgenda, formatOwnerAgenda } from "@/lib/assistant/owner-agenda";
import type { ActionContext } from "@/lib/assistant/types";

function createSupabaseStub() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: { session_name: "org_1234" } })),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
  };

  return {
    from: vi.fn(() => builder),
  };
}

describe("owner agenda guard rails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCachedContextSnapshotMock.mockResolvedValue({
      generatedAt: "2026-04-20T00:00:00.000Z",
      todayTrips: [],
      pendingInvoices: [],
      recentClients: [],
      failedNotifications: [],
    });
    loadHandoffQueueItemsMock.mockResolvedValue([]);
  });

  it("does not use Business OS for whatsapp_group agendas", async () => {
    generateDailyOpsBriefMock.mockResolvedValue({
      headline: "Cross-org leak",
      summary: "Should never appear",
      queue_focus: "Should never appear",
      priorities: ["Another org"],
      gaps: ["Another org gap"],
    });

    const ctx = {
      organizationId: "org_1",
      userId: "user_1",
      channel: "whatsapp_group",
      supabase: createSupabaseStub(),
    } as unknown as ActionContext;

    const agenda = await buildOwnerAgenda(ctx);

    expect(generateDailyOpsBriefMock).not.toHaveBeenCalled();
    expect(agenda.source).toBe("fallback");
    expect(agenda.headline).toBe("Your operations agenda is ready.");
    expect(agenda.topPriorities).not.toContain("Another org");
  });

  it("still allows Business OS for web agendas", async () => {
    generateDailyOpsBriefMock.mockResolvedValue({
      headline: "Web headline",
      summary: "Web summary",
      queue_focus: "Web focus",
      priorities: ["Priority 1"],
      gaps: ["Gap 1"],
    });

    const ctx = {
      organizationId: "org_1",
      userId: "user_1",
      channel: "web",
      supabase: createSupabaseStub(),
    } as unknown as ActionContext;

    const agenda = await buildOwnerAgenda(ctx);

    expect(generateDailyOpsBriefMock).toHaveBeenCalledTimes(1);
    expect(agenda.source).toBe("business_os");
    expect(agenda.headline).toBe("Web headline");
  });

  it("formats whatsapp agenda without repeating handoff items twice", () => {
    const formatted = formatOwnerAgenda({
      headline: "Your operations agenda is ready.",
      summary: "1 pending payment",
      queueFocus: "Send the pending proposals first, then clear the overdue payment.",
      topPriorities: [
        'test3 — proposal "Moderate 5-day Bali Itinerary" ready to send',
        'Avinash Reddy pusapati — proposal "Thailand Tour Package" ready to send',
        'test1 — proposal "Thailand Tour Package" ready to send',
        "Avinash Reddy pusapati — INR 94,403.54 overdue",
      ],
      gaps: [],
      needsResponse: [],
      handoffItems: [
        'test3 — proposal "Moderate 5-day Bali Itinerary" ready to send',
        'Avinash Reddy pusapati — proposal "Thailand Tour Package" ready to send',
      ],
      collectionsActions: [
        "Avinash Reddy pusapati — INR 94,403.54 overdue",
      ],
      tripRisks: [],
      recommendedNextActions: [
        { label: "Clear handoff", prefilledMessage: "handoff" },
        { label: "Review collections", prefilledMessage: "collections" },
      ],
      generatedAt: "2026-04-21T00:00:00.000Z",
      source: "fallback",
    });

    expect(formatted).toContain("*Do now:*");
    expect(formatted).not.toContain("*Client handoff:*");
    expect(formatted).not.toContain('• test3 — proposal "Moderate 5-day Bali Itinerary" ready to send');
    expect(formatted).toContain("Reply *handoff* to clear handoff.");
  });
});
