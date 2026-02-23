import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getFeatureLimitStatus } from "@/lib/subscriptions/limits";

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
  return NextResponse.json(
    {
      error: `You've reached your ${limitStatus.limit} ${limitStatus.label} on the ${limitStatus.tier} plan.`,
      code: "FEATURE_LIMIT_EXCEEDED",
      feature: limitStatus.feature,
      tier: limitStatus.tier,
      used: limitStatus.used,
      limit: limitStatus.limit,
      remaining: limitStatus.remaining,
      reset_at: limitStatus.resetAt,
      upgrade_plan: limitStatus.upgradePlan,
      billing_path: "/admin/billing",
    },
    { status: 402 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    if (!admin.organizationId) {
      return NextResponse.json(
        { error: "Admin organization not configured" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = ProposalCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid proposal create payload", details: parsed.error.flatten() },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Template not found in your organization" },
        { status: 404 }
      );
    }

    const { data: clientProfile } = await admin.adminClient
      .from("profiles")
      .select("organization_id")
      .eq("id", clientId)
      .maybeSingle();

    if (!clientProfile || clientProfile.organization_id !== admin.organizationId) {
      return NextResponse.json(
        { error: "Client not found in your organization" },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: cloneError?.message || "Failed to create proposal" },
        { status: 400 }
      );
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
      const insertPayload = addOnRows.map(({ addOn, selected }) => ({
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.adminClient as any).from("proposal_add_ons").insert(insertPayload);
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

    return NextResponse.json({
      success: true,
      proposalId,
      limit: refreshedLimitStatus,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/proposals/create:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create proposal" },
      { status: 500 }
    );
  }
}
