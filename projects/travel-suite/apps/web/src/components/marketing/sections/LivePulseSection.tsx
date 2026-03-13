"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { CountUp } from "@/components/marketing/CountUp";
import { IndiaMap } from "@/components/marketing/IndiaMap";

/* ─── Live Pulse Dashboard ─── */
function LivePulseDashboard() {
  return (
    <section
      className="relative z-30 py-16 md:py-24 px-6 md:px-24"
      style={{
        background:
          "linear-gradient(180deg, #050508 0%, #0A0A10 50%, #050508 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold">
            Happening <span className="text-[#00F0FF]">Right Now</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mt-4">
            Tour operators across India are sending proposals as you read this.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative rounded-3xl border border-white/10 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,240,255,0.02) 0%, rgba(10,10,15,0.95) 30%, rgba(10,10,15,0.98) 70%, rgba(0,240,255,0.02) 100%)",
          }}
        >
          <div className="flex flex-col md:flex-row items-center">
            {/* Left side: India Map */}
            <div className="relative flex-1 h-[500px] md:h-[540px] flex items-center justify-center">
              <IndiaMap />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            </div>

            {/* Right side: Live Stats Panel */}
            <div className="md:w-[320px] w-full p-8 md:pr-10 flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/[0.04] text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse"></div>
                  <span className="text-xs text-[#00FF88] font-semibold uppercase tracking-wider">
                    Live
                  </span>
                </div>
                <div className="text-5xl font-black text-[#00F0FF]">
                  <CountUp to={247} duration={3} />
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  proposals sent today
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <div className="text-3xl font-bold text-[#FF9933]">
                  <CountUp to={42} duration={2.5} />
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  operators online now
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <div className="text-3xl font-bold text-[#00FF88]">
                  &#8377;<CountUp to={18} duration={2} />L
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  bookings processed today
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                viewport={{ once: true }}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <div className="text-3xl font-bold text-[#A855F7]">
                  <CountUp to={10} duration={2} />
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  cities active right now
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Integration Partners ─── */
function IntegrationPartners() {
  return (
    <section className="relative z-30 bg-transparent py-16 px-6 md:px-24">
      <div className="max-w-5xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-8"
        >
          Integrates with the tools you already use
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6 md:gap-10"
        >
          {["WhatsApp", "Razorpay", "Amadeus", "Google Flights", "Twilio"].map(
            (name) => (
              <div
                key={name}
                className="px-6 py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-gray-400 text-sm font-semibold hover:border-[#00F0FF]/40 hover:text-[#00F0FF] hover:bg-[#00F0FF]/5 transition-all cursor-default"
              >
                {name}
              </div>
            )
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Demo Video ─── */
function DemoVideo() {
  return (
    <section className="relative z-30 bg-transparent py-16 md:py-24 px-6 md:px-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold">
            See It In <span className="text-[#FF9933]">Action</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mt-4">
            Watch how TravelSuite transforms your daily workflow in 60 seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative aspect-video rounded-3xl border border-white/10 bg-gradient-to-br from-[#FF9933]/10 via-[#0A0A0A] to-[#00F0FF]/10 overflow-hidden flex items-center justify-center group cursor-pointer"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative z-10 w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            <Play size={32} className="text-white ml-1" />
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
            <p className="text-sm text-gray-400">TravelSuite Product Demo</p>
            <p className="text-sm text-gray-500">1:02</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Combined Export ─── */
export function LivePulseSection() {
  return (
    <>
      <LivePulseDashboard />
      <IntegrationPartners />
      <DemoVideo />
    </>
  );
}
