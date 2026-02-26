'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  ChevronRight,
  MapPin,
  Mic,
  Image,
  FileText,
  Phone,
  Mail,
  Star,
  TrendingUp,
  Car,
  CreditCard,
  UserPlus,
  ExternalLink,
  SortAsc,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  MessageThread,
  type Conversation,
  type ConversationContact,
  type Message,
} from './MessageThread';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    unreadCount: 2,
    contact: {
      id: 'c1',
      name: 'Mrs. Kavita Sharma',
      phone: '+91 98765 43210',
      type: 'client',
      avatarColor: '#6366f1',
      isOnline: true,
      trip: 'Kerala Honeymoon 6N/7D',
      label: 'confirmed',
    },
    messages: [
      {
        id: 'm1',
        type: 'system',
        direction: 'in',
        body: 'Conversation started',
        timestamp: '9:00 AM',
      },
      {
        id: 'm2',
        type: 'text',
        direction: 'out',
        body: 'Namaste Kavita Ji! 🙏 Aapki Kerala trip ka sara arrangement ho gaya hai. Driver Suresh kal subah 6 baje aayenge.',
        timestamp: '9:15 AM',
        status: 'read',
      },
      {
        id: 'm3',
        type: 'text',
        direction: 'in',
        body: 'Bahut shukriya! Ek kaam tha — kal pickup 6 baje ki jagah 6:30 baje kar do please. Husband thoda late ready hoga.',
        timestamp: '10:02 AM',
      },
      {
        id: 'm4',
        type: 'text',
        direction: 'in',
        body: 'Aur hotel mein early check-in possible hai kya?',
        timestamp: '10:03 AM',
      },
      {
        id: 'm5',
        type: 'text',
        direction: 'out',
        body: 'Bilkul Kavita Ji! Pickup time 6:30 AM kar diya. Hotel early check-in ke liye request bhej raha hoon. ✅',
        timestamp: '10:18 AM',
        status: 'delivered',
      },
    ],
  },
  {
    id: 'conv_2',
    unreadCount: 0,
    contact: {
      id: 'd1',
      name: 'Driver Raju Singh',
      phone: '+91 87654 32109',
      type: 'driver',
      avatarColor: '#f59e0b',
      isOnline: false,
      lastSeen: 'today at 8:45 AM',
      label: 'location',
    },
    messages: [
      {
        id: 'm1',
        type: 'text',
        direction: 'out',
        body: 'Raju bhai, aaj Sharma ji ka pickup 6 AM pe hai. Gaadi clean rakhna.',
        timestamp: '5:00 AM',
        status: 'read',
      },
      {
        id: 'm2',
        type: 'text',
        direction: 'in',
        body: 'Ji sir, ready hoon. Gaadi kal raat hi clean kar di thi.',
        timestamp: '5:45 AM',
      },
      {
        id: 'm3',
        type: 'location',
        direction: 'in',
        locationLabel: 'Raju is near Connaught Place',
        lat: 28.6315,
        lng: 77.2167,
        timestamp: '5:58 AM',
      },
    ],
  },
  {
    id: 'conv_3',
    unreadCount: 1,
    contact: {
      id: 'l1',
      name: 'New Lead',
      phone: '+91 76543 21098',
      type: 'lead',
      avatarColor: '#ec4899',
      isOnline: true,
      label: 'lead',
    },
    messages: [
      {
        id: 'm1',
        type: 'text',
        direction: 'in',
        body: 'Bhai Goa 4 din ka tour kya rate hai? Family trip hai, 2 adult 2 kids. Budget mein best option chahiye.',
        timestamp: '11:30 AM',
      },
    ],
  },
  {
    id: 'conv_4',
    unreadCount: 3,
    contact: {
      id: 'c2',
      name: 'Rajesh Gupta',
      phone: '+91 65432 10987',
      type: 'client',
      avatarColor: '#10b981',
      isOnline: false,
      lastSeen: 'today at 9:00 AM',
      trip: 'Rajasthan Royal Tour',
      label: 'payment',
    },
    messages: [
      {
        id: 'm1',
        type: 'text',
        direction: 'in',
        body: 'Namaste, invoice bhejiye GST wala. Company reimbursement ke liye chahiye.',
        timestamp: '8:00 AM',
      },
      {
        id: 'm2',
        type: 'text',
        direction: 'in',
        body: 'GSTIN hamare hai: 07AAGCS2108D1ZX',
        timestamp: '8:05 AM',
      },
      {
        id: 'm3',
        type: 'text',
        direction: 'out',
        body: 'Ji Rajesh Ji! GST invoice generate kar raha hoon. 10 minute mein email aur WhatsApp dono pe bhejta hoon.',
        timestamp: '9:35 AM',
        status: 'read',
      },
      {
        id: 'm4',
        type: 'text',
        direction: 'in',
        body: 'Abhi tak nahi aaya. Please check karo.',
        timestamp: '11:00 AM',
      },
    ],
  },
  {
    id: 'conv_5',
    unreadCount: 0,
    contact: {
      id: 'd2',
      name: 'Driver Suresh Kumar',
      phone: '+91 54321 09876',
      type: 'driver',
      avatarColor: '#f97316',
      isOnline: true,
      lastSeen: 'now',
    },
    messages: [
      {
        id: 'm1',
        type: 'text',
        direction: 'in',
        body: 'Sir aaj traffic bahut hai Expressway pe. 20 minute late ho sakta hoon. Client ko inform kar dein?',
        timestamp: '7:30 AM',
      },
      {
        id: 'm2',
        type: 'text',
        direction: 'out',
        body: 'Haan Suresh, main client ko inform karta hoon. Tu dhyan se aa.',
        timestamp: '7:32 AM',
        status: 'read',
      },
      {
        id: 'm3',
        type: 'location',
        direction: 'in',
        locationLabel: 'Suresh current location',
        lat: 28.4595,
        lng: 77.0266,
        timestamp: '7:45 AM',
      },
    ],
  },
  {
    id: 'conv_6',
    unreadCount: 1,
    contact: {
      id: 'l2',
      name: 'MakeMyTrip Lead',
      phone: '+91 43210 98765',
      type: 'lead',
      avatarColor: '#8b5cf6',
      isOnline: false,
      lastSeen: '30 min ago',
      label: 'lead',
    },
    messages: [
      {
        id: 'm1',
        type: 'text',
        direction: 'in',
        body: 'Hello, Kerala honeymoon package ki inquiry thi. 5 star hotels chahiye. Budget flexible hai. January mein plan kar rahe hain.',
        timestamp: '10:00 AM',
      },
    ],
  },
  {
    id: 'conv_7',
    unreadCount: 0,
    contact: {
      id: 'c3',
      name: 'Amit Mehta',
      phone: '+91 90000 12345',
      type: 'client',
      avatarColor: '#3b82f6',
      isOnline: false,
      lastSeen: 'yesterday',
      trip: 'Manali Snow Trip',
    },
    messages: [
      {
        id: 'm1',
        type: 'text',
        direction: 'out',
        body: 'Amit Ji, Manali trip ka itinerary aur hotel vouchers bhej raha hoon.',
        timestamp: 'Yesterday 4:00 PM',
        status: 'read',
      },
      {
        id: 'm2',
        type: 'document',
        direction: 'out',
        docName: 'Manali_Itinerary_Mehta.pdf',
        docSize: '1.2 MB',
        timestamp: 'Yesterday 4:01 PM',
        status: 'read',
      },
      {
        id: 'm3',
        type: 'text',
        direction: 'in',
        body: 'Thank you so much! Bahut achi planning ki hai. Family excited hai!',
        timestamp: 'Yesterday 5:30 PM',
      },
    ],
  },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'clients' | 'drivers' | 'leads' | 'unread';
type SortMode = 'recent' | 'unread' | 'priority';

const AVATAR_COLORS: Record<ConversationContact['type'], string> = {
  client: '#6366f1',
  driver: '#f59e0b',
  lead: '#ec4899',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getLastMessage(conv: Conversation): Message | undefined {
  return conv.messages[conv.messages.length - 1];
}

function lastMessagePreview(msg?: Message): string {
  if (!msg) return '';
  if (msg.type === 'text') return msg.body?.slice(0, 50) ?? '';
  if (msg.type === 'location') return '📍 Location shared';
  if (msg.type === 'voice') return '🎤 Voice note';
  if (msg.type === 'image') return '🖼️ Photo';
  if (msg.type === 'document') return `📄 ${msg.docName ?? 'Document'}`;
  if (msg.type === 'system') return msg.body ?? '';
  return '';
}

function LabelChip({ label }: { label?: ConversationContact['label'] }) {
  if (!label) return null;
  const configs = {
    lead: { text: '🆕 Lead', cls: 'bg-purple-500/20 text-purple-300' },
    payment: { text: '💰 Pay', cls: 'bg-yellow-500/20 text-yellow-300' },
    location: { text: '📍 Loc', cls: 'bg-blue-500/20 text-blue-300' },
    confirmed: { text: '✅ OK', cls: 'bg-green-500/20 text-green-300' },
  };
  const c = configs[label];
  if (!c) return null;
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.cls}`}>{c.text}</span>
  );
}

// ─── CONVERSATION LIST ITEM ───────────────────────────────────────────────────

function ConvItem({
  conv,
  selected,
  onClick,
}: {
  conv: Conversation;
  selected: boolean;
  onClick: () => void;
}) {
  const last = getLastMessage(conv);
  const preview = lastMessagePreview(last);
  const initials = getInitials(conv.contact.name);
  const avatarColor = conv.contact.avatarColor ?? AVATAR_COLORS[conv.contact.type];
  const isUnread = conv.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 transition-colors border-b border-white/5 flex items-start gap-3 ${
        selected ? 'bg-[#25D366]/10 border-l-2 border-l-[#25D366]' : 'hover:bg-white/5'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: avatarColor }}
        >
          {initials}
        </div>
        {conv.contact.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#0a1628] rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className={`text-sm truncate ${isUnread ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
            {conv.contact.name}
          </p>
          <span className="text-[10px] text-slate-500 shrink-0">{last?.timestamp ?? ''}</span>
        </div>
        <p className="text-[10px] text-slate-500 mb-1">{conv.contact.phone}</p>
        <p className={`text-xs truncate ${isUnread ? 'text-slate-200 font-medium' : 'text-slate-500'}`}>
          {last?.direction === 'out' && <span className="text-slate-600">You: </span>}
          {preview}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <LabelChip label={conv.contact.label} />
          {isUnread && (
            <span className="bg-[#25D366] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── CONTEXT PANEL ────────────────────────────────────────────────────────────

const MOCK_CLIENT_DETAILS: Record<string, {
  email: string;
  ltv: string;
  trips: number;
  stage: string;
  recentTrips: string[];
}> = {
  c1: {
    email: 'kavita.sharma@gmail.com',
    ltv: '₹1,24,000',
    trips: 4,
    stage: 'Repeat Client',
    recentTrips: ['Kerala Honeymoon 6N/7D', 'Goa Beach 4N/5D', 'Manali Winter 3N/4D'],
  },
  c2: {
    email: 'rajesh.gupta@infosys.com',
    ltv: '₹78,500',
    trips: 2,
    stage: 'Active',
    recentTrips: ['Rajasthan Royal Tour', 'Jim Corbett Safari'],
  },
  c3: {
    email: 'amit.mehta@tata.com',
    ltv: '₹42,000',
    trips: 1,
    stage: 'New Client',
    recentTrips: ['Manali Snow Trip'],
  },
};

const MOCK_DRIVER_DETAILS: Record<string, {
  vehicle: string;
  vehicleNumber: string;
  currentTrip: string;
  rating: number;
}> = {
  d1: {
    vehicle: 'Toyota Innova Crysta',
    vehicleNumber: 'DL 01 AB 1234',
    currentTrip: 'Sharma Family — Kerala',
    rating: 4.8,
  },
  d2: {
    vehicle: 'Maruti Ertiga',
    vehicleNumber: 'HR 26 CD 5678',
    currentTrip: 'Patel Group — Agra',
    rating: 4.6,
  },
};

function ContextPanel({ conversation }: { conversation: Conversation | null }) {
  const [ctxTab, setCtxTab] = useState<'info' | 'automations'>('info');

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
          <FileText className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-xs text-slate-600">Select a conversation to see context</p>
      </div>
    );
  }

  const { contact } = conversation;
  const initials = getInitials(contact.name);
  const avatarColor = contact.avatarColor ?? AVATAR_COLORS[contact.type];
  const clientDetail = MOCK_CLIENT_DETAILS[contact.id];
  const driverDetail = MOCK_DRIVER_DETAILS[contact.id];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Contact card */}
      <div className="shrink-0 p-4 border-b border-white/10">
        <div className="flex flex-col items-center text-center gap-2 mb-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
            style={{ background: avatarColor }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{contact.name}</p>
            <p className="text-xs text-slate-400">{contact.phone}</p>
            <span
              className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                contact.type === 'client'
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : contact.type === 'driver'
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-pink-500/20 text-pink-300'
              }`}
            >
              {contact.type}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-xs text-slate-300 transition-colors border border-white/10">
            <Phone className="w-3 h-3" /> Call
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-xs text-slate-300 transition-colors border border-white/10">
            <Mail className="w-3 h-3" /> Email
          </button>
          <button className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-white/8 hover:bg-white/15 text-xs text-slate-300 transition-colors border border-white/10">
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-white/10">
        {(['info', 'automations'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setCtxTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              ctxTab === t
                ? 'text-[#25D366] border-b-2 border-[#25D366]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'info' ? 'Details' : 'Automations'}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {ctxTab === 'info' && (
          <>
            {clientDetail && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client Info</p>
                {[
                  { label: 'Email', val: clientDetail.email },
                  { label: 'Lifetime Value', val: clientDetail.ltv },
                  { label: 'Total Trips', val: `${clientDetail.trips} trips` },
                  { label: 'Stage', val: clientDetail.stage },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-200 font-medium text-right max-w-[120px] truncate">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {driverDetail && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Driver Info</p>
                {[
                  { label: 'Vehicle', val: driverDetail.vehicle },
                  { label: 'Number', val: driverDetail.vehicleNumber },
                  { label: 'Current Trip', val: driverDetail.currentTrip },
                  { label: 'Rating', val: `${driverDetail.rating} ⭐` },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-200 font-medium text-right max-w-[120px] truncate">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {!clientDetail && !driverDetail && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead Info</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Source</span>
                  <span className="text-slate-200 font-medium">WhatsApp Direct</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">First Contact</span>
                  <span className="text-slate-200 font-medium">Today</span>
                </div>
              </div>
            )}

            {/* Recent trips */}
            {clientDetail?.recentTrips && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Trips</p>
                {clientDetail.recentTrips.slice(0, 3).map((trip) => (
                  <div
                    key={trip}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/8 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#25D366]/15 flex items-center justify-center shrink-0">
                      <MapPin className="w-3 h-3 text-[#25D366]" />
                    </div>
                    <p className="text-xs text-slate-300 truncate">{trip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Actions</p>
              {[
                { icon: <TrendingUp className="w-3 h-3" />, label: 'Create Trip', color: '#25D366' },
                { icon: <FileText className="w-3 h-3" />, label: 'Send Quote', color: '#6366f1' },
                { icon: <Car className="w-3 h-3" />, label: 'Assign Driver', color: '#f59e0b' },
                { icon: <CreditCard className="w-3 h-3" />, label: 'Request Payment', color: '#ec4899' },
                { icon: <UserPlus className="w-3 h-3" />, label: 'Add to CRM', color: '#3b82f6' },
              ].map(({ icon, label, color }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20`, color }}>
                    {icon}
                  </div>
                  <span className="text-xs text-slate-300 font-medium">{label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600 ml-auto" />
                </button>
              ))}
            </div>
          </>
        )}

        {ctxTab === 'automations' && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active for this contact</p>
            {[
              { icon: '✅', name: 'Booking Confirmed', status: 'Sent 2 days ago' },
              { icon: '🎒', name: '48H Reminder', status: 'Scheduled — Mar 2' },
              { icon: '🌅', name: '24H Reminder', status: 'Scheduled — Mar 3' },
              { icon: '🚗', name: '2H Reminder', status: 'Scheduled — Mar 4' },
            ].map(({ icon, name, status }) => (
              <div key={name} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-white/5">
                <span className="text-base shrink-0">{icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">{name}</p>
                  <p className="text-[10px] text-slate-500">{status}</p>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0 ml-auto" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN UNIFIED INBOX ───────────────────────────────────────────────────────

interface UnifiedInboxProps {
  onSendMessage?: (convId: string, message: string) => void;
}

export function UnifiedInbox({ onSendMessage }: UnifiedInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string | null>('conv_1');
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;

  const totalUnread = conversations.reduce((a, c) => a + c.unreadCount, 0);

  const filteredAndSorted = useMemo(() => {
    let list = conversations;

    // Filter by tab
    if (filterTab === 'clients') list = list.filter((c) => c.contact.type === 'client');
    else if (filterTab === 'drivers') list = list.filter((c) => c.contact.type === 'driver');
    else if (filterTab === 'leads') list = list.filter((c) => c.contact.type === 'lead');
    else if (filterTab === 'unread') list = list.filter((c) => c.unreadCount > 0);

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contact.name.toLowerCase().includes(q) ||
          c.contact.phone.includes(q) ||
          c.messages.some((m) => m.body?.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortMode === 'unread') list = [...list].sort((a, b) => b.unreadCount - a.unreadCount);
    else if (sortMode === 'priority') {
      list = [...list].sort((a, b) => {
        const score = (c: Conversation) => (c.unreadCount > 0 ? 10 : 0) + (c.contact.label === 'payment' ? 5 : 0);
        return score(b) - score(a);
      });
    }

    return list;
  }, [conversations, filterTab, search, sortMode]);

  function handleSendMessage(convId: string, message: string) {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const newMsg: Message = {
          id: `m_${Date.now()}`,
          type: 'text',
          direction: 'out',
          body: message,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
          status: 'sent',
        };
        return { ...c, messages: [...c.messages, newMsg] };
      })
    );
    onSendMessage?.(convId, message);
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  }

  const FILTER_TABS: Array<{ key: FilterTab; label: string; count?: number }> = [
    { key: 'all', label: 'All', count: conversations.length },
    { key: 'clients', label: 'Clients', count: conversations.filter((c) => c.contact.type === 'client').length },
    { key: 'drivers', label: 'Drivers', count: conversations.filter((c) => c.contact.type === 'driver').length },
    { key: 'leads', label: 'Leads', count: conversations.filter((c) => c.contact.type === 'lead').length },
    { key: 'unread', label: 'Unread', count: totalUnread },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── LEFT: Conversation List ──────────────────────────────────────── */}
      <div
        className="w-[280px] shrink-0 flex flex-col border-r border-white/10 overflow-hidden"
        style={{ background: 'rgba(10,22,40,0.6)' }}
      >
        {/* Search */}
        <div className="shrink-0 p-3 border-b border-white/10">
          <div className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="w-3 h-3 text-slate-500 hover:text-white transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="shrink-0 flex gap-1 px-3 py-2 overflow-x-auto border-b border-white/10">
          {FILTER_TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilterTab(key)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                filterTab === key
                  ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/8'
              }`}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                    filterTab === key ? 'bg-[#25D366] text-white' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sort row */}
        <div className="shrink-0 flex items-center justify-between px-3 py-1.5">
          <p className="text-[10px] text-slate-600 font-medium">{filteredAndSorted.length} conversations</p>
          <div className="flex gap-1">
            {(['recent', 'unread', 'priority'] as SortMode[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortMode(s)}
                className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-colors ${
                  sortMode === s ? 'bg-white/15 text-white' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Search className="w-8 h-8 text-slate-700" />
              <p className="text-xs text-slate-600">No conversations found</p>
            </div>
          ) : (
            filteredAndSorted.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                selected={selectedId === conv.id}
                onClick={() => handleSelect(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── MIDDLE: Message Thread ───────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(37,211,102,0.04) 0%, rgba(10,22,40,0.5) 60%)',
        }}
      >
        <MessageThread
          conversation={selectedConversation}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* ── RIGHT: Context Panel ─────────────────────────────────────────── */}
      <div
        className="w-[240px] shrink-0 border-l border-white/10 overflow-hidden flex flex-col"
        style={{ background: 'rgba(10,22,40,0.6)' }}
      >
        <ContextPanel conversation={selectedConversation} />
      </div>
    </div>
  );
}
