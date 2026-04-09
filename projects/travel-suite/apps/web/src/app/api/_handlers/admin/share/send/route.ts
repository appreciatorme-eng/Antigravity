import { NextResponse } from "next/server";
import React from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp.server";
import { sendEmail } from "@/lib/email/send";
import { logError, logWarn } from "@/lib/observability/logger";
import { ShareItineraryEmail } from "@/lib/email/share-itinerary-email";
import { validateContactInfo } from "@/lib/external/contact-validation";

const supabaseAdmin = createAdminClient();

interface SendRequestBody {
  shareLink: string;
  clientId: string;
  channel: "whatsapp" | "email" | "both";
  phone?: string;
  email?: string;
}

function isValidChannel(ch: unknown): ch is "whatsapp" | "email" | "both" {
  return ch === "whatsapp" || ch === "email" || ch === "both";
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
    }

    const body = (await req.json()) as Partial<SendRequestBody>;

    const { shareLink, clientId, channel, phone, email } = body;

    if (!shareLink || typeof shareLink !== "string") {
      return NextResponse.json({ error: "shareLink is required" }, { status: 400 });
    }
    if (!clientId || typeof clientId !== "string") {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    if (!isValidChannel(channel)) {
      return NextResponse.json({ error: "channel must be whatsapp, email, or both" }, { status: 400 });
    }

    // Fetch client profile
    const { data: client, error: clientErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", clientId)
      .maybeSingle();

    if (clientErr || !client) {
      logWarn("[share/send] Client not found", { clientId });
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const resolvedPhone = phone || client.phone || "";
    const resolvedEmail = email || client.email || "";
    const clientName = client.full_name || "Traveler";
    const validation = await validateContactInfo({
      email: resolvedEmail,
      phone: resolvedPhone,
    });

    // Extract trip title from share link path (best effort)
    const tripTitle = "your itinerary";

    const results: { whatsapp?: { success: boolean; error?: string }; email?: { success: boolean; error?: string } } = {};

    if (channel === "whatsapp" || channel === "both") {
      if (!resolvedPhone) {
        results.whatsapp = { success: false, error: "No phone number available" };
      } else if (validation.phoneWarnings.length > 0) {
        results.whatsapp = { success: false, error: validation.phoneWarnings[0] };
      } else {
        const message = `Hi ${clientName}, your itinerary '${tripTitle}' is ready! View it here: ${shareLink}`;
        const waResult = await sendWhatsAppText(resolvedPhone, message);
        results.whatsapp = { success: waResult.success, error: waResult.error };
        if (!waResult.success) {
          logWarn("[share/send] WhatsApp send failed", { clientId, error: waResult.error });
        }
      }
    }

    if (channel === "email" || channel === "both") {
      if (!resolvedEmail) {
        results.email = { success: false, error: "No email address available" };
      } else if (validation.emailWarnings.length > 0) {
        results.email = { success: false, error: validation.emailWarnings[0] };
      } else {
        const emailSent = await sendEmail({
          to: resolvedEmail,
          subject: `Your itinerary is ready!`,
          react: React.createElement(ShareItineraryEmail, {
            clientName,
            shareLink,
          }),
        });
        results.email = { success: emailSent, error: emailSent ? undefined : "Failed to send email" };
        if (!emailSent) {
          logWarn("[share/send] Email send failed", { clientId, email: resolvedEmail });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      validation: {
        emailWarnings: validation.emailWarnings,
        phoneWarnings: validation.phoneWarnings,
      },
    });
  } catch (err) {
    logError("[share/send] Unhandled error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
