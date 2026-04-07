import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request, { requireOrganization: true });
  if (!auth.ok) return auth.response;

  const { organizationId, adminClient } = auth;
  const { id: tripId } = await params;

  const { data: linkedProposal } = await adminClient
    .from("proposals")
    .select("share_token")
    .eq("trip_id", tripId)
    .eq("organization_id", organizationId!)
    .not("share_token", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkedProposal?.share_token) {
    return apiSuccess({ portalToken: linkedProposal.share_token });
  }

  // Fallback for legacy trips whose proposals were never linked
  const { data: trip } = await adminClient
    .from("trips")
    .select("client_id")
    .eq("id", tripId)
    .eq("organization_id", organizationId!)
    .maybeSingle();

  if (!trip?.client_id) {
    return apiSuccess({ portalToken: null });
  }

  // Find the most recent proposal with a share_token for this client + org
  const { data: proposal } = await adminClient
    .from("proposals")
    .select("share_token")
    .eq("client_id", trip.client_id)
    .eq("organization_id", organizationId!)
    .not("share_token", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return apiSuccess({ portalToken: proposal?.share_token ?? null });
}
