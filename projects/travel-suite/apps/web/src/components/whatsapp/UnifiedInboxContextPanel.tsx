'use client';

import { useState, useEffect } from 'react';
import {
  Car,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Conversation } from './MessageThread';
import type { ChannelConversation } from './inbox-mock-data';
import {
  MOCK_CLIENT_DETAILS,
  MOCK_DRIVER_DETAILS,
} from './inbox-mock-data';
import {
  AVATAR_COLORS,
  type ContextAction,
  getInitials,
} from './unified-inbox-shared';

interface ContextPanelProps {
  conversation: Conversation | null;
  onContextAction?: (action: ContextAction, tripName?: string) => void;
}

export function UnifiedInboxContextPanel({
  conversation,
  onContextAction,
}: ContextPanelProps) {
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
        if (!cancelled) setAutomations(data.automations ?? []);
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; controller.abort(); };
  }, [phone]);

  const handleToggle = async (ruleType: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    // Optimistic update
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
      // Revert on error
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

  if (automations.length === 0) {
    return <p className="text-xs text-slate-500 text-center py-4">No automations configured</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Automations for this contact</p>
      {automations.map((a) => (
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
}
