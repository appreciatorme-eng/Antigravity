import { beforeEach, expect, it, vi } from "vitest";

const recordPaymentLinkEventMock = vi.fn();
const loadCommsSequencesMock = vi.fn();
const updateCommsSequenceMock = vi.fn();

vi.mock("@/lib/payments/payment-links.server", () => ({
  recordPaymentLinkEvent: (...args: unknown[]) => recordPaymentLinkEventMock(...args),
}));

vi.mock("@/lib/platform/business-comms", () => ({
  loadCommsSequences: (...args: unknown[]) => loadCommsSequencesMock(...args),
  updateCommsSequence: (...args: unknown[]) => updateCommsSequenceMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  recordPaymentLinkEventMock.mockResolvedValue(undefined);
  loadCommsSequencesMock.mockResolvedValue([
    {
      id: "seq-1",
      sequence_type: "collections",
      metadata: { send_state: "sent" },
    },
    {
      id: "seq-2",
      sequence_type: "activation_rescue",
      metadata: { send_state: "sent" },
    },
  ]);
  updateCommsSequenceMock.mockResolvedValue({ id: "seq-1" });
});

it("marks pending payment links as paid from captured payments", async () => {
  const { syncCapturedPaymentLinks } = await import("../../../src/lib/platform/business-os-payment-closure");
  const select = vi.fn(() => ({
    eq: vi.fn(() => ({
      limit: vi.fn().mockResolvedValue({
        data: [
          { token: "pay-1", organization_id: "org-1", status: "pending" },
          { token: "pay-2", organization_id: "org-1", status: "viewed" },
          { token: "pay-3", organization_id: "org-1", status: "paid" },
        ],
      }),
    })),
  }));
  const supabase = {
    from: vi.fn(() => ({ select })),
  } as never;

  const orgId = await syncCapturedPaymentLinks(supabase, {
    id: "payment-1",
    order_id: "order-1",
  });

  expect(orgId).toBe("org-1");
  expect(recordPaymentLinkEventMock).toHaveBeenCalledTimes(2);
  expect(recordPaymentLinkEventMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
    token: "pay-1",
    event: "paid",
    razorpayPaymentId: "payment-1",
  }));
});

it("auto-closes only collections sequences when payment is captured", async () => {
  const { autoCloseCollectionsSequence } = await import("../../../src/lib/platform/business-os-payment-closure");

  await autoCloseCollectionsSequence({ from: vi.fn() } as never, "org-1", "payment-1");

  expect(updateCommsSequenceMock).toHaveBeenCalledTimes(1);
  expect(updateCommsSequenceMock).toHaveBeenCalledWith(
    expect.anything(),
    "seq-1",
    expect.objectContaining({
      status: "completed",
      metadata: expect.objectContaining({
        auto_closed_reason: "payment_captured",
        auto_closed_payment_id: "payment-1",
      }),
    }),
  );
});
