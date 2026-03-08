import { apiError, apiSuccess } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import {
  getWhatsAppProposalDraftForOrg,
  refreshWhatsAppProposalDraft,
} from "@/lib/whatsapp/proposal-drafts.server";

async function getOrganizationId() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: apiError("Unauthorized", 401) } as const;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: apiError("Failed to load profile", 500) } as const;
  }

  if (!profile?.organization_id) {
    return { error: apiError("Organization not found", 404) } as const;
  }

  return { organizationId: profile.organization_id } as const;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organization = await getOrganizationId();
    if ("error" in organization) {
      return organization.error;
    }

    const { id } = await params;
    const draft = await getWhatsAppProposalDraftForOrg({
      draftId: id,
      organizationId: organization.organizationId,
      markOpened: true,
    });

    if (!draft) {
      return apiError("Proposal draft not found", 404);
    }

    return apiSuccess({ draft });
  } catch (error) {
    console.error("[whatsapp/proposal-drafts/:id] unexpected GET error:", error);
    return apiError("Failed to load proposal draft", 500);
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organization = await getOrganizationId();
    if ("error" in organization) {
      return organization.error;
    }

    const { id } = await params;
    const draft = await refreshWhatsAppProposalDraft({
      draftId: id,
      organizationId: organization.organizationId,
    });

    if (!draft) {
      return apiError("Proposal draft not found", 404);
    }

    return apiSuccess({ draft });
  } catch (error) {
    console.error("[whatsapp/proposal-drafts/:id] unexpected POST error:", error);
    return apiError("Failed to refresh proposal draft", 500);
  }
}
