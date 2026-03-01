import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  normalizeBearerToken,
  parseRole,
  shouldRecordAuthFailure,
} from "../../../src/lib/auth/admin-helpers";

const originalMathRandom = Math.random;

afterEach(() => {
  Math.random = originalMathRandom;
});

test("normalizeBearerToken returns token for valid bearer auth header", () => {
  const token = normalizeBearerToken("Bearer abc-123");
  assert.equal(token, "abc-123");
});

test("normalizeBearerToken rejects malformed headers", () => {
  assert.equal(normalizeBearerToken(null), null);
  assert.equal(normalizeBearerToken("Basic abc"), null);
  assert.equal(normalizeBearerToken("Bearer   "), null);
});

test("parseRole only accepts admin and super_admin roles", () => {
  assert.equal(parseRole("admin"), "admin");
  assert.equal(parseRole("SUPER_ADMIN"), "super_admin");
  assert.equal(parseRole("user"), null);
  assert.equal(parseRole(null), null);
});

test("shouldRecordAuthFailure always records for identified users", () => {
  Math.random = () => 0.99;
  assert.equal(
    shouldRecordAuthFailure({
      userId: "00000000-0000-0000-0000-000000000001",
      reason: "missing_or_invalid_auth",
    }),
    true
  );
});

test("shouldRecordAuthFailure samples anonymous missing-auth events", () => {
  Math.random = () => 0.19;
  assert.equal(
    shouldRecordAuthFailure({ reason: "missing_or_invalid_auth" }),
    true
  );

  Math.random = () => 0.21;
  assert.equal(
    shouldRecordAuthFailure({ reason: "missing_or_invalid_auth" }),
    false
  );
});

test("shouldRecordAuthFailure records all non-missing-auth reasons", () => {
  Math.random = () => 0.99;
  assert.equal(
    shouldRecordAuthFailure({ reason: "role_not_admin" }),
    true
  );
});
