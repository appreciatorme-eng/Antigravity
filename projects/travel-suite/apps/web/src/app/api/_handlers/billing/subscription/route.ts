import { apiError, apiSuccess } from "@/lib/api/response";
import { PLAN_CATALOG, type CanonicalPlanId } from "@/lib/billing/plan-catalog";
import { isPaymentsIntegrationEnabled } from "@/lib/integrations";
import { paymentService } from "@/lib/payments/payment-service";
import { resolveOrganizationPlan } from "@/lib/subscriptions/limits";
import { createClient } from "@/lib/supabase/server";

function mapPlanIdToTier(planId: CanonicalPlanId): "free" | "pro" | "enterprise" {
  if (planId === "enterprise") return "enterprise";
  if (planId === "free") return "free";
  return "pro";
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("Unauthorized", 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[billing/subscription] failed to load profile:", profileError);
      return apiError("Failed to load billing profile", 500);
    }

    if (!profile?.organization_id) {
      return apiError("Organization not found", 404);
    }

    const [{ data: organization, error: orgError }, subscription, resolvedPlan, clientCountRes, proposalCountRes, teamCountRes] =
      await Promise.all([
        supabase
          .from("organizations")
          .select("id, name, billing_state, subscription_tier")
          .eq("id", profile.organization_id)
          .maybeSingle(),
        paymentService.getCurrentSubscription(profile.organization_id),
        resolveOrganizationPlan(supabase, profile.organization_id),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", profile.organization_id),
        supabase
          .from("proposals")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", profile.organization_id)
          .gte(
            "created_at",
            new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()
          ),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", profile.organization_id)
          .neq("role", "client"),
      ]);

    if (orgError) {
      console.error("[billing/subscription] failed to load organization:", orgError);
      return apiError("Failed to load billing organization", 500);
    }

    if (!organization) {
      return apiError("Organization not found", 404);
    }

    const planId = resolvedPlan.planId;
    const currentPlan = PLAN_CATALOG[planId];
    const supportWhatsAppNumber =
      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER ||
      process.env.SUPPORT_WHATSAPP_NUMBER ||
      null;

    return apiSuccess({
      current_plan_id: planId,
      current_tier: mapPlanIdToTier(planId),
      current_plan: currentPlan,
      subscription,
      organization: {
        id: organization.id,
        name: organization.name,
        billing_email: profile.email || user.email || null,
        billing_state: organization.billing_state,
        subscription_tier: organization.subscription_tier,
      },
      viewer: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email || user.email || null,
      },
      usage: {
        clients_used: clientCountRes.count || 0,
        proposals_used: proposalCountRes.count || 0,
        team_members_used: teamCountRes.count || 0,
      },
      limits: {
        clients: currentPlan.limits.clients,
        proposals: currentPlan.limits.proposals,
        team_members: currentPlan.limits.teamMembers,
        ai_requests: currentPlan.limits.aiRequests,
      },
      checkout_enabled: isPaymentsIntegrationEnabled(),
      can_self_serve_checkout: isPaymentsIntegrationEnabled() && !subscription,
      support_whatsapp_number: supportWhatsAppNumber,
    });
  } catch (error) {
    console.error("[billing/subscription] unexpected error:", error);
    return apiError("Failed to load billing subscription", 500);
  }
}
