import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request, { requireOrganization: true });
  if (!auth.ok) return auth.response;

  const { organizationId, adminClient } = auth;
  const { id: tripId } = await params;

  // Get the trip's itinerary_id
  const { data: trip } = await adminClient
    .from("trips")
    .select("itinerary_id")
    .eq("id", tripId)
    .eq("organization_id", organizationId!)
    .maybeSingle();

  if (!trip?.itinerary_id) {
    return apiError("Trip has no itinerary", 404);
  }

  // Check if a shared_itineraries row already exists
  const { data: existing } = await adminClient
    .from("shared_itineraries")
    .select("share_code")
    .eq("itinerary_id", trip.itinerary_id)
    .maybeSingle();

  if (existing?.share_code) {
    return apiSuccess({
      shareUrl: `https://tripbuilt.com/share/${existing.share_code}`,
    });
  }

  // Create a new shared itinerary
  const shareCode = randomUUID().replace(/-/g, "").slice(0, 16);
  const { error: insertError } = await adminClient
    .from("shared_itineraries")
    .insert({
      itinerary_id: trip.itinerary_id,
      share_code: shareCode,
      status: "active",
    });

  if (insertError) {
    return apiError("Failed to create share link", 500);
  }

  return apiSuccess({
    shareUrl: `https://tripbuilt.com/share/${shareCode}`,
  });
}
