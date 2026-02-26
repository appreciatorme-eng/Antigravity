'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator, Send, IndianRupee, Calendar, MapPin, Users,
  ChevronDown, Info, TrendingUp, MessageSquare, AlertCircle,
  Check, Utensils, Car, BedDouble, Compass, Ticket,
} from 'lucide-react'
import { GlassModal } from '@/components/glass/GlassModal'
import { GlassButton } from '@/components/glass/GlassButton'
import { GlassInput } from '@/components/glass/GlassInput'
import { useToast } from '@/components/ui/toast'
import { calculateTripPrice, type PricingBreakdown, type PricingInput } from '@/lib/india/pricing'
import { searchDestinations, type Destination } from '@/lib/india/destinations'
import { formatINR, formatINRShort, formatTravelerCount } from '@/lib/india/formats'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface QuickQuoteModalProps {
  isOpen: boolean
  onClose: () => void
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)))
}

// ─── INCLUSION TOGGLE ────────────────────────────────────────────────────────

interface InclusionToggleProps {
  icon: React.ElementType
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  color?: string
}

function InclusionToggle({ icon: Icon, label, checked, onChange, color = '#00d084' }: InclusionToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
        checked
          ? 'text-white shadow-sm'
          : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
      }`}
      style={checked ? { backgroundColor: `${color}25`, borderColor: `${color}50`, color } : {}}
    >
      {checked ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
      {label}
    </button>
  )
}

// ─── BREAKDOWN ROW ────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  value,
  sub,
  highlight,
  dimmed,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  dimmed?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between text-sm ${
        highlight ? 'font-black text-white' : dimmed ? 'text-white/40' : 'text-white/70'
      }`}
    >
      <span className={highlight ? 'text-white' : ''}>{label}</span>
      <div className="text-right">
        <span className={highlight ? 'text-[#00d084] text-base' : ''}>{value}</span>
        {sub && <div className="text-[10px] text-white/40 font-normal">{sub}</div>}
      </div>
    </div>
  )
}

// ─── DESTINATION AUTOCOMPLETE ─────────────────────────────────────────────────

interface DestinationInputProps {
  value: string
  onSelect: (dest: Destination) => void
  onClear: () => void
}

function DestinationInput({ value, onSelect, onClear }: DestinationInputProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Destination[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (query.trim().length >= 1) {
      setResults(searchDestinations(query).slice(0, 8))
      setOpen(true)
    } else {
      setResults([])
      setOpen(false)
    }
  }, [query])

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (dest: Destination) => {
    setQuery(dest.name)
    setOpen(false)
    onSelect(dest)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (!e.target.value) onClear()
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="e.g. Jaipur, Goa, Munnar..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 dark:bg-white/10 border border-white/20 text-secondary dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm text-sm"
        />
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden shadow-2xl border border-white/20"
            style={{ backgroundColor: '#0d1f3c' }}
          >
            {results.map((dest, i) => (
              <button
                key={dest.id}
                onMouseDown={() => handleSelect(dest)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/10 transition-all text-sm ${
                  i < results.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <div>
                  <span className="font-semibold text-white">{dest.name}</span>
                  <span className="text-white/40 ml-2 text-xs">{dest.state}</span>
                </div>
                <div className="flex items-center gap-1">
                  {dest.type.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50 capitalize"
                    >
                      {t.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type Tier = 'budget' | 'standard' | 'premium' | 'luxury'
type Meals = 'none' | 'breakfast' | 'half_board' | 'full_board'

const TIER_OPTIONS: { value: Tier; label: string; hint: string }[] = [
  { value: 'budget',   label: 'Budget',   hint: '₹1.5K–3K/day' },
  { value: 'standard', label: 'Standard', hint: '₹3K–6K/day'   },
  { value: 'premium',  label: 'Premium',  hint: '₹6K–12K/day'  },
  { value: 'luxury',   label: 'Luxury',   hint: '₹12K–25K/day' },
]

const MEAL_OPTIONS: { value: Meals; label: string }[] = [
  { value: 'none',       label: 'No Meals'   },
  { value: 'breakfast',  label: 'Breakfast'  },
  { value: 'half_board', label: 'Half Board' },
  { value: 'full_board', label: 'Full Board' },
]

export function QuickQuoteModal({ isOpen, onClose }: QuickQuoteModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)

  // Form state
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null)
  const [destName, setDestName] = useState('')
  const [startDate, setStartDate] = useState(addDays(today(), 30))
  const [endDate, setEndDate] = useState(addDays(today(), 37))
  const [travelers, setTravelers] = useState(2)
  const [tier, setTier] = useState<Tier>('standard')
  const [markup, setMarkup] = useState(25)
  const [meals, setMeals] = useState<Meals>('breakfast')
  const [inclusions, setInclusions] = useState({
    accommodation: true,
    transport: true,
    guide: false,
    entranceFees: false,
  })

  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null)
  const [clientName, setClientName] = useState('')

  const days = daysBetween(startDate, endDate)

  // Keep end date >= start date
  useEffect(() => {
    if (new Date(endDate) <= new Date(startDate)) {
      setEndDate(addDays(startDate, 7))
    }
  }, [startDate, endDate])

  const handleCalculate = useCallback(() => {
    if (!selectedDest && !destName.trim()) {
      toast({ title: 'Add Destination', description: 'Please select a destination first.', variant: 'error' })
      return
    }

    setLoading(true)

    setTimeout(() => {
      const input: PricingInput = {
        destinationId: selectedDest?.id || 'delhi',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        travelers,
        tier,
        inclusions: {
          accommodation: inclusions.accommodation,
          transport: inclusions.transport,
          meals,
          guide: inclusions.guide,
          entranceFees: inclusions.entranceFees,
          flights: false,
        },
        markup,
      }
      const result = calculateTripPrice(input)
      setBreakdown(result)
      setStep(2)
      setLoading(false)
    }, 900)
  }, [selectedDest, destName, startDate, endDate, travelers, tier, inclusions, meals, markup, toast])

  const handleSendWhatsApp = useCallback(() => {
    if (!breakdown) return

    const destLabel = selectedDest?.name || destName || 'your destination'
    const msg = encodeURIComponent(
      `Namaste${clientName ? ` ${clientName}` : ''}! 🙏\n\n` +
      `Here's your travel quote for *${destLabel}*:\n\n` +
      `• Duration: ${breakdown.days} nights\n` +
      `• Travelers: ${formatTravelerCount(travelers)}\n` +
      `• Tier: ${tier.charAt(0).toUpperCase() + tier.slice(1)}\n\n` +
      `*Total: ${formatINR(breakdown.suggestedSellingPrice)}*\n` +
      `Per person: ${formatINR(breakdown.totalPerPerson)}\n\n` +
      `Inclusions: Hotels, Transport${inclusions.guide ? ', Guide' : ''}${meals !== 'none' ? `, ${meals.replace('_', ' ')}` : ''}\n\n` +
      `This quote is valid for 48 hours.\n` +
      `Reply YES to confirm your booking! 🌟`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
    toast({ title: 'WhatsApp Opened', description: 'Quote message ready to send.', variant: 'success' })
  }, [breakdown, clientName, travelers, tier, inclusions, meals, selectedDest, destName, toast])

  const handleSend = useCallback(() => {
    toast({ title: 'Quote Dispatched', description: 'Quote sent to client WhatsApp.', variant: 'success' })
    onClose()
    setTimeout(() => {
      setStep(1)
      setBreakdown(null)
      setClientName('')
    }, 400)
  }, [onClose, toast])

  const handleReset = () => {
    setStep(1)
    setBreakdown(null)
  }

  // Seasonal warning
  const startMonth = new Date(startDate).getMonth() + 1
  const isNorthIndiaPeak = selectedDest?.region === 'north' && [10, 11, 12, 1, 2, 3].includes(startMonth)
  const isHillsPeak = selectedDest?.type.includes('hill_station') && [6, 7, 8, 9].includes(startMonth)
  const showSeasonalBanner = isNorthIndiaPeak || isHillsPeak

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={() => {
        onClose()
        setTimeout(() => { setStep(1); setBreakdown(null) }, 400)
      }}
      title="Quick Quote Engine"
      size="lg"
    >
      <AnimatePresence mode="wait">
        {/* ── STEP 1: INPUT FORM ──────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <p className="text-sm text-white/50">
              Get an instant ₹-priced quote with Indian GST, seasonal rates and market comparison.
            </p>

            {/* Destination */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-secondary dark:text-white/90">
                Destination
              </label>
              <DestinationInput
                value={destName}
                onSelect={(dest) => {
                  setSelectedDest(dest)
                  setDestName(dest.name)
                }}
                onClear={() => {
                  setSelectedDest(null)
                  setDestName('')
                }}
              />
              {selectedDest && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 text-xs text-[#00d084] pt-0.5"
                >
                  <Check className="w-3 h-3" />
                  {selectedDest.name}, {selectedDest.state} · Best months: {
                    selectedDest.peakMonths.map(m => ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m]).slice(0,3).join(', ')
                  }
                </motion.div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/90">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    min={today()}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/80 dark:bg-white/10 border border-white/20 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/90">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    min={addDays(startDate, 1)}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/80 dark:bg-white/10 border border-white/20 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Days display */}
            <div className="text-xs text-white/40 flex items-center gap-1.5 -mt-2 ml-1">
              <Info className="w-3 h-3" />
              {days} night{days !== 1 ? 's' : ''} · {formatTravelerCount(travelers)}
            </div>

            {/* Travelers */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/90">Travelers</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={travelers}
                    onChange={(e) => setTravelers(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 dark:bg-white/10 border border-white/20 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm text-sm"
                  />
                </div>
                {/* Quick count buttons */}
                {[2, 4, 6, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTravelers(n)}
                    className={`w-10 h-10 rounded-xl border text-xs font-bold transition-all ${
                      travelers === n
                        ? 'bg-[#00d084] text-white border-[#00d084]'
                        : 'border-white/20 text-white/50 hover:border-[#00d084]/50 hover:text-white/80'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {travelers >= 5 && (
                <div className="text-xs text-[#00d084] flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Group discount applied: {travelers >= 20 ? '20%' : travelers >= 10 ? '15%' : '8%'} off
                </div>
              )}
            </div>

            {/* Tier */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">Travel Tier</label>
              <div className="grid grid-cols-4 gap-2">
                {TIER_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTier(t.value)}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                      tier === t.value
                        ? 'bg-[#00d084] text-white border-[#00d084] shadow-lg shadow-[#00d084]/20'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-[#00d084]/40 hover:text-white/80'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className={`text-[9px] mt-0.5 ${tier === t.value ? 'text-white/70' : 'text-white/30'}`}>
                      {t.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Inclusions */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">Inclusions</label>
              <div className="flex flex-wrap gap-2">
                <InclusionToggle
                  icon={BedDouble}
                  label="Accommodation"
                  checked={inclusions.accommodation}
                  onChange={(v) => setInclusions((p) => ({ ...p, accommodation: v }))}
                />
                <InclusionToggle
                  icon={Car}
                  label="Transport"
                  checked={inclusions.transport}
                  onChange={(v) => setInclusions((p) => ({ ...p, transport: v }))}
                />
                <InclusionToggle
                  icon={Compass}
                  label="Guide"
                  checked={inclusions.guide}
                  onChange={(v) => setInclusions((p) => ({ ...p, guide: v }))}
                />
                <InclusionToggle
                  icon={Ticket}
                  label="Entry Fees"
                  checked={inclusions.entranceFees}
                  onChange={(v) => setInclusions((p) => ({ ...p, entranceFees: v }))}
                />
              </div>

              {/* Meals selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <Utensils className="w-3.5 h-3.5 text-white/40 shrink-0" />
                {MEAL_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMeals(m.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                      meals === m.value
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/70'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Markup */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white/90">Your Markup</label>
                <span className="text-sm font-black text-[#00d084]">{markup}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={markup}
                onChange={(e) => setMarkup(parseInt(e.target.value))}
                className="w-full accent-[#00d084]"
              />
              <div className="flex justify-between text-[10px] text-white/30">
                <span>5%</span><span>15%</span><span>25%</span><span>35%</span><span>50%</span>
              </div>
            </div>

            {/* Seasonal peak warning */}
            <AnimatePresence>
              {showSeasonalBanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Peak Season: </span>
                    {isNorthIndiaPeak
                      ? 'Oct–Feb is peak for North India. Surcharge of +30% applied.'
                      : 'Jun–Sep is peak for hill stations. Surcharge of +30% applied.'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Calculate button */}
            <div className="pt-2 border-t border-white/10">
              <GlassButton
                variant="primary"
                className="w-full h-12 text-base"
                onClick={handleCalculate}
                loading={loading}
              >
                <Calculator className="w-5 h-5" />
                Calculate Quote
              </GlassButton>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: RESULT ──────────────────────────────────────────────── */}
        {step === 2 && breakdown && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* Hero price */}
            <div className="text-center py-4 bg-[#00d084]/10 border border-[#00d084]/20 rounded-2xl">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00d084]/70 mb-1">
                Suggested Selling Price
              </div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="text-5xl font-black text-white tracking-tight"
              >
                {formatINR(breakdown.suggestedSellingPrice)}
              </motion.div>
              <div className="text-sm text-white/50 mt-1">
                {formatINR(breakdown.totalPerPerson)}/person ·{' '}
                {formatTravelerCount(travelers)} · {breakdown.days} nights
              </div>

              {/* Seasonal note */}
              {breakdown.seasonalNote && (
                <div className="mt-2 text-xs text-amber-400/80 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {breakdown.seasonalNote}
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3">
                Price Breakdown
              </div>

              {breakdown.accommodationCost > 0 && (
                <BreakdownRow
                  label="Accommodation"
                  value={formatINR(breakdown.accommodationCost)}
                  sub={`${formatINRShort(breakdown.baseRatePerPersonPerDay)}/person/night`}
                />
              )}
              {breakdown.transportCost > 0 && (
                <BreakdownRow label="Transport" value={formatINR(breakdown.transportCost)} />
              )}
              {breakdown.mealsCost > 0 && (
                <BreakdownRow label={`Meals (${meals.replace('_', ' ')})`} value={formatINR(breakdown.mealsCost)} />
              )}
              {breakdown.guideCost > 0 && (
                <BreakdownRow label="Guide" value={formatINR(breakdown.guideCost)} />
              )}
              {breakdown.entranceFeesCost > 0 && (
                <BreakdownRow label="Entry Fees" value={formatINR(breakdown.entranceFeesCost)} />
              )}

              <div className="border-t border-white/10 pt-2 mt-2 space-y-2">
                <BreakdownRow label="Subtotal" value={formatINR(breakdown.subtotal)} />
                <BreakdownRow
                  label={`Your Margin (${breakdown.operatorMarkup}%)`}
                  value={formatINR(breakdown.markupAmount)}
                  sub={`${breakdown.marginPercentage}% of selling price`}
                />
                <BreakdownRow
                  label="GST (5% — Tour Package)"
                  value={formatINR(breakdown.gstAmount)}
                  dimmed
                />
              </div>

              <div className="border-t-2 border-white/20 pt-3 mt-2">
                <BreakdownRow
                  label="Total (incl. GST)"
                  value={formatINR(breakdown.totalForGroup)}
                  highlight
                />
              </div>
            </div>

            {/* Competitor range */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <div>
                <span className="font-bold text-blue-300">Market Range: </span>
                <span className="text-blue-300/80">
                  {formatINR(breakdown.competitorRange.low)} – {formatINR(breakdown.competitorRange.high)} per person
                </span>
                <span className="text-blue-300/50 ml-1">(avg {formatINR(breakdown.competitorRange.avg)})</span>
                <div className="mt-0.5 text-blue-300/50">
                  Your price is {breakdown.totalPerPerson <= breakdown.competitorRange.avg ? 'competitive' : 'above average'} for this destination.
                </div>
              </div>
            </div>

            {/* Client name for WhatsApp */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/90">
                Client Name <span className="text-white/30 font-normal">(for WhatsApp)</span>
              </label>
              <GlassInput
                placeholder="e.g. Rahul Sharma"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              {/* WhatsApp */}
              <button
                onClick={handleSendWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1eb854] text-white font-semibold text-sm transition-all shadow-lg shadow-[#25D366]/20"
              >
                <MessageSquare className="w-4 h-4" />
                Send via WhatsApp
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <GlassButton variant="outline" className="w-full h-11" onClick={handleReset}>
                  Recalculate
                </GlassButton>
                <GlassButton variant="primary" className="w-full h-11" onClick={handleSend}>
                  <Send className="w-4 h-4" />
                  Send to Client
                </GlassButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassModal>
  )
}
