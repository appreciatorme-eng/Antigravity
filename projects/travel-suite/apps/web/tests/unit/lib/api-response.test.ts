import { expect, it } from "vitest";

import {
  apiError,
  apiErrorWithRequestId,
  apiSuccess,
  apiSuccessWithRequestId,
} from "../../../src/lib/api/response";

it("apiSuccess returns the standard success envelope", async () => {
  const response = apiSuccess({ ok: true }, { status: 201 });
  await expect(response.json()).resolves.toEqual({
    data: { ok: true },
    error: null,
  });
  expect(response.status).toBe(201);
});

it("apiError returns the standard error envelope", async () => {
  const response = apiError("Nope", 422, { code: "INVALID" });
  await expect(response.json()).resolves.toEqual({
    data: null,
    error: "Nope",
    code: "INVALID",
  });
  expect(response.status).toBe(422);
});

it("apiSuccessWithRequestId preserves request metadata", async () => {
  const response = apiSuccessWithRequestId({ ok: true }, "req-123");
  await expect(response.json()).resolves.toEqual({
    data: { ok: true },
    error: null,
    request_id: "req-123",
  });
  expect(response.headers.get("x-request-id")).toBe("req-123");
});

it("apiErrorWithRequestId preserves request metadata", async () => {
  const response = apiErrorWithRequestId("Bad request", "req-456", 400);
  await expect(response.json()).resolves.toEqual({
    data: null,
    error: "Bad request",
    request_id: "req-456",
  });
  expect(response.headers.get("x-request-id")).toBe("req-456");
});
