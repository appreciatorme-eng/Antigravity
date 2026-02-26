"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  MessageCircle,
  UserPlus,
  IndianRupee,
  ExternalLink,
  ChevronRight,
  MessageSquareOff,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";

type MessageType = "location" | "text" | "new_lead" | "payment_query";
type SenderType = "driver" | "client" | "lead";

interface WhatsAppMessage {
  id: string;
  senderName: string;
  senderPhone: string;
  senderType: SenderType;
  messageType: MessageType;
  preview: string;
  timeLabel: string;
  unread: boolean;
}

const SAMPLE_MESSAGES: WhatsAppMessage[] = [
  {
    id: "w1",
    senderName: "Ramesh (Driver)",
    senderPhone: "+91 94567 12345",
    senderType: "driver",
    messageType: "location",
    preview: "En route to Jaipur airport — ETA 25 mins",
    timeLabel: "9:14 AM",
    unread: true,
  },
  {
    id: "w2",
    senderName: "Mrs. Sharma",
    senderPhone: "+91 98100 45678",
    senderType: "client",
    messageType: "text",
    preview: "Beta change pickup time to 6 AM please, flight is early",
    timeLabel: "8:52 AM",
    unread: true,
  },
  {
    id: "w3",
    senderName: "New Lead",
    senderPhone: "+91 98765 43210",
    senderType: "lead",
    messageType: "new_lead",
    preview: "Bhai Rajasthan 5 din ka kya rate hai? Family of 4",
    timeLabel: "8:30 AM",
    unread: true,
  },
];

const MESSAGE_TYPE_CONFIG: Record<
  MessageType,
  { icon: React.ElementType; actionLabel: string; actionHref: string; tag: string }
> = {
  location: {
    icon: MapPin,
    actionLabel: "View on Map",
    actionHref: "/map-test",
    tag: "Live Location",
  },
  text: {
    icon: MessageCircle,
    actionLabel: "Reply",
    actionHref: "/inbox",
    tag: "Message",
  },
  new_lead: {
    icon: UserPlus,
    actionLabel: "Quick Quote",
    actionHref: "/proposals",
    tag: "New Lead",
  },
  payment_query: {
    icon: IndianRupee,
    actionLabel: "Send Invoice",
    actionHref: "/admin/billing",
    tag: "Payment",
  },
};

const SENDER_TYPE_CONFIG: Record<SenderType, { border: string; avatarBg: string; avatarText: string }> = {
  driver: {
    border: "border-l-[#25D366]",
    avatarBg: "bg-[#25D366]/15",
    avatarText: "text-[#25D366]",
  },
  client: {
    border: "border-l-blue-500",
    avatarBg: "bg-blue-500/15",
    avatarText: "text-blue-400",
  },
  lead: {
    border: "border-l-orange-500",
    avatarBg: "bg-orange-500/15",
    avatarText: "text-orange-400",
  },
};

function SkeletonMessage() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-28" />
          <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-12 ml-auto" />
        </div>
        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
      </div>
    </div>
  );
}

function MessageRow({ msg, index }: { msg: WhatsAppMessage; index: number }) {
  const [replied, setReplied] = useState(false);
  const senderCfg = SENDER_TYPE_CONFIG[msg.senderType];
  const typeCfg = MESSAGE_TYPE_CONFIG[msg.messageType];
  const TypeIcon = typeCfg.icon;

  const initials = msg.senderName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: index * 0.07, ease: "easeOut" }}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 border-l-4 border-b border-b-white/5 transition-all hover:bg-white/3",
        senderCfg.border,
        replied && "opacity-60"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0",
          senderCfg.avatarBg,
          senderCfg.avatarText
        )}
      >
        {initials}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
              {msg.senderName}
            </span>
            {msg.unread && !replied && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] shrink-0" />
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">{msg.timeLabel}</span>
        </div>

        {/* Phone */}
        <p className="text-[10px] text-slate-400 mb-1">{msg.senderPhone}</p>

        {/* Message type tag + preview */}
        <div className="flex items-start gap-1.5">
          <div
            className={cn(
              "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 mt-0.5",
              msg.senderType === "driver"
                ? "bg-[#25D366]/10 text-[#25D366]"
                : msg.senderType === "client"
                ? "bg-blue-500/10 text-blue-400"
                : "bg-orange-500/10 text-orange-400"
            )}
          >
            <TypeIcon className="w-2.5 h-2.5" />
            {typeCfg.tag}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
            {msg.preview}
          </p>
        </div>
      </div>

      {/* Action button */}
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="shrink-0">
        <Link href={typeCfg.actionHref}>
          <button
            onClick={() => setReplied(true)}
            className={cn(
              "text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap",
              msg.senderType === "driver"
                ? "bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366]"
                : msg.senderType === "client"
                ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400"
            )}
          >
            {replied ? "Done" : typeCfg.actionLabel}
          </button>
        </Link>
      </motion.div>
    </motion.div>
  );
}

interface WhatsAppDashboardPreviewProps {
  loading?: boolean;
  unreadCount?: number;
}

export function WhatsAppDashboardPreview({
  loading = false,
  unreadCount = 3,
}: WhatsAppDashboardPreviewProps) {
  return (
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
            WhatsApp
          </h3>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#25D366] text-[10px] font-black text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <Link
          href="/inbox"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          Open Inbox <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Card */}
      <GlassCard padding="none" className="overflow-hidden h-[calc(100%-2.5rem)]">
        {loading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonMessage key={i} />
            ))}
          </div>
        ) : SAMPLE_MESSAGES.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 px-6 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mb-3">
              <MessageSquareOff className="w-6 h-6 text-[#25D366]" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No unread messages
            </p>
            <p className="text-xs text-slate-500 mt-1">All caught up! New messages appear here.</p>
          </motion.div>
        ) : (
          <>
            <div className="divide-y divide-white/5">
              {SAMPLE_MESSAGES.map((msg, index) => (
                <MessageRow key={msg.id} msg={msg} index={index} />
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5">
              <Link href="/inbox">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-black transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Full Inbox
                  {unreadCount > 0 && (
                    <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#25D366] text-[9px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </motion.button>
              </Link>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
