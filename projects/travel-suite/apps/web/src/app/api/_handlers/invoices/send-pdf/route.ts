import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getIntegrationDisabledMessage, isEmailIntegrationEnabled } from "@/lib/integrations";

const SendInvoicePdfSchema = z.object({
  invoice_id: z.string().uuid(),
  client_email: z.string().email(),
  pdf_base64: z.string().min(1),
  invoice_number: z.string().min(1).max(64),
  organization_name: z.string().min(1).max(240).optional(),
});

function normalizeBase64(input: string): string {
  const trimmed = input.trim();
  const marker = "base64,";
  const markerIndex = trimmed.indexOf(marker);
  if (markerIndex >= 0) {
    return trimmed.slice(markerIndex + marker.length);
  }
  return trimmed;
}

export async function POST(request: Request) {
  try {
    if (!isEmailIntegrationEnabled()) {
      return NextResponse.json(
        {
          success: false,
          disabled: true,
          error: getIntegrationDisabledMessage("email"),
        },
        { status: 202 }
      );
    }

    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const parsed = SendInvoicePdfSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { invoice_id, client_email, pdf_base64, invoice_number, organization_name } = parsed.data;

    const { data: invoice, error: invoiceError } = await auth.adminClient
      .from("invoices")
      .select("id")
      .eq("id", invoice_id)
      .eq("organization_id", auth.organizationId!)
      .maybeSingle();

    if (invoiceError) {
      return NextResponse.json({ error: "Failed to verify invoice" }, { status: 500 });
    }
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const senderEmail =
      process.env.PROPOSAL_FROM_EMAIL ||
      process.env.WELCOME_FROM_EMAIL ||
      process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !senderEmail) {
      return NextResponse.json(
        { error: "Email provider is not configured (RESEND_API_KEY / sender email missing)" },
        { status: 503 }
      );
    }

    const cleanedBase64 = normalizeBase64(pdf_base64);
    const displayOrgName = organization_name || "Travel Suite";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [client_email],
        subject: `Invoice ${invoice_number} from ${displayOrgName}`,
        html: `
          <h2>Invoice ${invoice_number}</h2>
          <p>Please find your invoice attached as a PDF.</p>
          <p>If you have any questions, reply to this email and our team will assist you.</p>
          <p>Regards,<br/>${displayOrgName}</p>
        `,
        attachments: [
          {
            filename: `${invoice_number.replace(/\s+/g, "_")}.pdf`,
            content: cleanedBase64,
          },
        ],
      }),
    });

    if (!emailResponse.ok) {
      const payload = await emailResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to send email", details: payload },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: "Invoice email sent successfully" });
  } catch (error) {
    console.error("Error in POST /api/invoices/send-pdf:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send invoice email" },
      { status: 500 }
    );
  }
}
