import { afterEach, expect, it } from "vitest";
import {
  normalizeBearerToken,
  parseRole,
  shouldRecordAuthFailure,
} from "../../../src/lib/auth/admin-helpers";

const originalMathRandom = Math.random;

afterEach(() => {
  Math.random = originalMathRandom;
});

it("normalizeBearerToken returns token for valid bearer auth header", () => {
  const token = normalizeBearerToken("Bearer abc-123");
  expect(token).toBe("abc-123");
});

it("normalizeBearerToken rejects malformed headers", () => {
  expect(normalizeBearerToken(null)).toBeNull();
  expect(normalizeBearerToken("Basic abc")).toBeNull();
  expect(normalizeBearerToken("Bearer   ")).toBeNull();
});

it("parseRole only accepts admin and super_admin roles", () => {
  expect(parseRole("admin")).toBe("admin");
  expect(parseRole("SUPER_ADMIN")).toBe("super_admin");
  expect(parseRole("user")).toBeNull();
  expect(parseRole(null)).toBeNull();
});

it("shouldRecordAuthFailure always records for identified users", () => {
  Math.random = () => 0.99;
  expect(
    shouldRecordAuthFailure({
      userId: "00000000-0000-0000-0000-000000000001",
      reason: "missing_or_invalid_auth",
    })
  ).toBe(true);
});

it("shouldRecordAuthFailure samples anonymous missing-auth events", () => {
  Math.random = () => 0.19;
  expect(shouldRecordAuthFailure({ reason: "missing_or_invalid_auth" })).toBe(true);

  Math.random = () => 0.21;
  expect(shouldRecordAuthFailure({ reason: "missing_or_invalid_auth" })).toBe(false);
});

it("shouldRecordAuthFailure records all non-missing-auth reasons", () => {
  Math.random = () => 0.99;
  expect(shouldRecordAuthFailure({ reason: "role_not_admin" })).toBe(true);
});
