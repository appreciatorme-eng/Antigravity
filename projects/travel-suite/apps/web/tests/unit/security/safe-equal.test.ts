import { expect, it } from "vitest";
import { safeEqual } from "../../../src/lib/security/safe-equal";

it("returns true for identical strings", () => {
    expect(safeEqual("secret-token", "secret-token")).toBe(true);
});

it("returns false for different strings of same length", () => {
    expect(safeEqual("aaaaaaaa", "aaaaaaab")).toBe(false);
});

it("returns false when strings have different lengths", () => {
    expect(safeEqual("short", "longer-string")).toBe(false);
});

it("returns false for empty vs non-empty string", () => {
    expect(safeEqual("", "secret")).toBe(false);
});

it("returns true for two empty strings", () => {
    expect(safeEqual("", "")).toBe(true);
});

it("returns false for case-mismatched strings", () => {
    expect(safeEqual("TOKEN", "token")).toBe(false);
});

it("handles strings with special characters", () => {
    const special = "abc!@#$%^&*()_+-=";
    expect(safeEqual(special, special)).toBe(true);
    expect(safeEqual(special, "abc!@#$%^&*()_+-!")).toBe(false);
});

it("handles unicode characters consistently", () => {
    expect(safeEqual("héllo", "héllo")).toBe(true);
    expect(safeEqual("héllo", "hello")).toBe(false);
});
