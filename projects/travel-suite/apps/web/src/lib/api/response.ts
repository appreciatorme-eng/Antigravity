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

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data, error: null }, init);
}

export function apiError(
  message: string,
  init: number | ResponseInit,
  extras?: Record<string, unknown>
) {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json(
    {
      data: null,
      error: message,
      ...(extras ?? {}),
    },
    responseInit
  );
}

export function apiSuccessWithRequestId<T>(
  data: T,
  requestId: string,
  init?: ResponseInit
) {
  return jsonWithRequestId({ data, error: null }, requestId, init);
}

export function apiErrorWithRequestId(
  message: string,
  requestId: string,
  init: number | ResponseInit,
  extras?: Record<string, unknown>
) {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return jsonWithRequestId(
    {
      data: null,
      error: message,
      ...(extras ?? {}),
    },
    requestId,
    responseInit
  );
}

export function setRequestIdHeader<T extends Response>(response: T, requestId: string): T {
  response.headers.set("x-request-id", requestId);
  return response;
}
