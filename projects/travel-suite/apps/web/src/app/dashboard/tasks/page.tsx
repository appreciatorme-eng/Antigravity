"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, PartyPopper, CheckCircle } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import {
  useDashboardTasks,
  useDismissTask,
  type TaskItem,
} from "@/lib/queries/dashboard-tasks";
import {
  type Priority,
  type Tab,
  PRIORITY_ORDER,
  PRIORITY_GROUP_LABELS,
} from "./task-board-types";
import { SkeletonCard, ActiveTaskCard, CompletedTaskCard } from "./TaskCards";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AllTasksPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const { data, isLoading } = useDashboardTasks();
  const dismissMutation = useDismissTask();

  const tasks = data?.tasks ?? [];
  const completedTasks = data?.completedTasks ?? [];

  const groupedTasks = PRIORITY_ORDER.reduce<Record<Priority, TaskItem[]>>(
    (acc, priority) => ({
      ...acc,
      [priority]: tasks.filter((t) => t.priority === priority),
    }),
    { high: [], medium: [], info: [] },
  );

  const handleDismiss = useCallback(
    (task: TaskItem) => {
      dismissMutation.mutate({
        taskId: task.id,
        taskType: task.type,
        entityId: task.entityId,
      });
    },
    [dismissMutation],
  );

  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedAction((prev) => (prev === taskId ? null : taskId));
  }, []);

  const handleCollapse = useCallback(() => {
    setExpandedAction(null);
  }, []);

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
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  "ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full",
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500",
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
          <EmptyActiveState />
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
                            isExpanded={expandedAction === task.id}
                            onToggleExpand={() => handleToggleExpand(task.id)}
                            onCollapse={handleCollapse}
                            onDismiss={() => handleDismiss(task)}
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
        <EmptyCompletedState />
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

// ---------------------------------------------------------------------------
// Empty states (co-located, under 60 lines each)
// ---------------------------------------------------------------------------

function EmptyActiveState() {
  return (
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
  );
}

function EmptyCompletedState() {
  return (
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
  );
}
