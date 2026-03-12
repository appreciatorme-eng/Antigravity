/**
 * Proposal Payment Plan — installment schedule management + Razorpay Payment Link dispatch.
 * GET  — fetch plan + ordered milestones for a proposal.
 * POST — create/replace payment plan (milestones array), or send a payment link for one milestone.
 */

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizeText } from "@/lib/security/sanitize";
import { razorpay } from "@/lib/payments/razorpay";
import { fetchWithRetry } from "@/lib/network/retry";
import type {
  Database,
} from "@/lib/database.types";

type PaymentPlanRow = Database["public"]["Tables"]["proposal_payment_plans"]["Row"];
type MilestoneRow  = Database["public"]["Tables"]["proposal_payment_milestones"]["Row"];

const PROPOSAL_PAYMENT_PLAN_SELECT = [
  "created_at",
  "deposit_percent",
  "id",
  "notes",
  "organization_id",
  "proposal_id",
  "updated_at",
].join(", ");

const PROPOSAL_PAYMENT_MILESTONE_SELECT = [
  "amount_fixed",
  "amount_percent",
  "created_at",
  "due_date",
  "id",
  "label",
  "organization_id",
  "paid_at",
  "plan_id",
  "proposal_id",
  "razorpay_payment_link_id",
  "razorpay_payment_link_url",
  "sent_at",
  "sort_order",
  "status",
  "updated_at",
].join(", ");

const MilestoneSchema = z.object({
  label:          z.string().min(1).max(120),
  amount_percent: z.number().int().min(1).max(100).optional(),
  amount_fixed:   z.number().positive().optional(),
  due_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD"),
  sort_order:     z.number().int().min(0).optional(),
}).refine(
  (m) => m.amount_percent != null || m.amount_fixed != null,
  { message: "Each milestone must have amount_percent or amount_fixed" }
);

const CreatePlanSchema = z.object({
  deposit_percent: z.number().int().min(0).max(100).optional(),
  notes:           z.string().max(500).optional(),
  milestones:      z.array(MilestoneSchema).min(1).max(12),
});

const SendMilestoneSchema = z.object({
  action:       z.literal("send-milestone"),
  milestone_id: z.string().uuid(),
});

async function sendMilestoneEmail(
  toEmail: string,
  recipientName: string,
  proposalTitle: string,
  milestoneLabel: string,
  amountInr: number,
  dueDate: string,
  paymentUrl: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail =
    process.env.PROPOSAL_FROM_EMAIL ||
    process.env.WELCOME_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !senderEmail) {
    return { success: false, error: "Email provider not configured" };
  }

  const subject = `Payment due: ${milestoneLabel} — ${proposalTitle}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6;">
      <h2>Hello ${recipientName},</h2>
      <p>A payment milestone is ready for your trip booking.</p>
      <p><strong>Proposal:</strong> ${proposalTitle}</p>
      <p><strong>Milestone:</strong> ${milestoneLabel}</p>
      <p><strong>Amount:</strong> ₹${amountInr.toLocaleString("en-IN")}</p>
      <p><strong>Due date:</strong> ${dueDate}</p>
      <p>
        <a href="${paymentUrl}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;">
          Pay Now
        </a>
      </p>
      <p style="color:#475569">Or copy this link: <a href="${paymentUrl}">${paymentUrl}</a></p>
    </div>
  `;

  try {
    const response = await fetchWithRetry(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: senderEmail, to: [toEmail], subject, html }),
      },
      { retries: 2, timeoutMs: 8000, baseDelayMs: 300 }
    );

    if (response.ok) return { success: true };

    const body = await response.text().catch(() => "");
    return { success: false, error: body || `Email send failed (${response.status})` };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Email send failed" };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request, { requireOrganization: true });
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return apiError("Admin organization not configured", 400);
  }

  const { id: proposalId } = await params;
  const supabase = admin.adminClient;
  const organizationId: string = admin.organizationId;

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("id, title, client_selected_price, total_price")
    .eq("id", proposalId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (proposalError || !proposal) {
    return apiError("Proposal not found", 404);
  }

  const { data: plan } = await supabase
    .from("proposal_payment_plans")
    .select(PROPOSAL_PAYMENT_PLAN_SELECT)
    .eq("proposal_id", proposalId)
    .maybeSingle() as { data: PaymentPlanRow | null };

  if (!plan) {
    return NextResponse.json({
      plan: null,
      milestones: [],
      total_amount: proposal.client_selected_price ?? proposal.total_price ?? 0,
    });
  }

  const { data: milestones } = await supabase
    .from("proposal_payment_milestones")
    .select(PROPOSAL_PAYMENT_MILESTONE_SELECT)
    .eq("plan_id", plan.id)
    .order("sort_order", { ascending: true }) as { data: MilestoneRow[] | null };

  return NextResponse.json({
    plan,
    milestones: milestones ?? [],
    total_amount: proposal.client_selected_price ?? proposal.total_price ?? 0,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request, { requireOrganization: true });
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return apiError("Admin organization not configured", 400);
  }

  const { id: proposalId } = await params;
  const supabase = admin.adminClient;
  const organizationId: string = admin.organizationId;
  const body = await request.json().catch(() => ({}));

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("id, title, client_id, client_selected_price, total_price")
    .eq("id", proposalId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (proposalError || !proposal) {
    return apiError("Proposal not found", 404);
  }

  if (body?.action === "send-milestone") {
    return handleSendMilestone(body, proposal, organizationId, supabase);
  }

  return handleCreatePlan(body, proposal, organizationId, supabase);
}

async function handleCreatePlan(
  body: unknown,
  proposal: { id: string; title: string },
  organizationId: string,
  supabase: ReturnType<typeof import("@/lib/supabase/admin")["createAdminClient"]>
) {
  const parsed = CreatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { deposit_percent = 30, notes, milestones } = parsed.data;

  const { data: existingPlan } = await supabase
    .from("proposal_payment_plans")
    .select("id")
    .eq("proposal_id", proposal.id)
    .maybeSingle() as { data: { id: string } | null };

  let planId: string;

  if (existingPlan) {
    await supabase
      .from("proposal_payment_milestones")
      .delete()
      .eq("plan_id", existingPlan.id);

    await supabase
      .from("proposal_payment_plans")
      .update({ deposit_percent, notes: notes ?? null, updated_at: new Date().toISOString() })
      .eq("id", existingPlan.id);

    planId = existingPlan.id;
  } else {
    const { data: newPlan, error: planError } = await supabase
      .from("proposal_payment_plans")
      .insert({
        proposal_id:    proposal.id,
        organization_id: organizationId,
        deposit_percent,
        notes:          notes ?? null,
      })
      .select("id")
      .single();

    if (planError || !newPlan) {
      return apiError("Failed to create payment plan", 500);
    }

    planId = newPlan.id;
  }

  const milestoneRows = milestones.map((m, idx) => ({
    plan_id:        planId,
    proposal_id:    proposal.id,
    organization_id: organizationId,
    label:          sanitizeText(m.label, { maxLength: 120 }) ?? m.label,
    amount_percent: m.amount_percent ?? null,
    amount_fixed:   m.amount_fixed ?? null,
    due_date:       m.due_date,
    sort_order:     m.sort_order ?? idx,
    status:         "pending",
  }));

  const { data: insertedMilestones, error: milestoneError } = await supabase
    .from("proposal_payment_milestones")
    .insert(milestoneRows)
    .select(PROPOSAL_PAYMENT_MILESTONE_SELECT);
  const insertedMilestoneRows = insertedMilestones as unknown as MilestoneRow[] | null;

  if (milestoneError) {
    return apiError("Failed to create milestones", 500);
  }

  return NextResponse.json({ success: true, plan_id: planId, milestones: insertedMilestoneRows ?? [] });
}

async function handleSendMilestone(
  body: unknown,
  proposal: { id: string; title: string; client_id: string | null; client_selected_price: number | null; total_price: number | null },
  organizationId: string,
  supabase: ReturnType<typeof import("@/lib/supabase/admin")["createAdminClient"]>
) {
  const parsed = SendMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { milestone_id } = parsed.data;

  const { data: milestone } = await supabase
    .from("proposal_payment_milestones")
    .select(PROPOSAL_PAYMENT_MILESTONE_SELECT)
    .eq("id", milestone_id)
    .eq("proposal_id", proposal.id)
    .eq("organization_id", organizationId)
    .maybeSingle() as { data: MilestoneRow | null };

  if (!milestone) {
    return apiError("Milestone not found", 404);
  }

  if (milestone.status === "paid" || milestone.status === "cancelled") {
    return apiError(`Milestone is already ${milestone.status}`, 400);
  }

  const totalAmountInr = Number(proposal.client_selected_price ?? proposal.total_price ?? 0);

  let milestoneAmountInr: number;
  if (milestone.amount_percent != null) {
    milestoneAmountInr = Math.round((milestone.amount_percent / 100) * totalAmountInr * 100) / 100;
  } else if (milestone.amount_fixed != null) {
    milestoneAmountInr = Number(milestone.amount_fixed);
  } else {
    return apiError("Milestone has no amount configured", 400);
  }

  const amountInPaise = Math.round(milestoneAmountInr * 100);
  if (amountInPaise < 100) {
    return apiError("Milestone amount must be at least ₹1", 400);
  }

  let clientName = "Traveler";
  let clientEmail: string | null = null;

  if (proposal.client_id) {
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", proposal.client_id)
      .maybeSingle();

    if (clientProfile) {
      clientName  = sanitizeText(clientProfile.full_name, { maxLength: 120 }) ?? "Traveler";
      clientEmail = clientProfile.email ?? null;
    }
  }

  const dueDateUnix = Math.floor(new Date(milestone.due_date).getTime() / 1000);

  const paymentLink = await razorpay.paymentLinks.create({
    amount:      amountInPaise,
    currency:    "INR",
    description: `${milestone.label} — ${proposal.title}`,
    customer:    clientEmail ? { name: clientName, email: clientEmail } : undefined,
    notify:      { sms: false, email: false },
    reminder_enable: true,
    expire_by:   dueDateUnix,
    notes: {
      proposal_id:   proposal.id,
      milestone_id:  milestone_id,
      organization_id: organizationId,
    },
  });

  const nowIso = new Date().toISOString();

  await supabase
    .from("proposal_payment_milestones")
    .update({
      status:                     "sent",
      razorpay_payment_link_id:   paymentLink.id,
      razorpay_payment_link_url:  paymentLink.short_url,
      sent_at:                    nowIso,
      updated_at:                 nowIso,
    })
    .eq("id", milestone_id);

  let emailSent = false;
  const emailErrors: string[] = [];

  if (clientEmail) {
    const emailResult = await sendMilestoneEmail(
      clientEmail,
      clientName,
      proposal.title,
      milestone.label,
      milestoneAmountInr,
      milestone.due_date,
      paymentLink.short_url
    );
    emailSent = emailResult.success;
    if (!emailResult.success && emailResult.error) {
      emailErrors.push(emailResult.error);
    }
  } else {
    emailErrors.push("Client email not available — payment link created but not emailed");
  }

  return NextResponse.json({
    success:                   true,
    milestone_id,
    razorpay_payment_link_id:  paymentLink.id,
    payment_link_url:          paymentLink.short_url,
    amount_inr:                milestoneAmountInr,
    email_sent:                emailSent,
    warnings:                  emailErrors.length > 0 ? emailErrors : undefined,
  });
}
