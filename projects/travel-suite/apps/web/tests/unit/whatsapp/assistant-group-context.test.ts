import { describe, expect, it } from "vitest";

import {
  normalizeAssistantGroupJid,
  resolveAssistantGroupConnection,
  type AssistantGroupConnectionCandidate,
} from "@/lib/whatsapp/assistant-group-context";

describe("assistant-group-context", () => {
  it("normalizes incoming group jids", () => {
    expect(normalizeAssistantGroupJid(" 120363ABC@g.us ")).toBe("120363abc@g.us");
  });

  it("prefers a direct session-row match", () => {
    const sessionConnection: AssistantGroupConnectionCandidate = {
      organization_id: "org_1",
      assistant_group_jid: "120363abc@g.us",
      session_name: "org_1_abcd",
    };

    expect(resolveAssistantGroupConnection({
      instanceName: "org_1_abcd",
      incomingGroupJid: "120363abc@g.us",
      sessionConnection,
      candidateRows: [],
    })).toEqual({
      connection: sessionConnection,
      matchedBy: "session_row",
      failureReason: null,
    });
  });

  it("falls back by assistant group jid and session token", () => {
    const candidate: AssistantGroupConnectionCandidate = {
      organization_id: "org_1",
      assistant_group_jid: "120363abc@g.us",
      session_name: "org_1_old",
      session_token: "org_1_live",
    };

    expect(resolveAssistantGroupConnection({
      instanceName: "org_1_live",
      incomingGroupJid: "120363abc@g.us",
      sessionConnection: null,
      candidateRows: [candidate],
    })).toEqual({
      connection: candidate,
      matchedBy: "assistant_group_jid_session_token",
      failureReason: null,
    });
  });

  it("returns a failure reason when no candidate assistant group matches", () => {
    expect(resolveAssistantGroupConnection({
      instanceName: "org_1_live",
      incomingGroupJid: "120363missing@g.us",
      sessionConnection: {
        organization_id: "org_1",
        assistant_group_jid: "120363abc@g.us",
      },
      candidateRows: [],
    })).toEqual({
      connection: null,
      matchedBy: null,
      failureReason: "no_matching_assistant_group",
    });
  });
});
