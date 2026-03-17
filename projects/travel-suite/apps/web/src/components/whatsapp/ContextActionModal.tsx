'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Check,
  FileText,
  TrendingUp,
  Send,
  Building,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useOrganizationTrips, type Trip } from './action-picker/shared';
import type { ConversationContact } from './whatsapp.types';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ContextActionType = 'trip-detail' | 'create-trip' | 'send-quote' | 'create-proposal';

interface ContextActionModalProps {
  isOpen: boolean;
  type: ContextActionType;
  tripName?: string;
  waId?: string;
  contact: ConversationContact;
  channel: 'whatsapp' | 'email';
  onSendMessage?: (message: string, subject?: string) => boolean | void | Promise<boolean | void>;
  onClose: () => void;
}

// ─── MOCK QUOTE DATA ─────────────────────────────────────────────────────────

interface MockQuote {
  id: string;
  name: string;
  type: string;
  destination: string;
  duration: string;
  price: number;
  inclusions: string[];
  validity: string;
}

const MOCK_QUOTES: MockQuote[] = [
  {
    id: 'q1',
    name: 'Kerala Honeymoon Deluxe',
    type: 'Honeymoon',
    destination: 'Kerala',
    duration: '6N/7D',
    price: 85000,
    inclusions: ['5-Star Hotels', 'Houseboat Stay', 'All Transfers', 'Daily Breakfast', 'Airport Pickup'],
    validity: '7 days',
  },
  {
    id: 'q2',
    name: 'Rajasthan Heritage Grand Tour',
    type: 'Cultural',
    destination: 'Rajasthan',
    duration: '7N/8D',
    price: 95000,
    inclusions: ['Heritage Hotels', 'Guided Tours', 'Desert Safari', 'Cultural Evening', 'All Transfers'],
    validity: '5 days',
  },
  {
    id: 'q3',
    name: 'Goa Beach Holiday',
    type: 'Beach',
    destination: 'Goa',
    duration: '3N/4D',
    price: 35000,
    inclusions: ['4-Star Resort', 'Airport Transfers', 'North & South Goa Tour', 'Welcome Drink'],
    validity: '3 days',
  },
  {
    id: 'q4',
    name: 'Ladakh Bike Expedition',
    type: 'Adventure',
    destination: 'Ladakh',
    duration: '8N/9D',
    price: 65000,
    inclusions: ['Royal Enfield Bikes', 'Camping Equipment', 'Support Vehicle', 'Mechanic on Trip', 'All Fuel'],
    validity: '10 days',
  },
  {
    id: 'q5',
    name: 'Andaman Island Explorer',
    type: 'Island',
    destination: 'Andaman',
    duration: '5N/6D',
    price: 75000,
    inclusions: ['Beach Resort', 'Scuba Diving', 'Glass Bottom Boat', 'Havelock Day Trip', 'Ferry Transfers'],
    validity: '7 days',
  },
];

function formatCurrency(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

// ─── TRIP DETAIL PANEL ───────────────────────────────────────────────────────

function TripDetailPanel({ tripName, trips }: { tripName?: string; trips: Trip[] }) {
  const trip = useMemo(
    () => trips.find((t) => t.name.toLowerCase().includes((tripName ?? '').toLowerCase())),
    [tripName, trips],
  );

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-sm font-semibold text-slate-300">{tripName ?? 'Trip'}</p>
        <p className="text-xs text-slate-600">Full trip details not yet in system</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{trip.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{trip.bookingId} · {trip.hotel}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Dates', val: `${trip.startDate}–${trip.endDate}` },
          { icon: <Users className="w-3.5 h-3.5" />, label: 'Guests', val: `${trip.pax} pax` },
          { icon: <IndianRupee className="w-3.5 h-3.5" />, label: 'Total', val: formatCurrency(trip.amount) },
        ].map(({ icon, label, val }) => (
          <div key={label} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white/5 border border-white/8 text-center">
            <span className="text-slate-500">{icon}</span>
            <p className="text-[10px] text-slate-500">{label}</p>
            <p className="text-xs font-bold text-white leading-tight">{val}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Day-wise Itinerary</p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {trip.itinerarySummary.split('\n').map((day, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/8">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <p className="text-xs text-slate-300 leading-relaxed">{day}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
        <Building className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <p className="text-[10px] text-slate-500">Stay</p>
          <p className="text-xs font-semibold text-white">{trip.hotel}</p>
        </div>
        <span className="ml-auto text-xs font-bold text-amber-400">{trip.duration}</span>
      </div>
    </div>
  );
}

// ─── CREATE TRIP PANEL ────────────────────────────────────────────────────────

const TRIP_TYPES = ['Honeymoon', 'Family Holiday', 'Adventure', 'Corporate Offsite', 'Beach Getaway', 'Heritage Tour'];

function CreateTripPanel({
  contact,
  trips,
  onClose,
}: {
  contact: ConversationContact;
  trips: Trip[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [tripType, setTripType] = useState('');
  const [pax, setPax] = useState(2);
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  const destinations = useMemo(
    () => [...new Set(trips.map((t) => t.destination).filter(Boolean))],
    [trips],
  );

  const destinationSuggestions = useMemo(() => {
    const q = destination.toLowerCase();
    return q ? destinations.filter((d) => d.toLowerCase().includes(q)) : destinations;
  }, [destination, destinations]);

  function handleCreate() {
    const params = new URLSearchParams({
      client: contact.name,
      phone: contact.phone,
      destination: destination || '',
      type: tripType,
      pax: String(pax),
      date: startDate,
      notes,
    });
    toast.success(`Opening trip planner for ${contact.name}`);
    router.push(`/trips?${params.toString()}`);
    onClose();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Destination</p>
        <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            autoFocus
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where to go?"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {destinationSuggestions.map((d) => (
            <button
              key={d}
              onClick={() => setDestination(d)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                destination === d
                  ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                  : 'bg-white/8 text-slate-400 border border-white/10 hover:bg-white/15'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trip Type</p>
        <div className="flex flex-wrap gap-1.5">
          {TRIP_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTripType(t)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                tripType === t
                  ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40'
                  : 'bg-white/8 text-slate-400 border border-white/10 hover:bg-white/15'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Guests</p>
          <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5">
            <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="number"
              min={1}
              max={50}
              value={pax}
              onChange={(e) => setPax(Math.max(1, Number(e.target.value)))}
              className="flex-1 bg-transparent text-sm text-white outline-none"
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</p>
          <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5">
        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special requests, client preferences..."
          rows={2}
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none resize-none"
        />
      </div>

      <button
        onClick={handleCreate}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1FAF54] text-white font-bold text-sm transition-colors active:scale-[0.98]"
      >
        <TrendingUp className="w-4 h-4" />
        Start Planning
      </button>
    </div>
  );
}

// ─── SEND QUOTE PANEL ─────────────────────────────────────────────────────────

function SendQuotePanel({
  contact,
  channel,
  onSend,
}: {
  contact: ConversationContact;
  channel: 'whatsapp' | 'email';
  onSend: (message: string, subject?: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MockQuote | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_QUOTES.filter(
      (qt) =>
        qt.name.toLowerCase().includes(q) ||
        qt.destination.toLowerCase().includes(q) ||
        qt.type.toLowerCase().includes(q),
    );
  }, [search]);

  function buildMessage(): { body: string; subject?: string } {
    if (!selected) return { body: '' };
    const inclusions = selected.inclusions.map((i) => `✅ ${i}`).join('\n');

    if (channel === 'whatsapp') {
      return {
        body: `${contact.name} Ji 🙏\n\nHere is your personalised travel quote from TripBuilt:\n\n🗺️ *${selected.name}*\n📍 ${selected.destination} · ${selected.duration} · ${selected.type}\n\n*INCLUSIONS*\n${inclusions}\n\n💰 *${formatCurrency(selected.price)}/person*\n⏰ Valid for ${selected.validity}\n\nReply here or call *+91 98765 00000* to confirm! 🎉\n— TripBuilt`,
      };
    }

    const subject = `Your Personalised Quote — ${selected.name} | TripBuilt`;
    const body = `Dear ${contact.name},\n\nThank you for your interest in travelling with TripBuilt!\n\n━━━━━━━━━━━━━━━━━━━━━\n${selected.name.toUpperCase()}\n━━━━━━━━━━━━━━━━━━━━━\n\n📍 Destination: ${selected.destination}\n⏱️ Duration: ${selected.duration}\n🏷️ Package Type: ${selected.type}\n💰 Price: ${formatCurrency(selected.price)} per person\n\n━━━━━━━━━━━━━━━━━━━━━\nWHAT'S INCLUDED\n━━━━━━━━━━━━━━━━━━━━━\n${inclusions}\n\n⏰ Quote valid for: ${selected.validity} from today.\n\nTo confirm your booking or request customisation, reply to this email or call +91 98765 00000.\n\nWe look forward to making your trip unforgettable! 🌟\n\nWarm regards,\nTeam TripBuilt\ntripbuilt.com | +91 98765 00000`;

    return { body, subject };
  }

  const { body, subject } = buildMessage();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5">
        <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by destination or type..."
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
        />
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
        {filtered.map((quote) => (
          <button
            key={quote.id}
            onClick={() => setSelected(quote)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selected?.id === quote.id
                ? 'border-indigo-500/50 bg-indigo-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{quote.name}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>{quote.destination}</span>
                <span>·</span>
                <span>{quote.duration}</span>
                <span>·</span>
                <span className="text-indigo-300 font-semibold">{formatCurrency(quote.price)}/pax</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{quote.type} · Valid {quote.validity}</p>
            </div>
            {selected?.id === quote.id && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-6">No quotes match your search</p>
        )}
      </div>

      {selected && (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Preview</p>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto custom-scrollbar font-sans">
            {body}
          </pre>
        </div>
      )}

      <button
        onClick={() => selected && onSend(body, subject)}
        disabled={!selected}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors active:scale-[0.98]"
      >
        <Send className="w-4 h-4" />
        {channel === 'email' ? 'Send Quote via Email' : 'Send Quote via WhatsApp'}
      </button>
    </div>
  );
}

// ─── CREATE PROPOSAL PANEL ───────────────────────────────────────────────────

interface ExtractedFields {
  destination: string | null;
  travel_dates: string | null;
  trip_start_date: string | null;
  trip_end_date: string | null;
  group_size: number | null;
  budget_inr: number | null;
  traveler_name: string | null;
}

function CreateProposalPanel({
  contact,
  waId,
  onClose,
}: {
  contact: ConversationContact;
  waId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch('/api/whatsapp/extract-trip-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waId, contactName: contact.name, contactPhone: contact.phone }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          draftId?: string;
          extracted?: ExtractedFields;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !json.draftId) throw new Error(json.error || 'Extraction failed');
        setDraftId(json.draftId);
        setExtracted(json.extracted ?? null);
        setStatus('done');
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : 'Extraction failed');
        setStatus('error');
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [waId, contact.name, contact.phone]);

  function openProposal(id?: string | null) {
    if (id) {
      router.push(`/proposals/create?whatsappDraft=${encodeURIComponent(id)}`);
    } else {
      router.push('/proposals/create');
    }
    onClose();
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full bg-violet-500/15 animate-ping" />
          <div className="relative w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">Reading conversation…</p>
          <p className="text-xs text-slate-500 mt-1">AI is extracting trip details</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">Could not extract details</p>
            <p className="text-xs text-slate-400 mt-0.5">{errorMsg}</p>
          </div>
        </div>
        <button
          onClick={() => openProposal(null)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors"
        >
          <FileText className="w-4 h-4" />
          Open Blank Proposal Form
        </button>
      </div>
    );
  }

  const fields = [
    { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Destination', val: extracted?.destination },
    { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Dates', val: extracted?.travel_dates || (extracted?.trip_start_date ? `${extracted.trip_start_date} → ${extracted.trip_end_date ?? '?'}` : null) },
    { icon: <Users className="w-3.5 h-3.5" />, label: 'Group', val: extracted?.group_size !== null && extracted?.group_size !== undefined ? `${extracted.group_size} people` : null },
    { icon: <IndianRupee className="w-3.5 h-3.5" />, label: 'Budget', val: extracted?.budget_inr !== null && extracted?.budget_inr !== undefined ? `₹${extracted.budget_inr.toLocaleString('en-IN')}` : null },
  ].filter((f) => f.val);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
        <p className="text-xs text-violet-300 font-semibold">AI extracted from conversation</p>
        <Check className="w-3.5 h-3.5 text-violet-400 ml-auto" />
      </div>

      {fields.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {fields.map(({ icon, label, val }) => (
            <div key={label} className="flex flex-col gap-1 p-2.5 rounded-xl bg-white/5 border border-white/8">
              <div className="flex items-center gap-1.5 text-slate-500">{icon}<span className="text-[10px] uppercase tracking-wider font-bold">{label}</span></div>
              <p className="text-xs font-semibold text-white leading-tight">{val}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-2">No trip details found in the conversation yet.</p>
      )}

      <button
        onClick={() => openProposal(draftId)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors active:scale-[0.98]"
      >
        <FileText className="w-4 h-4" />
        Open Proposal Form
      </button>
    </div>
  );
}

// ─── MODAL CONFIG ─────────────────────────────────────────────────────────────

const MODAL_CONFIG: Record<ContextActionType, {
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  'trip-detail': {
    title: 'Trip Details',
    icon: <MapPin className="w-4 h-4" />,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/15',
  },
  'create-trip': {
    title: 'Create New Trip',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-[#25D366]',
    bgColor: 'bg-[#25D366]/15',
  },
  'send-quote': {
    title: 'Send Quote',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/15',
  },
  'create-proposal': {
    title: 'Create Proposal',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/15',
  },
};

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function ContextActionModal({
  isOpen,
  type,
  tripName,
  waId,
  contact,
  channel,
  onSendMessage,
  onClose,
}: ContextActionModalProps) {
  const config = MODAL_CONFIG[type];
  const { data: trips } = useOrganizationTrips();

  async function handleSend(message: string, subject?: string) {
    const result = await onSendMessage?.(message, subject);
    if (result === false) {
      return;
    }
    toast.success(`${config.title} sent to ${contact.name}`);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-white/15 shadow-2xl overflow-hidden"
            style={{
              background: 'rgba(8, 18, 36, 0.96)',
              backdropFilter: 'blur(24px)',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.bgColor} ${config.color}`}>
                  {config.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{config.title}</h3>
                  <p className="text-[10px] text-slate-500">
                    {type === 'trip-detail'
                      ? (tripName ?? 'Trip')
                      : type === 'create-proposal'
                      ? `${contact.name} · AI-powered extraction`
                      : `${contact.name} · via ${channel === 'email' ? '✉️ Email' : '💬 WhatsApp'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {type === 'trip-detail' && <TripDetailPanel tripName={tripName} trips={trips} />}
              {type === 'create-trip' && <CreateTripPanel contact={contact} trips={trips} onClose={onClose} />}
              {type === 'send-quote' && (
                <SendQuotePanel contact={contact} channel={channel} onSend={handleSend} />
              )}
              {type === 'create-proposal' && (
                <CreateProposalPanel contact={contact} waId={waId ?? ''} onClose={onClose} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
