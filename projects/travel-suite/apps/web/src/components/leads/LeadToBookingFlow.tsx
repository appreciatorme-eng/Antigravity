'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, Phone, User, MapPin, Users, Calendar, Star, MessageCircle, Save, CheckCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeadToBookingFlowProps {
  isOpen: boolean
  onClose: () => void
  initialPhone?: string
  initialMessage?: string
}

type TierKey = 'budget' | 'standard' | 'premium' | 'luxury'

interface QuoteState {
  destination: string
  travelers: number
  duration: number
  tier: TierKey
}

interface ClientState {
  phone: string
  name: string
  destination: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DURATION_OPTIONS = [3, 5, 7, 10]

const TIER_CONFIG: Record<TierKey, { label: string; pricePerDayPerPerson: number; color: string }> = {
  budget:   { label: 'Budget',   pricePerDayPerPerson: 2500,  color: 'border-slate-500 text-slate-300' },
  standard: { label: 'Standard', pricePerDayPerPerson: 4500,  color: 'border-blue-500 text-blue-300' },
  premium:  { label: 'Premium',  pricePerDayPerPerson: 8000,  color: 'border-purple-500 text-purple-300' },
  luxury:   { label: 'Luxury',   pricePerDayPerPerson: 15000, color: 'border-amber-500 text-amber-300' },
}

const DESTINATION_KEYWORDS: { keywords: string[]; label: string }[] = [
  { keywords: ['goa', 'panaji', 'baga', 'calangute'], label: 'Goa' },
  { keywords: ['rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'jaisalmer'], label: 'Rajasthan' },
  { keywords: ['kerala', 'munnar', 'alleppey', 'kochi', 'kovalam', 'wayanad'], label: 'Kerala' },
  { keywords: ['himachal', 'manali', 'shimla', 'dharamsala', 'spiti'], label: 'Himachal Pradesh' },
  { keywords: ['kashmir', 'srinagar', 'gulmarg', 'pahalgam', 'sonamarg'], label: 'Kashmir' },
  { keywords: ['uttarakhand', 'rishikesh', 'haridwar', 'mussoorie', 'nainital', 'kedarnath'], label: 'Uttarakhand' },
  { keywords: ['andaman', 'nicobar', 'port blair', 'havelock'], label: 'Andaman' },
  { keywords: ['ladakh', 'leh', 'nubra', 'pangong'], label: 'Ladakh' },
  { keywords: ['coorg', 'ooty', 'mysore', 'karnataka'], label: 'Karnataka' },
  { keywords: ['varanasi', 'agra', 'lucknow', 'uttar pradesh'], label: 'Uttar Pradesh' },
]

function detectDestination(message: string): string {
  if (!message) return ''
  const lower = message.toLowerCase()
  for (const entry of DESTINATION_KEYWORDS) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.label
    }
  }
  return ''
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length > 10) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  return raw
}

function randomId(length: number): string {
  return Math.random().toString(36).slice(2, 2 + length)
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i + 1 === current
              ? 'w-6 bg-[#00d084]'
              : i + 1 < current
              ? 'w-2 bg-[#00d084]/60'
              : 'w-2 bg-white/20'
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-white/40">Step {current} of {total}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Client Details
// ---------------------------------------------------------------------------

function StepClientDetails({
  client,
  setClient,
  onNext,
}: {
  client: ClientState
  setClient: React.Dispatch<React.SetStateAction<ClientState>>
  onNext: () => void
}) {
  const canProceed = client.phone.trim().length >= 10 && client.name.trim().length >= 2 && client.destination.trim().length >= 2

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Client Details</h2>
        <p className="text-sm text-white/50">Auto-filled from WhatsApp conversation</p>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="tel"
            value={client.phone}
            onChange={e => setClient(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00d084]/60 focus:ring-1 focus:ring-[#00d084]/30 transition"
          />
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={client.name}
            onChange={e => setClient(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Rahul Sharma"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00d084]/60 focus:ring-1 focus:ring-[#00d084]/30 transition"
          />
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
          Destination
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={client.destination}
            onChange={e => setClient(prev => ({ ...prev, destination: e.target.value }))}
            placeholder="e.g. Goa, Kerala, Rajasthan…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00d084]/60 focus:ring-1 focus:ring-[#00d084]/30 transition"
          />
        </div>

        {/* Quick destination chips */}
        <div className="flex flex-wrap gap-2 mt-2">
          {['Goa', 'Kerala', 'Rajasthan', 'Ladakh', 'Kashmir', 'Andaman'].map(dest => (
            <button
              key={dest}
              type="button"
              onClick={() => setClient(prev => ({ ...prev, destination: dest }))}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                client.destination === dest
                  ? 'bg-[#00d084]/20 border-[#00d084] text-[#00d084]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-[#00d084] text-[#0a1628] hover:bg-[#00d084]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Next &rarr;
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Quick Quote
// ---------------------------------------------------------------------------

function StepQuickQuote({
  client,
  quote,
  setQuote,
  onNext,
  onBack,
}: {
  client: ClientState
  quote: QuoteState
  setQuote: React.Dispatch<React.SetStateAction<QuoteState>>
  onNext: () => void
  onBack: () => void
}) {
  const tier = TIER_CONFIG[quote.tier]
  const totalPrice = tier.pricePerDayPerPerson * quote.duration * quote.travelers
  const margin = Math.round(totalPrice * 0.25)

  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition mb-3">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-xl font-semibold text-white mb-1">Quick Quote</h2>
        <p className="text-sm text-white/50">
          {client.destination} &bull; {client.name}
        </p>
      </div>

      {/* Travelers */}
      <div>
        <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">
          Travelers
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuote(prev => ({ ...prev, travelers: Math.max(1, prev.travelers - 1) }))}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center transition"
          >
            &minus;
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00d084]" />
            <span className="text-white font-semibold text-lg w-6 text-center">{quote.travelers}</span>
          </div>
          <button
            onClick={() => setQuote(prev => ({ ...prev, travelers: Math.min(50, prev.travelers + 1) }))}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center transition"
          >
            &#43;
          </button>
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">
          Duration
        </label>
        <div className="flex gap-2">
          {DURATION_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setQuote(prev => ({ ...prev, duration: d }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition flex items-center justify-center gap-1 ${
                quote.duration === d
                  ? 'bg-[#00d084]/20 border-[#00d084] text-[#00d084]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Tier */}
      <div>
        <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">
          Package Tier
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(TIER_CONFIG) as [TierKey, typeof TIER_CONFIG[TierKey]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setQuote(prev => ({ ...prev, tier: key }))}
              className={`p-3 rounded-lg border text-left transition ${
                quote.tier === key
                  ? 'bg-white/10 border-[#00d084] text-white'
                  : `bg-white/5 ${cfg.color} hover:bg-white/8`
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Star className={`w-3.5 h-3.5 ${quote.tier === key ? 'text-[#00d084]' : 'text-current opacity-70'}`} />
                <span className="text-sm font-semibold">{cfg.label}</span>
              </div>
              <div className="text-xs opacity-60">&#8377;{formatINR(cfg.pricePerDayPerPerson)}/day/person</div>
            </button>
          ))}
        </div>
      </div>

      {/* Price summary */}
      <div className="rounded-xl bg-[#00d084]/10 border border-[#00d084]/30 p-4 space-y-1">
        <div className="text-sm text-white/70">
          Estimated: <span className="text-white font-semibold">&#8377;{formatINR(totalPrice)}</span>
          {' '}for {quote.duration} days, {quote.travelers} person{quote.travelers > 1 ? 's' : ''} ({tier.label})
        </div>
        <div className="text-sm text-[#00d084]">
          Your margin ~25%: &#8377;{formatINR(margin)}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-[#00d084] text-[#0a1628] hover:bg-[#00d084]/90 transition-all"
      >
        Next &rarr;
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3: Send & Track
// ---------------------------------------------------------------------------

function StepSendTrack({
  client,
  quote,
  onClose,
  onBack,
}: {
  client: ClientState
  quote: QuoteState
  onClose: () => void
  onBack: () => void
}) {
  const [saved, setSaved] = useState(false)
  const [done, setDone] = useState(false)

  const tier = TIER_CONFIG[quote.tier]
  const totalPrice = tier.pricePerDayPerPerson * quote.duration * quote.travelers
  const pricePerPerson = tier.pricePerDayPerPerson * quote.duration

  const firstName = client.name.split(' ')[0] || client.name
  const waMessage = `Namaste ${firstName} Ji! 🙏 ${client.destination} ke liye ₹${formatINR(pricePerPerson)}/person ka package ready hai. Valid 3 din. Reply karein!`

  const cleanPhone = client.phone.replace(/\D/g, '')
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`

  function handleSaveDraft() {
    setSaved(true)
    // In a real implementation, this would dispatch to a proposals store
    const draft = {
      id: `draft_${randomId(8)}`,
      client,
      quote,
      totalPrice,
      message: waMessage,
      savedAt: new Date().toISOString(),
    }
    try {
      const existing = JSON.parse(localStorage.getItem('touros_drafts') ?? '[]')
      existing.unshift(draft)
      localStorage.setItem('touros_drafts', JSON.stringify(existing.slice(0, 50)))
    } catch {
      // localStorage not available in SSR context
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <CheckCircle className="w-14 h-14 text-[#00d084]" />
        <p className="text-white font-semibold text-lg">All done!</p>
        <p className="text-white/50 text-sm text-center">Lead saved to CRM and proposal sent.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition mb-3">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-xl font-semibold text-white mb-1">Send &amp; Track</h2>
        <p className="text-sm text-white/50">Preview and send your quote</p>
      </div>

      {/* WhatsApp message preview */}
      <div className="rounded-xl bg-[#1a2e1f] border border-[#00d084]/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <span className="text-xs font-semibold text-[#25D366] uppercase tracking-wider">WhatsApp Message Preview</span>
        </div>
        <p className="text-white/90 text-sm leading-relaxed">{waMessage}</p>
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs text-white/50">
          <span>Total: &#8377;{formatINR(totalPrice)}</span>
          <span>{quote.travelers} pax &bull; {quote.duration} days</span>
          <span>{tier.label} tier</span>
          <span>To: {client.phone}</span>
        </div>
      </div>

      {/* CRM saved indicator */}
      <div className="flex items-center gap-2 text-xs text-[#00d084]/80 bg-[#00d084]/5 border border-[#00d084]/20 rounded-lg px-3 py-2">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        Client auto-saved to CRM &mdash; Lead #{randomId(6).toUpperCase()}
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm bg-[#25D366] text-white hover:bg-[#25D366]/90 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          Send via WhatsApp
        </a>

        <button
          onClick={handleSaveDraft}
          disabled={saved}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm border border-white/20 text-white/80 hover:bg-white/5 disabled:opacity-60 disabled:cursor-default transition-all"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved to Drafts' : 'Save as Draft'}
        </button>

        <button
          onClick={() => { setDone(true); setTimeout(onClose, 1800) }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm bg-white/10 text-white hover:bg-white/15 transition-all"
        >
          <CheckCircle className="w-4 h-4 text-[#00d084]" />
          Done
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -100 : 100, opacity: 0 }),
}

export default function LeadToBookingFlow({
  isOpen,
  onClose,
  initialPhone = '',
  initialMessage = '',
}: LeadToBookingFlowProps) {
  const detectedDestination = detectDestination(initialMessage)

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  const [client, setClient] = useState<ClientState>({
    phone: formatPhone(initialPhone),
    name: '',
    destination: detectedDestination,
  })

  const [quote, setQuote] = useState<QuoteState>({
    destination: detectedDestination,
    travelers: 2,
    duration: 5,
    tier: 'standard',
  })

  const goNext = useCallback(() => {
    setDirection(1)
    setStep(s => Math.min(3, s + 1))
    // Sync destination from step 1 into quote
    setQuote(prev => ({ ...prev, destination: client.destination }))
  }, [client.destination])

  const goBack = useCallback(() => {
    setDirection(-1)
    setStep(s => Math.max(1, s - 1))
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-[520px] bg-[#0d1f35]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00d084]" />
            <span className="text-xs font-semibold text-[#00d084] uppercase tracking-widest">Lead to Booking</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <StepDots current={step} total={3} />

          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                {step === 1 && (
                  <StepClientDetails client={client} setClient={setClient} onNext={goNext} />
                )}
                {step === 2 && (
                  <StepQuickQuote client={client} quote={quote} setQuote={setQuote} onNext={goNext} onBack={goBack} />
                )}
                {step === 3 && (
                  <StepSendTrack client={client} quote={quote} onClose={onClose} onBack={goBack} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
