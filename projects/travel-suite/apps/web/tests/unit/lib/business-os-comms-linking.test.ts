import { beforeEach, expect, it, vi } from "vitest";

const loadCommsSequencesMock = vi.fn();
const updateCommsSequenceMock = vi.fn();
const recordOrgActivityEventMock = vi.fn();
const runBusinessOsEventAutomationMock = vi.fn();

vi.mock("@/lib/platform/business-comms", () => ({
  loadCommsSequences: (...args: unknown[]) => loadCommsSequencesMock(...args),
  updateCommsSequence: (...args: unknown[]) => updateCommsSequenceMock(...args),
}));

vi.mock("@/lib/platform/org-memory", () => ({
  recordOrgActivityEvent: (...args: unknown[]) => recordOrgActivityEventMock(...args),
}));

vi.mock("@/lib/platform/business-os", () => ({
  runBusinessOsEventAutomation: (...args: unknown[]) => runBusinessOsEventAutomationMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  loadCommsSequencesMock.mockResolvedValue([
    {
      id: "seq-1",
      status: "active",
      channel: "whatsapp",
      last_sent_at: "2026-04-18T12:00:00.000Z",
      metadata: {
        send_state: "sent",
        recipient_phone: "+15551234567",
        sent_via: "whatsapp",
      },
    },
  ]);
  updateCommsSequenceMock.mockResolvedValue({ id: "seq-1" });
  recordOrgActivityEventMock.mockResolvedValue(undefined);
  runBusinessOsEventAutomationMock.mockResolvedValue({ state_updated: true });
});

it("links inbound WhatsApp replies back to the matching comms sequence", async () => {
  const { linkInboundReplyToCommsSequence } = await import("../../../src/lib/platform/business-os-comms-linking");

  const result = await linkInboundReplyToCommsSequence({ from: vi.fn() } as never, {
    orgId: "org-1",
    waId: "15551234567",
    messageId: "wamid-1",
    body: "Yes, this works for us.",
  });

  expect(result).toEqual({
    linked: true,
    commsSequenceId: "seq-1",
    automationTriggered: true,
  });
  expect(updateCommsSequenceMock).toHaveBeenCalledWith(
    expect.anything(),
    "seq-1",
    expect.objectContaining({
      metadata: expect.objectContaining({
        send_state: "replied",
        reply_channel: "whatsapp",
        reply_source_message_id: "wamid-1",
      }),
    }),
  );
  expect(recordOrgActivityEventMock).toHaveBeenCalled();
  expect(runBusinessOsEventAutomationMock).toHaveBeenCalledWith(expect.anything(), {
    orgId: "org-1",
    currentUserId: null,
    trigger: "comms_updated",
  });
});
