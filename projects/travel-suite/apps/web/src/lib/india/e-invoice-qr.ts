// E-invoice QR code data formatter per government specifications
// QR code format: Pipe-delimited string per NIC e-invoice QR code schema

/**
 * E-invoice QR code data structure per government specification
 * Format: Pipe-delimited fields as per NIC e-invoice QR code schema
 */
export interface EInvoiceQRData {
  sellerGstin: string;          // Seller's GSTIN (15 chars)
  buyerGstin: string;           // Buyer's GSTIN (15 chars) or "URP" for unregistered
  invoiceNumber: string;        // Invoice number
  invoiceDate: string;          // Invoice date in DD/MM/YYYY format
  invoiceValue: number;         // Total invoice value
  placeOfSupply: string;        // Place of supply (2-digit state code)
  reverseCharge: 'Y' | 'N';     // Reverse charge applicable (Y/N)
  irn: string;                  // Invoice Reference Number (64 chars)
  irnGenerationDate: string;    // IRN generation date-time
}

/**
 * Parsed QR code data with additional metadata
 */
export interface ParsedQRCodeData extends EInvoiceQRData {
  rawData: string;              // Original pipe-delimited string
  isValid: boolean;             // Whether the QR code format is valid
  validationErrors: string[];   // Any validation errors found
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const QR_FIELD_COUNT = 9;
const GSTIN_LENGTH = 15;
const IRN_LENGTH = 64;

// ─── VALIDATION ─────────────────────────────────────────────────────────────

/**
 * Validates GSTIN format (15 alphanumeric characters)
 */
function validateGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  if (gstin === 'URP') return true; // Unregistered person
  if (gstin.length !== GSTIN_LENGTH) return false;
  // GSTIN format: 2-digit state code + 10-digit PAN + 1-digit entity number + Z + 1-digit checksum
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(gstin);
}

/**
 * Validates date format (DD/MM/YYYY)
 */
function validateDateFormat(date: string): boolean {
  if (!date) return false;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (!match) return false;

  const [, day, month, year] = match;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2000 && y <= 2100;
}

/**
 * Validates IRN format (64-character alphanumeric)
 */
function validateIRN(irn: string): boolean {
  if (!irn) return false;
  if (irn.length !== IRN_LENGTH) return false;
  return /^[0-9A-Z]+$/.test(irn);
}

/**
 * Validates state code (2-digit number)
 */
function validateStateCode(stateCode: string): boolean {
  if (!stateCode) return false;
  const code = parseInt(stateCode, 10);
  return !isNaN(code) && code >= 1 && code <= 38; // Valid Indian state codes
}

// ─── FORMATTING ─────────────────────────────────────────────────────────────

/**
 * Formats e-invoice data into QR code string per government specification.
 *
 * Format (pipe-delimited):
 * Seller GSTIN|Buyer GSTIN|Invoice Number|Invoice Date|Invoice Value|Place of Supply|Reverse Charge|IRN|IRN Date
 *
 * @example
 * ```ts
 * const qrData = formatEInvoiceQRData({
 *   sellerGstin: '29AABCT1332L1Z5',
 *   buyerGstin: 'URP',
 *   invoiceNumber: 'INV-2026-001',
 *   invoiceDate: '16/03/2026',
 *   invoiceValue: 120000,
 *   placeOfSupply: '08',
 *   reverseCharge: 'N',
 *   irn: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0',
 *   irnGenerationDate: '16/03/2026 14:30:00'
 * });
 * // Returns: "29AABCT1332L1Z5|URP|INV-2026-001|16/03/2026|120000|08|N|A1B2...D0|16/03/2026 14:30:00"
 * ```
 */
export function formatEInvoiceQRData(data: EInvoiceQRData): string {
  const {
    sellerGstin,
    buyerGstin,
    invoiceNumber,
    invoiceDate,
    invoiceValue,
    placeOfSupply,
    reverseCharge,
    irn,
    irnGenerationDate,
  } = data;

  // Format invoice value as integer (no decimals in QR code)
  const formattedValue = Math.round(invoiceValue);

  return [
    sellerGstin,
    buyerGstin || 'URP', // Default to URP (Unregistered Person) if no buyer GSTIN
    invoiceNumber,
    invoiceDate,
    formattedValue,
    placeOfSupply,
    reverseCharge,
    irn,
    irnGenerationDate,
  ].join('|');
}

// ─── PARSING ────────────────────────────────────────────────────────────────

/**
 * Parses QR code data string into structured format with validation.
 *
 * @param qrCodeData - Pipe-delimited QR code string from IRP
 * @returns Parsed data with validation results
 *
 * @example
 * ```ts
 * const parsed = parseEInvoiceQRData("29AABCT1332L1Z5|URP|INV-2026-001|16/03/2026|120000|08|N|A1B2...D0|16/03/2026 14:30:00");
 * if (parsed.isValid) {
 *   console.log('IRN:', parsed.irn);
 * } else {
 *   console.error('Validation errors:', parsed.validationErrors);
 * }
 * ```
 */
export function parseEInvoiceQRData(qrCodeData: string): ParsedQRCodeData {
  const validationErrors: string[] = [];
  const fields = qrCodeData.split('|');

  // Validate field count
  if (fields.length !== QR_FIELD_COUNT) {
    validationErrors.push(
      `Invalid field count: expected ${QR_FIELD_COUNT}, got ${fields.length}`
    );
  }

  const [
    sellerGstin = '',
    buyerGstin = '',
    invoiceNumber = '',
    invoiceDate = '',
    invoiceValueStr = '',
    placeOfSupply = '',
    reverseCharge = '',
    irn = '',
    irnGenerationDate = '',
  ] = fields;

  // Validate seller GSTIN
  if (!validateGSTIN(sellerGstin)) {
    validationErrors.push(`Invalid seller GSTIN: ${sellerGstin}`);
  }

  // Validate buyer GSTIN (can be "URP" for unregistered)
  if (!validateGSTIN(buyerGstin)) {
    validationErrors.push(`Invalid buyer GSTIN: ${buyerGstin}`);
  }

  // Validate invoice number
  if (!invoiceNumber) {
    validationErrors.push('Invoice number is required');
  }

  // Validate invoice date
  if (!validateDateFormat(invoiceDate)) {
    validationErrors.push(`Invalid invoice date format: ${invoiceDate} (expected DD/MM/YYYY)`);
  }

  // Validate invoice value
  const invoiceValue = parseFloat(invoiceValueStr);
  if (isNaN(invoiceValue) || invoiceValue <= 0) {
    validationErrors.push(`Invalid invoice value: ${invoiceValueStr}`);
  }

  // Validate place of supply
  if (!validateStateCode(placeOfSupply)) {
    validationErrors.push(`Invalid place of supply: ${placeOfSupply} (expected 2-digit state code)`);
  }

  // Validate reverse charge
  if (reverseCharge !== 'Y' && reverseCharge !== 'N') {
    validationErrors.push(`Invalid reverse charge: ${reverseCharge} (expected Y or N)`);
  }

  // Validate IRN
  if (!validateIRN(irn)) {
    validationErrors.push(`Invalid IRN: ${irn} (expected 64-character alphanumeric)`);
  }

  // Validate IRN generation date
  if (!irnGenerationDate) {
    validationErrors.push('IRN generation date is required');
  }

  return {
    sellerGstin,
    buyerGstin,
    invoiceNumber,
    invoiceDate,
    invoiceValue,
    placeOfSupply,
    reverseCharge: reverseCharge as 'Y' | 'N',
    irn,
    irnGenerationDate,
    rawData: qrCodeData,
    isValid: validationErrors.length === 0,
    validationErrors,
  };
}

// ─── HELPER UTILITIES ───────────────────────────────────────────────────────

/**
 * Formats Date object to DD/MM/YYYY format for QR code.
 */
export function formatDateForQR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats Date object to DD/MM/YYYY HH:MM:SS format for IRN generation date.
 */
export function formatDateTimeForQR(date: Date): string {
  const dateStr = formatDateForQR(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * Converts state code to 2-digit format (e.g., "8" -> "08")
 */
export function formatStateCode(stateCode: string | number): string {
  const code = typeof stateCode === 'string' ? parseInt(stateCode, 10) : stateCode;
  if (isNaN(code) || code < 1 || code > 38) {
    throw new Error(`Invalid state code: ${stateCode}`);
  }
  return String(code).padStart(2, '0');
}

/**
 * Extracts display-friendly summary from QR code data for UI.
 */
export function getQRCodeSummary(qrCodeData: string): {
  sellerGstin: string;
  invoiceNumber: string;
  invoiceValue: string;
  irn: string;
  isValid: boolean;
} | null {
  try {
    const parsed = parseEInvoiceQRData(qrCodeData);
    return {
      sellerGstin: parsed.sellerGstin,
      invoiceNumber: parsed.invoiceNumber,
      invoiceValue: `₹${parsed.invoiceValue.toLocaleString('en-IN')}`,
      irn: parsed.irn,
      isValid: parsed.isValid,
    };
  } catch {
    return null;
  }
}
