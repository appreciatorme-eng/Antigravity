import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only (handled by vitest alias) and logger
vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
  logEvent: vi.fn(),
}));

// We need to control process.env and global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after mocks
import {
  sendWhatsAppText,
  sendWhatsAppTemplate,
  parseWhatsAppLocationMessages,
  parseWhatsAppImageMessages,
  parseWhatsAppTextMessages,
  downloadWhatsAppMedia,
} from "@/lib/whatsapp.server";

describe("whatsapp.server", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    process.env.WHATSAPP_TOKEN = "test-token";
    process.env.WHATSAPP_PHONE_ID = "123456";
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_ID;
  });

  // ── sendWhatsAppText ──────────────────────────────────────────────

  describe("sendWhatsAppText", () => {
    it("should send a text message with correct Meta API URL and headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [{ id: "wamid.abc123" }] }),
      });

      const result = await sendWhatsAppText("+919876543210", "Hello there");

      expect(result).toEqual({
        success: true,
        provider: "meta_cloud_api",
        messageId: "wamid.abc123",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://graph.facebook.com/v20.0/123456/messages",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
        }),
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({
        messaging_product: "whatsapp",
        to: "919876543210",
        type: "text",
        text: { preview_url: false, body: "Hello there" },
      });
    });

    it("should return error for invalid phone number", async () => {
      const result = await sendWhatsAppText("", "Hello");

      expect(result).toEqual({
        success: false,
        provider: "meta_cloud_api",
        error: "Invalid phone number",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return error when credentials are missing", async () => {
      delete process.env.WHATSAPP_TOKEN;

      const result = await sendWhatsAppText("+919876543210", "Hello");

      expect(result).toEqual({
        success: false,
        provider: "meta_cloud_api",
        error: "WhatsApp provider not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_ID missing)",
      });
    });

    it("should normalize phone numbers by stripping non-digit characters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [{ id: "wamid.xyz" }] }),
      });

      await sendWhatsAppText("+91 (98765) 43210", "Test");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.to).toBe("919876543210");
    });

    it("should retry on 429 (rate limit) and succeed on second attempt", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: { message: "Rate limited" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messages: [{ id: "wamid.retry" }] }),
        });

      const promise = sendWhatsAppText("+919876543210", "Retry test");
      // Advance past the retry delay (300 * 1 = 300ms)
      await vi.advanceTimersByTimeAsync(500);

      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("wamid.retry");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should retry on 500+ errors and fail after max attempts", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: "Server error" } }),
      });

      const promise = sendWhatsAppText("+919876543210", "Fail test");
      // Advance through all retry delays
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toBe("Server error");
      expect(mockFetch).toHaveBeenCalledTimes(3); // 3 max attempts
    });

    it("should not retry on 4xx errors other than 429", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: "Unauthorized" } }),
      });

      const result = await sendWhatsAppText("+919876543210", "Auth fail");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should handle network failure with retry exhaustion", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const promise = sendWhatsAppText("+919876543210", "Network fail");
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  // ── sendWhatsAppTemplate ──────────────────────────────────────────

  describe("sendWhatsAppTemplate", () => {
    it("should format a template message correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [{ id: "wamid.tpl" }] }),
      });

      const result = await sendWhatsAppTemplate(
        "+919876543210",
        "booking_confirmation",
        ["John", "Trip to Goa", "2024-01-15"],
        "en",
      );

      expect(result.success).toBe(true);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.type).toBe("template");
      expect(body.template.name).toBe("booking_confirmation");
      expect(body.template.language.code).toBe("en");
      expect(body.template.components[0].parameters).toEqual([
        { type: "text", text: "John" },
        { type: "text", text: "Trip to Goa" },
        { type: "text", text: "2024-01-15" },
      ]);
    });

    it("should return error for empty template name", async () => {
      const result = await sendWhatsAppTemplate("+919876543210", "", ["p1"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Missing template name");
    });

    it("should return error for invalid phone in template", async () => {
      const result = await sendWhatsAppTemplate("", "tpl_name", ["p1"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid phone number");
    });
  });

  // ── parseWhatsAppLocationMessages ─────────────────────────────────

  describe("parseWhatsAppLocationMessages", () => {
    it("should parse a valid location message from webhook payload", () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "919876543210",
                      id: "wamid.loc1",
                      type: "location",
                      timestamp: "1700000000",
                      location: {
                        latitude: 13.0827,
                        longitude: 80.2707,
                        name: "Marina Beach",
                        address: "Chennai, India",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = parseWhatsAppLocationMessages(payload);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        waId: "919876543210",
        messageId: "wamid.loc1",
        latitude: 13.0827,
        longitude: 80.2707,
        name: "Marina Beach",
        address: "Chennai, India",
        timestamp: "1700000000",
      });
    });

    it("should return empty array for invalid payload", () => {
      expect(parseWhatsAppLocationMessages("not-an-object")).toEqual([]);
      expect(parseWhatsAppLocationMessages(null)).toEqual([]);
      expect(parseWhatsAppLocationMessages(42)).toEqual([]);
    });

    it("should skip non-location messages", () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "919876543210",
                      id: "wamid.txt1",
                      type: "text",
                      timestamp: "1700000000",
                      text: { body: "Hello" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      expect(parseWhatsAppLocationMessages(payload)).toEqual([]);
    });
  });

  // ── parseWhatsAppImageMessages ────────────────────────────────────

  describe("parseWhatsAppImageMessages", () => {
    it("should parse a valid image message", () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "919876543210",
                      id: "wamid.img1",
                      type: "image",
                      timestamp: "1700000000",
                      image: {
                        id: "media-id-123",
                        caption: "My photo",
                        mime_type: "image/jpeg",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = parseWhatsAppImageMessages(payload);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        waId: "919876543210",
        messageId: "wamid.img1",
        imageId: "media-id-123",
        caption: "My photo",
        mimeType: "image/jpeg",
        timestamp: "1700000000",
      });
    });

    it("should return empty for invalid payload", () => {
      expect(parseWhatsAppImageMessages(undefined)).toEqual([]);
    });
  });

  // ── parseWhatsAppTextMessages ─────────────────────────────────────

  describe("parseWhatsAppTextMessages", () => {
    it("should parse valid text messages", () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "919876543210",
                      id: "wamid.txt1",
                      type: "text",
                      timestamp: "1700000000",
                      text: { body: "Hello world" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = parseWhatsAppTextMessages(payload);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        waId: "919876543210",
        messageId: "wamid.txt1",
        body: "Hello world",
        timestamp: "1700000000",
      });
    });

    it("should return empty array for empty entry list", () => {
      expect(parseWhatsAppTextMessages({ entry: [] })).toEqual([]);
    });
  });

  // ── downloadWhatsAppMedia ─────────────────────────────────────────

  describe("downloadWhatsAppMedia", () => {
    it("should download media in two steps (URL fetch then binary download)", async () => {
      const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: "https://cdn.facebook.com/media/abc" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(binaryData),
        });

      const result = await downloadWhatsAppMedia("media-id-123");

      expect(result).toBeInstanceOf(Buffer);
      expect(result!.length).toBe(4);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        "https://graph.facebook.com/v20.0/media-id-123",
        expect.objectContaining({
          headers: { Authorization: "Bearer test-token" },
        }),
      );
    });

    it("should return null when WHATSAPP_TOKEN is missing", async () => {
      delete process.env.WHATSAPP_TOKEN;

      const result = await downloadWhatsAppMedia("media-id-123");

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return null when media URL fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const result = await downloadWhatsAppMedia("media-id-123");

      expect(result).toBeNull();
    });

    it("should return null when download URL is missing from response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await downloadWhatsAppMedia("media-id-123");

      expect(result).toBeNull();
    });

    it("should return null on network error during download", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: "https://cdn.facebook.com/media/abc" }),
        })
        .mockRejectedValueOnce(new Error("Network timeout"));

      const result = await downloadWhatsAppMedia("media-id-123");

      expect(result).toBeNull();
    });
  });
});
