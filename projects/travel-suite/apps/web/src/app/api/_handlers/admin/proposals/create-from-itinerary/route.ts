import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getFeatureLimitStatus } from "@/lib/subscriptions/limits";
import type { Database } from "@/lib/database.types";
import { apiError, apiSuccess } from "@/lib/api/response";
import { captureServerAnalyticsEvent } from "@/lib/analytics/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const CreateFromItinerarySchema = z.object({
  itineraryId: z.string().uuid(),
  clientId: z.string().uuid(),
  proposalTitle: z.string().trim().min(1).max(160).optional(),
  expirationDays: z.coerce.number().int().min(0).max(365).default(14),
  selectedVehicleId: z.string().uuid().optional().nullable(),
  selectedAddOnIds: z.array(z.string().uuid()).default([]),
});

type ActiveAddOn = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  price: number | null;
};

interface RawDay {
  theme?: string;
  summary?: string;
  activities?: RawActivity[];
}

interface RawActivity {
  time?: string;
  title?: string;
  description?: string;
  location?: string;
  image?: string;
  cost?: string;
}

function parseCostToNumber(cost: string | undefined): number {
  if (!cost) return 0;
  const cleaned = cost.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:proposals:create-from-itinerary",
    });
    if (!rateLimit.success) {
      return apiError("Too many proposal creation requests. Please retry later.", 429);
    }

    if (!admin.organizationId) {
      return apiError("Admin organization not configured", 400);
    }

    const body = await req.json();
    const parsed = CreateFromItinerarySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid payload", 400, {
        details: parsed.error.flatten(),
      });
    }

    const {
      itineraryId,
      clientId,
      proposalTitle,
      expirationDays,
      selectedVehicleId,
      selectedAddOnIds,
    } = parsed.data;

    // 1. Load itinerary
    const { data: itinerary, error: itinError } = await admin.adminClient
      .from("itineraries")
      .select("id, trip_title, destination, duration_days, budget, raw_data, user_id")
      .eq("id", itineraryId)
      .maybeSingle();

    if (itinError || !itinerary) {
      return apiError("Itinerary not found", 404);
    }

    // 2. Verify client belongs to org
    const { data: clientProfile } = await admin.adminClient
      .from("profiles")
      .select("organization_id")
      .eq("id", clientId)
      .maybeSingle();

    if (!clientProfile || clientProfile.organization_id !== admin.organizationId) {
      return apiError("Client not found in your organization", 404);
    }

    // 3. Check proposal feature limits
    const proposalLimitStatus = await getFeatureLimitStatus(
      admin.adminClient,
      admin.organizationId,
      "proposals"
    );

    if (!proposalLimitStatus.allowed) {
      return apiError(
        `You've reached your ${proposalLimitStatus.limit} ${proposalLimitStatus.label} on the ${proposalLimitStatus.tier} plan.`,
        402,
        {
          code: "FEATURE_LIMIT_EXCEEDED",
          feature: proposalLimitStatus.feature,
          tier: proposalLimitStatus.tier,
          used: proposalLimitStatus.used,
          limit: proposalLimitStatus.limit,
          remaining: proposalLimitStatus.remaining,
          reset_at: proposalLimitStatus.resetAt,
          upgrade_plan: proposalLimitStatus.upgradePlan,
          billing_path: "/admin/billing",
        }
      );
    }

    // 4. Auto-create tour_template from itinerary
    const { data: template, error: templateError } = await admin.adminClient
      .from("tour_templates")
      .insert({
        name: itinerary.trip_title || "Untitled Itinerary",
        destination: itinerary.destination || null,
        duration_days: itinerary.duration_days || null,
        base_price: 0,
        organization_id: admin.organizationId,
        created_by: admin.userId,
        status: "active",
      })
      .select("id")
      .single();

    if (templateError || !template) {
      return apiError(safeErrorMessage(templateError, "Failed to create template from itinerary"), 500);
    }

    const templateId = template.id;

    // 5. Parse raw_data.days and insert template_days + template_activities
    const rawData = itinerary.raw_data as { days?: RawDay[] } | null;
    const days: RawDay[] = Array.isArray(rawData?.days) ? rawData.days : [];

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const { data: templateDay, error: dayError } = await admin.adminClient
        .from("template_days")
        .insert({
          template_id: templateId,
          day_number: i + 1,
          title: day.theme || `Day ${i + 1}`,
          description: day.summary || null,
        })
        .select("id")
        .single();

      if (dayError || !templateDay) continue;

      const activities: RawActivity[] = Array.isArray(day.activities) ? day.activities : [];
      if (activities.length > 0) {
        const activityRows = activities.map((act, idx) => ({
          template_day_id: templateDay.id,
          time: act.time || null,
          title: act.title || `Activity ${idx + 1}`,
          description: act.description || null,
          location: act.location || null,
          image_url: act.image || null,
          price: parseCostToNumber(act.cost),
          display_order: idx + 1,
        }));

        await admin.adminClient
          .from("template_activities")
          .insert(activityRows);
      }
    }

    // 6. Clone template to proposal via RPC
    const { data: proposalId, error: cloneError } = await admin.adminClient.rpc(
      "clone_template_to_proposal",
      {
        p_template_id: templateId,
        p_client_id: clientId,
        p_created_by: admin.userId,
      }
    );

    if (cloneError || !proposalId) {
      return apiError(safeErrorMessage(cloneError, "Failed to create proposal"), 400);
    }

    // 7. Handle add-ons (same pattern as proposals/create)
    const { data: activeAddOns, error: activeAddOnsError } = await admin.adminClient
      .from("add_ons")
      .select("id, name, description, category, image_url, price")
      .eq("organization_id", admin.organizationId)
      .eq("is_active", true);
    if (activeAddOnsError) {
      return apiError(safeErrorMessage(activeAddOnsError, "Failed to load add-ons"), 500);
    }

    const addOns = (activeAddOns || []) as ActiveAddOn[];
    const transportAddOns = addOns.filter((a) => a.category === "Transport");
    const defaultVehicleId = selectedVehicleId || transportAddOns[0]?.id || null;

    const selectedIds = new Set<string>(selectedAddOnIds);
    if (defaultVehicleId) {
      selectedIds.add(defaultVehicleId);
    }

    const addOnRows: Array<{ addOn: ActiveAddOn; selected: boolean }> = [];

    for (const vehicle of transportAddOns) {
      addOnRows.push({
        addOn: vehicle,
        selected: vehicle.id === defaultVehicleId,
      });
    }

    for (const addOn of addOns) {
      if (addOn.category === "Transport") continue;
      if (!selectedIds.has(addOn.id)) continue;
      addOnRows.push({
        addOn,
        selected: true,
      });
    }

    if (addOnRows.length > 0) {
      const insertPayload: Database["public"]["Tables"]["proposal_add_ons"]["Insert"][] = addOnRows.map(({ addOn, selected }) => ({
        proposal_id: proposalId,
        add_on_id: addOn.id,
        name: addOn.name,
        description: addOn.description || null,
        category: addOn.category || "General",
        image_url: addOn.image_url || null,
        unit_price: Number(addOn.price || 0),
        quantity: 1,
        is_selected: selected,
      }));

      const { error: addOnInsertError } = await admin.adminClient.from("proposal_add_ons").insert(insertPayload);
      if (addOnInsertError && addOnInsertError.code !== "42P01") {
        return apiError(safeErrorMessage(addOnInsertError, "Failed to attach add-ons"), 500);
      }
    }

    // 8. Calculate proposal price
    const { data: newPrice, error: newPriceError } = await admin.adminClient.rpc("calculate_proposal_price", {
      p_proposal_id: proposalId,
    });
    if (newPriceError) {
      return apiError(safeErrorMessage(newPriceError, "Failed to calculate proposal price"), 500);
    }

    if (newPrice !== null && newPrice !== undefined) {
      const { error: priceUpdateError } = await admin.adminClient
        .from("proposals")
        .update({ client_selected_price: newPrice })
        .eq("id", proposalId);
      if (priceUpdateError) {
        return apiError(safeErrorMessage(priceUpdateError, "Failed to update proposal price"), 500);
      }
    }

    // 9. Update proposal with title and expiration
    const proposalUpdates: Record<string, unknown> = {};
    if (proposalTitle) {
      proposalUpdates.title = proposalTitle;
    }

    if (expirationDays > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      proposalUpdates.expires_at = expirationDate.toISOString();
    }

    if (Object.keys(proposalUpdates).length > 0) {
      const { error: proposalUpdateError } = await admin.adminClient
        .from("proposals")
        .update(proposalUpdates)
        .eq("id", proposalId);
      if (proposalUpdateError) {
        return apiError(safeErrorMessage(proposalUpdateError, "Failed to update proposal details"), 500);
      }
    }

    // 10. Refresh limits and respond
    const refreshedLimitStatus = await getFeatureLimitStatus(
      admin.adminClient,
      admin.organizationId,
      "proposals"
    );

    void captureServerAnalyticsEvent({
      event: "proposal_created",
      distinctId: admin.userId,
      properties: {
        proposal_id: proposalId,
        organization_id: admin.organizationId,
        amount: Number(newPrice || 0),
        source: "itinerary",
        itinerary_id: itineraryId,
      },
    });

    return apiSuccess({
      proposalId,
      amount: Number(newPrice || 0),
      limit: refreshedLimitStatus,
    });
  } catch (error) {
    logError("Error in POST /api/admin/proposals/create-from-itinerary", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
