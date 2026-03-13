"use client";

import { createElement, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/lib/queries/dashboard-tasks";
import {
  type Priority,
  PRIORITY_CONFIG,
  PRIORITY_LABELS,
  getActionConfig,
  getInlineAction,
  getTypeIcon,
} from "@/components/dashboard/action-queue-types";
import { InlineActionPanel } from "@/components/dashboard/InlineActionPanel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TaskRowProps {
  task: TaskItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: (taskId: string) => void;
  onMarkDone: (task: TaskItem) => void;
  onCollapse: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TaskRow = memo(function TaskRow({
  task,
  index,
  isExpanded,
  onToggleExpand,
  onMarkDone,
  onCollapse,
}: TaskRowProps) {
  const config = PRIORITY_CONFIG[task.priority as Priority] ?? PRIORITY_CONFIG.info;
  const PriorityIcon = config.icon;
  const typeIconElement = createElement(getTypeIcon(task.type), {
    className: "w-4.5 h-4.5",
    style: { width: 18, height: 18 },
  });
  const actionConfig = getActionConfig(task.type);
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
            {typeIconElement}
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
              onClick={() => onToggleExpand(task.id)}
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
              onClick={() => onMarkDone(task)}
              title="Mark as done"
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-400 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Inline Panel */}
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
                task={task}
                inlineAction={currentInlineAction}
                onDismiss={() => onMarkDone(task)}
                onCollapse={onCollapse}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
