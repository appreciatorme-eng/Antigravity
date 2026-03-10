// whatsapp-webhook-advanced.test.ts
// Advanced tests for whatsapp-webhook-config and WhatsApp message parsers

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isUnsignedWebhookAllowed } from "@/lib/security/whatsapp-webhook-config";
import {
  parseWhatsAppLocationMessages,
  parseWhatsAppTextMessages,
  parseWhatsAppImageMessages,
} from "@/lib/whatsapp.server";

describe("isUnsignedWebhookAllowed - advanced", () => {
  let originalNodeEnv: string | undefined;
  let originalFlag: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalFlag = process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK;
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalFlag === undefined) {
      delete process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK;
    } else {
      process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = originalFlag;
    }
  });

  it("returns false in production even when WHATSAPP_ALLOW_UNSIGNED_WEBHOOK is true", () => {
    process.env.NODE_ENV = "production";
    process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = "true";
    expect(isUnsignedWebhookAllowed()).toBe(false);
  });

  it("returns false in production when flag is not set", () => {
    process.env.NODE_ENV = "production";
    delete process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK;
    expect(isUnsignedWebhookAllowed()).toBe(false);
  });

  it("returns true in development when flag is 'true'", () => {
    process.env.NODE_ENV = "development";
    process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = "true";
    expect(isUnsignedWebhookAllowed()).toBe(true);
  });

  it("returns false in development when flag is 'false'", () => {
    process.env.NODE_ENV = "development";
    process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = "false";
    expect(isUnsignedWebhookAllowed()).toBe(false);
  });

  it("returns false in development when flag is not set", () => {
    process.env.NODE_ENV = "development";
    delete process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK;
    expect(isUnsignedWebhookAllowed()).toBe(false);
  });

  it("returns true in test env when flag is 'true'", () => {
    process.env.NODE_ENV = "test";
    process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = "true";
    expect(isUnsignedWebhookAllowed()).toBe(true);
  });

  it("returns false in test env when flag is not set", () => {
    process.env.NODE_ENV = "test";
    delete process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK;
    expect(isUnsignedWebhookAllowed()).toBe(false);
  });

  it("returns false when flag is 'TRUE' (case-sensitive check)", () => {
    process.env.NODE_ENV = "development";
    process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = "TRUE";
    expect(isUnsignedWebhookAllowed()).toBe(false);
  });

  it("returns false when flag is '1'", () => {
    process.env.NODE_ENV = "development";
    process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = "1";
    expect(isUnsignedWebhookAllowed()).toBe(false);
  });

  it("returns false when flag is empty string", () => {
    process.env.NODE_ENV = "development";
    process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK = "";
    expect(isUnsignedWebhookAllowed()).toBe(false);
  });
});

// Helper to build a WhatsApp webhook payload structure
function buildWebhookPayload(
  messages: Array<Record<string, unknown>>
): Record<string, unknown> {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              messages,
            },
          },
        ],
      },
    ],
  };
}

describe("parseWhatsAppLocationMessages", () => {
  it("returns empty array for empty payload object", () => {
    expect(parseWhatsAppLocationMessages({})).toEqual([]);
  });

  it("returns empty array for null-ish payload", () => {
    expect(parseWhatsAppLocationMessages({ entry: [] })).toEqual([]);
  });

  it("returns empty array for payload with no messages", () => {
    const payload = { entry: [{ changes: [{ value: { messages: [] } }] }] };
    expect(parseWhatsAppLocationMessages(payload)).toEqual([]);
  });

  it("parses a valid location message correctly", () => {
    const payload = buildWebhookPayload([
      {
        type: "location",
        from: "15551234567",
        id: "wamid.abc123",
        timestamp: "1700000000",
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          name: "San Francisco",
          address: "123 Market St",
        },
      },
    ]);

    const result = parseWhatsAppLocationMessages(payload);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      waId: "15551234567",
      messageId: "wamid.abc123",
      latitude: 37.7749,
      longitude: -122.4194,
      name: "San Francisco",
      address: "123 Market St",
      timestamp: "1700000000",
    });
  });

  it("normalizes waId by stripping non-digit characters", () => {
    const payload = buildWebhookPayload([
      {
        type: "location",
        from: "+1-555-123-4567",
        id: "msg-1",
        timestamp: "1700000000",
        location: { latitude: 0, longitude: 0 },
      },
    ]);

    const result = parseWhatsAppLocationMessages(payload);
    expect(result[0].waId).toBe("15551234567");
  });

  it("skips non-location message types", () => {
    const payload = buildWebhookPayload([
      {
        type: "text",
        from: "15551234567",
        id: "msg-text",
        timestamp: "1700000000",
        text: { body: "hello" },
      },
    ]);

    expect(parseWhatsAppLocationMessages(payload)).toEqual([]);
  });

  it("skips location messages with missing from field", () => {
    const payload = buildWebhookPayload([
      {
        type: "location",
        id: "msg-1",
        timestamp: "1700000000",
        location: { latitude: 10, longitude: 20 },
      },
    ]);

    expect(parseWhatsAppLocationMessages(payload)).toEqual([]);
  });

  it("skips location messages with missing id field", () => {
    const payload = buildWebhookPayload([
      {
        type: "location",
        from: "15551234567",
        timestamp: "1700000000",
        location: { latitude: 10, longitude: 20 },
      },
    ]);

    expect(parseWhatsAppLocationMessages(payload)).toEqual([]);
  });

  it("skips location messages with NaN coordinates", () => {
    const payload = buildWebhookPayload([
      {
        type: "location",
        from: "15551234567",
        id: "msg-1",
        timestamp: "1700000000",
        location: { latitude: "not-a-number", longitude: 20 },
      },
    ]);

    expect(parseWhatsAppLocationMessages(payload)).toEqual([]);
  });

  it("handles optional name and address as undefined when missing", () => {
    const payload = buildWebhookPayload([
      {
        type: "location",
        from: "15551234567",
        id: "msg-1",
        timestamp: "1700000000",
        location: { latitude: 10, longitude: 20 },
      },
    ]);

    const result = parseWhatsAppLocationMessages(payload);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBeUndefined();
    expect(result[0].address).toBeUndefined();
  });

  it("parses multiple location messages in one payload", () => {
    const payload = buildWebhookPayload([
      {
        type: "location",
        from: "111",
        id: "msg-1",
        timestamp: "1700000001",
        location: { latitude: 10, longitude: 20 },
      },
      {
        type: "location",
        from: "222",
        id: "msg-2",
        timestamp: "1700000002",
        location: { latitude: 30, longitude: 40 },
      },
    ]);

    const result = parseWhatsAppLocationMessages(payload);
    expect(result).toHaveLength(2);
  });

  it("handles multiple entries each with changes", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    type: "location",
                    from: "111",
                    id: "msg-a",
                    timestamp: "1700000001",
                    location: { latitude: 1, longitude: 2 },
                  },
                ],
              },
            },
          ],
        },
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    type: "location",
                    from: "222",
                    id: "msg-b",
                    timestamp: "1700000002",
                    location: { latitude: 3, longitude: 4 },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = parseWhatsAppLocationMessages(payload);
    expect(result).toHaveLength(2);
  });
});

describe("parseWhatsAppTextMessages", () => {
  it("returns empty array for empty payload object", () => {
    expect(parseWhatsAppTextMessages({})).toEqual([]);
  });

  it("returns empty array for payload with no entry", () => {
    expect(parseWhatsAppTextMessages({ entry: [] })).toEqual([]);
  });

  it("returns empty array for no messages in changes", () => {
    const payload = { entry: [{ changes: [{ value: { messages: [] } }] }] };
    expect(parseWhatsAppTextMessages(payload)).toEqual([]);
  });

  it("parses a valid text message", () => {
    const payload = buildWebhookPayload([
      {
        type: "text",
        from: "15551234567",
        id: "wamid.text1",
        timestamp: "1700000000",
        text: { body: "Hello, world!" },
      },
    ]);

    const result = parseWhatsAppTextMessages(payload);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      waId: "15551234567",
      messageId: "wamid.text1",
      body: "Hello, world!",
      timestamp: "1700000000",
    });
  });

  it("skips non-text message types", () => {
    const payload = buildWebhookPayload([
      {
        type: "location",
        from: "15551234567",
        id: "msg-loc",
        timestamp: "1700000000",
        location: { latitude: 10, longitude: 20 },
      },
    ]);

    expect(parseWhatsAppTextMessages(payload)).toEqual([]);
  });

  it("skips text messages with empty body", () => {
    const payload = buildWebhookPayload([
      {
        type: "text",
        from: "15551234567",
        id: "msg-1",
        timestamp: "1700000000",
        text: { body: "" },
      },
    ]);

    expect(parseWhatsAppTextMessages(payload)).toEqual([]);
  });

  it("skips text messages with missing from field", () => {
    const payload = buildWebhookPayload([
      {
        type: "text",
        id: "msg-1",
        timestamp: "1700000000",
        text: { body: "hello" },
      },
    ]);

    expect(parseWhatsAppTextMessages(payload)).toEqual([]);
  });

  it("skips text messages with missing id field", () => {
    const payload = buildWebhookPayload([
      {
        type: "text",
        from: "15551234567",
        timestamp: "1700000000",
        text: { body: "hello" },
      },
    ]);

    expect(parseWhatsAppTextMessages(payload)).toEqual([]);
  });

  it("skips text messages with missing text object", () => {
    const payload = buildWebhookPayload([
      {
        type: "text",
        from: "15551234567",
        id: "msg-1",
        timestamp: "1700000000",
      },
    ]);

    expect(parseWhatsAppTextMessages(payload)).toEqual([]);
  });

  it("normalizes waId by stripping non-digit characters", () => {
    const payload = buildWebhookPayload([
      {
        type: "text",
        from: "+44-7911-123456",
        id: "msg-1",
        timestamp: "1700000000",
        text: { body: "hi" },
      },
    ]);

    const result = parseWhatsAppTextMessages(payload);
    expect(result[0].waId).toBe("447911123456");
  });

  it("parses multiple text messages in one payload", () => {
    const payload = buildWebhookPayload([
      {
        type: "text",
        from: "111",
        id: "msg-1",
        timestamp: "1700000001",
        text: { body: "first" },
      },
      {
        type: "text",
        from: "222",
        id: "msg-2",
        timestamp: "1700000002",
        text: { body: "second" },
      },
    ]);

    const result = parseWhatsAppTextMessages(payload);
    expect(result).toHaveLength(2);
    expect(result[0].body).toBe("first");
    expect(result[1].body).toBe("second");
  });

  it("handles payload with mixed message types and only returns text", () => {
    const payload = buildWebhookPayload([
      {
        type: "text",
        from: "111",
        id: "msg-text",
        timestamp: "1700000001",
        text: { body: "hello" },
      },
      {
        type: "image",
        from: "222",
        id: "msg-img",
        timestamp: "1700000002",
        image: { id: "img-1" },
      },
      {
        type: "location",
        from: "333",
        id: "msg-loc",
        timestamp: "1700000003",
        location: { latitude: 0, longitude: 0 },
      },
    ]);

    const result = parseWhatsAppTextMessages(payload);
    expect(result).toHaveLength(1);
    expect(result[0].body).toBe("hello");
  });
});

describe("parseWhatsAppImageMessages", () => {
  it("returns empty array for empty payload", () => {
    expect(parseWhatsAppImageMessages({})).toEqual([]);
  });

  it("returns empty array for payload with no messages", () => {
    const payload = { entry: [{ changes: [{ value: { messages: [] } }] }] };
    expect(parseWhatsAppImageMessages(payload)).toEqual([]);
  });

  it("parses a valid image message", () => {
    const payload = buildWebhookPayload([
      {
        type: "image",
        from: "15551234567",
        id: "wamid.img1",
        timestamp: "1700000000",
        image: {
          id: "media-123",
          caption: "My photo",
          mime_type: "image/jpeg",
        },
      },
    ]);

    const result = parseWhatsAppImageMessages(payload);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      waId: "15551234567",
      messageId: "wamid.img1",
      imageId: "media-123",
      caption: "My photo",
      mimeType: "image/jpeg",
      timestamp: "1700000000",
    });
  });

  it("handles image without caption or mime_type", () => {
    const payload = buildWebhookPayload([
      {
        type: "image",
        from: "15551234567",
        id: "wamid.img2",
        timestamp: "1700000000",
        image: { id: "media-456" },
      },
    ]);

    const result = parseWhatsAppImageMessages(payload);
    expect(result).toHaveLength(1);
    expect(result[0].caption).toBeUndefined();
    expect(result[0].mimeType).toBeUndefined();
  });

  it("skips non-image message types", () => {
    const payload = buildWebhookPayload([
      {
        type: "text",
        from: "15551234567",
        id: "msg-text",
        timestamp: "1700000000",
        text: { body: "hello" },
      },
    ]);

    expect(parseWhatsAppImageMessages(payload)).toEqual([]);
  });

  it("skips image messages with missing image.id", () => {
    const payload = buildWebhookPayload([
      {
        type: "image",
        from: "15551234567",
        id: "msg-1",
        timestamp: "1700000000",
        image: { caption: "no id" },
      },
    ]);

    expect(parseWhatsAppImageMessages(payload)).toEqual([]);
  });

  it("skips image messages with missing from", () => {
    const payload = buildWebhookPayload([
      {
        type: "image",
        id: "msg-1",
        timestamp: "1700000000",
        image: { id: "media-1" },
      },
    ]);

    expect(parseWhatsAppImageMessages(payload)).toEqual([]);
  });

  it("skips image messages with missing id", () => {
    const payload = buildWebhookPayload([
      {
        type: "image",
        from: "15551234567",
        timestamp: "1700000000",
        image: { id: "media-1" },
      },
    ]);

    expect(parseWhatsAppImageMessages(payload)).toEqual([]);
  });

  it("normalizes waId by stripping non-digit characters", () => {
    const payload = buildWebhookPayload([
      {
        type: "image",
        from: "+91-9876-543210",
        id: "msg-1",
        timestamp: "1700000000",
        image: { id: "media-1" },
      },
    ]);

    const result = parseWhatsAppImageMessages(payload);
    expect(result[0].waId).toBe("919876543210");
  });

  it("parses multiple image messages", () => {
    const payload = buildWebhookPayload([
      {
        type: "image",
        from: "111",
        id: "msg-1",
        timestamp: "1700000001",
        image: { id: "media-a" },
      },
      {
        type: "image",
        from: "222",
        id: "msg-2",
        timestamp: "1700000002",
        image: { id: "media-b", mime_type: "image/png" },
      },
    ]);

    const result = parseWhatsAppImageMessages(payload);
    expect(result).toHaveLength(2);
  });

  it("handles malformed entry with missing changes gracefully", () => {
    const payload = { entry: [{}] };
    expect(parseWhatsAppImageMessages(payload)).toEqual([]);
  });

  it("handles malformed change with missing value gracefully", () => {
    const payload = { entry: [{ changes: [{}] }] };
    expect(parseWhatsAppImageMessages(payload)).toEqual([]);
  });
});
