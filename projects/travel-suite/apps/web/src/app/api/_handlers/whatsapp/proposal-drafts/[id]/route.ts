/* ------------------------------------------------------------------
 * /api/whatsapp/proposal-drafts/:id
 * GET  -> read proposal draft without mutating state
 * POST -> either mark the draft opened or refresh it from session data
 * ------------------------------------------------------------------ */

import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getWhatsAppProposalDraftForOrg,
  refreshWhatsAppProposalDraft,
} from "@/lib/whatsapp/proposal-drafts.server";
import { logError } from "@/lib/observability/logger";

type ProposalDraftPostBody = {
  action?: string;
  markOpened?: boolean;
};
type ProposalDraftAdminContext = Extract<
  Awaited<ReturnType<typeof requireAdmin>>,
  { ok: true }
> & {
  organizationId: string;
};

function isProposalDraftPostBody(value: unknown): value is ProposalDraftPostBody {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function getAdminContext(
  request: Request,
): Promise<ProposalDraftAdminContext | Response> {
  const authResult = await requireAdmin(request, { requireOrganization: true });
  if (!authResult.ok) {
    return authResult.response;
  }

  if (!authResult.organizationId) {
    return apiError("Organization not configured", 400);
  }

  return {
    ...authResult,
    organizationId: authResult.organizationId,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const admin = await getAdminContext(request);
    if (admin instanceof Response) {
      return admin;
    }

    const { id } = await params;
    if (!id) {
      return apiError("Draft ID is required", 400);
    }

    const draft = await getWhatsAppProposalDraftForOrg({
      draftId: id,
      organizationId: admin.organizationId,
      markOpened: false,
    });

    if (!draft) {
      return apiError("Proposal draft not found", 404);
    }

    return apiSuccess({ draft });
  } catch (error) {
    logError("[whatsapp/proposal-drafts/:id] unexpected GET error", error);
    return apiError("Failed to load proposal draft", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const admin = await getAdminContext(request);
    if (admin instanceof Response) {
      return admin;
    }

    const { id } = await params;
    if (!id) {
      return apiError("Draft ID is required", 400);
    }

    const rawBody = await request.text();
    if (!rawBody.trim()) {
      const draft = await refreshWhatsAppProposalDraft({
        draftId: id,
        organizationId: admin.organizationId,
      });

      if (!draft) {
        return apiError("Proposal draft not found", 404);
      }

      return apiSuccess({ draft });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return apiError("Invalid JSON in request body", 400);
    }

    if (!isProposalDraftPostBody(body)) {
      return apiError("Invalid proposal draft action", 400);
    }

    if (body.markOpened === true) {
      const draft = await getWhatsAppProposalDraftForOrg({
        draftId: id,
        organizationId: admin.organizationId,
        markOpened: true,
      });

      if (!draft) {
        return apiError("Proposal draft not found", 404);
      }

      return apiSuccess({ draft });
    }

    if (body.action === undefined || body.action === "refresh") {
      const draft = await refreshWhatsAppProposalDraft({
        draftId: id,
        organizationId: admin.organizationId,
      });

      if (!draft) {
        return apiError("Proposal draft not found", 404);
      }

      return apiSuccess({ draft });
    }

    return apiError("Invalid proposal draft action", 400);
  } catch (error) {
    logError("[whatsapp/proposal-drafts/:id] unexpected POST error", error);
    return apiError("Failed to update proposal draft", 500);
  }
}
