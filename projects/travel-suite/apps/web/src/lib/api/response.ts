import { NextResponse } from "next/server";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function jsonWithRequestId(body: unknown, requestId: string, init?: ResponseInit) {
  const payload = isObjectRecord(body) ? { ...body, request_id: requestId } : body;
  const response = NextResponse.json(payload, init);
  response.headers.set("x-request-id", requestId);
  return response;
}

export function setRequestIdHeader<T extends Response>(response: T, requestId: string): T {
  response.headers.set("x-request-id", requestId);
  return response;
}
