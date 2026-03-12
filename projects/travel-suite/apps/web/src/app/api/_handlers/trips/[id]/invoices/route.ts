import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { normalizeInvoiceMetadata } from "@/lib/invoices/module";
import { safeErrorMessage } from "@/lib/security/safe-error";

const supabaseAdmin = createAdminClient();
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
type TripInvoiceRow = Pick<
    Database["public"]["Tables"]["invoices"]["Row"],
    "balance_amount" | "created_at" | "due_date" | "id" | "invoice_number" | "issued_at" | "metadata" | "paid_amount" | "status" | "total_amount" | "trip_id"
>;

async function getAuthUserId(req: Request): Promise<string | null> {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && data?.user) return data.user.id;
    } else {
        const serverClient = await createServerClient();
        const {
            data: { user },
        } = await serverClient.auth.getUser();
        return user?.id || null;
    }
    return null;
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id?: string }> },
) {
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id: tripId } = await params;
        if (!tripId) {
            return NextResponse.json(
                { error: "Missing trip id" },
                { status: 400 },
            );
        }

        // Verify user has staff access
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", userId)
            .maybeSingle();

        const role = (profile?.role || "").trim().toLowerCase();
        const isStaff = role === "admin" || role === "super_admin";

        if (!isStaff) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 },
            );
        }

        // Fetch invoices for this trip
        const { data: invoices, error } = await supabaseAdmin
            .from("invoices")
            .select(TRIP_INVOICE_SELECT)
            .eq("trip_id", tripId)
            .order("created_at", { ascending: false });
        const invoiceRows = (invoices as unknown as TripInvoiceRow[] | null) ?? [];

        if (error) {
            console.error("Failed to fetch trip invoices:", error);
            return NextResponse.json(
                { error: "Failed to fetch invoices" },
                { status: 500 },
            );
        }

        // Fetch payments for these invoices
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
            const { data: payments } = await supabaseAdmin
                .from("invoice_payments")
                .select(
                    "id, invoice_id, amount, method, reference, payment_date, status",
                )
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
        console.error("Trip invoices error:", error);
        return NextResponse.json(
            {
                error: safeErrorMessage(error, "Request failed"),
            },
            { status: 500 },
        );
    }
}
