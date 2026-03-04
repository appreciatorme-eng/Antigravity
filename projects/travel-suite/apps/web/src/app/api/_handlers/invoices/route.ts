import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
  CreateInvoiceSchema,
  buildClientSnapshot,
  buildOrganizationSnapshot,
  calculateInvoiceTotals,
  calculateTaxBreakdown,
  getNextInvoiceNumber,
  normalizeInvoiceMetadata,
  normalizeIsoDate,
} from "@/lib/invoices/module";
import type { Database, Json } from "@/lib/database.types";
import { sanitizeText } from "@/lib/security/sanitize";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, { requireOrganization: true });
  if (!auth.ok) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const status = sanitizeText(searchParams.get("status"), { maxLength: 60 });
  const clientId = sanitizeText(searchParams.get("client_id"), { maxLength: 64 });
  const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
  const offset = Number.parseInt(searchParams.get("offset") || "0", 10);
  const pageSize = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 50;
  const pageOffset = Number.isFinite(offset) ? Math.max(offset, 0) : 0;

  const adminClient = auth.adminClient;
  let query = adminClient
    .from("invoices")
    .select("*", { count: "exact" })
    .eq("organization_id", auth.organizationId!)
    .order("created_at", { ascending: false })
    .range(pageOffset, pageOffset + pageSize - 1);

  if (status) query = query.eq("status", status);
  if (clientId) query = query.eq("client_id", clientId);

  const { data: invoices, error, count } = await query;
  if (error) {
    console.error("Failed to list invoices:", error);
    return jsonError("Failed to fetch invoices", 500);
  }

  const normalized =
    invoices?.map((invoice) => {
      const metadata = normalizeInvoiceMetadata(invoice.metadata);
      return {
        ...invoice,
        amount: invoice.total_amount,
        notes: metadata.notes,
        line_items: metadata.line_items,
        line_items_count: metadata.line_items.length,
        organization_snapshot: metadata.organization_snapshot,
        client_snapshot: metadata.client_snapshot,
      };
    }) || [];

  return NextResponse.json({
    invoices: normalized,
    total: count || 0,
    limit: pageSize,
    offset: pageOffset,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, { requireOrganization: true });
  if (!auth.ok) return auth.response;

  const adminClient = auth.adminClient;
  const organizationId = auth.organizationId!;

  const rawBody = await request.json().catch(() => null);
  const parsed = CreateInvoiceSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invoice payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: organization, error: organizationError } = await adminClient
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  if (organizationError || !organization) {
    return jsonError("Organization not found", 404);
  }

  let clientProfile: ProfileRow | null = null;
  if (parsed.data.client_id) {
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", parsed.data.client_id)
      .maybeSingle();

    if (profileError) {
      return jsonError("Failed to resolve client profile", 500);
    }
    if (!profile || profile.organization_id !== organizationId) {
      return jsonError("Client not found in your organization", 404);
    }
    clientProfile = profile;
  }

  const totals = calculateInvoiceTotals(parsed.data.items);
  const dueDate = normalizeIsoDate(parsed.data.due_date);
  if (dueDate === undefined) {
    return jsonError("Invalid due_date value", 400);
  }

  const placeOfSupply =
    sanitizeText(parsed.data.place_of_supply || organization.billing_state, { maxLength: 120 }) || null;
  const taxBreakdown = calculateTaxBreakdown(
    totals.taxTotal,
    organization.billing_state,
    placeOfSupply
  );
  const invoiceNumber = await getNextInvoiceNumber(adminClient, organizationId);

  const notes = sanitizeText(parsed.data.notes, {
    maxLength: 4000,
    preserveNewlines: true,
  });

  const metadata: InvoiceInsert["metadata"] = {
    notes: notes || null,
    line_items: totals.items.map((item) => ({ ...item })),
    organization_snapshot: buildOrganizationSnapshot(organization) as unknown as Json,
    client_snapshot: buildClientSnapshot(clientProfile) as unknown as Json,
    created_via: "invoice_module_v1",
  };

  const status: NonNullable<InvoiceInsert["status"]> = parsed.data.status || "issued";
  const nowIso = new Date().toISOString();

  const { data: createdInvoice, error: insertError } = await adminClient
    .from("invoices")
    .insert({
      organization_id: organizationId,
      trip_id: parsed.data.trip_id || null,
      client_id: parsed.data.client_id || null,
      invoice_number: invoiceNumber,
      currency: (parsed.data.currency || "INR").toUpperCase(),
      subtotal_amount: totals.subtotal,
      tax_amount: totals.taxTotal,
      total_amount: totals.grandTotal,
      paid_amount: 0,
      balance_amount: totals.grandTotal,
      status,
      due_date: dueDate ?? null,
      issued_at: status === "draft" ? null : nowIso,
      gstin: organization.gstin,
      place_of_supply: placeOfSupply,
      sac_code: sanitizeText(parsed.data.sac_code, { maxLength: 24 }) || "998314",
      subtotal: totals.subtotal,
      cgst: taxBreakdown.cgst,
      sgst: taxBreakdown.sgst,
      igst: taxBreakdown.igst,
      metadata,
      created_by: auth.userId,
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return jsonError("Duplicate invoice number. Please retry.", 409);
    }
    console.error("Failed to create invoice:", insertError);
    return jsonError("Failed to create invoice", 500);
  }

  const normalized = normalizeInvoiceMetadata(createdInvoice.metadata);

  return NextResponse.json(
    {
      invoice: {
        ...createdInvoice,
        amount: createdInvoice.total_amount,
        notes: normalized.notes,
        line_items: normalized.line_items,
        organization_snapshot: normalized.organization_snapshot,
        client_snapshot: normalized.client_snapshot,
      },
    },
    { status: 201 }
  );
}
