import { NextRequest, NextResponse } from "next/server";

import { apiError, apiSuccess } from "@/lib/api/response";
import { enforcePublicRouteRateLimit } from "@/lib/security/public-rate-limit";
import { logError } from "@/lib/observability/logger";
import { scheduleBackgroundTask } from "@/lib/server/background";
import {
  completeSubmittedTripRequestForm,
  loadTripRequestFormState,
  submitTripRequestForm,
  type TripRequestSubmitterRole,
} from "@/lib/whatsapp/trip-intake.server";

const TRIP_REQUEST_TOKEN_REGEX = /^[A-Za-z0-9_-]{16,200}$/;
const TRIP_REQUEST_READ_RATE_LIMIT_MAX = Number(
  process.env.PUBLIC_TRIP_REQUEST_READ_RATE_LIMIT_MAX || "30",
);
const TRIP_REQUEST_READ_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_TRIP_REQUEST_READ_RATE_LIMIT_WINDOW_MS || 60_000,
);
const TRIP_REQUEST_WRITE_RATE_LIMIT_MAX = Number(
  process.env.PUBLIC_TRIP_REQUEST_WRITE_RATE_LIMIT_MAX || "12",
);
const TRIP_REQUEST_WRITE_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_TRIP_REQUEST_WRITE_RATE_LIMIT_WINDOW_MS || 60_000,
);

function parsePositiveInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseInterests(value: FormDataEntryValue | null): readonly string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function parseSubmitterRole(value: string | null | undefined): TripRequestSubmitterRole | null {
  if (value === "operator" || value === "client" || value === "other") {
    return value;
  }
  return null;
}

async function enforceReadRateLimit(request: Request, token: string) {
  return enforcePublicRouteRateLimit(request, {
    identifier: `${token}:read`,
    limit: TRIP_REQUEST_READ_RATE_LIMIT_MAX,
    windowMs: TRIP_REQUEST_READ_RATE_LIMIT_WINDOW_MS,
    prefix: "public:trip-request:read",
    message: "Too many trip form requests. Please try again later.",
  });
}

async function enforceWriteRateLimit(request: Request, token: string) {
  return enforcePublicRouteRateLimit(request, {
    identifier: `${token}:write`,
    limit: TRIP_REQUEST_WRITE_RATE_LIMIT_MAX,
    windowMs: TRIP_REQUEST_WRITE_RATE_LIMIT_WINDOW_MS,
    prefix: "public:trip-request:write",
    message: "Too many trip form submissions. Please wait and try again.",
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!TRIP_REQUEST_TOKEN_REGEX.test(token)) {
    return apiError("Invalid trip request token", 400);
  }

  const rateLimitResponse = await enforceReadRateLimit(request, token);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const state = await loadTripRequestFormState(token);
  if (!state) {
    return apiError("Trip request not found", 404);
  }

  const response = apiSuccess(state);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!TRIP_REQUEST_TOKEN_REGEX.test(token)) {
    return apiError("Invalid trip request token", 400);
  }

  const rateLimitResponse = await enforceWriteRateLimit(request, token);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const isJsonRequest = request.headers.get("content-type")?.includes("application/json") ?? false;

  if (isJsonRequest) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return apiError("Invalid trip request payload", 400);
    }

    const durationDays = Number(body.duration_days);
    const travelerCount = Number(body.traveler_count);
    const result = await submitTripRequestForm(token, {
      destination: typeof body.destination === "string" ? body.destination : "",
      durationDays,
      clientName: typeof body.client_name === "string" ? body.client_name : "",
      clientEmail: typeof body.client_email === "string" ? body.client_email : null,
      clientPhone: typeof body.client_phone === "string" ? body.client_phone : null,
      travelerCount,
      startDate: typeof body.start_date === "string" ? body.start_date : "",
      endDate: typeof body.end_date === "string" ? body.end_date : "",
      budget: typeof body.budget === "string" ? body.budget : null,
      hotelPreference: typeof body.hotel_preference === "string" ? body.hotel_preference : null,
      interests: Array.isArray(body.interests)
        ? body.interests.filter((item): item is string => typeof item === "string").slice(0, 12)
        : [],
      originCity: typeof body.origin_city === "string" ? body.origin_city : null,
      submittedBy: typeof body.submitted_by === "string" ? body.submitted_by : null,
      submitterRole: parseSubmitterRole(
        typeof body.submitter_role === "string" ? body.submitter_role : null,
      ),
    }, { deferFinalization: true });

    if (!result.success) {
      return apiError(result.message, 400, result.state ? { state: result.state } : undefined);
    }

    scheduleBackgroundTask(async () => {
      const completion = await completeSubmittedTripRequestForm(token);
      if (!completion.success) {
        logError("[trip-request] background completion failed", new Error(completion.message), {
          token,
        });
      }
    });

    return apiSuccess({
      message: result.message,
      state: result.state ?? null,
    });
  }

  const redirectUrl = new URL(`/trip-request/${token}`, request.url);

  try {
    const formData = await request.formData();
    const durationDays = parsePositiveInteger(formData.get("duration_days"));
    const travelerCount = parsePositiveInteger(formData.get("traveler_count"));

    if (!durationDays || !travelerCount) {
      redirectUrl.searchParams.set("error", "Duration and traveler count are required.");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const result = await submitTripRequestForm(token, {
      destination: typeof formData.get("destination") === "string" ? (formData.get("destination") as string) : "",
      durationDays,
      clientName: typeof formData.get("client_name") === "string" ? (formData.get("client_name") as string) : "",
      clientEmail: parseOptionalText(formData.get("client_email")),
      clientPhone: parseOptionalText(formData.get("client_phone")),
      travelerCount,
      startDate: typeof formData.get("start_date") === "string" ? (formData.get("start_date") as string) : "",
      endDate: typeof formData.get("end_date") === "string" ? (formData.get("end_date") as string) : "",
      budget: parseOptionalText(formData.get("budget")),
      hotelPreference: parseOptionalText(formData.get("hotel_preference")),
      interests: parseInterests(formData.get("interests")),
      originCity: parseOptionalText(formData.get("origin_city")),
      submittedBy: parseOptionalText(formData.get("submitted_by")),
      submitterRole: parseSubmitterRole(parseOptionalText(formData.get("submitter_role"))),
    }, { deferFinalization: true });

    if (!result.success) {
      redirectUrl.searchParams.set("error", result.message);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    scheduleBackgroundTask(async () => {
      const completion = await completeSubmittedTripRequestForm(token);
      if (!completion.success) {
        logError("[trip-request] background completion failed", new Error(completion.message), {
          token,
        });
      }
    });

    redirectUrl.searchParams.set("submitted", "1");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    redirectUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Failed to submit the trip request form.",
    );
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}
