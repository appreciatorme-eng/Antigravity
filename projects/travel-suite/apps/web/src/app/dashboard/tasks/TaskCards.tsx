"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/lib/queries/dashboard-tasks";
import {
  type Priority,
  PRIORITY_CONFIG,
  PRIORITY_GROUP_LABELS,
  TYPE_ICONS,
  getActionConfig,
  getInlineAction,
} from "./task-board-types";
import { InlineActionPanel } from "./TaskActionPanels";

// ---------------------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------------------

function TypeIconForTask({
  taskType,
  className,
}: {
  taskType: string;
  className?: string;
}) {
  const Icon = TYPE_ICONS[taskType] ?? FileText;
  return <Icon className={className} />;
}

function PriorityIconForTask({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const Icon = PRIORITY_CONFIG[priority]?.icon ?? Clock;
  return <Icon className={className} />;
}

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------

export function SkeletonCard() {
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
// Active Task Card
// ---------------------------------------------------------------------------

export interface ActiveTaskCardProps {
  task: TaskItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCollapse: () => void;
  onDismiss: () => void;
}

export function ActiveTaskCard({
  task,
  index,
  isExpanded,
  onToggleExpand,
  onCollapse,
  onDismiss,
}: ActiveTaskCardProps) {
  const config = PRIORITY_CONFIG[task.priority];
  const actionConfig = getActionConfig(task.type);
  const currentInlineAction = getInlineAction(task.type);

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
            <TypeIconForTask
              taskType={task.type}
              className="w-[18px] h-[18px]"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <PriorityIconForTask
                priority={task.priority}
                className={cn("w-3.5 h-3.5 shrink-0", config.iconColor)}
              />
              <span
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                  config.badge,
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

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onToggleExpand}
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
              onClick={onDismiss}
              title="Mark as done"
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-400 transition-all shrink-0"
            >
              <CheckCircle className="w-4.5 h-4.5" />
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
              <InlineActionPanel
                action={currentInlineAction}
                task={task}
                onDismiss={onDismiss}
                onCollapse={onCollapse}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Completed Task Card
// ---------------------------------------------------------------------------

export interface CompletedTaskCardProps {
  task: TaskItem;
  index: number;
}

export function CompletedTaskCard({ task, index }: CompletedTaskCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <div className="rounded-xl border-l-4 border-l-emerald-500 bg-emerald-500/5 border border-white/5">
        <div className="flex items-start gap-3 p-4 opacity-70">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-emerald-500/10 text-emerald-500">
            <TypeIconForTask
              taskType={task.type}
              className="w-[18px] h-[18px]"
            />
          </div>
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
