import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/security/sanitize";
import {
  getIntegrationDisabledMessage,
  isEmailIntegrationEnabled,
  isWhatsAppIntegrationEnabled,
} from "@/lib/integrations";
import { sendProposalSentNotification } from "@/lib/email/notifications";
import { sendWhatsAppText } from "@/lib/whatsapp.server";
import type { Database } from "@/lib/database.types";
import { trackFunnelEvent } from "@/lib/funnel/track";
import { safeErrorMessage } from "@/lib/security/safe-error";

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

type ProposalRecipientProfile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  phone_whatsapp: string | null;
};

type ProposalSendRow = Database["public"]["Tables"]["proposals"]["Row"] & {
  tour_templates:
    | { destination: string | null }
    | { destination: string | null }[]
    | null;
  clients:
    | { profiles: ProposalRecipientProfile | ProposalRecipientProfile[] | null }
    | { profiles: ProposalRecipientProfile | ProposalRecipientProfile[] | null }[]
    | null;
};

function makeShareUrl(request: NextRequest, shareToken: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  return `${base.replace(/\/$/, "")}/p/${shareToken}`;
}

async function sendProposalEmail(
  params: {
    toEmail: string;
    travelerName: string;
    proposalTitle: string;
    destination?: string | null;
    priceLabel?: string | null;
    proposalUrl: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailIntegrationEnabled()) {
    return {
      success: false,
      error: getIntegrationDisabledMessage("email"),
    };
  }

  try {
    const sent = await sendProposalSentNotification({
      to: params.toEmail,
      travelerName: params.travelerName,
      proposalTitle: params.proposalTitle,
      destination: params.destination,
      priceLabel: params.priceLabel,
      proposalUrl: params.proposalUrl,
    });

    return sent ? { success: true } : { success: false, error: "Email send failed" };
  } catch (error: unknown) {
    return {
      success: false,
      error: safeErrorMessage(error, "Email send failed"),
    };
  }
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
  const { data: proposalData, error: proposalError } = await supabaseAdmin
    .from("proposals")
    .select(
      `
      id,
      title,
      status,
      share_token,
      expires_at,
      organization_id,
      total_price,
      client_selected_price,
      tour_templates (
        destination
      ),
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

  const proposal = (proposalData as ProposalSendRow | null) || null;
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
    normalizeRelation(proposal.clients)?.profiles || null
  );

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
      const destination = normalizeRelation(proposal.tour_templates)?.destination || null;
      const quoteAmount = proposal.client_selected_price ?? proposal.total_price;
      const priceLabel =
        typeof quoteAmount === "number" && Number.isFinite(quoteAmount)
          ? `₹${Math.round(quoteAmount).toLocaleString("en-IN")}`
          : null;

      const result = await sendProposalEmail({
        toEmail: recipientEmail,
        travelerName: recipientName,
        proposalTitle: sanitizeText(proposal.title, { maxLength: 160 }) || "Travel proposal",
        destination,
        priceLabel,
        proposalUrl: shareUrl,
      });
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

  await supabaseAdmin
    .from("proposals")
    .update({
      status: nextStatus,
      expires_at: expiresAt,
      updated_at: nowIso,
    })
    .eq("id", proposalId);

  if (emailSent || whatsappSent) {
    trackFunnelEvent({
      supabase: supabaseAdmin,
      organizationId: admin.organizationId!,
      eventType: "proposal_sent",
      profileId: proposal.client_id ?? null,
      metadata: { proposal_id: proposalId },
    });
  }

  await supabaseAdmin.from("notification_logs").insert({
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
