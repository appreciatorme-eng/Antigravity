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
        hotel_name: "To be decided by travel operator",
        is_fallback: true,
      }),
      expect.objectContaining({
        day_number: 6,
        hotel_name: "To be decided by travel operator",
        is_fallback: true,
      }),
      expect.objectContaining({
        day_number: 7,
        hotel_name: "To be decided by travel operator",
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
        hotel_name: "To be decided by travel operator",
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

  it("keeps a seven day emoji itinerary from turning package day references into extra days", () => {
    const text = `
      🟢 Day 1 – Tuesday, May 5
      Arrival in Srinagar

      3:00 PM – Pickup from Srinagar Airport
      Transfer to hotel or houseboat in Srinagar
      Evening: Relax or enjoy a Shikara ride on Dal Lake
      🛌 Overnight: Srinagar

      🟢 Day 2 – Wednesday, May 6
      Day trip to Sonamarg
      Breakfast at Srinagar hotel
      Drive to Sonamarg (~80 km / 2.5–3 hrs)
      Visit Thajiwas Glacier (pony ride available)
      Afternoon drive back to Srinagar
      🛌 Overnight: Srinagar

      🟢 Day 3 – Thursday, May 7
      Day trip to Gulmarg (return to Srinagar)
      Breakfast → drive to Gulmarg (~55 km / 1.5–2 hrs)
      Gondola cable car (book online in advance)
      Explore meadow, snow activities
      Late afternoon drive back to Srinagar
      🛌 Overnight: Srinagar ✅ (as requested)

      🟢 Day 4 – Friday, May 8
      Srinagar to Pahalgam
      Breakfast → drive to Pahalgam (~100 km / 2.5–3 hrs)
      Check into hotel
      Visit Betaab Valley, Lidder River walk
      🛌 Overnight: Pahalgam

      🟢 Day 5 – Saturday, May 9
      Pahalgam to Katra (Vaishno Devi base)
      Early breakfast → drive to Katra (~250 km / 7–8 hrs)
      Evening arrival in Katra
      Register for Vaishno Devi Yatra (online or at counter)
      🛌 Overnight: Katra (to start trek early next day)

      🟢 Day 6 – Sunday, May 10
      Vaishno Devi trek & drive to Jammu
      Early morning start trek (~12–14 km one way)
      Darshan at Vaishno Devi Temple
      Descend to Katra (by foot / pony / helicopter)
      Afternoon drive to Jammu (~50 km / 1.5 hrs)
      🛌 Overnight: Jammu ✅ (as requested)

      🟢 Day 7 – Monday, May 11
      Departure from Jammu Airport
      Breakfast in Jammu
      Drive to Jammu Airport
      ✅ Reach by 3:00 PM for your flight

      ✅ Inclusions
      3 Night stay at Hotel in Srinagar (Days 1, 2, 3)
      1 Night stay at Hotel in Pahalgam (Day 4)
      1 Night stay at Hotel in Katra (Day 5)
      1 Night stay at Hotel in Jammu (Day 6)
      Transportation - Entire round trip journey by Private Vehicle (Srinagar Airport → Sonamarg → Gulmarg → Pahalgam → Katra → Vaishno Devi → Jammu → Jammu Airport)
      Shikara Ride for 60 Minutes in Dal Lake (Day 1 or Day 3 evening)

      ❌ Exclusions
      Airfare / Train fare to and from Srinagar & Jammu
      Helicopter ticket for Vaishno Devi
      Anything not mentioned in the "Inclusions" section
    `;

    const fallback = buildFallbackTourDraftFromText(text);
    const hydrated = mergeImportedAccommodationHints(fallback, text);
    const draft = normalizeImportedItineraryDraft(hydrated);

    expect(draft.duration_days).toBe(7);
    expect(draft.days).toHaveLength(7);
    expect(draft.days.map((day) => day.day_number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(draft.days.at(-1)?.title).toContain("Monday, May 11");
    expect(draft.inclusions).toContain("Shikara Ride for 60 Minutes in Dal Lake (Day 1 or Day 3 evening)");
    expect(draft.exclusions).toContain("Anything not mentioned in the \"Inclusions\" section");
    expect(draft.accommodations).toEqual([
      expect.objectContaining({ day_number: 1, hotel_name: "Hotel in Srinagar", is_fallback: false }),
      expect.objectContaining({ day_number: 2, hotel_name: "Hotel in Srinagar", is_fallback: false }),
      expect.objectContaining({ day_number: 3, hotel_name: "Hotel in Srinagar", is_fallback: false }),
      expect.objectContaining({ day_number: 4, hotel_name: "Hotel in Pahalgam", is_fallback: false }),
      expect.objectContaining({ day_number: 5, hotel_name: "Hotel in Katra", is_fallback: false }),
      expect.objectContaining({ day_number: 6, hotel_name: "Hotel in Jammu", is_fallback: false }),
      expect.objectContaining({
        day_number: 7,
        hotel_name: "To be decided by travel operator",
        is_fallback: true,
      }),
    ]);
  });

  it("does not treat 'overnight at Pahalgam' as a hotel name", () => {
    const text = `
      Kashmir 5N/6D

      Day 1 - Arrival in Srinagar
      Pickup from Srinagar Airport.
      Overnight at Srinagar.

      Day 2 - Pahalgam
      Drive to Pahalgam.
      Overnight at Pahalgam.

      Day 3 - Pahalgam local sightseeing
      Aru and Betaab Valley.
      Overnight at Pahalgam.

      Day 4 - Drive to Gulmarg
      Gondola ride.
      Overnight at Gulmarg.

      Day 5 - Return to Srinagar
      Stay at Houseboat New Bombay Palace.
      Overnight at Srinagar.

      Day 6 - Departure
      Transfer to airport.
    `;

    const fallback = buildFallbackTourDraftFromText(text);
    const hydrated = mergeImportedAccommodationHints(fallback, text);
    const draft = normalizeImportedItineraryDraft(hydrated);

    const hotelNames = (draft.accommodations ?? []).map((a) => a.hotel_name);
    expect(hotelNames).not.toContain("Pahalgam");
    expect(hotelNames).not.toContain("Srinagar");
    expect(hotelNames).not.toContain("Gulmarg");

    const day5 = draft.accommodations?.find((a) => a.day_number === 5);
    expect(day5?.hotel_name.toLowerCase()).toContain("houseboat");

    const day2 = draft.accommodations?.find((a) => a.day_number === 2);
    expect(day2?.is_fallback).toBe(true);
    expect(day2?.hotel_name).toBe("To be decided by travel operator");
  });

  it("strips trailing city qualifiers from hotel names", () => {
    const text = `
      Kashmir Holiday

      Day 1 - Srinagar
      Stay at Hotel Heevan, Srinagar.

      Day 2 - Pahalgam
      Stay at Hotel Hilltop, Pahalgam.
    `;

    const fallback = buildFallbackTourDraftFromText(text);
    const hydrated = mergeImportedAccommodationHints(fallback, text);
    const draft = normalizeImportedItineraryDraft(hydrated);

    const day1 = draft.accommodations?.find((a) => a.day_number === 1);
    expect(day1?.hotel_name).toBe("Hotel Heevan");

    const day2 = draft.accommodations?.find((a) => a.day_number === 2);
    expect(day2?.hotel_name).toBe("Hotel Hilltop");
  });

  it("downgrades AI-suggested city-only hotel names to the fallback", () => {
    const aiOutput = {
      name: "Kashmir 5N/6D",
      destination: "Srinagar, India",
      duration_days: 2,
      days: [
        {
          day_number: 1,
          title: "Arrival",
          activities: [{ title: "Pickup", location: "Srinagar" }],
          accommodation: { hotel_name: "Hotel Heevan" },
        },
        {
          day_number: 2,
          title: "Pahalgam",
          activities: [{ title: "Drive to Pahalgam", location: "Pahalgam" }],
          accommodation: { hotel_name: "Pahalgam" },
        },
      ],
      accommodations: [{ day_number: 2, hotel_name: "Pahalgam" }],
    };

    const draft = normalizeImportedItineraryDraft(aiOutput);
    const day2 = draft.accommodations?.find((a) => a.day_number === 2);

    expect(day2?.hotel_name).toBe("To be decided by travel operator");
    expect(day2?.is_fallback).toBe(true);
  });
});
