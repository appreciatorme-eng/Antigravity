/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/security/sanitize";
import {
  getIntegrationDisabledMessage,
  isEmailIntegrationEnabled,
  isWhatsAppIntegrationEnabled,
} from "@/lib/integrations";
import { sendWhatsAppText } from "@/lib/whatsapp.server";

const SendProposalSchema = z.object({
  channels: z
    .object({
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional(),
    })
    .optional(),
});

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function makeShareUrl(request: NextRequest, shareToken: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  return `${base.replace(/\/$/, "")}/p/${shareToken}`;
}

async function sendProposalEmail(
  toEmail: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail =
    process.env.PROPOSAL_FROM_EMAIL ||
    process.env.WELCOME_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !senderEmail) {
    return {
      success: false,
      error: "Email provider not configured (RESEND_API_KEY / sender email missing)",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: senderEmail,
      to: [toEmail],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { success: false, error: body || `Email send failed (${response.status})` };
  }

  return { success: true };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  if (!admin.organizationId) {
    return NextResponse.json(
      { error: "Admin organization not configured" },
      { status: 400 }
    );
  }

  const { id: proposalId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = SendProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const channels = parsed.data.channels ?? { email: true, whatsapp: false };
  const shouldEmail = channels.email !== false;
  const shouldWhatsapp = channels.whatsapp === true;

  if (!shouldEmail && !shouldWhatsapp) {
    return NextResponse.json(
      { error: "At least one channel must be enabled" },
      { status: 400 }
    );
  }

  const supabaseAdmin = admin.adminClient;
  const { data: proposal, error: proposalError } = await (supabaseAdmin as any)
    .from("proposals")
    .select(
      `
      id,
      title,
      status,
      share_token,
      expires_at,
      organization_id,
      clients (
        profiles (
          full_name,
          email,
          phone,
          phone_whatsapp
        )
      )
    `
    )
    .eq("id", proposalId)
    .eq("organization_id", admin.organizationId)
    .maybeSingle();

  if (proposalError || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const shareToken = sanitizeText(proposal.share_token, { maxLength: 200 });
  if (!shareToken) {
    return NextResponse.json(
      { error: "Proposal share token is missing" },
      { status: 400 }
    );
  }

  const shareUrl = makeShareUrl(request, shareToken);

  const clientProfile = normalizeRelation(
    normalizeRelation((proposal as any).clients)?.profiles
  ) as
    | {
        full_name?: string | null;
        email?: string | null;
        phone?: string | null;
        phone_whatsapp?: string | null;
      }
    | null;

  const recipientName =
    sanitizeText(clientProfile?.full_name, { maxLength: 120 }) || "Traveler";
  const recipientEmail = sanitizeEmail(clientProfile?.email);
  const recipientPhone =
    sanitizePhone(clientProfile?.phone_whatsapp) || sanitizePhone(clientProfile?.phone);

  let emailSent = false;
  let whatsappSent = false;
  const errors: string[] = [];

  if (shouldEmail) {
    if (!isEmailIntegrationEnabled()) {
      errors.push(getIntegrationDisabledMessage("email"));
    } else if (!recipientEmail) {
      errors.push("Client email is missing");
    } else {
      const emailSubject = `Your travel proposal: ${sanitizeText(proposal.title, { maxLength: 140 })}`;
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6;">
          <h2>Hello ${recipientName},</h2>
          <p>Your travel proposal is ready for review.</p>
          <p><strong>${sanitizeText(proposal.title, { maxLength: 160 })}</strong></p>
          <p>
            <a href="${shareUrl}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;">
              Open Proposal
            </a>
          </p>
          <p style="color:#475569">Link: <a href="${shareUrl}">${shareUrl}</a></p>
        </div>
      `;

      const result = await sendProposalEmail(recipientEmail, emailSubject, emailHtml);
      if (result.success) {
        emailSent = true;
      } else {
        errors.push(result.error || "Email send failed");
      }
    }
  }

  if (shouldWhatsapp) {
    if (!isWhatsAppIntegrationEnabled()) {
      errors.push(getIntegrationDisabledMessage("whatsapp"));
    } else if (!recipientPhone) {
      errors.push("Client WhatsApp phone is missing");
    } else {
      const message = `Hi ${recipientName}, your travel proposal "${sanitizeText(
        proposal.title,
        { maxLength: 120 }
      )}" is ready: ${shareUrl}`;
      const waResult = await sendWhatsAppText(recipientPhone, message);
      if (waResult.success) {
        whatsappSent = true;
      } else {
        errors.push(waResult.error || "WhatsApp send failed");
      }
    }
  }

  const nowIso = new Date().toISOString();
  const expiresAt =
    proposal.expires_at && new Date(proposal.expires_at).getTime() > Date.now()
      ? proposal.expires_at
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const nextStatus =
    proposal.status === "approved" || proposal.status === "rejected"
      ? proposal.status
      : "sent";

  await (supabaseAdmin as any)
    .from("proposals")
    .update({
      status: nextStatus,
      expires_at: expiresAt,
      updated_at: nowIso,
    })
    .eq("id", proposalId);

  await (supabaseAdmin as any).from("notification_logs").insert({
    recipient_id: admin.userId,
    recipient_type: "admin",
    notification_type: "proposal_send",
    title: "Proposal sent to client",
    body: `Proposal "${sanitizeText(proposal.title, {
      maxLength: 120,
    })}" sent. Email=${emailSent} WhatsApp=${whatsappSent}`,
    status: errors.length > 0 ? "failed" : "sent",
    sent_at: nowIso,
  });

  return NextResponse.json({
    success: emailSent || whatsappSent,
    email: emailSent,
    whatsapp: whatsappSent,
    shareUrl,
    errors,
  });
}
