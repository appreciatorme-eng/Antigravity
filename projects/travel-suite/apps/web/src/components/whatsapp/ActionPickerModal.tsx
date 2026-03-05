'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Send,
  FileText,
  CreditCard,
  Navigation,
  UserCheck,
  MapPin,
  Star,
  Car,
  Calendar,
  IndianRupee,
  Building,
  Phone,
  ChevronRight,
  Check,
  Home,
  Plane,
  Train,
} from 'lucide-react';
import type { ConversationContact } from './MessageThread';
import {
  WHATSAPP_TEMPLATES,
  fillTemplate,
} from '@/lib/whatsapp/india-templates';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

export interface MockTrip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  pax: number;
  hotel: string;
  amount: number;
  bookingId: string;
  itinerarySummary: string;
}

export interface MockDriver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehicleNumber: string;
  rating: number;
  currentTrip?: string;
  available: boolean;
}

export const MOCK_TRIPS: MockTrip[] = [
  {
    id: 'trip_1',
    name: 'Kerala Honeymoon 6N/7D',
    destination: 'Kerala',
    startDate: 'Mar 15',
    endDate: 'Mar 21',
    duration: '6N/7D',
    pax: 2,
    hotel: 'Kumarakom Lake Resort',
    amount: 85000,
    bookingId: 'GB-KL2024-089',
    itinerarySummary: 'Day 1 → Cochin Arrival & Fort Kochi\nDay 2 → Munnar Tea Gardens\nDay 3 → Thekkady Wildlife\nDay 4-5 → Alleppey Houseboat\nDay 6 → Kovalam Beach\nDay 7 → Trivandrum Departure',
  },
  {
    id: 'trip_2',
    name: 'Rajasthan Royal Tour 7N/8D',
    destination: 'Rajasthan',
    startDate: 'Apr 2',
    endDate: 'Apr 9',
    duration: '7N/8D',
    pax: 4,
    hotel: 'Umaid Bhawan Palace',
    amount: 150000,
    bookingId: 'GB-RJ2024-045',
    itinerarySummary: 'Day 1 → Jaipur City Palace\nDay 2 → Amer Fort & Jaipur\nDay 3 → Pushkar Camel Fair\nDay 4-5 → Jodhpur Mehrangarh\nDay 6-7 → Udaipur Lakes\nDay 8 → Ahmedabad Departure',
  },
  {
    id: 'trip_3',
    name: 'Manali Snow Adventure 4N/5D',
    destination: 'Manali',
    startDate: 'Mar 28',
    endDate: 'Apr 1',
    duration: '4N/5D',
    pax: 3,
    hotel: 'Snow Valley Resorts',
    amount: 42000,
    bookingId: 'GB-MN2024-112',
    itinerarySummary: 'Day 1 → Delhi → Manali Drive\nDay 2 → Solang Valley Snow Activities\nDay 3 → Rohtang Pass (conditional)\nDay 4 → Old Manali & Hadimba Temple\nDay 5 → Return to Delhi',
  },
  {
    id: 'trip_4',
    name: 'Andaman Beach Getaway 5N/6D',
    destination: 'Andaman',
    startDate: 'Apr 10',
    endDate: 'Apr 15',
    duration: '5N/6D',
    pax: 2,
    hotel: 'Coral Reef Resort, Havelock',
    amount: 95000,
    bookingId: 'GB-AN2024-067',
    itinerarySummary: 'Day 1 → Port Blair Arrival & Cellular Jail\nDay 2 → Neil Island\nDay 3-4 → Havelock Radhanagar Beach\nDay 5 → Scuba Diving & Snorkeling\nDay 6 → Port Blair Departure',
  },
  {
    id: 'trip_5',
    name: 'Ladakh Bike Expedition 8N/9D',
    destination: 'Ladakh',
    startDate: 'Jun 1',
    endDate: 'Jun 9',
    duration: '8N/9D',
    pax: 6,
    hotel: 'The Grand Dragon, Leh',
    amount: 65000,
    bookingId: 'GB-LD2024-023',
    itinerarySummary: 'Day 1-2 → Manali Acclimatization\nDay 3 → Rohtang → Jispa\nDay 4 → Sarchu → Leh\nDay 5 → Leh Local Sightseeing\nDay 6 → Nubra Valley\nDay 7 → Pangong Tso\nDay 8 → Tso Moriri\nDay 9 → Leh Departure',
  },
  {
    id: 'trip_6',
    name: 'Goa Beach Holiday 3N/4D',
    destination: 'Goa',
    startDate: 'Mar 20',
    endDate: 'Mar 23',
    duration: '3N/4D',
    pax: 4,
    hotel: 'Grand Hyatt Goa',
    amount: 55000,
    bookingId: 'GB-GA2024-201',
    itinerarySummary: 'Day 1 → Goa Arrival, Baga & Calangute Beach\nDay 2 → North Goa Forts & Churches\nDay 3 → South Goa — Palolem & Butterfly Beach\nDay 4 → Departure',
  },
];

export const MOCK_DRIVERS: MockDriver[] = [
  {
    id: 'd1',
    name: 'Raju Singh',
    phone: '+91 87654 32109',
    vehicle: 'Toyota Innova Crysta',
    vehicleNumber: 'DL 01 AB 1234',
    rating: 4.8,
    currentTrip: 'Sharma Family — Kerala',
    available: false,
  },
  {
    id: 'd2',
    name: 'Suresh Kumar',
    phone: '+91 54321 09876',
    vehicle: 'Maruti Ertiga',
    vehicleNumber: 'HR 26 CD 5678',
    rating: 4.6,
    currentTrip: 'Patel Group — Agra',
    available: false,
  },
  {
    id: 'd3',
    name: 'Anil Verma',
    phone: '+91 99887 11223',
    vehicle: 'Force Traveller (9-seater)',
    vehicleNumber: 'MH 04 EF 9012',
    rating: 4.9,
    available: true,
  },
  {
    id: 'd4',
    name: 'Ramesh Gupta',
    phone: '+91 77665 44332',
    vehicle: 'Toyota Fortuner',
    vehicleNumber: 'RJ 14 GH 3456',
    rating: 4.7,
    available: true,
  },
  {
    id: 'd5',
    name: 'Deepak Yadav',
    phone: '+91 98765 11111',
    vehicle: 'Maruti Swift Dzire',
    vehicleNumber: 'UP 32 KL 7890',
    rating: 4.5,
    available: true,
  },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ActionMode = 'itinerary' | 'payment' | 'driver' | 'location';

interface ActionPickerModalProps {
  isOpen: boolean;
  mode: ActionMode;
  contact: ConversationContact;
  channel: 'whatsapp' | 'email';
  onSend: (message: string, subject?: string) => void;
  onClose: () => void;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

// ─── ITINERARY PICKER ─────────────────────────────────────────────────────────

function ItineraryPicker({
  contact,
  channel,
  onSend,
}: {
  contact: ConversationContact;
  channel: 'whatsapp' | 'email';
  onSend: (message: string, subject?: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MockTrip | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_TRIPS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.bookingId.toLowerCase().includes(q),
    );
  }, [search]);

  function buildMessage(): { body: string; subject?: string } {
    if (!selected) return { body: '' };

    if (channel === 'whatsapp') {
      const tpl = WHATSAPP_TEMPLATES.find((t) => t.id === 'itinerary_share');
      if (!tpl) return { body: '' };
      return {
        body: fillTemplate(tpl, {
          client_name: contact.name,
          destination: selected.destination,
          trip_name: selected.name,
          start_date: selected.startDate,
          end_date: selected.endDate,
          duration: selected.duration,
          pax_count: String(selected.pax),
          itinerary_summary: selected.itinerarySummary,
          itinerary_link: `https://gobuddy.in/trip/${selected.bookingId.toLowerCase()}`,
          company_name: 'GoBuddy Adventures',
        }),
      };
    }

    const subject = `Your ${selected.destination} Trip Itinerary — ${selected.startDate}–${selected.endDate}`;
    const body = `Dear ${contact.name},\n\nWe are pleased to share your day-wise itinerary for the upcoming trip.\n\n📋 Trip: ${selected.name}\n📅 Dates: ${selected.startDate} – ${selected.endDate} (${selected.duration})\n👥 Guests: ${selected.pax} person${selected.pax > 1 ? 's' : ''}\n🏨 Stay: ${selected.hotel}\n🔖 Booking ID: ${selected.bookingId}\n\n━━━━━━━━━━━━━━━━━━━━━\nDAY-WISE ITINERARY\n━━━━━━━━━━━━━━━━━━━━━\n${selected.itinerarySummary}\n\nYour full itinerary with vouchers is available at:\nhttps://gobuddy.in/trip/${selected.bookingId.toLowerCase()}\n\nPlease review and let us know if you need any changes. We are happy to customise!\n\nWarm regards,\nTeam GoBuddy Adventures\n📞 +91 98765 00000 | gobuddy.in`;

    return { body, subject };
  }

  const { body, subject } = buildMessage();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
        <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by trip name or destination..."
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
        />
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
        {filtered.map((trip) => (
          <button
            key={trip.id}
            onClick={() => setSelected(trip)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selected?.id === trip.id
                ? 'border-[#25D366]/50 bg-[#25D366]/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{trip.name}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>{trip.startDate} – {trip.endDate}</span>
                <span>·</span>
                <span>{trip.pax} pax</span>
                <span>·</span>
                <span className="text-[#25D366] font-semibold">{formatCurrency(trip.amount)}</span>
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">{trip.bookingId} · {trip.hotel}</p>
            </div>
            {selected?.id === trip.id && (
              <Check className="w-4 h-4 text-[#25D366] shrink-0" />
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-6">No trips match your search</p>
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
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1FAF54] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
      >
        <Send className="w-4 h-4" />
        {channel === 'email' ? 'Send Itinerary Email' : 'Send via WhatsApp'}
      </button>
    </div>
  );
}

// ─── PAYMENT PICKER ───────────────────────────────────────────────────────────

function PaymentPicker({
  contact,
  channel,
  onSend,
}: {
  contact: ConversationContact;
  channel: 'whatsapp' | 'email';
  onSend: (message: string, subject?: string) => void;
}) {
  const [selectedTrip, setSelectedTrip] = useState<MockTrip | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentType, setPaymentType] = useState<'advance' | 'full' | 'balance' | 'custom'>('advance');
  const [search, setSearch] = useState('');
  const [showTripList, setShowTripList] = useState(true);

  const filteredTrips = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_TRIPS.filter(
      (t) => t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q),
    );
  }, [search]);

  function getAmount(): number {
    if (paymentType === 'advance' && selectedTrip) return Math.round(selectedTrip.amount * 0.3);
    if (paymentType === 'full' && selectedTrip) return selectedTrip.amount;
    if (paymentType === 'balance' && selectedTrip) return Math.round(selectedTrip.amount * 0.7);
    return parseInt(customAmount.replace(/\D/g, '')) || 0;
  }

  function buildMessage(): { body: string; subject?: string } {
    if (!selectedTrip) return { body: '' };
    const amount = getAmount();
    const bookingId = selectedTrip.bookingId;
    const formattedAmount = formatCurrency(amount);
    const formattedDue = dueDate || 'Within 24 hours';

    if (channel === 'whatsapp') {
      const tpl = WHATSAPP_TEMPLATES.find((t) => t.id === 'payment_request_upi');
      if (!tpl) return { body: '' };
      return {
        body: fillTemplate(tpl, {
          client_name: contact.name,
          trip_name: selectedTrip.name,
          amount: formattedAmount,
          due_date: formattedDue,
          booking_id: bookingId,
          upi_id: 'gobuddy@paytm',
          payment_link: `https://gobuddy.in/pay/${bookingId.toLowerCase()}`,
          bank_account: '50200012345678',
          bank_ifsc: 'HDFC0001234',
          company_name: 'GoBuddy Adventures',
        }),
      };
    }

    const paymentLabel = paymentType === 'advance' ? '30% Advance' : paymentType === 'full' ? 'Full Payment' : paymentType === 'balance' ? 'Balance (70%)' : 'Custom Amount';
    const subject = `Payment Request — ${selectedTrip.name} — ${formattedAmount}`;
    const body = `Dear ${contact.name},\n\nThis is a payment request for your upcoming trip with GoBuddy Adventures.\n\n📋 Trip: ${selectedTrip.name}\n🔖 Booking ID: ${bookingId}\n💰 Amount: ${formattedAmount} (${paymentLabel})\n📅 Due By: ${formattedDue}\n\n━━━━━━━━━━━━━━━━━━━━━\nPAYMENT OPTIONS\n━━━━━━━━━━━━━━━━━━━━━\n\n🏦 Bank Transfer:\nAccount: 50200012345678\nIFSC: HDFC0001234\nName: GoBuddy Adventures\n\n📱 UPI: gobuddy@paytm\n\n🔗 Pay Online: https://gobuddy.in/pay/${bookingId.toLowerCase()}\n\nKindly share the payment screenshot after transfer. For any queries, reply to this email or call +91 98765 00000.\n\nThank you!\nTeam GoBuddy Adventures`;

    return { body, subject };
  }

  const { body, subject } = buildMessage();
  const amount = getAmount();

  return (
    <div className="flex flex-col gap-4">
      {showTripList ? (
        <>
          <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trip..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
            {filteredTrips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => { setSelectedTrip(trip); setShowTripList(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-4 h-4 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{trip.name}</p>
                  <p className="text-[11px] text-slate-400">{trip.bookingId} · Total {formatCurrency(trip.amount)}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Trip Selected Header */}
          <button
            onClick={() => setShowTripList(true)}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4 text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{selectedTrip?.name}</p>
              <p className="text-[10px] text-slate-400">{selectedTrip?.bookingId}</p>
            </div>
            <span className="text-[10px] text-slate-500">Change</span>
          </button>

          {/* Payment Type */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Type</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'advance' as const, label: '30% Advance', desc: selectedTrip ? formatCurrency(Math.round(selectedTrip.amount * 0.3)) : '—' },
                { key: 'full' as const, label: 'Full Payment', desc: selectedTrip ? formatCurrency(selectedTrip.amount) : '—' },
                { key: 'balance' as const, label: 'Balance 70%', desc: selectedTrip ? formatCurrency(Math.round(selectedTrip.amount * 0.7)) : '—' },
                { key: 'custom' as const, label: 'Custom', desc: 'Enter amount' },
              ]).map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setPaymentType(key)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    paymentType === key
                      ? 'border-pink-500/50 bg-pink-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="text-[10px] text-pink-300 font-semibold mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {paymentType === 'custom' && (
            <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
              <IndianRupee className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                autoFocus
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount..."
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]"
            />
            <span className="text-[10px] text-slate-600">Due date (optional)</span>
          </div>

          {amount > 0 && (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preview</p>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto custom-scrollbar font-sans">
                {body}
              </pre>
            </div>
          )}

          <button
            onClick={() => amount > 0 && onSend(body, subject)}
            disabled={amount <= 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            {channel === 'email' ? `Send Payment Request — ${amount > 0 ? formatCurrency(amount) : '—'}` : `Request ${amount > 0 ? formatCurrency(amount) : '—'} via WhatsApp`}
          </button>
        </>
      )}
    </div>
  );
}

// ─── DRIVER PICKER ────────────────────────────────────────────────────────────

function DriverPicker({
  contact,
  channel,
  onSend,
}: {
  contact: ConversationContact;
  channel: 'whatsapp' | 'email';
  onSend: (message: string, subject?: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MockDriver | null>(null);
  const [pickupTime, setPickupTime] = useState('06:00');
  const [pickupLocation, setPickupLocation] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_DRIVERS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.vehicle.toLowerCase().includes(q) ||
        d.vehicleNumber.toLowerCase().includes(q),
    );
  }, [search]);

  function buildMessage(): { body: string; subject?: string } {
    if (!selected) return { body: '' };
    const trip = contact.trip ?? 'your trip';
    const pickup = pickupLocation || 'Hotel lobby';
    const time = pickupTime;

    if (channel === 'whatsapp') {
      const tpl = WHATSAPP_TEMPLATES.find((t) => t.id === 'driver_assign_en');
      if (!tpl) return { body: '' };
      return {
        body: fillTemplate(tpl, {
          client_name: contact.name,
          destination: trip.split(' ')[0] ?? 'your destination',
          driver_name: selected.name,
          driver_phone: selected.phone,
          vehicle_type: selected.vehicle,
          vehicle_number: selected.vehicleNumber,
          pickup_time: time,
          pickup_location: pickup,
          company_name: 'GoBuddy Adventures',
        }),
      };
    }

    const subject = `Driver Assignment — ${selected.name} for ${trip}`;
    const body = `Dear ${contact.name},\n\nWe are pleased to share your driver details for ${trip}.\n\n━━━━━━━━━━━━━━━━━━━━━\nYOUR DRIVER\n━━━━━━━━━━━━━━━━━━━━━\n\n👤 Name: ${selected.name}\n📞 Phone: ${selected.phone}\n🚗 Vehicle: ${selected.vehicle}\n🔢 Number: ${selected.vehicleNumber}\n⭐ Rating: ${selected.rating}/5.0\n\n━━━━━━━━━━━━━━━━━━━━━\nPICKUP DETAILS\n━━━━━━━━━━━━━━━━━━━━━\n\n⏰ Pickup Time: ${time}\n📍 Pickup Location: ${pickup}\n\nYour driver will call you 30 minutes before pickup. You can also contact them directly on the number above.\n\nHave a wonderful journey! 🌟\n\nWarm regards,\nTeam GoBuddy Adventures\n📞 +91 98765 00000`;

    return { body, subject };
  }

  const { body, subject } = buildMessage();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
        <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by driver name or vehicle..."
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
        />
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
        {filtered.map((driver) => (
          <button
            key={driver.id}
            onClick={() => setSelected(driver)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selected?.id === driver.id
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">{driver.name}</p>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    driver.available
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {driver.available ? 'Available' : 'On Trip'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{driver.vehicle} · {driver.vehicleNumber}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[11px] text-yellow-300 font-semibold">{driver.rating}</span>
                <span className="text-[10px] text-slate-500">{driver.phone}</span>
              </div>
            </div>
            {selected?.id === driver.id && (
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pickup Time</p>
            <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pickup Location</p>
            <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Hotel lobby"
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preview</p>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto custom-scrollbar font-sans">
            {body}
          </pre>
        </div>
      )}

      <button
        onClick={() => selected && onSend(body, subject)}
        disabled={!selected}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
      >
        <UserCheck className="w-4 h-4" />
        {channel === 'email' ? 'Send Driver Details via Email' : 'Send Driver Details'}
      </button>
    </div>
  );
}

// ─── LOCATION REQUEST ─────────────────────────────────────────────────────────

type LocationType = 'hotel' | 'airport' | 'railway' | 'home' | 'custom';

function LocationRequestPicker({
  contact,
  channel,
  onSend,
}: {
  contact: ConversationContact;
  channel: 'whatsapp' | 'email';
  onSend: (message: string, subject?: string) => void;
}) {
  const [locationType, setLocationType] = useState<LocationType>('hotel');
  const [customAddress, setCustomAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  const LOCATION_OPTIONS: Array<{ key: LocationType; label: string; icon: React.ReactNode; desc: string }> = [
    { key: 'hotel', label: 'Hotel', icon: <Building className="w-4 h-4" />, desc: 'Request hotel name & room' },
    { key: 'airport', label: 'Airport', icon: <Plane className="w-4 h-4" />, desc: 'Request flight & terminal' },
    { key: 'railway', label: 'Railway', icon: <Train className="w-4 h-4" />, desc: 'Request train & platform' },
    { key: 'home', label: 'Home', icon: <Home className="w-4 h-4" />, desc: 'Request home address' },
    { key: 'custom', label: 'Custom', icon: <MapPin className="w-4 h-4" />, desc: 'Specify custom address' },
  ];

  function buildMessage(): { body: string; subject?: string } {
    const name = contact.name;
    const dateStr = pickupDate ? ` on ${pickupDate}` : '';
    const timeStr = pickupTime ? ` at ${pickupTime}` : '';

    if (channel === 'whatsapp') {
      if (locationType === 'hotel') {
        return { body: `${name} Ji 🙏\n\nAapka pickup${dateStr}${timeStr} schedule hai. Kripya apne hotel ka naam aur room number share karein taaki driver accurately locate kar sake.\n\n📋 Hotel Name:\n🔢 Room Number:\n📍 Hotel Address (agar nahin pata):\n\nThank you! GoBuddy Adventures 🚗` };
      }
      if (locationType === 'airport') {
        return { body: `${name} Ji 🙏\n\nAapka airport pickup${dateStr}${timeStr} schedule hai. Kripya yeh details share karein:\n\n✈️ Flight Number:\n🏢 Terminal: (T1 / T2 / T3)\n⏰ Landing Time:\n📍 Arrival Gate (agar pata ho):\n\nDriver gate pe waiting karega aapki name board ke saath. GoBuddy Adventures 🚗` };
      }
      if (locationType === 'railway') {
        return { body: `${name} Ji 🙏\n\nAapka railway station pickup${dateStr}${timeStr} schedule hai. Kripya yeh details share karein:\n\n🚂 Train Number & Name:\n🚉 Station Name:\n🔢 Platform Number (agar pata ho):\n⏰ Arrival Time:\n\nDriver platform pe waiting karega. GoBuddy Adventures 🚗` };
      }
      if (locationType === 'home') {
        return { body: `${name} Ji 🙏\n\nAapka home pickup${dateStr}${timeStr} hai. Kripya apna complete address share karein taaki driver GPS pe set kar sake:\n\n🏠 House/Flat No.:\n🏘️ Colony/Society:\n🗺️ Landmark:\n🏙️ City & PIN:\n\nYa Google Maps location share kar sakte hain. GoBuddy Adventures 🚗` };
      }
      return { body: `${name} Ji 🙏\n\nAapka pickup${dateStr}${timeStr} schedule hai.\n\n📍 Pickup Location: ${customAddress || '[Address needed]'}\n\nKripya confirm karein ya apna exact location share karein. Driver coordinates pe directly navigate karega.\n\nGoBuddy Adventures 🚗` };
    }

    const subject = `Pickup Location Details Required — ${pickupDate ? pickupDate : 'Upcoming Trip'}`;

    if (locationType === 'hotel') {
      return {
        subject,
        body: `Dear ${name},\n\nWe hope you are looking forward to your trip with GoBuddy Adventures!\n\nYour pickup is scheduled${dateStr}${timeStr}. To ensure your driver reaches you without any delays, we kindly request the following details:\n\n🏨 Hotel Name: ___________________\n🔢 Room Number: ___________________\n📍 Hotel Address (if available): ___________________\n\nPlease reply to this email at your earliest convenience. Our driver will arrive 10 minutes early.\n\nThank you!\nTeam GoBuddy Adventures\n📞 +91 98765 00000`,
      };
    }
    if (locationType === 'airport') {
      return {
        subject,
        body: `Dear ${name},\n\nYour airport pickup is scheduled${dateStr}${timeStr}. Please share the following details:\n\n✈️ Flight Number: ___________________\n🏢 Terminal: ___________________\n⏰ Landing Time: ___________________\n📍 Arrival Gate: ___________________\n\nYour driver will be at the arrivals gate with a name board. In case of flight delays, please inform us via this email or call +91 98765 00000.\n\nSafe travels!\nTeam GoBuddy Adventures`,
      };
    }

    return {
      subject,
      body: `Dear ${name},\n\nYour pickup is scheduled${dateStr}${timeStr}.\n\nCould you please share your exact pickup address? This helps us provide accurate navigation to your driver.\n\n📍 Address: ${customAddress || '___________________'}\n\nAlternatively, you can share a Google Maps link in your reply.\n\nThank you!\nTeam GoBuddy Adventures\n📞 +91 98765 00000`,
    };
  }

  const { body, subject } = buildMessage();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {LOCATION_OPTIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setLocationType(key)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              locationType === key
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'
            }`}
          >
            {icon}
            <span className="text-[10px] font-bold">{label}</span>
          </button>
        ))}
      </div>

      {locationType === 'custom' && (
        <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            autoFocus
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            placeholder="Enter specific address..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date (optional)</p>
          <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time (optional)</p>
          <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preview</p>
        <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto custom-scrollbar font-sans">
          {body}
        </pre>
      </div>

      <button
        onClick={() => onSend(body, subject)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
      >
        <Navigation className="w-4 h-4" />
        {channel === 'email' ? 'Send Location Request Email' : 'Request Location via WhatsApp'}
      </button>
    </div>
  );
}

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<ActionMode, {
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  itinerary: {
    title: 'Send Itinerary',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/15',
  },
  payment: {
    title: 'Request Payment',
    icon: <CreditCard className="w-4 h-4" />,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/15',
  },
  driver: {
    title: 'Send Driver Details',
    icon: <UserCheck className="w-4 h-4" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
  },
  location: {
    title: 'Request Location',
    icon: <Navigation className="w-4 h-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
  },
};

export function ActionPickerModal({
  isOpen,
  mode,
  contact,
  channel,
  onSend,
  onClose,
}: ActionPickerModalProps) {
  const config = ACTION_CONFIG[mode];

  function handleSend(message: string, subject?: string) {
    onSend(message, subject);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
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
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.bgColor} ${config.color}`}>
                  {config.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{config.title}</h3>
                  <p className="text-[10px] text-slate-500">
                    to {contact.name} · via {channel === 'email' ? '✉️ Email' : '💬 WhatsApp'}
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

            {/* Content */}
            <div className="p-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {mode === 'itinerary' && (
                <ItineraryPicker contact={contact} channel={channel} onSend={handleSend} />
              )}
              {mode === 'payment' && (
                <PaymentPicker contact={contact} channel={channel} onSend={handleSend} />
              )}
              {mode === 'driver' && (
                <DriverPicker contact={contact} channel={channel} onSend={handleSend} />
              )}
              {mode === 'location' && (
                <LocationRequestPicker contact={contact} channel={channel} onSend={handleSend} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
