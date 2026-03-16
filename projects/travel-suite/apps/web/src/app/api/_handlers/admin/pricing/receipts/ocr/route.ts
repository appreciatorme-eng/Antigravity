import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError, logEvent } from "@/lib/observability/logger";
import { extractAmountFromReceipt } from "@/lib/ocr/receipt-extractor";

const OcrRequestSchema = z.object({
  receipt_id: z.string().uuid(),
});

/**
 * POST /api/admin/pricing/receipts/ocr
 * Trigger OCR extraction on an uploaded receipt
 * Body: { receipt_id: "uuid" }
 * Returns: { amount, currency, confidence, receipt_id }
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError("Invalid JSON body", 400);
    }

    const parsed = OcrRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { receipt_id } = parsed.data;
    const db = admin.adminClient;

    // Fetch the receipt record
    const { data: receipt, error: fetchError } = await db
      .from("expense_receipts")
      .select("id, organization_id, receipt_url, ocr_extracted_amount, ocr_confidence")
      .eq("id", receipt_id)
      .eq("organization_id", admin.organizationId)
      .single();

    if (fetchError) {
      logError("[/api/admin/pricing/receipts/ocr:POST] Fetch error", fetchError);
      return apiError(safeErrorMessage(fetchError, "Receipt not found"), 404);
    }

    if (!receipt) {
      return apiError("Receipt not found or access denied", 404);
    }

    // Check if OCR was already performed
    if (receipt.ocr_extracted_amount !== null && receipt.ocr_confidence !== null) {
      logEvent('info', 'OCR already performed on receipt', { receipt_id });
      return NextResponse.json({
        success: true,
        message: "OCR already performed on this receipt",
        amount: receipt.ocr_extracted_amount,
        confidence: receipt.ocr_confidence,
        receipt_id: receipt.id,
      });
    }

    // Perform OCR extraction
    let ocrResult;
    try {
      ocrResult = await extractAmountFromReceipt(receipt.receipt_url);
    } catch (ocrError) {
      logError("[/api/admin/pricing/receipts/ocr:POST] OCR extraction failed", ocrError as Error);
      return apiError(
        ocrError instanceof Error ? ocrError.message : "OCR extraction failed",
        500
      );
    }

    // Update the receipt record with OCR results
    const { data: updatedReceipt, error: updateError } = await db
      .from("expense_receipts")
      .update({
        ocr_extracted_amount: ocrResult.amount,
        ocr_confidence: ocrResult.confidence,
        ocr_raw_response: {
          amount: ocrResult.amount,
          currency: ocrResult.currency,
          confidence: ocrResult.confidence,
          raw_response: ocrResult.raw_response,
          extracted_at: new Date().toISOString(),
        },
      })
      .eq("id", receipt_id)
      .select("id, ocr_extracted_amount, ocr_confidence, ocr_raw_response")
      .single();

    if (updateError) {
      logError("[/api/admin/pricing/receipts/ocr:POST] Update error", updateError);
      return apiError(safeErrorMessage(updateError, "Failed to update receipt"), 500);
    }

    logEvent('info', 'OCR extraction successful', {
      receipt_id,
      amount: ocrResult.amount,
      currency: ocrResult.currency,
      confidence: ocrResult.confidence,
    });

    return apiSuccess({
      receipt_id: updatedReceipt.id,
      amount: ocrResult.amount,
      currency: ocrResult.currency,
      confidence: ocrResult.confidence,
      message: "OCR extraction completed successfully",
    }, { status: 200 });
  } catch (error) {
    logError("[/api/admin/pricing/receipts/ocr:POST] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
