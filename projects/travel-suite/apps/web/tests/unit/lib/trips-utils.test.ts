import { describe, expect, it } from "vitest";

import { deriveCommercialStage } from "../../../src/app/trips/utils";
import type { EnrichedTrip } from "../../../src/app/trips/types";

function makeTrip(overrides: Partial<EnrichedTrip> = {}): EnrichedTrip {
  return {
    id: "trip_123",
    client_id: "client_123",
    status: "pending",
    start_date: "2026-05-12",
    end_date: "2026-05-15",
    destination: "Dubai",
    created_at: "2026-04-21T00:00:00.000Z",
    organization_id: "org_123",
    profiles: {
      full_name: "tessss",
      email: "tessss@example.com",
    },
    itineraries: {
      id: "iti_123",
      trip_title: "Dubai Trip for tessss",
      duration_days: 4,
      destination: "Dubai",
    },
    itinerary_id: "iti_123",
    hero_image: null,
    share_code: null,
    share_status: null,
    viewed_at: null,
    approved_at: null,
    approved_by: null,
    self_service_status: null,
    client_comments: [],
    client_preferences: null,
    wishlist_items: [],
    share_payment_summary: null,
    proposal_id: null,
    proposal_status: null,
    proposal_share_token: null,
    proposal_title: null,
    holiday_summary: null,
    invoice: {
      total_amount: 0,
      paid_amount: 0,
      balance_amount: 0,
      payment_status: "none",
    },
    driver_coverage: {
      covered_days: 0,
      total_days: 4,
    },
    accommodation_coverage: {
      covered_days: 0,
      total_days: 4,
    },
    has_itinerary: true,
    days_until_departure: 21,
    ...overrides,
  };
}

describe("deriveCommercialStage", () => {
  it("does not mark a newly created pending trip as approved", () => {
    const trip = makeTrip({
      status: "pending",
      share_code: "share_123",
      share_status: "shared",
    });

    expect(deriveCommercialStage(trip)).toBe("shared");
  });

  it("marks approved only when a real approval signal exists", () => {
    const trip = makeTrip({
      status: "pending",
      share_code: "share_123",
      share_status: "approved",
      approved_at: "2026-04-21T01:00:00.000Z",
    });

    expect(deriveCommercialStage(trip)).toBe("approved");
  });

  it("treats stale approved share status without approval details as viewed", () => {
    const trip = makeTrip({
      status: "confirmed",
      share_code: "share_123",
      share_status: "approved",
      viewed_at: "2026-04-21T00:30:00.000Z",
      approved_at: null,
      approved_by: null,
    });

    expect(deriveCommercialStage(trip)).toBe("viewed");
  });
});
