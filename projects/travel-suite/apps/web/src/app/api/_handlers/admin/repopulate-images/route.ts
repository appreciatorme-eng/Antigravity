import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { apiError } from "@/lib/api/response";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logEvent, logError } from "@/lib/observability/logger";
import { populateItineraryImages } from "@/lib/image-search";

/**
 * POST /api/admin/repopulate-images
 * Re-runs populateItineraryImages on itineraries that have no activity images in raw_data.
 * One-time fix for itineraries created before image population was added.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient: supabase, userId } = auth;

    // Fetch itineraries with raw_data that may be missing images
    const { data: itineraries, error } = await supabase
      .from("itineraries")
      .select("id, destination, raw_data")
      .eq("user_id", userId)
      .not("raw_data", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return apiError(safeErrorMessage(error, "Failed to fetch itineraries"), 400);
    }

    let updated = 0;
    let skipped = 0;

    for (const itin of itineraries ?? []) {
      const rawData = itin.raw_data as {
        destination?: string;
        days?: Array<{ activities?: Array<{ image?: string; title: string }> }>;
      } | null;

      if (!rawData?.days) {
        skipped++;
        continue;
      }

      // Check if any activity already has an image
      const hasImages = rawData.days.some((day) =>
        (day.activities ?? []).some((a) => !!a.image)
      );

      if (hasImages) {
        skipped++;
        continue;
      }

      // Re-populate images
      try {
        const withImages = await populateItineraryImages({
          destination: rawData.destination ?? itin.destination ?? "travel",
          days: rawData.days.map((day) => ({
            ...day,
            activities: (day.activities ?? []).map((a) => ({
              ...a,
              title: a.title ?? "Activity",
            })),
          })),
        });

        const updatedRawData = { ...rawData, days: withImages.days };

        const { error: updateError } = await supabase
          .from("itineraries")
          .update({ raw_data: updatedRawData })
          .eq("id", itin.id);

        if (updateError) {
          logError(`Failed to update itinerary ${itin.id}`, updateError.message);
        } else {
          updated++;
        }
      } catch (err) {
        logError(`Image re-population failed for ${itin.id}`, err);
      }
    }

    logEvent("info", "Admin repopulate-images completed", { updated, skipped });

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      total: (itineraries ?? []).length,
    });
  } catch (error) {
    return apiError(safeErrorMessage(error), 500);
  }
}
