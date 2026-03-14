"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  FileText,
  MessageCircle,
  Check,
  CreditCard,
} from "lucide-react";

/* ─── Feature 1: Magic Link Proposals ─── */
function MagicLinkFeature() {
  return (
    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      <div className="space-y-6 reveal-text">
        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#00F0FF]">
          <FileText size={32} />
        </div>
        <h2 className="text-3xl md:text-5xl font-bold">
          The Magic Link <span className="text-[#00F0FF]">Proposals</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed tracking-wide">
          Making itineraries used to take hours of typing into Word. Now, create
          beautiful, interactive web-link proposals in minutes. Clients view
          photos, day-by-day plans, and accept instantly on their phones.
        </p>
      </div>
      <div
        className="relative h-[500px] w-full glass-card rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#00F0FF]/10 to-transparent group"
        style={{ perspective: "1000px" }}
      >
        {/* Main Phone Mockup */}
        <div
          className="relative w-[260px] h-[520px] bg-black rounded-[40px] border-[8px] border-white/10 shadow-2xl overflow-hidden transition-all duration-700 ease-out group-hover:[transform:rotateY(-12deg)_rotateX(6deg)_scale(1.05)]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="absolute inset-0 bg-[#0A0A0A] overflow-hidden flex flex-col">
            {/* Header Image */}
            <div className="relative h-56 w-full shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop"
                alt="Bali"
                fill
                sizes="260px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      7 Days in
                      <br />
                      Bali
                    </h3>
                    <p className="text-xs text-[#00F0FF] mt-1 tracking-wider uppercase">
                      Proposal #4092
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-lg font-bold text-white">&#8377;1.2L</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Itinerary points */}
            <div className="p-4 space-y-4 flex-1">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-xs font-bold text-gray-400">
                  01
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200">
                    Arrival & Checking
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Private Airport Transfer
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-[#00F0FF]/10 flex items-center justify-center shrink-0 border border-[#00F0FF]/30 text-xs font-bold text-[#00F0FF]">
                  02
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Ubud Temple Tour
                  </p>
                  <p className="text-[10px] text-[#00F0FF]/80">
                    Full day guided experience
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-xs font-bold text-gray-400">
                  03
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200">
                    Nusa Penida Drift
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Ferry & Snorkeling
                  </p>
                </div>
              </div>
            </div>

            {/* Accept button */}
            <div className="p-4 bg-gradient-to-t from-[#0A0A0A] to-transparent shrink-0">
              <button className="w-full py-3 bg-[#00F0FF] rounded-xl text-black font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.02] transition-transform">
                Accept & Pay
              </button>
            </div>
          </div>
        </div>

        {/* Floating Notification */}
        <motion.div
          initial={{ opacity: 0, y: 20, rotate: 0 }}
          whileInView={{ opacity: 1, y: 0, rotate: 5 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="absolute top-1/4 -right-6 md:right-4 z-10 glass-card px-4 py-3 rounded-2xl border-white/20 shadow-2xl flex items-center gap-3 transform hover:scale-105 transition-transform cursor-default"
        >
          <div className="w-10 h-10 rounded-full bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
            <Check size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
              Status
            </p>
            <p className="text-sm font-bold text-white">Client Accepted!</p>
          </div>
        </motion.div>

        {/* Floating Payment Notification */}
        <motion.div
          initial={{ opacity: 0, y: -20, rotate: 0 }}
          whileInView={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute bottom-1/4 -left-6 md:left-4 z-10 glass-card px-4 py-3 rounded-2xl border-white/20 shadow-2xl flex items-center gap-3 transform hover:scale-105 transition-transform cursor-default"
        >
          <div className="w-10 h-10 rounded-full bg-[#FF9933]/20 flex items-center justify-center text-[#FF9933]">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
              Payment
            </p>
            <p className="text-sm font-bold text-white">
              &#8377;50k Deposit Paid
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Feature 2: WhatsApp Engine ─── */
function WhatsAppFeature() {
  return (
    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      <div className="order-2 md:order-1 relative h-[500px] w-full glass-card rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#FF9933]/10 to-transparent">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute top-1/4 left-1/4 glass px-6 py-4 rounded-3xl rounded-tl-sm max-w-[200px]"
        >
          <p className="text-sm font-medium">
            Hi Rohan, your driver is confirmed for tomorrow!
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute bottom-1/3 right-1/4 glass bg-[#FF9933]/20 border-[#FF9933]/30 px-6 py-4 rounded-3xl rounded-br-sm max-w-[200px]"
        >
          <p className="text-sm font-medium">
            Payment of &#8377;50,000 received. Thank you!
          </p>
        </motion.div>
      </div>
      <div className="order-1 md:order-2 space-y-6 reveal-text">
        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#FF9933]">
          <MessageCircle size={32} />
        </div>
        <h2 className="text-3xl md:text-5xl font-bold">
          The Automated{" "}
          <span className="text-[#FF9933]">WhatsApp Engine</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed tracking-wide">
          Clients calling at 11 PM for their driver&apos;s number? Our engine
          speaks to them where they are. Automated updates sent straight to
          their WhatsApp—no manual typing required.
        </p>
      </div>
    </div>
  );
}

/* ─── Proposals & WhatsApp Features Section ─── */
export function FeaturesProposals() {
  return (
    <section className="relative z-30 bg-transparent py-16 md:py-32 px-6 md:px-24 mt-10 md:mt-20">
      <div className="max-w-7xl mx-auto space-y-20 md:space-y-32">
        <MagicLinkFeature />
        <WhatsAppFeature />
      </div>
    </section>
  );
}
