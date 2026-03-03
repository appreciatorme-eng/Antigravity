"use client";

import { useState, useCallback, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  PartyPopper,
  User,
  Send,
  Loader2,
  Phone,
  Search,
  X,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import {
  useDashboardTasks,
  useDriverSearch,
  useDismissTask,
  type TaskItem,
} from "@/lib/queries/dashboard-tasks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Priority = "high" | "medium" | "info" | "done";
type ActionType =
  | "driver_unassigned"
  | "payment_overdue"
  | "quote_awaiting"
  | "new_whatsapp_lead"
  | "pickup_today"
  | "verification_pending";

type InlineAction =
  | "assign_driver"
  | "send_reminder"
  | "view_leads"
  | "follow_up"
  | "view_schedule"
  | "review_docs";

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

const TASK_ACTION_CONFIG: Record<string, { label: string; inlineAction: InlineAction }> = {
  driver_unassigned: { label: "Assign Now", inlineAction: "assign_driver" },
  payment_overdue: { label: "Send Reminder", inlineAction: "send_reminder" },
  new_whatsapp_lead: { label: "View Leads", inlineAction: "view_leads" },
  quote_awaiting: { label: "Follow Up", inlineAction: "follow_up" },
  pickup_today: { label: "View Schedule", inlineAction: "view_schedule" },
  verification_pending: { label: "Review Docs", inlineAction: "review_docs" },
};

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getActionConfig(taskType: string) {
  return TASK_ACTION_CONFIG[taskType] ?? { label: "View", inlineAction: "view_leads" as InlineAction };
}

function getInlineAction(taskType: string): InlineAction {
  return getActionConfig(taskType).inlineAction;
}

function getTypeIcon(taskType: string): React.ElementType {
  return TYPE_ICONS[taskType as ActionType] ?? FileText;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ---------------------------------------------------------------------------
// Inline Panel: Assign Driver (with search)
// ---------------------------------------------------------------------------

function AssignDriverPanel({
  taskId,
  onDismiss,
  onCollapse,
}: {
  taskId: string;
  onDismiss: (id: string) => void;
  onCollapse: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const { data: drivers, isLoading: isSearching } = useDriverSearch(debouncedQuery);
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null);

  const handleAssign = useCallback(
    (driverId: string) => {
      setAssigningDriverId(driverId);
      // Brief "Assigning..." state, then auto-dismiss
      setTimeout(() => {
        setAssigningDriverId(null);
        onCollapse();
        onDismiss(taskId);
      }, 800);
    },
    [taskId, onDismiss, onCollapse],
  );

  return (
    <div className="px-4 pb-4 pt-1 border-t border-white/5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
        Pick a driver to assign
      </p>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search drivers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results */}
      <div className="max-h-60 overflow-y-auto space-y-2">
        {isSearching ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : drivers && drivers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {drivers.map((driver) => (
              <motion.button
                key={driver.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={assigningDriverId !== null}
                onClick={() => handleAssign(driver.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  assigningDriverId === driver.id
                    ? "border-primary/40 bg-primary/5"
                    : "border-white/10 bg-white/3 hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {assigningDriverId === driver.id ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {driver.fullName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {driver.vehicleType ?? "No vehicle"}
                    {driver.vehiclePlate ? ` · ${driver.vehiclePlate}` : ""}
                    {" · "}
                    {driver.todayTripCount === 0
                      ? "Free today"
                      : `${driver.todayTripCount} trip${driver.todayTripCount > 1 ? "s" : ""} today`}
                  </p>
                </div>
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">No drivers found</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Panel: Send Reminder
// ---------------------------------------------------------------------------

function SendReminderPanel({
  task,
  onDismiss,
  onCollapse,
}: {
  task: TaskItem;
  onDismiss: (id: string) => void;
  onCollapse: () => void;
}) {
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(() => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onCollapse();
      onDismiss(task.id);
    }, 1200);
  }, [task.id, onDismiss, onCollapse]);

  return (
    <div className="px-4 pb-4 pt-1 border-t border-white/5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
        Send payment reminder
      </p>
      <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-white">
            WhatsApp Reminder
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{task.description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={sending}
          onClick={handleSend}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-[11px] font-black transition-all shadow-sm shadow-[#25D366]/30 disabled:opacity-60"
        >
          {sending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Send via WhatsApp
            </>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCollapse}
          className="px-4 py-2 rounded-lg border border-white/10 text-slate-500 text-[11px] font-bold hover:bg-white/5 transition-all"
        >
          Cancel
        </motion.button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Panel: View Leads
// ---------------------------------------------------------------------------

function ViewLeadsPanel({
  task,
  onCollapse,
}: {
  task: TaskItem;
  onCollapse: () => void;
}) {
  return (
    <div className="px-4 pb-4 pt-1 border-t border-white/5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
        New WhatsApp leads need your response
      </p>
      {Object.keys(task.entityData).length > 0 && (
        <div className="p-3 rounded-xl border border-white/10 bg-white/3 mb-3">
          <div className="space-y-1">
            {Object.entries(task.entityData).map(([key, value]) => (
              <p key={key} className="text-[10px] text-slate-500">
                <span className="font-bold capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                {String(value)}
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Link href="/inbox">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-[11px] font-black transition-all shadow-sm shadow-[#25D366]/30"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in WhatsApp
          </motion.button>
        </Link>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCollapse}
          className="px-4 py-2 rounded-lg border border-white/10 text-slate-500 text-[11px] font-bold hover:bg-white/5 transition-all"
        >
          Close
        </motion.button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Panel: Follow Up
// ---------------------------------------------------------------------------

function FollowUpPanel({
  task,
  onCollapse,
}: {
  task: TaskItem;
  onCollapse: () => void;
}) {
  const clientName = task.entityData.clientName as string | undefined;
  const destination = task.entityData.destination as string | undefined;
  const sentAt = task.entityData.sentAt as string | undefined;

  return (
    <div className="px-4 pb-4 pt-1 border-t border-white/5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
        Follow up on quote
      </p>
      <div className="p-3 rounded-xl border border-white/10 bg-white/3 mb-3 space-y-1">
        {clientName && (
          <p className="text-[10px] text-slate-500">
            <span className="font-bold">Client:</span> {clientName}
          </p>
        )}
        {destination && (
          <p className="text-[10px] text-slate-500">
            <span className="font-bold">Destination:</span> {destination}
          </p>
        )}
        {sentAt && (
          <p className="text-[10px] text-slate-500">
            <span className="font-bold">Sent:</span> {sentAt}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-[11px] font-black transition-all shadow-sm shadow-[#25D366]/30"
        >
          <Send className="w-3.5 h-3.5" />
          Send Follow-up via WhatsApp
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCollapse}
          className="px-4 py-2 rounded-lg border border-white/10 text-slate-500 text-[11px] font-bold hover:bg-white/5 transition-all"
        >
          Close
        </motion.button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Panel: View Schedule
// ---------------------------------------------------------------------------

function ViewSchedulePanel({
  task,
  onCollapse,
}: {
  task: TaskItem;
  onCollapse: () => void;
}) {
  const destination = task.entityData.destination as string | undefined;
  const clientName = task.entityData.clientName as string | undefined;

  return (
    <div className="px-4 pb-4 pt-1 border-t border-white/5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
        Trip starting today
      </p>
      <div className="p-3 rounded-xl border border-white/10 bg-white/3 mb-3 space-y-1">
        {destination && (
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="font-bold">Destination:</span> {destination}
          </p>
        )}
        {clientName && (
          <p className="text-[10px] text-slate-500">
            <span className="font-bold">Client:</span> {clientName}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Link href={`/trips/${task.entityId}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-black transition-all shadow-sm shadow-blue-500/30"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Trip Details
          </motion.button>
        </Link>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCollapse}
          className="px-4 py-2 rounded-lg border border-white/10 text-slate-500 text-[11px] font-bold hover:bg-white/5 transition-all"
        >
          Close
        </motion.button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Panel: Review Docs
// ---------------------------------------------------------------------------

function ReviewDocsPanel({
  task,
  onCollapse,
}: {
  task: TaskItem;
  onCollapse: () => void;
}) {
  return (
    <div className="px-4 pb-4 pt-1 border-t border-white/5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
        Document verification needed
      </p>
      {Object.keys(task.entityData).length > 0 && (
        <div className="p-3 rounded-xl border border-white/10 bg-white/3 mb-3 space-y-1">
          {Object.entries(task.entityData).map(([key, value]) => (
            <p key={key} className="text-[10px] text-slate-500">
              <span className="font-bold capitalize">{key.replace(/_/g, " ")}:</span>{" "}
              {String(value)}
            </p>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Link href="/drivers">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-black transition-all shadow-sm shadow-blue-500/30"
          >
            <User className="w-3.5 h-3.5" />
            View Driver Profile
          </motion.button>
        </Link>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCollapse}
          className="px-4 py-2 rounded-lg border border-white/10 text-slate-500 text-[11px] font-bold hover:bg-white/5 transition-all"
        >
          Close
        </motion.button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completed Tasks Section
// ---------------------------------------------------------------------------

function CompletedTasksSection({ tasks }: { tasks: TaskItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (tasks.length === 0) return null;

  const config = PRIORITY_CONFIG.done;

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-xs font-bold text-slate-500">
          Completed ({tasks.length})
        </span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-auto" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2">
              {tasks.map((task) => {
                const TypeIcon = getTypeIcon(task.type);
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "rounded-xl border-l-4 transition-all overflow-hidden",
                      config.border,
                      config.bg,
                      "border border-white/5 opacity-70",
                    )}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                          config.badge,
                        )}
                      >
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-snug line-through">
                          {task.description}
                        </p>
                      </div>
                      <CheckCircle className={cn("w-4 h-4 shrink-0", config.iconColor)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface ActionQueueProps {
  loading?: boolean;
}

export function ActionQueue({ loading: loadingProp = false }: ActionQueueProps) {
  const { data, isLoading: isQueryLoading } = useDashboardTasks();
  const dismissMutation = useDismissTask();

  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  const isLoading = loadingProp || isQueryLoading;
  const tasks = data?.tasks ?? [];
  const completedTasks = data?.completedTasks ?? [];
  const highCount = tasks.filter((t) => t.priority === "high").length;

  const handleMarkDone = useCallback(
    (taskId: string) => {
      dismissMutation.mutate(taskId);
    },
    [dismissMutation],
  );

  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedAction((prev) => (prev === taskId ? null : taskId));
  }, []);

  const handleCollapse = useCallback(() => {
    setExpandedAction(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Needs Your Attention
          </h3>
          {!isLoading && highCount > 0 && (
            <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-[10px] font-black text-white animate-pulse">
              {highCount}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/tasks"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-colors"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Content */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="divide-y divide-white/5">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : tasks.length === 0 ? (
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
                You&apos;re on top of everything!
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                All tasks completed for today. Great work!
              </p>
            </motion.div>
          ) : (
            <div className="p-4 space-y-3">
              <AnimatePresence initial={false}>
                {tasks.map((task, index) => {
                  const config = PRIORITY_CONFIG[task.priority as Priority] ?? PRIORITY_CONFIG.info;
                  const PriorityIcon = config.icon;
                  const TypeIcon = getTypeIcon(task.type);
                  const actionConfig = getActionConfig(task.type);
                  const isExpanded = expandedAction === task.id;
                  const currentInlineAction = getInlineAction(task.type);

                  return (
                    <motion.div
                      key={task.id}
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
                          "rounded-xl border-l-4 transition-all overflow-hidden",
                          config.border,
                          config.bg,
                          "border border-white/5 hover:border-white/10",
                        )}
                      >
                        <div className="flex items-start gap-3 p-4">
                          {/* Type Icon */}
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                              config.badge,
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
                                  config.badge,
                                )}
                              >
                                {PRIORITY_LABELS[task.priority as Priority] ?? "Info"}
                              </span>
                              {task.timestamp && (
                                <span className="text-[10px] text-slate-400 font-medium truncate">
                                  {task.timestamp}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                              {task.description}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleToggleExpand(task.id)}
                              className={cn(
                                "text-[11px] font-black px-3 py-1.5 rounded-lg transition-all",
                                task.priority === "high"
                                  ? "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/30"
                                  : task.priority === "medium"
                                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/30"
                                    : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/30",
                              )}
                            >
                              {actionConfig.label}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => handleMarkDone(task.id)}
                              title="Mark as done"
                              className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-400 transition-all"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Inline Panels */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="overflow-hidden"
                            >
                              {currentInlineAction === "assign_driver" && (
                                <AssignDriverPanel
                                  taskId={task.id}
                                  onDismiss={handleMarkDone}
                                  onCollapse={handleCollapse}
                                />
                              )}
                              {currentInlineAction === "send_reminder" && (
                                <SendReminderPanel
                                  task={task}
                                  onDismiss={handleMarkDone}
                                  onCollapse={handleCollapse}
                                />
                              )}
                              {currentInlineAction === "view_leads" && (
                                <ViewLeadsPanel task={task} onCollapse={handleCollapse} />
                              )}
                              {currentInlineAction === "follow_up" && (
                                <FollowUpPanel task={task} onCollapse={handleCollapse} />
                              )}
                              {currentInlineAction === "view_schedule" && (
                                <ViewSchedulePanel task={task} onCollapse={handleCollapse} />
                              )}
                              {currentInlineAction === "review_docs" && (
                                <ReviewDocsPanel task={task} onCollapse={handleCollapse} />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Completed Tasks */}
              <CompletedTasksSection tasks={completedTasks} />
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
