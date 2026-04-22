import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchWithRetryMock } = vi.hoisted(() => ({
  fetchWithRetryMock: vi.fn(),
}));

vi.mock("@/lib/config/env", () => ({
  env: {
    evolution: {
      baseUrl: "https://evolution.test",
      apiKey: "test-key",
    },
  },
}));

vi.mock("@/lib/network/retry", () => ({
  fetchWithRetry: fetchWithRetryMock,
}));

import { sendEvolutionMedia } from "@/lib/whatsapp-evolution.server";

describe("sendEvolutionMedia", () => {
  beforeEach(() => {
    fetchWithRetryMock.mockReset();
    fetchWithRetryMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
    });
  });

  it("sends media without transport retries to avoid duplicate whatsapp documents", async () => {
    await sendEvolutionMedia(
      "org_demo",
      "+91 98765 43210",
      "https://example.com/file.pdf",
      "document",
      { fileName: "trip.pdf", mimetype: "application/pdf" },
    );

    expect(fetchWithRetryMock).toHaveBeenCalledTimes(1);
    expect(fetchWithRetryMock).toHaveBeenCalledWith(
      "https://evolution.test/message/sendMedia/org_demo",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
      }),
      expect.objectContaining({
        retries: 0,
        timeoutMs: 30_000,
      }),
    );
  });
});
