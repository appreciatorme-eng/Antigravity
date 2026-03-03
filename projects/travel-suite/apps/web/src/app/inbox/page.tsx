'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Zap,
  LayoutTemplate,
  Radio,
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
import { UnifiedInbox } from '@/components/whatsapp/UnifiedInbox';
import { AutomationRules } from '@/components/whatsapp/AutomationRules';
import { CannedResponses } from '@/components/whatsapp/CannedResponses';
import {
  WHATSAPP_TEMPLATES,
  TEMPLATE_CATEGORIES_DISPLAY,
  LANGUAGE_LABELS,
  type TemplateCategory,
  type WhatsAppTemplate,
} from '@/lib/whatsapp/india-templates';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type PageTab = 'inbox' | 'automations' | 'templates' | 'broadcast';

type BroadcastTarget = 'all_clients' | 'all_drivers' | 'active_trips' | 'custom';

interface BroadcastState {
  target: BroadcastTarget;
  selectedTemplate: WhatsAppTemplate | null;
  customMessage: string;
  scheduledDate: string;
  scheduledTime: string;
  scheduled: boolean;
}

// ─── BROADCAST TAB ────────────────────────────────────────────────────────────

const TARGET_OPTIONS: Array<{
  key: BroadcastTarget;
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}> = [
  { key: 'all_clients', label: 'All Clients', count: 248, icon: <Users className="w-4 h-4" />, color: '#6366f1' },
  { key: 'all_drivers', label: 'All Drivers', count: 32, icon: <Car className="w-4 h-4" />, color: '#f59e0b' },
  { key: 'active_trips', label: 'Active Trips', count: 14, icon: <CalendarCheck className="w-4 h-4" />, color: '#25D366' },
  { key: 'custom', label: 'Custom List', count: 0, icon: <List className="w-4 h-4" />, color: '#ec4899' },
];

function BroadcastTab() {
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

  function getTomorrowDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  function handleSchedule7AM() {
    setState((s) => ({
      ...s,
      scheduled: true,
      scheduledDate: getTomorrowDate(),
      scheduledTime: '07:00',
    }));
  }

  function handleSendNow() {
    if (!state.selectedTemplate && !state.customMessage.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }, 1500);
  }

  const messagePreview = state.selectedTemplate?.body ?? state.customMessage;

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
                  {opt.key !== 'custom' && (
                    <p className="text-xs text-slate-400">{opt.count} contacts</p>
                  )}
                  {opt.key === 'custom' && (
                    <p className="text-xs text-slate-400">Upload CSV / select manually</p>
                  )}
                </div>
                {state.target === opt.key && (
                  <Check className="w-4 h-4 text-[#25D366] ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

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
                    <p className="text-sm font-semibold text-white">{state.selectedTemplate.name}</p>
                    <p className="text-xs text-slate-400 truncate">{state.selectedTemplate.preview}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Select a template (optional)...</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {state.selectedTemplate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setState((s) => ({ ...s, selectedTemplate: null })); }}
                    className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`} />
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
              <span className="text-[#25D366]">✓</span>
              Message ready — will be sent to <strong className="text-slate-300">{targetOption.count || '—'} contacts</strong>
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
                onChange={(e) => setState((s) => ({ ...s, scheduledDate: e.target.value, scheduled: true }))}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#25D366]/40 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Time (IST)</label>
              <input
                type="time"
                value={state.scheduledTime}
                onChange={(e) => setState((s) => ({ ...s, scheduledTime: e.target.value, scheduled: true }))}
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
            <span>Schedule for <strong className="text-white">7:00 AM tomorrow</strong></span>
            {state.scheduled && state.scheduledTime === '07:00' && state.scheduledDate === getTomorrowDate() && (
              <Check className="w-4 h-4 text-[#25D366] ml-auto" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSendNow}
            disabled={(!state.selectedTemplate && !state.customMessage.trim()) || sending}
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
                setState((s) => ({ ...s, scheduledDate: getTomorrowDate(), scheduledTime: '07:00', scheduled: true }));
              }
            }}
            disabled={!state.selectedTemplate && !state.customMessage.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/20 bg-white/8 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            <Clock className="w-4 h-4" />
            Schedule
          </button>
        </div>

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
              Broadcast sent to {targetOption.count} contacts!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ─── TEMPLATES LIST VIEW ──────────────────────────────────────────────────────

function TemplatesListView({ onUseTemplate }: { onUseTemplate?: (t: WhatsAppTemplate) => void }) {
  const [showCanned, setShowCanned] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<WhatsAppTemplate['language'] | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = WHATSAPP_TEMPLATES;
    if (selectedCategory !== 'all') result = result.filter((t) => t.category === selectedCategory);
    if (selectedLanguage !== 'all') result = result.filter((t) => t.language === selectedLanguage);
    return result;
  }, [selectedCategory, selectedLanguage]);

  const categories = [
    'all',
    ...Array.from(new Set(WHATSAPP_TEMPLATES.map((t) => t.category))),
  ] as Array<TemplateCategory | 'all'>;

  function handleCopy(template: WhatsAppTemplate) {
    navigator.clipboard.writeText(template.body).catch(() => {});
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Message Templates</h2>
          <p className="text-sm text-slate-400 mt-0.5">{WHATSAPP_TEMPLATES.length} templates for Indian tour operators</p>
        </div>
        <button
          onClick={() => setShowCanned(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold hover:bg-[#25D366]/25 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Quick Replies
        </button>
      </div>

      {/* Language filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
        {(['all', 'en', 'hi', 'hinglish'] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              selectedLanguage === lang
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-white/8 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30'
                : 'bg-white/8 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {cat === 'all' ? 'All Templates' : TEMPLATE_CATEGORIES_DISPLAY[cat]}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="border border-white/10 rounded-xl bg-white/5 hover:bg-white/8 transition-colors flex flex-col overflow-hidden"
          >
            <div className="p-4 flex-1">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xl shrink-0">{template.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{template.name}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400 uppercase tracking-wider">
                      {TEMPLATE_CATEGORIES_DISPLAY[template.category]}
                    </span>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                      template.language === 'en' ? 'bg-blue-500/15 text-blue-400' :
                      template.language === 'hi' ? 'bg-orange-500/15 text-orange-400' :
                      'bg-purple-500/15 text-purple-400'
                    }`}>
                      {template.language === 'en' ? '🇬🇧 EN' : template.language === 'hi' ? '🇮🇳 HI' : '🤝 Mix'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-300 bg-black/20 rounded-lg p-3 font-mono leading-relaxed max-h-32 overflow-hidden relative">
                {template.body.slice(0, 200)}
                {template.body.length > 200 && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
                )}
              </div>
              <div className="flex gap-1 flex-wrap mt-2">
                {template.variables.slice(0, 4).map((v) => (
                  <span key={v} className="text-[9px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded px-1.5 py-0.5 font-mono">
                    {`{{${v}}}`}
                  </span>
                ))}
                {template.variables.length > 4 && (
                  <span className="text-[9px] text-slate-500">+{template.variables.length - 4} more</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={() => handleCopy(template)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  copiedId === template.id
                    ? 'border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366]'
                    : 'border-white/15 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${copiedId !== template.id ? 'opacity-0' : ''}`} />
                {copiedId === template.id ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => onUseTemplate?.(template)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 border border-[#25D366]/20 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Use
              </button>
            </div>
          </div>
        ))}
      </div>

      <CannedResponses
        isOpen={showCanned}
        onClose={() => setShowCanned(false)}
        onSelect={(msg) => { navigator.clipboard.writeText(msg).catch(() => {}); setShowCanned(false); }}
      />
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const UNREAD_COUNT = 7;

const PAGE_TABS: Array<{ key: PageTab; label: string; icon: React.ReactNode }> = [
  { key: 'inbox', label: 'Inbox', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { key: 'automations', label: 'Automations', icon: <Zap className="w-3.5 h-3.5" /> },
  { key: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
  { key: 'broadcast', label: 'Broadcast', icon: <Radio className="w-3.5 h-3.5" /> },
];

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<PageTab>('inbox');
  const [pendingTemplate, setPendingTemplate] = useState<WhatsAppTemplate | null>(null);

  function handleUseTemplate(template: WhatsAppTemplate) {
    setPendingTemplate(template);
    setActiveTab('inbox');
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0d1f38 100%)' }}
    >
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-white/10"
        style={{ background: 'rgba(10,22,40,0.8)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          {/* Omnichannel Logo */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #25D366, #3b82f6)', boxShadow: '0 4px 12px rgba(37,211,102,0.2), 0 4px 12px rgba(59,130,246,0.1)' }}
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">Inbox</h1>
              {UNREAD_COUNT > 0 && (
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-black shadow-md"
                  style={{ background: 'linear-gradient(135deg, #25D366, #3b82f6)' }}
                >
                  {UNREAD_COUNT}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Unified inbox for tour operators</p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span className="text-xs font-semibold text-[#25D366]">WhatsApp</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold text-blue-400">Email</span>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex gap-1 px-6 py-2 border-b border-white/10"
        style={{ background: 'rgba(10,22,40,0.6)' }}
      >
        {PAGE_TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === key
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {icon}
            {label}
            {key === 'inbox' && UNREAD_COUNT > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#25D366] text-white text-[9px] font-black flex items-center justify-center">
                {UNREAD_COUNT}
              </span>
            )}
            {activeTab === key && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#25D366] rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'inbox' && (
            <motion.div
              key="inbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-hidden"
            >
              <UnifiedInbox
                pendingTemplate={pendingTemplate}
                onClearPendingTemplate={() => setPendingTemplate(null)}
              />
            </motion.div>
          )}

          {activeTab === 'automations' && (
            <motion.div
              key="automations"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden"
            >
              <AutomationRules />
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <TemplatesListView onUseTemplate={handleUseTemplate} />
            </motion.div>
          )}

          {activeTab === 'broadcast' && (
            <motion.div
              key="broadcast"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <BroadcastTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
