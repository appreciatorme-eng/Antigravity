import { describe, expect, it } from "vitest";

import {
  describeAssistantMessageShape,
  extractAssistantMessageText,
  hasAudioMessageContent,
  shouldAttemptAssistantGroupRouting,
} from "@/lib/whatsapp/assistant-group-routing";

describe("assistant-group-routing", () => {
  it("extracts text from a plain conversation message", () => {
    expect(extractAssistantMessageText({ conversation: "stats" })).toBe("stats");
  });

  it("extracts text from an extended text message", () => {
    expect(extractAssistantMessageText({
      extendedTextMessage: { text: "leads" },
    })).toBe("leads");
  });

  it("extracts text from nested ephemeral messages", () => {
    expect(extractAssistantMessageText({
      ephemeralMessage: {
        message: {
          extendedTextMessage: { text: "today" },
        },
      },
    })).toBe("today");
  });

  it("extracts text from nested view-once messages", () => {
    expect(extractAssistantMessageText({
      viewOnceMessage: {
        message: {
          extendedTextMessage: { text: "brief" },
        },
      },
    })).toBe("brief");
  });

  it("extracts captions from image messages", () => {
    expect(extractAssistantMessageText({
      imageMessage: { caption: "stats" },
    })).toBe("stats");
  });

  it("detects nested audio messages", () => {
    expect(hasAudioMessageContent({
      ephemeralMessage: {
        message: {
          audioMessage: { mimetype: "audio/ogg" },
        },
      },
    })).toBe(true);
  });

  it("detects assistant keyword commands", () => {
    expect(shouldAttemptAssistantGroupRouting("stats")).toBe(true);
    expect(shouldAttemptAssistantGroupRouting("leads")).toBe(true);
  });

  it("detects assistant workflow commands", () => {
    expect(shouldAttemptAssistantGroupRouting("done 2")).toBe(true);
    expect(shouldAttemptAssistantGroupRouting("5 day trip to Bali")).toBe(true);
    expect(shouldAttemptAssistantGroupRouting("Create a 5 day Delhi trip")).toBe(true);
  });

  it("routes normal free-form operator replies in the assistant group", () => {
    expect(shouldAttemptAssistantGroupRouting("Rahul")).toBe(true);
    expect(shouldAttemptAssistantGroupRouting("2")).toBe(true);
    expect(shouldAttemptAssistantGroupRouting("next month")).toBe(true);
    expect(shouldAttemptAssistantGroupRouting("can you make a Delhi trip for next month")).toBe(true);
  });

  it("returns false for non-command group chatter", () => {
    expect(shouldAttemptAssistantGroupRouting("Reply handoff, followups, collections")).toBe(false);
    expect(shouldAttemptAssistantGroupRouting("What do you want to do?\n\n• View leads → reply leads")).toBe(false);
  });

  it("describes nested message shape keys", () => {
    expect(describeAssistantMessageShape({
      ephemeralMessage: {
        message: {
          extendedTextMessage: { text: "stats" },
        },
      },
    })).toEqual(expect.arrayContaining([
      "ephemeralMessage",
      "ephemeralMessage.message",
      "ephemeralMessage.message.extendedTextMessage",
    ]));
  });
});
