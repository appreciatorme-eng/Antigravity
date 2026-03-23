import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";

// Mock dependencies
vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
  logEvent: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

const mockSend = vi.fn();

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html><body>Hello</body></html>"),
}));

// We need to control whether resend is null or has a client
let mockResend: { emails: { send: ReturnType<typeof vi.fn> } } | null = {
  emails: { send: mockSend },
};

vi.mock("@/lib/email/resend", () => ({
  get resend() {
    return mockResend;
  },
  FROM_ADDRESS: "bookings@tripbuilt.com",
  FROM_NAME: "TripBuilt",
}));

import { sendEmail } from "@/lib/email/send";
import * as Sentry from "@sentry/nextjs";
import { render } from "@react-email/render";

function FakeEmailTemplate() {
  return createElement("div", null, "Hello World");
}

describe("email/send", () => {
  beforeEach(() => {
    mockSend.mockReset();
    vi.mocked(render).mockResolvedValue("<html><body>Hello</body></html>");
    mockResend = { emails: { send: mockSend } };
  });

  it("should send an email with correct parameters", async () => {
    mockSend.mockResolvedValueOnce({ id: "email-123" });

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Trip Confirmation",
      react: createElement(FakeEmailTemplate),
    });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith({
      from: "TripBuilt <bookings@tripbuilt.com>",
      to: ["user@example.com"],
      subject: "Trip Confirmation",
      html: "<html><body>Hello</body></html>",
      attachments: undefined,
    });
  });

  it("should handle attachments correctly", async () => {
    mockSend.mockResolvedValueOnce({ id: "email-456" });

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Invoice",
      react: createElement(FakeEmailTemplate),
      attachments: [
        {
          filename: "invoice.pdf",
          content: Buffer.from("PDF content"),
          contentType: "application/pdf",
        },
      ],
    });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          {
            filename: "invoice.pdf",
            content: Buffer.from("PDF content"),
            contentType: "application/pdf",
          },
        ],
      }),
    );
  });

  it("should return false when resend client is not configured", async () => {
    mockResend = null;

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      react: createElement(FakeEmailTemplate),
    });

    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should return false and capture Sentry exception on send failure", async () => {
    const sendError = new Error("Resend API rate limit exceeded");
    mockSend.mockRejectedValueOnce(sendError);

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Fail Test",
      react: createElement(FakeEmailTemplate),
    });

    expect(result).toBe(false);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      sendError,
      expect.objectContaining({
        extra: { to: "user@example.com", subject: "Fail Test" },
      }),
    );
  });

  it("should return false on render failure", async () => {
    vi.mocked(render).mockRejectedValueOnce(new Error("Invalid JSX"));

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Render Error",
      react: createElement(FakeEmailTemplate),
    });

    expect(result).toBe(false);
  });

  it("should send to a single recipient as array", async () => {
    mockSend.mockResolvedValueOnce({ id: "email-789" });

    await sendEmail({
      to: "single@example.com",
      subject: "Single Recipient",
      react: createElement(FakeEmailTemplate),
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["single@example.com"],
      }),
    );
  });
});
