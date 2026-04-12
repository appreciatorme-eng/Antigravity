import type { SupabaseClient } from "@supabase/supabase-js";
import {
  findRepairablePipelineProposalIds,
} from "@/lib/proposals/pipeline-integrity";

type AdminMutationClient = Pick<SupabaseClient, "from">;

type ProposalRepairRow = {
  id: string;
  title: string | null;
  status: string | null;
  client_id: string | null;
  trip_id: string | null;
  total_price: number | null;
  client_selected_price: number | null;
  created_at: string | null;
  updated_at: string | null;
  trips:
    | {
        id?: string | null;
      }
    | {
        id?: string | null;
      }[]
    | null;
};

function isMissingDeletedAtError(message: string | null | undefined): boolean {
  const normalized = (message || "").toLowerCase();
  return normalized.includes("deleted_at") && normalized.includes("column");
}

async function softDeleteRowsByIds(params: {
  client: AdminMutationClient;
  table: "proposals" | "invoices";
  ids: string[];
  organizationId: string;
}): Promise<boolean> {
  if (params.ids.length === 0) return true;

  const { error } = await (params.client.from(params.table) as unknown as {
    update: (values: Record<string, unknown>) => {
      in: (column: string, values: string[]) => {
        eq: (column: string, value: string) => Promise<{ error: { message?: string | null } | null }>;
      };
    };
  })
    .update({ deleted_at: new Date().toISOString() })
    .in("id", params.ids)
    .eq("organization_id", params.organizationId);

  if (error) {
    if (isMissingDeletedAtError(error.message)) return false;
    throw error;
  }

  return true;
}

export async function softDeleteCommercialRowsForDeletedTripContext(params: {
  client: AdminMutationClient;
  organizationId: string;
  tripIds: string[];
  clientId?: string | null;
  titleHints?: string[];
}): Promise<void> {
  if (params.tripIds.length === 0 && !params.clientId) return;

  const proposalIds = new Set<string>();

  if (params.tripIds.length > 0) {
    const { data: linkedProposals, error: linkedProposalError } = await (params.client
      .from("proposals")
      .select("id")
      .eq("organization_id", params.organizationId)
      .in("trip_id", params.tripIds) as unknown as Promise<{
      data: Array<{ id: string }> | null;
      error: { message?: string | null } | null;
    }>);

    if (linkedProposalError) {
      throw linkedProposalError;
    }

    for (const row of linkedProposals || []) {
      proposalIds.add(row.id);
    }
  }

  const cleanedTitleHints = Array.from(
    new Set((params.titleHints || []).map((title) => title.trim()).filter(Boolean)),
  );

  if (params.clientId && cleanedTitleHints.length > 0) {
    const { data: unlinkedProposals, error: unlinkedProposalError } = await (params.client
      .from("proposals")
      .select("id")
      .eq("organization_id", params.organizationId)
      .eq("client_id", params.clientId)
      .is("trip_id", null)
      .in("title", cleanedTitleHints) as unknown as Promise<{
      data: Array<{ id: string }> | null;
      error: { message?: string | null } | null;
    }>);

    if (unlinkedProposalError && !isMissingDeletedAtError(unlinkedProposalError.message)) {
      throw unlinkedProposalError;
    }

    for (const row of unlinkedProposals || []) {
      proposalIds.add(row.id);
    }
  }

  await softDeleteRowsByIds({
    client: params.client,
    table: "proposals",
    ids: Array.from(proposalIds),
    organizationId: params.organizationId,
  });

  if (params.tripIds.length > 0) {
    const { data: linkedInvoices, error: linkedInvoiceError } = await (params.client
      .from("invoices")
      .select("id")
      .eq("organization_id", params.organizationId)
      .in("trip_id", params.tripIds) as unknown as Promise<{
      data: Array<{ id: string }> | null;
      error: { message?: string | null } | null;
    }>);

    if (linkedInvoiceError && !isMissingDeletedAtError(linkedInvoiceError.message)) {
      throw linkedInvoiceError;
    }

    await softDeleteRowsByIds({
      client: params.client,
      table: "invoices",
      ids: (linkedInvoices || []).map((invoice) => invoice.id),
      organizationId: params.organizationId,
    });
  }
}

export async function repairPipelineProposalIntegrity(params: {
  client: AdminMutationClient;
  organizationId: string;
}): Promise<string[]> {
  const select =
    "id,title,status,client_id,trip_id,total_price,client_selected_price,created_at,updated_at,trips:trip_id(id)";

  let result = await (params.client.from("proposals") as unknown as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        is: (column: string, value: null) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{
            data: ProposalRepairRow[] | null;
            error: { message?: string | null } | null;
          }>;
        };
      };
    };
  })
    .select(select)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (result.error && isMissingDeletedAtError(result.error.message)) {
    result = await (params.client.from("proposals") as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{
            data: ProposalRepairRow[] | null;
            error: { message?: string | null } | null;
          }>;
        };
      };
    })
      .select(select)
      .eq("organization_id", params.organizationId)
      .order("created_at", { ascending: false });
  }

  if (result.error || !result.data) {
    return [];
  }

  const repairableIds = findRepairablePipelineProposalIds(result.data);
  if (repairableIds.length === 0) {
    return [];
  }

  await softDeleteRowsByIds({
    client: params.client,
    table: "proposals",
    ids: repairableIds,
    organizationId: params.organizationId,
  });

  return repairableIds;
}
