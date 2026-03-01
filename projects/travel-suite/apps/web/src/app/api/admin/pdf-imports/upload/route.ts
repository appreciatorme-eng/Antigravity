import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";

const PDF_IMPORTS_UPLOAD_RATE_LIMIT_MAX = 30;
const PDF_IMPORTS_UPLOAD_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function normalizeFileName(value: string): string {
  const safe = sanitizeText(value, { maxLength: 120 });
  if (!safe) return "upload.pdf";
  const normalized = safe.replace(/[^\w.-]+/g, "_");
  return normalized || "upload.pdf";
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
 * POST /api/admin/pdf-imports/upload
 * Content-Type: multipart/form-data
 * Body: { file: PDF file, organizationId?: "uuid" }
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
      limit: PDF_IMPORTS_UPLOAD_RATE_LIMIT_MAX,
      windowMs: PDF_IMPORTS_UPLOAD_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:pdf-imports:upload",
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many PDF upload requests. Please retry later." },
        { status: 429 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedOrganizationId = sanitizeText(
      formData.get("organization_id") || formData.get("organizationId"),
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

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
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

    const { data: existingImport } = await admin.adminClient
      .from("pdf_imports")
      .select("id, file_name, status")
      .eq("organization_id", scopedOrg.organizationId)
      .eq("file_hash", fileHash)
      .maybeSingle();

    if (existingImport) {
      return NextResponse.json(
        {
          success: false,
          error: `Duplicate file detected. Already imported as "${existingImport.file_name}" (${existingImport.status})`,
          existing_import_id: existingImport.id,
        },
        { status: 409 },
      );
    }

    const safeFileName = normalizeFileName(file.name);
    const fileName = `${scopedOrg.organizationId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await admin.adminClient.storage
      .from("pdf-imports")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: "Failed to upload file to storage" },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = admin.adminClient.storage
      .from("pdf-imports")
      .getPublicUrl(fileName);

    const { data: pdfImport, error: insertError } = await admin.adminClient
      .from("pdf_imports")
      .insert({
        organization_id: scopedOrg.organizationId,
        file_name: safeFileName,
        file_url: publicUrlData.publicUrl,
        file_size_bytes: file.size,
        file_hash: fileHash,
        status: "uploaded",
        created_by: admin.userId,
      })
      .select()
      .single();

    if (insertError) {
      await admin.adminClient.storage.from("pdf-imports").remove([fileName]);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      pdf_import: {
        id: pdfImport.id,
        file_name: pdfImport.file_name,
        status: pdfImport.status,
        created_at: pdfImport.created_at,
      },
      message: "PDF uploaded successfully. AI extraction will begin shortly.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
