// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  formatUsd,
  formatInr,
  CATEGORY_LABEL,
  CATEGORY_COLOR,
} from "@/app/admin/cost/_components/types";

describe("Cost types utilities", () => {
  describe("formatUsd", () => {
    it("formats zero", () => {
      expect(formatUsd(0)).toBe("$0.00");
    });

    it("formats whole numbers with two decimals", () => {
      expect(formatUsd(42)).toBe("$42.00");
    });

    it("formats decimal values", () => {
      expect(formatUsd(1234.56)).toBe("$1234.56");
    });

    it("rounds to two decimal places", () => {
      expect(formatUsd(9.999)).toBe("$10.00");
    });
  });

  describe("formatInr", () => {
    it("formats zero", () => {
      expect(formatInr(0)).toBe("\u20B90");
    });

    it("rounds to nearest integer", () => {
      expect(formatInr(99.7)).toBe("\u20B9100");
    });

    it("uses Indian locale formatting for large numbers", () => {
      const result = formatInr(1234567);
      expect(result).toContain("\u20B9");
      expect(result).toContain("12");
    });
  });

  describe("CATEGORY_LABEL", () => {
    it("has labels for all categories", () => {
      expect(CATEGORY_LABEL.amadeus).toBe("Flights & Hotels API");
      expect(CATEGORY_LABEL.image_search).toBe("Image Search");
      expect(CATEGORY_LABEL.ai_image).toBe("AI Image Generation");
    });
  });

  describe("CATEGORY_COLOR", () => {
    it("has colors for all categories", () => {
      expect(CATEGORY_COLOR.amadeus).toContain("text-");
      expect(CATEGORY_COLOR.image_search).toContain("text-");
      expect(CATEGORY_COLOR.ai_image).toContain("text-");
    });
  });
});
