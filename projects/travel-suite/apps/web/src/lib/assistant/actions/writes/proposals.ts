/* ------------------------------------------------------------------
 * Proposal write actions for the TripBuilt assistant.
 *
 * Actions: send_proposal, convert_proposal_to_trip
 *
 * All queries are scoped to `organization_id` from the ActionContext.
 * Every handler is wrapped in try/catch and returns a structured
 * ActionResult. Immutable patterns used throughout.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

// ---------------------------------------------------------------------------
// Helper types
// ---------------------------------------------------------------------------

/**
 * Shape returned by the Supabase nested join:
 *   proposals -> clients (proposals_client_id_fkey) -> profiles (clients_id_fkey)
 */
interface ProposalWithClient {
  readonly id: string;
  readonly title: string;
  readonly status: string | null;
  readonly client_id: string;
  readonly total_price: number | null;
  readonly clients: {
    readonly id: string;
    readonly profiles: {
      readonly full_name: string | null;
    } | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Select string for proposal queries with client/profile name join. */
const PROPOSAL_WITH_CLIENT_SELECT = [
  "id",
  "title",
  "status",
  "client_id",
  "total_price",
  "clients!proposals_client_id_fkey(id, profiles!clients_id_fkey(full_name))",
].join(", ");

/** Extract client name from the nested join result. */
function extractClientName(clients: unknown): string {
  if (clients === null || clients === undefined || typeof clients !== "object") {
    return "Unknown client";
  }

  const client = clients as Record<string, unknown>;
  const profiles = client.profiles as
    | { full_name: string | null }
    | null;

  return profiles?.full_name ?? "Unknown client";
}

// ---------------------------------------------------------------------------
// 1. send_proposal
// ---------------------------------------------------------------------------

const sendProposal: ActionDefinition = {
  name: "send_proposal",
  description: "Send a proposal to a client (updates status to 'sent')",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      proposal_id: {
        type: "string",
        description: "The UUID of the proposal to send",
      },
    },
    required: ["proposal_id"],
  },

  async execute(
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    try {
      const proposalId =
        typeof params.proposal_id === "string"
          ? params.proposal_id
          : undefined;

      if (proposalId === undefined) {
        return {
          success: false,
          message: "proposal_id is required.",
        };
      }

      // Verify proposal belongs to org and fetch current state
      const { data: rawData, error: fetchError } = await ctx.supabase
        .from("proposals")
        .select(PROPOSAL_WITH_CLIENT_SELECT)
        .eq("id", proposalId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (fetchError) {
        return {
          success: false,
          message: `Failed to fetch proposal: ${fetchError.message}`,
        };
      }

      const proposal = rawData as unknown as ProposalWithClient | null;

      if (!proposal) {
        return {
          success: false,
          message: `No proposal found with ID "${proposalId}" in your organisation.`,
        };
      }

      // Can only send drafts
      if (proposal.status !== "draft") {
        return {
          success: false,
          message: `Cannot send this proposal because its status is "${proposal.status ?? "unknown"}". Only proposals in "draft" status can be sent.`,
        };
      }

      // Update status to 'sent'
      const { error: updateError } = await ctx.supabase
        .from("proposals")
        .update({ status: "sent" })
        .eq("id", proposalId)
        .eq("organization_id", ctx.organizationId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to update proposal status: ${updateError.message}`,
        };
      }

      const clientName = extractClientName(proposal.clients);

      return {
        success: true,
        data: {
          proposalId: proposal.id,
          title: proposal.title,
          clientName,
          previousStatus: "draft",
          newStatus: "sent",
        },
        message: `Proposal "${proposal.title}" has been sent to ${clientName}.`,
        affectedEntities: [{ type: "proposal", id: proposal.id }],
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error sending proposal";
      return {
        success: false,
        message: `Error sending proposal: ${message}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 2. convert_proposal_to_trip
// ---------------------------------------------------------------------------

const convertProposalToTrip: ActionDefinition = {
  name: "convert_proposal_to_trip",
  description: "Convert an approved proposal into a new trip",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      proposal_id: {
        type: "string",
        description: "The UUID of the approved proposal to convert",
      },
    },
    required: ["proposal_id"],
  },

  async execute(
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    try {
      const proposalId =
        typeof params.proposal_id === "string"
          ? params.proposal_id
          : undefined;

      if (proposalId === undefined) {
        return {
          success: false,
          message: "proposal_id is required.",
        };
      }

      // Verify proposal belongs to org and fetch details
      const { data: rawData, error: fetchError } = await ctx.supabase
        .from("proposals")
        .select(PROPOSAL_WITH_CLIENT_SELECT)
        .eq("id", proposalId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (fetchError) {
        return {
          success: false,
          message: `Failed to fetch proposal: ${fetchError.message}`,
        };
      }

      const proposal = rawData as unknown as ProposalWithClient | null;

      if (!proposal) {
        return {
          success: false,
          message: `No proposal found with ID "${proposalId}" in your organisation.`,
        };
      }

      // Can only convert approved proposals
      if (proposal.status !== "approved") {
        return {
          success: false,
          message: `Cannot convert this proposal because its status is "${proposal.status ?? "unknown"}". Only proposals with "approved" status can be converted to trips.`,
        };
      }

      const clientName = extractClientName(proposal.clients);

      // Insert a new trip from the proposal details
      const { data: newTrip, error: insertError } = await ctx.supabase
        .from("trips")
        .insert({
          client_id: proposal.client_id,
          organization_id: ctx.organizationId,
          status: "planned",
          notes: `Created from proposal "${proposal.title}" (ID: ${proposal.id})`,
        })
        .select("id")
        .single();

      if (insertError) {
        return {
          success: false,
          message: `Failed to create trip: ${insertError.message}`,
        };
      }

      // Update proposal status to 'converted'
      const { error: updateError } = await ctx.supabase
        .from("proposals")
        .update({ status: "converted" })
        .eq("id", proposalId)
        .eq("organization_id", ctx.organizationId);

      if (updateError) {
        // Trip was created but proposal status update failed -- report partial success
        return {
          success: true,
          data: {
            tripId: newTrip.id,
            proposalId: proposal.id,
            clientName,
            warning: "Trip was created but the proposal status could not be updated.",
          },
          message: `Trip created (ID: ${newTrip.id}) for ${clientName}, but the proposal status could not be updated to "converted": ${updateError.message}`,
          affectedEntities: [
            { type: "trip", id: newTrip.id },
            { type: "proposal", id: proposal.id },
          ],
        };
      }

      return {
        success: true,
        data: {
          tripId: newTrip.id,
          proposalId: proposal.id,
          title: proposal.title,
          clientName,
          totalPrice: proposal.total_price,
        },
        message: `Proposal "${proposal.title}" has been converted into a new trip (ID: ${newTrip.id}) for ${clientName}. The trip status is "planned".`,
        affectedEntities: [
          { type: "trip", id: newTrip.id },
          { type: "proposal", id: proposal.id },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error converting proposal to trip";
      return {
        success: false,
        message: `Error converting proposal to trip: ${message}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export const proposalWriteActions: readonly ActionDefinition[] = [
  sendProposal,
  convertProposalToTrip,
];
