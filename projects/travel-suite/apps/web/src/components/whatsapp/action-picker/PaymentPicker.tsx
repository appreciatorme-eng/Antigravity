"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  ChevronRight,
  CreditCard,
  IndianRupee,
  Search,
} from "lucide-react";

import {
  fillTemplate,
  WHATSAPP_TEMPLATES,
} from "@/lib/whatsapp/india-templates";

import {
  ActionPickerProps,
  formatCurrency,
  MOCK_TRIPS,
  type MockTrip,
} from "./shared";

export function PaymentPicker({
  contact,
  channel,
  onSend,
}: ActionPickerProps) {
  const [selectedTrip, setSelectedTrip] = useState<MockTrip | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentType, setPaymentType] = useState<
    "advance" | "full" | "balance" | "custom"
  >("advance");
  const [search, setSearch] = useState("");
  const [showTripList, setShowTripList] = useState(true);

  const filteredTrips = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_TRIPS.filter(
      (trip) =>
        trip.name.toLowerCase().includes(q) ||
        trip.destination.toLowerCase().includes(q)
    );
  }, [search]);

  function getAmount() {
    if (paymentType === "advance" && selectedTrip) {
      return Math.round(selectedTrip.amount * 0.3);
    }
    if (paymentType === "full" && selectedTrip) {
      return selectedTrip.amount;
    }
    if (paymentType === "balance" && selectedTrip) {
      return Math.round(selectedTrip.amount * 0.7);
    }
    return parseInt(customAmount.replace(/\D/g, ""), 10) || 0;
  }

  function buildMessage(): { body: string; subject?: string } {
    if (!selectedTrip) return { body: "" };

    const amount = getAmount();
    const bookingId = selectedTrip.bookingId;
    const formattedAmount = formatCurrency(amount);
    const formattedDue = dueDate || "Within 24 hours";

    if (channel === "whatsapp") {
      const template = WHATSAPP_TEMPLATES.find(
        (entry) => entry.id === "payment_request_upi"
      );
      if (!template) return { body: "" };

      return {
        body: fillTemplate(template, {
          client_name: contact.name,
          trip_name: selectedTrip.name,
          amount: formattedAmount,
          due_date: formattedDue,
          booking_id: bookingId,
          upi_id: "gobuddy@paytm",
          payment_link: `https://gobuddy.in/pay/${bookingId.toLowerCase()}`,
          bank_account: "50200012345678",
          bank_ifsc: "HDFC0001234",
          company_name: "GoBuddy Adventures",
        }),
      };
    }

    const paymentLabel =
      paymentType === "advance"
        ? "30% Advance"
        : paymentType === "full"
          ? "Full Payment"
          : paymentType === "balance"
            ? "Balance (70%)"
            : "Custom Amount";

    return {
      subject: `Payment Request — ${selectedTrip.name} — ${formattedAmount}`,
      body: `Dear ${contact.name},\n\nThis is a payment request for your upcoming trip with GoBuddy Adventures.\n\n📋 Trip: ${selectedTrip.name}\n🔖 Booking ID: ${bookingId}\n💰 Amount: ${formattedAmount} (${paymentLabel})\n📅 Due By: ${formattedDue}\n\n━━━━━━━━━━━━━━━━━━━━━\nPAYMENT OPTIONS\n━━━━━━━━━━━━━━━━━━━━━\n\n🏦 Bank Transfer:\nAccount: 50200012345678\nIFSC: HDFC0001234\nName: GoBuddy Adventures\n\n📱 UPI: gobuddy@paytm\n\n🔗 Pay Online: https://gobuddy.in/pay/${bookingId.toLowerCase()}\n\nKindly share the payment screenshot after transfer. For any queries, reply to this email or call +91 98765 00000.\n\nThank you!\nTeam GoBuddy Adventures`,
    };
  }

  const { body, subject } = buildMessage();
  const amount = getAmount();

  return (
    <div className="flex flex-col gap-4">
      {showTripList ? (
        <>
          <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search trip..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
            {filteredTrips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => {
                  setSelectedTrip(trip);
                  setShowTripList(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-4 h-4 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {trip.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {trip.bookingId} · Total {formatCurrency(trip.amount)}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => setShowTripList(true)}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4 text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {selectedTrip?.name}
              </p>
              <p className="text-[10px] text-slate-400">
                {selectedTrip?.bookingId}
              </p>
            </div>
            <span className="text-[10px] text-slate-500">Change</span>
          </button>

          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Payment Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  key: "advance" as const,
                  label: "30% Advance",
                  desc: selectedTrip
                    ? formatCurrency(Math.round(selectedTrip.amount * 0.3))
                    : "—",
                },
                {
                  key: "full" as const,
                  label: "Full Payment",
                  desc: selectedTrip ? formatCurrency(selectedTrip.amount) : "—",
                },
                {
                  key: "balance" as const,
                  label: "Balance 70%",
                  desc: selectedTrip
                    ? formatCurrency(Math.round(selectedTrip.amount * 0.7))
                    : "—",
                },
                {
                  key: "custom" as const,
                  label: "Custom",
                  desc: "Enter amount",
                },
              ].map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setPaymentType(key)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    paymentType === key
                      ? "border-pink-500/50 bg-pink-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="text-[10px] text-pink-300 font-semibold mt-0.5">
                    {desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {paymentType === "custom" && (
            <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
              <IndianRupee className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                autoFocus
                type="number"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                placeholder="Enter amount..."
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]"
            />
            <span className="text-[10px] text-slate-600">
              Due date (optional)
            </span>
          </div>

          {amount > 0 && (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Preview
              </p>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto custom-scrollbar font-sans">
                {body}
              </pre>
            </div>
          )}

          <button
            onClick={() => amount > 0 && onSend(body, subject)}
            disabled={amount <= 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            {channel === "email"
              ? `Send Payment Request — ${amount > 0 ? formatCurrency(amount) : "—"}`
              : `Request ${amount > 0 ? formatCurrency(amount) : "—"} via WhatsApp`}
          </button>
        </>
      )}
    </div>
  );
}
