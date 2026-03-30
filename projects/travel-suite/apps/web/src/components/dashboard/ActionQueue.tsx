"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ChevronRight, ChevronDown, ChevronUp, PartyPopper } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import {
  useDashboardTasks,
  useDismissTask,
  type TaskItem,
} from "@/lib/queries/dashboard-tasks";
import { PRIORITY_CONFIG, getTypeIcon } from "@/components/dashboard/action-queue-types";
import { TaskRow } from "@/components/dashboard/TaskRow";

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

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Needs Your Attention
          </h2>
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
                {tasks.map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    index={index}
                    isExpanded={expandedAction === task.id}
                    onToggleExpand={handleToggleExpand}
                    onMarkDone={handleMarkDone}
                    onCollapse={handleCollapse}
                  />
                ))}
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
