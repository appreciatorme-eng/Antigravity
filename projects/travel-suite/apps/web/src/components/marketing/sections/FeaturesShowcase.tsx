"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  FileText,
  MessageCircle,
  ShoppingBag,
  Users,
  Map,
  Check,
  CreditCard,
  Compass,
} from "lucide-react";
import { CardSwap, Card } from "@/components/marketing/CardSwap";
import { TiltCard, FadeInOnScroll, SpotlightCard } from "@/components/marketing/effects";

/* ─── Feature 1: Magic Link Proposals ─── */
function MagicLinkFeature() {
  return (
    <SpotlightCard className="p-6 md:p-10 rounded-[40px] border border-white/5 bg-white/[0.02]">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      <FadeInOnScroll>
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
      </FadeInOnScroll>
      <TiltCard>
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
      </TiltCard>
      </div>
    </SpotlightCard>
  );
}

/* ─── Feature 2: WhatsApp Engine ─── */
function WhatsAppFeature() {
  return (
    <SpotlightCard className="p-6 md:p-10 rounded-[40px] border border-white/5 bg-white/[0.02]">
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
      <FadeInOnScroll className="order-1 md:order-2">
        <div className="space-y-6 reveal-text">
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
      </FadeInOnScroll>
      </div>
    </SpotlightCard>
  );
}

/* ─── Feature 3: Add-ons Marketplace ─── */
const addons = [
  {
    title: "Airport Transfer",
    price: "\u20B92,500",
    image:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "Candlelight Dinner",
    price: "\u20B98,000",
    image:
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "Spa Package",
    price: "\u20B912,000",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
  },
];

function AddonsFeature() {
  return (
    <SpotlightCard className="p-6 md:p-10 rounded-[40px] border border-white/5 bg-white/[0.02]">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      <FadeInOnScroll>
        <div className="space-y-6 reveal-text">
          <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#ff99d6]">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">
            The One-Click <span className="text-[#ff99d6]">Add-ons</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed tracking-wide">
            Leaving revenue on the table because you forget to upsell? Give
            clients the choice to add extras right inside their proposal. With our
            elegant marketplace, they click, you earn.
          </p>
        </div>
      </FadeInOnScroll>
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
          {addons.map((addon, i) => (
            <Card
              key={i}
              className="p-0 overflow-hidden group border-white/10"
            >
              <div className="relative h-full w-full flex flex-col">
                <div className="relative flex-1 overflow-hidden">
                  <Image
                    src={addon.image}
                    alt={addon.title}
                    fill
                    sizes="320px"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
                    {addon.price}
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-white/90">
                    {addon.title}
                  </h3>
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
    </SpotlightCard>
  );
}

/* ─── Feature 4: Intelligent Client CRM ─── */
function CRMFeature() {
  return (
    <SpotlightCard className="p-6 md:p-10 rounded-[40px] border border-white/5 bg-white/[0.02]">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      <div
        className="order-2 md:order-1 relative h-[500px] w-full glass-card rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#A259FF]/10 to-transparent group"
        style={{ perspective: "1000px" }}
      >
        <div className="relative w-full max-w-sm space-y-4">
          <div className="absolute inset-0 -mx-4 -my-8 border-l border-white/5 pl-4 before:absolute before:inset-y-0 before:left-1/2 before:-translate-x-1/2 before:w-px before:bg-white/5 opacity-50"></div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 p-4 rounded-2xl glass border border-white/10 flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A259FF] to-[#00F0FF] flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Rohan Sharma</p>
              <p className="text-xs text-[#00F0FF]">New Lead - Maldives</p>
            </div>
            <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#A259FF]/20 text-[#A259FF]">
              HOT
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative z-10 p-4 rounded-2xl glass border border-[#FF9933]/30 flex items-center gap-4 bg-[#FF9933]/5 shadow-[0_0_20px_rgba(255,153,51,0.1)] translate-x-12"
          >
            <div className="relative w-12 h-12 rounded-full border-2 border-[#FF9933] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
                alt="Priya"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Priya & Rahul</p>
              <p className="text-xs text-[#FF9933]">Proposal Sent - Bali</p>
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
              <p className="text-white font-semibold flex items-center gap-2">
                The Kapoor Family{" "}
                <Check size={12} className="text-[#00F0FF]" />
              </p>
              <p className="text-xs text-gray-400">Traveling - Europe</p>
            </div>
            <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#00F0FF]/20 text-[#00F0FF] flex items-center gap-1">
              Paid
            </div>
          </motion.div>
        </div>
      </div>

      <FadeInOnScroll className="order-1 md:order-2">
        <div className="space-y-6 reveal-text">
          <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#A259FF]">
            <Users size={32} />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">
            Intelligent <span className="text-[#A259FF]">Client CRM</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed tracking-wide">
            Track every lead from initial inquiry to their flight home. Know
            exactly who needs a follow-up, who just opened your proposal, and who
            is ready to pay. Your entire travel pipeline, perfectly organized.
          </p>
        </div>
      </FadeInOnScroll>
      </div>
    </SpotlightCard>
  );
}

/* ─── Feature 5: Drag & Drop Builder ─── */
function BuilderFeature() {
  return (
    <SpotlightCard className="p-6 md:p-10 rounded-[40px] border border-white/5 bg-white/[0.02]">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      <FadeInOnScroll>
        <div className="space-y-6 reveal-text">
          <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#ff3366]">
            <Map size={32} />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">
            Smart Drag & Drop <span className="text-[#ff3366]">Builder</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed tracking-wide">
            Stop copying and pasting from Wikipedia! Access a global database of
            flights, hotels, and activities. Just drag them into the timeline, and
            we&apos;ll automatically generate the descriptions, photos, and
            policies.
          </p>
        </div>
      </FadeInOnScroll>

      <div className="relative h-[500px] w-full glass-card rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-bl from-[#ff3366]/10 to-transparent group">
        <div className="absolute inset-y-12 w-full max-w-sm flex shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="w-1 bg-white/10 h-full absolute left-8 rounded-full"></div>

          <div className="w-full space-y-6 px-4">
            {/* Day 1 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative ml-10 glass-card p-4 rounded-2xl backdrop-blur-md transform transition-transform group-hover:translate-x-2 bg-white/5 border-white/10"
            >
              <div className="absolute w-4 h-4 rounded-full bg-[#ff3366] -left-[35px] top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(255,51,102,0.8)]">
                <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              <p className="text-[#ff3366] text-xs font-bold tracking-wider uppercase mb-1">
                Day 1
              </p>
              <h4 className="text-white font-semibold text-lg">
                Arrive in Paris
              </h4>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                Check into Hotel Le Meurice. Private transfer from CDG
                configured automatically.
              </p>
            </motion.div>

            {/* Dragging block */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative ml-10 glass-card p-4 rounded-2xl backdrop-blur-xl shadow-2xl z-10 cursor-grab active:cursor-grabbing border-[#ff3366]/30 bg-gradient-to-r from-[#ff3366]/20 to-transparent"
              style={{ rotate: "-2deg" }}
            >
              <div className="absolute w-4 h-4 rounded-full bg-[#111] border border-white/20 -left-[35px] top-1/2 -translate-y-1/2 opacity-50"></div>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[#ff3366] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  <Compass size={12} /> Dragging from Library...
                </p>
              </div>
              <h4 className="text-white font-bold">Louvre Museum VIP Pass</h4>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white border border-white/10">
                  Activity
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366]/30">
                  Skip-The-Line
                </span>
              </div>
            </motion.div>

            {/* Day 2 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative ml-10 glass-card p-4 rounded-2xl backdrop-blur-md bg-white/5 border-white/10 opacity-70"
            >
              <div className="absolute w-4 h-4 rounded-full bg-[#00F0FF] -left-[35px] top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(0,240,255,0.8)]">
                <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              <p className="text-[#00F0FF] text-[10px] font-bold tracking-wider uppercase mb-1">
                Day 2
              </p>
              <h4 className="text-white font-semibold">
                Eiffel Tower Dinner
              </h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Reserved seating at Le Jules Verne. Dietary reqs sent.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      </div>
    </SpotlightCard>
  );
}

/* ─── Main Features Showcase ─── */
export function FeaturesShowcase() {
  return (
    <>
      {/* Features 1 & 2 */}
      <section className="relative z-30 bg-transparent py-16 md:py-32 px-6 md:px-24 mt-10 md:mt-20">
        <div className="max-w-7xl mx-auto space-y-20 md:space-y-32">
          <MagicLinkFeature />
          <WhatsAppFeature />
        </div>
      </section>

      {/* Feature 3: Add-ons */}
      <section className="relative z-30 bg-transparent py-16 px-6 md:px-24">
        <div className="max-w-7xl mx-auto space-y-20 md:space-y-32">
          <AddonsFeature />
        </div>
      </section>

      {/* Feature 4: CRM */}
      <section className="relative z-30 bg-transparent py-16 px-6 md:px-24">
        <div className="max-w-7xl mx-auto space-y-20 md:space-y-32">
          <CRMFeature />
        </div>
      </section>

      {/* Feature 5: Builder */}
      <section className="relative z-30 bg-transparent py-16 px-6 md:px-24">
        <div className="max-w-7xl mx-auto space-y-20 md:space-y-32">
          <BuilderFeature />
        </div>
      </section>
    </>
  );
}
