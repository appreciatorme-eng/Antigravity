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
  PartyPopper,
  ArrowLeft,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import {
  useDashboardTasks,
  useDismissTask,
  type TaskItem,
} from "@/lib/queries/dashboard-tasks";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Priority = "high" | "medium" | "info";
type Tab = "active" | "completed";

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
};

const PRIORITY_GROUP_LABELS: Record<Priority, string> = {
  high: "Urgent",
  medium: "Needs Attention",
  info: "Informational",
};

const PRIORITY_ORDER: Priority[] = ["high", "medium", "info"];

const TYPE_ICONS: Record<string, React.ElementType> = {
  driver_unassigned: Car,
  payment_overdue: IndianRupee,
  quote_awaiting: FileText,
  new_whatsapp_lead: MessageCircle,
  pickup_today: Plane,
  verification_pending: ShieldCheck,
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border-l-4 border-l-slate-200 dark:border-l-slate-700 bg-slate-50 dark:bg-slate-800/30 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
      </div>
      <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task Card (Active)
// ---------------------------------------------------------------------------

function ActiveTaskCard({
  task,
  index,
  onDismiss,
}: {
  task: TaskItem;
  index: number;
  onDismiss: (id: string) => void;
}) {
  const config = PRIORITY_CONFIG[task.priority];
  const PriorityIcon = config.icon;
  const TypeIcon = TYPE_ICONS[task.type] ?? FileText;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
      transition={{
        layout: { duration: 0.3 },
        opacity: { duration: 0.25 },
        x: { duration: 0.25, delay: index * 0.03 },
      }}
    >
      <div
        className={cn(
          "rounded-xl border-l-4 transition-all",
          config.border,
          config.bg,
          "border border-white/5 hover:border-white/10"
        )}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Type Icon */}
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
              config.badge
            )}
          >
            <TypeIcon className="w-[18px] h-[18px]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <PriorityIcon className={cn("w-3.5 h-3.5 shrink-0", config.iconColor)} />
              <span
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                  config.badge
                )}
              >
                {PRIORITY_GROUP_LABELS[task.priority]}
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

          {/* Mark Done */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onDismiss(task.id)}
            title="Mark as done"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-400 transition-all shrink-0"
          >
            <CheckCircle className="w-4.5 h-4.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Task Card (Completed)
// ---------------------------------------------------------------------------

function CompletedTaskCard({ task, index }: { task: TaskItem; index: number }) {
  const TypeIcon = TYPE_ICONS[task.type] ?? FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <div className="rounded-xl border-l-4 border-l-emerald-500 bg-emerald-500/5 border border-white/5">
        <div className="flex items-start gap-3 p-4 opacity-70">
          {/* Type Icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-emerald-500/10 text-emerald-500">
            <TypeIcon className="w-[18px] h-[18px]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                Completed
              </span>
              {task.timestamp && (
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  {task.timestamp}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug line-through decoration-emerald-500/30">
              {task.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AllTasksPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const { data, isLoading } = useDashboardTasks();
  const dismissTask = useDismissTask();

  const tasks = data?.tasks ?? [];
  const completedTasks = data?.completedTasks ?? [];

  const groupedTasks = PRIORITY_ORDER.reduce<Record<Priority, TaskItem[]>>(
    (acc, priority) => ({
      ...acc,
      [priority]: tasks.filter((t) => t.priority === priority),
    }),
    { high: [], medium: [], info: [] }
  );

  const handleDismiss = (taskId: string) => {
    dismissTask.mutate(taskId);
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: tasks.length },
    { key: "completed", label: "Completed", count: completedTasks.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          All Tasks
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Manage your attention items
        </p>
      </motion.div>

      {/* Tab Bar */}
      <div className="flex gap-6 border-b border-white/10 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "text-sm font-bold pb-3 transition-all relative",
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  "ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full",
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <GlassCard padding="lg">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </GlassCard>
      ) : activeTab === "active" ? (
        tasks.length === 0 ? (
          <GlassCard padding="none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <PartyPopper className="w-7 h-7 text-emerald-500" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                You&apos;re on top of all your tasks!
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Nothing needs attention right now.
              </p>
            </motion.div>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {PRIORITY_ORDER.map((priority) => {
              const group = groupedTasks[priority];
              if (group.length === 0) return null;

              return (
                <motion.div
                  key={priority}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 px-1">
                    {PRIORITY_GROUP_LABELS[priority]}
                  </h3>
                  <GlassCard padding="lg">
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {group.map((task, index) => (
                          <ActiveTaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onDismiss={handleDismiss}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )
      ) : completedTasks.length === 0 ? (
        <GlassCard padding="none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
              No completed tasks yet today
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Tasks you mark as done will appear here.
            </p>
          </motion.div>
        </GlassCard>
      ) : (
        <GlassCard padding="lg">
          <div className="space-y-3">
            {completedTasks.map((task, index) => (
              <CompletedTaskCard key={task.id} task={task} index={index} />
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
