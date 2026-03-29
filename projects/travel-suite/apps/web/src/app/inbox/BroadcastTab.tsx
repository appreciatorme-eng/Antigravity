'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Car,
  CalendarCheck,
  List,
  Clock,
  Send,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import {
  WHATSAPP_TEMPLATES,
  TEMPLATE_CATEGORIES_DISPLAY,
  type WhatsAppTemplate,
} from '@/lib/whatsapp/india-templates';
import {
  useBroadcastAudience,
  type BroadcastTarget,
} from './useBroadcastAudience';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface BroadcastState {
  target: BroadcastTarget;
  selectedTemplate: WhatsAppTemplate | null;
  customMessage: string;
  scheduledDate: string;
  scheduledTime: string;
  scheduled: boolean;
}

interface TargetOption {
  key: BroadcastTarget;
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  helper: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ─── CUSTOM RECIPIENTS PANEL ─────────────────────────────────────────────────

interface CustomRecipientsPanelProps {
  filteredContacts: Array<{ id: string; name: string; phone: string; lastSeenAt: string | null }>;
  selectedRecipients: string[];
  setSelectedRecipients: React.Dispatch<React.SetStateAction<string[]>>;
  recipientSearch: string;
  setRecipientSearch: (value: string) => void;
}

function CustomRecipientsPanel({
  filteredContacts,
  selectedRecipients,
  setSelectedRecipients,
  recipientSearch,
  setRecipientSearch,
}: CustomRecipientsPanelProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Custom recipients
          </p>
          <p className="text-xs text-slate-400">
            Select the exact contacts who should receive this message.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setSelectedRecipients(filteredContacts.map((contact) => contact.phone))
            }
            className="text-xs font-semibold text-[#25D366]"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelectedRecipients([])}
            className="text-xs font-semibold text-slate-400"
          >
            Deselect all
          </button>
        </div>
      </div>

      <input
        value={recipientSearch}
        onChange={(event) => setRecipientSearch(event.target.value)}
        placeholder="Search contacts by name or phone..."
        className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#25D366]/40"
      />

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {filteredContacts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500">
            No contacts available for manual selection yet.
          </p>
        ) : (
          filteredContacts.map((contact) => {
            const checked = selectedRecipients.includes(contact.phone);
            return (
              <label
                key={contact.phone}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                  checked
                    ? 'border-[#25D366]/35 bg-[#25D366]/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    setSelectedRecipients((current) =>
                      event.target.checked
                        ? [...current, contact.phone]
                        : current.filter((phone) => phone !== contact.phone),
                    );
                  }}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-[#25D366] focus:ring-[#25D366]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{contact.name}</p>
                  <p className="text-xs text-slate-400">{contact.phone}</p>
                </div>
              </label>
            );
          })
        )}
      </div>
      <p className="text-xs text-slate-400">
        {selectedRecipients.length} recipient{selectedRecipients.length === 1 ? '' : 's'}{' '}
        selected
      </p>
    </div>
  );
}

// ─── BROADCAST TAB ────────────────────────────────────────────────────────────

export function BroadcastTab() {
  const {
    audienceCounts,
    broadcastReady,
    audiencesLoading,
    audienceError,
    recipientSearch,
    setRecipientSearch,
    selectedRecipients,
    setSelectedRecipients,
    filteredContacts,
  } = useBroadcastAudience();

  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSummary, setSendSummary] = useState<{ sent: number; failed: number } | null>(null);

  const TARGET_OPTIONS = useMemo<TargetOption[]>(
    () => [
      {
        key: 'all_clients',
        label: 'All Clients',
        count: audienceCounts.all_clients,
        icon: <Users className="w-4 h-4" />,
        color: '#6366f1',
        helper: `${audienceCounts.all_clients} saved client contacts`,
      },
      {
        key: 'all_drivers',
        label: 'All Drivers',
        count: audienceCounts.all_drivers,
        icon: <Car className="w-4 h-4" />,
        color: '#f59e0b',
        helper: `${audienceCounts.all_drivers} connected driver contacts`,
      },
      {
        key: 'active_trips',
        label: 'Active Trips',
        count: audienceCounts.active_trips,
        icon: <CalendarCheck className="w-4 h-4" />,
        color: '#25D366',
        helper: `${audienceCounts.active_trips} travelers on active trips`,
      },
      {
        key: 'custom',
        label: 'Custom List',
        count: audienceCounts.custom,
        icon: <List className="w-4 h-4" />,
        color: '#ec4899',
        helper: `${audienceCounts.custom} recent WhatsApp contacts`,
      },
    ],
    [audienceCounts],
  );

  const [state, setState] = useState<BroadcastState>({
    target: 'all_clients',
    selectedTemplate: null,
    customMessage: '',
    scheduledDate: '',
    scheduledTime: '07:00',
    scheduled: false,
  });
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const targetOption = TARGET_OPTIONS.find((t) => t.key === state.target)!;
  const messagePreview = state.selectedTemplate?.body ?? state.customMessage;
  const isCustomTarget = state.target === 'custom';
  const canSendNow =
    Boolean(messagePreview?.trim()) &&
    (isCustomTarget ? selectedRecipients.length > 0 : targetOption.count > 0) &&
    broadcastReady;

  function handleSchedule7AM() {
    setState((s) => ({
      ...s,
      scheduled: true,
      scheduledDate: getTomorrowDate(),
      scheduledTime: '07:00',
    }));
  }

  async function handleSendNow() {
    if (!state.selectedTemplate && !state.customMessage.trim()) return;
    if (state.target === 'custom' && selectedRecipients.length === 0) {
      setSendError('Select at least one recipient before sending.');
      return;
    }

    setSending(true);
    setSendError(null);
    setScheduleMessage(null);

    try {
      const response = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: state.target,
          message: messagePreview,
          recipients: state.target === 'custom' ? selectedRecipients : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { data?: { sent: number; failed: number }; error?: string }
        | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || 'Failed to send broadcast');
      }

      setSendSummary({
        sent: payload.data.sent,
        failed: payload.data.failed,
      });
      setSent(true);
      window.setTimeout(() => setSent(false), 3000);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-white">Broadcast Message</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Send a WhatsApp message to multiple contacts at once
          </p>
        </div>

        {audienceError && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {audienceError}
          </div>
        )}

        {/* Target Selection */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            1. Choose Recipients
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setState((s) => ({ ...s, target: opt.key }))}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  state.target === opt.key
                    ? 'border-[#25D366]/50 bg-[#25D366]/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${opt.color}20`, color: opt.color }}
                >
                  {opt.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{opt.label}</p>
                  <p className="text-xs text-slate-400">
                    {audiencesLoading ? 'Loading audience...' : opt.helper}
                  </p>
                </div>
                {state.target === opt.key && (
                  <Check className="w-4 h-4 text-[#25D366] ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {isCustomTarget ? (
          <CustomRecipientsPanel
            filteredContacts={filteredContacts}
            selectedRecipients={selectedRecipients}
            setSelectedRecipients={setSelectedRecipients}
            recipientSearch={recipientSearch}
            setRecipientSearch={setRecipientSearch}
          />
        ) : null}

        {/* Message / Template */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            2. Compose Message
          </p>

          {/* Template selector */}
          <div className="relative mb-3">
            <button
              onClick={() => setShowTemplateDropdown((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-white/15 bg-white/8 hover:bg-white/12 text-left transition-colors"
            >
              <div className="min-w-0">
                {state.selectedTemplate ? (
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {state.selectedTemplate.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {state.selectedTemplate.preview}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Select a template (optional)...</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {state.selectedTemplate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setState((s) => ({ ...s, selectedTemplate: null }));
                    }}
                    className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    aria-label="Clear selected template"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            <AnimatePresence>
              {showTemplateDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-white/15 overflow-hidden shadow-2xl"
                  style={{
                    background: 'rgba(15,23,42,0.98)',
                    backdropFilter: 'blur(20px)',
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}
                >
                  {WHATSAPP_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setState((s) => ({ ...s, selectedTemplate: t, customMessage: '' }));
                        setShowTemplateDropdown(false);
                      }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/8 text-left transition-colors border-b border-white/5 last:border-0"
                    >
                      <span className="text-lg shrink-0 mt-0.5">{t.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{t.name}</p>
                        <p className="text-xs text-slate-400 truncate">{t.preview}</p>
                        <p className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-wider">
                          {TEMPLATE_CATEGORIES_DISPLAY[t.category]}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Custom message area */}
          <textarea
            value={state.selectedTemplate ? state.selectedTemplate.body : state.customMessage}
            onChange={(e) => {
              if (!state.selectedTemplate) {
                setState((s) => ({ ...s, customMessage: e.target.value }));
              }
            }}
            readOnly={!!state.selectedTemplate}
            placeholder="Or type a custom message here...&#10;&#10;Tip: Use {{variable}} for personalised fields."
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-[#25D366]/40 resize-none h-40 font-mono leading-relaxed"
          />

          {messagePreview && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="text-[#25D366]">&#10003;</span>
              Message ready — will be sent to{' '}
              <strong className="text-slate-300">
                {isCustomTarget ? selectedRecipients.length : targetOption.count || '\u2014'}{' '}
                contacts
              </strong>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            3. When to Send
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Date</label>
              <input
                type="date"
                value={state.scheduledDate}
                onChange={(e) =>
                  setState((s) => ({ ...s, scheduledDate: e.target.value, scheduled: true }))
                }
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#25D366]/40 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Time (IST)</label>
              <input
                type="time"
                value={state.scheduledTime}
                onChange={(e) =>
                  setState((s) => ({ ...s, scheduledTime: e.target.value, scheduled: true }))
                }
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#25D366]/40 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Shortcut */}
          <button
            onClick={handleSchedule7AM}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition-colors w-full"
          >
            <Clock className="w-4 h-4 text-[#25D366]" />
            <span>
              Schedule for <strong className="text-white">7:00 AM tomorrow</strong>
            </span>
            {state.scheduled &&
              state.scheduledTime === '07:00' &&
              state.scheduledDate === getTomorrowDate() && (
                <Check className="w-4 h-4 text-[#25D366] ml-auto" />
              )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSendNow}
            disabled={!canSendNow || sending}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1FAF54] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? 'Sending...' : 'Send Now'}
          </button>

          <button
            onClick={() => {
              if (!state.scheduledDate) {
                setState((s) => ({
                  ...s,
                  scheduledDate: getTomorrowDate(),
                  scheduledTime: '07:00',
                  scheduled: true,
                }));
              }
              setScheduleMessage(
                'Broadcast scheduling is not live yet. Use Send Now for immediate delivery.',
              );
            }}
            disabled={!state.selectedTemplate && !state.customMessage.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/20 bg-white/8 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            <Clock className="w-4 h-4" />
            Schedule
          </button>
        </div>

        {scheduleMessage && <p className="text-xs text-slate-400">{scheduleMessage}</p>}
        {sendError && <p className="text-xs text-red-300">{sendError}</p>}

        {/* Success toast */}
        <AnimatePresence>
          {sent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold shadow-xl z-50"
            >
              <Check className="w-4 h-4" />
              Broadcast sent to {sendSummary?.sent ?? 0} contacts
              {sendSummary?.failed ? ` (${sendSummary.failed} failed)` : ''}.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
