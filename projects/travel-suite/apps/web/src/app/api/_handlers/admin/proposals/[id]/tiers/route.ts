// Admin: manage 3-tier pricing (Core / Plus / Signature) for a proposal.
// PATCH sets operator-defined prices per tier; GET returns current tier_pricing.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import {
  PROPOSAL_PACKAGE_TIERS,
  parseTierPricing,
  type ProposalPackageTier,
} from "@/lib/proposals/types";
import { safeErrorMessage } from "@/lib/security/safe-error";

const TierPriceSchema = z.number().min(0).max(100_000_000).nullable().optional();

const UpdateTiersSchema = z.object({
  tier_pricing: z
    .object({
      core: TierPriceSchema,
      plus: TierPriceSchema,
      signature: TierPriceSchema,
    })
    .optional(),
  package_tier: z
    .enum(["core", "plus", "signature"])
    .nullable()
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Admin organization not configured", 400);
    }

    const { id: proposalId } = await params;

    const { data: proposal, error } = await admin.adminClient
      .from("proposals")
      .select("id, package_tier, tier_pricing, total_price, client_selected_price")
      .eq("id", proposalId)
      .eq("organization_id", admin.organizationId)
      .maybeSingle();

    if (error || !proposal) {
      return apiError("Proposal not found", 404);
    }

    const tierPricing = parseTierPricing(proposal.tier_pricing);

    return NextResponse.json({
      proposal_id: proposalId,
      package_tier: proposal.package_tier ?? null,
      tier_pricing: tierPricing,
      base_price: proposal.total_price ?? null,
      tiers: PROPOSAL_PACKAGE_TIERS.map((t) => ({
        tier: t,
        price: tierPricing[t] ?? null,
      })),
    });
  } catch (error) {
    console.error("[/api/admin/proposals/[id]/tiers:GET] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Admin organization not configured", 400);
    }

    const { id: proposalId } = await params;

    const body = await request.json().catch(() => ({}));
    const parsed = UpdateTiersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tier_pricing, package_tier } = parsed.data;

    const updates: Record<string, unknown> = {};

    if (tier_pricing !== undefined) {
      const cleaned: Record<string, number | null> = {};
      for (const tier of PROPOSAL_PACKAGE_TIERS) {
        const v = tier_pricing[tier as ProposalPackageTier];
        cleaned[tier] = v === undefined ? null : v;
      }
      updates.tier_pricing = cleaned;
    }

    if (package_tier !== undefined) {
      updates.package_tier = package_tier;
      if (package_tier !== null && tier_pricing) {
        const price = tier_pricing[package_tier];
        if (price !== undefined && price !== null) {
          updates.client_selected_price = price;
        }
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await admin.adminClient
      .from("proposals")
      .update(updates)
      .eq("id", proposalId)
      .eq("organization_id", admin.organizationId)
      .select("id, package_tier, tier_pricing, client_selected_price")
      .maybeSingle();

    if (error) {
      console.error("[/api/admin/proposals/[id]/tiers:PATCH] DB error:", error);
      return apiError(safeErrorMessage(error, "Validation failed"), 400);
    }
    if (!updated) {
      return apiError("Proposal not found", 404);
    }

    return NextResponse.json({
      proposal_id: proposalId,
      package_tier: updated.package_tier ?? null,
      tier_pricing: parseTierPricing(updated.tier_pricing),
      client_selected_price: updated.client_selected_price ?? null,
    });
  } catch (error) {
    console.error("[/api/admin/proposals/[id]/tiers:PATCH] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
