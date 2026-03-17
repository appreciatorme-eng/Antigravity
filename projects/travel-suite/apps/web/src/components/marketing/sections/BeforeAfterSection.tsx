"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
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
            <span className="text-[#00F0FF]">The TripBuilt Way</span>
          </h2>
        </motion.div>

        <div className="mt-8 md:mt-12">
          <BeforeAfterInteractive oldWayItems={oldWayItems} newWayItems={newWayItems} />
        </div>
      </div>
      </FadeInOnScroll>
    </section>
  );
}
