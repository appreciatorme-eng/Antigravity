/* ------------------------------------------------------------------
 * Proposal read actions for the TripBuilt assistant.
 *
 * Proposals reference clients via `proposals_client_id_fkey`, and
 * clients reference profiles via `clients_id_fkey` for contact info.
 *
 * Every query is scoped to the caller's organisation.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape returned by the Supabase nested join:
 *   proposals -> clients (proposals_client_id_fkey) -> profiles (clients_id_fkey)
 *
 * Supabase's generated types cannot resolve multi-level foreign key joins,
 * so we define the expected row shape and cast the result.
 */
interface ProposalRow {
  readonly id: string;
  readonly title: string;
  readonly status: string | null;
  readonly total_price: number | null;
  readonly created_at: string | null;
  readonly expires_at: string | null;
  readonly viewed_at: string | null;
  readonly approved_at: string | null;
  readonly share_token: string;
  readonly clients: {
    readonly id: string;
    readonly profiles: {
      readonly full_name: string | null;
      readonly email: string | null;
    } | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shared select string for proposal queries with client/profile joins. */
const PROPOSAL_SELECT = [
  "id",
  "title",
  "status",
  "total_price",
  "created_at",
  "expires_at",
  "viewed_at",
  "approved_at",
  "share_token",
  "clients!proposals_client_id_fkey(id, profiles!clients_id_fkey(full_name, email))",
].join(", ");

/** Valid proposal status values. */
const VALID_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "approved",
  "rejected",
  "expired",
] as const;

type ProposalStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: string): value is ProposalStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

/** Extract client name and email from the nested join result. */
function extractClientInfo(clients: unknown): {
  readonly name: string;
  readonly email: string;
} {
  if (clients === null || clients === undefined || typeof clients !== "object") {
    return { name: "Unknown client", email: "N/A" };
  }

  const client = clients as Record<string, unknown>;
  const profiles = client.profiles as
    | { full_name: string | null; email: string | null }
    | null;

  return {
    name: profiles?.full_name ?? "Unknown client",
    email: profiles?.email ?? "N/A",
  };
}

/** Format an ISO date string into a short form, or return "N/A". */
function formatDate(isoDate: string | null): string {
  if (isoDate === null) {
    return "N/A";
  }
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format a price for display. */
function formatPrice(price: number | null): string {
  if (price === null) {
    return "N/A";
  }
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });
}

// ---------------------------------------------------------------------------
// search_proposals
// ---------------------------------------------------------------------------

const searchProposals: ActionDefinition = {
  name: "search_proposals",
  description: "Search proposals by client name, title, or status",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search in proposal title or client name",
      },
      status: {
        type: "string",
        description:
          "Filter by status: draft, sent, viewed, approved, rejected, or expired",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default 10)",
      },
    },
  },

  async execute(
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    try {
      const query = typeof params.query === "string" ? params.query : undefined;
      const status =
        typeof params.status === "string" ? params.status : undefined;
      const limit =
        typeof params.limit === "number" && params.limit > 0
          ? params.limit
          : 10;

      if (status !== undefined && !isValidStatus(status)) {
        return {
          success: false,
          message: `Invalid status "${status}". Valid values: ${VALID_STATUSES.join(", ")}.`,
        };
      }

      // Supabase cannot resolve the nested FK join at the type level,
      // so we build the query untyped and cast the result to ProposalRow[].
      let request = ctx.supabase
        .from("proposals")
        .select(PROPOSAL_SELECT)
        .eq("organization_id", ctx.organizationId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status !== undefined) {
        request = request.eq("status", status);
      }

      if (query !== undefined) {
        // Filter by title matching -- client name filtering happens post-query
        // because Supabase does not support ilike on nested joins easily.
        request = request.ilike("title", `%${query}%`);
      }

      const { data: rawData, error } = await request;

      if (error) {
        return {
          success: false,
          message: `Failed to search proposals: ${error.message}`,
        };
      }

      const data = rawData as unknown as ProposalRow[] | null;

      if (!data || data.length === 0) {
        const parts: string[] = [];
        if (query !== undefined) parts.push(`matching "${query}"`);
        if (status !== undefined) parts.push(`with status "${status}"`);
        const qualifier = parts.length > 0 ? ` ${parts.join(" ")}` : "";
        return {
          success: true,
          data: [],
          message: `No proposals found${qualifier}.`,
        };
      }

      const proposals = data.map((row) => {
        const client = extractClientInfo(row.clients);
        return {
          id: row.id,
          title: row.title,
          status: row.status ?? "unknown",
          totalPrice: row.total_price,
          clientName: client.name,
          clientEmail: client.email,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
        };
      });

      // If the user searched by query and the title didn't match, also check
      // client name in the post-query results (best-effort client name filter).
      const filtered =
        query !== undefined
          ? proposals.filter(
              (p) =>
                p.title.toLowerCase().includes(query.toLowerCase()) ||
                p.clientName.toLowerCase().includes(query.toLowerCase()),
            )
          : proposals;

      if (filtered.length === 0) {
        return {
          success: true,
          data: [],
          message: `No proposals found matching "${query}".`,
        };
      }

      const lines = filtered.map(
        (p) =>
          `- "${p.title}" | Client: ${p.clientName} | Status: ${p.status} | Price: ${formatPrice(p.totalPrice)} | Created: ${formatDate(p.createdAt)}`,
      );

      return {
        success: true,
        data: filtered,
        message: `Found ${filtered.length} proposal(s):\n${lines.join("\n")}`,
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error searching proposals";
      return {
        success: false,
        message: `Error searching proposals: ${message}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// get_proposal_details
// ---------------------------------------------------------------------------

const getProposalDetails: ActionDefinition = {
  name: "get_proposal_details",
  description:
    "Get full details of a specific proposal including client info, pricing, and timeline",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      proposal_id: {
        type: "string",
        description: "The UUID of the proposal to retrieve",
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

      const { data: rawData, error } = await ctx.supabase
        .from("proposals")
        .select(PROPOSAL_SELECT)
        .eq("id", proposalId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (error) {
        return {
          success: false,
          message: `Failed to fetch proposal: ${error.message}`,
        };
      }

      const data = rawData as unknown as ProposalRow | null;

      if (!data) {
        return {
          success: false,
          message: `No proposal found with ID "${proposalId}" in your organisation.`,
        };
      }

      const client = extractClientInfo(data.clients);

      const detail = {
        id: data.id,
        title: data.title,
        status: data.status ?? "unknown",
        totalPrice: data.total_price,
        clientName: client.name,
        clientEmail: client.email,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        viewedAt: data.viewed_at,
        approvedAt: data.approved_at,
        hasShareToken: Boolean(data.share_token),
      };

      const messageParts = [
        `Proposal: "${detail.title}"`,
        `Client: ${detail.clientName} (${detail.clientEmail})`,
        `Status: ${detail.status}`,
        `Price: ${formatPrice(detail.totalPrice)}`,
        `Created: ${formatDate(detail.createdAt)}`,
        `Expires: ${formatDate(detail.expiresAt)}`,
        `Viewed: ${formatDate(detail.viewedAt)}`,
        `Approved: ${formatDate(detail.approvedAt)}`,
        detail.hasShareToken
          ? "Share link: available (use the app to send)"
          : "Share link: not yet generated",
      ];

      return {
        success: true,
        data: detail,
        message: messageParts.join("\n"),
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error fetching proposal details";
      return {
        success: false,
        message: `Error fetching proposal details: ${message}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export const proposalActions: readonly ActionDefinition[] = [
  searchProposals,
  getProposalDetails,
];
