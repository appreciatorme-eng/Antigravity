"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Car,
  IndianRupee,
  FileText,
  MessageCircle,
  Plane,
  ShieldCheck,
  ChevronRight,
  PartyPopper,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";

type Priority = "high" | "medium" | "info" | "done";
type ActionType =
  | "driver_unassigned"
  | "payment_overdue"
  | "quote_awaiting"
  | "new_whatsapp_lead"
  | "pickup_today"
  | "verification_pending";

interface ActionItem {
  id: string;
  priority: Priority;
  type: ActionType;
  description: string;
  count?: number;
  actionLabel: string;
  actionHref: string;
  timestamp?: string;
}

const INITIAL_ACTIONS: ActionItem[] = [
  {
    id: "1",
    priority: "high",
    type: "driver_unassigned",
    description: "3 trips tomorrow still need driver assignment",
    count: 3,
    actionLabel: "Assign Now",
    actionHref: "/drivers",
    timestamp: "Trips depart 26 Feb",
  },
  {
    id: "2",
    priority: "high",
    type: "payment_overdue",
    description: "₹45,000 payment overdue from Sharma family — Rajasthan trip",
    actionLabel: "Send Reminder",
    actionHref: "/admin/billing",
    timestamp: "Overdue by 5 days",
  },
  {
    id: "3",
    priority: "medium",
    type: "new_whatsapp_lead",
    description: "2 new WhatsApp leads from JustDial — reply within 1 hour",
    count: 2,
    actionLabel: "View Leads",
    actionHref: "/inbox",
    timestamp: "Just now",
  },
  {
    id: "4",
    priority: "medium",
    type: "quote_awaiting",
    description: "Mehta family quote sent 48 hours ago — no reply received yet",
    actionLabel: "Follow Up",
    actionHref: "/proposals",
    timestamp: "Sent 2 days ago",
  },
  {
    id: "5",
    priority: "info",
    type: "pickup_today",
    description: "5 airport pickups scheduled today at IGI Airport, New Delhi",
    count: 5,
    actionLabel: "View Schedule",
    actionHref: "/trips",
    timestamp: "First at 6:30 AM IST",
  },
  {
    id: "6",
    priority: "info",
    type: "verification_pending",
    description: "Driver Suresh Kumar's documents expire in 3 days — renewal pending",
    actionLabel: "Review Docs",
    actionHref: "/drivers",
    timestamp: "Expires 1 Mar",
  },
];

const TYPE_ICONS: Record<ActionType, React.ElementType> = {
  driver_unassigned: Car,
  payment_overdue: IndianRupee,
  quote_awaiting: FileText,
  new_whatsapp_lead: MessageCircle,
  pickup_today: Plane,
  verification_pending: ShieldCheck,
};

const PRIORITY_CONFIG: Record<
  Priority,
  { border: string; bg: string; badge: string; icon: React.ElementType; iconColor: string }
> = {
  high: {
    border: "border-l-red-500",
    bg: "bg-red-500/5",
    badge: "bg-red-500/10 text-red-500",
    icon: AlertCircle,
    iconColor: "text-red-500",
  },
  medium: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    badge: "bg-amber-500/10 text-amber-500",
    icon: Clock,
    iconColor: "text-amber-500",
  },
  info: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/5",
    badge: "bg-blue-500/10 text-blue-500",
    icon: Clock,
    iconColor: "text-blue-400",
  },
  done: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/10 text-emerald-500",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
  },
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Urgent",
  medium: "Attention",
  info: "Info",
  done: "Done",
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border-l-4 border-l-slate-200 dark:border-l-slate-700 bg-slate-50 dark:bg-slate-800/30 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
      </div>
      <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0" />
    </div>
  );
}

interface ActionQueueProps {
  loading?: boolean;
}

export function ActionQueue({ loading = false }: ActionQueueProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = INITIAL_ACTIONS.filter((a) => !dismissed.has(a.id));
  const highCount = visible.filter((a) => a.priority === "high").length;

  const handleMarkDone = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Needs Your Attention
          </h3>
          {!loading && highCount > 0 && (
            <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-[10px] font-black text-white animate-pulse">
              {highCount}
            </span>
          )}
        </div>
        <Link
          href="/trips"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-colors"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Content */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center justify-center py-14 px-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <PartyPopper className="w-7 h-7 text-emerald-500" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                All clear! No actions needed
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Everything is running smoothly. Check back after new bookings come in.
              </p>
            </motion.div>
          ) : (
            <div className="p-4 space-y-3">
              <AnimatePresence initial={false}>
                {visible.map((item, index) => {
                  const config = PRIORITY_CONFIG[item.priority];
                  const PriorityIcon = config.icon;
                  const TypeIcon = TYPE_ICONS[item.type];

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
                      transition={{
                        layout: { duration: 0.3 },
                        opacity: { duration: 0.25 },
                        x: { duration: 0.25, delay: index * 0.04 },
                      }}
                    >
                      <div
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-xl border-l-4 transition-all",
                          config.border,
                          config.bg,
                          "border border-white/5 hover:border-white/10"
                        )}
                      >
                        {/* Type Icon */}
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                            config.badge
                          )}
                        >
                          <TypeIcon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <PriorityIcon
                              className={cn("w-3.5 h-3.5 shrink-0", config.iconColor)}
                            />
                            <span
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                                config.badge
                              )}
                            >
                              {PRIORITY_LABELS[item.priority]}
                            </span>
                            {item.timestamp && (
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                {item.timestamp}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                            {item.description}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={item.actionHref}>
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.97 }}
                              className={cn(
                                "text-[11px] font-black px-3 py-1.5 rounded-lg transition-all",
                                item.priority === "high"
                                  ? "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/30"
                                  : item.priority === "medium"
                                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/30"
                                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                              )}
                            >
                              {item.actionLabel}
                            </motion.button>
                          </Link>
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleMarkDone(item.id)}
                            title="Mark as done"
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-400 transition-all"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
