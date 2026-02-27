"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  IndianRupee,
} from "lucide-react";
import { PricingCard } from "@/components/billing/PricingCard";
import { TIERS, type TierName } from "@/lib/billing/tiers";

const TIER_ORDER: TierName[] = ["free", "pro", "business", "enterprise"];

const FAQ_ITEMS = [
  {
    q: "Can I pay via UPI?",
    a: "Yes! We accept all major UPI apps — PhonePe, Google Pay, and Paytm. Simply choose UPI at checkout and scan or enter your UPI ID. Payments reflect instantly.",
  },
  {
    q: "Is GST included in the listed price?",
    a: "The listed prices are exclusive of GST. An 18% GST will be added at checkout as per Indian tax regulations. You will receive a proper GST invoice (with our GSTIN) for your records and input tax credit claim.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There is no lock-in period. You can cancel your subscription from Account Settings at any time. Your plan remains active until the end of the current billing cycle.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. We offer a 7-day money-back guarantee for new subscriptions. If you are not satisfied within 7 days of your first payment, contact support and we will process a full refund — no questions asked.",
  },
  {
    q: "Is my data safe? Where is it stored?",
    a: "Your data is stored exclusively on servers located in Mumbai, India (AWS ap-south-1 region). All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are fully compliant with Indian data protection norms and never share your data with third parties.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#00d084]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="border-t border-white/10 px-5 py-4">
              <p className="text-sm text-white/60 leading-relaxed">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PAYMENT_METHODS = [
  { label: "PhonePe", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { label: "Google Pay", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { label: "Paytm", color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  { label: "Credit Card", color: "text-slate-300 border-slate-500/30 bg-slate-500/10" },
  { label: "UPI", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { label: "Net Banking", color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
];

export default function BillingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  // In a real app this would come from user session/context
  const currentTier: TierName = "free";

  function handleSelectTier(tierName: TierName) {
    if (tierName === "enterprise") {
      window.open("mailto:sales@travelsuite.in?subject=Enterprise Plan Enquiry", "_blank");
      return;
    }
    // In a real app, trigger checkout / upgrade flow
    alert(`Starting upgrade to ${TIERS[tierName].displayName}...`);
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00d084]/30 bg-[#00d084]/10 px-4 py-1.5">
            <IndianRupee className="h-4 w-4 text-[#00d084]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#00d084]">
              Pricing Plans
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-white/50">
            Built for Indian tour operators. Pay in ₹. Cancel anytime.
          </p>

          {/* Social proof */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0a1628] bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white"
                  style={{ zIndex: 5 - i }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">4.9</span>
            </div>
            <p className="text-sm text-white/40">
              Trusted by{" "}
              <span className="font-bold text-white/70">200+ Indian tour operators</span>
            </p>
          </div>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          className="mb-10 flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <span
            className={`text-sm font-semibold transition-colors ${billing === "monthly" ? "text-white" : "text-white/40"}`}
          >
            Monthly
          </span>
          <button
            className="relative h-7 w-14 rounded-full bg-white/10 border border-white/20 transition-colors hover:bg-white/15"
            onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
            aria-label="Toggle billing period"
          >
            <motion.div
              className="absolute top-1 h-5 w-5 rounded-full bg-[#00d084] shadow-lg shadow-emerald-500/40"
              animate={{ x: billing === "annual" ? 30 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold transition-colors ${billing === "annual" ? "text-white" : "text-white/40"}`}
            >
              Annual
            </span>
            <span className="rounded-full bg-[#00d084]/20 border border-[#00d084]/30 px-2 py-0.5 text-xs font-bold text-[#00d084]">
              Save 20%
            </span>
          </div>
        </motion.div>

        {/* Pricing cards grid */}
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {TIER_ORDER.map((tierName) => (
            <PricingCard
              key={tierName}
              tier={TIERS[tierName]}
              billing={billing}
              currentTier={currentTier}
              onSelect={() => handleSelectTier(tierName)}
            />
          ))}
        </motion.div>

        {/* Payment methods */}
        <motion.div
          className="mt-12 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 text-white/30">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">Secure payments via</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method.label}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${method.color}`}
              >
                {method.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* GST note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/30">
            All prices exclude GST (18%). GST invoice with GSTIN provided for every payment.
          </p>
        </div>

        {/* FAQ */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="mt-2 text-sm text-white/40">Everything you need to know before signing up.</p>
          </div>
          <div className="mx-auto max-w-2xl space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-16 rounded-2xl border border-[#00d084]/20 bg-[#00d084]/5 p-8 text-center backdrop-blur-xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Users className="mx-auto mb-4 h-10 w-10 text-[#00d084] opacity-60" />
          <h3 className="text-xl font-bold text-white">Need a custom plan for your agency?</h3>
          <p className="mt-2 text-sm text-white/50">
            For franchises, large agencies, or OTA integrations — we offer fully custom pricing.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:sales@travelsuite.in?subject=Custom Plan Enquiry"
              className="inline-flex items-center gap-2 rounded-xl bg-[#00d084] px-6 py-3 text-sm font-bold text-[#0a1628] shadow-lg shadow-[#00d084]/25 transition-all hover:brightness-110"
            >
              Talk to Sales
            </a>
            <a
              href="https://wa.me/919999999999?text=Hi%2C%20I%20want%20to%20learn%20about%20TravelSuite%20pricing"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
            >
              WhatsApp Us
            </a>
          </div>
        </motion.div>

        {/* Feature comparison hint */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/25">
            <CheckCircle2 className="mr-1 inline h-3 w-3 text-[#00d084]/50" />
            All plans include 99.9% uptime SLA, Mumbai-based servers, and free data migration.
          </p>
        </div>
      </div>
    </main>
  );
}
