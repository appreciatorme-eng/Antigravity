import { describe, expect, it } from "vitest";

import { buildItineraryReferenceNumber } from "../../../src/lib/itinerary/tracking";

const itinerary = {
  trip_title: "Singapore Gateway for Avi",
  destination: "Singapore",
  start_date: "2026-04-24",
  end_date: "2026-04-27",
  duration_days: 4,
  days: [{ day_number: 1, date: "2026-04-24", activities: [] }],
  branding: { organizationName: "Avi travels" },
};

describe("buildItineraryReferenceNumber", () => {
  it("uses a readable date, org, and short daily sequence format", () => {
    const reference = buildItineraryReferenceNumber(itinerary, {
      organizationName: "Avi travels",
      issuedAt: "2026-04-24T13:08:00.000Z",
      sequenceSource: "proposal-1",
    });

    expect(reference).toMatch(/^TB-AVI-260424-\d{2}$/);
  });

  it("is stable for the same itinerary and sequence source", () => {
    const context = {
      organizationName: "Avi travels",
      issuedAt: "2026-04-24T13:08:00.000Z",
      sequenceSource: "proposal-1",
    };

    expect(buildItineraryReferenceNumber(itinerary, context)).toBe(
      buildItineraryReferenceNumber(itinerary, context),
    );
  });

  it("falls back to the itinerary date and branding when no context is passed", () => {
    const reference = buildItineraryReferenceNumber(itinerary);

    expect(reference).toMatch(/^TB-AVI-260424-\d{2}$/);
  });
});
