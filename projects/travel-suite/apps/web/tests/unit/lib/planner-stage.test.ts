import { describe, expect, it } from "vitest";

import { deriveStage } from "../../../src/app/planner/planner.types";

describe("deriveStage", () => {
  it("does not mark linked operational trips as approved", () => {
    expect(
      deriveStage({
        share_code: "share_123",
        share_status: "viewed",
        viewed_at: "2026-04-21T00:30:00.000Z",
        trip_id: "trip_123",
        trip_status: "confirmed",
      }),
    ).toBe("viewed");
  });

  it("treats stale approved share status without approval details as viewed", () => {
    expect(
      deriveStage({
        share_code: "share_123",
        share_status: "approved",
        viewed_at: "2026-04-21T00:30:00.000Z",
        approved_at: null,
        approved_by: null,
      }),
    ).toBe("viewed");
  });

  it("marks approved only when explicit client approval details exist", () => {
    expect(
      deriveStage({
        share_code: "share_123",
        share_status: "approved",
        viewed_at: "2026-04-21T00:30:00.000Z",
        approved_at: "2026-04-21T00:45:00.000Z",
        approved_by: "Client Name",
      }),
    ).toBe("approved");
  });
});
