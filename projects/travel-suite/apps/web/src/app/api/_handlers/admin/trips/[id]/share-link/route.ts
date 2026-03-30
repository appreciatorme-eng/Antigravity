import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";

/** Resolve the itinerary_id for a trip, scoped to the admin's org. */
async function resolveItineraryId(
  adminClient: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  tripId: string,
  organizationId: string,
) {
  const { data: trip } = await adminClient
    .from("trips")
    .select("itinerary_id")
    .eq("id", tripId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  return trip?.itinerary_id ?? null;
}

/** Find or create a share link for the given itinerary. */
async function findOrCreateShareLink(
  adminClient: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  itineraryId: string,
  options: { templateId?: string; expiresAt?: string } = {},
) {
  // Check if a shared_itineraries row already exists
  const { data: existing } = await adminClient
    .from("shared_itineraries")
    .select("share_code, id")
    .eq("itinerary_id", itineraryId)
    .maybeSingle();

  if (existing?.share_code) {
    // If a template was requested, update it on the existing row
    if (options.templateId) {
      await adminClient
        .from("shared_itineraries")
        .update({ template_id: options.templateId })
        .eq("id", existing.id);
    }
    return { shareCode: existing.share_code, error: null };
  }

  // Create a new shared itinerary
  const shareCode = randomUUID().replace(/-/g, "").slice(0, 16);
  const { error: insertError } = await adminClient
    .from("shared_itineraries")
    .insert({
      itinerary_id: itineraryId,
      share_code: shareCode,
      status: "active",
      ...(options.templateId ? { template_id: options.templateId } : {}),
      ...(options.expiresAt ? { expires_at: options.expiresAt } : {}),
    });

  if (insertError) {
    return { shareCode: null, error: insertError };
  }

  return { shareCode, error: null };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request, { requireOrganization: true });
  if (!auth.ok) return auth.response;

  const { organizationId, adminClient } = auth;
  const { id: tripId } = await params;

  const itineraryId = await resolveItineraryId(adminClient, tripId, organizationId!);
  if (!itineraryId) {
    return apiError("Trip has no itinerary", 404);
  }

  const { shareCode, error } = await findOrCreateShareLink(adminClient, itineraryId);
  if (error || !shareCode) {
    logError("Failed to create share link (GET)", error);
    return apiError("Failed to create share link", 500);
  }

  return apiSuccess({
    shareUrl: `https://tripbuilt.com/share/${shareCode}`,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request, { requireOrganization: true });
  if (!auth.ok) return auth.response;

  const { organizationId, adminClient } = auth;
  const { id: tripId } = await params;

  const itineraryId = await resolveItineraryId(adminClient, tripId, organizationId!);
  if (!itineraryId) {
    return apiError("Trip has no itinerary", 404);
  }

  let templateId: string | undefined;
  let expiresAt: string | undefined;
  try {
    const body = await request.json();
    templateId = typeof body.templateId === "string" ? body.templateId : undefined;
    expiresAt = typeof body.expiresAt === "string" ? body.expiresAt : undefined;
  } catch {
    // Body is optional for POST — defaults are fine
  }

  const { shareCode, error } = await findOrCreateShareLink(adminClient, itineraryId, {
    templateId,
    expiresAt,
  });
  if (error || !shareCode) {
    logError("Failed to create share link (POST)", error);
    return apiError("Failed to create share link", 500);
  }

  return apiSuccess({
    shareCode,
    shareUrl: `https://tripbuilt.com/share/${shareCode}`,
  });
}
