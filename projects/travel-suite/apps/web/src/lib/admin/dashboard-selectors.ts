import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DashboardHealth,
  DashboardHealthSourceKey,
  DashboardSourceHealth,
} from "@/lib/admin/dashboard-overview-types";
import { repairPipelineProposalIntegrity } from "@/lib/admin/proposal-cleanup";
import { normalizeStatus } from "@/lib/admin/insights";

export type AdminQueryClient = Pick<SupabaseClient, "from">;

export type ProposalSelectorRow = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  viewed_at: string | null;
  expires_at: string | null;
  total_price: number | null;
  client_selected_price: number | null;
  client_id: string | null;
  trip_id: string | null;
  trips:
    | {
        id?: string | null;
        status: string | null;
        start_date?: string | null;
        end_date?: string | null;
      }
    | {
        id?: string | null;
        status: string | null;
        start_date?: string | null;
        end_date?: string | null;
      }[]
    | null;
};

export type TripSelectorRow = {
  id: string;
  itinerary_id: string | null;
  client_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  start_date: string | null;
  end_date: string | null;
  destination?: string | null;
  name?: string | null;
};

export type InvoiceSelectorRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  due_date: string | null;
  balance_amount: number | null;
  total_amount: number | null;
  created_at: string | null;
  updated_at: string | null;
  paid_at: string | null;
  client_id: string | null;
  trip_id: string | null;
};

export type PaymentLinkSelectorRow = {
  id: string;
  status: string | null;
  amount_paise: number | null;
  paid_at: string | null;
  created_at: string | null;
  proposal_id: string | null;
  booking_id: string | null;
};

export type InvoicePaymentSelectorRow = {
  id: string;
  status: string | null;
  amount: number | null;
  payment_date: string | null;
  created_at: string | null;
  invoice_id: string | null;
};

export type CommercialPaymentSelectorRow = {
  id: string;
  trip_id: string | null;
  proposal_id: string | null;
  invoice_id: string | null;
  amount: number | null;
  currency: string | null;
  payment_date: string | null;
  created_at: string | null;
  status: string | null;
  source: string | null;
  method: string | null;
  reference: string | null;
  notes: string | null;
  deleted_at: string | null;
};

export type ProfileSelectorRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

export type ItinerarySelectorRow = {
  id: string;
  trip_title: string | null;
  destination: string | null;
  raw_data:
    | {
        pricing?: {
          total_cost?: number | null;
          per_person_cost?: number | null;
          pax_count?: number | null;
        } | null;
        financial_summary?: {
          payment_status?: string | null;
          payment_source?: string | null;
          manual_paid_amount?: number | null;
          linked_invoice_id?: string | null;
        } | null;
      }
    | null;
};

export type FollowUpSelectorRow = {
  id: string;
  notification_type: string | null;
  status: string | null;
  scheduled_for: string;
  trip_id: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
};

export type DashboardSourceResult<T> = {
  rows: T[];
  health: DashboardSourceHealth;
  message: string | null;
};

export type FollowUpSourceResult = DashboardSourceResult<FollowUpSelectorRow>;

export type DashboardSourceBundle = {
  proposals: DashboardSourceResult<ProposalSelectorRow>;
  trips: DashboardSourceResult<TripSelectorRow>;
  invoices: DashboardSourceResult<InvoiceSelectorRow>;
  paymentLinks: DashboardSourceResult<PaymentLinkSelectorRow>;
  invoicePayments: DashboardSourceResult<InvoicePaymentSelectorRow>;
  commercialPayments: DashboardSourceResult<CommercialPaymentSelectorRow>;
  profiles: DashboardSourceResult<ProfileSelectorRow>;
  itineraries: DashboardSourceResult<ItinerarySelectorRow>;
  followUps: FollowUpSourceResult;
  health: DashboardHealth;
};

const FOLLOW_UP_ACTIVE_STATUSES = new Set(["pending", "queued", "retry", "failed"]);

export function sourceMessage(label: string): string {
  return `${label} data is temporarily unavailable, so parts of the dashboard may be partial.`;
}

function isMissingDeletedAtError(message: string | null | undefined): boolean {
  const normalized = (message || "").toLowerCase();
  return normalized.includes("deleted_at") && normalized.includes("column");
}

async function runSourceQuery<T>(
  label: string,
  query: PromiseLike<{ data: T[] | null; error: { message?: string | null } | null }>,
): Promise<DashboardSourceResult<T>> {
  try {
    const result = await query;
    if (result.error) {
      return {
        rows: [],
        health: "failed",
        message: sourceMessage(label),
      };
    }

    return {
      rows: (result.data || []) as T[],
      health: "ok",
      message: null,
    };
  } catch {
    return {
      rows: [],
      health: "failed",
      message: sourceMessage(label),
    };
  }
}

async function runSoftDeleteAwareSourceQuery<T>(params: {
  label: string;
  strictQuery: PromiseLike<{ data: T[] | null; error: { message?: string | null } | null }>;
  fallbackQuery: PromiseLike<{ data: T[] | null; error: { message?: string | null } | null }>;
}): Promise<DashboardSourceResult<T>> {
  try {
    const strict = await params.strictQuery;
    if (!strict.error) {
      return {
        rows: (strict.data || []) as T[],
        health: "ok",
        message: null,
      };
    }

    if (!isMissingDeletedAtError(strict.error.message)) {
      return {
        rows: [],
        health: "failed",
        message: sourceMessage(params.label),
      };
    }

    const fallback = await params.fallbackQuery;
    if (fallback.error) {
      return {
        rows: [],
        health: "failed",
        message: sourceMessage(params.label),
      };
    }

    return {
      rows: (fallback.data || []) as T[],
      health: "ok",
      message: null,
    };
  } catch {
    return {
      rows: [],
      health: "failed",
      message: sourceMessage(params.label),
    };
  }
}

function buildHealth(input: Omit<DashboardSourceBundle, "health">): DashboardHealth {
  const sources: DashboardHealth["sources"] = {
    proposals: input.proposals.health,
    trips: input.trips.health,
    invoices: input.invoices.health,
    payments:
      input.paymentLinks.health === "failed" ||
      input.invoicePayments.health === "failed" ||
      input.commercialPayments.health === "failed"
        ? "failed"
        : "ok",
    followUps: input.followUps.health,
    profiles: input.profiles.health,
    itineraries: input.itineraries.health,
  };

  const issues = (
    [
      ["proposals", input.proposals.message],
      ["trips", input.trips.message],
      ["invoices", input.invoices.message],
      [
        "payments",
        input.paymentLinks.message ||
          input.invoicePayments.message ||
          input.commercialPayments.message ||
          null,
      ],
      ["followUps", input.followUps.message],
      ["profiles", input.profiles.message],
      ["itineraries", input.itineraries.message],
    ] as const
  )
    .filter((entry): entry is [DashboardHealthSourceKey, string] => Boolean(entry[1]))
    .map(([source, message]) => ({ source, message }));

  const messages = issues.map((issue) => issue.message);
  const states = Object.values(sources);
  const overall =
    states.every((state) => state === "ok")
      ? "ok"
      : states.every((state) => state === "failed")
        ? "failed"
        : "partial";

  return { overall, sources, issues, messages };
}

function chunkValues<T>(values: T[], size: number): T[][] {
  if (values.length === 0) return [];
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function queryFollowUpsByColumn(params: {
  client: AdminQueryClient;
  column: "user_id" | "trip_id";
  ids: string[];
  windowStartIso: string;
  windowEndIso: string;
}): Promise<{ data: FollowUpSelectorRow[]; error: Error | null }> {
  const rows: FollowUpSelectorRow[] = [];

  for (const chunk of chunkValues(params.ids, 200)) {
    const { data, error } = await params.client
      .from("notification_queue")
      .select("id,notification_type,status,scheduled_for,trip_id,recipient_phone,recipient_email")
      .in(params.column, chunk)
      .gte("scheduled_for", params.windowStartIso)
      .lte("scheduled_for", params.windowEndIso)
      .limit(500);

    if (error) {
      return {
        data: [],
        error: new Error(error.message || "Failed to fetch follow-ups"),
      };
    }

    rows.push(
      ...(((data || []) as FollowUpSelectorRow[]).filter((row) =>
        FOLLOW_UP_ACTIVE_STATUSES.has(normalizeStatus(row.status, "")),
      )),
    );
  }

  const deduped = new Map<string, FollowUpSelectorRow>();
  for (const row of rows) {
    deduped.set(row.id, row);
  }

  return {
    data: Array.from(deduped.values()).sort(
      (left, right) =>
        new Date(left.scheduled_for).getTime() -
        new Date(right.scheduled_for).getTime(),
    ),
    error: null,
  };
}

async function fetchFollowUps(params: {
  client: AdminQueryClient;
  userIds: string[];
  tripIds: string[];
  windowStartIso: string;
  windowEndIso: string;
}): Promise<FollowUpSourceResult> {
  const [byUser, byTrip] = await Promise.all([
    params.userIds.length
      ? queryFollowUpsByColumn({
          client: params.client,
          column: "user_id",
          ids: params.userIds,
          windowStartIso: params.windowStartIso,
          windowEndIso: params.windowEndIso,
        })
      : Promise.resolve({ data: [], error: null }),
    params.tripIds.length
      ? queryFollowUpsByColumn({
          client: params.client,
          column: "trip_id",
          ids: params.tripIds,
          windowStartIso: params.windowStartIso,
          windowEndIso: params.windowEndIso,
        })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (byUser.error || byTrip.error) {
    return {
      rows: [],
      health: "failed",
      message: sourceMessage("Follow-up"),
    };
  }

  const deduped = new Map<string, FollowUpSelectorRow>();
  for (const row of [...byUser.data, ...byTrip.data]) {
    deduped.set(row.id, row);
  }

  return {
    rows: Array.from(deduped.values()).sort(
      (left, right) =>
        new Date(left.scheduled_for).getTime() -
        new Date(right.scheduled_for).getTime(),
    ),
    health: "ok",
    message: null,
  };
}

export async function fetchDashboardProposalRows(
  client: AdminQueryClient,
  organizationId: string,
): Promise<DashboardSourceResult<ProposalSelectorRow>> {
  await repairPipelineProposalIntegrity({ client, organizationId });

  const select =
    "id,title,status,created_at,updated_at,viewed_at,expires_at,total_price,client_selected_price,client_id,trip_id,trips:trip_id(id,status,start_date,end_date)";
  return runSoftDeleteAwareSourceQuery<ProposalSelectorRow>({
    label: "Proposal",
    strictQuery: client
      .from("proposals")
      .select(select)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000),
    fallbackQuery: client
      .from("proposals")
      .select(select)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5000),
  });
}

export async function fetchDashboardTripRows(
  client: AdminQueryClient,
  organizationId: string,
): Promise<DashboardSourceResult<TripSelectorRow>> {
  const select =
    "id,itinerary_id,client_id,status,created_at,updated_at,start_date,end_date,destination,name";
  return runSoftDeleteAwareSourceQuery<TripSelectorRow>({
    label: "Trip",
    strictQuery: client
      .from("trips")
      .select(select)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000),
    fallbackQuery: client
      .from("trips")
      .select(select)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5000),
  });
}

export async function fetchDashboardInvoiceRows(
  client: AdminQueryClient,
  organizationId: string,
): Promise<DashboardSourceResult<InvoiceSelectorRow>> {
  const select =
    "id,invoice_number,status,due_date,balance_amount,total_amount,created_at,updated_at,paid_at,client_id,trip_id";
  return runSoftDeleteAwareSourceQuery<InvoiceSelectorRow>({
    label: "Invoice",
    strictQuery: client
      .from("invoices")
      .select(select)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000),
    fallbackQuery: client
      .from("invoices")
      .select(select)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5000),
  });
}

export async function fetchDashboardPaymentLinkRows(
  client: AdminQueryClient,
  organizationId: string,
): Promise<DashboardSourceResult<PaymentLinkSelectorRow>> {
  return runSourceQuery<PaymentLinkSelectorRow>(
    "Payment",
    client
      .from("payment_links")
      .select("id,status,amount_paise,paid_at,created_at,proposal_id,booking_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5000),
  );
}

export async function fetchDashboardInvoicePaymentRows(
  client: AdminQueryClient,
  organizationId: string,
): Promise<DashboardSourceResult<InvoicePaymentSelectorRow>> {
  return runSourceQuery<InvoicePaymentSelectorRow>(
    "Payment",
    client
      .from("invoice_payments")
      .select("id,status,amount,payment_date,created_at,invoice_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5000),
  );
}

export async function fetchDashboardCommercialPaymentRows(
  client: AdminQueryClient,
  organizationId: string,
): Promise<DashboardSourceResult<CommercialPaymentSelectorRow>> {
  return runSoftDeleteAwareSourceQuery<CommercialPaymentSelectorRow>({
    label: "Payment",
    strictQuery: client
      .from("commercial_payments")
      .select("id,trip_id,proposal_id,invoice_id,amount,currency,payment_date,created_at,status,source,method,reference,notes,deleted_at")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("payment_date", { ascending: false })
      .limit(5000),
    fallbackQuery: client
      .from("commercial_payments")
      .select("id,trip_id,proposal_id,invoice_id,amount,currency,payment_date,created_at,status,source,method,reference,notes,deleted_at")
      .eq("organization_id", organizationId)
      .order("payment_date", { ascending: false })
      .limit(5000),
  });
}

export async function fetchDashboardProfileRows(
  client: AdminQueryClient,
  organizationId: string,
): Promise<DashboardSourceResult<ProfileSelectorRow>> {
  return runSourceQuery<ProfileSelectorRow>(
    "Profile",
    client
      .from("profiles")
      .select("id,full_name,email,role")
      .eq("organization_id", organizationId)
      .limit(5000),
  );
}

export async function fetchDashboardItineraryRows(
  client: AdminQueryClient,
  itineraryIds: string[],
): Promise<DashboardSourceResult<ItinerarySelectorRow>> {
  if (itineraryIds.length === 0) {
    return {
      rows: [],
      health: "ok",
      message: null,
    };
  }

  return runSourceQuery<ItinerarySelectorRow>(
    "Itinerary",
    client
      .from("itineraries")
      .select("id,trip_title,destination,raw_data")
      .in("id", itineraryIds)
      .limit(Math.max(itineraryIds.length, 1)),
  );
}

export async function loadDashboardSourceBundle(params: {
  client: AdminQueryClient;
  organizationId: string;
  followUpWindowStartIso: string;
  followUpWindowEndIso: string;
}): Promise<DashboardSourceBundle> {
  const [
    proposals,
    trips,
    invoices,
    paymentLinks,
    invoicePayments,
    commercialPayments,
    profiles,
  ] = await Promise.all([
    fetchDashboardProposalRows(params.client, params.organizationId),
    fetchDashboardTripRows(params.client, params.organizationId),
    fetchDashboardInvoiceRows(params.client, params.organizationId),
    fetchDashboardPaymentLinkRows(params.client, params.organizationId),
    fetchDashboardInvoicePaymentRows(params.client, params.organizationId),
    fetchDashboardCommercialPaymentRows(params.client, params.organizationId),
    fetchDashboardProfileRows(params.client, params.organizationId),
  ]);

  const itineraryIds = Array.from(
    new Set(
      trips.rows
        .map((trip) => trip.itinerary_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const itineraries = await fetchDashboardItineraryRows(params.client, itineraryIds);
  const followUps = await fetchFollowUps({
    client: params.client,
    userIds: profiles.rows.map((profile) => profile.id),
    tripIds: trips.rows.map((trip) => trip.id),
    windowStartIso: params.followUpWindowStartIso,
    windowEndIso: params.followUpWindowEndIso,
  });

  const withoutHealth = {
    proposals,
    trips,
    invoices,
    paymentLinks,
    invoicePayments,
    commercialPayments,
    profiles,
    itineraries,
    followUps,
  };

  return {
    ...withoutHealth,
    health: buildHealth(withoutHealth),
  };
}
