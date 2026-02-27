import { z } from "zod";
import type { Json, Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/sanitize";

export const INVOICE_STATUS_VALUES = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
] as const;

export const PAYMENT_STATUS_VALUES = ["pending", "completed", "failed", "refunded"] as const;

export const InvoiceLineItemSchema = z.object({
  description: z.string().trim().min(1).max(240),
  quantity: z.coerce.number().positive().max(100_000),
  unit_price: z.coerce.number().min(0).max(100_000_000),
  tax_rate: z.coerce.number().min(0).max(100),
});

export const CreateInvoiceSchema = z.object({
  client_id: z.string().uuid().optional(),
  trip_id: z.string().uuid().optional(),
  currency: z.string().trim().min(3).max(8).optional(),
  due_date: z.string().optional().nullable(),
  place_of_supply: z.string().trim().max(120).optional().nullable(),
  notes: z.string().max(4_000).optional().nullable(),
  sac_code: z.string().trim().max(24).optional().nullable(),
  status: z.enum(INVOICE_STATUS_VALUES).optional(),
  items: z.array(InvoiceLineItemSchema).min(1).max(100),
});

export const UpdateInvoiceSchema = z.object({
  status: z.enum(INVOICE_STATUS_VALUES).optional(),
  due_date: z.string().optional().nullable(),
  notes: z.string().max(4_000).optional().nullable(),
  place_of_supply: z.string().trim().max(120).optional().nullable(),
  sac_code: z.string().trim().max(24).optional().nullable(),
  items: z.array(InvoiceLineItemSchema).min(1).max(100).optional(),
});

export const RecordInvoicePaymentSchema = z.object({
  amount: z.coerce.number().positive().max(100_000_000),
  method: z.string().trim().max(120).optional().nullable(),
  reference: z.string().trim().max(191).optional().nullable(),
  notes: z.string().max(1_000).optional().nullable(),
  status: z.enum(PAYMENT_STATUS_VALUES).optional(),
  payment_date: z.string().optional().nullable(),
});

export type InvoiceLineItemInput = z.infer<typeof InvoiceLineItemSchema>;

export interface InvoiceLineItem extends InvoiceLineItemInput {
  line_subtotal: number;
  line_tax: number;
  line_total: number;
}

export interface InvoiceTotals {
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  items: InvoiceLineItem[];
}

export interface InvoiceTaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
}

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type BillingAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
};

export type OrganizationSnapshot = {
  id: string;
  name: string;
  logo_url: string | null;
  gstin: string | null;
  billing_state: string | null;
  billing_address: BillingAddress;
  primary_color: string | null;
};

export type ClientSnapshot = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
};

export type NormalizedInvoiceMetadata = {
  notes: string | null;
  line_items: InvoiceLineItem[];
  organization_snapshot: OrganizationSnapshot | null;
  client_snapshot: ClientSnapshot | null;
};

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function asStringOrNull(value: unknown, maxLength = 255): string | null {
  const next = sanitizeText(value, { maxLength });
  return next || null;
}

function asUpperStringOrNull(value: unknown, maxLength = 120): string | null {
  const next = sanitizeText(value, { maxLength }).toUpperCase();
  return next || null;
}

export function asObjectJson(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseBillingAddress(raw: Json | null): BillingAddress {
  const address = asObjectJson(raw);
  return {
    line1: asStringOrNull(address.line1, 200),
    line2: asStringOrNull(address.line2, 200),
    city: asStringOrNull(address.city, 120),
    state: asStringOrNull(address.state, 120),
    postal_code: asStringOrNull(address.postal_code, 40),
    country: asStringOrNull(address.country, 120),
    phone: asStringOrNull(address.phone, 40),
    email: asStringOrNull(address.email, 255),
  };
}

export function normalizeIsoDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const safe = sanitizeText(value, { maxLength: 64 });
  if (!safe) return null;
  const parsed = new Date(safe);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

export function calculateInvoiceTotals(items: InvoiceLineItemInput[]): InvoiceTotals {
  const normalizedItems = items.map((item) => {
    const quantity = roundCurrency(item.quantity);
    const unitPrice = roundCurrency(item.unit_price);
    const taxRate = roundCurrency(item.tax_rate);
    const lineSubtotal = roundCurrency(quantity * unitPrice);
    const lineTax = roundCurrency((lineSubtotal * taxRate) / 100);
    const lineTotal = roundCurrency(lineSubtotal + lineTax);

    return {
      description: sanitizeText(item.description, { maxLength: 240 }),
      quantity,
      unit_price: unitPrice,
      tax_rate: taxRate,
      line_subtotal: lineSubtotal,
      line_tax: lineTax,
      line_total: lineTotal,
    };
  });

  const subtotal = roundCurrency(
    normalizedItems.reduce((sum, item) => sum + item.line_subtotal, 0)
  );
  const taxTotal = roundCurrency(normalizedItems.reduce((sum, item) => sum + item.line_tax, 0));
  const grandTotal = roundCurrency(subtotal + taxTotal);

  return {
    subtotal,
    taxTotal,
    grandTotal,
    items: normalizedItems,
  };
}

export function calculateTaxBreakdown(
  taxAmount: number,
  billingState: string | null,
  placeOfSupply: string | null
): InvoiceTaxBreakdown {
  const normalizedTax = roundCurrency(Math.max(taxAmount, 0));
  if (normalizedTax === 0) {
    return { cgst: 0, sgst: 0, igst: 0 };
  }

  const normalizedBillingState = asUpperStringOrNull(billingState);
  const normalizedPlace = asUpperStringOrNull(placeOfSupply);
  const intraState =
    normalizedBillingState && normalizedPlace && normalizedBillingState === normalizedPlace;

  if (intraState) {
    const half = roundCurrency(normalizedTax / 2);
    return {
      cgst: half,
      sgst: roundCurrency(normalizedTax - half),
      igst: 0,
    };
  }

  return { cgst: 0, sgst: 0, igst: normalizedTax };
}

export function buildOrganizationSnapshot(org: OrganizationRow): OrganizationSnapshot {
  return {
    id: org.id,
    name: sanitizeText(org.name, { maxLength: 240 }),
    logo_url: asStringOrNull(org.logo_url, 500),
    gstin: asUpperStringOrNull(org.gstin, 32),
    billing_state: asUpperStringOrNull(org.billing_state, 120),
    billing_address: parseBillingAddress(org.billing_address),
    primary_color: asStringOrNull(org.primary_color, 32),
  };
}

export function buildClientSnapshot(profile: ProfileRow | null): ClientSnapshot | null {
  if (!profile) return null;
  return {
    id: profile.id,
    full_name: asStringOrNull(profile.full_name, 180),
    email: sanitizeText(profile.email, { maxLength: 320 }),
    phone: asStringOrNull(profile.phone, 32),
  };
}

export function normalizeInvoiceMetadata(raw: Json | null): NormalizedInvoiceMetadata {
  const meta = asObjectJson(raw);

  const notes = asStringOrNull(meta.notes, 4_000);

  const rawItems = Array.isArray(meta.line_items) ? meta.line_items : [];
  const parsedItems = rawItems
    .map((value) => InvoiceLineItemSchema.safeParse(value))
    .filter((result) => result.success)
    .map((result) => result.data);
  const totals = calculateInvoiceTotals(parsedItems);

  const orgSnapshot =
    meta.organization_snapshot && typeof meta.organization_snapshot === "object"
      ? (meta.organization_snapshot as OrganizationSnapshot)
      : null;
  const clientSnapshot =
    meta.client_snapshot && typeof meta.client_snapshot === "object"
      ? (meta.client_snapshot as ClientSnapshot)
      : null;

  return {
    notes,
    line_items: totals.items,
    organization_snapshot: orgSnapshot,
    client_snapshot: clientSnapshot,
  };
}

export async function getNextInvoiceNumber(
  adminClient: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<string> {
  const now = new Date();
  const prefix = `INV-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const { data: latest } = await adminClient
    .from("invoices")
    .select("invoice_number")
    .eq("organization_id", organizationId)
    .like("invoice_number", `${prefix}-%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const suffixMatch = latest?.invoice_number?.match(/-(\d{4,})$/);
  const previous = suffixMatch ? Number.parseInt(suffixMatch[1], 10) : 0;
  const next = Number.isFinite(previous) ? previous + 1 : 1;

  return `${prefix}-${String(next).padStart(4, "0")}`;
}

