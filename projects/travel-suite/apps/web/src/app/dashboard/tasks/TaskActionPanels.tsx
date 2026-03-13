"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  X,
  Loader2,
  User,
  Phone,
  MessageCircle,
  Send,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDriverSearch, type TaskItem } from "@/lib/queries/dashboard-tasks";
import type { InlineAction } from "./task-board-types";
import { getInlineAction } from "./task-board-types";

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
// Panel Props
// ---------------------------------------------------------------------------

interface DismissablePanel {
  onDismiss: () => void;
  onCollapse: () => void;
}

interface TaskPanel {
  task: TaskItem;
  onCollapse: () => void;
}

interface TaskDismissablePanel {
  task: TaskItem;
  onDismiss: () => void;
  onCollapse: () => void;
}

// ---------------------------------------------------------------------------
// Assign Driver Panel
// ---------------------------------------------------------------------------

function AssignDriverPanel({ onDismiss, onCollapse }: DismissablePanel) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const { data: drivers, isLoading: isSearching } =
    useDriverSearch(debouncedQuery);
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(
    null,
  );

  const handleAssign = useCallback(
    (driverId: string) => {
      setAssigningDriverId(driverId);
      setTimeout(() => {
        setAssigningDriverId(null);
        onCollapse();
        onDismiss();
      }, 800);
    },
    [onDismiss, onCollapse],
  );

  return (
    <div className="px-4 pb-4 pt-1 border-t border-white/5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
        Pick a driver to assign
      </p>
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
                    {driver.vehiclePlate ? ` \u00b7 ${driver.vehiclePlate}` : ""}
                    {" \u00b7 "}
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
          <p className="text-xs text-slate-500 text-center py-4">
            No drivers found
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Send Reminder Panel
// ---------------------------------------------------------------------------

function SendReminderPanel({
  task,
  onDismiss,
  onCollapse,
}: TaskDismissablePanel) {
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(() => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onCollapse();
      onDismiss();
    }, 1200);
  }, [onDismiss, onCollapse]);

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
          <p className="text-[10px] text-slate-500 mt-0.5">
            {task.description}
          </p>
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
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" /> Send via WhatsApp
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
// View Leads Panel
// ---------------------------------------------------------------------------

function ViewLeadsPanel({ task, onCollapse }: TaskPanel) {
  return (
    <div className="px-4 pb-4 pt-1 border-t border-white/5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
        New WhatsApp leads need your response
      </p>
      {Object.keys(task.entityData).length > 0 && (
        <div className="p-3 rounded-xl border border-white/10 bg-white/3 mb-3 space-y-1">
          {Object.entries(task.entityData).map(([key, value]) => (
            <p key={key} className="text-[10px] text-slate-500">
              <span className="font-bold capitalize">
                {key.replace(/_/g, " ")}:
              </span>{" "}
              {String(value)}
            </p>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Link href="/inbox">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-[11px] font-black transition-all shadow-sm shadow-[#25D366]/30"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open in WhatsApp
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
// Follow Up Panel
// ---------------------------------------------------------------------------

function FollowUpPanel({ task, onCollapse }: TaskPanel) {
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
          <Send className="w-3.5 h-3.5" /> Send Follow-up via WhatsApp
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
// View Schedule Panel
// ---------------------------------------------------------------------------

function ViewSchedulePanel({ task, onCollapse }: TaskPanel) {
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
            <ExternalLink className="w-3.5 h-3.5" /> View Trip Details
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
// Review Docs Panel
// ---------------------------------------------------------------------------

function ReviewDocsPanel({ task, onCollapse }: TaskPanel) {
  return (
    <div className="px-4 pb-4 pt-1 border-t border-white/5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
        Document verification needed
      </p>
      {Object.keys(task.entityData).length > 0 && (
        <div className="p-3 rounded-xl border border-white/10 bg-white/3 mb-3 space-y-1">
          {Object.entries(task.entityData).map(([key, value]) => (
            <p key={key} className="text-[10px] text-slate-500">
              <span className="font-bold capitalize">
                {key.replace(/_/g, " ")}:
              </span>{" "}
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
            <User className="w-3.5 h-3.5" /> View Driver Profile
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
// Inline Action Dispatcher
// ---------------------------------------------------------------------------

export interface InlineActionPanelProps {
  action: InlineAction;
  task: TaskItem;
  onDismiss: () => void;
  onCollapse: () => void;
}

export function InlineActionPanel({
  action,
  task,
  onDismiss,
  onCollapse,
}: InlineActionPanelProps) {
  switch (action) {
    case "assign_driver":
      return <AssignDriverPanel onDismiss={onDismiss} onCollapse={onCollapse} />;
    case "send_reminder":
      return (
        <SendReminderPanel
          task={task}
          onDismiss={onDismiss}
          onCollapse={onCollapse}
        />
      );
    case "view_leads":
      return <ViewLeadsPanel task={task} onCollapse={onCollapse} />;
    case "follow_up":
      return <FollowUpPanel task={task} onCollapse={onCollapse} />;
    case "view_schedule":
      return <ViewSchedulePanel task={task} onCollapse={onCollapse} />;
    case "review_docs":
      return <ReviewDocsPanel task={task} onCollapse={onCollapse} />;
  }
}

export { getInlineAction };
