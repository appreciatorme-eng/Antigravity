import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const guardedSendTextMock = vi.fn();
const buildOwnerAgendaMock = vi.fn();
const formatOwnerAgendaMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/whatsapp-evolution.server", () => ({
  guardedSendText: guardedSendTextMock,
}));

vi.mock("@/lib/assistant/owner-agenda", () => ({
  buildOwnerAgenda: buildOwnerAgendaMock,
  formatOwnerAgenda: formatOwnerAgendaMock,
}));

function createSelectBuilder(result: unknown) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    not: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: result, error: null })),
    then: (resolve: (value: { data: unknown; error: null }) => unknown) =>
      resolve({ data: result, error: null }),
  };

  return builder;
}

function createInsertBuilder(store: Record<string, unknown[]>) {
  return {
    insert: vi.fn(async (value: unknown) => {
      if (Array.isArray(value)) {
        store.rows.push(...value);
      } else {
        store.rows.push(value);
      }
      return { error: null };
    }),
  };
}

describe("morning briefing delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guardedSendTextMock.mockResolvedValue(undefined);
    buildOwnerAgendaMock.mockResolvedValue({ priorities: [] });
    formatOwnerAgendaMock.mockReturnValue("agenda message");
  });

  it("sends the briefing directly to the assistant group and records delivery", async () => {
    const logRows: unknown[] = [];
    const deliveryRows: unknown[] = [];

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "assistant_preferences":
            return createSelectBuilder([
              { organization_id: "org_1", user_id: "user_1" },
            ]);
          case "organizations":
            return createSelectBuilder([{ id: "org_1", name: "Avi Travels" }]);
          case "whatsapp_connections":
            return createSelectBuilder([
              {
                organization_id: "org_1",
                session_name: "org_1_live",
                assistant_group_jid: "120363abc@g.us",
                updated_at: "2026-04-23T12:00:00.000Z",
              },
            ]);
          case "notification_logs":
            return {
              ...createSelectBuilder(null),
              ...createInsertBuilder({ rows: logRows }),
            };
          case "notification_delivery_status":
            return createInsertBuilder({ rows: deliveryRows });
          default:
            throw new Error(`Unexpected table ${table}`);
        }
      }),
    });

    const { generateAndQueueBriefings } = await import("@/lib/assistant/briefing");
    const result = await generateAndQueueBriefings();

    expect(result).toEqual({ queued: 1, skipped: 0, errors: 0 });
    expect(guardedSendTextMock).toHaveBeenCalledWith(
      "org_1_live",
      "120363abc@g.us",
      "agenda message",
    );
    expect(logRows).toHaveLength(1);
    expect(deliveryRows).toHaveLength(1);
    expect(logRows[0]).toMatchObject({
      organization_id: "org_1",
      recipient_id: "user_1",
      recipient_phone: "120363abc@g.us",
      notification_type: "morning_briefing",
      status: "sent",
      title: "Morning briefing",
    });
  });

  it("skips a briefing that was already sent for the same day", async () => {
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "assistant_preferences":
            return createSelectBuilder([
              { organization_id: "org_1", user_id: "user_1" },
            ]);
          case "organizations":
            return createSelectBuilder([{ id: "org_1", name: "Avi Travels" }]);
          case "whatsapp_connections":
            return createSelectBuilder([
              {
                organization_id: "org_1",
                session_name: "org_1_live",
                assistant_group_jid: "120363abc@g.us",
                updated_at: "2026-04-23T12:00:00.000Z",
              },
            ]);
          case "notification_logs":
            return createSelectBuilder({ id: "already-sent" });
          case "notification_delivery_status":
            return createInsertBuilder({ rows: [] });
          default:
            throw new Error(`Unexpected table ${table}`);
        }
      }),
    });

    const { generateAndQueueBriefings } = await import("@/lib/assistant/briefing");
    const result = await generateAndQueueBriefings();

    expect(result).toEqual({ queued: 0, skipped: 1, errors: 0 });
    expect(guardedSendTextMock).not.toHaveBeenCalled();
  });
});
