import { describe, expect, it } from "vitest";

import {
  buildItineraryRawDataFromDraft,
  getImportedItineraryDraftErrors,
  normalizeImportedItineraryDraft,
} from "../../../src/lib/import/trip-draft";

describe("trip draft normalization", () => {
  it("normalizes extracted PDF data into a review draft with package metadata", () => {
    const draft = normalizeImportedItineraryDraft(
      {
        name: "Thailand Tour Package",
        destination: "Phuket, Thailand",
        duration_days: 6,
        start_date: "2026-04-28",
        end_date: "2026-05-03",
        description: "Island-hopping itinerary.",
        budget: "Moderate",
        inclusions: ["Airport transfers", "Breakfast"],
        exclusions: ["Flights"],
        pricing: {
          per_person_cost: 87025,
          total_cost: 282050,
          currency: "INR",
          pax_count: 4,
        },
        days: [
          {
            day_number: 1,
            title: "Arrival",
            description: "Check in and settle down.",
            activities: [
              {
                time: "Morning",
                title: "Airport pickup",
                description: "Meet the driver and transfer to hotel.",
                location: "Phuket Airport",
              },
            ],
          },
        ],
      },
      { filename: "thai.pdf", source: "pdf" },
    );

    expect(draft.trip_title).toBe("Thailand Tour Package");
    expect(draft.start_date).toBe("2026-04-28");
    expect(draft.end_date).toBe("2026-05-03");
    expect(draft.pricing?.per_person_cost).toBe(87025);
    expect(draft.inclusions).toEqual(["Airport transfers", "Breakfast"]);
    expect(draft.source_meta?.filename).toBe("thai.pdf");
    expect(draft.days[0]?.theme).toBe("Arrival");
  });

  it("flags missing required itinerary structure", () => {
    const draft = normalizeImportedItineraryDraft({
      trip_title: "Broken import",
      destination: "",
      days: [],
    });

    expect(getImportedItineraryDraftErrors(draft)).toEqual([
      "Destination is required.",
      "At least one day is required.",
      "At least one day must include an activity.",
    ]);
    expect(draft.warnings).toContain("No valid itinerary days were extracted from this brochure.");
  });

  it("builds raw_data without dropping imported package fields", () => {
    const draft = normalizeImportedItineraryDraft({
      trip_title: "Ladakh Escape",
      destination: "Leh",
      duration_days: 2,
      summary: "Quick mountain trip",
      tips: ["Carry warm layers"],
      inclusions: ["Hotel"],
      exclusions: ["Flights"],
      pricing: { total_cost: 100000, currency: "INR" },
      days: [
        {
          day_number: 1,
          theme: "Arrival",
          activities: [{ time: "TBD", title: "Check in", description: "", location: "Leh" }],
        },
      ],
    });

    expect(buildItineraryRawDataFromDraft(draft)).toMatchObject({
      trip_title: "Ladakh Escape",
      destination: "Leh",
      tips: ["Carry warm layers"],
      inclusions: ["Hotel"],
      exclusions: ["Flights"],
      pricing: { total_cost: 100000, currency: "INR" },
    });
  });

  it("derives trip dates from dated itinerary days when explicit dates are missing", () => {
    const draft = normalizeImportedItineraryDraft({
      trip_title: "Phuket Escape",
      destination: "Phuket",
      duration_days: 3,
      days: [
        {
          day_number: 1,
          title: "Arrival",
          date: "2026-04-28",
          activities: [{ time: "TBD", title: "Check in", description: "", location: "Phuket" }],
        },
        {
          day_number: 2,
          title: "Island day",
          date: "2026-04-29",
          activities: [{ time: "TBD", title: "Boat trip", description: "", location: "Phi Phi" }],
        },
      ],
    });

    expect(draft.start_date).toBe("2026-04-28");
    expect(draft.end_date).toBe("2026-04-29");
  });

  it("computes an end date from the start date and duration when needed", () => {
    const draft = normalizeImportedItineraryDraft({
      trip_title: "Krabi Escape",
      destination: "Krabi",
      duration_days: 4,
      start_date: "2026-05-10",
      days: [
        {
          day_number: 1,
          title: "Arrival",
          activities: [{ time: "TBD", title: "Check in", description: "", location: "Krabi" }],
        },
      ],
    });

    expect(draft.start_date).toBe("2026-05-10");
    expect(draft.end_date).toBe("2026-05-13");
  });
});
