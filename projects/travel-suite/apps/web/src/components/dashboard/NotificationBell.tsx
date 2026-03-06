"use client";

// NotificationBell — shows demo notifications when isDemoMode is ON, empty when OFF.
// DEMO_NOTIFICATIONS imported from demo data; no live DB reads here.

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  MessageCircle,
  IndianRupee,
  Car,
  Plane,
  UserPlus,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/lib/demo/demo-mode-context";
import { DEMO_NOTIFICATIONS } from "@/lib/demo/data";

interface Notification {
  id: string;
  type: "lead" | "payment" | "driver" | "trip" | "message";
  title: string;
  description: string;
  timeLabel: string;
  read: boolean;
  href: string;
}

const TYPE_CONFIG: Record<
  Notification["type"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  lead: { icon: UserPlus, color: "text-orange-500", bg: "bg-orange-500/10" },
  payment: { icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  driver: { icon: Car, color: "text-amber-500", bg: "bg-amber-500/10" },
  trip: { icon: Plane, color: "text-blue-500", bg: "bg-blue-500/10" },
  message: { icon: MessageCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
};

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { isDemoMode } = useDemoMode();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with external isDemoMode context change
    setNotifications(isDemoMode ? (DEMO_NOTIFICATIONS as Notification[]) : []);
  }, [isDemoMode]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setIsOpen(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={cn(
          "relative flex items-center justify-center w-12 h-12 rounded-xl border transition-all shadow-sm",
          isOpen
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/30 hover:text-primary",
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 border-2 border-white dark:border-slate-900 text-[10px] font-bold text-white shadow-lg animate-in zoom-in-50">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-96 max-h-[480px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-black/10 z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Enable Demo Mode to preview alerts</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const config = TYPE_CONFIG[notif.type];
                  const TypeIcon = config.icon;
                  return (
                    <Link
                      key={notif.id}
                      href={notif.href}
                      onClick={() => handleMarkRead(notif.id)}
                    >
                      <div
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                          !notif.read && "bg-primary/[0.03]",
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                            config.bg,
                          )}
                        >
                          <TypeIcon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p
                              className={cn(
                                "text-xs font-bold truncate",
                                notif.read
                                  ? "text-slate-500"
                                  : "text-slate-900 dark:text-white",
                              )}
                            >
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {notif.description}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 mt-1">
                          {notif.timeLabel}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/inbox"
                onClick={() => setIsOpen(false)}
                className="block text-center text-xs font-bold text-primary hover:text-primary/80 py-1.5 transition-colors"
              >
                View All in Inbox →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
