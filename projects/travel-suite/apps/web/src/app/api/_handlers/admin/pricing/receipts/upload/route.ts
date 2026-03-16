import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";
import type { Database } from "@/lib/database.types";

const RECEIPT_UPLOAD_RATE_LIMIT_MAX = 30;
const RECEIPT_UPLOAD_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RECEIPT_UPLOAD_SELECT = "created_at, id, organization_id, receipt_url";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
] as const;

function normalizeFileName(value: string): string {
  const safe = sanitizeText(value, { maxLength: 120 });
  if (!safe) return "receipt.jpg";
  const normalized = safe.replace(/[^\w.-]+/g, "_");
  return normalized || "receipt.jpg";
}

function resolveScopedOrganizationId(
  admin: Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>,
  requestedOrganizationId: string | null,
): { organizationId: string } | { error: NextResponse } {
  if (admin.isSuperAdmin) {
    if (!requestedOrganizationId) {
      return {
        error: NextResponse.json(
          { success: false, error: "organization_id is required for super admin uploads" },
          { status: 400 },
        ),
      };
    }
    return { organizationId: requestedOrganizationId };
  }

  if (!admin.organizationId) {
    return {
      error: NextResponse.json(
        { success: false, error: "Admin organization not configured" },
        { status: 400 },
      ),
    };
  }

  if (requestedOrganizationId && requestedOrganizationId !== admin.organizationId) {
    return {
      error: NextResponse.json(
        { success: false, error: "Cannot upload for another organization" },
        { status: 403 },
      ),
    };
  }

  return { organizationId: admin.organizationId };
}

/**
 * POST /api/admin/pricing/receipts/upload
 * Content-Type: multipart/form-data
 * Body: { file: Image/PDF file, organizationId?: "uuid", tripServiceCostId?: "uuid" }
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: admin.response.status || 401 },
      );
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: RECEIPT_UPLOAD_RATE_LIMIT_MAX,
      windowMs: RECEIPT_UPLOAD_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:pricing:receipts:upload",
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many receipt upload requests. Please retry later." },
        { status: 429 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedOrganizationId = sanitizeText(
      formData.get("organization_id") || formData.get("organizationId"),
      { maxLength: 80 },
    );
    const tripServiceCostId = sanitizeText(
      formData.get("trip_service_cost_id") || formData.get("tripServiceCostId"),
      { maxLength: 80 },
    );

    const scopedOrg = resolveScopedOrganizationId(
      admin,
      requestedOrganizationId || null,
    );
    if ("error" in scopedOrg) return scopedOrg.error;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      return NextResponse.json(
        { success: false, error: "Only JPG, PNG, and PDF files are supported" },
        { status: 400 },
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = crypto.createHash("md5").update(buffer).digest("hex");

    // Check for duplicate receipt by hash within this organization
    const { data: existingReceipt } = await admin.adminClient
      .from("expense_receipts")
      .select("id, receipt_url")
      .eq("organization_id", scopedOrg.organizationId)
      .like("receipt_url", `%${fileHash}%`)
      .maybeSingle();

    if (existingReceipt) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate receipt detected. This file has already been uploaded.",
          existing_receipt_id: existingReceipt.id,
          existing_receipt_url: existingReceipt.receipt_url,
        },
        { status: 409 },
      );
    }

    const safeFileName = normalizeFileName(file.name);
    const fileExtension = safeFileName.split(".").pop() || "jpg";
    const fileName = `${scopedOrg.organizationId}/${fileHash}.${fileExtension}`;

    const { error: uploadError } = await admin.adminClient.storage
      .from("expense-receipts")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logError("Failed to upload receipt to storage", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload file to storage" },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = admin.adminClient.storage
      .from("expense-receipts")
      .getPublicUrl(fileName);

    const insertData: Database["public"]["Tables"]["expense_receipts"]["Insert"] = {
      organization_id: scopedOrg.organizationId,
      receipt_url: publicUrlData.publicUrl,
      created_by: admin.userId,
    };

    if (tripServiceCostId) {
      insertData.trip_service_cost_id = tripServiceCostId;
    }

    const { data: receipt, error: insertError } = await admin.adminClient
      .from("expense_receipts")
      .insert(insertData)
      .select(RECEIPT_UPLOAD_SELECT)
      .single();

    if (insertError) {
      await admin.adminClient.storage.from("expense-receipts").remove([fileName]);
      logError("Failed to create expense_receipts record", insertError);
      return NextResponse.json(
        { success: false, error: safeErrorMessage(insertError, "Failed to save receipt") },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        receipt_url: receipt.receipt_url,
        organization_id: receipt.organization_id,
        created_at: receipt.created_at,
      },
      message: "Receipt uploaded successfully. You can now run OCR to extract the amount.",
    });
  } catch (error) {
    logError("Error uploading receipt", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while uploading the receipt",
      },
      { status: 500 },
    );
  }
}
