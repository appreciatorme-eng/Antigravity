// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  getCategoryColor,
  CATEGORY_BADGE_VARIANTS,
  EMPTY_FORM_DATA,
  PACKAGE_TEMPLATES,
} from "@/app/add-ons/_components/types";

describe("Add-ons types utilities", () => {
  describe("getCategoryColor", () => {
    it("returns primary for Activities", () => {
      expect(getCategoryColor("Activities")).toBe("primary");
    });

    it("returns warning for Dining", () => {
      expect(getCategoryColor("Dining")).toBe("warning");
    });

    it("returns info for Transport", () => {
      expect(getCategoryColor("Transport")).toBe("info");
    });

    it("returns success for Upgrades", () => {
      expect(getCategoryColor("Upgrades")).toBe("success");
    });

    it("returns default for unknown categories", () => {
      expect(getCategoryColor("Unknown")).toBe("default");
      expect(getCategoryColor("")).toBe("default");
    });
  });

  describe("CATEGORY_BADGE_VARIANTS", () => {
    it("has 4 categories mapped", () => {
      expect(Object.keys(CATEGORY_BADGE_VARIANTS)).toHaveLength(4);
    });
  });

  describe("EMPTY_FORM_DATA", () => {
    it("has all fields empty or default", () => {
      expect(EMPTY_FORM_DATA.name).toBe("");
      expect(EMPTY_FORM_DATA.description).toBe("");
      expect(EMPTY_FORM_DATA.price).toBe("");
      expect(EMPTY_FORM_DATA.category).toBe("Activities");
      expect(EMPTY_FORM_DATA.image_url).toBe("");
      expect(EMPTY_FORM_DATA.duration).toBe("");
    });
  });

  describe("PACKAGE_TEMPLATES", () => {
    it("has at least 5 templates", () => {
      expect(Object.keys(PACKAGE_TEMPLATES).length).toBeGreaterThanOrEqual(5);
    });

    it("each template has required fields", () => {
      for (const [, template] of Object.entries(PACKAGE_TEMPLATES)) {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.price).toBeTruthy();
        expect(template.category).toBeTruthy();
        expect(template.duration).toBeTruthy();
      }
    });

    it("ai_credits template has correct structure", () => {
      const template = PACKAGE_TEMPLATES.ai_credits;
      expect(template.name).toBe("AI Credits Pack");
      expect(template.category).toBe("Upgrades");
      expect(Number(template.price)).toBeGreaterThan(0);
    });
  });
});
