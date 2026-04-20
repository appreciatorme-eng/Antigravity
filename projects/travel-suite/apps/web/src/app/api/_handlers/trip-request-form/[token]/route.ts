import { NextRequest, NextResponse } from "next/server";

import { submitTripRequestForm } from "@/lib/whatsapp/trip-intake.server";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
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
      destination: typeof formData.get("destination") === "string" ? formData.get("destination") as string : "",
      durationDays,
      clientName: typeof formData.get("client_name") === "string" ? formData.get("client_name") as string : "",
      clientEmail: parseOptionalText(formData.get("client_email")),
      clientPhone: parseOptionalText(formData.get("client_phone")),
      travelerCount,
      startDate: typeof formData.get("start_date") === "string" ? formData.get("start_date") as string : "",
      endDate: typeof formData.get("end_date") === "string" ? formData.get("end_date") as string : "",
      budget: parseOptionalText(formData.get("budget")),
      hotelPreference: parseOptionalText(formData.get("hotel_preference")),
      interests: parseInterests(formData.get("interests")),
      originCity: parseOptionalText(formData.get("origin_city")),
    });

    if (!result.success) {
      redirectUrl.searchParams.set("error", result.message);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

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
