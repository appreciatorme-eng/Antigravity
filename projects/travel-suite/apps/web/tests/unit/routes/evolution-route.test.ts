import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const routeAssistantCommandMock = vi.fn();
const isUnsignedWebhookAllowedMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/assistant/channel-adapters/whatsapp", () => ({
  handleWhatsAppMessage: vi.fn(),
}));

vi.mock("@/lib/whatsapp/chatbot-flow", () => ({
  findInternalWhatsAppProfile: vi.fn(),
  hasRecentHumanReply: vi.fn(),
  isWhatsAppChatbotEnabled: vi.fn(),
  markCustomerFlowWelcomeSent: vi.fn(),
  processChatbotMessage: vi.fn(),
  sendChatbotReply: vi.fn(),
}));

vi.mock("@/lib/security/whatsapp-webhook-config", () => ({
  isUnsignedWebhookAllowed: isUnsignedWebhookAllowedMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
  logEvent: vi.fn(),
  logWarn: vi.fn(),
}));

vi.mock("@/lib/whatsapp-evolution.server", () => ({
  getEvolutionMediaBase64: vi.fn(),
  getEvolutionStatus: vi.fn(),
}));

vi.mock("@/lib/whatsapp/voice-transcription", () => ({
  transcribeVoiceMessage: vi.fn(),
}));

vi.mock("@/lib/whatsapp/assistant-notifications", () => ({
  notifyNewLead: vi.fn(),
}));

vi.mock("@/lib/whatsapp/ensure-assistant-group", () => ({
  ensureAssistantGroup: vi.fn(),
}));

vi.mock("@/lib/whatsapp/assistant-commands", () => ({
  routeAssistantCommand: routeAssistantCommandMock,
}));

vi.mock("@/lib/ai/gemini.server", () => ({
  getGeminiModel: vi.fn(),
}));

vi.mock("@/lib/platform/business-os-comms-linking", () => ({
  linkInboundReplyToCommsSequence: vi.fn(),
}));

vi.mock("@/lib/whatsapp/trip-intake.server", () => ({
  findLatestTripRequestForPhone: vi.fn(),
}));

const originalWebhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET;

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/webhooks/evolution/route");
}

describe("evolution route assistant group routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EVOLUTION_WEBHOOK_SECRET = "expected";
    isUnsignedWebhookAllowedMock.mockReturnValue(false);
    routeAssistantCommandMock.mockResolvedValue(true);
    createAdminClientMock.mockReturnValue({ from: vi.fn() });
  });

  afterEach(() => {
    if (originalWebhookSecret === undefined) {
      delete process.env.EVOLUTION_WEBHOOK_SECRET;
    } else {
      process.env.EVOLUTION_WEBHOOK_SECRET = originalWebhookSecret;
    }
  });

  it("routes nested ephemeral assistant commands from messages.upsert", async () => {
    const { POST } = await loadRoute();
    const response = await POST(new Request("http://localhost/api/webhooks/evolution", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": "expected",
      },
      body: JSON.stringify({
        event: "messages.upsert",
        instance: "org_1234",
        data: {
          key: { remoteJid: "120363abc@g.us", id: "msg-1", fromMe: false },
          message: {
            ephemeralMessage: {
              message: {
                extendedTextMessage: { text: "stats" },
              },
            },
          },
        },
      }),
    }));

    expect(response.status).toBe(200);
    expect(routeAssistantCommandMock).toHaveBeenCalledWith("org_1234", "120363abc@g.us", "stats");
  });

  it("does not route assistant group commands from send.message", async () => {
    const { POST } = await loadRoute();
    const response = await POST(new Request("http://localhost/api/webhooks/evolution", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": "expected",
      },
      body: JSON.stringify({
        event: "send.message",
        instance: "org_1234",
        data: {
          key: { remoteJid: "120363abc@g.us", id: "msg-2", fromMe: true },
          message: {
            viewOnceMessage: {
              message: {
                extendedTextMessage: { text: "leads" },
              },
            },
          },
        },
      }),
    }));

    expect(response.status).toBe(200);
    expect(routeAssistantCommandMock).not.toHaveBeenCalled();
  });

  it("routes edited assistant commands from messages.update", async () => {
    const { POST } = await loadRoute();
    const response = await POST(new Request("http://localhost/api/webhooks/evolution", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": "expected",
      },
      body: JSON.stringify({
        event: "messages.update",
        instance: "org_1234",
        data: {
          key: { remoteJid: "120363abc@g.us", id: "msg-3", fromMe: true },
          message: {
            editedMessage: {
              message: {
                conversation: "today",
              },
            },
          },
        },
      }),
    }));

    expect(response.status).toBe(200);
    expect(routeAssistantCommandMock).toHaveBeenCalledWith("org_1234", "120363abc@g.us", "today");
  });
});
