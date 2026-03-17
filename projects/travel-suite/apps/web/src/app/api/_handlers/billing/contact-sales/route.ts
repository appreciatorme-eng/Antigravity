import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";
import { sendContactSalesConfirmation } from "@/lib/email/notifications";

const ContactSalesSchema = z.object({
  target_tier: z.enum(["pro", "business", "enterprise"]),
  billing_preference: z.enum(["monthly", "annual"]).optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  message: z.string().trim().min(8).max(1000),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("Unauthorized", 401);
    }

    const rl = await enforceRateLimit({
      identifier: user.id,
      limit: 3,
      windowMs: 600_000, // 3 requests per 10 minutes per user
      prefix: "api:billing:contact-sales",
    });
    if (!rl.success) {
      return apiError("Too many requests", 429);
    }

    const body = await request.json();
    const parsed = ContactSalesSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid contact request", 400, {
        details: parsed.error.flatten(),
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, organization_id, full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      logError("[billing/contact-sales] failed to load profile", profileError);
      return apiError("Failed to prepare request", 500);
    }

    if (!profile?.organization_id) {
      return apiError("Organization not found", 404);
    }

    const admin = createAdminClient();

    const { data: organization, error: orgError } = await admin
      .from("organizations")
      .select("id, name")
      .eq("id", profile.organization_id)
      .maybeSingle();

    if (orgError || !organization) {
      logError("[billing/contact-sales] failed to load organization", orgError);
      return apiError("Organization not found", 404);
    }
    const note = [
      `Billing upgrade request`,
      `Target tier: ${parsed.data.target_tier}`,
      parsed.data.billing_preference ? `Billing preference: ${parsed.data.billing_preference}` : null,
      "",
      parsed.data.message,
    ]
      .filter(Boolean)
      .join("\n");

    const { data: lead, error: leadError } = await admin
      .from("crm_contacts")
      .insert({
        organization_id: profile.organization_id,
        full_name: parsed.data.name,
        email: parsed.data.email,
        source: "billing_upgrade_request",
        stage: "qualified",
        notes: note,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (leadError) {
      logError("[billing/contact-sales] failed to create lead", leadError);
      return apiError("Failed to record upgrade request", 500);
    }

    await admin.from("lead_events").insert({
      lead_id: lead.id,
      organization_id: profile.organization_id,
      event_type: "note_added",
      note,
      metadata: {
        source: "billing_upgrade_request",
        target_tier: parsed.data.target_tier,
        billing_preference: parsed.data.billing_preference || null,
      },
      created_by: profile.id,
    });

    let emailResult: { success: boolean; skipped: boolean };
    try {
      const sent = await sendContactSalesConfirmation({
        to: parsed.data.email,
        name: parsed.data.name,
        organizationName: organization.name || "your agency",
        targetTier: parsed.data.target_tier,
      });
      emailResult = { success: sent, skipped: false };
    } catch {
      emailResult = { success: false, skipped: false };
    }

    return apiSuccess({
      requested: true,
      lead_id: lead.id,
      email_sent: emailResult.success,
      email_skipped: Boolean(emailResult.skipped),
    });
  } catch (error) {
    logError("[billing/contact-sales] unexpected error", error);
    return apiError("Failed to submit upgrade request", 500);
  }
}
