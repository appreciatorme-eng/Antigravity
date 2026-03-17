// GSTR-1 export service for monthly/quarterly GST filing
// Generates data in government-specified format for outward supplies return

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// ─── GSTR-1 CONSTANTS ────────────────────────────────────────────────────────

const B2CL_THRESHOLD = 250000; // ₹2.5 lakh - threshold for B2CL vs B2CS

// ─── GSTR-1 TYPES ────────────────────────────────────────────────────────────

export interface GSTR1Period {
  month: string; // Format: YYYY-MM (e.g., "2026-03")
  year: number;
  monthNumber: number; // 1-12
}

export interface GSTR1B2BInvoice {
  gstin: string; // Buyer GSTIN
  legalName: string; // Buyer legal name
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceValue: number;
  placeOfSupply: string; // State code (e.g., "08" for Rajasthan)
  reverseCharge: 'Y' | 'N'; // Usually 'N' for tour operators
  invoiceType: 'R' | 'SEZWP' | 'SEZWOP' | 'EXPWP' | 'EXPWOP' | 'DE'; // Regular
  eCommerceGSTIN: string | null; // Usually null for direct sales
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number; // Usually 0 for travel services
}

export interface GSTR1B2CLInvoice {
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceValue: number;
  placeOfSupply: string; // State code
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
}

export interface GSTR1B2CSEntry {
  type: 'OE'; // Type of supply: OE (Outward taxable supplies)
  placeOfSupply: string; // State code
  rateOfTax: number; // GST rate percentage (e.g., 5, 12, 18)
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
}

export interface GSTR1HSNSummary {
  hsnCode: string; // HSN/SAC code
  description: string;
  uqc: string; // Unit Quantity Code (e.g., "OTH" for services)
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  rateOfTax: number;
}

export interface GSTR1Export {
  gstin: string; // Supplier GSTIN (operator)
  legalName: string; // Supplier legal name
  tradeName: string | null;
  period: GSTR1Period;
  b2b: GSTR1B2BInvoice[]; // B2B invoices (with buyer GSTIN)
  b2cl: GSTR1B2CLInvoice[]; // B2C Large (> ₹2.5L, no GSTIN)
  b2cs: GSTR1B2CSEntry[]; // B2C Small (≤ ₹2.5L, state-wise summary)
  hsnSummary: GSTR1HSNSummary[]; // HSN/SAC summary
  summary: {
    totalInvoices: number;
    totalB2BInvoices: number;
    totalB2CLInvoices: number;
    totalB2CSInvoices: number;
    totalTaxableValue: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    totalCess: number;
    totalTaxAmount: number;
  };
}

// ─── UTILITY: parsePeriod ────────────────────────────────────────────────────

/**
 * Parses a period string (YYYY-MM) into structured period data.
 */
export function parsePeriod(period: string): GSTR1Period {
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const monthNumber = parseInt(monthStr, 10);

  if (
    isNaN(year) ||
    isNaN(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new Error(`Invalid period format: ${period}. Expected YYYY-MM`);
  }

  return {
    month: period,
    year,
    monthNumber,
  };
}

// ─── UTILITY: getStateCode ──────────────────────────────────────────────────

/**
 * Extracts 2-digit state code from place_of_supply string.
 * Handles formats: "08-RAJASTHAN", "08", "Rajasthan"
 */
export function getStateCode(placeOfSupply: string | null): string {
  if (!placeOfSupply) return '99'; // Unknown state

  const trimmed = placeOfSupply.trim();

  // Format: "08-RAJASTHAN" or "08"
  const match = trimmed.match(/^(\d{2})/);
  if (match) {
    return match[1];
  }

  // Fallback for state name mapping (basic implementation)
  const stateMap: Record<string, string> = {
    RAJASTHAN: '08',
    DELHI: '07',
    MAHARASHTRA: '27',
    KARNATAKA: '29',
    KERALA: '32',
    'TAMIL NADU': '33',
    GUJARAT: '24',
    'UTTAR PRADESH': '09',
    GOA: '30',
    // Add more as needed
  };

  const stateName = trimmed.toUpperCase().replace(/-/g, ' ');
  return stateMap[stateName] || '99';
}

// ─── UTILITY: formatInvoiceDate ─────────────────────────────────────────────

/**
 * Formats invoice date to YYYY-MM-DD.
 */
export function formatInvoiceDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── MAIN: exportGSTR1 ───────────────────────────────────────────────────────

/**
 * Generates GSTR-1 export data for a given period and organization.
 *
 * @param supabase - Supabase client (admin or user context)
 * @param organizationId - Organization UUID
 * @param period - Period string in YYYY-MM format (e.g., "2026-03")
 * @returns GSTR1Export object with all sections
 */
export async function exportGSTR1(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  period: string
): Promise<GSTR1Export> {
  const parsedPeriod = parsePeriod(period);

  // Calculate date range for the period
  const startDate = new Date(parsedPeriod.year, parsedPeriod.monthNumber - 1, 1);
  const endDate = new Date(parsedPeriod.year, parsedPeriod.monthNumber, 0, 23, 59, 59);

  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  // ─── FETCH ORGANIZATION DETAILS ────────────────────────────────────────────

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('name, gstin, metadata')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  if (!org.gstin) {
    throw new Error('Organization GSTIN not configured. Cannot generate GSTR-1.');
  }

  const tradeName = (org.metadata as any)?.tradeName || null;

  // ─── FETCH INVOICES FOR PERIOD ─────────────────────────────────────────────

  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select(
      `
      id,
      invoice_number,
      created_at,
      total_amount,
      subtotal_amount,
      cgst,
      sgst,
      igst,
      place_of_supply,
      sac_code,
      e_invoice_status,
      e_invoice_cancelled_at,
      metadata
    `
    )
    .eq('organization_id', organizationId)
    .gte('created_at', startDateStr)
    .lte('created_at', endDateStr)
    .in('status', ['issued', 'partially_paid', 'paid']); // Exclude draft/cancelled invoices

  if (invoicesError) {
    throw new Error(`Failed to fetch invoices: ${invoicesError.message}`);
  }

  if (!invoices || invoices.length === 0) {
    // Return empty GSTR-1 structure
    return createEmptyGSTR1Export(org.gstin, org.name, tradeName, parsedPeriod);
  }

  // ─── FILTER OUT CANCELLED E-INVOICES ───────────────────────────────────────

  const validInvoices = invoices.filter(
    (inv) => inv.e_invoice_status !== 'cancelled' || !inv.e_invoice_cancelled_at
  );

  // ─── CATEGORIZE INVOICES ───────────────────────────────────────────────────

  const b2bInvoices: GSTR1B2BInvoice[] = [];
  const b2clInvoices: GSTR1B2CLInvoice[] = [];
  const b2csData: Record<string, GSTR1B2CSEntry> = {}; // Key: "stateCode-rateOfTax"
  const hsnData: Record<string, GSTR1HSNSummary> = {}; // Key: "hsnCode"

  for (const inv of validInvoices) {
    const metadata = (inv.metadata as any) || {};
    const buyerGSTIN = metadata.client_gstin || metadata.gstin || null;
    const buyerName = metadata.client_name || 'Unknown';
    const placeOfSupply = getStateCode(inv.place_of_supply);
    const sacCode = inv.sac_code || '998552'; // Default: Tour operator services

    const taxableValue = inv.subtotal_amount || 0;
    const cgst = inv.cgst || 0;
    const sgst = inv.sgst || 0;
    const igst = inv.igst || 0;
    const totalTax = cgst + sgst + igst;
    const invoiceValue = inv.total_amount || 0;

    // Calculate GST rate (in percentage)
    const gstRate = taxableValue > 0 ? Math.round((totalTax / taxableValue) * 100) : 0;

    // ─── CATEGORIZE: B2B, B2CL, or B2CS ────────────────────────────────────

    if (buyerGSTIN) {
      // B2B: Buyer has GSTIN
      b2bInvoices.push({
        gstin: buyerGSTIN,
        legalName: buyerName,
        invoiceNumber: inv.invoice_number,
        invoiceDate: formatInvoiceDate(inv.created_at),
        invoiceValue,
        placeOfSupply,
        reverseCharge: 'N',
        invoiceType: 'R', // Regular
        eCommerceGSTIN: null,
        taxableValue,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        cessAmount: 0,
      });
    } else if (invoiceValue > B2CL_THRESHOLD) {
      // B2CL: No GSTIN, invoice value > ₹2.5L
      b2clInvoices.push({
        invoiceNumber: inv.invoice_number,
        invoiceDate: formatInvoiceDate(inv.created_at),
        invoiceValue,
        placeOfSupply,
        taxableValue,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        cessAmount: 0,
      });
    } else {
      // B2CS: No GSTIN, invoice value ≤ ₹2.5L (aggregate by state + rate)
      const b2csKey = `${placeOfSupply}-${gstRate}`;

      if (!b2csData[b2csKey]) {
        b2csData[b2csKey] = {
          type: 'OE',
          placeOfSupply,
          rateOfTax: gstRate,
          taxableValue: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          cessAmount: 0,
        };
      }

      b2csData[b2csKey].taxableValue += taxableValue;
      b2csData[b2csKey].cgstAmount += cgst;
      b2csData[b2csKey].sgstAmount += sgst;
      b2csData[b2csKey].igstAmount += igst;
    }

    // ─── HSN SUMMARY ───────────────────────────────────────────────────────

    if (!hsnData[sacCode]) {
      hsnData[sacCode] = {
        hsnCode: sacCode,
        description: getServiceDescription(sacCode),
        uqc: 'OTH', // "Others" for services
        totalQuantity: 0,
        totalValue: 0,
        taxableValue: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        cessAmount: 0,
        rateOfTax: gstRate,
      };
    }

    hsnData[sacCode].totalQuantity += 1; // Count invoices as quantity
    hsnData[sacCode].totalValue += invoiceValue;
    hsnData[sacCode].taxableValue += taxableValue;
    hsnData[sacCode].cgstAmount += cgst;
    hsnData[sacCode].sgstAmount += sgst;
    hsnData[sacCode].igstAmount += igst;
  }

  // ─── AGGREGATE SUMMARY ─────────────────────────────────────────────────────

  const b2cs = Object.values(b2csData);
  const hsnSummary = Object.values(hsnData);

  const summary = {
    totalInvoices: validInvoices.length,
    totalB2BInvoices: b2bInvoices.length,
    totalB2CLInvoices: b2clInvoices.length,
    totalB2CSInvoices: b2cs.reduce((sum, e) => sum + 1, 0),
    totalTaxableValue: validInvoices.reduce((sum, inv) => sum + (inv.subtotal_amount || 0), 0),
    totalCGST: validInvoices.reduce((sum, inv) => sum + (inv.cgst || 0), 0),
    totalSGST: validInvoices.reduce((sum, inv) => sum + (inv.sgst || 0), 0),
    totalIGST: validInvoices.reduce((sum, inv) => sum + (inv.igst || 0), 0),
    totalCess: 0,
    totalTaxAmount: 0,
  };

  summary.totalTaxAmount = summary.totalCGST + summary.totalSGST + summary.totalIGST + summary.totalCess;

  return {
    gstin: org.gstin,
    legalName: org.name,
    tradeName,
    period: parsedPeriod,
    b2b: b2bInvoices,
    b2cl: b2clInvoices,
    b2cs,
    hsnSummary,
    summary,
  };
}

// ─── UTILITY: createEmptyGSTR1Export ────────────────────────────────────────

function createEmptyGSTR1Export(
  gstin: string,
  legalName: string,
  tradeName: string | null,
  period: GSTR1Period
): GSTR1Export {
  return {
    gstin,
    legalName,
    tradeName,
    period,
    b2b: [],
    b2cl: [],
    b2cs: [],
    hsnSummary: [],
    summary: {
      totalInvoices: 0,
      totalB2BInvoices: 0,
      totalB2CLInvoices: 0,
      totalB2CSInvoices: 0,
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalCess: 0,
      totalTaxAmount: 0,
    },
  };
}

// ─── UTILITY: getServiceDescription ─────────────────────────────────────────

/**
 * Returns a description for common SAC codes used in travel services.
 */
function getServiceDescription(sacCode: string): string {
  const descriptions: Record<string, string> = {
    '998552': 'Tour operator services',
    '996311': 'Room or unit accommodation services',
    '996421': 'Local transport by taxi/car',
    '996411': 'Domestic air transport',
    '998557': 'Tour guide services',
    '999715': 'Entry to cultural/heritage sites',
  };

  return descriptions[sacCode] || 'Travel and tourism services';
}

// ─── UTILITY: formatGSTR1AsCSV ──────────────────────────────────────────────

/**
 * Formats GSTR-1 export data as CSV strings for each section.
 * Returns an object with CSV strings for B2B, B2CL, B2CS, and HSN sections.
 */
export function formatGSTR1AsCSV(data: GSTR1Export): {
  b2b: string;
  b2cl: string;
  b2cs: string;
  hsn: string;
} {
  const b2bHeaders = [
    'GSTIN of Recipient',
    'Legal Name',
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Place of Supply',
    'Reverse Charge',
    'Invoice Type',
    'Taxable Value',
    'CGST Amount',
    'SGST Amount',
    'IGST Amount',
    'Cess Amount',
  ].join(',');

  const b2bRows = data.b2b
    .map((inv) =>
      [
        inv.gstin,
        `"${inv.legalName}"`,
        inv.invoiceNumber,
        inv.invoiceDate,
        inv.invoiceValue.toFixed(2),
        inv.placeOfSupply,
        inv.reverseCharge,
        inv.invoiceType,
        inv.taxableValue.toFixed(2),
        inv.cgstAmount.toFixed(2),
        inv.sgstAmount.toFixed(2),
        inv.igstAmount.toFixed(2),
        inv.cessAmount.toFixed(2),
      ].join(',')
    )
    .join('\n');

  const b2clHeaders = [
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Place of Supply',
    'Taxable Value',
    'CGST Amount',
    'SGST Amount',
    'IGST Amount',
    'Cess Amount',
  ].join(',');

  const b2clRows = data.b2cl
    .map((inv) =>
      [
        inv.invoiceNumber,
        inv.invoiceDate,
        inv.invoiceValue.toFixed(2),
        inv.placeOfSupply,
        inv.taxableValue.toFixed(2),
        inv.cgstAmount.toFixed(2),
        inv.sgstAmount.toFixed(2),
        inv.igstAmount.toFixed(2),
        inv.cessAmount.toFixed(2),
      ].join(',')
    )
    .join('\n');

  const b2csHeaders = [
    'Type',
    'Place of Supply',
    'Rate of Tax',
    'Taxable Value',
    'CGST Amount',
    'SGST Amount',
    'IGST Amount',
    'Cess Amount',
  ].join(',');

  const b2csRows = data.b2cs
    .map((entry) =>
      [
        entry.type,
        entry.placeOfSupply,
        entry.rateOfTax,
        entry.taxableValue.toFixed(2),
        entry.cgstAmount.toFixed(2),
        entry.sgstAmount.toFixed(2),
        entry.igstAmount.toFixed(2),
        entry.cessAmount.toFixed(2),
      ].join(',')
    )
    .join('\n');

  const hsnHeaders = [
    'HSN/SAC Code',
    'Description',
    'UQC',
    'Total Quantity',
    'Total Value',
    'Taxable Value',
    'CGST Amount',
    'SGST Amount',
    'IGST Amount',
    'Cess Amount',
    'Rate of Tax',
  ].join(',');

  const hsnRows = data.hsnSummary
    .map((item) =>
      [
        item.hsnCode,
        `"${item.description}"`,
        item.uqc,
        item.totalQuantity,
        item.totalValue.toFixed(2),
        item.taxableValue.toFixed(2),
        item.cgstAmount.toFixed(2),
        item.sgstAmount.toFixed(2),
        item.igstAmount.toFixed(2),
        item.cessAmount.toFixed(2),
        item.rateOfTax,
      ].join(',')
    )
    .join('\n');

  return {
    b2b: `${b2bHeaders}\n${b2bRows}`,
    b2cl: `${b2clHeaders}\n${b2clRows}`,
    b2cs: `${b2csHeaders}\n${b2csRows}`,
    hsn: `${hsnHeaders}\n${hsnRows}`,
  };
}
