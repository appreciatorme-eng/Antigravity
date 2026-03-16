import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import type { Database } from "@/lib/database.types";
import { normalizeInvoiceMetadata } from "@/lib/invoices/module";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

const TRIP_INVOICE_SELECT = [
  "balance_amount",
  "created_at",
  "due_date",
  "id",
  "invoice_number",
  "issued_at",
  "metadata",
  "paid_amount",
  "status",
  "total_amount",
  "trip_id",
].join(", ");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TripInvoiceRow = Pick<
  Database["public"]["Tables"]["invoices"]["Row"],
  | "balance_amount"
  | "created_at"
  | "due_date"
  | "id"
  | "invoice_number"
  | "issued_at"
  | "metadata"
  | "paid_amount"
  | "status"
  | "total_amount"
  | "trip_id"
>;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id?: string }> },
) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: true });
    if (!admin.ok) {
      return admin.response;
    }

    const { id: tripId } = await params;
    if (!tripId || !UUID_REGEX.test(tripId)) {
      return NextResponse.json(
        { error: "Invalid trip id" },
        { status: 400 },
      );
    }

    let tripScopeQuery = admin.adminClient
      .from("trips")
      .select("id")
      .eq("id", tripId);

    if (!admin.isSuperAdmin) {
      tripScopeQuery = tripScopeQuery.eq("organization_id", admin.organizationId ?? "");
    }

    const { data: scopedTrip, error: scopedTripError } = await tripScopeQuery.maybeSingle();

    if (scopedTripError || !scopedTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 },
      );
    }

    const { data: invoices, error } = await admin.adminClient
      .from("invoices")
      .select(TRIP_INVOICE_SELECT)
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });

    const invoiceRows = (invoices as unknown as TripInvoiceRow[] | null) ?? [];

    if (error) {
      logError("Failed to fetch trip invoices", error);
      return NextResponse.json(
        { error: "Failed to fetch invoices" },
        { status: 500 },
      );
    }

    const invoiceIds = invoiceRows.map((inv) => inv.id);
    let paymentsMap: Record<
      string,
      Array<{
        id: string;
        amount: number;
        method: string | null;
        reference: string | null;
        payment_date: string;
        status: string;
      }>
    > = {};

    if (invoiceIds.length > 0) {
      const { data: payments } = await admin.adminClient
        .from("invoice_payments")
        .select("id, invoice_id, amount, method, reference, payment_date, status")
        .in("invoice_id", invoiceIds)
        .order("payment_date", { ascending: false });

      if (payments) {
        paymentsMap = payments.reduce(
          (acc, payment) => {
            const invId = payment.invoice_id;
            const entry = {
              id: payment.id,
              amount: payment.amount ?? 0,
              method: payment.method ?? null,
              reference: payment.reference ?? null,
              payment_date: payment.payment_date ?? "",
              status: payment.status ?? "pending",
            };
            return {
              ...acc,
              [invId]: [...(acc[invId] || []), entry],
            };
          },
          {} as typeof paymentsMap,
        );
      }
    }

    const normalized = invoiceRows.map((invoice) => {
      const metadata = normalizeInvoiceMetadata(invoice.metadata);
      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        paid_amount: invoice.paid_amount,
        balance_amount: invoice.balance_amount,
        status: invoice.status,
        due_date: invoice.due_date,
        issued_at: invoice.issued_at,
        created_at: invoice.created_at,
        line_items: metadata.line_items,
        payments: paymentsMap[invoice.id] || [],
      };
    });

    return NextResponse.json({ invoices: normalized });
  } catch (error) {
    logError("Trip invoices error", error);
    return NextResponse.json(
      {
        error: safeErrorMessage(error, "Request failed"),
      },
      { status: 500 },
    );
  }
}
