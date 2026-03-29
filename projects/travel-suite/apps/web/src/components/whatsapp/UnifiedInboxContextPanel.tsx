'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Car,
  Check,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  TrendingUp,
  UserPlus,
  X,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Conversation } from './MessageThread';
import type { ChannelConversation } from './inbox-mock-data';
import {
  AVATAR_COLORS,
  type ContextAction,
  getInitials,
} from './unified-inbox-shared';

// ---------------------------------------------------------------------------
// Types for live CRM data
// ---------------------------------------------------------------------------

interface ContactDetails {
  readonly profileId: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly role: string | null;
  readonly avatarUrl: string | null;
  readonly client: {
    readonly email: string | null;
    readonly ltv: string;
    readonly ltvRaw: number;
    readonly trips: number;
    readonly stage: string;
    readonly tag: string | null;
    readonly recentTrips: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
      readonly destination: string | null;
      readonly status: string | null;
      readonly startDate: string | null;
      readonly endDate: string | null;
    }>;
    readonly payment: {
      readonly total: string;
      readonly paid: string;
      readonly balance: string;
      readonly balanceRaw: number;
      readonly status: string;
    };
    readonly proposals: ReadonlyArray<{
      readonly id: string;
      readonly title: string;
      readonly status: string | null;
      readonly viewedAt: string | null;
      readonly totalPrice: number | null;
    }>;
  } | null;
  readonly driver: {
    readonly vehicle: string;
    readonly vehicleNumber: string;
    readonly rating: number | null;
    readonly currentTrip: string | null;
    readonly totalTrips: number;
  } | null;
  readonly activeTrip: {
    readonly id: string;
    readonly name: string | null;
    readonly destination: string | null;
    readonly status: string | null;
    readonly startDate: string | null;
    readonly endDate: string | null;
    readonly paxCount: number | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Hook: fetch live contact details
// ---------------------------------------------------------------------------

function useContactDetails(phone: string) {
  const [details, setDetails] = useState<ContactDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const digits = phone.replace(/\D/g, '');
        const res = await fetch(
          `/api/admin/whatsapp/contact-details?phone=${encodeURIComponent(digits)}`,
          { signal: controller.signal },
        );
        const json = await res.json().catch(() => ({}));
        if (!cancelled) setDetails((json.data as ContactDetails) ?? null);
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; controller.abort(); };
  }, [phone]);

  return { details, loading };
}

// ---------------------------------------------------------------------------
// Context Panel
// ---------------------------------------------------------------------------

interface ContextPanelProps {
  conversation: Conversation | null;
  onContextAction?: (action: ContextAction, tripName?: string) => void;
  onQuickSend?: (message: string) => void;
}

export function UnifiedInboxContextPanel({
  conversation,
  onContextAction,
  onQuickSend,
}: ContextPanelProps) {
  const [ctxTab, setCtxTab] = useState<'info' | 'automations'>('info');
  const prevConversationId = useRef(conversation?.id);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [localName, setLocalName] = useState<string | null>(null);
  const [localIsPersonal, setLocalIsPersonal] = useState<boolean | null>(null);

  // Reset local overrides when conversation changes (render-time reset)
  if (prevConversationId.current !== conversation?.id) {
    prevConversationId.current = conversation?.id;
    setEditingName(false);
    setLocalName(null);
    setLocalIsPersonal(null);
  }

  const contactPhone = conversation?.contact.phone ?? '';
  const { details, loading } = useContactDetails(contactPhone);

  const handleSaveName = async () => {
    if (!conversation) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    const digits = conversation.contact.phone.replace(/\D/g, '');
    setLocalName(trimmed);
    setEditingName(false);
    try {
      await fetch('/api/admin/whatsapp/contact-names', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wa_id: digits, custom_name: trimmed }),
      });
      toast.success('Contact name updated');
    } catch {
      toast.error('Failed to update name');
      setLocalName(null);
    }
  };

  const handleTogglePersonal = async () => {
    if (!conversation) return;
    const currentValue = localIsPersonal ?? conversation.contact.isPersonal ?? false;
    const newValue = !currentValue;
    const digits = conversation.contact.phone.replace(/\D/g, '');
    setLocalIsPersonal(newValue);
    try {
      await fetch('/api/admin/whatsapp/contact-names', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wa_id: digits, is_personal: newValue }),
      });
      toast.success(newValue ? 'Marked as personal' : 'Marked as business');
    } catch {
      toast.error('Failed to update classification');
      setLocalIsPersonal(currentValue);
    }
  };

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
  const contactEmail = details?.email ?? details?.client?.email ?? null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 p-4 border-b border-white/10">
        <div className="flex flex-col items-center text-center gap-2 mb-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
            style={{ background: avatarColor }}
          >
            {initials}
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSaveName();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                    className="bg-white/10 text-sm font-bold text-white rounded px-2 py-0.5 w-32 outline-none focus:ring-1 focus:ring-[#25D366]"
                    autoFocus
                  />
                  <button onClick={() => void handleSaveName()} className="text-[#25D366] hover:text-green-300" aria-label="Save contact name">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-slate-400 hover:text-white" aria-label="Cancel editing name">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-white">{localName ?? contact.name}</p>
                  <button
                    onClick={() => {
                      setEditName(localName ?? contact.name);
                      setEditingName(true);
                    }}
                    className="text-slate-500 hover:text-white transition-colors"
                    title="Rename contact"
                    aria-label="Rename contact"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400">{contact.phone}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span
                className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  contact.type === 'client'
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : contact.type === 'driver'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-pink-500/20 text-pink-300'
                }`}
              >
                {details?.client?.stage ?? details?.role ?? contact.type}
              </span>
              <button
                onClick={() => void handleTogglePersonal()}
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase transition-colors ${
                  (localIsPersonal ?? contact.isPersonal)
                    ? 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                }`}
                title="Toggle personal/business"
              >
                {(localIsPersonal ?? contact.isPersonal) ? 'Personal' : 'Business'}
              </button>
            </div>
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
            href={`mailto:${contactEmail ?? ''}`}
            onClick={(e) => {
              if (!contactEmail) {
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
              const profilePath = contact.type === 'driver' ? `/drivers` : `/clients/${details?.profileId ?? contact.id}`;
              window.open(profilePath, '_blank');
            }}
            className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-white/8 hover:bg-white/15 text-xs text-slate-300 transition-colors border border-white/10 active:scale-95"
            aria-label="View profile"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {ctxTab === 'info' && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
              </div>
            )}

            {!loading && details?.client && (
              <>
                {/* Client Info */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client Info</p>
                  {[
                    { label: 'Email', val: details.client.email ?? '—' },
                    { label: 'Lifetime Value', val: details.client.ltv },
                    { label: 'Total Trips', val: `${details.client.trips} trips` },
                    { label: 'Stage', val: details.client.stage },
                    ...(details.client.tag ? [{ label: 'Tag', val: details.client.tag }] : []),
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{label}</span>
                      <span className="text-slate-200 font-medium text-right max-w-[120px] truncate">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Payment Status */}
                {details.client.payment.balanceRaw > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment</p>
                    <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-amber-400 font-semibold">Balance Due</span>
                        <span className="text-amber-300 font-bold">{details.client.payment.balance}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#25D366]"
                          style={{ width: `${Math.min(100, ((details.client.ltvRaw - details.client.payment.balanceRaw) / details.client.ltvRaw) * 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500">
                        <span>Paid: {details.client.payment.paid}</span>
                        <span>Total: {details.client.payment.total}</span>
                      </div>
                      {onQuickSend && (
                        <button
                          onClick={() => {
                            const tripName = details.activeTrip?.name || 'your booking';
                            const balance = details.client!.payment.balance;
                            onQuickSend(
                              `Hi ${details.name || 'there'}! 👋\n\nThis is a friendly reminder about the pending payment for *${tripName}*.\n\n💰 Balance due: *${balance}*\n\nPlease complete the payment at your earliest convenience. Let us know if you have any questions!`
                            );
                            toast.success('Payment reminder added to compose');
                          }}
                          className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-colors"
                        >
                          <Send className="w-2.5 h-2.5" /> Send Payment Reminder
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Active Trip */}
                {details.activeTrip && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Trip</p>
                    <div className="p-2.5 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5">
                      <p className="text-xs font-semibold text-white">{details.activeTrip.name}</p>
                      {details.activeTrip.destination && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {details.activeTrip.destination}
                        </p>
                      )}
                      {details.activeTrip.startDate && (
                        <p className="text-[10px] text-[#25D366] font-medium mt-1">
                          {new Date(details.activeTrip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {details.activeTrip.endDate && ` — ${new Date(details.activeTrip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                          {details.activeTrip.paxCount && ` · ${details.activeTrip.paxCount} pax`}
                        </p>
                      )}
                      {onQuickSend && (
                        <div className="flex gap-1.5 mt-2">
                          <button
                            onClick={() => {
                              const tripName = details.activeTrip?.name || 'your trip';
                              const dest = details.activeTrip?.destination ? ` to ${details.activeTrip.destination}` : '';
                              const link = `https://tripbuilt.com/share/${details.activeTrip?.id}`;
                              onQuickSend(
                                `Hi ${details.name || 'there'}! 👋\n\nHere's your itinerary for *${tripName}*${dest}:\n${link}\n\nPlease review and let us know if you'd like any changes.`
                              );
                              toast.success('Itinerary message added to compose');
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/25 transition-colors"
                          >
                            <Send className="w-2.5 h-2.5" /> Send Itinerary
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Trips */}
                {details.client.recentTrips.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Trips</p>
                    {details.client.recentTrips.map((trip) => (
                      <button
                        key={trip.id}
                        onClick={() => onContextAction?.('trip-detail', trip.name)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 transition-colors active:scale-[0.98]"
                      >
                        <div className="w-6 h-6 rounded-md bg-[#25D366]/15 flex items-center justify-center shrink-0">
                          <MapPin className="w-3 h-3 text-[#25D366]" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs text-slate-300 truncate">{trip.name}</p>
                          {trip.status && (
                            <p className="text-[9px] text-slate-500">{trip.status}</p>
                          )}
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Proposals */}
                {details.client.proposals.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Proposals</p>
                    {details.client.proposals.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/5 border border-white/8">
                        <div className="min-w-0">
                          <p className="text-slate-300 font-medium truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-500">
                            {p.status === 'sent' && !p.viewedAt ? 'Sent — not viewed' :
                             p.status === 'sent' && p.viewedAt ? 'Viewed' :
                             p.status ?? 'draft'}
                          </p>
                        </div>
                        {p.totalPrice && (
                          <span className="text-slate-400 font-medium shrink-0 ml-2">
                            ₹{p.totalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!loading && details?.driver && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Driver Info</p>
                {[
                  { label: 'Vehicle', val: details.driver.vehicle },
                  { label: 'Number', val: details.driver.vehicleNumber },
                  { label: 'Current Trip', val: details.driver.currentTrip ?? 'No active trip' },
                  ...(details.driver.rating ? [{ label: 'Rating', val: `${details.driver.rating} ⭐` }] : []),
                  { label: 'Total Trips', val: `${details.driver.totalTrips}` },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-200 font-medium text-right max-w-[120px] truncate">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {!loading && !details && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead Info</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Source</span>
                  <span className="text-slate-200 font-medium">
                    {(conversation as ChannelConversation).channel === 'email'
                      ? 'Email'
                      : 'WhatsApp Direct'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">First Contact</span>
                  <span className="text-slate-200 font-medium">Today</span>
                </div>
              </div>
            )}

            {/* Quick Actions — always visible */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Actions</p>
              {[
                { icon: <Sparkles className="w-3 h-3" />, label: 'Create Proposal', color: '#a78bfa', action: 'create-proposal' },
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
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}20`, color }}
                  >
                    {icon}
                  </div>
                  <span className="text-xs text-slate-300 font-medium">{label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600 ml-auto" />
                </button>
              ))}
            </div>

            {/* Agent Notes */}
            <AgentNotes
              conversationKey={conversation?.contact.phone || conversation?.contact.email || ''}
            />
          </>
        )}

        {ctxTab === 'automations' && (
          <AutomationsPanel phone={conversation?.contact.phone ?? ''} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AgentNotes — private notes per conversation
// ---------------------------------------------------------------------------

function AgentNotes({ conversationKey }: { conversationKey: string }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const keyRef = useRef(conversationKey);

  // Fetch note when conversation changes
  useEffect(() => {
    if (!conversationKey) return;
    keyRef.current = conversationKey;
    setLoaded(false);

    (async () => {
      try {
        const res = await fetch(`/api/admin/notes?key=${encodeURIComponent(conversationKey)}`);
        const json = await res.json().catch(() => ({}));
        if (keyRef.current === conversationKey) {
          setNote(json.data?.note ?? '');
          setLoaded(true);
        }
      } catch {
        setLoaded(true);
      }
    })();
  }, [conversationKey]);

  // Auto-save with debounce
  function handleChange(value: string) {
    setNote(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSaving(true);
      fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: conversationKey, note: value }),
      })
        .then(() => setSaving(false))
        .catch(() => setSaving(false));
    }, 800);
  }

  if (!conversationKey) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agent Notes</p>
        {saving && <span className="text-[9px] text-slate-500">Saving...</span>}
        {!saving && loaded && note && <span className="text-[9px] text-slate-600">✓ Saved</span>}
      </div>
      <textarea
        value={note}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add private notes about this conversation..."
        className="w-full h-20 p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 custom-scrollbar"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AutomationsPanel — fetches real automation state per contact
// ---------------------------------------------------------------------------

interface AutomationItem {
  rule_type: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  enabled: boolean;
  lastSent: string | null;
}

const DEFAULT_AUTOMATIONS: AutomationItem[] = [
  { rule_type: 'new_lead_auto_response', name: 'New Lead Auto-Response', icon: '🆕', description: 'Instantly reply with welcome message + packages', category: 'sales', enabled: true, lastSent: null },
  { rule_type: 'proposal_followup', name: 'Proposal Follow-Up', icon: '👋', description: 'Follow-up 24h after proposal if not viewed', category: 'sales', enabled: true, lastSent: null },
  { rule_type: 'justdial_nurture', name: 'JustDial Lead Nurture', icon: '📱', description: '3-day drip: welcome, testimonials, offer', category: 'sales', enabled: true, lastSent: null },
  { rule_type: 'auto_confirm_booking', name: 'Auto-confirm Booking', icon: '✅', description: 'Send confirmation + itinerary on full payment', category: 'operations', enabled: true, lastSent: null },
  { rule_type: 'reminder_48h', name: 'Pre-Trip — 48 Hours', icon: '🎒', description: 'Packing tips, weather, emergency contacts', category: 'operations', enabled: true, lastSent: null },
  { rule_type: 'reminder_24h', name: 'Pre-Trip — 24 Hours', icon: '🌅', description: 'Driver details, pickup time, hotel info', category: 'operations', enabled: true, lastSent: null },
  { rule_type: 'reminder_2h', name: 'Pre-Trip — 2 Hours', icon: '🚗', description: "Driver's live location + final confirmation", category: 'operations', enabled: true, lastSent: null },
  { rule_type: 'driver_morning_brief', name: "Driver's Morning Brief", icon: '🌄', description: "Daily trip assignments at 5 AM in Hindi", category: 'operations', enabled: true, lastSent: null },
  { rule_type: 'post_trip_review', name: 'Post-Trip Review', icon: '⭐', description: 'Ask for Google Review 2h after trip', category: 'customer_success', enabled: true, lastSent: null },
  { rule_type: 'payment_reminder_3d', name: 'Payment Reminder', icon: '🔔', description: 'Gentle reminder if advance pending after 3 days', category: 'customer_success', enabled: true, lastSent: null },
  { rule_type: 'trip_countdown', name: 'Trip Countdown', icon: '📅', description: 'Countdown messages before trip start', category: 'customer_success', enabled: true, lastSent: null },
  { rule_type: 'review_request', name: 'Review Request', icon: '⭐', description: 'Request review 24h after trip completion', category: 'customer_success', enabled: true, lastSent: null },
];

function AutomationsPanel({ phone }: { phone: string }) {
  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [loading, setLoading] = useState(!!phone);

  useEffect(() => {
    if (!phone) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/automations/contact-status?phone=${encodeURIComponent(phone)}`,
          { signal: controller.signal },
        );
        const data = await res.json().catch(() => ({}));
        const fetched = (data.automations ?? []) as AutomationItem[];
        if (!cancelled) setAutomations(fetched.length > 0 ? fetched : DEFAULT_AUTOMATIONS);
      } catch {
        if (!cancelled) setAutomations(DEFAULT_AUTOMATIONS);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; controller.abort(); };
  }, [phone]);

  const handleToggle = async (ruleType: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    setAutomations((prev) =>
      prev.map((a) => (a.rule_type === ruleType ? { ...a, enabled: newEnabled } : a))
    );
    try {
      await fetch('/api/admin/automations/contact-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, rule_type: ruleType, enabled: newEnabled }),
      });
    } catch {
      setAutomations((prev) =>
        prev.map((a) => (a.rule_type === ruleType ? { ...a, enabled: currentEnabled } : a))
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  const categories = [
    { key: 'sales', label: 'Sales & Outreach' },
    { key: 'operations', label: 'Trip Operations' },
    { key: 'customer_success', label: 'Customer Success' },
  ] as const;

  return (
    <div className="space-y-3">
      {categories.map(({ key, label }) => {
        const items = automations.filter((a) => a.category === key);
        if (items.length === 0) return null;
        return (
          <div key={key} className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            {items.map((a) => (
        <div key={a.rule_type} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-white/5">
          <span className="text-base shrink-0">{a.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white">{a.name}</p>
            <p className="text-[10px] text-slate-500">
              {!a.enabled ? 'Disabled' : a.lastSent ? `Sent ${a.lastSent}` : 'Active — not sent yet'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleToggle(a.rule_type, a.enabled)}
            className={`shrink-0 w-8 h-4.5 rounded-full relative transition-colors ${
              a.enabled ? 'bg-[#25D366]' : 'bg-slate-600'
            }`}
            title={a.enabled ? 'Disable automation' : 'Enable automation'}
            aria-label={`${a.enabled ? 'Disable' : 'Enable'} ${a.name}`}
            role="switch"
            aria-checked={a.enabled}
          >
            <span
              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                a.enabled ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
