// api-response-advanced.test.ts
// Advanced tests for apiSuccess, apiError, jsonWithRequestId, apiSuccessWithRequestId, apiErrorWithRequestId, setRequestIdHeader

import { describe, expect, it } from "vitest";
import {
  apiSuccess,
  apiError,
  apiSuccessWithRequestId,
  apiErrorWithRequestId,
  jsonWithRequestId,
  setRequestIdHeader,
} from "@/lib/api/response";

describe("apiSuccess", () => {
  it("returns 200 by default when no init is provided", async () => {
    const response = apiSuccess({ items: [1, 2, 3] });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: { items: [1, 2, 3] }, error: null });
  });

  it("returns custom status code when init is provided", async () => {
    const response = apiSuccess({ created: true }, { status: 201 });
    expect(response.status).toBe(201);
  });

  it("wraps null data in the envelope", async () => {
    const response = apiSuccess(null);
    const body = await response.json();
    expect(body).toEqual({ data: null, error: null });
  });

  it("wraps undefined data as null in JSON", async () => {
    const response = apiSuccess(undefined);
    const body = await response.json();
    // undefined becomes null in JSON serialization
    expect(body.error).toBeNull();
  });

  it("wraps empty object data correctly", async () => {
    const response = apiSuccess({});
    const body = await response.json();
    expect(body).toEqual({ data: {}, error: null });
  });

  it("wraps array data correctly", async () => {
    const response = apiSuccess([1, 2, 3]);
    const body = await response.json();
    expect(body).toEqual({ data: [1, 2, 3], error: null });
  });

  it("wraps string data correctly", async () => {
    const response = apiSuccess("hello");
    const body = await response.json();
    expect(body).toEqual({ data: "hello", error: null });
  });

  it("wraps numeric data correctly", async () => {
    const response = apiSuccess(42);
    const body = await response.json();
    expect(body).toEqual({ data: 42, error: null });
  });

  it("wraps boolean data correctly", async () => {
    const response = apiSuccess(true);
    const body = await response.json();
    expect(body).toEqual({ data: true, error: null });
  });

  it("includes nested objects in data", async () => {
    const data = { user: { name: "Alice", roles: ["admin"] } };
    const response = apiSuccess(data);
    const body = await response.json();
    expect(body.data).toEqual(data);
  });
});

describe("apiError", () => {
  it("returns 400 Bad Request", async () => {
    const response = apiError("Bad request", 400);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ data: null, error: "Bad request" });
  });

  it("returns 401 Unauthorized", async () => {
    const response = apiError("Unauthorized", 401);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 Forbidden", async () => {
    const response = apiError("Forbidden", 403);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 Not Found", async () => {
    const response = apiError("Not found", 404);
    expect(response.status).toBe(404);
  });

  it("returns 500 Internal Server Error", async () => {
    const response = apiError("Internal server error", 500);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.data).toBeNull();
  });

  it("accepts ResponseInit object instead of number", async () => {
    const response = apiError("Custom", { status: 418, statusText: "I'm a teapot" });
    expect(response.status).toBe(418);
  });

  it("includes extras in the response body", async () => {
    const response = apiError("Validation failed", 422, {
      code: "VALIDATION_ERROR",
      fields: ["email", "name"],
    });
    const body = await response.json();
    expect(body).toEqual({
      data: null,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      fields: ["email", "name"],
    });
  });

  it("works without extras parameter", async () => {
    const response = apiError("Something went wrong", 500);
    const body = await response.json();
    expect(body).toEqual({ data: null, error: "Something went wrong" });
  });

  it("data is always null in error responses", async () => {
    const response = apiError("Error", 500, { detail: "info" });
    const body = await response.json();
    expect(body.data).toBeNull();
  });
});

describe("jsonWithRequestId", () => {
  it("injects request_id into an object body", async () => {
    const response = jsonWithRequestId({ key: "value" }, "req-abc");
    const body = await response.json();
    expect(body).toEqual({ key: "value", request_id: "req-abc" });
  });

  it("sets the x-request-id header", () => {
    const response = jsonWithRequestId({ ok: true }, "req-xyz");
    expect(response.headers.get("x-request-id")).toBe("req-xyz");
  });

  it("does not inject request_id into non-object body (array)", async () => {
    const response = jsonWithRequestId([1, 2, 3], "req-arr");
    const body = await response.json();
    // Arrays are not plain objects, so request_id is not injected
    expect(body).toEqual([1, 2, 3]);
    // But header is still set
    expect(response.headers.get("x-request-id")).toBe("req-arr");
  });

  it("does not inject request_id into string body", async () => {
    const response = jsonWithRequestId("hello", "req-str");
    const body = await response.json();
    expect(body).toBe("hello");
    expect(response.headers.get("x-request-id")).toBe("req-str");
  });

  it("does not inject request_id into null body", async () => {
    const response = jsonWithRequestId(null, "req-null");
    const body = await response.json();
    expect(body).toBeNull();
    expect(response.headers.get("x-request-id")).toBe("req-null");
  });

  it("applies custom status via init parameter", () => {
    const response = jsonWithRequestId({ ok: true }, "req-201", { status: 201 });
    expect(response.status).toBe(201);
  });

  it("preserves existing fields when injecting request_id", async () => {
    const response = jsonWithRequestId(
      { data: { id: 1 }, error: null },
      "req-preserve"
    );
    const body = await response.json();
    expect(body.data).toEqual({ id: 1 });
    expect(body.error).toBeNull();
    expect(body.request_id).toBe("req-preserve");
  });
});

describe("apiSuccessWithRequestId", () => {
  it("returns success envelope with request_id in body and header", async () => {
    const response = apiSuccessWithRequestId({ name: "Alice" }, "rid-100");
    const body = await response.json();
    expect(body).toEqual({
      data: { name: "Alice" },
      error: null,
      request_id: "rid-100",
    });
    expect(response.headers.get("x-request-id")).toBe("rid-100");
  });

  it("defaults to status 200", () => {
    const response = apiSuccessWithRequestId({}, "rid-200");
    expect(response.status).toBe(200);
  });

  it("accepts custom status init", () => {
    const response = apiSuccessWithRequestId({}, "rid-201", { status: 201 });
    expect(response.status).toBe(201);
  });
});

describe("apiErrorWithRequestId", () => {
  it("returns error envelope with request_id in body and header", async () => {
    const response = apiErrorWithRequestId("Not found", "rid-404", 404);
    const body = await response.json();
    expect(body).toEqual({
      data: null,
      error: "Not found",
      request_id: "rid-404",
    });
    expect(response.headers.get("x-request-id")).toBe("rid-404");
  });

  it("includes extras in error body alongside request_id", async () => {
    const response = apiErrorWithRequestId("Fail", "rid-422", 422, {
      code: "INVALID",
    });
    const body = await response.json();
    expect(body.code).toBe("INVALID");
    expect(body.request_id).toBe("rid-422");
    expect(body.data).toBeNull();
    expect(body.error).toBe("Fail");
  });

  it("accepts ResponseInit object for status", async () => {
    const response = apiErrorWithRequestId("Err", "rid-500", { status: 500 });
    expect(response.status).toBe(500);
    expect(response.headers.get("x-request-id")).toBe("rid-500");
  });
});

describe("setRequestIdHeader", () => {
  it("sets x-request-id header on existing response", () => {
    const original = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const updated = setRequestIdHeader(original, "hdr-abc");
    expect(updated.headers.get("x-request-id")).toBe("hdr-abc");
  });

  it("returns the same response object (mutates in-place)", () => {
    const original = new Response(null, { status: 204 });
    const updated = setRequestIdHeader(original, "hdr-xyz");
    expect(updated).toBe(original);
  });

  it("overwrites previous x-request-id if already set", () => {
    const original = new Response(null);
    original.headers.set("x-request-id", "old-id");
    setRequestIdHeader(original, "new-id");
    expect(original.headers.get("x-request-id")).toBe("new-id");
  });
});
