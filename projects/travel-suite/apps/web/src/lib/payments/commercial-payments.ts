import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type AdminDbClient = Pick<SupabaseClient<Database>, "from">;

export type CommercialPaymentRow =
  Database["public"]["Tables"]["commercial_payments"]["Row"];
export type CommercialPaymentInsert =
  Database["public"]["Tables"]["commercial_payments"]["Insert"];
export type CommercialPaymentUpdate =
  Database["public"]["Tables"]["commercial_payments"]["Update"];

export type CommercialPaymentSource =
  CommercialPaymentRow["source"];

export type CommercialPaymentSummary = {
  totalPaid: number;
  latestPaymentDate: string | null;
};

function normalize(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

export function isCompletedCommercialPaymentStatus(
  status: string | null | undefined,
): boolean {
  const normalized = normalize(status);
  return normalized === "completed" || normalized === "captured";
}

export function buildCommercialPaymentSummaryByTrip(
  payments: CommercialPaymentRow[],
): Map<string, CommercialPaymentSummary> {
  const byTrip = new Map<string, CommercialPaymentSummary>();

  for (const payment of payments) {
    if (!payment.trip_id || payment.deleted_at) continue;
    if (!isCompletedCommercialPaymentStatus(payment.status)) continue;

    const current = byTrip.get(payment.trip_id) || {
      totalPaid: 0,
      latestPaymentDate: null,
    };

    current.totalPaid += Number(payment.amount || 0);
    const candidateDate = payment.payment_date || payment.created_at;
    if (
      candidateDate &&
      (!current.latestPaymentDate ||
        new Date(candidateDate).getTime() >
          new Date(current.latestPaymentDate).getTime())
    ) {
      current.latestPaymentDate = candidateDate;
    }

    byTrip.set(payment.trip_id, current);
  }

  return byTrip;
}

export async function upsertCommercialPaymentRecord(params: {
  adminClient: AdminDbClient;
  source: CommercialPaymentSource;
  reference: string;
  record: CommercialPaymentInsert;
}) {
  const { data: existing, error: existingError } = await params.adminClient
    .from("commercial_payments")
    .select("id")
    .eq("organization_id", params.record.organization_id)
    .eq("source", params.source)
    .eq("reference", params.reference)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    const updatePayload: CommercialPaymentUpdate = {
      amount: params.record.amount,
      currency: params.record.currency,
      trip_id: params.record.trip_id ?? null,
      proposal_id: params.record.proposal_id ?? null,
      invoice_id: params.record.invoice_id ?? null,
      payment_date: params.record.payment_date,
      status: params.record.status,
      method: params.record.method ?? null,
      notes: params.record.notes ?? null,
      created_by: params.record.created_by ?? null,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await params.adminClient
      .from("commercial_payments")
      .update(updatePayload)
      .eq("id", existing.id);

    if (updateError) {
      throw updateError;
    }

    return existing.id;
  }

  const { data: inserted, error: insertError } = await params.adminClient
    .from("commercial_payments")
    .insert({
      ...params.record,
      source: params.source,
      reference: params.reference,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted.id;
}

export async function clearTripManualCommercialPayments(params: {
  adminClient: AdminDbClient;
  organizationId: string;
  tripId: string;
}) {
  const now = new Date().toISOString();
  const { error } = await params.adminClient
    .from("commercial_payments")
    .update({
      status: "voided",
      deleted_at: now,
      updated_at: now,
    })
    .eq("organization_id", params.organizationId)
    .eq("trip_id", params.tripId)
    .eq("source", "manual_cash")
    .is("deleted_at", null);

  if (error) {
    throw error;
  }
}

export async function syncTripFinancialSummaryCommercialPayment(params: {
  adminClient: AdminDbClient;
  organizationId: string;
  tripId: string;
  createdBy: string | null;
  proposalId?: string | null;
  paymentSource: string | null | undefined;
  paymentStatus: string | null | undefined;
  manualPaidAmount: number | null | undefined;
  currency?: string | null;
  notes?: string | null;
}) {
  const paymentSource = normalize(params.paymentSource);
  const paymentStatus = normalize(params.paymentStatus);
  const manualPaidAmount = Number(params.manualPaidAmount || 0);

  const shouldKeepManualCash =
    paymentSource === "manual_cash" &&
    manualPaidAmount > 0 &&
    (paymentStatus === "paid" || paymentStatus === "partially_paid");

  if (!shouldKeepManualCash) {
    await clearTripManualCommercialPayments({
      adminClient: params.adminClient,
      organizationId: params.organizationId,
      tripId: params.tripId,
    });
    return;
  }

  await upsertCommercialPaymentRecord({
    adminClient: params.adminClient,
    source: "manual_cash",
    reference: `manual_cash:${params.tripId}`,
    record: {
      organization_id: params.organizationId,
      trip_id: params.tripId,
      proposal_id: params.proposalId ?? null,
      invoice_id: null,
      amount: manualPaidAmount,
      currency: params.currency || "INR",
      payment_date: new Date().toISOString(),
      status: "completed",
      source: "manual_cash",
      method: "cash",
      reference: `manual_cash:${params.tripId}`,
      notes: params.notes ?? null,
      created_by: params.createdBy,
    },
  });
}

export async function syncInvoicePaymentToCommercialLedger(params: {
  adminClient: AdminDbClient;
  organizationId: string;
  payment: {
    id: string;
    amount: number | null;
    currency?: string | null;
    method?: string | null;
    payment_date?: string | null;
    created_at?: string | null;
    status?: string | null;
    notes?: string | null;
    created_by?: string | null;
  };
  invoice: {
    id: string;
    trip_id?: string | null;
    organization_id?: string | null;
    currency?: string | null;
  };
  proposalId?: string | null;
}) {
  const normalizedStatus = normalize(params.payment.status);
  const ledgerStatus =
    normalizedStatus === "completed" || normalizedStatus === "captured"
      ? "completed"
      : normalizedStatus === "refunded"
        ? "refunded"
        : normalizedStatus === "failed"
          ? "failed"
          : "pending";

  await upsertCommercialPaymentRecord({
    adminClient: params.adminClient,
    source: "invoice_payment",
    reference: `invoice_payment:${params.payment.id}`,
    record: {
      organization_id: params.organizationId,
      trip_id: params.invoice.trip_id ?? null,
      proposal_id: params.proposalId ?? null,
      invoice_id: params.invoice.id,
      amount: Number(params.payment.amount || 0),
      currency: params.payment.currency || params.invoice.currency || "INR",
      payment_date:
        params.payment.payment_date ||
        params.payment.created_at ||
        new Date().toISOString(),
      status: ledgerStatus,
      source: "invoice_payment",
      method: params.payment.method ?? null,
      reference: `invoice_payment:${params.payment.id}`,
      notes: params.payment.notes ?? null,
      created_by: params.payment.created_by ?? null,
    },
  });
}

export async function syncPaymentLinkToCommercialLedger(params: {
  adminClient: AdminDbClient;
  paymentLinkId: string;
  organizationId: string;
  proposalId: string | null;
  amount: number;
  currency?: string | null;
  paidAt?: string | null;
}) {
  let tripId: string | null = null;

  if (params.proposalId) {
    const { data: proposal, error: proposalError } = await params.adminClient
      .from("proposals")
      .select("trip_id")
      .eq("id", params.proposalId)
      .maybeSingle();

    if (proposalError) {
      throw proposalError;
    }

    tripId = proposal?.trip_id ?? null;
  }

  await upsertCommercialPaymentRecord({
    adminClient: params.adminClient,
    source: "payment_link",
    reference: `payment_link:${params.paymentLinkId}`,
    record: {
      organization_id: params.organizationId,
      trip_id: tripId,
      proposal_id: params.proposalId,
      invoice_id: null,
      amount: Number(params.amount || 0),
      currency: params.currency || "INR",
      payment_date: params.paidAt || new Date().toISOString(),
      status: "completed",
      source: "payment_link",
      method: "link",
      reference: `payment_link:${params.paymentLinkId}`,
      notes: null,
      created_by: null,
    },
  });
}
