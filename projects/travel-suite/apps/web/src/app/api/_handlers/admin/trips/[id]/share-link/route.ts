import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";
import type { Json } from "@/lib/database.types";
import { resolveSharePaymentContext } from "@/lib/share/admin-share";
import { normalizeSharePaymentConfig } from "@/lib/share/payment-config";

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

async function findLinkedProposalShare(
  adminClient: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  tripId: string,
  organizationId: string,
) {
  const { data } = await adminClient
    .from("proposals")
    .select("share_token")
    .eq("trip_id", tripId)
    .eq("organization_id", organizationId)
    .not("share_token", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.share_token ?? null;
}

/** Find or create a share link for the given itinerary. */
async function findOrCreateShareLink(
  adminClient: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  itineraryId: string,
  options: {
    templateId?: string;
    expiresAt?: string;
    paymentConfig?: ReturnType<typeof normalizeSharePaymentConfig> | undefined;
  } = {},
) {
  // Check if a shared_itineraries row already exists
  const { data: existing } = await adminClient
    .from("shared_itineraries")
    .select("share_code, id")
    .eq("itinerary_id", itineraryId)
    .maybeSingle();

  if (existing?.share_code) {
    const updates: Record<string, unknown> = {};
    if (options.templateId) {
      updates.template_id = options.templateId;
    }
    if (options.expiresAt) {
      updates.expires_at = options.expiresAt;
    }
    if (options.paymentConfig !== undefined) {
      updates.payment_config = (options.paymentConfig || null) as unknown as Json;
    }

    if (Object.keys(updates).length > 0) {
      await adminClient
        .from("shared_itineraries")
        .update(updates)
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
      payment_config: (options.paymentConfig || null) as unknown as Json,
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
  const linkedProposalShareToken = await findLinkedProposalShare(adminClient, tripId, organizationId!);

  const itineraryId = await resolveItineraryId(adminClient, tripId, organizationId!);
  if (!itineraryId) {
    return apiError("Trip has no itinerary", 404);
  }
  const paymentContext = await resolveSharePaymentContext({
    adminClient,
    itineraryId,
    tripId,
  });

  const { shareCode, error } = await findOrCreateShareLink(adminClient, itineraryId);
  if (error || !shareCode) {
    logError("Failed to create share link (GET)", error);
    return apiError("Failed to create share link", 500);
  }

  return apiSuccess({
    shareUrl: `https://tripbuilt.com/share/${shareCode}`,
    previewUrl: `https://tripbuilt.com/share/${shareCode}`,
    portalUrl: linkedProposalShareToken
      ? `https://tripbuilt.com/portal/${linkedProposalShareToken}`
      : null,
    paymentEligible: paymentContext.paymentEligible,
    paymentDisabledReason: paymentContext.paymentDisabledReason,
    paymentDefaults: paymentContext.paymentDefaults,
    paymentConfig: paymentContext.existingPaymentConfig,
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
  const linkedProposalShareToken = await findLinkedProposalShare(adminClient, tripId, organizationId!);

  const itineraryId = await resolveItineraryId(adminClient, tripId, organizationId!);
  if (!itineraryId) {
    return apiError("Trip has no itinerary", 404);
  }

  let templateId: string | undefined;
  let expiresAt: string | undefined;
  let paymentConfig: ReturnType<typeof normalizeSharePaymentConfig> | undefined;
  try {
    const body = await request.json();
    templateId = typeof body.templateId === "string" ? body.templateId : undefined;
    expiresAt = typeof body.expiresAt === "string" ? body.expiresAt : undefined;
    if (Object.prototype.hasOwnProperty.call(body, "paymentConfig")) {
      paymentConfig = normalizeSharePaymentConfig(body.paymentConfig ?? null);
    }
  } catch {
    // Body is optional for POST — defaults are fine
  }

  const paymentContext = await resolveSharePaymentContext({
    adminClient,
    itineraryId,
    tripId,
  });

  const { shareCode, error } = await findOrCreateShareLink(adminClient, itineraryId, {
    templateId,
    expiresAt,
    paymentConfig,
  });
  if (error || !shareCode) {
    logError("Failed to create share link (POST)", error);
    return apiError("Failed to create share link", 500);
  }

  return apiSuccess({
    shareCode,
    shareUrl: `https://tripbuilt.com/share/${shareCode}`,
    previewUrl: `https://tripbuilt.com/share/${shareCode}`,
    portalUrl: linkedProposalShareToken
      ? `https://tripbuilt.com/portal/${linkedProposalShareToken}`
      : null,
    paymentEligible: paymentContext.paymentEligible,
    paymentDisabledReason: paymentContext.paymentDisabledReason,
    paymentDefaults: paymentContext.paymentDefaults,
    paymentConfig: paymentConfig === undefined ? paymentContext.existingPaymentConfig : paymentConfig,
  });
}
