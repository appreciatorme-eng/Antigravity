import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchWithRetry } from "@/lib/network/retry";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const ContactSalesSchema = z.object({
  target_tier: z.enum(["pro", "business", "enterprise"]),
  billing_preference: z.enum(["monthly", "annual"]).optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  message: z.string().trim().min(8).max(1000),
});

async function sendConfirmationEmail(params: {
  email: string;
  name: string;
  organizationName: string;
  targetTier: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    process.env.WELCOME_FROM_EMAIL ||
    process.env.PROPOSAL_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return { success: false, skipped: true };
  }

  const response = await fetchWithRetry(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.email,
        subject: `Travel Suite ${params.targetTier} upgrade request received`,
        html: `
          <div style="font-family:Inter,system-ui,sans-serif;line-height:1.6;color:#0f172a;">
            <h2 style="margin-bottom:12px;">We received your upgrade request</h2>
            <p>Hi ${params.name},</p>
            <p>Thanks for your interest in the <strong>${params.targetTier}</strong> plan for <strong>${params.organizationName}</strong>.</p>
            <p>Our team will review your request and follow up with the next steps shortly.</p>
            <p style="color:#64748b;font-size:13px;">If this request was sent by mistake, you can ignore this email.</p>
          </div>
        `,
      }),
    },
    {
      retries: 2,
      timeoutMs: 8000,
      baseDelayMs: 300,
    }
  );

  return { success: response.ok, skipped: false };
}

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
      console.error("[billing/contact-sales] failed to load profile:", profileError);
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
      console.error("[billing/contact-sales] failed to load organization:", orgError);
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
      console.error("[billing/contact-sales] failed to create lead:", leadError);
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

    const emailResult = await sendConfirmationEmail({
      email: parsed.data.email,
      name: parsed.data.name,
      organizationName: organization.name || "your agency",
      targetTier: parsed.data.target_tier,
    });

    return apiSuccess({
      requested: true,
      lead_id: lead.id,
      email_sent: emailResult.success,
      email_skipped: Boolean(emailResult.skipped),
    });
  } catch (error) {
    console.error("[billing/contact-sales] unexpected error:", error);
    return apiError("Failed to submit upgrade request", 500);
  }
}
