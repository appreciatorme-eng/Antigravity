import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { apiError } from "@/lib/api/response";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logEvent, logError } from "@/lib/observability/logger";
import { populateItineraryImages } from "@/lib/image-search";

/**
 * POST /api/admin/repopulate-images
 * Re-runs populateItineraryImages on itineraries.
 * ?force=true re-fetches even for itineraries that already have images.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient: supabase, userId } = auth;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    // Fetch itineraries with raw_data
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
        days?: Array<{ activities?: Array<{ image?: string; imageUrl?: string; title: string }> }>;
      } | null;

      if (!rawData?.days) {
        skipped++;
        continue;
      }

      // Skip if already has images (unless force mode)
      if (!force) {
        const hasImages = rawData.days.some((day) =>
          (day.activities ?? []).some((a) => !!a.image)
        );
        if (hasImages) {
          skipped++;
          continue;
        }
      }

      // Re-populate images — clear existing images first if forcing
      try {
        const daysForPopulation = rawData.days.map((day) => ({
          ...day,
          activities: (day.activities ?? []).map((a) => {
            const base = { ...a, title: a.title ?? "Activity" };
            if (force) {
              // Clear existing images so populateItineraryImages re-fetches
              delete base.image;
              delete base.imageUrl;
            }
            return base;
          }),
        }));

        const withImages = await populateItineraryImages({
          destination: rawData.destination ?? itin.destination ?? "travel",
          days: daysForPopulation,
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

    logEvent("info", "Admin repopulate-images completed", { updated, skipped, force });

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      total: (itineraries ?? []).length,
      force,
    });
  } catch (error) {
    return apiError(safeErrorMessage(error), 500);
  }
}
