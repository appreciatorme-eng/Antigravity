import { describe, expect, it, vi } from "vitest";

import { getOrCreateSession } from "@/lib/assistant/session";
import type { ActionContext } from "@/lib/assistant/types";

function createQueryBuilder(overrides?: {
  readonly existing?: unknown;
  readonly created?: unknown;
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((column: string, value: unknown) => {
      if (column === "channel") {
        builder.__channelValues.push(value);
      }
      return builder;
    }),
    gt: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: overrides?.existing ?? null, error: null })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data: overrides?.created ?? { id: "session_1" }, error: null })),
      })),
    })),
    __channelValues: [] as unknown[],
  };

  return builder;
}

describe("assistant session channel normalization", () => {
  it("stores whatsapp_group sessions in the whatsapp bucket", async () => {
    const builder = createQueryBuilder();
    const ctx = {
      organizationId: "org_1",
      userId: "user_1",
      channel: "whatsapp_group",
      supabase: {
        from: vi.fn(() => builder),
      },
    } as unknown as ActionContext;

    await getOrCreateSession(ctx);

    expect(builder.__channelValues).toContain("whatsapp");
    expect(builder.__channelValues).not.toContain("whatsapp_group");
  });
});
