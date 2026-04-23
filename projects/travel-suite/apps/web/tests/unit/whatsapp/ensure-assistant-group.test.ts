import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const createEvolutionGroupMock = vi.fn();
const guardedSendTextMock = vi.fn();
const updateEvolutionGroupDescriptionMock = vi.fn();
const sendPollMock = vi.fn();
const logErrorMock = vi.fn();
const logEventMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/whatsapp-evolution.server", () => ({
  createEvolutionGroup: createEvolutionGroupMock,
  guardedSendText: guardedSendTextMock,
  updateEvolutionGroupDescription: updateEvolutionGroupDescriptionMock,
}));

vi.mock("@/lib/whatsapp/assistant-polls", () => ({
  WELCOME_POLL: { question: "welcome", options: ["stats"] },
  sendPoll: sendPollMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logError: logErrorMock,
  logEvent: logEventMock,
}));

function createMaybeSingleBuilder(result: unknown) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    not: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: result, error: null })),
  };

  return builder;
}

function createUpdateBuilder() {
  const eqInner = vi.fn(async () => ({ error: null }));
  const update = vi.fn(() => ({
    eq: eqInner,
  }));

  return { update, eqInner };
}

describe("ensureAssistantGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createEvolutionGroupMock.mockResolvedValue("120363new@g.us");
    guardedSendTextMock.mockResolvedValue(undefined);
    updateEvolutionGroupDescriptionMock.mockResolvedValue(undefined);
    sendPollMock.mockResolvedValue(undefined);
  });

  it("returns the currently stored assistant group without creating a replacement", async () => {
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "whatsapp_connections":
            return createMaybeSingleBuilder({
              organization_id: "org_1",
              assistant_group_jid: "120363current@g.us",
              phone_number: "+919999999999",
            });
          case "organizations":
            return createMaybeSingleBuilder({ owner_id: "user_1" });
          case "assistant_preferences":
            return {
              upsert: vi.fn(async () => ({ error: null })),
            };
          default:
            throw new Error(`Unexpected table ${table}`);
        }
      }),
    });

    const { ensureAssistantGroup } = await import("@/lib/whatsapp/ensure-assistant-group");
    const result = await ensureAssistantGroup("org_1_live");

    expect(result).toBe("120363current@g.us");
    expect(createEvolutionGroupMock).not.toHaveBeenCalled();
    expect(updateEvolutionGroupDescriptionMock).not.toHaveBeenCalled();
  });

  it("reuses the existing org-level assistant group before creating a new one", async () => {
    let whatsappLookupCount = 0;
    const sessionUpdate = createUpdateBuilder();

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "whatsapp_connections": {
            const selectBuilder = createMaybeSingleBuilder(
              whatsappLookupCount++ === 0
                ? {
                    organization_id: "org_1",
                    assistant_group_jid: null,
                    phone_number: "+919999999999",
                  }
                : {
                    assistant_group_jid: "120363existing@g.us",
                  },
            );

            return {
              ...selectBuilder,
              update: sessionUpdate.update,
            };
          }
          case "organizations":
            return createMaybeSingleBuilder({ owner_id: "user_1" });
          case "assistant_preferences":
            return {
              upsert: vi.fn(async () => ({ error: null })),
            };
          default:
            throw new Error(`Unexpected table ${table}`);
        }
      }),
    });

    const { ensureAssistantGroup } = await import("@/lib/whatsapp/ensure-assistant-group");
    const result = await ensureAssistantGroup("org_1_live");

    expect(result).toBe("120363existing@g.us");
    expect(createEvolutionGroupMock).not.toHaveBeenCalled();
    expect(sessionUpdate.update).toHaveBeenCalledWith({ assistant_group_jid: "120363existing@g.us" });
  });
});
