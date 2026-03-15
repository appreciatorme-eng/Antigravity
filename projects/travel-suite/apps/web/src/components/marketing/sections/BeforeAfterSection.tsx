"use client";

import { motion } from "framer-motion";
import { Zap, XCircle, CheckCircle2 } from "lucide-react";
import { FadeInOnScroll } from "@/components/marketing/effects";
import { BeforeAfterInteractive } from "./BeforeAfterInteractive";

const oldWayItems = [
  { text: "Client details scattered across 5 WhatsApp groups", icon: "..." },
  { text: "Itineraries copy-pasted from old emails & Word docs", icon: "..." },
  { text: "Payment follow-ups lost in endless threads", icon: "..." },
  { text: "Forgetting to upsell spa packages & transfers", icon: "..." },
  { text: "11 PM phone calls for driver contact numbers", icon: "..." },
];

const newWayItems = [
  { text: "Every client in one intelligent CRM pipeline", icon: "..." },
  { text: "Drag & drop itinerary builder with auto-descriptions", icon: "..." },
  { text: "Auto payment reminders via WhatsApp", icon: "..." },
  { text: "One-click add-on marketplace boosts revenue 30%", icon: "..." },
  { text: "Automated driver & activity confirmations", icon: "..." },
];

export function BeforeAfterSection() {
  return (
    <section className="relative z-30 bg-transparent py-16 md:py-24 px-6 md:px-24 mt-10">
      <FadeInOnScroll>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ff3366]/30 text-[#ff3366] text-sm font-semibold tracking-widest uppercase mb-4">
            <Zap size={14} /> The Transformation
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">
            The Old Way vs.{" "}
            <span className="text-[#00F0FF]">The TravelBuilt Way</span>
          </h2>
        </motion.div>

        <div className="mt-12 hidden md:block">
          <BeforeAfterInteractive oldWayItems={oldWayItems} newWayItems={newWayItems} />
        </div>

        {/* MOBILE FALLBACK: Stack them normally on small screens since swiping content is tricky when vertical scrolling */}
        <div className="grid md:hidden gap-6">
          {/* OLD WAY */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400">
                <XCircle size={24} />
              </div>
              <h3 className="text-2xl font-bold text-red-400">The Old Way</h3>
            </div>
            {oldWayItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 text-gray-400"
              >
                <span className="text-lg">{item.icon}</span>
                <p className="text-sm">{item.text}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* TRAVELSUILT WAY */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl border border-[#00F0FF]/30 bg-[#00F0FF]/5 space-y-5 shadow-[0_0_40px_rgba(0,240,255,0.05)]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-2xl font-bold text-[#00F0FF]">
                The TravelBuilt Way
              </h3>
            </div>
            {newWayItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 text-gray-200"
              >
                <span className="text-lg">{item.icon}</span>
                <p className="text-sm font-medium">{item.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      </FadeInOnScroll>
    </section>
  );
}
