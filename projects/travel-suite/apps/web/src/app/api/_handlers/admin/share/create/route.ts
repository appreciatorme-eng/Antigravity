import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";
import { populateItineraryImages } from "@/lib/image-search";
import type { Json } from "@/lib/database.types";

/**
 * POST /api/admin/share/create
 *
 * Creates (or returns existing) share link for an itinerary.
 * Optionally auto-saves an unsaved itinerary first.
 *
 * Body:
 *   - itineraryId?: string          — existing itinerary ID
 *   - rawItineraryData?: object     — if no itineraryId, auto-save this itinerary first
 *   - templateId?: string           — share template (default: "safari_story")
 *
 * Returns: { shareCode, shareUrl, itineraryId }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, { requireOrganization: true });
  if (!auth.ok) return auth.response;

  const { userId, organizationId, adminClient } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  let itineraryId = typeof body.itineraryId === "string" ? body.itineraryId : null;
  const rawItineraryData = body.rawItineraryData as Record<string, unknown> | undefined;
  const templateId =
    typeof body.templateId === "string" ? body.templateId : "safari_story";

  // Auto-save unsaved itinerary if needed
  if (!itineraryId && rawItineraryData) {
    const { data: saved, error: saveErr } = await adminClient
      .from("itineraries")
      .insert({
        user_id: userId,
        trip_title: typeof rawItineraryData.trip_title === "string"
          ? rawItineraryData.trip_title
          : "Untitled Trip",
        destination: typeof rawItineraryData.destination === "string"
          ? rawItineraryData.destination
          : "Unknown",
        summary: typeof rawItineraryData.summary === "string"
          ? rawItineraryData.summary
          : null,
        duration_days: typeof rawItineraryData.duration_days === "number"
          ? rawItineraryData.duration_days
          : null,
        raw_data: rawItineraryData as unknown as Json,
      })
      .select("id")
      .single();

    if (saveErr || !saved) {
      logError("Failed to auto-save itinerary for share", saveErr);
      return apiError("Failed to save itinerary", 500);
    }

    itineraryId = saved.id;

    // Also create a trip record so it appears on the Trips page
    try {
      await adminClient.from("trips").insert({
        itinerary_id: itineraryId,
        client_id: userId,
        organization_id: organizationId,
        status: "draft",
        destination: typeof rawItineraryData.destination === "string"
          ? rawItineraryData.destination
          : null,
      });
    } catch (tripErr) {
      // Non-critical: trip creation can fail gracefully
      logError("Trip record creation failed during share", tripErr);
    }
  }

  if (!itineraryId) {
    return apiError("Either itineraryId or rawItineraryData is required", 400);
  }

  // Verify the itinerary belongs to this user/org
  const { data: itinerary } = await adminClient
    .from("itineraries")
    .select("id, user_id, raw_data, destination")
    .eq("id", itineraryId)
    .maybeSingle();

  if (!itinerary) {
    return apiError("Itinerary not found", 404);
  }

  // Backfill images if raw_data has activities without images
  const rawData = itinerary.raw_data as {
    destination?: string;
    days?: Array<{ activities?: Array<{ image?: string; imageUrl?: string; title: string }> }>;
  } | null;
  if (rawData?.days) {
    const hasImages = rawData.days.some((day) =>
      (day.activities ?? []).some((a) => !!a.image || !!a.imageUrl)
    );
    if (!hasImages) {
      try {
        const withImages = await populateItineraryImages({
          destination: rawData.destination ?? itinerary.destination ?? "travel",
          days: rawData.days.map((d) => ({
            ...d,
            activities: (d.activities ?? []).map((a) => ({ ...a, title: a.title ?? "Activity" })),
          })),
        });
        const updatedRawData = { ...rawData, days: withImages.days };
        await adminClient
          .from("itineraries")
          .update({ raw_data: updatedRawData as unknown as Json })
          .eq("id", itineraryId);
      } catch (imgErr) {
        logError("Image backfill failed during share creation", imgErr);
      }
    }
  }

  // Check for existing share link
  const { data: existing } = await adminClient
    .from("shared_itineraries")
    .select("id, share_code")
    .eq("itinerary_id", itineraryId)
    .maybeSingle();

  if (existing?.share_code) {
    // Update template on existing row
    await adminClient
      .from("shared_itineraries")
      .update({ template_id: templateId })
      .eq("id", existing.id);

    return apiSuccess({
      shareCode: existing.share_code,
      shareUrl: `https://tripbuilt.com/share/${existing.share_code}`,
      itineraryId,
    });
  }

  // Create new share link
  const shareCode = randomUUID().replace(/-/g, "").slice(0, 16);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error: insertError } = await adminClient
    .from("shared_itineraries")
    .insert({
      itinerary_id: itineraryId,
      share_code: shareCode,
      status: "active",
      template_id: templateId,
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    logError("Failed to create share link", insertError);
    return apiError("Failed to create share link", 500);
  }

  return apiSuccess({
    shareCode,
    shareUrl: `https://tripbuilt.com/share/${shareCode}`,
    itineraryId,
  });
}
