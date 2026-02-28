import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type InvoicePdfTemplate = "executive" | "obsidian" | "heritage";

export interface InvoicePdfLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

export interface InvoicePdfSnapshot {
  name?: string | null;
  gstin?: string | null;
  billing_state?: string | null;
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
}

export interface InvoicePdfClientSnapshot {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface InvoicePdfData {
  invoice_number: string;
  currency: string;
  status: string;
  created_at: string;
  issued_at?: string | null;
  due_date?: string | null;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  place_of_supply?: string | null;
  sac_code?: string | null;
  notes?: string | null;
  line_items: InvoicePdfLineItem[];
  organization_snapshot?: InvoicePdfSnapshot | null;
  client_snapshot?: InvoicePdfClientSnapshot | null;
}

const TEMPLATE_THEME: Record<InvoicePdfTemplate, { accent: string; muted: string; heading: string; stripe: string }> = {
  executive: { accent: "#0f766e", muted: "#64748b", heading: "#0f172a", stripe: "#f0fdfa" },
  obsidian: { accent: "#0f172a", muted: "#475569", heading: "#020617", stripe: "#f8fafc" },
  heritage: { accent: "#7c2d12", muted: "#57534e", heading: "#292524", stripe: "#fff7ed" },
};

function formatMoney(value: number, currency = "INR"): string {
  const safe = Number.isFinite(value) ? value : 0;
  if (currency.toUpperCase() === "INR") {
    return `Rs ${safe.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency.toUpperCase()} ${safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function compactAddress(address?: InvoicePdfSnapshot["billing_address"]): string {
  if (!address) return "";
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

interface InvoiceDocumentProps {
  invoice: InvoicePdfData;
  template?: InvoicePdfTemplate;
}

export function InvoiceDocument({ invoice, template = "executive" }: InvoiceDocumentProps) {
  const theme = TEMPLATE_THEME[template];
  const styles = buildStyles(theme);
  const org = invoice.organization_snapshot;
  const client = invoice.client_snapshot;
  const addressLine = compactAddress(org?.billing_address);

  return (
    <Document title={invoice.invoice_number}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Tax Invoice</Text>
            <Text style={styles.operatorName}>{org?.name || "Travel Suite"}</Text>
            {org?.gstin ? <Text style={styles.operatorMeta}>GSTIN: {org.gstin}</Text> : null}
            {org?.billing_state ? <Text style={styles.operatorMeta}>Billing State: {org.billing_state}</Text> : null}
            {addressLine ? <Text style={styles.operatorMeta}>{addressLine}</Text> : null}
            {org?.billing_address?.phone ? (
              <Text style={styles.operatorMeta}>Phone: {org.billing_address.phone}</Text>
            ) : null}
            {org?.billing_address?.email ? (
              <Text style={styles.operatorMeta}>Email: {org.billing_address.email}</Text>
            ) : null}
          </View>
          <View style={styles.invoiceMetaBlock}>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.metaLine}>Issued: {formatDate(invoice.issued_at || invoice.created_at)}</Text>
            <Text style={styles.metaLine}>Due: {formatDate(invoice.due_date)}</Text>
            <Text style={styles.metaLine}>Status: {invoice.status.replace(/_/g, " ")}</Text>
            {invoice.sac_code ? <Text style={styles.metaLine}>SAC: {invoice.sac_code}</Text> : null}
            {invoice.place_of_supply ? (
              <Text style={styles.metaLine}>Place of Supply: {invoice.place_of_supply}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.billToSection}>
          <Text style={styles.sectionLabel}>Billed To</Text>
          <Text style={styles.clientName}>{client?.full_name || "Walk-in client"}</Text>
          {client?.email ? <Text style={styles.clientMeta}>{client.email}</Text> : null}
          {client?.phone ? <Text style={styles.clientMeta}>{client.phone}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.colDescription]}>Description</Text>
            <Text style={[styles.cell, styles.colQty]}>Qty</Text>
            <Text style={[styles.cell, styles.colRate]}>Rate</Text>
            <Text style={[styles.cell, styles.colTax]}>Tax</Text>
            <Text style={[styles.cell, styles.colTotal]}>Amount</Text>
          </View>

          {invoice.line_items.map((item, index) => (
            <View
              key={`${invoice.invoice_number}-line-${index}`}
              style={index % 2 === 1 ? [styles.tableRow, styles.striped] : styles.tableRow}
            >
              <Text style={[styles.cell, styles.colDescription]}>{item.description}</Text>
              <Text style={[styles.cell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.cell, styles.colRate]}>{formatMoney(item.unit_price, invoice.currency)}</Text>
              <Text style={[styles.cell, styles.colTax]}>{item.tax_rate}%</Text>
              <Text style={[styles.cell, styles.colTotal]}>{formatMoney(item.line_total, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsPanel}>
          <Row label="Subtotal" value={formatMoney(invoice.subtotal_amount, invoice.currency)} styles={styles} />
          {Number(invoice.cgst || 0) > 0 ? (
            <Row label="CGST" value={formatMoney(Number(invoice.cgst || 0), invoice.currency)} styles={styles} />
          ) : null}
          {Number(invoice.sgst || 0) > 0 ? (
            <Row label="SGST" value={formatMoney(Number(invoice.sgst || 0), invoice.currency)} styles={styles} />
          ) : null}
          {Number(invoice.igst || 0) > 0 ? (
            <Row label="IGST" value={formatMoney(Number(invoice.igst || 0), invoice.currency)} styles={styles} />
          ) : null}
          <Row label="Tax" value={formatMoney(invoice.tax_amount, invoice.currency)} styles={styles} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatMoney(invoice.total_amount, invoice.currency)}</Text>
          </View>
          <Row label="Paid" value={formatMoney(invoice.paid_amount, invoice.currency)} styles={styles} />
          <Row label="Balance" value={formatMoney(invoice.balance_amount, invoice.currency)} styles={styles} />
        </View>

        {invoice.notes ? (
          <View style={styles.notesBlock}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This invoice was generated digitally by {org?.name || "Travel Suite"}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function Row({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof buildStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function buildStyles(theme: { accent: string; muted: string; heading: string; stripe: string }) {
  return StyleSheet.create({
    page: {
      backgroundColor: "#ffffff",
      color: "#0f172a",
      fontSize: 10,
      paddingTop: 34,
      paddingBottom: 28,
      paddingHorizontal: 32,
      fontFamily: "Helvetica",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
      paddingBottom: 14,
    },
    kicker: {
      textTransform: "uppercase",
      letterSpacing: 1.6,
      fontSize: 8,
      color: theme.accent,
      fontWeight: 700,
      marginBottom: 5,
    },
    operatorName: {
      fontSize: 16,
      fontWeight: 700,
      color: theme.heading,
      marginBottom: 4,
    },
    operatorMeta: {
      color: theme.muted,
      fontSize: 9,
      marginBottom: 2,
      lineHeight: 1.35,
    },
    invoiceMetaBlock: {
      alignItems: "flex-end",
      maxWidth: 220,
    },
    invoiceNumber: {
      fontSize: 15,
      color: theme.heading,
      fontWeight: 700,
      marginBottom: 6,
    },
    metaLine: {
      color: theme.muted,
      fontSize: 9,
      marginBottom: 2,
      textAlign: "right",
    },
    billToSection: {
      marginTop: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 6,
      padding: 10,
    },
    sectionLabel: {
      color: theme.accent,
      textTransform: "uppercase",
      letterSpacing: 1.1,
      fontSize: 8,
      fontWeight: 700,
      marginBottom: 4,
    },
    clientName: {
      fontSize: 12,
      fontWeight: 700,
      color: theme.heading,
      marginBottom: 2,
    },
    clientMeta: {
      color: theme.muted,
      fontSize: 9,
      marginBottom: 1,
    },
    table: {
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 6,
      overflow: "hidden",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#f8fafc",
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#f1f5f9",
      minHeight: 24,
    },
    striped: {
      backgroundColor: theme.stripe,
    },
    cell: {
      fontSize: 9,
      color: "#0f172a",
      lineHeight: 1.35,
    },
    colDescription: {
      width: "42%",
      paddingRight: 8,
    },
    colQty: {
      width: "10%",
      textAlign: "center",
    },
    colRate: {
      width: "18%",
      textAlign: "right",
      paddingRight: 6,
    },
    colTax: {
      width: "10%",
      textAlign: "center",
    },
    colTotal: {
      width: "20%",
      textAlign: "right",
      fontWeight: 600,
    },
    totalsPanel: {
      marginTop: 14,
      marginLeft: "auto",
      width: 250,
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 6,
      padding: 10,
      gap: 4,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowLabel: {
      color: theme.muted,
      fontSize: 9,
    },
    rowValue: {
      color: theme.heading,
      fontSize: 9,
      fontWeight: 500,
    },
    totalRow: {
      marginTop: 3,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: "#cbd5e1",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    totalLabel: {
      fontWeight: 700,
      color: theme.heading,
      fontSize: 10,
    },
    totalValue: {
      fontWeight: 700,
      color: theme.heading,
      fontSize: 10,
    },
    notesBlock: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: "#e2e8f0",
      paddingTop: 8,
    },
    notesText: {
      color: theme.muted,
      fontSize: 9,
      lineHeight: 1.5,
    },
    footer: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: "#f1f5f9",
      paddingTop: 8,
    },
    footerText: {
      color: theme.muted,
      fontSize: 8,
      textAlign: "center",
    },
  });
}
