"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SplineScene } from "@/components/SplineScene";
import { CardSwap, Card } from "@/components/CardSwap";
import ShinyText from "@/components/ShinyText";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import dynamic from "next/dynamic";
const ForceFieldBackground = dynamic(
  () => import("@/components/ForceFieldBackground").then(m => m.ForceFieldBackground),
  { ssr: false }
);
import { ArrowRight, Plane, MessageCircle, FileText, CreditCard, ShoppingBag, Check, Users, Map, Compass, XCircle, CheckCircle2, Calculator, ChevronLeft, ChevronRight, Play, Zap } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { IndiaMap } from "@/components/IndiaMap";
import { Testimonials } from "@/components/Testimonials";
import { HowItWorks } from "@/components/HowItWorks";
import { CustomerLogos } from "@/components/CustomerLogos";
import { ROICalculator } from "@/components/ROICalculator";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { LeadMagnetSection } from "@/components/LeadMagnetSection";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}



/* ─── Interactive Proposal Preview Component ─── */
const proposalDays = [
  {
    day: 1,
    title: 'Arrive in Bali',
    location: 'Ubud, Bali',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600&auto=format&fit=crop',
    description: 'Private airport transfer to your luxury villa in Ubud. Welcome dinner at the resort.',
    tags: ['Transfer', 'Dinner Included'],
  },
  {
    day: 2,
    title: 'Sacred Temple Trail',
    location: 'Tirta Empul & Tegallalang',
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=600&auto=format&fit=crop',
    description: 'Full-day guided tour of sacred water temples and the iconic rice terraces.',
    tags: ['Guided Tour', 'Cultural'],
  },
  {
    day: 3,
    title: 'Nusa Penida Island',
    location: 'Nusa Penida',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600&auto=format&fit=crop',
    description: 'Speed boat to Nusa Penida. Snorkeling with manta rays and cliff-top photo spots.',
    tags: ['Adventure', 'Snorkeling'],
  },
];

function ProposalPreview() {
  const [currentDay, setCurrentDay] = useState(0);
  const [accepted, setAccepted] = useState(false);

  const nextDay = useCallback(() => {
    setCurrentDay(prev => Math.min(prev + 1, proposalDays.length - 1));
  }, []);

  const prevDay = useCallback(() => {
    setCurrentDay(prev => Math.max(prev - 1, 0));
  }, []);

  return (
    <section className="relative z-30 bg-transparent py-24 px-10 md:px-24">
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
          <h2 className="text-4xl md:text-5xl font-bold">Experience a <span className="text-[#A259FF]">Magic Link</span></h2>
          <p className="text-xl text-gray-400 mt-4">This is what your clients see. Swipe through the days.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-lg mx-auto"
        >
          {/* Phone container */}
          <div className="rounded-[32px] border-[6px] border-white/10 bg-[#0A0A0A] overflow-hidden shadow-2xl">
            {/* Image */}
            <div className="relative h-56 w-full overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentDay}
                  src={proposalDays[currentDay].image}
                  alt={proposalDays[currentDay].title}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent"></div>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-xs text-white font-bold border border-white/20">
                Day {proposalDays[currentDay].day} of {proposalDays.length}
              </div>
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
                  <p className="text-[#00F0FF] text-xs font-semibold tracking-wider uppercase">{proposalDays[currentDay].location}</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{proposalDays[currentDay].title}</h3>
                  <p className="text-sm text-gray-400 mt-3 leading-relaxed">{proposalDays[currentDay].description}</p>
                  <div className="flex gap-2 mt-4">
                    {proposalDays[currentDay].tags.map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full text-[10px] bg-white/5 border border-white/10 text-gray-300 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
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
                      className={`w-2 h-2 rounded-full transition-colors ${i === currentDay ? 'bg-[#A259FF]' : 'bg-white/20'}`}
                    />
                  ))}
                </div>

                {currentDay === proposalDays.length - 1 ? (
                  <button
                    onClick={() => setAccepted(true)}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${accepted
                      ? 'bg-[#00F0FF] text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                      : 'bg-[#A259FF] text-white hover:shadow-[0_0_20px_rgba(162,89,255,0.4)]'
                      }`}
                  >
                    {accepted ? '✓ Accepted!' : 'Accept & Pay'}
                  </button>
                ) : (
                  <button
                    onClick={nextDay}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isSplineReady, setIsSplineReady] = useState(false);

  // Parallax effects
  const yParallax = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  // Handle Spline Load to Customize Text and Imagery Dynamically
  const onSplineLoad = (splineApp: any) => {
    // 1. Brutally hide unwanted 3D texts or logos in the scene
    const targetsToHide = [
      'PROJECT NAME', 'PROMO', 'your logo+text',
      'P', 'E', 'A', 'R', 'L', 'PEARL'
    ];
    targetsToHide.forEach(name => {
      const obj = splineApp.findObjectByName(name);
      // Try to clear text if it's a text node
      if (obj && typeof obj.text !== 'undefined') {
        obj.text = '';
      }
      // Force it to be hidden from the renderer entirely
      if (obj) {
        obj.visible = false;
      }
    });

    // 2. Texture Overrides to our shiny new Travel Suite interfaces
    const mockups = [
      '/dashboard_ui_mockup_1773059467134.png',
      '/booking_ui_mockup_1773059498138.png',
      '/crm_ui_mockup_1773059519930.png',
      '/itinerary_ui_mockup_1773062264651.png',
      '/analytics_ui_mockup_1773062281103.png',
      '/invoicing_ui_mockup_1773062297390.png'
    ];

    setTimeout(async () => {
      const texturePromises: Promise<void>[] = [];

      // Loop over the 6 panels in the promo scene ("1700x950 1", "1700x950 2", etc)
      for (let i = 1; i <= 6; i++) {
        const panelName = `1700x950 ${i}`;
        const panel = splineApp.findObjectByName(panelName);
        if (panel) {
          try {
            if (panel.material && panel.material.layers) {
              panel.material.layers.forEach((layer: any) => {
                if (layer.type === 'texture' || layer.type === 'matcap') {
                  const fullUrl = window.location.origin + mockups[i - 1];
                  texturePromises.push(layer.updateTexture(fullUrl));
                }
              });
            } else {
              console.log("No material found on", panelName);
            }
          } catch (err) {
            console.log(`Could not inject mockup into ${panelName}`, err);
          }
        } else {
          console.log(`Could not find Spline object: ${panelName}`);
        }
      }

      try {
        await Promise.all(texturePromises);
      } catch (err) {
        console.error("Some textures failed to map, continuing anyway", err);
      }

      // Fade in the Spline scene now that our mockups are in place
      setIsSplineReady(true);

    }, 1000); // let spline initial payload mount fully
  };

  useEffect(() => {
    // Elegant reveal animations with GSAP
    gsap.utils.toArray('.reveal-text').forEach((text: any) => {
      gsap.from(text, {
        scrollTrigger: {
          trigger: text,
          start: "top 80%",
          toggleActions: "play none none reverse"
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });
    });
  }, []);

  return (
    <>
      <Navbar />
      {/* GLOBAL FIXED BACKGROUND: Force Field perfectly integrated across all sections */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <ForceFieldBackground id="tsparticles-global" />
      </div>

      <main ref={containerRef} className="relative z-10 min-h-[300vh] bg-transparent text-white overflow-hidden">

        {/* 🎬 Scene 1: The Hero - "The Desk of Tomorrow" */}
        <section className="relative h-screen flex items-center justify-between px-10 md:px-24 overflow-hidden pt-20 transform-gpu isolate">

          {/* Particles — TOP LEFT: sits behind the heading & button text */}
          <div
            className="absolute top-0 left-0 z-[15] pointer-events-none overflow-hidden"
            style={{
              width: '45%',
              height: '60%',
              maskImage: 'linear-gradient(to right, black 65%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 65%, transparent 100%)',
            }}
          >
            <ForceFieldBackground id="tsparticles-hero-top" particleCount={180} />
          </div>

          {/* Particles — BOTTOM LEFT: fills the empty space below the button */}
          <div
            className="absolute bottom-0 left-0 z-[15] pointer-events-none overflow-hidden"
            style={{
              width: '50%',
              height: '45%',
              maskImage: 'linear-gradient(to right, black 70%, transparent 100%), linear-gradient(to top, black 40%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
              maskComposite: 'intersect',
            }}
          >
            <ForceFieldBackground id="tsparticles-hero-bottom" particleCount={140} />
          </div>

          {/* 3D Spline Layer — mix-blend-lighten makes black bg transparent, bright screens stay visible */}
          <div className="absolute inset-0 z-[10] pointer-events-none">
            <motion.div
              style={{ y: yParallax }}
              className={`w-full h-[120%] -top-20 relative z-10 pointer-events-auto transition-opacity duration-[1500ms] ease-in-out ${isSplineReady ? 'opacity-90' : 'opacity-0'}`}
            >
              <SplineScene
                sceneUrl="https://prod.spline.design/FOAdqNVCO1g5ncBd/scene.splinecode"
                onLoad={onSplineLoad}
              />
            </motion.div>

            {/* Subtle gradients to frame the hero content smoothly */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 via-[rgba(10,10,10,0.4)] to-transparent z-[11] pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0A0A0A] to-transparent z-[11] pointer-events-none" />
          </div>


          <div className="relative z-20 max-w-3xl space-y-8 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="space-y-4"
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-wide uppercase">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00F0FF]"></span>
                </span>
                <ShinyText text="Travel Suite OS is Live" speed={3} color="#00F0FF" shineColor="#ffffff" />
              </div>

              <h1 className="text-6xl md:text-8xl font-black leading-tight text-glow-aqua">
                Run Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] to-[#FFD699]">
                  Travel Empire.
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl"
            >
              No more messy PDFs. No more lost WhatsApp chats. The all-in-one operating system for modern Indian tour operators.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="pt-6 pointer-events-auto"
            >
              <Link href="/login" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 ease-in-out bg-[#FF9933] rounded-full hover:bg-[#FFB366] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,153,51,0.6)] no-underline">
                <ShinyText text="Experience the Magic" speed={2.5} color="#ffffff" shineColor="#FFEBCC" />
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ═══ Customer Logos ═══ */}
        <CustomerLogos />

        {/* ═══ SECTION 2: How It Works ═══ */}
        <HowItWorks />

        {/* ═══ Before vs. After — Hooks visitors with problem/solution right away ═══ */}
        <section className="relative z-30 bg-transparent py-24 px-10 md:px-24 mt-10">
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
              <h2 className="text-4xl md:text-5xl font-bold">The Old Way vs. <span className="text-[#00F0FF]">The TravelSuite Way</span></h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
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
                {[
                  { text: 'Client details scattered across 5 WhatsApp groups', icon: '💬' },
                  { text: 'Itineraries copy-pasted from old emails & Word docs', icon: '📄' },
                  { text: 'Payment follow-ups lost in endless threads', icon: '💸' },
                  { text: 'Forgetting to upsell spa packages & transfers', icon: '😰' },
                  { text: '11 PM phone calls for driver contact numbers', icon: '📞' },
                ].map((item, i) => (
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

              {/* TRAVELSUITE WAY */}
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
                  <h3 className="text-2xl font-bold text-[#00F0FF]">The TravelSuite Way</h3>
                </div>
                {[
                  { text: 'Every client in one intelligent CRM pipeline', icon: '✅' },
                  { text: 'Drag & drop itinerary builder with auto-descriptions', icon: '🎯' },
                  { text: 'Auto payment reminders via WhatsApp', icon: '💰' },
                  { text: 'One-click add-on marketplace boosts revenue 30%', icon: '🚀' },
                  { text: 'Automated driver & activity confirmations', icon: '🤖' },
                ].map((item, i) => (
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
        </section>

        {/* 🎬 Stories / Features using Glassmorphism */}
        <section className="relative z-30 bg-transparent py-32 px-10 md:px-24 mt-20">
          <div className="max-w-7xl mx-auto space-y-32">

            {/* Feature 1: The Magic Link */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6 reveal-text">
                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#00F0FF]">
                  <FileText size={32} />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">The Magic Link <span className="text-[#00F0FF]">Proposals</span></h2>
                <p className="text-xl text-gray-400 font-light leading-relaxed tracking-wide">
                  Making itineraries used to take hours of typing into Word.
                  Now, create beautiful, interactive web-link proposals in minutes.
                  Clients view photos, day-by-day plans, and accept instantly on their phones.
                </p>
              </div>
              <div className="relative h-[500px] w-full glass-card rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#00F0FF]/10 to-transparent group" style={{ perspective: '1000px' }}>

                {/* Main Phone Mockup */}
                <div
                  className="relative w-[260px] h-[520px] bg-black rounded-[40px] border-[8px] border-white/10 shadow-2xl overflow-hidden transition-all duration-700 ease-out group-hover:[transform:rotateY(-12deg)_rotateX(6deg)_scale(1.05)]"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Internal screen */}
                  <div className="absolute inset-0 bg-[#0A0A0A] overflow-hidden flex flex-col">
                    {/* Header Image */}
                    <div className="relative h-56 w-full shrink-0">
                      <img src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop" alt="Bali" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <h3 className="text-xl font-bold text-white leading-tight">7 Days in<br />Bali</h3>
                            <p className="text-xs text-[#00F0FF] mt-1 tracking-wider uppercase">Proposal #4092</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Total</p>
                            <p className="text-lg font-bold text-white">₹1.2L</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Itinerary points */}
                    <div className="p-4 space-y-4 flex-1">
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-xs font-bold text-gray-400">01</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-200">Arrival & Checking</p>
                          <p className="text-[10px] text-gray-500">Private Airport Transfer</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-full bg-[#00F0FF]/10 flex items-center justify-center shrink-0 border border-[#00F0FF]/30 text-xs font-bold text-[#00F0FF]">02</div>
                        <div>
                          <p className="text-sm font-semibold text-white">Ubud Temple Tour</p>
                          <p className="text-[10px] text-[#00F0FF]/80">Full day guided experience</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-xs font-bold text-gray-400">03</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-200">Nusa Penida Drift</p>
                          <p className="text-[10px] text-gray-500">Ferry & Snorkeling</p>
                        </div>
                      </div>
                    </div>

                    {/* Accept button (sticky bottom flex-end) */}
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
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Status</p>
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
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Payment</p>
                    <p className="text-sm font-bold text-white">₹50k Deposit Paid</p>
                  </div>
                </motion.div>

              </div>
            </div>

            {/* Feature 2: WhatsApp Engine */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 relative h-[500px] w-full glass-card rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#FF9933]/10 to-transparent">
                {/* Decorative WhatsApp Style Bubbles */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute top-1/4 left-1/4 glass px-6 py-4 rounded-3xl rounded-tl-sm max-w-[200px]"
                >
                  <p className="text-sm font-medium">Hi Rohan, your driver is confirmed for tomorrow! 🚙</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute bottom-1/3 right-1/4 glass bg-[#FF9933]/20 border-[#FF9933]/30 px-6 py-4 rounded-3xl rounded-br-sm max-w-[200px]"
                >
                  <p className="text-sm font-medium">Payment of ₹50,000 received. Thank you! 🎉</p>
                </motion.div>
              </div>
              <div className="order-1 md:order-2 space-y-6 reveal-text">
                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#FF9933]">
                  <MessageCircle size={32} />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">The Automated <span className="text-[#FF9933]">WhatsApp Engine</span></h2>
                <p className="text-xl text-gray-400 font-light leading-relaxed tracking-wide">
                  Clients calling at 11 PM for their driver's number? Our engine speaks to them where they are.
                  Automated updates sent straight to their WhatsApp—no manual typing required.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Feature 3: The Upsell Marketplace */}
        <section className="relative z-30 bg-transparent py-16 px-10 md:px-24">
          <div className="max-w-7xl mx-auto space-y-32">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6 reveal-text">
                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#ff99d6]">
                  <ShoppingBag size={32} />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">The One-Click <span className="text-[#ff99d6]">Add-ons</span></h2>
                <p className="text-xl text-gray-400 font-light leading-relaxed tracking-wide">
                  Leaving revenue on the table because you forget to upsell?
                  Give clients the choice to add extras right inside their proposal.
                  With our elegant marketplace, they click, you earn.
                </p>
              </div>
              <div className="relative h-[500px] w-full flex items-center justify-center -ml-10">
                <CardSwap
                  width={320}
                  height={420}
                  cardDistance={50}
                  verticalDistance={40}
                  delay={2000}
                  pauseOnHover={true}
                  skewAmount={6}
                >
                  {[
                    {
                      title: "Airport Transfer",
                      price: "₹2,500",
                      image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800&auto=format&fit=crop"
                    },
                    {
                      title: "Candlelight Dinner",
                      price: "₹8,000",
                      image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=800&auto=format&fit=crop"
                    },
                    {
                      title: "Spa Package",
                      price: "₹12,000",
                      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop"
                    }
                  ].map((addon, i) => (
                    <Card key={i} className="p-0 overflow-hidden group border-white/10">
                      <div className="relative h-full w-full flex flex-col">
                        <div className="flex-1 overflow-hidden">
                          <img
                            src={addon.image}
                            alt={addon.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                          <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
                            {addon.price}
                          </div>
                          <h3 className="text-2xl font-bold mb-2 text-white/90">{addon.title}</h3>
                          <p className="text-sm text-white/60 leading-relaxed max-w-[90%]">
                            Click to add this elegant upgrade directly to the itinerary.
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardSwap>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 4: Intelligent Client CRM */}
        <section className="relative z-30 bg-transparent py-16 px-10 md:px-24">
          <div className="max-w-7xl mx-auto space-y-32">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 relative h-[500px] w-full glass-card rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#A259FF]/10 to-transparent group" style={{ perspective: '1000px' }}>
                <div className="relative w-full max-w-sm space-y-4">
                  <div className="absolute inset-0 -mx-4 -my-8 border-l border-white/5 pl-4 before:absolute before:inset-y-0 before:left-1/2 before:-translate-x-1/2 before:w-px before:bg-white/5 opacity-50"></div>

                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 p-4 rounded-2xl glass border border-white/10 flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A259FF] to-[#00F0FF] flex items-center justify-center text-white font-bold text-lg">R</div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">Rohan Sharma</p>
                      <p className="text-xs text-[#00F0FF]">New Lead • Maldives</p>
                    </div>
                    <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#A259FF]/20 text-[#A259FF]">HOT</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 p-4 rounded-2xl glass border border-[#FF9933]/30 flex items-center gap-4 bg-[#FF9933]/5 shadow-[0_0_20px_rgba(255,153,51,0.1)] translate-x-12"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-[#FF9933] overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" alt="Priya" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">Priya & Rahul</p>
                      <p className="text-xs text-[#FF9933]">Proposal Sent • Bali</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[#FF9933] animate-pulse"></div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="relative z-10 p-4 rounded-2xl glass border border-[#00F0FF]/30 flex items-center gap-4 bg-[#00F0FF]/5 translate-x-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white">
                      <Users size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold flex items-center gap-2">The Kapoor Family <Check size={12} className="text-[#00F0FF]" /></p>
                      <p className="text-xs text-gray-400">Traveling • Europe</p>
                    </div>
                    <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#00F0FF]/20 text-[#00F0FF] flex items-center gap-1">
                      Paid
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="order-1 md:order-2 space-y-6 reveal-text">
                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#A259FF]">
                  <Users size={32} />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">Intelligent <span className="text-[#A259FF]">Client CRM</span></h2>
                <p className="text-xl text-gray-400 font-light leading-relaxed tracking-wide">
                  Track every lead from initial inquiry to their flight home. Know exactly who needs a follow-up, who just opened your proposal, and who is ready to pay. Your entire travel pipeline, perfectly organized.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 5: Drag & Drop Itinerary Builder */}
        <section className="relative z-30 bg-transparent py-16 px-10 md:px-24">
          <div className="max-w-7xl mx-auto space-y-32">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6 reveal-text">
                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#ff3366]">
                  <Map size={32} />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">Smart Drag & Drop <span className="text-[#ff3366]">Builder</span></h2>
                <p className="text-xl text-gray-400 font-light leading-relaxed tracking-wide">
                  Stop copying and pasting from Wikipedia! Access a global database of flights, hotels, and activities. Just drag them into the timeline, and we'll automatically generate the descriptions, photos, and policies.
                </p>
              </div>

              <div className="relative h-[500px] w-full glass-card rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-bl from-[#ff3366]/10 to-transparent group">
                {/* Visual: Timeline builder */}
                <div className="absolute inset-y-12 w-full max-w-sm flex shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  {/* Timeline Line */}
                  <div className="w-1 bg-white/10 h-full absolute left-8 rounded-full"></div>

                  <div className="w-full space-y-6 px-4">
                    {/* Day 1 */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="relative ml-10 glass-card p-4 rounded-2xl backdrop-blur-md transform transition-transform group-hover:translate-x-2 bg-white/5 border-white/10"
                    >
                      <div className="absolute w-4 h-4 rounded-full bg-[#ff3366] -left-[35px] top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(255,51,102,0.8)]"><div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div></div>
                      <p className="text-[#ff3366] text-xs font-bold tracking-wider uppercase mb-1">Day 1</p>
                      <h4 className="text-white font-semibold text-lg">Arrive in Paris</h4>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">Check into Hotel Le Meurice. Private transfer from CDG configured automatically.</p>
                    </motion.div>

                    {/* Add new block floating animation */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 30 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="relative ml-10 glass-card p-4 rounded-2xl backdrop-blur-xl shadow-2xl z-10 cursor-grab active:cursor-grabbing border-[#ff3366]/30 bg-gradient-to-r from-[#ff3366]/20 to-transparent"
                      style={{ rotate: '-2deg' }}
                    >
                      <div className="absolute w-4 h-4 rounded-full bg-[#111] border border-white/20 -left-[35px] top-1/2 -translate-y-1/2 opacity-50"></div>
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[#ff3366] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1"><Compass size={12} /> Dragging from Library...</p>
                      </div>
                      <h4 className="text-white font-bold">Louvre Museum VIP Pass</h4>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white border border-white/10">Activity</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366]/30">Skip-The-Line</span>
                      </div>
                    </motion.div>

                    {/* Day 2 */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="relative ml-10 glass-card p-4 rounded-2xl backdrop-blur-md bg-white/5 border-white/10 opacity-70"
                    >
                      <div className="absolute w-4 h-4 rounded-full bg-[#00F0FF] -left-[35px] top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(0,240,255,0.8)]"><div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div></div>
                      <p className="text-[#00F0FF] text-[10px] font-bold tracking-wider uppercase mb-1">Day 2</p>
                      <h4 className="text-white font-semibold">Eiffel Tower Dinner</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Reserved seating at Le Jules Verne. Dietary reqs sent.</p>
                    </motion.div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION: Interactive Proposal Preview ═══ */}
        <ProposalPreview />

        {/* ═══ SECTION: ROI Calculator ═══ */}
        <ROICalculator />

        {/* ═══ SECTION 10: Live Pulse Dashboard ═══ */}
        <section className="relative z-30 py-24 px-10 md:px-24" style={{ background: 'linear-gradient(180deg, #050508 0%, #0A0A10 50%, #050508 100%)' }}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold">Happening <span className="text-[#00F0FF]">Right Now</span></h2>
              <p className="text-xl text-gray-400 mt-4">Tour operators across India are sending proposals as you read this.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative rounded-3xl border border-white/10 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.02) 0%, rgba(10,10,15,0.95) 30%, rgba(10,10,15,0.98) 70%, rgba(0,240,255,0.02) 100%)' }}
            >
              <div className="flex flex-col md:flex-row items-center">
                {/* Left side: India Map */}
                <div className="relative flex-1 h-[500px] md:h-[540px] flex items-center justify-center">
                  <IndiaMap />
                  {/* Subtle grid overlay on map area only */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                </div>

                {/* Right side: Live Stats Panel */}
                <div className="md:w-[320px] w-full p-8 md:pr-10 flex flex-col gap-6">
                  {/* Main stat */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="p-6 rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/[0.04] text-center"
                  >
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse"></div>
                      <span className="text-xs text-[#00FF88] font-semibold uppercase tracking-wider">Live</span>
                    </div>
                    <div className="text-5xl font-black text-[#00F0FF]">
                      <CountUp to={247} duration={3} />
                    </div>
                    <p className="text-sm text-gray-400 mt-2">proposals sent today</p>
                  </motion.div>

                  {/* Secondary stats */}
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
                    <p className="text-sm text-gray-400 mt-1">operators online now</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    viewport={{ once: true }}
                    className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]"
                  >
                    <div className="text-3xl font-bold text-[#00FF88]">
                      ₹<CountUp to={18} duration={2} />L
                    </div>
                    <p className="text-sm text-gray-400 mt-1">bookings processed today</p>
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
                    <p className="text-sm text-gray-400 mt-1">cities active right now</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ SECTION 10: Interactive Demo Sandbox ═══ */}
        <InteractiveDemo />



        {/* ═══ SECTION 11: Integration Partners ═══ */}
        <section className="relative z-30 bg-transparent py-16 px-10 md:px-24">
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
              {['WhatsApp', 'Razorpay', 'Amadeus', 'Google Flights', 'Twilio'].map((name) => (
                <div
                  key={name}
                  className="px-6 py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-gray-400 text-sm font-semibold hover:border-[#00F0FF]/40 hover:text-[#00F0FF] hover:bg-[#00F0FF]/5 transition-all cursor-default"
                >
                  {name}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ SECTION 12: Demo Video ═══ */}
        <section className="relative z-30 bg-transparent py-24 px-10 md:px-24">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold">See It In <span className="text-[#FF9933]">Action</span></h2>
              <p className="text-xl text-gray-400 mt-4">Watch how TravelSuite transforms your daily workflow in 60 seconds.</p>
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

        {/* ═══ SECTION 13: Testimonials ═══ */}
        <Testimonials />

        {/* Lead Magnet Funnel */}
        <LeadMagnetSection />

        {/* Climax / CTA */}
        <section className="relative z-30 py-40 bg-transparent text-center px-10 border-t border-white/10 mt-20">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FF9933]/50 to-transparent"></div>
          <div className="max-w-4xl mx-auto space-y-10 reveal-text">
            <Plane className="w-20 h-20 text-[#00F0FF] mx-auto opacity-80" />
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
              Stop managing on <br />10 different apps.
            </h2>
            <p className="text-2xl text-gray-400 font-light">
              Bring your proposals, WhatsApp chats, drivers, and payments into one beautiful screen. Join the top tour operators in India today.
            </p>
            <Link href="/login" className="group mt-8 inline-flex px-12 py-5 text-xl font-bold text-[#0A0A0A] bg-white rounded-full hover:bg-gray-200 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)] no-underline">
              <ShinyText
                text="Start Using for Free"
                speed={2}
                color="#0A0A0A"
                shineColor="#888888"
                pauseOnHover={true}
              />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
