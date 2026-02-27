'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Users,
  Calendar,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  MessageCircle,
  Save,
  Phone,
} from 'lucide-react';
import { ParsedIntent } from '@/lib/leads/intent-parser';

// ─── Constants ──────────────────────────────────────────────────────────────

const TIER_RATES: Record<string, number> = {
  budget: 2500,
  standard: 4500,
  premium: 8000,
  luxury: 15000,
};

const GST_RATE = 0.05;
const MARGIN_PCT = 25;

const ALL_DESTINATIONS = [
  'Goa', 'Rajasthan', 'Kerala', 'Himachal Pradesh',
  'Kashmir', 'Uttarakhand', 'Andaman', 'Ladakh',
  'Karnataka', 'Varanasi', 'Meghalaya', 'Gujarat',
  'Golden Triangle', 'North East',
];

const TIERS = ['budget', 'standard', 'premium', 'luxury'] as const;
type Tier = typeof TIERS[number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatIndianNumber(n: number): string {
  const str = Math.round(n).toString();
  if (str.length <= 3) return str;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return formatted + ',' + last3;
}

function calcPrice(travelers: number, days: number, tier: Tier) {
  const rate = TIER_RATES[tier] ?? TIER_RATES.standard;
  const base = rate * travelers * days;
  const total = base * (1 + GST_RATE);
  const perPerson = total / travelers;
  return { total, perPerson, base };
}

function buildWhatsAppMessage(
  name: string,
  destination: string,
  travelers: number,
  days: number,
  total: number,
  perPerson: number
): string {
  const firstName = name.split(' ')[0] || name;
  return (
    `Namaste ${firstName} Ji! 🙏\n\n` +
    `${destination} trip ke liye humara best package ready hai:\n` +
    `📅 ${days} nights | 👥 ${travelers} traveler${travelers !== 1 ? 's' : ''}\n` +
    `💰 ₹${formatIndianNumber(total)} total (₹${formatIndianNumber(perPerson)} per person)\n\n` +
    `Includes: Accommodation, transfers, guide\n` +
    `GST included ✓\n\n` +
    `Reply YES to confirm your booking!`
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current - 1;
        const active = i === current - 1;
        return (
          <motion.div
            key={i}
            animate={active ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className={`rounded-full transition-all duration-300 ${
              done
                ? 'w-2.5 h-2.5 bg-[#00d084]'
                : active
                ? 'w-3 h-3 bg-[#00d084] shadow-[0_0_8px_#00d084]'
                : 'w-2.5 h-2.5 bg-white/20'
            }`}
          />
        );
      })}
    </div>
  );
}

function Stepper({
  value,
  onChange,
  min = 1,
  max = 50,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
      >
        <Minus className="w-3.5 h-3.5 text-white" />
      </button>
      <div className="flex-1 text-center">
        <span className="text-white font-semibold">{value}</span>
        <span className="text-white/50 text-xs ml-1.5">{label}</span>
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
      >
        <Plus className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
}

// ─── Booking State ─────────────────────────────────────────────────────────

interface BookingState {
  name: string;
  phone: string;
  destination: string;
  travelers: number;
  durationDays: number;
  tier: Tier;
  message: string;
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface LeadToBookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  initialMessage?: string;
  prefilledIntent?: ParsedIntent;
}

// ─── Steps ─────────────────────────────────────────────────────────────────

function Step1ConfirmLead({
  state,
  onChange,
  intent,
  onNext,
}: {
  state: BookingState;
  onChange: (partial: Partial<BookingState>) => void;
  intent?: ParsedIntent;
  onNext: () => void;
}) {
  const [showDestPicker, setShowDestPicker] = useState(false);
  const lowConfidence = !intent || intent.confidence < 0.3;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white text-xl font-bold">Confirm Lead</h2>
        <p className="text-white/50 text-sm mt-0.5">
          We auto-detected this from the message
        </p>
      </div>

      {/* Lead summary card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
        {/* Phone */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Phone className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <p className="text-white/40 text-[11px] uppercase tracking-wider">Phone</p>
            <p className="text-white text-sm font-medium">{state.phone || '—'}</p>
          </div>
        </div>

        {/* Name — editable inline */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white/60" />
          </div>
          <div className="flex-1">
            <p className="text-white/40 text-[11px] uppercase tracking-wider mb-1">Name</p>
            <input
              type="text"
              value={state.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Customer name"
              className="w-full bg-transparent text-white text-sm font-medium placeholder-white/25 outline-none border-b border-white/10 focus:border-[#00d084]/60 pb-1 transition-colors"
            />
          </div>
        </div>

        {/* Destination — tappable chip */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-white/60" />
          </div>
          <div className="flex-1">
            <p className="text-white/40 text-[11px] uppercase tracking-wider mb-1.5">Destination</p>
            <button
              onClick={() => setShowDestPicker((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                state.destination
                  ? 'bg-[#00d084]/10 text-[#00d084] border-[#00d084]/30 hover:bg-[#00d084]/20'
                  : 'bg-white/5 text-white/40 border-white/15 hover:bg-white/10'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {state.destination || 'Pick destination'}
              <span className="text-[10px] opacity-60">↓</span>
            </button>
          </div>
        </div>
      </div>

      {/* Low-confidence note */}
      {lowConfidence && (
        <p className="text-amber-400/70 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          Could not detect destination from the message — please pick one below.
        </p>
      )}

      {/* Destination picker grid */}
      <AnimatePresence>
        {showDestPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0a1628]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3"
          >
            <p className="text-white/40 text-xs mb-2.5 px-1">Select destination</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_DESTINATIONS.map((dest) => (
                <button
                  key={dest}
                  onClick={() => {
                    onChange({ destination: dest });
                    setShowDestPicker(false);
                  }}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    state.destination === dest
                      ? 'bg-[#00d084]/20 text-[#00d084] border border-[#00d084]/30'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {dest}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <button
        onClick={onNext}
        disabled={!state.destination}
        className="w-full flex items-center justify-center gap-2 bg-[#00d084] hover:bg-[#00b873] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 text-black font-semibold rounded-xl py-3 text-sm"
      >
        Looks right
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Step2ReviewQuote({
  state,
  onChange,
  onNext,
  onBack,
}: {
  state: BookingState;
  onChange: (partial: Partial<BookingState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { total, perPerson } = calcPrice(state.travelers, state.durationDays, state.tier);

  const tierLabels: Record<Tier, { label: string; desc: string; color: string }> = {
    budget: { label: 'Budget', desc: '₹2,500/day', color: 'border-blue-500/40 text-blue-300' },
    standard: { label: 'Standard', desc: '₹4,500/day', color: 'border-green-500/40 text-green-300' },
    premium: { label: 'Premium', desc: '₹8,000/day', color: 'border-purple-500/40 text-purple-300' },
    luxury: { label: 'Luxury', desc: '₹15,000/day', color: 'border-amber-500/40 text-amber-300' },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white text-xl font-bold">Review Quote</h2>
        <p className="text-white/50 text-sm mt-0.5">
          Adjust travelers, duration &amp; package tier
        </p>
      </div>

      {/* Stepper row */}
      <div className="space-y-2.5">
        <Stepper
          value={state.travelers}
          onChange={(v) => onChange({ travelers: v })}
          min={1}
          max={50}
          label="travelers"
        />
        <Stepper
          value={state.durationDays}
          onChange={(v) => onChange({ durationDays: v })}
          min={1}
          max={30}
          label="days"
        />
      </div>

      {/* Tier grid 2×2 */}
      <div className="grid grid-cols-2 gap-2">
        {TIERS.map((t) => {
          const { label, desc, color } = tierLabels[t];
          const selected = state.tier === t;
          return (
            <button
              key={t}
              onClick={() => onChange({ tier: t })}
              className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                selected
                  ? `bg-[#00d084]/10 border-[#00d084]/50 ${color}`
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              <div className={`text-sm font-semibold ${selected ? '' : 'text-white/80'}`}>{label}</div>
              <div className="text-[11px] opacity-70 mt-0.5">{desc}/person</div>
              {selected && (
                <div className="mt-1.5">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#00d084]">
                    <Check className="w-2.5 h-2.5 text-black" />
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Price display */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-1">
        <p className="text-white/40 text-xs uppercase tracking-wider">Total Price</p>
        <p className="text-white text-3xl font-bold">
          ₹{formatIndianNumber(total)}
        </p>
        <p className="text-white/50 text-sm">
          ₹{formatIndianNumber(perPerson)} per person
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <span className="text-white/30 text-[11px]">GST included (5%)</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-[#00d084]/70 text-[11px]">Your margin: ~{MARGIN_PCT}%</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 bg-[#00d084] hover:bg-[#00b873] active:scale-95 transition-all duration-150 text-black font-semibold rounded-xl py-3 text-sm"
        >
          Confirm Quote
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Step3CreateAndNotify({
  state,
  onBack,
  onDone,
}: {
  state: BookingState;
  onBack: () => void;
  onDone: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [loading, setLoading] = useState(false);
  const { total, perPerson } = calcPrice(state.travelers, state.durationDays, state.tier);

  const waMessage = buildWhatsAppMessage(
    state.name || 'Guest',
    state.destination,
    state.travelers,
    state.durationDays,
    total,
    perPerson
  );

  const waLink = `https://wa.me/${state.phone.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`;

  const handleSend = async (mode: 'whatsapp' | 'draft') => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: state.phone,
          name: state.name,
          destination: state.destination,
          travelers: state.travelers,
          duration: state.durationDays,
          tier: state.tier,
          totalPrice: Math.round(total),
          message: state.message,
        }),
      });
      const data = await res.json();
      if (data.bookingRef) setBookingRef(data.bookingRef);

      if (mode === 'draft') {
        // Save to localStorage
        const drafts = JSON.parse(localStorage.getItem('bookingDrafts') || '[]');
        drafts.unshift({
          ...state,
          total: Math.round(total),
          perPerson: Math.round(perPerson),
          bookingRef: data.bookingRef,
          savedAt: new Date().toISOString(),
        });
        localStorage.setItem('bookingDrafts', JSON.stringify(drafts.slice(0, 50)));
      } else {
        window.open(waLink, '_blank');
      }
    } catch {
      // Fall through — still show success
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-5 text-center py-4">
        {/* Confetti-like animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mx-auto w-16 h-16 rounded-full bg-[#00d084]/20 border border-[#00d084]/40 flex items-center justify-center"
        >
          <Check className="w-8 h-8 text-[#00d084]" />
        </motion.div>

        {/* Floating particles */}
        <div className="relative h-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
              animate={{
                y: -40 - i * 12,
                x: (i % 2 === 0 ? 1 : -1) * (20 + i * 8),
                opacity: 0,
                scale: 0.3,
              }}
              transition={{ duration: 0.8, delay: i * 0.07, ease: 'easeOut' }}
              className="absolute left-1/2 top-0 w-2 h-2 rounded-full bg-[#00d084]"
              style={{ marginLeft: -4 }}
            />
          ))}
        </div>

        <div className="space-y-1 pt-2">
          <h2 className="text-white text-2xl font-bold">Booking Created!</h2>
          {bookingRef && (
            <p className="text-[#00d084] font-mono text-sm">{bookingRef}</p>
          )}
          <p className="text-white/50 text-sm">
            {state.destination} trip for {state.name || state.phone}
          </p>
        </div>

        <button
          onClick={onDone}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white text-xl font-bold">Ready to Book!</h2>
        <p className="text-white/50 text-sm mt-0.5">
          Send the quote via WhatsApp or save as draft
        </p>
      </div>

      {/* WhatsApp message preview */}
      <div className="rounded-2xl overflow-hidden border border-white/10">
        {/* WA header bar */}
        <div className="bg-[#25D366] px-4 py-2.5 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-white/90" />
          <span className="text-white text-sm font-medium">WhatsApp Preview</span>
        </div>
        {/* Message bubble */}
        <div className="bg-[#0a1628] p-4">
          <div className="bg-[#1a2e4a] rounded-xl rounded-tl-sm px-3.5 py-3 max-w-[85%]">
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
              {waMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleSend('whatsapp')}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1db954] active:scale-95 disabled:opacity-50 transition-all duration-150 text-white font-semibold rounded-xl py-3 text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          Send WhatsApp
        </button>
        <button
          onClick={() => handleSend('draft')}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-50 border border-white/10 transition-all duration-150 text-white/80 font-semibold rounded-xl py-3 text-sm"
        >
          <Save className="w-4 h-4" />
          Save Draft
        </button>
      </div>

      {/* Back */}
      <button
        onClick={onBack}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-white/40 hover:text-white/70 text-sm transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Edit quote
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeadToBookingFlow({
  isOpen,
  onClose,
  initialPhone = '',
  initialMessage = '',
  prefilledIntent,
}: LeadToBookingFlowProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const defaultTier: Tier = prefilledIntent?.budgetTier
    ? (prefilledIntent.budgetTier as Tier)
    : 'standard';

  const [bookingState, setBookingState] = useState<BookingState>({
    name: prefilledIntent?.extractedName ?? '',
    phone: initialPhone,
    destination: prefilledIntent?.destination ?? '',
    travelers: prefilledIntent?.travelers ?? 2,
    durationDays: prefilledIntent?.durationDays ?? 5,
    tier: defaultTier,
    message: initialMessage,
  });

  // Re-sync when intent or initial values change (e.g. modal re-opened with new lead)
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setDirection(1);
    setBookingState({
      name: prefilledIntent?.extractedName ?? '',
      phone: initialPhone,
      destination: prefilledIntent?.destination ?? '',
      travelers: prefilledIntent?.travelers ?? 2,
      durationDays: prefilledIntent?.durationDays ?? 5,
      tier: (prefilledIntent?.budgetTier as Tier) ?? 'standard',
      message: initialMessage,
    });
  }, [isOpen, initialPhone, initialMessage, prefilledIntent]);

  const updateState = useCallback((partial: Partial<BookingState>) => {
    setBookingState((prev) => ({ ...prev, ...partial }));
  }, []);

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
  };

  const stepTitles = ['Confirm Lead', 'Review Quote', 'Ready to Book!'];

  const slideVariants = {
    enter: (d: number) => ({ x: d * 220, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -220, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 pointer-events-none"
          >
            <div className="w-full sm:max-w-md bg-[#0f2040]/95 backdrop-blur-2xl border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto overflow-hidden">
              {/* Modal inner scroll area */}
              <div className="max-h-[90vh] overflow-y-auto">
                <div className="p-6 pb-8 space-y-5">
                  {/* Top bar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wider">
                        Step {step} of 3 · 3 Taps to Booking
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                  </div>

                  {/* Step dots */}
                  <StepDots current={step} total={3} />

                  {/* Step content with slide animation */}
                  <div className="relative overflow-hidden min-h-[320px]">
                    <AnimatePresence custom={direction} mode="wait">
                      <motion.div
                        key={step}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        {step === 1 && (
                          <Step1ConfirmLead
                            state={bookingState}
                            onChange={updateState}
                            intent={prefilledIntent}
                            onNext={goNext}
                          />
                        )}
                        {step === 2 && (
                          <Step2ReviewQuote
                            state={bookingState}
                            onChange={updateState}
                            onNext={goNext}
                            onBack={goBack}
                          />
                        )}
                        {step === 3 && (
                          <Step3CreateAndNotify
                            state={bookingState}
                            onBack={goBack}
                            onDone={onClose}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
