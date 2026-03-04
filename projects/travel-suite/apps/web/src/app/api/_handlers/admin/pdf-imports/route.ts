import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";

const PDF_IMPORTS_LIST_RATE_LIMIT_MAX = 60;
const PDF_IMPORTS_LIST_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function resolveScopedOrganizationId(
  admin: Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>,
  request: NextRequest,
): { organizationId: string } | { error: NextResponse } {
  const requestedOrganizationId = sanitizeText(
    request.nextUrl.searchParams.get("organization_id") ||
      request.nextUrl.searchParams.get("organizationId"),
    { maxLength: 80 },
  );

  if (admin.isSuperAdmin) {
    if (!requestedOrganizationId) {
      return {
        error: NextResponse.json(
          { error: "organization_id query param is required for super admin" },
          { status: 400 },
        ),
      };
    }
    return { organizationId: requestedOrganizationId };
  }

  if (!admin.organizationId) {
    return {
      error: NextResponse.json(
        { error: "Admin organization not configured" },
        { status: 400 },
      ),
    };
  }

  if (
    requestedOrganizationId &&
    requestedOrganizationId !== admin.organizationId
  ) {
    return {
      error: NextResponse.json(
        { error: "Cannot access another organization scope" },
        { status: 403 },
      ),
    };
  }

  return { organizationId: admin.organizationId };
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: admin.response.status || 401 },
      );
    }

    const scopedOrg = resolveScopedOrganizationId(admin, req);
    if ("error" in scopedOrg) return scopedOrg.error;

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: PDF_IMPORTS_LIST_RATE_LIMIT_MAX,
      windowMs: PDF_IMPORTS_LIST_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:pdf-imports:list",
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many PDF import list requests. Please retry later." },
        { status: 429 },
      );
    }

    const status = sanitizeText(req.nextUrl.searchParams.get("status"), {
      maxLength: 40,
    });
    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(req.nextUrl.searchParams.get("limit") || 50) || 50,
      ),
    );
    const offset = Math.max(
      0,
      Number(req.nextUrl.searchParams.get("offset") || 0) || 0,
    );

    let query = admin.adminClient
      .from("pdf_imports")
      .select("*", { count: "exact" })
      .eq("organization_id", scopedOrg.organizationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: imports, error: fetchError, count } = await query;
    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      imports: imports || [],
      total: count || 0,
      limit,
      offset,
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
