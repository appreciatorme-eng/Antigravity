import { expect, it } from "vitest";
import { safeErrorMessage } from "../../../src/lib/security/safe-error";

/**
 * safeErrorMessage uses a module-level IS_PRODUCTION constant evaluated at
 * import time. In the test environment NODE_ENV is "test", so IS_PRODUCTION
 * is false — meaning the function returns error.message for Error instances.
 * Mutating process.env.NODE_ENV after import has no effect on the constant.
 */

it("returns error.message for Error instances in non-production env", () => {
    const err = new Error("Database connection refused");
    expect(safeErrorMessage(err)).toBe("Database connection refused");
});

it("returns default fallback for non-Error objects regardless of env", () => {
    expect(safeErrorMessage({ code: 500 })).toBe("An unexpected error occurred");
    expect(safeErrorMessage(null)).toBe("An unexpected error occurred");
    expect(safeErrorMessage(undefined)).toBe("An unexpected error occurred");
    expect(safeErrorMessage("raw string error")).toBe("An unexpected error occurred");
    expect(safeErrorMessage(42)).toBe("An unexpected error occurred");
});

it("returns custom fallback for non-Error objects when provided", () => {
    expect(safeErrorMessage(null, "Failed to process")).toBe("Failed to process");
    expect(safeErrorMessage({}, "Operation failed")).toBe("Operation failed");
});

it("uses the custom fallback even for Error instances when provided in non-production", () => {
    const err = new Error("internal detail");
    expect(safeErrorMessage(err, "Custom fallback")).toBe("internal detail");
});

it("returns empty string for Error with no message in non-production", () => {
    const err = new Error();
    expect(safeErrorMessage(err)).toBe("");
});
