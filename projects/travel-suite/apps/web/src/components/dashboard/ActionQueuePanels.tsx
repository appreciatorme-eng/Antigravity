"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageCircle,
  User,
  Send,
  Loader2,
  Phone,
  Search,
  X,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDriverSearch, type TaskItem } from "@/lib/queries/dashboard-tasks";

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

export function AssignDriverPanel({
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

export function SendReminderPanel({
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
          <p className="text-xs font-bold text-slate-800 dark:text-white">WhatsApp Reminder</p>
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

export function ViewLeadsPanel({
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

export function FollowUpPanel({
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

export function ViewSchedulePanel({
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

export function ReviewDocsPanel({
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
