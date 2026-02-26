// GST calculations for Indian tour operators
// Tour operators are registered under GST, must issue proper invoices

export const GSTRates = {
  tourPackage: 0.05 as const,  // 5% on packaged tours
  hotel: {
    under1000: 0 as const,     // No GST under ₹1,000/night
    under7500: 0.12 as const,  // 12% between ₹1,000-7,500/night
    above7500: 0.18 as const,  // 18% above ₹7,500/night
  },
  transport:     0.05 as const,  // 5% on transport
  airTickets:    0.05 as const,  // 5% economy, 12% business
  guideServices: 0.18 as const,  // 18% on guide services
  entryFees:     0    as const,  // Usually exempt
} as const

export interface GSTBreakdown {
  baseAmount: number
  cgst: number       // Central GST (half of total GST) — for intra-state
  sgst: number       // State GST (half of total GST) — for intra-state
  igst: number       // Integrated GST — for inter-state (equals cgst + sgst)
  totalGST: number
  totalWithGST: number
  isInterState: boolean
}

export interface GSTInvoiceData {
  invoiceNumber: string       // Format: INV-2026-001
  invoiceDate: Date
  operator: {
    name: string
    gstin: string             // 15-character GST Identification Number
    address: string
    state: string
    stateCode: string         // 2-digit state code (e.g. "08" for Rajasthan)
  }
  client: {
    name: string
    email: string
    phone: string
    address?: string
    gstin?: string            // Optional: B2B client GSTIN
  }
  lineItems: {
    description: string
    hsn: string               // HSN/SAC code
    quantity: number
    unit: string
    rate: number
    amount: number
    gstRate: number           // decimal: 0.05, 0.12, 0.18
    gstAmount: number
  }[]
  subtotal: number
  gstBreakdown: GSTBreakdown
  total: number
  amountInWords: string       // "Rupees One Lakh Twenty Thousand Only"
  paymentStatus: 'paid' | 'partial' | 'pending'
  amountPaid: number
  balanceDue: number
  notes: string
}

// ─── UTILITY: calculateGST ───────────────────────────────────────────────────

/**
 * Calculates CGST/SGST (intra-state) or IGST (inter-state) on a given amount.
 * @param amount     - Base amount (before GST)
 * @param rate       - GST rate as decimal (e.g. 0.05 for 5%)
 * @param isInterState - true if supplier & client are in different states
 */
export function calculateGST(
  amount: number,
  rate: number,
  isInterState: boolean
): GSTBreakdown {
  const totalGST = Math.round(amount * rate)
  const half     = Math.round(totalGST / 2)

  return {
    baseAmount:    amount,
    cgst:          isInterState ? 0 : half,
    sgst:          isInterState ? 0 : totalGST - half, // handles odd numbers
    igst:          isInterState ? totalGST : 0,
    totalGST,
    totalWithGST:  amount + totalGST,
    isInterState,
  }
}

// ─── UTILITY: generateInvoiceNumber ─────────────────────────────────────────

/**
 * Generates a sequential invoice number in the format INV-YYYY-NNN.
 * @param existingCount - Number of existing invoices (0-indexed count)
 */
export function generateInvoiceNumber(existingCount: number): string {
  const year = new Date().getFullYear()
  const seq  = String(existingCount + 1).padStart(3, '0')
  return `INV-${year}-${seq}`
}

// ─── UTILITY: amountToWords ─────────────────────────────────────────────────

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
]

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
  'Sixty', 'Seventy', 'Eighty', 'Ninety',
]

function wordsUnderThousand(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ones[n]
  if (n < 100) {
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
  }
  return (
    ones[Math.floor(n / 100)] +
    ' Hundred' +
    (n % 100 !== 0 ? ' ' + wordsUnderThousand(n % 100) : '')
  )
}

/**
 * Converts a number to Indian English words.
 * E.g. 120000 → "One Lakh Twenty Thousand"
 */
export function amountToWords(amount: number): string {
  const n = Math.round(Math.abs(amount))

  if (n === 0) return 'Zero'

  const crore    = Math.floor(n / 1_00_00_000)
  const lakh     = Math.floor((n % 1_00_00_000) / 1_00_000)
  const thousand = Math.floor((n % 1_00_000) / 1_000)
  const hundred  = n % 1_000

  const parts: string[] = []

  if (crore > 0)    parts.push(wordsUnderThousand(crore) + ' Crore')
  if (lakh > 0)     parts.push(wordsUnderThousand(lakh)  + ' Lakh')
  if (thousand > 0) parts.push(wordsUnderThousand(thousand) + ' Thousand')
  if (hundred > 0)  parts.push(wordsUnderThousand(hundred))

  return parts.join(' ')
}

// ─── SAC CODES FOR TRAVEL SERVICES ──────────────────────────────────────────
const SAC_CODES = {
  tourPackage:   '998552',   // Tour operator services
  accommodation: '996311',   // Room or unit accommodation services
  transport:     '996421',   // Local transport by taxi/car
  airTransport:  '996411',   // Domestic air transport
  guide:         '998557',   // Tour guide services
  entryFees:     '999715',   // Entry to cultural/heritage sites
}

// ─── createTourPackageInvoice ─────────────────────────────────────────────────

/**
 * Creates a complete GSTInvoiceData object from trip, operator and client data.
 */
export function createTourPackageInvoice(
  tripData: {
    name: string
    destination: string
    startDate: Date
    endDate: Date
    travelers: number
    packageCost: number         // base package cost before GST
    accommodationCost?: number
    transportCost?: number
    guideCost?: number
    flightCost?: number
    notes?: string
  },
  operatorData: {
    name: string
    gstin: string
    address: string
    state: string
    stateCode: string
    invoiceCount: number        // for generating invoice number
  },
  clientData: {
    name: string
    email: string
    phone: string
    address?: string
    state?: string
    gstin?: string
  }
): GSTInvoiceData {
  const isInterState = !!(
    clientData.state &&
    clientData.state.toLowerCase() !== operatorData.state.toLowerCase()
  )

  // Build line items
  const lineItems: GSTInvoiceData['lineItems'] = []

  // Main tour package
  const packageGST = calculateGST(tripData.packageCost, GSTRates.tourPackage, isInterState)
  lineItems.push({
    description: `Tour Package - ${tripData.name} (${tripData.destination})`,
    hsn: SAC_CODES.tourPackage,
    quantity: tripData.travelers,
    unit: 'Person',
    rate: Math.round(tripData.packageCost / tripData.travelers),
    amount: tripData.packageCost,
    gstRate: GSTRates.tourPackage,
    gstAmount: packageGST.totalGST,
  })

  // Transport (if separate line)
  if (tripData.transportCost && tripData.transportCost > 0) {
    const transportGST = calculateGST(tripData.transportCost, GSTRates.transport, isInterState)
    lineItems.push({
      description: `Local Transport & Transfers`,
      hsn: SAC_CODES.transport,
      quantity: 1,
      unit: 'Package',
      rate: tripData.transportCost,
      amount: tripData.transportCost,
      gstRate: GSTRates.transport,
      gstAmount: transportGST.totalGST,
    })
  }

  // Guide services (if separate)
  if (tripData.guideCost && tripData.guideCost > 0) {
    const guideGST = calculateGST(tripData.guideCost, GSTRates.guideServices, isInterState)
    lineItems.push({
      description: `Licensed Tour Guide Services`,
      hsn: SAC_CODES.guide,
      quantity: 1,
      unit: 'Package',
      rate: tripData.guideCost,
      amount: tripData.guideCost,
      gstRate: GSTRates.guideServices,
      gstAmount: guideGST.totalGST,
    })
  }

  // Flights (if separate)
  if (tripData.flightCost && tripData.flightCost > 0) {
    const flightGST = calculateGST(tripData.flightCost, GSTRates.airTickets, isInterState)
    lineItems.push({
      description: `Domestic Air Tickets`,
      hsn: SAC_CODES.airTransport,
      quantity: tripData.travelers,
      unit: 'Person',
      rate: Math.round(tripData.flightCost / tripData.travelers),
      amount: tripData.flightCost,
      gstRate: GSTRates.airTickets,
      gstAmount: flightGST.totalGST,
    })
  }

  // Subtotal and total GST
  const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0)
  const totalGSTOnItems = lineItems.reduce((sum, li) => sum + li.gstAmount, 0)

  const gstBreakdown: GSTBreakdown = {
    baseAmount:   subtotal,
    cgst:         isInterState ? 0 : Math.round(totalGSTOnItems / 2),
    sgst:         isInterState ? 0 : totalGSTOnItems - Math.round(totalGSTOnItems / 2),
    igst:         isInterState ? totalGSTOnItems : 0,
    totalGST:     totalGSTOnItems,
    totalWithGST: subtotal + totalGSTOnItems,
    isInterState,
  }

  const total = subtotal + totalGSTOnItems

  return {
    invoiceNumber:  generateInvoiceNumber(operatorData.invoiceCount),
    invoiceDate:    new Date(),
    operator:       operatorData,
    client:         clientData,
    lineItems,
    subtotal,
    gstBreakdown,
    total,
    amountInWords:  `Rupees ${amountToWords(total)} Only`,
    paymentStatus:  'pending',
    amountPaid:     0,
    balanceDue:     total,
    notes:          tripData.notes ||
      'Payment due within 7 days of invoice date. GST as applicable. Subject to company T&C.',
  }
}
