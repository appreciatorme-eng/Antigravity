// safe-error-advanced.test.ts
// Advanced tests for safeErrorMessage from @/lib/security/safe-error

import { describe, expect, it } from "vitest";
import { safeErrorMessage } from "@/lib/security/safe-error";

/**
 * safeErrorMessage uses a module-level IS_PRODUCTION constant evaluated at
 * import time. In the test environment NODE_ENV is "test", so IS_PRODUCTION
 * is false. Mutating process.env.NODE_ENV after import has no effect on the
 * module-level constant. Therefore all tests here run in the non-production
 * code path.
 */

describe("safeErrorMessage - non-Error input types", () => {
  it("returns fallback for a plain string", () => {
    expect(safeErrorMessage("some error string")).toBe("An unexpected error occurred");
  });

  it("returns fallback for a number", () => {
    expect(safeErrorMessage(42)).toBe("An unexpected error occurred");
  });

  it("returns fallback for zero", () => {
    expect(safeErrorMessage(0)).toBe("An unexpected error occurred");
  });

  it("returns fallback for NaN", () => {
    expect(safeErrorMessage(NaN)).toBe("An unexpected error occurred");
  });

  it("returns fallback for null", () => {
    expect(safeErrorMessage(null)).toBe("An unexpected error occurred");
  });

  it("returns fallback for undefined", () => {
    expect(safeErrorMessage(undefined)).toBe("An unexpected error occurred");
  });

  it("returns fallback for boolean true", () => {
    expect(safeErrorMessage(true)).toBe("An unexpected error occurred");
  });

  it("returns fallback for boolean false", () => {
    expect(safeErrorMessage(false)).toBe("An unexpected error occurred");
  });

  it("returns fallback for a plain object", () => {
    expect(safeErrorMessage({ message: "looks like error" })).toBe(
      "An unexpected error occurred"
    );
  });

  it("returns fallback for an array", () => {
    expect(safeErrorMessage(["error1", "error2"])).toBe("An unexpected error occurred");
  });

  it("returns fallback for a symbol", () => {
    expect(safeErrorMessage(Symbol("err"))).toBe("An unexpected error occurred");
  });

  it("returns fallback for a function", () => {
    expect(safeErrorMessage(() => "err")).toBe("An unexpected error occurred");
  });
});

describe("safeErrorMessage - Error instances in non-production", () => {
  it("returns error.message for a standard Error", () => {
    expect(safeErrorMessage(new Error("connection failed"))).toBe("connection failed");
  });

  it("returns error.message for TypeError", () => {
    expect(safeErrorMessage(new TypeError("cannot read property"))).toBe(
      "cannot read property"
    );
  });

  it("returns error.message for RangeError", () => {
    expect(safeErrorMessage(new RangeError("value out of range"))).toBe(
      "value out of range"
    );
  });

  it("returns error.message for SyntaxError", () => {
    expect(safeErrorMessage(new SyntaxError("unexpected token"))).toBe(
      "unexpected token"
    );
  });

  it("returns error.message for ReferenceError", () => {
    expect(safeErrorMessage(new ReferenceError("x is not defined"))).toBe(
      "x is not defined"
    );
  });

  it("returns error.message for URIError", () => {
    expect(safeErrorMessage(new URIError("bad URI"))).toBe("bad URI");
  });

  it("returns empty string for Error with no message", () => {
    expect(safeErrorMessage(new Error())).toBe("");
  });

  it("returns empty string for Error with empty string message", () => {
    expect(safeErrorMessage(new Error(""))).toBe("");
  });

  it("returns error.message for custom Error subclass", () => {
    class AppError extends Error {
      constructor(message: string, public code: number) {
        super(message);
        this.name = "AppError";
      }
    }
    expect(safeErrorMessage(new AppError("custom error", 500))).toBe("custom error");
  });

  it("returns error.message even when error has extra properties", () => {
    const err = new Error("detailed info");
    (err as Record<string, unknown>).statusCode = 503;
    (err as Record<string, unknown>).context = { service: "db" };
    expect(safeErrorMessage(err)).toBe("detailed info");
  });
});

describe("safeErrorMessage - custom fallback", () => {
  it("uses custom fallback for null", () => {
    expect(safeErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
  });

  it("uses custom fallback for undefined", () => {
    expect(safeErrorMessage(undefined, "Something went wrong")).toBe(
      "Something went wrong"
    );
  });

  it("uses custom fallback for plain objects", () => {
    expect(safeErrorMessage({}, "Operation failed")).toBe("Operation failed");
  });

  it("uses custom fallback for strings", () => {
    expect(safeErrorMessage("string err", "Try again later")).toBe("Try again later");
  });

  it("returns error.message (not fallback) for Error instances in non-production", () => {
    const err = new Error("real message");
    expect(safeErrorMessage(err, "This should not be used")).toBe("real message");
  });

  it("uses empty string as custom fallback if provided", () => {
    expect(safeErrorMessage(null, "")).toBe("");
  });

  it("uses default fallback when second argument is not provided", () => {
    expect(safeErrorMessage(null)).toBe("An unexpected error occurred");
  });
});

describe("safeErrorMessage - deeply nested error patterns", () => {
  it("handles Error with cause property (still reads top-level message)", () => {
    const cause = new Error("root cause");
    const err = new Error("top-level message", { cause });
    expect(safeErrorMessage(err)).toBe("top-level message");
  });

  it("does not traverse into nested errors", () => {
    const inner = new Error("inner");
    const outer = new Error("outer");
    (outer as Record<string, unknown>).innerError = inner;
    expect(safeErrorMessage(outer)).toBe("outer");
  });

  it("handles Error with very long message", () => {
    const longMsg = "x".repeat(10000);
    const err = new Error(longMsg);
    expect(safeErrorMessage(err)).toBe(longMsg);
    expect(safeErrorMessage(err).length).toBe(10000);
  });

  it("handles Error with multiline message", () => {
    const err = new Error("line1\nline2\nline3");
    expect(safeErrorMessage(err)).toBe("line1\nline2\nline3");
  });
});
