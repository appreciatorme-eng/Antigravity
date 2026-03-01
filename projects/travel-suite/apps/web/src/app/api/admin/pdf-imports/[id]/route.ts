import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { processPDFImport, publishPDFImport } from "@/lib/pdf-extractor";

const PDF_IMPORTS_DETAIL_RATE_LIMIT_MAX = 120;
const PDF_IMPORTS_DETAIL_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const PDF_IMPORTS_WRITE_RATE_LIMIT_MAX = 60;
const PDF_IMPORTS_WRITE_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

type AdminContext = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;

type PdfImportRow = {
  id: string;
  organization_id: string | null;
  file_url?: string | null;
  [key: string]: unknown;
};

function hasOrgAccess(admin: AdminContext, organizationId: string | null): boolean {
  if (!organizationId) return false;
  if (admin.isSuperAdmin) return true;
  return Boolean(admin.organizationId && admin.organizationId === organizationId);
}

async function loadPdfImportForAccess(
  admin: AdminContext,
  id: string,
): Promise<{ row: PdfImportRow } | { response: NextResponse }> {
  const { data: row, error } = await admin.adminClient
    .from("pdf_imports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      response: NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      ),
    };
  }

  if (!row) {
    return {
      response: NextResponse.json(
        { success: false, error: "PDF import not found" },
        { status: 404 },
      ),
    };
  }

  const castedRow = row as unknown as PdfImportRow;
  if (!hasOrgAccess(admin, castedRow.organization_id || null)) {
    return {
      response: NextResponse.json(
        { success: false, error: "PDF import not found" },
        { status: 404 },
      ),
    };
  }

  return { row: castedRow };
}

function parseImportId(params: { id: string }): string | null {
  const id = sanitizeText(params.id, { maxLength: 80 });
  return id || null;
}

/**
 * GET /api/admin/pdf-imports/{id}
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
      limit: PDF_IMPORTS_DETAIL_RATE_LIMIT_MAX,
      windowMs: PDF_IMPORTS_DETAIL_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:pdf-imports:detail",
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many PDF import detail requests. Please retry later." },
        { status: 429 },
      );
    }

    const parsedId = parseImportId(await params);
    if (!parsedId) {
      return NextResponse.json(
        { success: false, error: "Invalid PDF import id" },
        { status: 400 },
      );
    }

    const loaded = await loadPdfImportForAccess(admin, parsedId);
    if ("response" in loaded) return loaded.response;

    return NextResponse.json({
      success: true,
      pdf_import: loaded.row,
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

/**
 * PATCH /api/admin/pdf-imports/{id}
 * Body: { action: "approve" | "reject" | "re-extract" | "publish", notes?: string, organization_id?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
      limit: PDF_IMPORTS_WRITE_RATE_LIMIT_MAX,
      windowMs: PDF_IMPORTS_WRITE_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:pdf-imports:write",
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many PDF import mutation requests. Please retry later." },
        { status: 429 },
      );
    }

    const parsedId = parseImportId(await params);
    if (!parsedId) {
      return NextResponse.json(
        { success: false, error: "Invalid PDF import id" },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      notes?: string;
      organization_id?: string;
      organizationId?: string;
    };
    const action = sanitizeText(body.action, { maxLength: 40 });
    const notes = sanitizeText(body.notes, {
      maxLength: 2000,
      preserveNewlines: true,
    }) || null;
    const requestedPublishOrgId = sanitizeText(
      body.organization_id || body.organizationId,
      { maxLength: 80 },
    );

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: "Action required (approve, reject, re-extract, publish)",
        },
        { status: 400 },
      );
    }

    const loaded = await loadPdfImportForAccess(admin, parsedId);
    if ("response" in loaded) return loaded.response;
    const pdfImport = loaded.row;
    const pdfImportOrgId = pdfImport.organization_id;

    if (!pdfImportOrgId) {
      return NextResponse.json(
        { success: false, error: "PDF import organization is not configured" },
        { status: 400 },
      );
    }

    switch (action) {
      case "approve": {
        const { error } = await admin.adminClient
          .from("pdf_imports")
          .update({
            status: "approved",
            reviewed_by: admin.userId,
            reviewed_at: new Date().toISOString(),
            review_notes: notes,
          })
          .eq("id", parsedId)
          .eq("organization_id", pdfImportOrgId);

        if (error) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "PDF import approved. Ready to publish.",
        });
      }

      case "reject": {
        const { error } = await admin.adminClient
          .from("pdf_imports")
          .update({
            status: "rejected",
            reviewed_by: admin.userId,
            reviewed_at: new Date().toISOString(),
            review_notes: notes,
          })
          .eq("id", parsedId)
          .eq("organization_id", pdfImportOrgId);

        if (error) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "PDF import rejected.",
        });
      }

      case "re-extract": {
        const result = await processPDFImport(parsedId);
        return NextResponse.json({
          success: result.success,
          message: result.success
            ? `Re-extraction complete (confidence: ${result.confidence.toFixed(2)})`
            : "Re-extraction failed",
          extraction_result: result,
        });
      }

      case "publish": {
        const publishOrgId = admin.isSuperAdmin
          ? requestedPublishOrgId || pdfImportOrgId || null
          : admin.organizationId || null;

        if (!publishOrgId) {
          return NextResponse.json(
            { success: false, error: "Organization ID required for publishing" },
            { status: 400 },
          );
        }

        if (!admin.isSuperAdmin && publishOrgId !== pdfImportOrgId) {
          return NextResponse.json(
            {
              success: false,
              error: "Cannot publish PDF import for another organization",
            },
            { status: 403 },
          );
        }

        const template = await publishPDFImport(parsedId, publishOrgId);
        return NextResponse.json({
          success: true,
          message: "Template published successfully!",
          template_id: template.id,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
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

/**
 * DELETE /api/admin/pdf-imports/{id}
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
      limit: PDF_IMPORTS_WRITE_RATE_LIMIT_MAX,
      windowMs: PDF_IMPORTS_WRITE_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:pdf-imports:write",
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many PDF import mutation requests. Please retry later." },
        { status: 429 },
      );
    }

    const parsedId = parseImportId(await params);
    if (!parsedId) {
      return NextResponse.json(
        { success: false, error: "Invalid PDF import id" },
        { status: 400 },
      );
    }

    const loaded = await loadPdfImportForAccess(admin, parsedId);
    if ("response" in loaded) return loaded.response;
    const pdfImport = loaded.row;
    const pdfImportOrgId = pdfImport.organization_id;

    if (!pdfImportOrgId) {
      return NextResponse.json(
        { success: false, error: "PDF import organization is not configured" },
        { status: 400 },
      );
    }

    const { error: deleteError } = await admin.adminClient
      .from("pdf_imports")
      .delete()
      .eq("id", parsedId)
      .eq("organization_id", pdfImportOrgId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 },
      );
    }

    const fileUrl = typeof pdfImport.file_url === "string" ? pdfImport.file_url : null;
    if (fileUrl) {
      try {
        const parsedUrl = new URL(fileUrl);
        const fileName = parsedUrl.pathname.split("/").pop();
        if (fileName) {
          await admin.adminClient.storage.from("pdf-imports").remove([fileName]);
        }
      } catch {
        // Best-effort storage cleanup.
      }
    }

    return NextResponse.json({
      success: true,
      message: "PDF import deleted successfully",
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
