'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authedFetch } from '@/lib/api/authed-fetch';
import {
  Zap,
  Plus,
  Clock,
  CheckCircle2,
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
  Loader2,
  AlertCircle,
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
  rule_type?: string;
}

// API response types
interface ApiAutomationRule {
  id?: string;
  rule_type: string;
  enabled: boolean;
  trigger_config?: unknown;
  action_config?: unknown;
  created_at?: string;
  updated_at?: string;
  template: {
    name: string;
    description: string;
    category: string;
    trigger_config?: unknown;
    action_config?: unknown;
    stop_conditions?: unknown[];
  } | null;
}

interface ApiResponse {
  data: {
    rules: ApiAutomationRule[];
    templates: unknown[];
  };
  error: string | null;
}

// Map API category to UI category
function mapApiCategory(apiCategory: string): AutomationRule['category'] {
  const mapping: Record<string, AutomationRule['category']> = {
    sales: 'lead',
    operations: 'trip',
    customer_success: 'booking',
  };
  return mapping[apiCategory] || 'booking';
}

// Map rule_type to icon
function getRuleIcon(ruleType: string): string {
  const icons: Record<string, string> = {
    proposal_followup: '👋',
    payment_reminder: '💳',
    review_request: '⭐',
    trip_countdown: '📅',
  };
  return icons[ruleType] || '✨';
}

// Format trigger description
function getTriggerDescription(ruleType: string): string {
  const descriptions: Record<string, string> = {
    proposal_followup: '24 hours after proposal sent',
    payment_reminder: '3 days before payment due',
    review_request: '24 hours after trip completion',
    trip_countdown: 'Configurable days before trip',
  };
  return descriptions[ruleType] || 'Trigger condition';
}

// Format action description
function getActionDescription(ruleType: string): string {
  const descriptions: Record<string, string> = {
    proposal_followup: 'Send follow-up via WhatsApp',
    payment_reminder: 'Send payment reminder',
    review_request: 'Request review',
    trip_countdown: 'Send countdown message',
  };
  return descriptions[ruleType] || 'Send message';
}

// Fallback mock data for demo purposes (only used if API fails)
const FALLBACK_RULES: AutomationRule[] = [
  {
    id: 'proposal_followup',
    name: 'Proposal Follow-Up',
    description: 'Send WhatsApp follow-up 24 hours after proposal is sent if client hasn\'t viewed it',
    trigger: '24 hours after proposal sent',
    action: 'Send follow-up via WhatsApp',
    enabled: true,
    category: 'lead',
    icon: '👋',
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    description: 'Send automated reminder 3 days before payment due date',
    trigger: '3 days before payment due',
    action: 'Send payment reminder',
    enabled: true,
    category: 'payment',
    icon: '💳',
  },
  {
    id: 'review_request',
    name: 'Review Request',
    description: 'Request review 24 hours after trip completion',
    trigger: '24 hours after trip completion',
    action: 'Request review',
    enabled: true,
    category: 'booking',
    icon: '⭐',
  },
  {
    id: 'trip_countdown',
    name: 'Trip Countdown',
    description: 'Send countdown messages before trip start',
    trigger: 'Configurable days before trip',
    action: 'Send countdown message',
    enabled: true,
    category: 'trip',
    icon: '📅',
  },
  {
    id: 'auto_confirm_booking',
    name: 'Auto-confirm Booking',
    description: 'When full payment is received, automatically send booking confirmation + itinerary PDF',
    trigger: 'Payment fully received',
    action: 'Send confirmation + itinerary',
    enabled: true,
    category: 'booking',
    icon: '✅',
  },
  {
    id: 'reminder_48h',
    name: 'Pre-Trip Reminder — 48 Hours',
    description: 'Send packing tips, weather forecast, and emergency contacts 48 hours before departure',
    trigger: '48 hours before trip start',
    action: 'Send reminder + packing checklist + weather',
    enabled: true,
    category: 'trip',
    icon: '🎒',
  },
  {
    id: 'reminder_24h',
    name: 'Pre-Trip Reminder — 24 Hours',
    description: 'Send confirmed driver details, pickup time, and hotel check-in info 24 hours before',
    trigger: '24 hours before trip start',
    action: 'Send driver details + hotel info',
    enabled: true,
    category: 'trip',
    icon: '🌅',
  },
  {
    id: 'reminder_2h',
    name: 'Pre-Trip Reminder — 2 Hours',
    description: "Share driver's live location link and final pickup confirmation 2 hours before departure",
    trigger: '2 hours before trip start',
    action: "Send live driver location + final confirmation",
    enabled: true,
    category: 'trip',
    icon: '🚗',
  },
  {
    id: 'driver_morning_brief',
    name: "Driver's Morning Brief",
    description: "Every morning at 5 AM, send each driver their day's trip assignments in Hindi",
    trigger: 'Daily at 5:00 AM',
    action: "Send today's assignments to each driver",
    enabled: true,
    category: 'driver',
    icon: '🌄',
  },
  {
    id: 'post_trip_review',
    name: 'Post-Trip Review Request',
    description: '2 hours after trip completion, ask clients for a Google Review with personalised message',
    trigger: '2 hours after trip end',
    action: 'Send Google Review request',
    enabled: true,
    category: 'booking',
    icon: '⭐',
  },
  {
    id: 'payment_reminder_3d',
    name: 'Payment Reminder — Day 3',
    description: 'If advance payment is still pending after 3 days, send a gentle reminder with payment link',
    trigger: 'Payment pending for 3 days',
    action: 'Send gentle payment reminder',
    enabled: true,
    category: 'payment',
    icon: '🔔',
  },
  {
    id: 'new_lead_auto_response',
    name: 'New Lead Auto-Response',
    description: 'When an unknown number messages for the first time, instantly reply with welcome message + packages',
    trigger: 'New number sends first message',
    action: 'Send welcome + package catalogue link',
    enabled: true,
    category: 'lead',
    icon: '🆕',
  },
  {
    id: 'justdial_nurture',
    name: 'JustDial Lead Nurture',
    description: 'When a lead arrives from JustDial, send a 3-day drip sequence: Day 1 welcome, Day 2 testimonials, Day 3 offer',
    trigger: 'Lead source = JustDial',
    action: '3-day nurture sequence (automated)',
    enabled: true,
    category: 'lead',
    icon: '📲',
  },
  {
    id: 'unanswered_followup',
    name: 'Unanswered Lead Follow-up',
    description: "If a lead doesn't reply within 24 hours, send a follow-up with a limited-time offer",
    trigger: 'Lead no reply for 24 hours',
    action: 'Send follow-up + special offer',
    enabled: true,
    category: 'lead',
    icon: '👋',
  },
  {
    id: 'visa_reminder',
    name: 'Visa & Documents Reminder',
    description: 'For international trips, send a visa checklist and document reminder 30 days before departure',
    trigger: '30 days before international trip',
    action: 'Send visa checklist + document reminder',
    enabled: true,
    category: 'trip',
    icon: '🛂',
  },
  {
    id: 'balance_due_7d',
    name: 'Balance Due Alert — 7 Days',
    description: 'If full payment has not been received 7 days before the trip, send a polite final reminder',
    trigger: 'Trip starts in 7 days, balance unpaid',
    action: 'Send final balance reminder + payment link',
    enabled: true,
    category: 'payment',
    icon: '💳',
  },
  {
    id: 'bon_voyage',
    name: 'Bon Voyage Message',
    description: 'On the morning of trip departure, send a personalised good-wishes message with emergency contacts',
    trigger: 'Trip start day at 6:00 AM',
    action: 'Send bon voyage + emergency contacts',
    enabled: true,
    category: 'booking',
    icon: '✈️',
  },
  {
    id: 'welcome_home',
    name: 'Welcome Home Message',
    description: 'A few hours after the trip ends, send a warm welcome-home message and invite clients to share photos',
    trigger: '3 hours after trip end',
    action: 'Send welcome home + photo sharing request',
    enabled: true,
    category: 'trip',
    icon: '🏠',
  },
  {
    id: 'referral_ask',
    name: 'Referral Incentive',
    description: 'When a client leaves a 4+ star review, automatically send a referral offer with ₹500 cashback on their next booking',
    trigger: 'Client leaves 4+ star review',
    action: 'Send referral offer + cashback voucher',
    enabled: true,
    category: 'lead',
    icon: '🎁',
  },
  {
    id: 'anniversary_offer',
    name: 'Client Anniversary Offer',
    description: "On the anniversary of a client's first booking, send a personalised 10% loyalty discount for their next trip",
    trigger: '1-year anniversary of first booking',
    action: 'Send anniversary greeting + 10% loyalty discount',
    enabled: true,
    category: 'booking',
    icon: '🎂',
  },
  {
    id: 'weather_alert',
    name: 'Destination Weather Alert',
    description: 'If severe weather is forecast at the destination 48 hours before the trip, auto-alert the client with safety tips',
    trigger: 'Severe weather forecast 48h before trip',
    action: 'Send weather alert + safety tips + helpline',
    enabled: true,
    category: 'trip',
    icon: '🌦️',
  },
  {
    id: 'group_daily_update',
    name: 'Group Tour Daily Update',
    description: 'For active group tours, broadcast an automated daily update at 8 PM with the next-day schedule to all group members',
    trigger: 'Daily at 8:00 PM during active group tour',
    action: "Broadcast next-day schedule to all group members",
    enabled: true,
    category: 'trip',
    icon: '👥',
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
  isToggling,
}: {
  rule: AutomationRule;
  onToggle: (id: string) => void;
  onView: (rule: AutomationRule) => void;
  isToggling?: boolean;
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
            disabled={isToggling}
            className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              rule.enabled ? 'bg-[#25D366]' : 'bg-slate-700'
            }`}
          >
            {isToggling ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              </div>
            ) : (
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  rule.enabled ? 'left-6' : 'left-1'
                }`}
              />
            )}
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
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filterCategory, setFilterCategory] = useState<AutomationRule['category'] | 'all'>('all');
  const [viewRule, setViewRule] = useState<AutomationRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/admin/automation/rules');
        const data = await res.json() as ApiResponse;

        if (!res.ok || data.error) {
          throw new Error(data.error ?? 'Failed to fetch automation rules');
        }

        // Map API rules to UI format
        const mappedRules: AutomationRule[] = data.data.rules.map((rule) => ({
          id: rule.id || rule.rule_type,
          rule_type: rule.rule_type,
          name: rule.template?.name || 'Untitled Rule',
          description: rule.template?.description || '',
          trigger: getTriggerDescription(rule.rule_type),
          action: getActionDescription(rule.rule_type),
          enabled: rule.enabled,
          category: mapApiCategory(rule.template?.category || 'operations'),
          icon: getRuleIcon(rule.rule_type),
          lastTriggered: undefined,
          triggerCount: undefined,
          timeSaved: undefined,
        }));

        setRules(mappedRules.length > 0 ? mappedRules : FALLBACK_RULES);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rules');
        setRules(FALLBACK_RULES);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  async function handleToggle(id: string) {
    const rule = rules.find((r) => r.id === id);
    if (!rule || !rule.rule_type) return;

    try {
      setToggling(id);
      const newEnabledState = !rule.enabled;

      const res = await authedFetch('/api/admin/automation/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_type: rule.rule_type,
          enabled: newEnabledState,
        }),
      });

      const data = await res.json() as { success: boolean; data?: { message?: string } };

      if (!res.ok || !data.success) {
        throw new Error(data.data?.message || 'Failed to toggle rule');
      }

      // Optimistically update UI
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: newEnabledState } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle rule');
    } finally {
      setToggling(null);
    }
  }

  const enabledCount = rules.filter((r) => r.enabled).length;
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
      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-[#25D366] animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading automation rules...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">Error loading rules</p>
            <p className="text-xs text-red-400/80 mt-1">{error}</p>
          </div>
          <button
            onClick={() => void fetchRules()}
            className="text-xs text-red-400 hover:text-red-300 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main content */}
      {!loading && (
        <>
          {/* Stats bar */}
          <div className="shrink-0 p-4 border-b border-white/10">
            <div className="rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 p-3 text-center">
              <p className="text-2xl font-black text-[#25D366]">{enabledCount}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Active Rules</p>
            </div>
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
              isToggling={toggling === rule.id}
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
                  onClick={() => { void handleToggle(viewRule.id); setViewRule(null); }}
                  disabled={toggling === viewRule.id}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    viewRule.enabled
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30'
                  }`}
                >
                  {toggling === viewRule.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : viewRule.enabled ? (
                    <><Pause className="w-4 h-4" /> Pause Rule</>
                  ) : (
                    <><Play className="w-4 h-4" /> Enable Rule</>
                  )}
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
        </>
      )}
    </div>
  );
}
