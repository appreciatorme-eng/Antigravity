import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getIntegrationDisabledMessage, isEmailIntegrationEnabled } from "@/lib/integrations";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";
import { sendInvoicePdfNotification } from "@/lib/email/notifications";

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
      return apiError("Failed to verify invoice", 500);
    }
    if (!invoice) {
      return apiError("Invoice not found", 404);
    }

    const cleanedBase64 = normalizeBase64(pdf_base64);
    const displayOrgName = organization_name || "TripBuilt";

    const sent = await sendInvoicePdfNotification({
      to: client_email,
      invoiceNumber: invoice_number,
      organizationName: displayOrgName,
      attachment: {
        filename: `${invoice_number.replace(/\s+/g, "_")}.pdf`,
        content: cleanedBase64,
      },
    });

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: "Invoice email sent successfully" });
  } catch (error) {
    logError("Error in POST /api/invoices/send-pdf", error);
    return apiError(safeErrorMessage(error, "Failed to send invoice email"), 500);
  }
}
