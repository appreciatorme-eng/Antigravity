export type InvoiceTemplate = "executive" | "obsidian" | "heritage";

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_subtotal: number;
  line_tax: number;
  line_total: number;
};

export type OrganizationSnapshot = {
  id: string;
  name: string;
  logo_url: string | null;
  gstin: string | null;
  billing_state: string | null;
  billing_address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  primary_color: string | null;
};

export type ClientSnapshot = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export type InvoicePayment = {
  id: string;
  amount: number;
  status: string;
  method: string | null;
  reference: string | null;
  payment_date: string;
};

export type InvoiceRecord = {
  id: string;
  invoice_number: string;
  status: string;
  currency: string;
  due_date: string | null;
  issued_at: string | null;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  amount: number;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  place_of_supply: string | null;
  sac_code: string | null;
  created_at: string;
  line_items: InvoiceLineItem[];
  notes: string | null;
  organization_snapshot: OrganizationSnapshot | null;
  client_snapshot: ClientSnapshot | null;
  invoice_payments?: InvoicePayment[];
};

export type ClientOption = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  travel_style?: string | null;
  client_tag?: string | null;
};

export type DraftLineItem = {
  description: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
};

export type DraftTotals = {
  subtotal: number;
  tax: number;
  total: number;
  split: { cgst: number; sgst: number; igst: number };
};

export type PreviewMode = "draft" | "saved";

export type TemplateMeta = {
  id: InvoiceTemplate;
  name: string;
  description: string;
  accentClass: string;
  pillClass: string;
};
