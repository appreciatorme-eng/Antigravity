import { describe, expect, it } from "vitest";

import {
  buildFallbackTourDraftFromText,
  extractImportTextFromHtml,
  looksLikePdfUrl,
} from "../../../src/lib/import/trip-import";
import { mergeImportedAccommodationHints, normalizeImportedItineraryDraft } from "../../../src/lib/import/trip-draft";

describe("trip import helpers", () => {
  it("extracts readable brochure text from html while stripping chrome noise", () => {
    const text = extractImportTextFromHtml(`
      <html>
        <head>
          <title>Thailand Tour Package</title>
          <meta name="description" content="7 day island hopping itinerary" />
        </head>
        <body>
          <nav>Navigation</nav>
          <header>Site Header</header>
          <main>
            <h1>Thailand Tour Package</h1>
            <p>Day 1 Arrival in Phuket</p>
            <p>Day 2 Phi Phi Island tour</p>
          </main>
          <footer>Footer links</footer>
        </body>
      </html>
    `);

    expect(text).toContain("Thailand Tour Package");
    expect(text).toContain("7 day island hopping itinerary");
    expect(text).toContain("Day 2 Phi Phi Island tour");
    expect(text).not.toContain("Navigation");
    expect(text).not.toContain("Footer links");
  });

  it("detects direct pdf urls", () => {
    expect(looksLikePdfUrl("https://example.com/brochures/thailand.pdf")).toBe(true);
    expect(looksLikePdfUrl("https://example.com/download?id=123")).toBe(false);
    expect(looksLikePdfUrl("https://example.com/tour.pdf?version=2")).toBe(true);
  });

  it("builds a usable fallback draft from pasted operator text when AI import is unavailable", () => {
    const text = `
      Kashmir and Vaishno Devi Pilgrimage
      6 Nights / 7 Days

      Day 1 - Arrival in Srinagar
      Pickup from Srinagar Airport and transfer to hotel or houseboat.

      Day 2 - Drive to Sonamarg
      Local sightseeing and return to Srinagar.

      Inclusions
      3 Night stay at Hotel in Srinagar
      1 Night stay at Hotel in Pahalgam
      Daily Breakfast and Dinner included
      Transportation by Private Vehicle

      Exclusions
      Airfare / Train fare to and from Srinagar & Jammu
      Personal expenses
    `;

    const fallback = buildFallbackTourDraftFromText(text);
    const hydrated = mergeImportedAccommodationHints(fallback, text);
    const draft = normalizeImportedItineraryDraft(hydrated, {
      source: "text",
      extraction_confidence: 0.45,
    });

    expect(draft.trip_title).toBe("Kashmir and Vaishno Devi Pilgrimage");
    expect(draft.duration_days).toBe(7);
    expect(draft.days).toHaveLength(7);
    expect(draft.inclusions).toEqual([
      "3 Night stay at Hotel in Srinagar",
      "1 Night stay at Hotel in Pahalgam",
      "Daily Breakfast and Dinner included",
      "Transportation by Private Vehicle",
    ]);
    expect(draft.exclusions).toEqual([
      "Airfare / Train fare to and from Srinagar & Jammu",
      "Personal expenses",
    ]);
    expect(draft.accommodations).toEqual([
      expect.objectContaining({ day_number: 1, hotel_name: "Hotel in Srinagar", is_fallback: false }),
      expect.objectContaining({ day_number: 2, hotel_name: "Hotel in Srinagar", is_fallback: false }),
      expect.objectContaining({ day_number: 3, hotel_name: "Hotel in Srinagar", is_fallback: false }),
      expect.objectContaining({ day_number: 4, hotel_name: "Hotel in Pahalgam", is_fallback: false }),
      expect.objectContaining({
        day_number: 5,
        hotel_name: "Hotel details will be shared by the tour operator.",
        is_fallback: true,
      }),
      expect.objectContaining({
        day_number: 6,
        hotel_name: "Hotel details will be shared by the tour operator.",
        is_fallback: true,
      }),
      expect.objectContaining({
        day_number: 7,
        hotel_name: "Hotel details will be shared by the tour operator.",
        is_fallback: true,
      }),
    ]);
    expect(draft.warnings).toContain(
      "AI extraction was unavailable, so TripBuilt created a fallback draft from the pasted text. Review before creating the trip.",
    );
  });

  it("detects operator route-line itineraries when day labels are missing", () => {
    const text = `
      Kashmir and Vaishno Devi Pilgrimage
      6N / 7D
      Srinagar Airport -> Dal Lake -> Srinagar
      Srinagar -> Sonamarg -> Srinagar
      Srinagar -> Gulmarg -> Srinagar
      Srinagar -> Pahalgam
      Pahalgam -> Katra
      Vaishno Devi trek -> Katra
      Jammu Airport departure

      Inclusions
      3 Night stay at Hotel in Srinagar
      1 Night stay at Hotel in Pahalgam
      2 Night stay at Hotel in Katra

      Exclusions
      Airfare / train fare
    `;

    const fallback = buildFallbackTourDraftFromText(text);
    const hydrated = mergeImportedAccommodationHints(fallback, text);
    const draft = normalizeImportedItineraryDraft(hydrated, {
      source: "text",
      extraction_confidence: 0.45,
    });

    expect(draft.duration_days).toBe(7);
    expect(draft.days).toHaveLength(7);
    expect(draft.days.map((day) => day.title)).toEqual([
      "Srinagar Airport to Dal Lake to Srinagar",
      "Srinagar to Sonamarg to Srinagar",
      "Srinagar to Gulmarg to Srinagar",
      "Srinagar to Pahalgam",
      "Pahalgam to Katra",
      "Vaishno Devi trek to Katra",
      "Jammu Airport departure",
    ]);
    expect(draft.accommodations).toEqual([
      expect.objectContaining({ day_number: 1, hotel_name: "Hotel in Srinagar", is_fallback: false }),
      expect.objectContaining({ day_number: 2, hotel_name: "Hotel in Srinagar", is_fallback: false }),
      expect.objectContaining({ day_number: 3, hotel_name: "Hotel in Srinagar", is_fallback: false }),
      expect.objectContaining({ day_number: 4, hotel_name: "Hotel in Pahalgam", is_fallback: false }),
      expect.objectContaining({ day_number: 5, hotel_name: "Hotel in Katra", is_fallback: false }),
      expect.objectContaining({ day_number: 6, hotel_name: "Hotel in Katra", is_fallback: false }),
      expect.objectContaining({
        day_number: 7,
        hotel_name: "Hotel details will be shared by the tour operator.",
        is_fallback: true,
      }),
    ]);
  });

  it("detects numbered operator itinerary rows without confusing package lists", () => {
    const text = `
      Kashmir and Vaishno Devi Pilgrimage
      4 Days
      Day Wise Itinerary
      1. Arrival at Srinagar Airport and transfer to hotel
      2. Visit Sonamarg for sightseeing and return to Srinagar
      3. Drive to Gulmarg and enjoy local sightseeing
      4. Departure from Jammu Airport

      Inclusions
      1 Night stay at Hotel in Srinagar
      1 Night stay at Hotel in Gulmarg
      Breakfast and dinner

      Exclusions
      1. Airfare
      2. Personal expenses
    `;

    const fallback = buildFallbackTourDraftFromText(text);
    const hydrated = mergeImportedAccommodationHints(fallback, text);
    const draft = normalizeImportedItineraryDraft(hydrated);

    expect(draft.days.map((day) => day.title)).toEqual([
      "Arrival at Srinagar Airport and transfer to hotel",
      "Visit Sonamarg for sightseeing and return to Srinagar",
      "Drive to Gulmarg and enjoy local sightseeing",
      "Departure from Jammu Airport",
    ]);
    expect(draft.exclusions).toEqual(["1. Airfare", "2. Personal expenses"]);
  });
});
