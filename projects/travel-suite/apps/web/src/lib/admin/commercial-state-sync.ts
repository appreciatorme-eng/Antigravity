type AdminClient = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;

const SYNCABLE_PROPOSAL_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "pending",
  "accepted",
  "approved",
  "read",
  "confirmed",
  "converted",
  "paid",
] as const;

export async function syncWonCommercialState(params: {
  adminClient: AdminClient;
  organizationId: string;
  tripId?: string | null;
  proposalId?: string | null;
  confirmDraftTrip?: boolean;
}) {
  const { adminClient, organizationId, confirmDraftTrip = false } = params;
  let resolvedProposalId = params.proposalId || null;
  let resolvedTripId = params.tripId || null;

  if (resolvedProposalId) {
    const { data: proposal } = await adminClient
      .from("proposals")
      .select("id, trip_id")
      .eq("id", resolvedProposalId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (proposal?.trip_id && !resolvedTripId) {
      resolvedTripId = proposal.trip_id;
    }
  }

  if (resolvedTripId && !resolvedProposalId) {
    const { data: proposal } = await adminClient
      .from("proposals")
      .select("id, trip_id")
      .eq("trip_id", resolvedTripId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proposal?.id) {
      resolvedProposalId = proposal.id;
      if (!resolvedTripId && proposal.trip_id) {
        resolvedTripId = proposal.trip_id;
      }
    }
  }

  if (confirmDraftTrip && resolvedTripId) {
    await adminClient
      .from("trips")
      .update({ status: "confirmed" })
      .eq("id", resolvedTripId)
      .eq("organization_id", organizationId)
      .in("status", ["draft"]);
  }

  if (resolvedProposalId) {
    const proposalPatch: { status: string; trip_id?: string } = {
      status: "converted",
    };
    if (resolvedTripId) {
      proposalPatch.trip_id = resolvedTripId;
    }

    await adminClient
      .from("proposals")
      .update(proposalPatch)
      .eq("id", resolvedProposalId)
      .eq("organization_id", organizationId)
      .in("status", [...SYNCABLE_PROPOSAL_STATUSES]);
  }

  return {
    proposalId: resolvedProposalId,
    tripId: resolvedTripId,
  };
}
