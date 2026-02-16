/**
 * GST Calculator for India
 *
 * Calculates Goods and Services Tax (GST) for invoices based on Indian tax regulations.
 * Software services are taxed at 18% GST.
 *
 * Types of GST:
 * - CGST (Central GST): 9% for intra-state transactions
 * - SGST (State GST): 9% for intra-state transactions
 * - IGST (Integrated GST): 18% for inter-state transactions
 *
 * Rules:
 * - If buyer and seller are in the SAME state: CGST (9%) + SGST (9%) = 18%
 * - If buyer and seller are in DIFFERENT states: IGST (18%)
 */

export interface GSTCalculation {
  cgst: number; // Central GST (9% for intra-state)
  sgst: number; // State GST (9% for intra-state)
  igst: number; // Integrated GST (18% for inter-state)
  totalGst: number; // Total GST amount
  subtotal: number; // Original amount before GST
  grandTotal: number; // Total amount including GST
}

export const GST_RATE = 0.18; // 18% GST for software services (SAC 998314)
export const CGST_RATE = 0.09; // 9% for intra-state
export const SGST_RATE = 0.09; // 9% for intra-state
export const IGST_RATE = 0.18; // 18% for inter-state

// Indian states and union territories
export const INDIAN_STATES = [
  'ANDHRA PRADESH',
  'ARUNACHAL PRADESH',
  'ASSAM',
  'BIHAR',
  'CHHATTISGARH',
  'GOA',
  'GUJARAT',
  'HARYANA',
  'HIMACHAL PRADESH',
  'JHARKHAND',
  'KARNATAKA',
  'KERALA',
  'MADHYA PRADESH',
  'MAHARASHTRA',
  'MANIPUR',
  'MEGHALAYA',
  'MIZORAM',
  'NAGALAND',
  'ODISHA',
  'PUNJAB',
  'RAJASTHAN',
  'SIKKIM',
  'TAMIL NADU',
  'TELANGANA',
  'TRIPURA',
  'UTTAR PRADESH',
  'UTTARAKHAND',
  'WEST BENGAL',
  // Union Territories
  'ANDAMAN AND NICOBAR ISLANDS',
  'CHANDIGARH',
  'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  'DELHI',
  'JAMMU AND KASHMIR',
  'LADAKH',
  'LAKSHADWEEP',
  'PUDUCHERRY',
] as const;

export type IndianState = typeof INDIAN_STATES[number];

/**
 * Calculate GST for an invoice
 *
 * @param subtotal - Amount before GST (in rupees)
 * @param companyState - State where your company is registered
 * @param customerState - State where the customer is located
 * @returns GST calculation breakdown
 */
export function calculateGST(
  subtotal: number,
  companyState: string,
  customerState: string
): GSTCalculation {
  if (subtotal < 0) {
    throw new Error('Subtotal cannot be negative');
  }

  // Normalize state names (remove special characters, convert to uppercase)
  const normalizedCompanyState = normalizeStateName(companyState);
  const normalizedCustomerState = normalizeStateName(customerState);

  // Check if transaction is intra-state or inter-state
  const isIntraState = normalizedCompanyState === normalizedCustomerState;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isIntraState) {
    // Intra-state transaction: CGST + SGST
    cgst = roundToTwoDecimals(subtotal * CGST_RATE);
    sgst = roundToTwoDecimals(subtotal * SGST_RATE);
  } else {
    // Inter-state transaction: IGST
    igst = roundToTwoDecimals(subtotal * IGST_RATE);
  }

  const totalGst = cgst + sgst + igst;
  const grandTotal = subtotal + totalGst;

  return {
    cgst,
    sgst,
    igst,
    totalGst,
    subtotal,
    grandTotal,
  };
}

/**
 * Calculate GST for multiple line items
 *
 * @param items - Array of items with amounts
 * @param companyState - State where your company is registered
 * @param customerState - State where the customer is located
 * @returns Combined GST calculation
 */
export function calculateGSTForItems(
  items: Array<{ amount: number; quantity?: number }>,
  companyState: string,
  customerState: string
): GSTCalculation {
  const subtotal = items.reduce((sum, item) => {
    const quantity = item.quantity || 1;
    return sum + item.amount * quantity;
  }, 0);

  return calculateGST(subtotal, companyState, customerState);
}

/**
 * Calculate reverse GST (extract GST from inclusive amount)
 *
 * If you have a total amount that INCLUDES GST and want to know the breakdown:
 *
 * @param totalAmount - Total amount including GST
 * @param companyState - State where your company is registered
 * @param customerState - State where the customer is located
 * @returns GST calculation breakdown
 */
export function calculateReverseGST(
  totalAmount: number,
  companyState: string,
  customerState: string
): GSTCalculation {
  if (totalAmount < 0) {
    throw new Error('Total amount cannot be negative');
  }

  // Formula: Subtotal = Total / (1 + GST_RATE)
  const subtotal = roundToTwoDecimals(totalAmount / (1 + GST_RATE));

  return calculateGST(subtotal, companyState, customerState);
}

/**
 * Calculate TDS (Tax Deducted at Source)
 *
 * For B2B transactions, customers may deduct 10% TDS on services.
 * Section 194J of Income Tax Act.
 *
 * @param amount - Invoice amount (including GST)
 * @param tdsRate - TDS rate (default 10% = 0.10)
 * @returns TDS amount to be deducted
 */
export function calculateTDS(amount: number, tdsRate: number = 0.10): number {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }

  if (tdsRate < 0 || tdsRate > 1) {
    throw new Error('TDS rate must be between 0 and 1');
  }

  return roundToTwoDecimals(amount * tdsRate);
}

/**
 * Format GST calculation for invoice display
 *
 * @param calculation - GST calculation result
 * @param currency - Currency symbol (default '₹')
 * @returns Formatted breakdown text
 */
export function formatGSTBreakdown(
  calculation: GSTCalculation,
  currency: string = '₹'
): string {
  const lines: string[] = [];

  lines.push(`Subtotal: ${currency}${calculation.subtotal.toFixed(2)}`);

  if (calculation.cgst > 0) {
    lines.push(`CGST (9%): ${currency}${calculation.cgst.toFixed(2)}`);
  }

  if (calculation.sgst > 0) {
    lines.push(`SGST (9%): ${currency}${calculation.sgst.toFixed(2)}`);
  }

  if (calculation.igst > 0) {
    lines.push(`IGST (18%): ${currency}${calculation.igst.toFixed(2)}`);
  }

  lines.push(`Total GST: ${currency}${calculation.totalGst.toFixed(2)}`);
  lines.push(`Grand Total: ${currency}${calculation.grandTotal.toFixed(2)}`);

  return lines.join('\n');
}

/**
 * Validate GSTIN (GST Identification Number) format
 *
 * Format: 2 digits (state code) + 10 characters (PAN) + 1 digit (entity number)
 *         + 1 character (Z) + 1 check digit
 * Example: 27AABCU9603R1ZX
 *
 * @param gstin - GSTIN to validate
 * @returns true if valid format
 */
export function validateGSTIN(gstin: string): boolean {
  if (!gstin) return false;

  // Remove spaces and convert to uppercase
  const cleanGSTIN = gstin.replace(/\s/g, '').toUpperCase();

  // Check length (15 characters)
  if (cleanGSTIN.length !== 15) return false;

  // Regex pattern for GSTIN
  // Format: 2 digits + 10 alphanumeric (PAN) + 1 digit + Z + 1 alphanumeric
  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  return gstinPattern.test(cleanGSTIN);
}

/**
 * Normalize state name for comparison
 *
 * @param stateName - State name to normalize
 * @returns Normalized state name (uppercase, no special chars)
 */
function normalizeStateName(stateName: string): string {
  return stateName
    .toUpperCase()
    .trim()
    .replace(/[^A-Z\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Round number to 2 decimal places (standard for currency)
 *
 * @param value - Number to round
 * @returns Rounded number
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Get state code from GSTIN
 *
 * @param gstin - GSTIN number
 * @returns State code (first 2 digits) or null if invalid
 */
export function getStateCodeFromGSTIN(gstin: string): string | null {
  if (!validateGSTIN(gstin)) return null;

  return gstin.substring(0, 2);
}

/**
 * Check if GSTIN belongs to a specific state
 *
 * @param gstin - GSTIN number
 * @param stateCode - State code to check (2 digits)
 * @returns true if GSTIN belongs to the state
 */
export function isGSTINFromState(gstin: string, stateCode: string): boolean {
  const extractedCode = getStateCodeFromGSTIN(gstin);
  return extractedCode === stateCode;
}

// State code mapping (commonly used states)
export const STATE_CODES: Record<string, string> = {
  'ANDHRA PRADESH': '37',
  'ARUNACHAL PRADESH': '12',
  'ASSAM': '18',
  'BIHAR': '10',
  'CHHATTISGARH': '22',
  'GOA': '30',
  'GUJARAT': '24',
  'HARYANA': '06',
  'HIMACHAL PRADESH': '02',
  'JHARKHAND': '20',
  'KARNATAKA': '29',
  'KERALA': '32',
  'MADHYA PRADESH': '23',
  'MAHARASHTRA': '27',
  'MANIPUR': '14',
  'MEGHALAYA': '17',
  'MIZORAM': '15',
  'NAGALAND': '13',
  'ODISHA': '21',
  'PUNJAB': '03',
  'RAJASTHAN': '08',
  'SIKKIM': '11',
  'TAMIL NADU': '33',
  'TELANGANA': '36',
  'TRIPURA': '16',
  'UTTAR PRADESH': '09',
  'UTTARAKHAND': '05',
  'WEST BENGAL': '19',
  'DELHI': '07',
  'PUDUCHERRY': '34',
  'CHANDIGARH': '04',
  'JAMMU AND KASHMIR': '01',
  'LADAKH': '38',
};

/**
 * Get state name from state code
 *
 * @param stateCode - 2-digit state code
 * @returns State name or null if not found
 */
export function getStateNameFromCode(stateCode: string): string | null {
  const entry = Object.entries(STATE_CODES).find(([, code]) => code === stateCode);
  return entry ? entry[0] : null;
}
