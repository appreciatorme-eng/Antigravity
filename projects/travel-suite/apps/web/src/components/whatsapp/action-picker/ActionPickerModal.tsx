"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CreditCard,
  FileText,
  MapPin,
  Navigation,
  Paperclip,
  UserCheck,
  X,
} from "lucide-react";

import type { ActionMode, ConversationContact } from "../whatsapp.types";
import { DocumentPicker } from "./DocumentPicker";
import { DriverPicker } from "./DriverPicker";
import { ItineraryPicker } from "./ItineraryPicker";
import { LocationPinPicker } from "./LocationPinPicker";
import { LocationRequestPicker } from "./LocationRequestPicker";
import { PaymentPicker } from "./PaymentPicker";
import { PollPicker } from "./PollPicker";
import type { ActionPickerChannel, ActionPickerSendHandler } from "./shared";

export interface ActionPickerModalProps {
  isOpen: boolean;
  mode: ActionMode;
  contact: ConversationContact;
  channel: ActionPickerChannel;
  onSend: ActionPickerSendHandler;
  onClose: () => void;
  language?: string;
}

const ACTION_CONFIG: Record<
  ActionMode,
  {
    title: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  }
> = {
  itinerary: {
    title: "Send Itinerary",
    icon: <FileText className="w-4 h-4" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/15",
  },
  payment: {
    title: "Request Payment",
    icon: <CreditCard className="w-4 h-4" />,
    color: "text-pink-400",
    bgColor: "bg-pink-500/15",
  },
  driver: {
    title: "Send Driver Details",
    icon: <UserCheck className="w-4 h-4" />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
  },
  location: {
    title: "Request Location",
    icon: <Navigation className="w-4 h-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
  },
  "send-document": {
    title: "Send Document",
    icon: <Paperclip className="w-4 h-4" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
  },
  "send-location": {
    title: "Send Location Pin",
    icon: <MapPin className="w-4 h-4" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/15",
  },
  "send-poll": {
    title: "Send Poll",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/15",
  },
};

export function ActionPickerModal({
  isOpen,
  mode,
  contact,
  channel,
  onSend,
  onClose,
  language,
}: ActionPickerModalProps) {
  const config = ACTION_CONFIG[mode];

  async function handleSend(message: string, subject?: string) {
    const result = await onSend(message, subject);
    if (result !== false) {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 380 }}
            className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-white/15 shadow-2xl overflow-hidden"
            style={{
              background: "rgba(8, 18, 36, 0.96)",
              backdropFilter: "blur(24px)",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.bgColor} ${config.color}`}
                >
                  {config.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {config.title}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    to {contact.name} · via{" "}
                    {channel === "email" ? "✉️ Email" : "💬 WhatsApp"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {mode === "itinerary" && (
                <ItineraryPicker
                  contact={contact}
                  channel={channel}
                  onSend={handleSend}
                  language={language}
                />
              )}
              {mode === "payment" && (
                <PaymentPicker
                  contact={contact}
                  channel={channel}
                  onSend={handleSend}
                  language={language}
                />
              )}
              {mode === "driver" && (
                <DriverPicker
                  contact={contact}
                  channel={channel}
                  onSend={handleSend}
                  language={language}
                />
              )}
              {mode === "location" && (
                <LocationRequestPicker
                  contact={contact}
                  channel={channel}
                  onSend={handleSend}
                  language={language}
                />
              )}
              {mode === "send-document" && (
                <DocumentPicker
                  contact={contact}
                  channel={channel}
                  onSend={handleSend}
                  language={language}
                />
              )}
              {mode === "send-location" && (
                <LocationPinPicker
                  contact={contact}
                  channel={channel}
                  onSend={handleSend}
                  language={language}
                />
              )}
              {mode === "send-poll" && (
                <PollPicker
                  contact={contact}
                  channel={channel}
                  onSend={handleSend}
                  language={language}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
