import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getFeatureLimitStatus } from "@/lib/subscriptions/limits";
import type { Database } from "@/lib/database.types";
import { apiError, apiSuccess } from "@/lib/api/response";
import { captureServerAnalyticsEvent } from "@/lib/analytics/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeErrorMessage } from "@/lib/security/safe-error";

const PROPOSAL_CREATE_RATE_LIMIT_MAX = 20;
const PROPOSAL_CREATE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const ProposalCreateSchema = z.object({
  templateId: z.string().uuid(),
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

function featureLimitExceededResponse(
  limitStatus: Awaited<ReturnType<typeof getFeatureLimitStatus>>
) {
  return apiError(
    `You've reached your ${limitStatus.limit} ${limitStatus.label} on the ${limitStatus.tier} plan.`,
    402,
    {
      code: "FEATURE_LIMIT_EXCEEDED",
      feature: limitStatus.feature,
      tier: limitStatus.tier,
      used: limitStatus.used,
      limit: limitStatus.limit,
      remaining: limitStatus.remaining,
      reset_at: limitStatus.resetAt,
      upgrade_plan: limitStatus.upgradePlan,
      billing_path: "/admin/billing",
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: PROPOSAL_CREATE_RATE_LIMIT_MAX,
      windowMs: PROPOSAL_CREATE_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:proposals:create",
    });
    if (!rateLimit.success) {
      return apiError("Too many proposal creation requests. Please retry later.", 429);
    }

    if (!admin.organizationId) {
      return apiError("Admin organization not configured", 400);
    }

    const body = await req.json();
    const parsed = ProposalCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid proposal create payload", 400, {
        details: parsed.error.flatten(),
      });
    }

    const {
      templateId,
      clientId,
      proposalTitle,
      expirationDays,
      selectedVehicleId,
      selectedAddOnIds,
    } = parsed.data;

    const { data: template } = await admin.adminClient
      .from("tour_templates")
      .select("id, organization_id")
      .eq("id", templateId)
      .maybeSingle();

    if (!template || template.organization_id !== admin.organizationId) {
      return apiError("Template not found in your organization", 404);
    }

    const { data: clientProfile } = await admin.adminClient
      .from("profiles")
      .select("organization_id")
      .eq("id", clientId)
      .maybeSingle();

    if (!clientProfile || clientProfile.organization_id !== admin.organizationId) {
      return apiError("Client not found in your organization", 404);
    }

    const proposalLimitStatus = await getFeatureLimitStatus(
      admin.adminClient,
      admin.organizationId,
      "proposals"
    );

    if (!proposalLimitStatus.allowed) {
      return featureLimitExceededResponse(proposalLimitStatus);
    }

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

    const { data: activeAddOns } = await admin.adminClient
      .from("add_ons")
      .select("id, name, description, category, image_url, price")
      .eq("organization_id", admin.organizationId)
      .eq("is_active", true);

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

      // proposal_add_ons is optional on older DBs. Best-effort insert only.
      await admin.adminClient.from("proposal_add_ons").insert(insertPayload);
    }

    const { data: newPrice } = await admin.adminClient.rpc("calculate_proposal_price", {
      p_proposal_id: proposalId,
    });

    if (newPrice !== null && newPrice !== undefined) {
      await admin.adminClient
        .from("proposals")
        .update({ client_selected_price: newPrice })
        .eq("id", proposalId);
    }

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
      await admin.adminClient.from("proposals").update(proposalUpdates).eq("id", proposalId);
    }

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
      },
    });

    return apiSuccess({
      proposalId,
      amount: Number(newPrice || 0),
      limit: refreshedLimitStatus,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/proposals/create:", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
