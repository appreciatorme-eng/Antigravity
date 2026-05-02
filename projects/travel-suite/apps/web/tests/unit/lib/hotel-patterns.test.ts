import { describe, expect, it } from "vitest";

import {
  isLikelyLocationOnly,
  looksLikeHotelName,
  stripTrailingLocation,
} from "../../../src/lib/import/hotel-patterns";

describe("isLikelyLocationOnly", () => {
  it("flags well-known Indian destinations as location-only", () => {
    expect(isLikelyLocationOnly("Pahalgam")).toBe(true);
    expect(isLikelyLocationOnly("Srinagar")).toBe(true);
    expect(isLikelyLocationOnly("Gulmarg")).toBe(true);
    expect(isLikelyLocationOnly("Munnar")).toBe(true);
    expect(isLikelyLocationOnly("Goa")).toBe(true);
  });

  it("flags stop words and generic transit phrases", () => {
    expect(isLikelyLocationOnly("Airport")).toBe(true);
    expect(isLikelyLocationOnly("Station")).toBe(true);
    expect(isLikelyLocationOnly("transfer")).toBe(true);
    expect(isLikelyLocationOnly("breakfast")).toBe(true);
  });

  it("does NOT flag real hotel names", () => {
    expect(isLikelyLocationOnly("Hotel Heevan")).toBe(false);
    expect(isLikelyLocationOnly("The Lalit Grand")).toBe(false);
    expect(isLikelyLocationOnly("Vivanta by Taj")).toBe(false);
    expect(isLikelyLocationOnly("Houseboat New Bombay Palace")).toBe(false);
  });

  it("respects the additional cities list", () => {
    expect(isLikelyLocationOnly("Custompur", ["Custompur"])).toBe(true);
  });
});

describe("looksLikeHotelName", () => {
  it("accepts names with a brand keyword", () => {
    expect(looksLikeHotelName("Hotel Heevan")).toBe(true);
    expect(looksLikeHotelName("Khyber Resort & Spa")).toBe(true);
    expect(looksLikeHotelName("Houseboat New Bombay Palace")).toBe(true);
    expect(looksLikeHotelName("Welcomhotel Pine N Peak")).toBe(true);
    expect(looksLikeHotelName("The Lalit Grand")).toBe(true);
    expect(looksLikeHotelName("Vivanta by Taj Srinagar")).toBe(true);
  });

  it("accepts names with a star-rating qualifier", () => {
    expect(looksLikeHotelName("4-star Pine View Inn")).toBe(true);
  });

  it("rejects single-token city names", () => {
    expect(looksLikeHotelName("Pahalgam")).toBe(false);
    expect(looksLikeHotelName("Srinagar")).toBe(false);
    expect(looksLikeHotelName("Gulmarg")).toBe(false);
  });

  it("rejects generic transit / airport phrases", () => {
    expect(looksLikeHotelName("Airport")).toBe(false);
    expect(looksLikeHotelName("transfer")).toBe(false);
    expect(looksLikeHotelName("to hotel")).toBe(false);
  });

  it("rejects empty / very short candidates", () => {
    expect(looksLikeHotelName("")).toBe(false);
    expect(looksLikeHotelName("ab")).toBe(false);
  });
});

describe("stripTrailingLocation", () => {
  it("removes a trailing city after a comma", () => {
    expect(stripTrailingLocation("Hotel Heevan, Srinagar")).toBe("Hotel Heevan");
    expect(stripTrailingLocation("The Lalit Grand, Pahalgam")).toBe("The Lalit Grand");
  });

  it("preserves the name when no city follows", () => {
    expect(stripTrailingLocation("Hotel Heevan")).toBe("Hotel Heevan");
    expect(stripTrailingLocation("Khyber Resort & Spa")).toBe("Khyber Resort & Spa");
  });

  it("leaves a non-city qualifier alone", () => {
    expect(stripTrailingLocation("Hotel Heevan, Deluxe Wing")).toBe("Hotel Heevan, Deluxe Wing");
  });
});
