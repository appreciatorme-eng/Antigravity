'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoMode } from '@/lib/demo/demo-mode-context';
import {
  Search,
  X,
  ChevronRight,
  MapPin,
  FileText,
  Phone,
  Mail,
  TrendingUp,
  Car,
  CreditCard,
  UserPlus,
  ExternalLink,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  MessageThread,
  type Conversation,
  type Message,
} from './MessageThread';
import type { ActionMode, ConversationContact } from './whatsapp.types';
import {
  type ChannelConversation,
  type ChannelType,
  ALL_MOCK_CONVERSATIONS,
  MOCK_CLIENT_DETAILS,
  MOCK_DRIVER_DETAILS,
} from './inbox-mock-data';
import { ActionPickerModal } from './ActionPickerModal';
import { ContextActionModal, type ContextActionType } from './ContextActionModal';
import { WhatsAppConnectModal } from './WhatsAppConnectModal';
import { type WhatsAppTemplate } from '@/lib/whatsapp/india-templates';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'clients' | 'drivers' | 'leads' | 'unread';
type ChannelFilter = 'all' | 'whatsapp' | 'email';
type SortMode = 'recent' | 'unread' | 'priority';
type ContextAction = ContextActionType | 'assign-driver' | 'request-payment' | 'add-to-crm';

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
  conv: ChannelConversation;
  selected: boolean;
  onClick: () => void;
}) {
  const last = getLastMessage(conv);
  const preview = lastMessagePreview(last);
  const initials = getInitials(conv.contact.name);
  const avatarColor = conv.contact.avatarColor ?? AVATAR_COLORS[conv.contact.type];
  const isUnread = conv.unreadCount > 0;
  const isEmailConv = conv.channel === 'email';
  const accentColor = isEmailConv ? '#3b82f6' : '#25D366';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 transition-colors border-b border-white/5 flex items-start gap-3 ${
        selected
          ? isEmailConv
            ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
            : 'bg-[#25D366]/10 border-l-2 border-l-[#25D366]'
          : 'hover:bg-white/5'
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
        {conv.contact.isOnline && !isEmailConv && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#0a1628] rounded-full" />
        )}
        {/* Channel indicator */}
        <span
          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0a1628]"
          style={{ background: accentColor }}
        >
          {isEmailConv ? (
            <Mail className="w-2 h-2 text-white" />
          ) : (
            <MessageCircle className="w-2 h-2 text-white" />
          )}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className={`text-sm truncate ${isUnread ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
            {conv.contact.name}
          </p>
          <span className="text-[10px] text-slate-500 shrink-0">{last?.timestamp ?? ''}</span>
        </div>
        <p className="text-[10px] text-slate-500 mb-1">
          {isEmailConv && conv.contact.email ? conv.contact.email : conv.contact.phone}
        </p>
        <p className={`text-xs truncate ${isUnread ? 'text-slate-200 font-medium' : 'text-slate-500'}`}>
          {last?.direction === 'out' && <span className="text-slate-600">You: </span>}
          {last?.subject ? `${last.subject} — ` : ''}{preview}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <LabelChip label={conv.contact.label} />
          {isUnread && (
            <span
              className="text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{ background: accentColor }}
            >
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── CONTEXT PANEL ────────────────────────────────────────────────────────────

interface ContextPanelProps {
  conversation: Conversation | null;
  onContextAction?: (action: ContextAction, tripName?: string) => void;
}

function ContextPanel({ conversation, onContextAction }: ContextPanelProps) {
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
          <a
            href={`tel:${contact.phone.replace(/\s/g, '')}`}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-xs text-slate-300 transition-colors border border-white/10 active:scale-95"
          >
            <Phone className="w-3 h-3" /> Call
          </a>
          <a
            href={`mailto:${clientDetail?.email ?? ''}`}
            onClick={(e) => {
              if (!clientDetail?.email) {
                e.preventDefault();
                toast.error('No email on file for this contact');
              }
            }}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-xs text-slate-300 transition-colors border border-white/10 active:scale-95"
          >
            <Mail className="w-3 h-3" /> Email
          </a>
          <button
            onClick={() => {
              const profilePath = contact.type === 'driver' ? `/drivers` : `/clients/${contact.id}`;
              window.open(profilePath, '_blank');
            }}
            className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-white/8 hover:bg-white/15 text-xs text-slate-300 transition-colors border border-white/10 active:scale-95"
          >
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
                  <span className="text-slate-200 font-medium">
                    {(conversation as ChannelConversation).channel === 'email' ? 'Email' : 'WhatsApp Direct'}
                  </span>
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
                  <button
                    key={trip}
                    onClick={() => onContextAction?.('trip-detail', trip)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 transition-colors active:scale-[0.98]"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#25D366]/15 flex items-center justify-center shrink-0">
                      <MapPin className="w-3 h-3 text-[#25D366]" />
                    </div>
                    <p className="text-xs text-slate-300 truncate flex-1 text-left">{trip}</p>
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Actions</p>
              {[
                { icon: <TrendingUp className="w-3 h-3" />, label: 'Create Trip', color: '#25D366', action: 'create-trip' },
                { icon: <FileText className="w-3 h-3" />, label: 'Send Quote', color: '#6366f1', action: 'send-quote' },
                { icon: <Car className="w-3 h-3" />, label: 'Assign Driver', color: '#f59e0b', action: 'assign-driver' },
                { icon: <CreditCard className="w-3 h-3" />, label: 'Request Payment', color: '#ec4899', action: 'request-payment' },
                { icon: <UserPlus className="w-3 h-3" />, label: 'Add to CRM', color: '#3b82f6', action: 'add-to-crm' },
              ].map(({ icon, label, color, action }) => (
                <button
                  key={label}
                  onClick={() => onContextAction?.(action as ContextAction)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-colors active:scale-[0.98]"
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
  pendingTemplate?: WhatsAppTemplate | null;
  onClearPendingTemplate?: () => void;
}

export function UnifiedInbox({ onSendMessage, pendingTemplate, onClearPendingTemplate }: UnifiedInboxProps) {
  const router = useRouter();
  const { isDemoMode } = useDemoMode();
  const [conversations, setConversations] = useState<ChannelConversation[]>(
    isDemoMode ? ALL_MOCK_CONVERSATIONS : [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(isDemoMode ? 'conv_1' : null);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with external isDemoMode context change
      setConversations(ALL_MOCK_CONVERSATIONS);
      setSelectedId('conv_1');
      return;
    }
    // Real mode — fetch live conversations from the DB
    setIsLoadingConvs(true);
    fetch('/api/whatsapp/conversations')
      .then((r) => r.json())
      .then((data: { conversations?: ChannelConversation[] }) => {
        const convs = data.conversations ?? [];
        setConversations(convs);
        if (convs.length > 0 && !selectedId) setSelectedId(convs[0]!.id);
      })
      .catch(() => { /* silently keep empty state on fetch failure */ })
      .finally(() => setIsLoadingConvs(false));
  // Only re-run when demo mode changes; we don't want selectedId as a dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedChannel: ChannelType = (selectedConversation as ChannelConversation | null)?.channel ?? 'whatsapp';

  const totalUnread = conversations.reduce((a, c) => a + c.unreadCount, 0);

  const filteredAndSorted = useMemo(() => {
    let list = conversations;

    // Filter by channel
    if (channelFilter === 'whatsapp') list = list.filter((c) => c.channel === 'whatsapp');
    else if (channelFilter === 'email') list = list.filter((c) => c.channel === 'email');

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
          (c.contact.email?.toLowerCase().includes(q) ?? false) ||
          c.messages.some((m) => m.body?.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortMode === 'unread') list = [...list].sort((a, b) => b.unreadCount - a.unreadCount);
    else if (sortMode === 'priority') {
      list = [...list].sort((a, b) => {
        const score = (c: ChannelConversation) => (c.unreadCount > 0 ? 10 : 0) + (c.contact.label === 'payment' ? 5 : 0);
        return score(b) - score(a);
      });
    }

    return list;
  }, [conversations, channelFilter, filterTab, search, sortMode]);

  function handleSendMessage(convId: string, message: string, subject?: string) {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const newMsg: Message = {
          id: `m_${Date.now()}`,
          type: 'text',
          direction: 'out',
          body: message,
          subject,
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

  const [contextModal, setContextModal] = useState<{ type: ContextActionType; tripName?: string } | null>(null);
  const [ctxActionModal, setCtxActionModal] = useState<ActionMode | null>(null);
  const [isWaConnectOpen, setIsWaConnectOpen] = useState(false);

  function handleContextAction(action: ContextAction, tripName?: string) {
    if (!selectedConversation) return;
    const { contact } = selectedConversation;

    if (action === 'add-to-crm') {
      const nameParam = encodeURIComponent(contact.name);
      const phoneParam = encodeURIComponent(contact.phone);
      const email = MOCK_CLIENT_DETAILS[contact.id]?.email ?? '';
      toast.success(`${contact.name} added to CRM ✓`, {
        description: 'Navigating to client profile…',
      });
      setTimeout(
        () => router.push(`/clients?name=${nameParam}&phone=${phoneParam}&email=${encodeURIComponent(email)}&source=inbox`),
        900,
      );
      return;
    }

    if (action === 'assign-driver') {
      setCtxActionModal('driver');
      return;
    }

    if (action === 'request-payment') {
      setCtxActionModal('payment');
      return;
    }

    setContextModal({ type: action as ContextActionType, tripName });
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

        {/* Channel filter */}
        <div className="shrink-0 flex gap-1 px-3 py-2 border-b border-white/10">
          {([
            { key: 'all' as ChannelFilter, label: 'All', icon: null },
            { key: 'whatsapp' as ChannelFilter, label: 'WhatsApp', icon: <MessageCircle className="w-3 h-3" /> },
            { key: 'email' as ChannelFilter, label: 'Email', icon: <Mail className="w-3 h-3" /> },
          ]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setChannelFilter(key)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                channelFilter === key
                  ? key === 'email'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/8'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
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
            <div className="flex flex-col items-center justify-center h-full gap-3 px-4 py-8 text-center">
              {isLoadingConvs ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin" />
                  <p className="text-xs text-slate-600">Loading conversations…</p>
                </>
              ) : isDemoMode ? (
                <>
                  <MessageCircle className="w-7 h-7 text-slate-700" />
                  <p className="text-xs text-slate-600">No conversations match your filter</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-300">Connect WhatsApp</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Link your existing number by scanning a QR code. No Meta API needed.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsWaConnectOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/25 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Scan QR to Link WhatsApp
                  </button>
                  <div className="w-full pt-2 border-t border-white/8">
                    <a
                      href="/settings?tab=integrations"
                      className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-400 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      Set up Gmail or other channels →
                    </a>
                  </div>
                </>
              )}
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
        {pendingTemplate && (
          <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-[#25D366]/10 border-b border-[#25D366]/20">
            <span className="text-base shrink-0">{pendingTemplate.emoji ?? '📋'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#25D366] truncate">Template ready: {pendingTemplate.name}</p>
              <p className="text-[11px] text-slate-400">
                {selectedConversation ? 'Template pre-filled below — edit variables and send' : 'Select a conversation to apply this template'}
              </p>
            </div>
            <button
              onClick={onClearPendingTemplate}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        )}
        <MessageThread
          conversation={selectedConversation}
          channel={selectedChannel}
          onSendMessage={handleSendMessage}
          externalInput={selectedConversation && pendingTemplate ? pendingTemplate.body : undefined}
          onExternalInputConsumed={onClearPendingTemplate}
        />
      </div>

      {/* ── RIGHT: Context Panel ─────────────────────────────────────────── */}
      <div
        className="w-[240px] shrink-0 border-l border-white/10 overflow-hidden flex flex-col"
        style={{ background: 'rgba(10,22,40,0.6)' }}
      >
        <ContextPanel conversation={selectedConversation} onContextAction={handleContextAction} />
      </div>

      {/* ── Context Panel → ActionPickerModal (Driver / Payment) ─────────── */}
      {selectedConversation && ctxActionModal && (
        <ActionPickerModal
          isOpen
          mode={ctxActionModal}
          contact={selectedConversation.contact}
          channel={selectedChannel}
          onSend={(msg, subject) => {
            handleSendMessage(selectedConversation.id, msg, subject);
            const labels: Record<ActionMode, string> = {
              itinerary: 'Itinerary',
              payment: 'Payment request',
              driver: 'Driver details',
              location: 'Location request',
            };
            toast.success(`${labels[ctxActionModal]} sent to ${selectedConversation.contact.name} ✓`);
            setCtxActionModal(null);
          }}
          onClose={() => setCtxActionModal(null)}
        />
      )}

      {/* ── Context Panel → ContextActionModal (Trip / Quote / Create) ───── */}
      {selectedConversation && contextModal && (
        <ContextActionModal
          isOpen
          type={contextModal.type}
          tripName={contextModal.tripName}
          contact={selectedConversation.contact}
          channel={selectedChannel}
          onSendMessage={(msg, subject) => {
            handleSendMessage(selectedConversation.id, msg, subject);
            setContextModal(null);
          }}
          onClose={() => setContextModal(null)}
        />
      )}

      {/* ── WhatsApp QR Connect ───────────────────────────────────────────── */}
      <WhatsAppConnectModal
        isOpen={isWaConnectOpen}
        onClose={() => setIsWaConnectOpen(false)}
        onConnected={() => setIsWaConnectOpen(false)}
      />
    </div>
  );
}
