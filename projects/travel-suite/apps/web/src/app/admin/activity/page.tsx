'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Map, FileText, User, CheckCircle, Send, Truck,
  AlertTriangle, BarChart2, Download, MessageCircle, Star,
  Copy, RefreshCw, Users, Package, Search, Filter, Clock,
  ArrowRight, TrendingUp, IndianRupee,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType = 'trip' | 'payment' | 'client' | 'proposal' | 'team' | 'system'

interface Activity {
  id: string
  type: ActivityType
  iconName: string
  color: string
  user: string
  action: string
  detail: string
  time: string
  tripRef?: string
  amount?: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ACTIVITIES: Activity[] = [
  // Today
  { id: '1',  type: 'payment',  iconName: 'CreditCard',    color: 'text-green-400',   user: 'Priya Nair',   action: 'Payment received',      detail: '₹45,000 from Sharma family — Rajasthan 7N/8D',           time: '2 min ago',   tripRef: 'TR-2026-0142', amount: '₹45,000' },
  { id: '2',  type: 'trip',     iconName: 'Map',            color: 'text-blue-400',    user: 'Amit Kumar',   action: 'Trip created',           detail: 'Goa 5N/6D for Mehta group (8 pax)',                      time: '14 min ago',  tripRef: 'TR-2026-0143' },
  { id: '3',  type: 'proposal', iconName: 'FileText',       color: 'text-purple-400',  user: 'Priya Nair',   action: 'Proposal signed',        detail: 'Kerala Discovery package — signed by Mr. Pillai',        time: '1 hour ago',  tripRef: 'TR-2026-0138' },
  { id: '4',  type: 'client',   iconName: 'User',           color: 'text-amber-400',   user: 'Amit Kumar',   action: 'New client added',       detail: 'Ravi Kumar (+91 98765 43210) from JustDial lead',        time: '2 hours ago' },
  { id: '5',  type: 'trip',     iconName: 'CheckCircle',    color: 'text-green-400',   user: 'System',       action: 'Trip completed',         detail: 'Ladakh 8N/9D — Verma family returned. Review requested.',time: '3 hours ago', tripRef: 'TR-2026-0129' },
  { id: '6',  type: 'payment',  iconName: 'Send',           color: 'text-blue-400',    user: 'Priya Nair',   action: 'Invoice sent',           detail: 'GST Invoice INV-2026-0089 — ₹1,20,000 to Kapoor Group',  time: '4 hours ago', tripRef: 'TR-2026-0136', amount: '₹1,20,000' },
  { id: '7',  type: 'trip',     iconName: 'Truck',          color: 'text-cyan-400',    user: 'System',       action: 'Driver assigned',        detail: 'Suresh bhai → Sharma family airport pickup 6 AM',        time: '5 hours ago', tripRef: 'TR-2026-0142' },
  { id: '8',  type: 'proposal', iconName: 'FileText',       color: 'text-indigo-400',  user: 'Rajesh Sharma','action': 'Proposal created',     detail: 'Rajasthan Royals 6N/7D — ₹85,000 for Gupta family',     time: '6 hours ago', tripRef: 'TR-2026-0144' },
  // Yesterday
  { id: '9',  type: 'payment',  iconName: 'AlertTriangle',  color: 'text-amber-400',   user: 'System',       action: 'Payment reminder sent',  detail: 'Advance pending — ₹30,000 from Kumar ji (Goa trip)',     time: 'Yesterday 6 PM', tripRef: 'TR-2026-0140' },
  { id: '10', type: 'client',   iconName: 'MessageCircle',  color: 'text-green-400',   user: 'System',       action: 'Client portal accessed', detail: 'Mehta family viewed itinerary + downloaded PDF',         time: 'Yesterday 4 PM', tripRef: 'TR-2026-0143' },
  { id: '11', type: 'trip',     iconName: 'Copy',           color: 'text-violet-400',  user: 'Amit Kumar',   action: 'Template cloned',        detail: 'Kerala Backwaters 5N/6D → customised for Nair group',    time: 'Yesterday 2 PM', tripRef: 'TR-2026-0141' },
  { id: '12', type: 'system',   iconName: 'Download',       color: 'text-slate-400',   user: 'Rajesh Sharma','action': 'GST report downloaded', detail: 'January 2026 GSTR-1 summary exported to CSV',           time: 'Yesterday 11 AM' },
  { id: '13', type: 'team',     iconName: 'Users',          color: 'text-pink-400',    user: 'Rajesh Sharma','action': 'Team invite sent',      detail: 'Meena Singh invited as Sales Agent',                     time: 'Yesterday 10 AM' },
  { id: '14', type: 'system',   iconName: 'TrendingUp',     color: 'text-green-400',   user: 'Rajesh Sharma','action': 'Billing upgraded',      detail: 'Upgraded from Pro to Business plan (₹10,999/mo)',        time: 'Yesterday 9 AM' },
  // This week
  { id: '15', type: 'client',   iconName: 'Star',           color: 'text-yellow-400',  user: 'System',       action: 'Review received',        detail: '⭐⭐⭐⭐⭐ from Verma family — "Excellent service!"',         time: '2 days ago',  tripRef: 'TR-2026-0129' },
  { id: '16', type: 'trip',     iconName: 'Package',        color: 'text-orange-400',  user: 'Priya Nair',   action: 'Itinerary shared',       detail: 'Andaman 6N/7D itinerary shared via WhatsApp to 4 contacts', time: '2 days ago', tripRef: 'TR-2026-0135' },
  { id: '17', type: 'trip',     iconName: 'RefreshCw',      color: 'text-blue-400',    user: 'Amit Kumar',   action: 'Trip cloned',            detail: 'TR-2026-0120 (Golden Triangle) → TR-2026-0143',          time: '3 days ago',  tripRef: 'TR-2026-0143' },
  { id: '18', type: 'system',   iconName: 'MessageCircle',  color: 'text-green-400',   user: 'Priya Nair',   action: 'Broadcast sent',         detail: 'Diwali offer sent to 127 clients via WhatsApp',          time: '3 days ago' },
  { id: '19', type: 'trip',     iconName: 'AlertTriangle',  color: 'text-red-400',     user: 'System',       action: 'Conflict resolved',      detail: 'Itinerary conflict fixed — Day 3 activity overlap for Spiti trip', time: '4 days ago', tripRef: 'TR-2026-0137' },
  { id: '20', type: 'payment',  iconName: 'CreditCard',     color: 'text-green-400',   user: 'System',       action: 'Payment received',       detail: '₹75,000 final payment — Kapoor Group Kashmir tour',      time: '5 days ago',  tripRef: 'TR-2026-0130', amount: '₹75,000' },
]

const ICON_MAP: Record<string, React.ElementType> = {
  CreditCard, Map, FileText, User, CheckCircle, Send, Truck,
  AlertTriangle, BarChart2, Download, MessageCircle, Star,
  Copy, RefreshCw, Users, Package, Search, TrendingUp,
}

const TYPE_FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'trip',     label: 'Trips' },
  { id: 'payment',  label: 'Payments' },
  { id: 'client',   label: 'Clients' },
  { id: 'proposal', label: 'Proposals' },
  { id: 'team',     label: 'Team' },
] as const

const DATE_FILTERS = [
  { id: 'today',   label: 'Today' },
  { id: 'week',    label: 'Last 7 days' },
  { id: 'month',   label: 'Last 30 days' },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('week')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(10)

  const filtered = useMemo(() => {
    return MOCK_ACTIVITIES.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !a.action.toLowerCase().includes(q) &&
          !a.detail.toLowerCase().includes(q) &&
          !a.user.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [typeFilter, search])

  const visible = filtered.slice(0, visibleCount)

  const stats = [
    { label: 'Actions Today',      value: '12',    icon: Clock,        color: 'text-blue-400',   bg: 'bg-blue-400/10' },
    { label: 'Payments This Week', value: '₹3.2L', icon: IndianRupee,  color: 'text-green-400',  bg: 'bg-green-400/10' },
    { label: 'New Clients',        value: '8',     icon: User,         color: 'text-amber-400',  bg: 'bg-amber-400/10' },
    { label: 'Active Trips',       value: '23',    icon: Map,          color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ]

  return (
    <div className="min-h-screen bg-[#0a1628] p-6 text-white">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold">Activity Log</h1>
          <p className="text-white/50 mt-1 text-sm">
            Complete audit trail of all actions in your workspace
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search activities..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(10) }}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00d084]/50"
            />
          </div>

          {/* Type filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-white/30 shrink-0" />
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => { setTypeFilter(f.id); setVisibleCount(10) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  typeFilter === f.id
                    ? 'bg-[#00d084] text-black'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-white/20 mx-1">|</span>
            {DATE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  dateFilter === f.id
                    ? 'bg-white/15 text-white'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity list */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {visible.length === 0 ? (
            <div className="p-12 text-center text-white/30 text-sm">
              No activities match your filters
            </div>
          ) : (
            <AnimatePresence>
              {visible.map((activity, i) => {
                const Icon = ICON_MAP[activity.iconName] ?? ArrowRight
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-white/40 text-xs">{activity.user}</span>
                        <span className="text-white text-sm font-medium">{activity.action}</span>
                        {activity.amount && (
                          <span className="text-green-400 text-xs font-semibold">{activity.amount}</span>
                        )}
                      </div>
                      <p className="text-white/50 text-xs mt-0.5 truncate">{activity.detail}</p>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 shrink-0">
                      {activity.tripRef && (
                        <span className="bg-white/5 border border-white/10 text-white/40 text-xs px-2 py-0.5 rounded-lg">
                          {activity.tripRef}
                        </span>
                      )}
                      <span className="text-white/30 text-xs">{activity.time}</span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}

          {/* Load more */}
          {filtered.length > visibleCount && (
            <div className="p-4 text-center border-t border-white/5">
              <button
                onClick={() => setVisibleCount((n) => n + 10)}
                className="text-[#00d084] text-sm hover:underline"
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
