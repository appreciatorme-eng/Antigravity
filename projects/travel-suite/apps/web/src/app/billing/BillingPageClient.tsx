"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Loader2,
  MessageSquare,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { PricingCard } from "@/components/billing/PricingCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassModal } from "@/components/glass/GlassModal";
import { ErrorSection } from "@/components/ui/ErrorSection";
import { useToast } from "@/components/ui/toast";
import { TIERS, type TierName } from "@/lib/billing/tiers";

type BillingPlanId = "free" | "pro_monthly" | "pro_annual" | "enterprise";

interface BillingSnapshot {
  current_plan_id: BillingPlanId;
  current_tier: "free" | "pro" | "enterprise";
  subscription: {
    plan_id: string;
    billing_cycle: string | null;
    current_period_end: string | null;
    status: string;
  } | null;
  usage: {
    clients_used: number;
    proposals_used: number;
    team_members_used: number;
  };
  limits: {
    clients: number | null;
    proposals: number | null;
    team_members: number | null;
    ai_requests: number | null;
  };
  checkout_enabled: boolean;
  can_self_serve_checkout: boolean;
  support_whatsapp_number: string | null;
  organization: {
    name: string | null;
  };
  viewer: {
    full_name: string | null;
    email: string | null;
  };
}

const TIER_ORDER: TierName[] = ["free", "pro", "business", "enterprise"];

const FAQ_ITEMS = [
  {
    q: "Can I pay via UPI?",
    a: "Yes. Travel Suite uses Razorpay when self-serve checkout is enabled, including UPI, cards, and net banking.",
  },
  {
    q: "What happens if self-serve billing is not live for my workspace?",
    a: "You can still submit an upgrade request from this page. We will record it, notify the team, and follow up directly instead of pretending checkout already works.",
  },
  {
    q: "Is GST included in the plan price?",
    a: "Plan prices are exclusive of GST. Applicable GST is calculated at checkout or on the final invoice.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Active paid plans can be cancelled from admin billing, and access continues until the current period ends.",
  },
];

function formatLimit(limit: number | null) {
  return limit === null ? "Unlimited" : limit.toLocaleString("en-IN");
}

function normalizeSupportPhone(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <GlassCard padding="none" className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#00d084]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="border-t border-white/10 px-5 py-4">
              <p className="text-sm leading-relaxed text-white/65">{a}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </GlassCard>
  );
}

export function BillingPageClient() {
  const { toast } = useToast();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [data, setData] = useState<BillingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<TierName | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  async function loadBilling() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/subscription", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to load billing");
      }

      const snapshot = payload.data as BillingSnapshot;
      setData(snapshot);
      setContactName((value) => value || snapshot.viewer.full_name || "");
      setContactEmail((value) => value || snapshot.viewer.email || "");
      setContactMessage((value) =>
        value ||
        `We want to upgrade ${snapshot.organization.name || "our workspace"} to unlock stronger proposal conversion and operations support.`
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load billing";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBilling();
  }, []);

  const currentTier = (data?.current_tier || "free") as TierName;
  const selectedPlan = selectedTier ? TIERS[selectedTier] : null;
  const selectedPlanId: BillingPlanId | null =
    selectedTier === "pro"
      ? billing === "annual"
        ? "pro_annual"
        : "pro_monthly"
      : selectedTier === "enterprise"
        ? "enterprise"
        : null;
  const usesContactSales =
    selectedTier === "business" ||
    selectedTier === "enterprise" ||
    !data?.can_self_serve_checkout;
  const supportPhone = normalizeSupportPhone(data?.support_whatsapp_number || null);
  const supportHref = supportPhone
    ? `https://wa.me/${supportPhone}?text=${encodeURIComponent(
        "Hi, I want to discuss a Travel Suite plan upgrade."
      )}`
    : null;

  const usageItems = useMemo(
    () =>
      data
        ? [
            ["Clients", data.usage.clients_used, data.limits.clients],
            ["Monthly proposals", data.usage.proposals_used, data.limits.proposals],
            ["Team members", data.usage.team_members_used, data.limits.team_members],
          ]
        : [],
    [data]
  );

  async function handleSelectTier(tierName: TierName) {
    if (!data) return;
    if (tierName === currentTier) return;
    if (tierName === "free" && currentTier !== "free") {
      toast({
        title: "Manage downgrades in admin billing",
        description: "Use Admin Billing to cancel or step down a paid plan.",
        variant: "info",
      });
      return;
    }

    setSelectedTier(tierName);
    setModalOpen(true);
  }

  async function handlePrimaryAction() {
    if (!selectedTier || !data) return;
    setSubmitting(true);

    try {
      if (!usesContactSales && selectedPlanId) {
        const response = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: selectedPlanId,
            billing_cycle: billing,
          }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to start checkout");
        }

        toast({
          title: "Upgrade started",
          description: "Your self-serve plan upgrade has been created.",
          variant: "success",
        });
      } else {
        const response = await fetch("/api/billing/contact-sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_tier: selectedTier,
            billing_preference: selectedTier === "pro" ? billing : undefined,
            name: contactName,
            email: contactEmail,
            message: contactMessage,
          }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to submit request");
        }

        toast({
          title: "Upgrade request submitted",
          description: "We logged your request and will follow up directly.",
          variant: "success",
        });
      }

      setModalOpen(false);
      setSelectedTier(null);
      await loadBilling();
    } catch (submitError) {
      toast({
        title: "Billing action failed",
        description:
          submitError instanceof Error ? submitError.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-[linear-gradient(135deg,#0a1628_0%,#0d1f3c_50%,#0a1628_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <GlassCard key={index} className="h-80 animate-pulse bg-white/8" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-[100dvh] bg-[linear-gradient(135deg,#0a1628_0%,#0d1f3c_50%,#0a1628_100%)]">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <GlassCard className="border-rose-400/20 bg-white/10 text-center">
            <h1 className="text-2xl font-bold text-white">Billing could not be loaded</h1>
            <p className="mt-3 text-sm text-white/65">{error || "Unknown error"}</p>
            <GlassButton className="mt-6" onClick={() => void loadBilling()}>
              Try again
            </GlassButton>
          </GlassCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[linear-gradient(135deg,#0a1628_0%,#0d1f3c_50%,#0a1628_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00d084]/30 bg-[#00d084]/10 px-4 py-1.5">
            <IndianRupee className="h-4 w-4 text-[#00d084]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#00d084]">
              Billing & Pricing
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Pricing that matches the workflow you already use
          </h1>
          <p className="mt-4 text-lg text-white/55">
            Your workspace is on <span className="font-semibold text-white">{TIERS[currentTier].displayName}</span>.
            Upgrade through secure checkout when available, or submit a real request when concierge help is still required.
          </p>
        </motion.div>

        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <GlassCard className="border-white/10 bg-white/8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#00d084]">
                  Current plan
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  {TIERS[currentTier].displayName}
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  {data.subscription?.current_period_end
                    ? `Next billing checkpoint: ${new Date(data.subscription.current_period_end).toLocaleDateString("en-IN")}`
                    : "No active paid subscription yet."}
                </p>
              </div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                {data.can_self_serve_checkout ? "Self-serve ready" : "Concierge upgrades"}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border-white/10 bg-white/8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#00d084]">
              Plan usage
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {usageItems.map(([label, used, limit]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {used} / {formatLimit(limit as number | null)}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <motion.div
          className="mb-10 flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className={`text-sm font-semibold ${billing === "monthly" ? "text-white" : "text-white/40"}`}>
            Monthly
          </span>
          <button
            type="button"
            className="relative h-7 w-14 rounded-full border border-white/20 bg-white/10"
            onClick={() => setBilling((value) => (value === "monthly" ? "annual" : "monthly"))}
            aria-label="Toggle billing period"
          >
            <motion.div
              className="absolute top-1 h-5 w-5 rounded-full bg-[#00d084]"
              animate={{ x: billing === "annual" ? 30 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-semibold ${billing === "annual" ? "text-white" : "text-white/40"}`}>
            Annual
          </span>
        </motion.div>

        <ErrorSection label="Billing plan widget">
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {TIER_ORDER.map((tierName) => (
              <PricingCard
                key={tierName}
                tier={TIERS[tierName]}
                billing={billing}
                currentTier={currentTier}
                onSelect={() => void handleSelectTier(tierName)}
              />
            ))}
          </motion.div>
        </ErrorSection>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-white/35">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">
              {data.checkout_enabled
                ? "Secure checkout available for eligible upgrades"
                : "Checkout is not configured for this workspace yet"}
            </span>
          </div>
        </div>

        <motion.div className="mt-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">Operator FAQ</span>
            </div>
          </div>
          <div className="mx-auto max-w-2xl space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-16 rounded-3xl border border-[#00d084]/20 bg-[#00d084]/5 p-8 text-center backdrop-blur-xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Users className="mx-auto mb-4 h-10 w-10 text-[#00d084] opacity-70" />
          <h3 className="text-xl font-bold text-white">Need a custom rollout?</h3>
          <p className="mt-2 text-sm text-white/55">
            Enterprise rollouts, white-label deployments, and API-first workflows are handled by a real follow-up process, not a dead CTA.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <GlassButton onClick={() => void handleSelectTier("enterprise")}>
              Request enterprise plan
            </GlassButton>
            {supportHref ? (
              <GlassButton
                variant="ghost"
                onClick={() => window.open(supportHref, "_blank", "noopener,noreferrer")}
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp sales
              </GlassButton>
            ) : null}
          </div>
        </motion.div>
      </div>

      <GlassModal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={selectedPlan ? `${selectedPlan.displayName} plan` : "Upgrade plan"}
        description={
          usesContactSales
            ? "This route creates a real upgrade request and follow-up instead of pretending checkout is already live."
            : "You can start a secure self-serve upgrade for this workspace."
        }
        size="lg"
      >
        {selectedPlan ? (
          <div className="space-y-6">
            <GlassCard className="border-slate-200/70 bg-white/80">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0d1f3c]/60">
                Selected plan
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">{selectedPlan.displayName}</h3>
                <span className="text-sm text-slate-500">
                  {selectedTier === "pro" ? `${billing} billing` : "custom rollout"}
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {selectedPlan.features.slice(0, 5).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            {usesContactSales ? (
              <div className="space-y-4">
                <GlassCard className="border-amber-200/70 bg-amber-50/80">
                  <p className="text-sm font-semibold text-amber-900">
                    {data.can_self_serve_checkout
                      ? "This plan is handled with concierge setup today."
                      : "Self-serve checkout is not configured for this workspace yet."}
                  </p>
                  <p className="mt-2 text-sm text-amber-800/80">
                    Submit the request below and we will create a real follow-up instead of dropping you into a fake checkout.
                  </p>
                </GlassCard>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Name
                    <input
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00d084]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Email
                    <input
                      value={contactEmail}
                      onChange={(event) => setContactEmail(event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00d084]"
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  What do you need from this plan?
                  <textarea
                    value={contactMessage}
                    onChange={(event) => setContactMessage(event.target.value)}
                    rows={5}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00d084]"
                  />
                </label>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <GlassButton
                variant="ghost"
                className="sm:flex-1"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </GlassButton>
              <GlassButton className="sm:flex-[1.4]" onClick={() => void handlePrimaryAction()} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : usesContactSales ? (
                  "Submit upgrade request"
                ) : (
                  "Start secure upgrade"
                )}
              </GlassButton>
            </div>
          </div>
        ) : null}
      </GlassModal>
    </main>
  );
}
