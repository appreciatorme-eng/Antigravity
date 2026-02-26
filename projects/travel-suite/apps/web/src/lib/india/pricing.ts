// India-specific pricing engine for tour operators

import { getDestinationById, getSeasonalPeakMultiplier, Destination } from './destinations'

export interface PricingInput {
  destinationId: string
  startDate: Date
  endDate: Date
  travelers: number
  tier: 'budget' | 'standard' | 'premium' | 'luxury'
  inclusions: {
    accommodation: boolean
    transport: boolean
    meals: 'none' | 'breakfast' | 'half_board' | 'full_board'
    guide: boolean
    entranceFees: boolean
    flights: boolean
  }
  markup: number // operator markup percentage (default 25)
}

export interface PricingBreakdown {
  days: number
  baseRatePerPersonPerDay: number
  accommodationCost: number
  transportCost: number
  mealsCost: number
  guideCost: number
  entranceFeesCost: number
  subtotal: number
  operatorMarkup: number
  markupAmount: number
  gstAmount: number // 5% on packages
  totalPerPerson: number
  totalForGroup: number
  suggestedSellingPrice: number
  marginAmount: number
  marginPercentage: number
  seasonalNote: string
  competitorRange: { low: number; high: number; avg: number }
}

// ─── BASE RATES PER PERSON PER DAY (INR) ─────────────────────────────────────
const BASE_DAILY_RATES: Record<string, { min: number; max: number }> = {
  budget:   { min: 1500,  max: 3000  },
  standard: { min: 3000,  max: 6000  },
  premium:  { min: 6000,  max: 12000 },
  luxury:   { min: 12000, max: 25000 },
}

// Midpoint of tier range used as calculation base
const TIER_BASE_RATE: Record<string, number> = {
  budget:   2200,
  standard: 4500,
  premium:  9000,
  luxury:   18000,
}

// ─── MEAL ADD-ONS PER PERSON PER DAY (INR) ────────────────────────────────────
const MEAL_DAILY_COST: Record<string, number> = {
  none:       0,
  breakfast:  500,
  half_board: 1200,
  full_board: 2000,
}

// ─── GUIDE COST PER DAY (INR) ────────────────────────────────────────────────
const GUIDE_DAILY_COST_ENGLISH = 800
const GUIDE_DAILY_COST_HINDI   = 600

// Guide is shared cost (not per person); billed once per day, split by group
// For pricing purposes we include English guide cost as a fixed daily component

// ─── TRANSPORT COST PER PERSON PER DAY (INR, by tier) ────────────────────────
const TRANSPORT_DAILY_RATE: Record<string, number> = {
  budget:   600,
  standard: 1000,
  premium:  1800,
  luxury:   3500,
}

// ─── ENTRANCE FEES PER PERSON PER DAY (INR, by tier) ─────────────────────────
const ENTRANCE_DAILY_RATE: Record<string, number> = {
  budget:   200,
  standard: 400,
  premium:  700,
  luxury:   1000,
}

// ─── GROUP DISCOUNTS ──────────────────────────────────────────────────────────
function getGroupDiscount(travelers: number): number {
  if (travelers >= 20) return 0.20
  if (travelers >= 10) return 0.15
  if (travelers >= 5)  return 0.08
  return 0
}

// ─── COMPETITOR RANGE MULTIPLIERS ────────────────────────────────────────────
const COMPETITOR_MULTIPLIERS = { low: 0.85, high: 1.30, avg: 1.05 }

// ─── MAIN PRICING FUNCTION ───────────────────────────────────────────────────

export function calculateTripPrice(input: PricingInput): PricingBreakdown {
  const {
    destinationId,
    startDate,
    endDate,
    travelers,
    tier,
    inclusions,
    markup,
  } = input

  // Calculate trip duration in days
  const msPerDay = 1000 * 60 * 60 * 24
  const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay))

  // Get destination for seasonal multiplier
  const destination: Destination | undefined = getDestinationById(destinationId)
  const tripStartMonth = startDate.getMonth() + 1 // 1-12
  const seasonalMultiplier = destination
    ? getSeasonalPeakMultiplier(destination, tripStartMonth)
    : 1.0

  // Build seasonal note
  let seasonalNote = ''
  if (seasonalMultiplier > 1.0) {
    seasonalNote = 'Peak season surcharge applied (+30%)'
  } else if (seasonalMultiplier < 1.0) {
    seasonalNote = 'Off-season discount applied (-20%)'
  } else {
    seasonalNote = 'Regular season pricing'
  }

  // Base rate per person per day (accommodation)
  const baseRatePerPersonPerDay = inclusions.accommodation
    ? Math.round(TIER_BASE_RATE[tier] * seasonalMultiplier)
    : 0

  // Accommodation cost: per person per day
  const accommodationCost = baseRatePerPersonPerDay * days * travelers

  // Transport cost: per person per day (if included)
  const transportCost = inclusions.transport
    ? Math.round(TRANSPORT_DAILY_RATE[tier] * seasonalMultiplier) * days * travelers
    : 0

  // Meals cost: per person per day
  const mealsPerPersonPerDay = MEAL_DAILY_COST[inclusions.meals]
  const mealsCost = mealsPerPersonPerDay * days * travelers

  // Guide cost: flat daily rate, not per person (shared) — we include it as total cost
  const rawGuideCostPerDay = GUIDE_DAILY_COST_ENGLISH
  const guideCost = inclusions.guide ? rawGuideCostPerDay * days : 0

  // Entrance fees: per person per day (if included)
  const entranceFeesCost = inclusions.entranceFees
    ? ENTRANCE_DAILY_RATE[tier] * days * travelers
    : 0

  // Subtotal before group discount, markup and GST
  const subtotalBeforeDiscount = accommodationCost + transportCost + mealsCost + guideCost + entranceFeesCost

  // Apply group discount
  const groupDiscount = getGroupDiscount(travelers)
  const subtotal = Math.round(subtotalBeforeDiscount * (1 - groupDiscount))

  // Operator markup
  const markupPercent = markup || 25
  const markupAmount = Math.round(subtotal * markupPercent / 100)

  // GST: 5% on tour packages (applied on subtotal + markup)
  const priceBeforeGST = subtotal + markupAmount
  const gstAmount = Math.round(priceBeforeGST * 0.05)

  // Totals
  const totalForGroup = priceBeforeGST + gstAmount
  const totalPerPerson = travelers > 0 ? Math.round(totalForGroup / travelers) : totalForGroup

  // Suggested selling price = totalForGroup (includes markup + GST)
  const suggestedSellingPrice = totalForGroup

  // Margin
  const marginAmount = markupAmount
  const marginPercentage = priceBeforeGST > 0
    ? parseFloat(((markupAmount / priceBeforeGST) * 100).toFixed(1))
    : 0

  // Competitor range (based on per-person price)
  const competitorRange = {
    low: Math.round(totalPerPerson * COMPETITOR_MULTIPLIERS.low),
    high: Math.round(totalPerPerson * COMPETITOR_MULTIPLIERS.high),
    avg: Math.round(totalPerPerson * COMPETITOR_MULTIPLIERS.avg),
  }

  return {
    days,
    baseRatePerPersonPerDay,
    accommodationCost,
    transportCost,
    mealsCost,
    guideCost,
    entranceFeesCost,
    subtotal,
    operatorMarkup: markupPercent,
    markupAmount,
    gstAmount,
    totalPerPerson,
    totalForGroup,
    suggestedSellingPrice,
    marginAmount,
    marginPercentage,
    seasonalNote,
    competitorRange,
  }
}

/**
 * Returns a rough estimate in ₹ for Quick Quote purposes.
 * No complex breakdown — just a fast per-person total.
 */
export function getQuickEstimate(
  destinationId: string,
  days: number,
  travelers: number,
  tier: string
): number {
  const validTier = (['budget', 'standard', 'premium', 'luxury'].includes(tier)
    ? tier
    : 'standard') as 'budget' | 'standard' | 'premium' | 'luxury'

  const safedays = Math.max(1, days)
  const safeTravelers = Math.max(1, travelers)

  const destination = getDestinationById(destinationId)
  const now = new Date()
  const month = now.getMonth() + 1
  const seasonalMultiplier = destination ? getSeasonalPeakMultiplier(destination, month) : 1.0

  const basePerPersonPerDay = Math.round(TIER_BASE_RATE[validTier] * seasonalMultiplier)
  const transportPerDay     = Math.round(TRANSPORT_DAILY_RATE[validTier] * seasonalMultiplier)
  const mealsPerDay         = MEAL_DAILY_COST['breakfast']
  const entrancePerDay      = ENTRANCE_DAILY_RATE[validTier]

  const rawCostPerPerson = (basePerPersonPerDay + transportPerDay + mealsPerDay + entrancePerDay) * safedays

  const groupDiscount = getGroupDiscount(safeTravelers)
  const afterDiscount = rawCostPerPerson * (1 - groupDiscount)

  // Add 25% markup + 5% GST
  const withMarkup = afterDiscount * 1.25
  const withGST    = withMarkup * 1.05

  return Math.round(withGST)
}

export { BASE_DAILY_RATES, TIER_BASE_RATE }
