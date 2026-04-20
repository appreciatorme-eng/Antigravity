import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";

import ItineraryDocument from "@/components/pdf/ItineraryDocument";
import {
  DEFAULT_ITINERARY_BRANDING,
  DEFAULT_ITINERARY_TEMPLATE,
} from "@/components/pdf/itinerary-types";
import { stripRepeatedPdfImages } from "@/components/pdf/templates/sections/shared";
import { apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/observability/logger";
import { enforcePublicRouteRateLimit } from "@/lib/security/public-rate-limit";
import type { ItineraryResult } from "@/types/itinerary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRIP_REQUEST_TOKEN_REGEX = /^[A-Za-z0-9_-]{16,200}$/;
const TRIP_REQUEST_PDF_RATE_LIMIT_MAX = Number(
  process.env.PUBLIC_TRIP_REQUEST_PDF_RATE_LIMIT_MAX || "20",
);
const TRIP_REQUEST_PDF_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_TRIP_REQUEST_PDF_RATE_LIMIT_WINDOW_MS || 60_000,
);

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]+/g, "_");
}

function normalizeItinerary(record: {
  raw_data: unknown;
  trip_title: string | null;
  destination: string | null;
  duration_days: number | null;
  summary: string | null;
}): ItineraryResult {
  const raw = (record.raw_data && typeof record.raw_data === "object" ? record.raw_data : {}) as Partial<ItineraryResult>;
  return {
    ...raw,
    trip_title: raw.trip_title || record.trip_title || "Trip Itinerary",
    destination: raw.destination || record.destination || "Destination",
    duration_days: raw.duration_days || record.duration_days || raw.days?.length || 1,
    summary: raw.summary || record.summary || "Detailed itinerary enclosed.",
    days: Array.isArray(raw.days) ? raw.days : [],
  } as ItineraryResult;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!TRIP_REQUEST_TOKEN_REGEX.test(token)) {
    return apiError("Invalid trip request token", 400);
  }

  const rateLimitResponse = await enforcePublicRouteRateLimit(request, {
    identifier: `${token}:pdf`,
    limit: TRIP_REQUEST_PDF_RATE_LIMIT_MAX,
    windowMs: TRIP_REQUEST_PDF_RATE_LIMIT_WINDOW_MS,
    prefix: "public:trip-request:pdf",
    message: "Too many PDF requests. Please try again later.",
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const admin = createAdminClient();

  const { data: draft, error: draftError } = await admin
    .from("assistant_trip_requests")
    .select("organization_id, client_name, created_itinerary_id, status")
    .eq("form_token", token)
    .maybeSingle();

  if (draftError || !draft || draft.status !== "completed" || !draft.created_itinerary_id) {
    return apiError("Trip request PDF not found", 404);
  }

  const { data: itinerary, error: itineraryError } = await admin
    .from("itineraries")
    .select("raw_data, trip_title, destination, duration_days, summary")
    .eq("id", draft.created_itinerary_id)
    .maybeSingle();

  if (itineraryError || !itinerary) {
    return apiError("Itinerary not found", 404);
  }

  const { data: organization } = await admin
    .from("organizations")
    .select("name, logo_url, primary_color")
    .eq("id", draft.organization_id)
    .maybeSingle();

  try {
    const normalizedItinerary = stripRepeatedPdfImages(
      normalizeItinerary(itinerary as {
        raw_data: unknown;
        trip_title: string | null;
        destination: string | null;
        duration_days: number | null;
        summary: string | null;
      }),
    );

    const document = React.createElement(ItineraryDocument, {
      data: normalizedItinerary,
      template: DEFAULT_ITINERARY_TEMPLATE,
      branding: {
        ...DEFAULT_ITINERARY_BRANDING,
        companyName: organization?.name || DEFAULT_ITINERARY_BRANDING.companyName,
        logoUrl: organization?.logo_url || null,
        primaryColor: organization?.primary_color || DEFAULT_ITINERARY_BRANDING.primaryColor,
        clientName: draft.client_name || null,
      },
    }) as React.ReactElement<DocumentProps>;

    const stream = await renderToStream(document);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const fileName = `${sanitizeFileName(normalizedItinerary.trip_title || "trip-itinerary")}.pdf`;
    return new NextResponse(new Uint8Array(Buffer.concat(chunks)), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    logError("[trip-request] failed to render PDF", error, { token });
    return apiError("Failed to render itinerary PDF", 500);
  }
}
