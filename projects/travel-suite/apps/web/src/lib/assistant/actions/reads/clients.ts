/* ------------------------------------------------------------------
 * Client read actions for the TripBuilt assistant.
 *
 * Actions: search_clients, get_client_details, get_client_history
 *
 * All queries are scoped to `organization_id` from the ActionContext.
 * Every handler is wrapped in try/catch and returns a structured
 * ActionResult. No mutations -- all objects are created fresh.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

// ---------------------------------------------------------------------------
// Helper types (readonly projections from Supabase joins)
// ---------------------------------------------------------------------------

interface ClientSearchRow {
  readonly id: string;
  readonly created_at: string | null;
  readonly profiles: {
    readonly full_name: string | null;
    readonly email: string | null;
    readonly phone: string | null;
    readonly lifecycle_stage: string | null;
    readonly client_tag: string | null;
    readonly last_contacted_at: string | null;
  } | null;
}

interface ClientDetailRow {
  readonly id: string;
  readonly created_at: string | null;
  readonly profiles: {
    readonly full_name: string | null;
    readonly email: string | null;
    readonly phone: string | null;
    readonly phone_whatsapp: string | null;
    readonly lifecycle_stage: string | null;
    readonly lead_status: string | null;
    readonly client_tag: string | null;
    readonly bio: string | null;
    readonly notes: string | null;
    readonly preferred_destination: string | null;
    readonly travel_style: string | null;
    readonly budget_min: number | null;
    readonly budget_max: number | null;
    readonly interests: string[] | null;
    readonly dietary_requirements: string[] | null;
    readonly travelers_count: number | null;
    readonly home_airport: string | null;
    readonly marketing_opt_in: boolean | null;
    readonly last_contacted_at: string | null;
    readonly source_channel: string | null;
    readonly referral_source: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (iso === null) return "N/A";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// 1. search_clients
// ---------------------------------------------------------------------------

const searchClients: ActionDefinition = {
  name: "search_clients",
  description:
    "Search clients by name, email, phone, or lifecycle stage",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Text to search in client name, email, or phone",
      },
      lifecycle_stage: {
        type: "string",
        description: "Filter by lifecycle stage",
        enum: [
          "new_lead",
          "contacted",
          "qualified",
          "proposal_sent",
          "payment_confirmed",
          "trip_completed",
        ],
      },
      tag: {
        type: "string",
        description: "Filter by client tag",
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default 10, max 20)",
      },
    },
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const query = typeof params.query === "string" ? params.query : undefined;
      const lifecycleStage =
        typeof params.lifecycle_stage === "string"
          ? params.lifecycle_stage
          : undefined;
      const tag = typeof params.tag === "string" ? params.tag : undefined;
      const rawLimit =
        typeof params.limit === "number" ? params.limit : 10;
      const limit = Math.min(Math.max(1, rawLimit), 20);

      let builder = ctx.supabase
        .from("clients")
        .select(
          "id, created_at, profiles!clients_id_fkey(full_name, email, phone, lifecycle_stage, client_tag, last_contacted_at)",
        )
        .eq("organization_id", ctx.organizationId)
        .limit(limit);

      if (query) {
        builder = builder.or(
          `full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`,
          { referencedTable: "profiles" },
        );
      }

      if (lifecycleStage) {
        builder = builder.eq(
          "profiles.lifecycle_stage" as never,
          lifecycleStage,
        );
      }

      if (tag) {
        builder = builder.eq("profiles.client_tag" as never, tag);
      }

      const { data, error } = await builder;

      if (error) {
        return {
          success: false,
          message: `Failed to search clients: ${error.message}`,
        };
      }

      const rows = (data ?? []) as unknown as readonly ClientSearchRow[];

      // Filter out rows where the profile join returned null (possible when
      // lifecycle_stage / tag filters cause an empty inner-join result).
      const clients = rows.filter((r) => r.profiles !== null);

      if (clients.length === 0) {
        return {
          success: true,
          data: [],
          message: "No clients found matching your search criteria.",
        };
      }

      const lines = clients.map((row) => {
        const p = row.profiles!;
        const name = p.full_name ?? "Unnamed";
        const email = p.email ?? "no email";
        const stage = p.lifecycle_stage ?? "unknown";
        const lastContact = p.last_contacted_at
          ? `last contacted ${formatDate(p.last_contacted_at)}`
          : "never contacted";
        const tagLabel = p.client_tag ? ` [${p.client_tag}]` : "";
        return `- ${name} (${email}) -- ${stage}${tagLabel}, ${lastContact}`;
      });

      const message = [
        `Found ${clients.length} client${clients.length === 1 ? "" : "s"}:`,
        ...lines,
      ].join("\n");

      return {
        success: true,
        data: clients,
        message,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Failed to search clients: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 2. get_client_details
// ---------------------------------------------------------------------------

const getClientDetails: ActionDefinition = {
  name: "get_client_details",
  description:
    "Get full details of a specific client including their profile, travel preferences, and contact info",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "The UUID of the client to look up",
      },
    },
    required: ["client_id"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const clientId = params.client_id as string;

      if (typeof clientId !== "string" || clientId.length === 0) {
        return {
          success: false,
          message: "A valid client_id is required.",
        };
      }

      const { data, error } = await ctx.supabase
        .from("clients")
        .select(
          `id, created_at, profiles!clients_id_fkey(
            full_name, email, phone, phone_whatsapp,
            lifecycle_stage, lead_status, client_tag,
            bio, notes,
            preferred_destination, travel_style,
            budget_min, budget_max,
            interests, dietary_requirements,
            travelers_count, home_airport,
            marketing_opt_in, last_contacted_at,
            source_channel, referral_source
          )`,
        )
        .eq("id", clientId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (error) {
        return {
          success: false,
          message: `Failed to fetch client details: ${error.message}`,
        };
      }

      if (!data) {
        return {
          success: false,
          message:
            "Client not found. They may not exist or may belong to a different organization.",
        };
      }

      const row = data as unknown as ClientDetailRow;
      const p = row.profiles;

      if (!p) {
        return {
          success: false,
          message: "Client record exists but the profile could not be loaded.",
        };
      }

      const sections: string[] = [];

      // -- Identity --
      sections.push(`## ${p.full_name ?? "Unnamed Client"}`);
      sections.push(`ID: ${row.id}`);

      // -- Contact --
      const contactLines: string[] = [];
      if (p.email) contactLines.push(`Email: ${p.email}`);
      if (p.phone) contactLines.push(`Phone: ${p.phone}`);
      if (p.phone_whatsapp) contactLines.push(`WhatsApp: ${p.phone_whatsapp}`);
      if (contactLines.length > 0) {
        sections.push(`\n### Contact\n${contactLines.join("\n")}`);
      }

      // -- Status --
      const statusLines: string[] = [];
      if (p.lifecycle_stage)
        statusLines.push(`Stage: ${p.lifecycle_stage}`);
      if (p.lead_status) statusLines.push(`Lead status: ${p.lead_status}`);
      if (p.client_tag) statusLines.push(`Tag: ${p.client_tag}`);
      if (p.source_channel)
        statusLines.push(`Source channel: ${p.source_channel}`);
      if (p.referral_source)
        statusLines.push(`Referral source: ${p.referral_source}`);
      if (p.last_contacted_at)
        statusLines.push(
          `Last contacted: ${formatDate(p.last_contacted_at)}`,
        );
      statusLines.push(
        `Marketing opt-in: ${p.marketing_opt_in ? "Yes" : "No"}`,
      );
      sections.push(`\n### Status\n${statusLines.join("\n")}`);

      // -- Travel preferences --
      const prefLines: string[] = [];
      if (p.preferred_destination)
        prefLines.push(`Preferred destination: ${p.preferred_destination}`);
      if (p.travel_style)
        prefLines.push(`Travel style: ${p.travel_style}`);
      if (p.budget_min !== null || p.budget_max !== null) {
        const min = p.budget_min !== null ? p.budget_min.toLocaleString() : "?";
        const max = p.budget_max !== null ? p.budget_max.toLocaleString() : "?";
        prefLines.push(`Budget range: ${min} - ${max}`);
      }
      if (p.travelers_count !== null)
        prefLines.push(`Travelers count: ${p.travelers_count}`);
      if (p.home_airport)
        prefLines.push(`Home airport: ${p.home_airport}`);
      if (p.interests && p.interests.length > 0)
        prefLines.push(`Interests: ${p.interests.join(", ")}`);
      if (p.dietary_requirements && p.dietary_requirements.length > 0)
        prefLines.push(
          `Dietary requirements: ${p.dietary_requirements.join(", ")}`,
        );
      if (prefLines.length > 0) {
        sections.push(
          `\n### Travel Preferences\n${prefLines.join("\n")}`,
        );
      }

      // -- Notes --
      if (p.bio || p.notes) {
        const noteLines: string[] = [];
        if (p.bio) noteLines.push(`Bio: ${p.bio}`);
        if (p.notes) noteLines.push(`Notes: ${p.notes}`);
        sections.push(`\n### Notes\n${noteLines.join("\n")}`);
      }

      const message = sections.join("\n");

      return {
        success: true,
        data: row,
        message,
        affectedEntities: [{ type: "client", id: row.id }],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Failed to fetch client details: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 3. get_client_history
// ---------------------------------------------------------------------------

const getClientHistory: ActionDefinition = {
  name: "get_client_history",
  description:
    "Get a client's trip history, invoices, and proposals",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "The UUID of the client whose history to retrieve",
      },
    },
    required: ["client_id"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const clientId = params.client_id as string;

      if (typeof clientId !== "string" || clientId.length === 0) {
        return {
          success: false,
          message: "A valid client_id is required.",
        };
      }

      // Verify the client belongs to this organisation
      const { data: clientRow, error: clientError } = await ctx.supabase
        .from("clients")
        .select("id")
        .eq("id", clientId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (clientError) {
        return {
          success: false,
          message: `Failed to verify client: ${clientError.message}`,
        };
      }

      if (!clientRow) {
        return {
          success: false,
          message:
            "Client not found. They may not exist or may belong to a different organization.",
        };
      }

      // Fetch trips, invoices, and proposals in parallel
      const [tripsResult, invoicesResult, proposalsResult] =
        await Promise.all([
          ctx.supabase
            .from("trips")
            .select("id, status, start_date, end_date")
            .eq("client_id", clientId)
            .eq("organization_id", ctx.organizationId)
            .order("start_date", { ascending: false })
            .limit(10),

          ctx.supabase
            .from("invoices")
            .select(
              "id, invoice_number, status, total_amount, balance_amount, currency, due_date",
            )
            .eq("client_id", clientId)
            .eq("organization_id", ctx.organizationId)
            .order("created_at", { ascending: false })
            .limit(10),

          ctx.supabase
            .from("proposals")
            .select("id, title, status, total_price, created_at")
            .eq("client_id", clientId)
            .eq("organization_id", ctx.organizationId)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      const trips = tripsResult.data ?? [];
      const invoices = invoicesResult.data ?? [];
      const proposals = proposalsResult.data ?? [];

      const sections: string[] = [];

      // -- Trips --
      sections.push(`### Trips (${trips.length})`);
      if (trips.length > 0) {
        const tripLines = trips.map((t) => {
          const status = t.status ?? "unknown";
          const dates = `${formatDate(t.start_date)} - ${formatDate(t.end_date)}`;
          return `- ${dates} (${status})`;
        });
        sections.push(tripLines.join("\n"));
      } else {
        sections.push("No trips found.");
      }

      // -- Invoices --
      sections.push(`\n### Invoices (${invoices.length})`);
      if (invoices.length > 0) {
        const invoiceLines = invoices.map((inv) => {
          const total = formatCurrency(inv.total_amount, inv.currency);
          const balance = formatCurrency(inv.balance_amount, inv.currency);
          const due = inv.due_date
            ? `, due ${formatDate(inv.due_date)}`
            : "";
          return `- #${inv.invoice_number}: ${total} (balance: ${balance}, ${inv.status}${due})`;
        });
        sections.push(invoiceLines.join("\n"));
      } else {
        sections.push("No invoices found.");
      }

      // -- Proposals --
      sections.push(`\n### Proposals (${proposals.length})`);
      if (proposals.length > 0) {
        const proposalLines = proposals.map((pr) => {
          const price =
            pr.total_price !== null
              ? pr.total_price.toLocaleString()
              : "N/A";
          const created = formatDate(pr.created_at);
          return `- "${pr.title}" -- ${pr.status ?? "unknown"}, price: ${price}, created ${created}`;
        });
        sections.push(proposalLines.join("\n"));
      } else {
        sections.push("No proposals found.");
      }

      const message = sections.join("\n");

      return {
        success: true,
        data: { trips, invoices, proposals },
        message,
        affectedEntities: [{ type: "client", id: clientId }],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Failed to fetch client history: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export const clientActions: readonly ActionDefinition[] = [
  searchClients,
  getClientDetails,
  getClientHistory,
];
