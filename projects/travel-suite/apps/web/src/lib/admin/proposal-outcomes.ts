const WON_PROPOSAL_STATUSES = new Set(["approved", "accepted", "confirmed", "converted"]);
const LOST_PROPOSAL_STATUSES = new Set(["rejected", "expired", "cancelled"]);
const WON_TRIP_STATUSES = new Set(["confirmed", "in_progress", "active", "completed"]);

type JoinedTripStatus =
  | {
      status?: string | null;
    }
  | {
      status?: string | null;
    }[]
  | null
  | undefined;

type ProposalOutcomeLike = {
  status?: string | null;
  trips?: JoinedTripStatus;
};

function normalize(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function normalizeJoinedTripStatus(trips: JoinedTripStatus): string {
  if (Array.isArray(trips)) {
    return normalize(trips[0]?.status);
  }
  return normalize(trips?.status);
}

export function isWonProposal(proposal: ProposalOutcomeLike): boolean {
  const proposalStatus = normalize(proposal.status);
  if (WON_PROPOSAL_STATUSES.has(proposalStatus)) {
    return true;
  }

  const tripStatus = normalizeJoinedTripStatus(proposal.trips);
  return WON_TRIP_STATUSES.has(tripStatus);
}

export function isLostProposal(proposal: ProposalOutcomeLike): boolean {
  return LOST_PROPOSAL_STATUSES.has(normalize(proposal.status));
}
