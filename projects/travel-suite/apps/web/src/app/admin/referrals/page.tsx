"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useReferralData, useApplyReferralCode } from "@/lib/queries/referrals";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { Badge } from "@/components/ui/badge";
import {
    Copy, Gift, Users, HeartHandshake, CheckCircle2,
    AlertCircle, RefreshCw, IndianRupee, TrendingUp,
    Calendar, Percent, ArrowRight, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { GuidedTour } from '@/components/tour/GuidedTour';

const COMMISSION_RATE = 10;
const COMMISSION_MONTHS = 12;

const HOW_IT_WORKS = [
    {
        icon: Copy,
        title: "Share your link",
        description: "Send your unique referral link to other tour operators in your network.",
    },
    {
        icon: Users,
        title: "They sign up & subscribe",
        description: "When they create an account and choose a paid plan, you start earning.",
    },
    {
        icon: IndianRupee,
        title: "Earn 10% every month",
        description: "Get 10% of their subscription fee credited to you — every month for 12 months.",
    },
];

export default function ReferralsPage() {
    const { data, isLoading, error, refetch } = useReferralData();
    const { mutate: applyCode, isPending } = useApplyReferralCode();
    const [inviteCode, setInviteCode] = useState("");

    const handleCopy = () => {
        if (!data?.referralCode) return;
        const link = `${window.location.origin}/auth?ref=${data.referralCode}`;
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
    };

    const handleApplyCode = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;
        applyCode({ referralCode: inviteCode.trim() });
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-secondary dark:text-white">Error loading referral data</h2>
                <p className="text-text-secondary mb-6">{error.message}</p>
                <GlassButton variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4" /> Try Again
                </GlassButton>
            </div>
        );
    }

    const { referralCode, stats, referrals } = data || {};
    const convertedCount = stats?.converted || 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <GuidedTour />
            {/* Hero */}
            <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-4">
                    <Gift className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">
                        Referral Program
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-secondary dark:text-white">
                    Earn 10% of every referral&apos;s subscription
                </h1>
                <p className="mt-3 text-lg text-text-secondary max-w-2xl mx-auto">
                    Refer tour operators you know. When they subscribe, you earn <span className="font-semibold text-primary">10% of their plan fee every month for 12 months</span>.
                </p>
            </motion.div>

            {/* Stats cards */}
            <div data-tour="referral-stats" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-secondary dark:text-white">
                        {isLoading ? "—" : stats?.total || 0}
                    </p>
                    <p className="text-xs font-medium text-text-secondary mt-1">Total Referrals</p>
                </GlassCard>

                <GlassCard className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-3xl font-bold text-secondary dark:text-white">
                        {isLoading ? "—" : convertedCount}
                    </p>
                    <p className="text-xs font-medium text-text-secondary mt-1">Paying Subscribers</p>
                </GlassCard>

                <GlassCard className="text-center border-primary/20">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-amber-500" />
                    </div>
                    <p className="text-3xl font-bold text-secondary dark:text-white">
                        {isLoading ? "—" : `${COMMISSION_RATE}%`}
                    </p>
                    <p className="text-xs font-medium text-text-secondary mt-1">Commission Rate</p>
                </GlassCard>
            </div>

            {/* Share link card */}
            <GlassCard data-tour="referral-code">
                <div className="flex items-center gap-3 mb-4">
                    <HeartHandshake className="w-5 h-5 text-primary" />
                    <div>
                        <h2 className="text-lg font-bold text-secondary dark:text-white">Your Referral Link</h2>
                        <p className="text-sm text-text-secondary">Share this link with other tour operators to start earning.</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="h-12 bg-gray-100 dark:bg-white/10 rounded-xl animate-pulse" />
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-secondary dark:text-white overflow-x-auto whitespace-nowrap">
                            {typeof window !== "undefined" ? window.location.origin : "https://tripbuilt.com"}/auth?ref={referralCode}
                        </div>
                        <GlassButton variant="primary" onClick={handleCopy} className="shrink-0">
                            <Copy className="w-4 h-4" />
                            Copy Link
                        </GlassButton>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
                    <p className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-text-muted" />
                        Have a referral code from someone?
                    </p>
                    <form onSubmit={handleApplyCode} className="flex items-center gap-3">
                        <GlassInput
                            placeholder="Enter their invite code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className="max-w-xs"
                        />
                        <GlassButton type="submit" variant="outline" disabled={isPending || !inviteCode.trim()}>
                            Apply Code
                        </GlassButton>
                    </form>
                </div>
            </GlassCard>

            {/* How it works */}
            <div data-tour="referral-how-it-works">
                <h2 className="text-lg font-bold text-secondary dark:text-white mb-4 flex items-center gap-2">
                    <Percent className="w-5 h-5 text-primary" />
                    How it works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {HOW_IT_WORKS.map((step, idx) => (
                        <GlassCard key={step.title} className="relative">
                            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {idx + 1}
                            </div>
                            <step.icon className="w-8 h-8 text-primary mb-3" />
                            <h3 className="font-bold text-secondary dark:text-white mb-1">{step.title}</h3>
                            <p className="text-sm text-text-secondary">{step.description}</p>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Commission details card */}
            <GlassCard className="border-primary/20 bg-gradient-to-br from-white to-primary/5 dark:from-slate-900 dark:to-primary/5">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shrink-0">
                        <IndianRupee className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-secondary dark:text-white">Commission Structure</h3>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4">
                                <p className="text-2xl font-bold text-primary">{COMMISSION_RATE}%</p>
                                <p className="text-xs text-text-secondary mt-1">Of each payment</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4">
                                <p className="text-2xl font-bold text-secondary dark:text-white flex items-center gap-1">
                                    <Calendar className="w-5 h-5 text-text-muted" />
                                    {COMMISSION_MONTHS}
                                </p>
                                <p className="text-xs text-text-secondary mt-1">Months per referral</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4">
                                <p className="text-2xl font-bold text-secondary dark:text-white">UPI / Bank</p>
                                <p className="text-xs text-text-secondary mt-1">Monthly payout</p>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-text-secondary">
                            Example: If you refer someone who subscribes to Pro (₹4,999/mo), you earn <span className="font-semibold text-secondary dark:text-white">₹499/mo for 12 months = ₹5,988 total</span>.
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Referrals list */}
            <GlassCard>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-secondary dark:text-white">Your Referrals</h2>
                        <p className="text-sm text-text-secondary">Track operators you&apos;ve referred and their subscription status.</p>
                    </div>
                    {convertedCount > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30">
                            {convertedCount} earning
                        </Badge>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-white/5 rounded-xl animate-pulse" />)}
                    </div>
                ) : !referrals?.length ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-text-muted" />
                        </div>
                        <h3 className="font-semibold text-secondary dark:text-white">No referrals yet</h3>
                        <p className="text-sm text-text-secondary max-w-sm mx-auto mt-1">
                            Share your referral link to start earning 10% commission on every referral&apos;s subscription.
                        </p>
                        <GlassButton variant="primary" onClick={handleCopy} className="mt-4">
                            <Copy className="w-4 h-4" />
                            Copy Referral Link
                        </GlassButton>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/10 border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden">
                        {referrals.map((ref) => (
                            <div key={ref.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-secondary dark:text-white">
                                        {ref.referred_org?.name || "Pending Organization Setup"}
                                    </span>
                                    <span className="text-xs text-text-secondary">
                                        Joined {format(new Date(ref.created_at), "MMM d, yyyy")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {ref.status === "converted" ? (
                                        <>
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                Earning {COMMISSION_RATE}%
                                            </span>
                                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                                            </Badge>
                                        </>
                                    ) : (
                                        <Badge variant="secondary" className="bg-gray-100 dark:bg-white/10 text-text-secondary border-gray-200 dark:border-white/10">
                                            <ArrowRight className="w-3 h-3 mr-1" /> Awaiting Subscription
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
