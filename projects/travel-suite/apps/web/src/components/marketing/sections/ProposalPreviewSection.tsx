"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { FileText, ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { SpotlightCard } from "@/components/marketing/effects";

const proposalDays = [
  {
    day: 1,
    title: "Arrive in Bali",
    location: "Ubud, Bali",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600&auto=format&fit=crop",
    description:
      "Private airport transfer to your luxury villa in Ubud. Welcome dinner at the resort.",
    tags: ["Transfer", "Dinner Included"],
  },
  {
    day: 2,
    title: "Sacred Temple Trail",
    location: "Tirta Empul & Tegallalang",
    image:
      "https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=600&auto=format&fit=crop",
    description:
      "Full-day guided tour of sacred water temples and the iconic rice terraces.",
    tags: ["Guided Tour", "Cultural"],
  },
  {
    day: 3,
    title: "Nusa Penida Island",
    location: "Nusa Penida",
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600&auto=format&fit=crop",
    description:
      "Speed boat to Nusa Penida. Snorkeling with manta rays and cliff-top photo spots.",
    tags: ["Adventure", "Snorkeling"],
  },
];

/* Stagger item animation variants */
const staggerChild = {
  hidden: { opacity: 0, y: 15, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 1.8 + i * 0.25, duration: 0.5, ease: "easeOut" as const },
  }),
};

export function ProposalPreviewSection() {
  const [currentDay, setCurrentDay] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<
    "idle" | "generating" | "complete"
  >("idle");
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // Trigger generation animation when the section enters the viewport
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isInView && generationPhase === "idle") {
      setGenerationPhase("generating");
      timer = setTimeout(() => {
        setGenerationPhase("complete");
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  const nextDay = useCallback(() => {
    setCurrentDay((prev) => Math.min(prev + 1, proposalDays.length - 1));
  }, []);

  const prevDay = useCallback(() => {
    setCurrentDay((prev) => Math.max(prev - 1, 0));
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-30 bg-transparent py-16 md:py-24 px-6 md:px-24"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#A259FF]/30 text-[#A259FF] text-sm font-semibold tracking-widest uppercase mb-4">
            <FileText size={14} /> Try It Yourself
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">
            Experience a <span className="text-[#A259FF]">Magic Link</span>
          </h2>
          <p className="text-xl text-gray-400 mt-4">
            Watch TripBuilt generate a proposal in real-time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-lg mx-auto"
        >
          <SpotlightCard className="rounded-[36px] border border-white/5 bg-white/[0.02] p-2">
            {/* Phone container */}
            <div
              className="rounded-[32px] border-[6px] border-white/10 bg-[#0A0A0A] overflow-hidden shadow-2xl shadow-[#A259FF]/10 relative"
              style={{
                boxShadow:
                  "0 0 60px rgba(162, 89, 255, 0.12), 0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* === GENERATING OVERLAY === */}
              <AnimatePresence>
                {generationPhase === "generating" && (
                  <motion.div
                    key="generating-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0A0A]/95 backdrop-blur-lg"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Loader2 size={32} className="text-[#A259FF]" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-[#A259FF] text-sm font-semibold tracking-wider uppercase mt-4"
                    >
                      Generating Proposal...
                    </motion.p>

                    {/* Animated progress bar */}
                    <div className="w-48 h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#A259FF] to-[#00F0FF] rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2.8, ease: "easeInOut" }}
                      />
                    </div>

                    {/* Simulated line items appearing */}
                    <div className="mt-6 space-y-2 w-48">
                      {[
                        "Fetching flights...",
                        "Booking hotels...",
                        "Adding activities...",
                      ].map((text, i) => (
                        <motion.div
                          key={text}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.4, duration: 0.3 }}
                          className="flex items-center gap-2"
                        >
                          <Sparkles size={10} className="text-[#00F0FF]" />
                          <span className="text-[10px] text-gray-500">
                            {text}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* === PROPOSAL CONTENT (stagger-in after generation) === */}

              {/* Image */}
              <div className="relative h-56 w-full overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentDay}
                    className="absolute inset-0"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      custom={0}
                      variants={staggerChild}
                      initial="hidden"
                      animate={
                        generationPhase === "complete" ? "visible" : "hidden"
                      }
                      className="w-full h-full relative"
                    >
                      <Image
                        src={proposalDays[currentDay].image}
                        alt={proposalDays[currentDay].title}
                        fill
                        sizes="(max-width: 768px) 100vw, 512px"
                        className="object-cover"
                      />
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                <motion.div
                  custom={1}
                  variants={staggerChild}
                  initial="hidden"
                  animate={
                    generationPhase === "complete" ? "visible" : "hidden"
                  }
                  className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-xs text-white font-bold border border-white/20"
                >
                  Day {proposalDays[currentDay].day} of{" "}
                  {proposalDays.length}
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentDay}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.p
                      custom={2}
                      variants={staggerChild}
                      initial="hidden"
                      animate={
                        generationPhase === "complete" ? "visible" : "hidden"
                      }
                      className="text-[#00F0FF] text-xs font-semibold tracking-wider uppercase"
                    >
                      {proposalDays[currentDay].location}
                    </motion.p>
                    <motion.h3
                      custom={3}
                      variants={staggerChild}
                      initial="hidden"
                      animate={
                        generationPhase === "complete" ? "visible" : "hidden"
                      }
                      className="text-2xl font-bold text-white mt-1"
                    >
                      {proposalDays[currentDay].title}
                    </motion.h3>
                    <motion.p
                      custom={4}
                      variants={staggerChild}
                      initial="hidden"
                      animate={
                        generationPhase === "complete" ? "visible" : "hidden"
                      }
                      className="text-sm text-gray-400 mt-3 leading-relaxed"
                    >
                      {proposalDays[currentDay].description}
                    </motion.p>
                    <motion.div
                      custom={5}
                      variants={staggerChild}
                      initial="hidden"
                      animate={
                        generationPhase === "complete" ? "visible" : "hidden"
                      }
                      className="flex gap-2 mt-4"
                    >
                      {proposalDays[currentDay].tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full text-[10px] bg-white/5 border border-white/10 text-gray-300 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <motion.div
                  custom={6}
                  variants={staggerChild}
                  initial="hidden"
                  animate={
                    generationPhase === "complete" ? "visible" : "hidden"
                  }
                  className="flex items-center justify-between pt-4 border-t border-white/10"
                >
                  <button
                    onClick={prevDay}
                    disabled={currentDay === 0}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Dots */}
                  <div className="flex gap-2">
                    {proposalDays.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentDay ? "bg-[#A259FF]" : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>

                  {currentDay === proposalDays.length - 1 ? (
                    <button
                      onClick={() => setAccepted(true)}
                      className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                        accepted
                          ? "bg-[#00F0FF] text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                          : "bg-[#A259FF] text-white hover:shadow-[0_0_20px_rgba(162,89,255,0.4)]"
                      }`}
                    >
                      {accepted ? "Accepted!" : "Accept & Pay"}
                    </button>
                  ) : (
                    <button
                      onClick={nextDay}
                      className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </motion.div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
}
