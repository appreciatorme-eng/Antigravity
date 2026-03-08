import { expect, it } from "vitest";

import {
  SHARED_ITINERARY_PUBLIC_SELECT,
  shareSelectContainsPii,
} from "../../../src/lib/share/public-trip";

it("keeps the public share projection free of traveler PII fields", () => {
  expect(shareSelectContainsPii(SHARED_ITINERARY_PUBLIC_SELECT)).toBe(false);
  expect(SHARED_ITINERARY_PUBLIC_SELECT).toContain("organizations");
  expect(SHARED_ITINERARY_PUBLIC_SELECT).not.toContain("email");
  expect(SHARED_ITINERARY_PUBLIC_SELECT).not.toContain("phone");
  expect(SHARED_ITINERARY_PUBLIC_SELECT).not.toContain("full_name");
});
