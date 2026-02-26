'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Play,
  Pause,
  BarChart2,
  Users,
  Car,
  CreditCard,
  Star,
  MessageSquare,
  Timer,
  Bell,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  enabled: boolean;
  lastTriggered?: string;
  triggerCount?: number;
  category: 'booking' | 'trip' | 'payment' | 'lead' | 'driver';
  icon: string;
  timeSaved?: string; // per week
}

const INITIAL_RULES: AutomationRule[] = [
  {
    id: 'auto_confirm_booking',
    name: 'Auto-confirm Booking',
    description: 'When full payment is received, automatically send booking confirmation + itinerary PDF',
    trigger: 'Payment fully received',
    action: 'Send confirmation + itinerary',
    enabled: true,
    lastTriggered: '2 hours ago',
    triggerCount: 142,
    category: 'booking',
    icon: '✅',
    timeSaved: '45 min',
  },
  {
    id: 'reminder_48h',
    name: 'Pre-Trip Reminder — 48 Hours',
    description: 'Send packing tips, weather forecast, and emergency contacts 48 hours before departure',
    trigger: '48 hours before trip start',
    action: 'Send reminder + packing checklist + weather',
    enabled: true,
    lastTriggered: 'Yesterday, 8:00 AM',
    triggerCount: 98,
    category: 'trip',
    icon: '🎒',
    timeSaved: '30 min',
  },
  {
    id: 'reminder_24h',
    name: 'Pre-Trip Reminder — 24 Hours',
    description: 'Send confirmed driver details, pickup time, and hotel check-in info 24 hours before',
    trigger: '24 hours before trip start',
    action: 'Send driver details + hotel info',
    enabled: true,
    lastTriggered: 'Today, 6:00 AM',
    triggerCount: 97,
    category: 'trip',
    icon: '🌅',
    timeSaved: '30 min',
  },
  {
    id: 'reminder_2h',
    name: 'Pre-Trip Reminder — 2 Hours',
    description: "Share driver's live location link and final pickup confirmation 2 hours before departure",
    trigger: '2 hours before trip start',
    action: "Send live driver location + final confirmation",
    enabled: true,
    lastTriggered: 'Today, 4:00 AM',
    triggerCount: 95,
    category: 'trip',
    icon: '🚗',
    timeSaved: '20 min',
  },
  {
    id: 'driver_morning_brief',
    name: "Driver's Morning Brief",
    description: "Every morning at 5 AM, send each driver their day's trip assignments in Hindi",
    trigger: 'Daily at 5:00 AM',
    action: "Send today's assignments to each driver",
    enabled: true,
    lastTriggered: 'Today, 5:00 AM',
    triggerCount: 365,
    category: 'driver',
    icon: '🌄',
    timeSaved: '60 min',
  },
  {
    id: 'post_trip_review',
    name: 'Post-Trip Review Request',
    description: '2 hours after trip completion, ask clients for a Google Review with personalised message',
    trigger: '2 hours after trip end',
    action: 'Send Google Review request',
    enabled: true,
    lastTriggered: 'Yesterday, 9:00 PM',
    triggerCount: 88,
    category: 'booking',
    icon: '⭐',
    timeSaved: '20 min',
  },
  {
    id: 'payment_reminder_3d',
    name: 'Payment Reminder — Day 3',
    description: 'If advance payment is still pending after 3 days, send a gentle reminder with payment link',
    trigger: 'Payment pending for 3 days',
    action: 'Send gentle payment reminder',
    enabled: false,
    lastTriggered: '3 days ago',
    triggerCount: 34,
    category: 'payment',
    icon: '🔔',
    timeSaved: '15 min',
  },
  {
    id: 'new_lead_auto_response',
    name: 'New Lead Auto-Response',
    description: 'When an unknown number messages for the first time, instantly reply with welcome message + packages',
    trigger: 'New number sends first message',
    action: 'Send welcome + package catalogue link',
    enabled: false,
    lastTriggered: '1 week ago',
    triggerCount: 210,
    category: 'lead',
    icon: '🆕',
    timeSaved: '45 min',
  },
  {
    id: 'justdial_nurture',
    name: 'JustDial Lead Nurture',
    description: 'When a lead arrives from JustDial, send a 3-day drip sequence: Day 1 welcome, Day 2 testimonials, Day 3 offer',
    trigger: 'Lead source = JustDial',
    action: '3-day nurture sequence (automated)',
    enabled: false,
    lastTriggered: '2 days ago',
    triggerCount: 67,
    category: 'lead',
    icon: '📲',
    timeSaved: '2 hrs',
  },
  {
    id: 'unanswered_followup',
    name: 'Unanswered Lead Follow-up',
    description: "If a lead doesn't reply within 24 hours, send a follow-up with a limited-time offer",
    trigger: 'Lead no reply for 24 hours',
    action: 'Send follow-up + special offer',
    enabled: false,
    lastTriggered: '5 days ago',
    triggerCount: 43,
    category: 'lead',
    icon: '👋',
    timeSaved: '30 min',
  },
];

const CATEGORY_COLORS: Record<AutomationRule['category'], string> = {
  booking: '#25D366',
  trip: '#6366f1',
  payment: '#f59e0b',
  lead: '#ec4899',
  driver: '#f97316',
};

const CATEGORY_LABELS: Record<AutomationRule['category'], string> = {
  booking: 'Booking',
  trip: 'Trip',
  payment: 'Payment',
  lead: 'Lead',
  driver: 'Driver',
};

function RuleCard({
  rule,
  onToggle,
  onView,
}: {
  rule: AutomationRule;
  onToggle: (id: string) => void;
  onView: (rule: AutomationRule) => void;
}) {
  const catColor = CATEGORY_COLORS[rule.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 transition-all ${
        rule.enabled
          ? 'border-white/15 bg-white/5 hover:bg-white/8'
          : 'border-white/8 bg-white/2 opacity-70 hover:opacity-90'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + text */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `${catColor}20` }}
          >
            {rule.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">{rule.name}</h3>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: `${catColor}25`, color: catColor }}
              >
                {CATEGORY_LABELS[rule.category]}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{rule.description}</p>

            {/* Trigger → Action */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-700/50 text-slate-300 rounded-md px-2 py-0.5">
                <Bell className="w-2.5 h-2.5" />
                {rule.trigger}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
              <span className="inline-flex items-center gap-1 text-[10px] bg-[#25D366]/10 text-[#25D366] rounded-md px-2 py-0.5">
                <Zap className="w-2.5 h-2.5" />
                {rule.action}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 mt-2">
              {rule.lastTriggered && (
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Last: {rule.lastTriggered}
                </span>
              )}
              {rule.triggerCount !== undefined && (
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <BarChart2 className="w-2.5 h-2.5" />
                  {rule.triggerCount} times
                </span>
              )}
              {rule.timeSaved && (
                <span className="text-[10px] text-[#25D366] flex items-center gap-1">
                  <Timer className="w-2.5 h-2.5" />
                  Saves {rule.timeSaved}/week
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: toggle + view */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Toggle */}
          <button
            onClick={() => onToggle(rule.id)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              rule.enabled ? 'bg-[#25D366]' : 'bg-slate-700'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                rule.enabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
          <button
            onClick={() => onView(rule)}
            className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5 transition-colors"
          >
            Edit <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CreateRuleModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/15 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(10,22,40,1) 100%)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#25D366]" />
            Create Automation Rule
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s ? 'bg-[#25D366] text-white' : 'bg-white/10 text-slate-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-[#25D366]' : 'bg-white/10'}`} />}
            </div>
          ))}
          <span className="ml-2 text-xs text-slate-400">
            {step === 1 ? 'Choose Trigger' : step === 2 ? 'Set Action' : 'Review & Save'}
          </span>
        </div>

        <div className="px-5 py-4 space-y-3">
          {step === 1 && (
            <>
              <p className="text-xs text-slate-400 mb-3">When should this automation run?</p>
              {[
                { icon: <CreditCard className="w-4 h-4" />, label: 'Payment received', val: 'payment' },
                { icon: <Clock className="w-4 h-4" />, label: 'Time before trip (hours)', val: 'time' },
                { icon: <MessageSquare className="w-4 h-4" />, label: 'New message received', val: 'message' },
                { icon: <Users className="w-4 h-4" />, label: 'New lead / contact added', val: 'lead' },
                { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Trip status changed', val: 'status' },
              ].map(({ icon, label, val }) => (
                <button
                  key={val}
                  onClick={() => setStep(2)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/25 transition-colors">
                    {icon}
                  </div>
                  <span className="text-sm text-slate-200">{label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                </button>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs text-slate-400 mb-3">What should happen automatically?</p>
              {[
                { icon: <MessageSquare className="w-4 h-4" />, label: 'Send WhatsApp message', val: 'whatsapp' },
                { icon: <Bell className="w-4 h-4" />, label: 'Send to multiple contacts (broadcast)', val: 'broadcast' },
                { icon: <Car className="w-4 h-4" />, label: 'Assign / notify driver', val: 'driver' },
                { icon: <Star className="w-4 h-4" />, label: 'Request Google Review', val: 'review' },
              ].map(({ icon, label, val }) => (
                <button
                  key={val}
                  onClick={() => setStep(3)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <span className="text-sm text-slate-200">{label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                </button>
              ))}
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Rule Name</label>
                <input
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#25D366]/50"
                  placeholder="e.g. Payment reminder after 3 days"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Message Template</label>
                <textarea
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#25D366]/50 resize-none h-24"
                  placeholder="Namaste {{client_name}} ji! ..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-slate-300 text-sm hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1FAF54] text-white text-sm font-semibold transition-colors"
                >
                  Save Rule
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [showCreate, setShowCreate] = useState(false);
  const [filterCategory, setFilterCategory] = useState<AutomationRule['category'] | 'all'>('all');
  const [viewRule, setViewRule] = useState<AutomationRule | null>(null);

  function handleToggle(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }

  const enabledCount = rules.filter((r) => r.enabled).length;
  const totalSaved = rules
    .filter((r) => r.enabled)
    .reduce((acc, r) => {
      if (!r.timeSaved) return acc;
      const num = parseFloat(r.timeSaved);
      const isHr = r.timeSaved.includes('hr');
      return acc + (isHr ? num * 60 : num);
    }, 0);

  const displaySaved =
    totalSaved >= 60
      ? `${(totalSaved / 60).toFixed(1)} hours`
      : `${Math.round(totalSaved)} minutes`;

  const filtered = rules.filter(
    (r) => filterCategory === 'all' || r.category === filterCategory
  );

  const categories: Array<{ key: AutomationRule['category'] | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'booking', label: 'Booking' },
    { key: 'trip', label: 'Trip' },
    { key: 'payment', label: 'Payment' },
    { key: 'lead', label: 'Lead' },
    { key: 'driver', label: 'Driver' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="shrink-0 grid grid-cols-3 gap-3 p-4 border-b border-white/10">
        <div className="rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 p-3 text-center">
          <p className="text-2xl font-black text-[#25D366]">{enabledCount}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Active Rules</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <p className="text-2xl font-black text-white">{rules.reduce((a, r) => a + (r.triggerCount ?? 0), 0)}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Total Runs</p>
        </div>
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-center">
          <p className="text-lg font-black text-purple-400 leading-tight">{displaySaved}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Saved/Week</p>
        </div>
      </div>

      {/* Savings banner */}
      <div className="shrink-0 mx-4 mt-3 mb-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/8 border border-[#25D366]/20">
        <TrendingUp className="w-4 h-4 text-[#25D366] shrink-0" />
        <p className="text-xs text-[#25D366] font-medium">
          Active automations are saving you approximately <strong>{displaySaved} this week</strong>
        </p>
      </div>

      {/* Filters + create button */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {categories.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterCategory(key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterCategory === key
                  ? 'bg-white/15 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/8'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1FAF54] text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Rule
        </button>
      </div>

      {/* Rules list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        <div className="space-y-2">
          {filtered.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onView={setViewRule}
            />
          ))}
        </div>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && <CreateRuleModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      {/* View/edit modal (simplified) */}
      <AnimatePresence>
        {viewRule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setViewRule(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/15 p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(10,22,40,1) 100%)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{viewRule.icon}</span>
                  <h3 className="text-sm font-bold text-white">{viewRule.name}</h3>
                </div>
                <button onClick={() => setViewRule(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-4">{viewRule.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Bell className="w-4 h-4 text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Trigger</p>
                    <p className="text-xs text-white font-medium">{viewRule.trigger}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Zap className="w-4 h-4 text-[#25D366] shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Action</p>
                    <p className="text-xs text-white font-medium">{viewRule.action}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { handleToggle(viewRule.id); setViewRule(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    viewRule.enabled
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30'
                  }`}
                >
                  {viewRule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {viewRule.enabled ? 'Pause Rule' : 'Enable Rule'}
                </button>
                <button
                  onClick={() => setViewRule(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-slate-300 text-sm hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
