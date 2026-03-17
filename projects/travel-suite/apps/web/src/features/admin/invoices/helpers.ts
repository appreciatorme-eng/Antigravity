import type { InvoiceRecord, InvoiceTemplate, OrganizationSnapshot } from "./types";

const PRINT_WINDOW_URL_BASE = "https://print.tripbuilt.local";

function escapeHtml(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizePrintUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value, PRINT_WINDOW_URL_BASE);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value: number, currency = "INR"): string {
  const safe = Number.isFinite(value) ? value : 0;
  if (currency.toUpperCase() === "INR") {
    return `\u20B9${safe.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency.toUpperCase()} ${safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

export function statusTone(status: string): string {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "partially_paid":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "overdue":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "cancelled":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "draft":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-teal-100 text-teal-700 border-teal-200";
  }
}

export function buildAddressLine(address?: OrganizationSnapshot["billing_address"] | null): string {
  if (!address) return "";
  return [address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
    .filter(Boolean)
    .join(", ");
}

function buildEscapedAddressLine(address?: OrganizationSnapshot["billing_address"] | null): string {
  return escapeHtml(buildAddressLine(address));
}

export function computeTaxSplit(
  totalTax: number,
  billingState: string | null,
  placeOfSupply: string
): { cgst: number; sgst: number; igst: number } {
  const normalizedTax = roundCurrency(Math.max(totalTax, 0));
  if (!normalizedTax) return { cgst: 0, sgst: 0, igst: 0 };

  const billing = (billingState || "").trim().toUpperCase();
  const place = (placeOfSupply || "").trim().toUpperCase();
  if (billing && place && billing === place) {
    const half = roundCurrency(normalizedTax / 2);
    return { cgst: half, sgst: roundCurrency(normalizedTax - half), igst: 0 };
  }
  return { cgst: 0, sgst: 0, igst: normalizedTax };
}

export function buildInvoiceMarkup(invoice: InvoiceRecord, template: InvoiceTemplate): string {
  const org = invoice.organization_snapshot;
  const client = invoice.client_snapshot;
  const theme = {
    executive: { accent: "#0f766e", secondary: "#ecfeff", heading: "#0f172a" },
    obsidian: { accent: "#111827", secondary: "#f8fafc", heading: "#020617" },
    heritage: { accent: "#9a3412", secondary: "#fff7ed", heading: "#292524" },
  }[template];

  const safeLogoUrl = sanitizePrintUrl(org?.logo_url);
  const safeOrgName = escapeHtml(org?.name || "TripBuilt");
  const safeLogoInitial = escapeHtml((org?.name || "T").charAt(0) || "T");
  const safeAddressLine = buildEscapedAddressLine(org?.billing_address);
  const safeClientName = escapeHtml(client?.full_name || "Walk-in client");
  const safeNotes = escapeHtml(invoice.notes);
  const safeInvoiceNumber = escapeHtml(invoice.invoice_number);
  const safeStatus = escapeHtml(invoice.status.replace(/_/g, " "));
  const safePlaceOfSupply = escapeHtml(invoice.place_of_supply);
  const safeSacCode = escapeHtml(invoice.sac_code);
  const safeOrgGstin = escapeHtml(org?.gstin);
  const safeOrgPhone = escapeHtml(org?.billing_address?.phone);
  const safeOrgEmail = escapeHtml(org?.billing_address?.email);
  const safeClientEmail = escapeHtml(client?.email);
  const safeClientPhone = escapeHtml(client?.phone);

  const logoHtml = safeLogoUrl
    ? `<img src="${safeLogoUrl}" alt="${safeOrgName || "Logo"}" style="width:56px;height:56px;object-fit:contain;border-radius:8px;border:1px solid #e2e8f0;margin-right:14px;" />`
    : `<div style="width:56px;height:56px;border-radius:8px;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#94a3b8;margin-right:14px;background:#f8fafc;">${safeLogoInitial}</div>`;

  const rows = invoice.line_items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px">${escapeHtml(item.description)}</td>
        <td style="text-align:center;padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px">${escapeHtml(String(item.quantity))}</td>
        <td style="text-align:right;padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px">${formatMoney(item.unit_price, invoice.currency)}</td>
        <td style="text-align:center;padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px">${escapeHtml(String(item.tax_rate))}%</td>
        <td style="text-align:right;padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600">${formatMoney(item.line_total, invoice.currency)}</td>
      </tr>
    `
    )
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${safeInvoiceNumber}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; margin: 26px; }
        .paper { border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
        .header { display:flex; justify-content:space-between; gap:24px; padding:20px; background:${theme.secondary}; border-bottom:1px solid #e2e8f0; }
        .header-left { display:flex; align-items:flex-start; gap:0; }
        .kicker { font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:${theme.accent}; font-weight:700; margin-bottom:6px; }
        .org-name { font-size:24px; font-weight:700; color:${theme.heading}; margin:0 0 4px; }
        .meta { font-size:12px; color:#475569; margin:2px 0; }
        table { width:100%; border-collapse: collapse; }
        th { background: #f8fafc; text-transform: uppercase; letter-spacing: .06em; font-size: 10px; color: #475569; padding: 10px 12px; text-align:left; border-bottom: 1px solid #e2e8f0; }
        .totals { margin:16px 20px 18px auto; width:340px; border:1px solid #e2e8f0; border-radius:12px; padding:12px; }
        .totals-row { display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:#475569; }
        .totals-row.total { color:${theme.heading}; font-weight:700; border-top:1px solid #cbd5e1; margin-top:4px; padding-top:8px; }
        .notes { margin:0 20px 18px; border-top:1px solid #e2e8f0; padding-top:10px; font-size:12px; color:#475569; }
      </style>
    </head>
    <body>
      <div class="paper">
        <div class="header">
          <div class="header-left">
            ${logoHtml}
            <div>
              <div class="kicker">Tax Invoice</div>
              <h1 class="org-name">${safeOrgName}</h1>
              ${safeOrgGstin ? `<div class="meta">GSTIN: ${safeOrgGstin}</div>` : ""}
              ${safeAddressLine ? `<div class="meta">${safeAddressLine}</div>` : ""}
              ${safeOrgPhone ? `<div class="meta">Phone: ${safeOrgPhone}</div>` : ""}
              ${safeOrgEmail ? `<div class="meta">Email: ${safeOrgEmail}</div>` : ""}
            </div>
          </div>
          <div style="text-align:right">
            <div class="kicker">Invoice #</div>
            <div style="font-size:18px; font-weight:700; color:${theme.heading}">${safeInvoiceNumber}</div>
            <div class="meta">Issued: ${formatDate(invoice.issued_at || invoice.created_at)}</div>
            <div class="meta">Due: ${formatDate(invoice.due_date)}</div>
            <div class="meta">Status: ${safeStatus}</div>
            ${safePlaceOfSupply ? `<div class="meta">Place of Supply: ${safePlaceOfSupply}</div>` : ""}
            ${safeSacCode ? `<div class="meta">SAC: ${safeSacCode}</div>` : ""}
          </div>
        </div>
        <div style="padding:14px 20px 8px; font-size:12px; color:#475569">
          <strong style="display:block; color:${theme.heading}; margin-bottom:4px">Billed To</strong>
          ${safeClientName}
          ${safeClientEmail ? `<div>${safeClientEmail}</div>` : ""}
          ${safeClientPhone ? `<div>${safeClientPhone}</div>` : ""}
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Rate</th>
              <th style="text-align:center">Tax</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>${formatMoney(invoice.subtotal_amount, invoice.currency)}</span></div>
          ${Number(invoice.cgst || 0) > 0 ? `<div class="totals-row"><span>CGST</span><span>${formatMoney(Number(invoice.cgst || 0), invoice.currency)}</span></div>` : ""}
          ${Number(invoice.sgst || 0) > 0 ? `<div class="totals-row"><span>SGST</span><span>${formatMoney(Number(invoice.sgst || 0), invoice.currency)}</span></div>` : ""}
          ${Number(invoice.igst || 0) > 0 ? `<div class="totals-row"><span>IGST</span><span>${formatMoney(Number(invoice.igst || 0), invoice.currency)}</span></div>` : ""}
          <div class="totals-row"><span>Tax</span><span>${formatMoney(invoice.tax_amount, invoice.currency)}</span></div>
          <div class="totals-row total"><span>Total</span><span>${formatMoney(invoice.total_amount, invoice.currency)}</span></div>
          <div class="totals-row"><span>Paid</span><span>${formatMoney(invoice.paid_amount, invoice.currency)}</span></div>
          <div class="totals-row"><span>Balance</span><span>${formatMoney(invoice.balance_amount, invoice.currency)}</span></div>
        </div>
        ${safeNotes ? `<div class="notes"><strong>Notes:</strong><div style="margin-top:4px">${safeNotes}</div></div>` : ""}
      </div>
    </body>
  </html>`;
}
